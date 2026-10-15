BEGIN;

UPDATE shiftpatch.users AS u
SET auth_user_id = a.id
FROM auth.users AS a
WHERE lower(a.email) = u.email;

DO $$
BEGIN
  IF (SELECT count(*) FROM shiftpatch.users) <> 5
     OR EXISTS (SELECT 1 FROM shiftpatch.users WHERE auth_user_id IS NULL)
     OR EXISTS (
       SELECT 1 FROM shiftpatch.users GROUP BY auth_user_id HAVING count(*) > 1
     )
     OR EXISTS (
       SELECT 1
       FROM shiftpatch.users AS u
       JOIN auth.users AS a ON a.id = u.auth_user_id
       WHERE lower(a.email) IS DISTINCT FROM u.email
     ) THEN
    RAISE EXCEPTION 'fixture auth mapping is incomplete';
  END IF;
END $$;

COMMIT;
