-- Transactional inbox. Express owns authorization; no direct Data API access.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS event_key TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_status TEXT NOT NULL DEFAULT 'skipped';
ALTER TABLE public.notifications ALTER COLUMN push_status SET DEFAULT 'pending';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_updated_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS push_error TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_once ON public.notifications(user_id,event_key);
CREATE INDEX IF NOT EXISTS notifications_user_feed ON public.notifications(user_id,id DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread ON public.notifications(user_id) WHERE leido=false;
CREATE INDEX IF NOT EXISTS notifications_push_pending ON public.notifications(id) WHERE push_status IN ('pending','sending');
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.notifications_id_seq FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_order_operation() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE recipient RECORD; title TEXT; body TEXT; ref TEXT; destination TEXT;
BEGIN
 IF TG_OP='UPDATE' AND NEW.estado IS NOT DISTINCT FROM OLD.estado THEN RETURN NEW; END IF;
 ref:='DC-'||LPAD(NEW.id::text,GREATEST(6,LENGTH(NEW.id::text)),'0');
 FOR recipient IN
   SELECT id,rol FROM public.users WHERE id=NEW.user_id
   OR id=(SELECT user_id FROM public.stores WHERE id=NEW.store_id) OR rol='admin'
 LOOP
   destination:=CASE recipient.rol WHEN 'admin' THEN 'admin_order' WHEN 'comercio' THEN 'merchant_order' ELSE 'buyer_order' END;
   title:=CASE NEW.estado WHEN 'confirmado' THEN 'Reserva confirmada' WHEN 'en_preparacion' THEN 'Pedido en preparación'
     WHEN 'listo' THEN 'Pedido listo para recoger' WHEN 'recogido' THEN 'Entrega confirmada'
     WHEN 'cancelado' THEN 'Pedido cancelado' ELSE 'Pedido actualizado' END;
   body:=ref||CASE NEW.estado WHEN 'confirmado' THEN ': reserva registrada. Pago pendiente en el comercio.'
     WHEN 'en_preparacion' THEN ': el comercio comenzó la preparación.'
     WHEN 'listo' THEN ': puedes pasar al comercio a recogerlo.'
     WHEN 'recogido' THEN ': el comercio confirmó la entrega.'
     WHEN 'cancelado' THEN ': se canceló la reserva y se liberó el stock.' ELSE ': consulta el detalle.' END;
   INSERT INTO public.notifications(user_id,tipo,titulo,mensaje,data,event_key)
     VALUES(recipient.id,'pedido',title,body,jsonb_build_object('type',destination,'orderId',NEW.id,'status',NEW.estado),
       'order:'||NEW.id||':'||NEW.estado) ON CONFLICT(user_id,event_key) DO NOTHING;
   IF NEW.estado='recogido' AND NEW.metodo_pago='efectivo' THEN
     INSERT INTO public.notifications(user_id,tipo,titulo,mensaje,data,event_key)
       VALUES(recipient.id,'pago','Cobro en efectivo confirmado',ref||': $'||NEW.total||' MXN registrados por el comercio al entregar. No es un cargo en línea.',
         jsonb_build_object('type',destination,'orderId',NEW.id,'status',NEW.estado),
         'cash:'||NEW.id) ON CONFLICT(user_id,event_key) DO NOTHING;
   END IF;
 END LOOP;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS order_operation_notifications ON public.orders;
CREATE TRIGGER order_operation_notifications AFTER INSERT OR UPDATE OF estado ON public.orders
 FOR EACH ROW EXECUTE FUNCTION public.notify_order_operation();

CREATE OR REPLACE FUNCTION public.notify_business_operation() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE recipient RECORD; title TEXT; body TEXT; payload JSONB; key TEXT;
BEGIN
 IF TG_TABLE_NAME='business_visit_requests' THEN
   IF TG_OP='UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
   title:=CASE WHEN TG_OP='INSERT' THEN 'Nueva solicitud de visita' ELSE 'Visita actualizada' END;
   body:=NEW.business_name||': '||CASE NEW.status WHEN 'pending' THEN 'por contactar' WHEN 'contacted' THEN 'contactado' WHEN 'scheduled' THEN 'visita agendada' ELSE 'solicitud cerrada' END||'.';
   payload:=jsonb_build_object('type','business_visit','visitId',NEW.id);
   key:='visit:'||NEW.id||':'||NEW.status||':'||NEW.updated_at::text;
   FOR recipient IN SELECT id FROM public.users WHERE rol='admin' LOOP
     INSERT INTO public.notifications(user_id,tipo,titulo,mensaje,data,event_key)
       VALUES(recipient.id,'visita',title,body,payload,key) ON CONFLICT(user_id,event_key) DO NOTHING;
   END LOOP;
 ELSE
   IF TG_OP='UPDATE' AND NEW.activo IS NOT DISTINCT FROM OLD.activo THEN RETURN NEW; END IF;
   title:=CASE WHEN TG_OP='INSERT' THEN 'Comercio registrado' WHEN NEW.activo THEN 'Comercio activado' ELSE 'Comercio desactivado' END;
   FOR recipient IN SELECT id,rol FROM public.users WHERE rol='admin' OR id=NEW.user_id LOOP
     INSERT INTO public.notifications(user_id,tipo,titulo,mensaje,data,event_key)
       VALUES(recipient.id,'comercio',title,NEW.nombre_comercio||'.',
         jsonb_build_object('type',CASE recipient.rol WHEN 'admin' THEN 'admin_store' ELSE 'store_status' END,'storeId',NEW.id),
         'store:'||NEW.id||':'||NEW.activo::text||':'||txid_current()::text) ON CONFLICT(user_id,event_key) DO NOTHING;
   END LOOP;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS visit_operation_notifications ON public.business_visit_requests;
CREATE TRIGGER visit_operation_notifications AFTER INSERT OR UPDATE OF status ON public.business_visit_requests
 FOR EACH ROW EXECUTE FUNCTION public.notify_business_operation();
DROP TRIGGER IF EXISTS store_operation_notifications ON public.stores;
CREATE TRIGGER store_operation_notifications AFTER INSERT OR UPDATE OF activo ON public.stores
 FOR EACH ROW EXECUTE FUNCTION public.notify_business_operation();
REVOKE ALL ON FUNCTION public.notify_order_operation(), public.notify_business_operation() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.notify_review_operation() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE recipient RECORD; title TEXT; key TEXT; destination TEXT;
BEGIN
 IF TG_OP='INSERT' THEN
   FOR recipient IN SELECT id,rol FROM public.users WHERE rol='admin' OR id=(SELECT user_id FROM public.stores WHERE id=NEW.store_id) LOOP
     destination:=CASE recipient.rol WHEN 'admin' THEN 'admin_review' ELSE 'merchant_review' END;
     INSERT INTO public.notifications(user_id,tipo,titulo,mensaje,data,event_key)
       VALUES(recipient.id,'resena','Nueva reseña','Hay una nueva opinión sobre una recogida.',
         jsonb_build_object('type',destination,'orderId',NEW.order_id,'reviewId',NEW.id),'review:'||NEW.id) ON CONFLICT(user_id,event_key) DO NOTHING;
   END LOOP;
 ELSIF NEW.respuesta_admin IS DISTINCT FROM OLD.respuesta_admin OR NEW.respuesta_comercio IS DISTINCT FROM OLD.respuesta_comercio OR NEW.visible IS DISTINCT FROM OLD.visible THEN
   title:=CASE WHEN NEW.visible IS DISTINCT FROM OLD.visible THEN 'Visibilidad de reseña actualizada' ELSE 'Respondieron a tu reseña' END;
   key:='review-update:'||NEW.id||':'||MD5(COALESCE(NEW.respuesta_admin,'')||COALESCE(NEW.respuesta_comercio,'')||COALESCE(NEW.visible::text,''));
   INSERT INTO public.notifications(user_id,tipo,titulo,mensaje,data,event_key)
     VALUES(NEW.user_id,'resena',title,'Consulta tu reseña para ver los cambios.',jsonb_build_object('type','buyer_review','orderId',NEW.order_id),key)
     ON CONFLICT(user_id,event_key) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS review_operation_notifications ON public.reviews;
CREATE TRIGGER review_operation_notifications AFTER INSERT OR UPDATE OF respuesta_admin,respuesta_comercio,visible ON public.reviews
 FOR EACH ROW EXECUTE FUNCTION public.notify_review_operation();
REVOKE ALL ON FUNCTION public.notify_review_operation() FROM PUBLIC,anon,authenticated;
