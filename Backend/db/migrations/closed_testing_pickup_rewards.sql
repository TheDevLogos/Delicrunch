ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS visible_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS notifications_due ON public.notifications(visible_at) WHERE push_status='pending';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS precio_original NUMERIC(10,2);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS categoria_snapshot TEXT;
CREATE TABLE IF NOT EXISTS public.merchant_reward_claims(
 id BIGSERIAL PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 reward_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','fulfilled','rejected')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id,reward_id));
ALTER TABLE public.merchant_reward_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.merchant_reward_claims FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.merchant_reward_claims_id_seq FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.schedule_pickup_inbox() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE minutes integer;
BEGIN
 IF NEW.estado IN ('recogido','cancelado','reembolsado') THEN
   DELETE FROM public.notifications WHERE user_id=NEW.user_id AND data->>'type'='pickup_reminder'
     AND data->>'orderId'=NEW.id::text AND visible_at>NOW();
   RETURN NEW;
 END IF;
 IF TG_OP='INSERT' AND NEW.fecha_recogida_programada IS NOT NULL THEN
   FOREACH minutes IN ARRAY ARRAY[30,15,5] LOOP
     IF NEW.fecha_recogida_programada-make_interval(mins=>minutes)>NOW() THEN
       INSERT INTO public.notifications(user_id,tipo,titulo,mensaje,data,event_key,visible_at,push_status)
       VALUES(NEW.user_id,'recordatorio','Tu recogida se acerca','Faltan '||minutes||' minutos para tu horario de recogida. Consulta el estado de tu reserva.',
         jsonb_build_object('type','pickup_reminder','orderId',NEW.id,'minutes',minutes),
         'reminder:'||NEW.id||':'||minutes,NEW.fecha_recogida_programada-make_interval(mins=>minutes),'local_only')
       ON CONFLICT(user_id,event_key) DO NOTHING;
     END IF;
   END LOOP;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pickup_inbox_schedule ON public.orders;
CREATE TRIGGER pickup_inbox_schedule AFTER INSERT OR UPDATE OF estado ON public.orders FOR EACH ROW EXECUTE FUNCTION public.schedule_pickup_inbox();
REVOKE ALL ON FUNCTION public.schedule_pickup_inbox() FROM PUBLIC,anon,authenticated;
