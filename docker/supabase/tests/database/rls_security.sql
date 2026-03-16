BEGIN;

SELECT plan(10);

-- 1. Helper Function Existence
SELECT has_function('auth', 'current_user_id', 'Helper auth.current_user_id() should exist');

-- 2. Anonymous Access Tests (Should be blocked)
SET LOCAL ROLE anon;
SELECT throws_ok(
    'SELECT * FROM clients',
    'permission denied for table clients',
    'Anonymous users should NOT be able to read clients'
);

-- 3. Authenticated Access Tests
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO '00000000-0000-0000-0000-000000000001'; -- Mock User 1
SET LOCAL "request.jwt.claim.role" TO 'authenticated';

-- Verify View Access
SELECT results_eq(
    'SELECT count(*) >= 0 FROM clients',
    ARRAY[true],
    'Authenticated staff SHOULD be able to query clients'
);

-- Verify Insert Contract (Own Data)
-- We switch to a transaction that rolls back so we don't pollute DB
PREPARE insert_intake AS INSERT INTO intakes (client_id, user_id, status) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'draft');
SELECT lives_ok('EXECUTE insert_intake', 'Staff can insert intake for themselves');

-- Verify Insert Violation (Other Data)
PREPARE insert_other_intake AS INSERT INTO intakes (client_id, user_id, status) VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000009', 'draft');
SELECT throws_ok(
    'EXECUTE insert_other_intake',
    42501, -- insufficient_privilege (RLS check failure)
    NULL,
    'Staff CANNOT insert intake for another user'
);

SELECT * FROM finish();
ROLLBACK;
