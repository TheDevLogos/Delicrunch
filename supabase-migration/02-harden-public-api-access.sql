-- Delicrunch production: remove permissive API policies and prevent them returning
-- through Supabase's default privileges. Backend access remains through postgres
-- and service_role; the Expo client calls the backend API, not the public DB API.

BEGIN;

DO $harden$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles::text[] && ARRAY['public','anon','authenticated']::text[]
      AND (
        lower(btrim(coalesce(qual, ''))) IN ('true', '(true)')
        OR lower(btrim(coalesce(with_check, ''))) IN ('true', '(true)')
      )
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END
$harden$;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

COMMIT;
