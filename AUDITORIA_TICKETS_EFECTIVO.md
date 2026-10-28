# Delicrunch: preparación para tickets y pago en efectivo

## Cambios preparados

- La reserva crea un pedido en la API, descuenta el inventario y recibe del servidor un código de recogida aleatorio. La aplicación no fabrica códigos ni indica que recibió un pago.
- El comercio ve el número del pedido, solicita el código al cliente y lo verifica en la API para marcar la entrega. El código no aparece en sus listados.
- Los pedidos nuevos usan `metodo_pago = 'efectivo'` y comisión de plataforma cero. Los pedidos anteriores se conservan como historial y no se pueden modificar desde este flujo.
- `/api/payments` responde 410, incluidos clientes antiguos y notificaciones de Mercado Pago. Se retiró el código activo de cobro, tarjetas y configuración del proveedor.
- Los paneles muestran el valor de los tickets entregados. Este valor **no confirma que el comercio cobró el efectivo**.
- Las respuestas de tiendas ya no envían columnas de credenciales de pago; el detalle público tampoco envía el correo del propietario.
- El navegador usa la API de Render para esta función. Se retiró un cliente Supabase directo del navegador que no se utilizaba.

## Verificaciones realizadas

- Exportación web de Expo: correcta.
- Revisión de sintaxis de los controladores y rutas modificados: correcta.
- No se creó un pedido real ni se validó una entrega real porque la conexión Supabase disponible no tiene acceso al proyecto de Delicrunch.
- La vista previa de Vercel publicó el HTML con respuesta 200. La variable `EXPO_PUBLIC_API_URL` solo existe en producción; por ello la vista previa requiere una API de pruebas antes de probar reservas sin tocar datos reales.
- La revisión de dependencias pasó de 43 a 18 avisos en la web y de 9 a 1 en la API mediante actualizaciones compatibles. Quedan 2 avisos altos en la web y 1 alto en la API; sus soluciones propuestas cambian versiones mayores y requieren una actualización separada.

## Antes de publicar

1. Dar acceso al proyecto Supabase correcto para revisar el esquema real, las políticas RLS y los avisos de seguridad. Confirmar las columnas `orders.metodo_pago`, `orders.codigo_recogida`, `products.sales_count` y `profiles`.
2. En un entorno de prueba, crear una reserva con un comprador; comprobar inventario, código privado, cancelación, verificación de entrega y cifras de los paneles.
3. Publicar primero la API de Render y después la web de Vercel. El endpoint antiguo de pagos devolverá 410 tras publicar la API.
4. Revocar las credenciales de Mercado Pago en Render y en la cuenta del proveedor cuando se confirme que no hay operaciones pendientes. Conservar los registros históricos necesarios; no borrar tablas ni pagos pasados sin una revisión de retención.
5. Quitar de Vercel las variables `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY` cuando la web nueva esté publicada, porque ya no las usa.
6. Definir el plazo de caducidad de una reserva sin recoger para devolver automáticamente el inventario. El código actual permite cancelar manualmente, pero no caduca automáticamente.

## Riesgos pendientes

- Las políticas RLS de Supabase no se pudieron comprobar ni corregir desde esta conexión. La retirada del cliente directo no sustituye esas políticas.
- No se comprobó el servicio activo de Render ni se eliminaron sus secretos, porque no hay acceso a esa cuenta desde esta sesión.
- El repositorio conserva migraciones y esquemas históricos de pagos. No deben volver a ejecutarse al configurar una base nueva.
- La tabla `stores` inspeccionada no tiene un estado de aprobación independiente: el panel antiguo de comercios pendientes necesita una definición de negocio antes de reactivarse. La activación existente usa `activo`.
