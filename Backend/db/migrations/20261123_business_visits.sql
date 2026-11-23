CREATE TABLE IF NOT EXISTS business_visit_requests (
 id BIGSERIAL PRIMARY KEY,
 business_name VARCHAR(120) NOT NULL,
 contact_name VARCHAR(100) NOT NULL,
 phone VARCHAR(30) NOT NULL,
 email VARCHAR(160) NOT NULL DEFAULT '',
 address VARCHAR(250) NOT NULL,
 city VARCHAR(80) NOT NULL,
 preferred_time VARCHAR(160) NOT NULL DEFAULT '',
 notes VARCHAR(1000) NOT NULL DEFAULT '',
 status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','scheduled','closed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS business_visit_requests_status_created ON business_visit_requests(status, created_at DESC);
-- Requests contain contact details; only the authenticated backend may access them.
ALTER TABLE business_visit_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.business_visit_requests FROM anon, authenticated, PUBLIC;
REVOKE ALL ON SEQUENCE public.business_visit_requests_id_seq FROM anon, authenticated, PUBLIC;
