-- Entrega push por dispositivo. El backend accede por PostgreSQL; la Data API
-- de Supabase no expone tokens ni el historial de entregas.
CREATE TABLE IF NOT EXISTS public.push_devices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL UNIQUE,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('android', 'ios')),
  disabled_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_devices_user_active ON public.push_devices(user_id) WHERE disabled_at IS NULL;

CREATE TABLE IF NOT EXISTS public.push_messages (
  id BIGSERIAL PRIMARY KEY,
  kind VARCHAR(30) NOT NULL CHECK (kind IN ('order', 'campaign')),
  audience VARCHAR(20) NOT NULL CHECK (audience IN ('comprador', 'comercio')),
  title VARCHAR(120) NOT NULL,
  body TEXT NOT NULL,
  order_id BIGINT REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_messages_order_once ON public.push_messages(order_id) WHERE kind = 'order';

CREATE TABLE IF NOT EXISTS public.push_deliveries (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES public.push_messages(id) ON DELETE CASCADE,
  device_id BIGINT NOT NULL REFERENCES public.push_devices(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  ticket_id TEXT,
  error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_push_deliveries_pending_receipts ON public.push_deliveries(status) WHERE status = 'ticket_sent';

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_devices, public.push_messages, public.push_deliveries FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.push_devices_id_seq, public.push_messages_id_seq, public.push_deliveries_id_seq FROM anon, authenticated;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notas TEXT;
