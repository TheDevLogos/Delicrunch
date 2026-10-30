# Notificaciones Android de Delicrunch

La app registra un token de Expo para cada dispositivo Android después de que un cliente o comercio inicia sesión y acepta las notificaciones. El backend conserva esos tokens en `push_devices` y registra cada envío y recibo en `push_messages` y `push_deliveries`.

## Preparación de infraestructura

1. Aplicar `Backend/db/migrations/push_notifications_20261030.sql` en el proyecto Supabase de producción.
2. Registrar `com.delicrunch.app` en Firebase y usar `Frontend/google-services.json` del proyecto `delicrunch-95227`.
3. Habilitar Firebase Cloud Messaging API v1 y asociar en Expo/EAS una cuenta de servicio de Google Cloud limitada al permiso **Firebase Cloud Messaging API Admin**. Guardar la clave solo en Expo, nunca en Git.
4. Crear un nuevo AAB con `Frontend/eas.json` perfil `production` y `versionCode` 4, y publicarlo en Google Play. Las instalaciones anteriores no contienen el receptor ni el permiso de notificaciones de esta versión.
5. Desplegar el backend de Render y el frontend de Vercel desde el mismo cambio.

## Funcionamiento

- Al reservar un producto, el pedido se confirma con pago en efectivo y se crea un aviso para el dueño del comercio. El error de entrega push no cancela la reserva.
- Al pulsar el aviso, la app consulta el pedido con el JWT del comercio y abre una ficha con referencia pública, producto, cantidad, hora, cliente, petición especial y total. El código privado de recogida no viaja en el push ni en la ficha del comercio.
- El perfil de administrador permite enviar campañas a clientes o comercios y consultar intentos, aceptación por el proveedor y errores. **Aceptado por el proveedor** no significa necesariamente visto o leído en el teléfono.
- El sonido usa el canal Android `orders` con sonido predeterminado y prioridad alta. El usuario puede silenciar ese canal desde los ajustes de Android.

Las alertas nativas requieren un AAB nuevo y permiso del usuario en cada dispositivo. La versión web de Vercel usa el video de login y la interfaz, pero no registra tokens de Expo.
