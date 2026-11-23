ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_user_request_once ON public.orders(user_id,client_request_id) WHERE client_request_id IS NOT NULL;
