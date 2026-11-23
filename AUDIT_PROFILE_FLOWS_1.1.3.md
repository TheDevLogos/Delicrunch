# Delicrunch 1.1.3 — Auditoría de flujos y avisos

Fecha: 23 de noviembre de 2026. Base: main d5d1994, posterior al AAB 1.1.2 código 8.

## Contratos y operaciones corregidos

| Flujo | Endpoint | Resultado |
|---|---|---|
| Reserva comprador | POST /orders | Stock bloqueado, cupón validado y código privado. requestId reutiliza la misma reserva ante reintentos; compatible con clientes anteriores. |
| Pedidos propios | GET /orders/myorders | Estados en minúsculas, imagen, cantidad, horario y fechas reales/programadas. |
| Detalle comprador/Admin | GET /orders/:id | Autorización por dueño/Admin y campos de producto/comercio congruentes con la pantalla. |
| Detalle comercio | GET /orders/:id/merchant | Exclusivo del propietario; sin código privado. |
| Preparar/listo/cancelar/entregar | PATCH /orders/:id | Transiciones protegidas; cancelar devuelve stock y cupón; código exigido al entregar; respuesta sin código privado. Nueva pantalla exige confirmar cobro en efectivo. |
| Productos | POST/PUT /products | Guarda horarios y producto_listo enviados por el formulario; valida horario y disponibilidad. |
| Editar producto pausado/agotado | GET /products/:id/manage | Consulta autenticada con verificación de propiedad, independiente del catálogo público. |
| Campana | GET /notifications | Solo avisos del usuario autenticado, contador sin leer y paginación. |
| Lectura | PATCH /notifications/:id/read, /read-all | Propiedad verificada; lectura masiva acotada al último aviso visto. |
| Visitas | POST/GET/PATCH /business-visits | Admin recibe alta y cambios de seguimiento. Datos de contacto permanecen fuera del push. |
| Reseñas | /reviews | Comercio/Admin reciben reseña; comprador recibe respuesta/moderación. Comparación segura de bigint y calificaciones enteras. |
| Panel Admin | /admin/products, /admin/stores, /admin/metrics/* | Catálogo administrativo completo; ingresos solo recogidos; agregados sin multiplicación de joins; ciudad desconocida explícita. |
| Contraseña | PUT /auth/change-password | Endpoint implementado, contraseña actual verificada; Admin/Google conserva acceso por Google. |

Estados activos: confirmado → en_preparacion → listo → recogido; cancelado terminal. Se conservan atajos de recogida ya compatibles con clientes anteriores, siempre verificando el código. Pendiente/pagado/reembolsado históricos no se reinterpretan como cobros nuevos.

## Avisos por destinatario

- Comprador: reserva, preparación, listo, cancelación, entrega/cobro confirmado y respuestas a reseñas; campañas dirigidas a compradores.
- Comercio: pedidos de su tienda, cambios, cancelaciones, entrega/cobro, activación/desactivación y reseñas; campañas dirigidas a comercios.
- Admin: operaciones de pedidos, cobros confirmados por comercio, visitas y su seguimiento, altas/estado de comercios y reseñas.

La campana aparece en la cabecera común de los tres perfiles. Buzón persistente, paginación, contador, lectura individual/masiva y apertura del asunto. Se consulta cada 15 segundos mientras la app está activa; también al volver y al recibir push. Sin conexión se muestra el fallo conservando el último estado conocido.

Los triggers crean el aviso dentro de la transacción del evento: un rollback no emite un aviso. Clave de evento única evita duplicar avisos de una misma transición. Una cola persistente separa la entrega Expo de la operación: 4 intentos, arrendamiento para recuperación, desactivación de dispositivos no registrados, procesamiento mientras el servidor está activo. Push es entrega de mejor esfuerzo y puede repetirse ante una interrupción tras aceptar el proveedor; el buzón permanece deduplicado.

Ningún push incluye código de recogida ni datos de contacto de la visita. El aviso de efectivo significa confirmación del comercio al entregar, no un cobro de pasarela. Los pagos en línea siguen deshabilitados; órdenes antiguas de pasarela permanecen de solo lectura.

## Otros hallazgos corregidos

- Eliminadas reseñas de demostración que se mostraban cuando fallaba la API.
- El panel Admin consulta sus endpoints, no el catálogo público ni las reseñas propias.
- La simulación Admin no puede modificar una tienda arbitraria elegida automáticamente.
- Referencia pública DC-000000 uniforme; código privado separado.
- Eliminada llamada inexistente de favoritos desde Home; usa el almacenamiento ya empleado por Favoritos.
- Tiempo máximo HTTP de 15 segundos.

## Verificaciones

- `node --test Backend/tests/*.test.js`: 18 pruebas de contratos HTTP, autenticación/propiedad de buzón, transiciones, código, cancelación/stock, repetición/XP, reintentos de reserva y entrega push simulada.
- Exportación de producción Android con Metro: 1121 módulos; sin errores.
- Transacción de prueba en Supabase: compradores, comercio y Admin temporales; ciclo confirmado/preparación/listo/recogido, ausencia de cobro anticipado, deduplicación, no exposición del código, visitas, estado de comercio, reseñas/respuestas. Todo revertido; cero cuentas de prueba restantes.
- Tabla notifications con RLS y sin permisos SELECT para anon/authenticated; acceso mediante Express autenticado.

## Límites y comprobaciones físicas pendientes

Esto valida código, contratos y base de datos; no equivale a una prueba visual manual de todas las pantallas en tres teléfonos. Falta confirmar el permiso de notificaciones y recepción en dispositivos reales con los tres roles. En la consulta de esta auditoría había cuatro dispositivos de compradores y ninguno de Comercio/Admin. No se enviaron campañas ni pedidos ficticios a cuentas reales.

El servicio Render actual es free: la cola solo trabaja mientras el proceso está activo. El buzón se conserva en base de datos durante suspensión; para push continuo con app cerrada se requiere un proceso siempre activo. No se cambió plan ni se generó un gasto.

El centro de reseñas Admin muestra cuántos registros se han cargado y permite cargar páginas adicionales; el contador de pendientes procede del total filtrado del servidor. La elección de comercio ya se activa automáticamente por el flujo vigente; esta auditoría no introduce un requisito de aprobación nuevo. Favoritos continúa local al dispositivo según implementación actual.

## Entrega

Migraciones aplicadas: operational_inbox_by_profile, operational_store_event_identity, order_request_idempotency. Cambios compatibles con AAB 1.1.2. Los nuevos botones/campanas requieren instalar 1.1.3. Firma y secretos de carga conservados sin modificaciones.
