-- Delicrunch production: remove unconditional policies that grant access to
-- public, anon, or authenticated on public-schema tables.
--
-- This does not alter grants on existing tables. Supabase's default ACLs for
-- the internal supabase_admin role are platform-managed; ALTER DEFAULT
-- PRIVILEGES for that role fails with permission denied in this project.
-- Review the Data API auto-exposure setting separately before changing those
-- future grants. Current anon/authenticated table grants are zero; backend
-- access remains through PostgreSQL and service_role.

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

COMMIT;
