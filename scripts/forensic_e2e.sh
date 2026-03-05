#!/bin/bash
# R&D Program: Distributed Clinical Node - Forensic E2E Certification (Docker Edition)
# Purpose: Execute the 3-module Deterministic Proof Protocol (Mutation -> Hash -> Destroy -> Replay -> Match).

set -e

CONTAINER_NAME=${CONTAINER_NAME:-"intake-db"}
DB_USER=${DB_USER:-"postgres"}
STATE_HASH_SCRIPT="./scripts/forensic_state_hash.sh"
PROOF_LOG="forensic_e2e_$(date +%Y%m%d_%H%M%S).log"

exec > >(tee -a $PROOF_LOG) 2>&1

echo "🧪 Starting Forensic E2E Certification (V3.2)..."

# 1. Setup Phase
echo "🏗️  Step 1: Initializing clean environment..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -c "
SET session_replication_role = 'replica';
DELETE FROM case_event_log; 
DELETE FROM clinical_case_attachments; 
DELETE FROM intake_assessments;
DELETE FROM intakes; 
DELETE FROM clinical_cases; 
DELETE FROM clients;
SET session_replication_role = 'origin';
" > /dev/null

# 2. Module 1 & 2: Origin Mutation & Hardened Sync
echo "✍️  Step 2: Simulating Origin Mutation (Module 1 -> Module 2)..."
CASE_ID=$(uuidgen)
EVENT_ID=$(uuidgen)
USER_ID='00000000-0000-0000-0000-000000000000'
DEVICE_ID=$(uuidgen)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Canonical Payload (Module 1 Logic)
PAYLOAD=$(jq -cn --arg name "Forensic Test Case" --arg code "F10.1" \
  '{ identity: { clientName: $name }, clinical: { primaryDiagnosisCode: $code } }' | jq -S -c .)

echo "   - Sending Sync Package: Case $CASE_ID, Event $EVENT_ID"
RESULT=$(docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -t -c "SELECT master_clinical_sync_v3('$CASE_ID', '$EVENT_ID', 0, '$DEVICE_ID', '$USER_ID', '$TIMESTAMP', '$PAYLOAD');")

if echo "$RESULT" | grep -q "success"; then
    echo "   ✅ Sync accepted by Hardened Engine."
else
    echo "   ❌ Sync FAILED: $RESULT"
    exit 1
fi

# 3. Proof A: Source Fingerprint
echo "📸 Step 3: Generating Source Fingerprint (Node A)..."
rm -f forensic_state_*.json
bash $STATE_HASH_SCRIPT
HASH_A=$(cat forensic_state.sha256)
mv forensic_state_*.json snapshot_a.json
echo "   - Hash A: $HASH_A"

# 4. Module 3: Nuclear Destroy & Replay
echo "🧨 Step 4: Simulating Nuclear Destruction (Wiping Node A Domain)..."
# We keep the event log but wipe the domain tables.
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -c "
SET session_replication_role = 'replica';
DELETE FROM clinical_case_attachments; 
DELETE FROM intake_assessments;
DELETE FROM intakes; 
DELETE FROM clinical_cases; 
DELETE FROM clients;
SET session_replication_role = 'origin';
" > /dev/null

echo "🔄 Step 5: Executing Forensic Replay (Module 3)..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -c "
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN SELECT * FROM case_event_log ORDER BY new_version ASC LOOP
        -- Recreate Aggregate Root first (Bootstrap)
        IF r.base_version = 0 THEN
            INSERT INTO clinical_cases (id, version, updated_by, device_id, updated_at, created_at)
            VALUES (r.case_id, r.new_version, r.user_id, r.device_id, r.created_at, r.created_at);
        END IF;

        -- Apply Payload Snapshot using authoritative timestamp
        PERFORM apply_domain_delta_v3(r.case_id, r.payload, r.created_at);
        
        -- Update Aggregate
        UPDATE clinical_cases SET version = r.new_version, updated_at = r.created_at WHERE id = r.case_id;
    END LOOP;
END \$\$;" > /dev/null

# 5. Proof B: Replica Fingerprint
echo "📸 Step 6: Generating Replica Fingerprint (Node B)..."
rm -f forensic_state_*.json
bash $STATE_HASH_SCRIPT
HASH_B=$(cat forensic_state.sha256)
mv forensic_state_*.json snapshot_b.json
echo "   - Hash B: $HASH_B"

# 6. Final Certification
echo "⚖️  Step 7: Comparing Proofs..."
if [ "$HASH_A" == "$HASH_B" ]; then
    echo "🏆 CERTIFICATION SUCCESS: Mathematical Determinism Proven."
    echo "   Convergence Hash: $HASH_A"
    exit 0
else
    echo "❌ CERTIFICATION FAILED: Entropy Detected."
    echo "--- BIT-LEVEL DIFF ---"
    diff snapshot_a.json snapshot_b.json || true
    exit 1
fi
