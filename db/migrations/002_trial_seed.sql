-- Trial fixtures only. Re-running resets these IDs to the required baseline.
-- Run only against a dedicated assessment database, never production.
BEGIN;
INSERT INTO shiftpatch.agencies (id, name) VALUES
 ('agency-a', 'Sunrise Health Staffing'),
 ('agency-b', 'Metro Care Partners')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
INSERT INTO shiftpatch.users (id, name, email, password_hash, role, agency_id) VALUES
 ('agency-a', 'Sunrise Health Staffing', 'admin@sunrisehealth.example', extensions.crypt('Trial2026!', extensions.gen_salt('bf', 12)), 'agency', 'agency-a'),
 ('agency-b', 'Metro Care Partners', 'admin@metrocare.example', extensions.crypt('Trial2026!', extensions.gen_salt('bf', 12)), 'agency', 'agency-b'),
 ('nurse-1', 'Maria Lopez', 'maria.lopez@example.com', extensions.crypt('Trial2026!', extensions.gen_salt('bf', 12)), 'nurse', NULL),
 ('nurse-2', 'James Cook', 'james.cook@example.com', extensions.crypt('Trial2026!', extensions.gen_salt('bf', 12)), 'nurse', NULL),
 ('admin-1', 'Alex Kim', 'alex.kim@example.com', extensions.crypt('Trial2026!', extensions.gen_salt('bf', 12)), 'admin', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email,
 password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, agency_id = EXCLUDED.agency_id;
INSERT INTO shiftpatch.nurse_credentials (nurse_id, expires_on) VALUES
 ('nurse-1', '2027-01-01'), ('nurse-2', '2026-06-01')
ON CONFLICT (nurse_id) DO UPDATE SET expires_on = EXCLUDED.expires_on;
INSERT INTO shiftpatch.shifts (id, agency_id, role, date, start_time, end_time, status, claimed_by) VALUES
 ('shift-1', 'agency-a', 'RN', '2026-10-02', '19:00', '07:00', 'open', NULL),
 ('shift-2', 'agency-a', 'LPN', '2026-10-03', '07:00', '19:00', 'filled', 'nurse-1'),
 ('shift-3', 'agency-b', 'RN', '2026-10-04', '19:00', '07:00', 'open', NULL)
ON CONFLICT (id) DO UPDATE SET agency_id = EXCLUDED.agency_id, role = EXCLUDED.role,
 date = EXCLUDED.date, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time,
 status = EXCLUDED.status, claimed_by = EXCLUDED.claimed_by;
COMMIT;
