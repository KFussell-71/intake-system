
-- Seed Data for Antelope Valley Resources (Food, Jobs, Housing)
INSERT INTO community_resources (name, category, description, address, phone, website, is_verified, source, tags)
VALUES 
-- Food
('Grace Resources Center', 'Food', 'Groceries on Tue/Wed/Thu. Hot meals Tue/Thu/Fri/Sun.', '45134 Sierra Hwy, Lancaster, CA 93534', '(661) 940-5272', 'https://www.graceresources.org', TRUE, 'web_scrape', ARRAY['pantry', 'hot_meals']),
('Antelope Valley Wellness Community', 'Food', 'Food distribution 3rd Wednesday of the month.', '335-B East Ave K6, Lancaster, CA 93535', '(661) 471-4860', NULL, TRUE, 'web_scrape', ARRAY['pantry']),
('SAVES (South Antelope Valley Emergency Services)', 'Food', 'Emergency food boxes Mon-Thu by appointment.', '1002 E Avenue Q-12, Palmdale, CA', '(661) 267-5191', 'https://www.cityofpalmdale.org', TRUE, 'web_scrape', ARRAY['pantry', 'emergency']),
('Desert Vineyard', 'Food', 'Market Style food distribution every Wednesday 11am-2pm.', '1011 East Ave I, Lancaster, CA 93535', '(661) 945-2777', NULL, TRUE, 'web_scrape', ARRAY['pantry']),

-- Employment / Job Training
('America''s Job Center of California (AJCC) - Lancaster', 'Employment', 'No-cost job training, resume prep, and interview skills.', '1420 W. Avenue I, Lancaster, CA 93534', NULL, 'https://www.avworklocal.com', TRUE, 'web_scrape', ARRAY['training', 'jobs', 'resume']),
('Antelope Valley Adult Education', 'Education', 'Career Technical Education (CTE) in health, tech, and office admin.', '45110 3rd St. E., Lancaster, CA 93535', NULL, 'https://www.avadulted.org', TRUE, 'web_scrape', ARRAY['education', 'training']),
('Paving the Way Foundation', 'Employment', 'Job training and employment services for youth and adults.', 'Antelope Valley', NULL, NULL, TRUE, 'manual', ARRAY['training', 'jobs']),
('Antelope Valley College (AVC)', 'Education', 'Workforce development and professional certificate programs.', '3041 West Ave K, Lancaster, CA 93536', NULL, 'https://www.avc.edu', TRUE, 'web_scrape', ARRAY['education', 'college']),

-- Housing / Shelter
('Valley Oasis', 'Housing', '60-day emergency shelter and housing services for domestic violence victims and homeless.', '1669 W. Ave J, Suite 202, Lancaster, CA 93534', '(661) 945-6736', 'https://www.valleyoasis.org', TRUE, 'web_scrape', ARRAY['shelter', 'domestic_violence']),
('High Desert MACC', 'Housing', '93-bed shelter and coordinated care.', '45150 60th Street West, Lancaster, CA 93536', '(800) 548-6047', NULL, TRUE, 'web_scrape', ARRAY['shelter']),
('Lancaster Community Shelter', 'Housing', 'Shelter for singles, couples, and families.', '44611 Yucca Ave, Lancaster, CA 93534', '(661) 945-7524', NULL, TRUE, 'web_scrape', ARRAY['shelter', 'families']),
('The Salvation Army Antelope Valley', 'Housing', 'Transitional living centers and emergency shelter.', '44517 Sierra Highway, Lancaster, CA 93534', '(661) 948-3418', 'https://www.salvationarmy.org', TRUE, 'web_scrape', ARRAY['shelter', 'transitional']);
