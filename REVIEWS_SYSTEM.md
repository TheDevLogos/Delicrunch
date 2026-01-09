# Sistema de Reseñas - Delicrunch

## Resumen de la Implementación

Se ha implementado un sistema completo de reseñas con las siguientes características:

### 🎯 Características Principales

1. **Reseñas de Usuarios (Compradores)**
   - Pueden dejar reseñas con estrellas (1-5) y comentarios
   - Solo pueden reseñar productos que hayan comprado
   - Una reseña por pedido/producto
   - Pueden ver y editar sus propias reseñas

2. **Reseñas vinculadas a Productos y Tiendas**
   - Cada reseña está asociada a un producto específico (`product_id`)
   - Las reseñas también están vinculadas a la tienda (`store_id`)
   - Se evita el problema de que reseñas aparezcan en el perfil del comprador en lugar del producto

3. **Panel de Comercios**
   - Los comercios pueden ver todas las reseñas de su tienda
   - Estadísticas con promedio de calificación y distribución de estrellas
   - Acceso desde Dashboard > Acciones Rápidas > "Reseñas"

4. **Panel de Administración**
   - Ver TODAS las reseñas del sistema
   - Filtrar por estado (todas, visibles, ocultas)
   - Responder a reseñas
   - Ocultar/mostrar reseñas inapropiadas
   - Eliminar reseñas

5. **Actualización Automática de Calificaciones**
   - `calificacion_promedio` y `total_reviews` se actualizan automáticamente en:
     - Tabla `products` (promedio del producto)
     - Tabla `stores` (promedio de la tienda)
   - Se recalculan al crear, actualizar, eliminar o cambiar visibilidad de reseñas

---

## 📡 API Endpoints

### Rutas Públicas
```
GET /api/reviews/product/:productId  - Ver reseñas de un producto
GET /api/reviews/store/:storeId      - Ver reseñas de una tienda
GET /api/reviews/store/:storeId/stats - Estadísticas de reseñas de tienda
```

### Rutas Privadas (Comprador)
```
POST /api/reviews                    - Crear nueva reseña
GET  /api/reviews/my                 - Ver mis reseñas
PUT  /api/reviews/:reviewId          - Editar mi reseña
DELETE /api/reviews/:reviewId        - Eliminar mi reseña
```

### Rutas Privadas (Comercio)
```
GET /api/reviews/mystore             - Ver reseñas de mi tienda
```

### Rutas Admin
```
GET   /api/reviews/admin/all                    - Ver todas las reseñas
POST  /api/reviews/admin/:reviewId/respond      - Responder a reseña
PATCH /api/reviews/admin/:reviewId/visibility   - Cambiar visibilidad
```

---

## 📱 Pantallas del Frontend

| Pantalla | Ubicación | Descripción |
|----------|-----------|-------------|
| `LeaveReviewScreen` | `/app/LeaveReviewScreen.js` | Crear reseña después de compra |
| `MyReviewsScreen` | `/app/MyReviewsScreen.js` | Ver mis reseñas (comprador) |
| `StoreReviewsScreen` | `/app/StoreReviewsScreen.js` | Ver reseñas de mi tienda (comercio) |
| `AdminReviewsScreen` | `/app/admin/AdminReviewsScreen.js` | Gestión completa (admin) |

---

## 🗄️ Estructura de Base de Datos

### Tabla `reviews`
```sql
- id (SERIAL PRIMARY KEY)
- user_id (FK → users)
- store_id (FK → stores)
- order_id (FK → orders)
- product_id (FK → products)          -- ¡IMPORTANTE! Vincula reseña al producto
- calificacion (INTEGER 1-5)
- comentario (TEXT)
- nombre_producto (VARCHAR)           -- Nombre guardado para referencia
- visible (BOOLEAN DEFAULT TRUE)      -- Control de visibilidad admin
- respuesta_admin (TEXT)              -- Respuesta del admin
- fecha_respuesta (TIMESTAMP)
- respondido_por_admin_id (FK → users)
- created_at, updated_at
```

### Campos añadidos a `products`
```sql
- calificacion_promedio (DECIMAL 3,2)
- total_reviews (INTEGER)
```

### Campos añadidos a `stores`
```sql
- calificacion_promedio (DECIMAL 3,2)
- total_reviews (INTEGER)
```

---

## 🔐 Permisos y Gobernanza

| Acción | Comprador | Comercio | Admin |
|--------|:---------:|:--------:|:-----:|
| Ver reseñas públicas | ✅ | ✅ | ✅ |
| Crear reseña (producto comprado) | ✅ | ❌ | ✅* |
| Editar reseña propia | ✅ | ❌ | ❌ |
| Eliminar reseña propia | ✅ | ❌ | ❌ |
| Ver reseñas de mi tienda | ❌ | ✅ | ✅ |
| Ver TODAS las reseñas | ❌ | ❌ | ✅ |
| Responder a reseñas | ❌ | ❌ | ✅ |
| Ocultar/mostrar reseñas | ❌ | ❌ | ✅ |
| Eliminar cualquier reseña | ❌ | ❌ | ✅ |

*El admin puede crear reseñas solo con fines de prueba

---

## 🔄 Flujo de Reseñas

```
1. Comprador compra pack → Orden creada
                              ↓
2. Comercio marca como "recogido" → Estado: Entregado
                              ↓
3. Comprador ve botón "Dejar Reseña" en MyOrders
                              ↓
4. Comprador completa reseña (estrellas + comentario)
                              ↓
5. Sistema guarda reseña con product_id correcto
                              ↓
6. Automáticamente:
   - Actualiza calificacion_promedio del producto
   - Actualiza calificacion_promedio de la tienda
                              ↓
7. Comercio ve la reseña en StoreReviewsScreen
8. Admin puede ver, responder o moderar desde AdminReviewsScreen
```

---

## 🧪 Credenciales de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admindeli@delicrunch.com | admin123 |
| Comprador | comprador@delicrunch.com | comprador123 |

---

## 📂 Archivos Modificados

### Backend
- `controllers/reviewController.js` - Lógica completa de reseñas (~500 líneas)
- `routes/reviewRoutes.js` - Rutas organizadas por rol
- `middleware/authMiddleware.js` - Soporte para Bearer tokens

### Frontend
- `app/MyReviewsScreen.js` - Actualizado endpoint API
- `app/StoreReviewsScreen.js` - **NUEVO** - Panel de comercio
- `app/admin/AdminReviewsScreen.js` - Actualizado endpoints
- `app/MyOrdersScreen.js` - Parámetros mejorados
- `app/MerchantDashboardScreen.js` - Botón "Reseñas" en acciones rápidas
- `navigation/AppNavigator.js` - Ruta StoreReviews agregada

---

## ✅ Estado Actual

- [x] Backend API completa y probada
- [x] Frontend pantallas implementadas
- [x] Navegación configurada
- [x] Permisos por rol implementados
- [x] Actualización automática de promedios **VERIFICADA**
- [x] Datos de prueba insertados (6 reseñas)
- [x] Respuesta de admin probada
- [x] Bug fix: Parámetro faltante en verificación de reseña existente

### Promedios Verificados:
| Entidad | Promedio | Total Reviews |
|---------|----------|---------------|
| Pack Tarde Chocolate | 5.00 ⭐ | 1 |
| Chilaquiles Divorciados (62) | 5.00 ⭐ | 1 |
| Pack Repostería Sorpresa | 4.00 ⭐ | 1 |
| Molletes Gratinados | 5.00 ⭐ | 1 |
| Chilaquiles Divorciados (118) | 4.00 ⭐ | 1 |
| Chilaquiles La Carreta (tienda) | 4.50 ⭐ | 2 |

---

## 🚀 Próximos Pasos Sugeridos

1. Agregar notificaciones push cuando se responde una reseña
2. Implementar fotos en las reseñas
3. Agregar reportes de reseñas inapropiadas por usuarios
4. Dashboard de métricas de reseñas para comercios
