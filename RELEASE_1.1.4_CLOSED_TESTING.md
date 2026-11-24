# Delicrunch 1.1.4 — mejoras para prueba cerrada Alpha

## Cambios

- Español conservado como único idioma.
- 56 packs adicionales, dos por cada una de las 28 categorías compartidas por la app. Comercio asociado a `alonsovl.logos@gmail.com`, conservando su rol Admin y acceso a la vista Comercio. Se identifican como PRUEBA, con fotografía ilustrativa y ubicación ilustrativa en Delicias. No se alteraron los comercios existentes ni se inventaron opiniones de clientes.
- Fotografías de categoría verificadas por HTTP; cuatro enlaces rotos sustituidos. Catálogo reproducible en `Backend/db/seeds/closed-testing-catalog.json`.
- Filtros de categorías, precio, distancia en km y ventana de recogida en Explorar. Aplicar filtros abre el mapa y solicita GPS. Distancias recalculadas con la ubicación vigente y claves de tienda normalizadas. Los pines agrupan todos los packs filtrados de cada comercio e indican su cantidad; no se excluyen categorías por el nombre del negocio. Vista general sin radio predeterminado para no ocultar el catálogo lejano.
- Un GPS denegado no se presenta como posición real. El centro inicial es una referencia; las ubicaciones ilustrativas del negocio de pruebas están identificadas.
- Selector de fecha/hora de recogida en intervalos de 15 minutos dentro de la ventana del producto, en zona America/Chihuahua. Próximos dos días; validación del servidor, fecha persistida y visible en ticket/detalle. Clientes anteriores reciben la primera hora válida cuando no envían selección.
- Recordatorios locales a 30/15/5 minutos si la reserva se hace con anticipación suficiente y hay permiso. Sincronización al reservar, abrir la app o recibir eventos; se eliminan recordatorios de pedidos cancelados/recogidos al sincronizar. Los avisos del buzón aparecen a su hora, no antes. No se envía un segundo push remoto para evitar duplicar el recordatorio local.
- Reseñas: aliases de calificación/comentario corregidos; respuestas visibles; producto conserva opiniones cuando se repone stock; opción de ver todos los comentarios. Perfil del negocio disponible aunque esté agotado; sin calificación ficticia de 4.5. Promedio de producto calculado de reseñas visibles.
- Clientes: XP y ahorro por cada unidad entregada; ahorro incluye cupón aplicado y precio/categoría originales quedan en snapshot de order_items. Sin crédito por cancelación o por repetir la entrega. Estado local de gamificación separado por cuenta y sincronizado con servidor.
- Comercios: XP calculada en servidor desde unidades y ventas efectivamente recogidas, con bonus por reseña; una reseña/orden no multiplica las ventas al agregarse. Reclamos persistentes, validación de nivel e idempotencia. Admin puede revisar y confirmar entrega/rechazo; aviso en campana. El registro de una solicitud no implica entrega automática de un premio externo.

## Verificación

- 25 pruebas de contratos HTTP, permisos, ciclo de órdenes, stock/cupón, XP por unidad, reintentos y recordatorios/recompensas.
- Exportación Android de producción con Metro.
- SQL de horarios ejecutado en Supabase; recordatorios futuros y cancelación probados en transacción revertida.
- Migración `closed_testing_pickup_rewards` aplicada: visibilidad temporal de avisos, snapshots de items, solicitudes de recompensas con RLS y privilegios públicos revocados.
- Firma de carga conservada: SHA1 5C:D0:06:03:7A:1B:73:24:AD:81:CA:B9:0F:C8:67:E3:38:AE:CD:CF.

## Consideraciones operativas

Android puede retrasar notificaciones por ahorro de batería. Si una cancelación llega mientras la app está completamente cerrada, un recordatorio local ya programado puede permanecer hasta la siguiente sincronización; al abrir el pedido se consulta su estado real. Nunca se anuncia en el recordatorio que la comida está lista ni se incluye su código privado. No se prometen alertas ya vencidas al reservar.

El mapa agrupa packs del mismo comercio en un único pin con la lista completa para evitar superponer decenas de marcadores en la misma coordenada. El catálogo de prueba usa una ubicación ilustrativa, no una dirección comercial verificable. Las fotos son de categoría y no fotografías del comercio de pruebas.

No se cambiaron planes de infraestructura, claves de firma, roles de usuarios ni pagos en línea. El backend conserva compatibilidad con versiones anteriores.

## Fuentes de imágenes

Imágenes de categorías de Unsplash, URLs completas en el catálogo. Sustituciones: hotdog de Peter Secan (photo-1515875976234-9d59c3ef288d); mariscos de AM FL (photo-1548587468-971ebe4c8c3b). Tamales: Renee Comet / National Cancer Institute, dominio público, https://commons.wikimedia.org/wiki/File:Tamales.jpg. Se conservaron imágenes existentes fuera del nuevo catálogo.
