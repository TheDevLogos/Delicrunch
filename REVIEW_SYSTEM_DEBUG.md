# Sistema de Reviews - Debug y Correcciones

## Problema Identificado

El formulario de reviews no se mostraba en `OrderDetailScreen.js` después de completar una compra por las siguientes razones:

### 1. **Mapeo inconsistente de estados**
- En `getMyOrders()`: mapea "recogido" → "Entregado"  
- En `getOrderById()`: devuelve "recogido" tal cual
- El frontend verificaba solo ['recogido', 'entregado']
- **Solución**: Agregar 'listo' a los estados válidos

### 2. **Verificación de reviews existentes**
- La comparación `r.order_id === orderId` fallaba por tipos diferentes (string vs number)
- **Solución**: Agregar comparación con `parseInt(orderId)`

### 3. **Logs de debugging**
- No había logs para entender el flujo
- **Solución**: Agregar console.log estratégicos

## Correcciones Implementadas

### OrderDetailScreen.js

#### 1. Mejorar fetchOrderDetails con logs
```javascript
const fetchOrderDetails = async () => {
  // ... código ...
  console.log('📦 Order Details:', {
    orderId,
    estado: orderData.estado,
    productId: orderData.product_id
  });
  
  // Verificación mejorada de reviews
  const orderReview = reviews.find(r => {
    const matchesOrderId = r.order_id === orderId || r.order_id === parseInt(orderId);
    console.log(`Checking review ${r.id}: order_id=${r.order_id}, matches=${matchesOrderId}`);
    return matchesOrderId;
  });
};
```

#### 2. Mejorar handleSubmitReview
```javascript
const handleSubmitReview = async () => {
  // ... validaciones ...
  console.log('📤 Submitting review:', {
    order_id: orderId,
    product_id: order?.product_id,
    calificacion: rating,
    comentario: comment.trim()
  });
  
  const response = await api.post('/reviews', { /* data */ });
  
  // Actualizar estado local inmediatamente
  setHasReview(true);
  setExistingReview({ 
    calificacion: rating, 
    comentario: comment.trim(),
    id: response.data.id,
    created_at: response.data.created_at
  });
  
  // Refrescar para sincronizar
  fetchOrderDetails();
};
```

#### 3. Mejorar lógica canReview
```javascript
const statusKey = order.estado?.toLowerCase() || 'pendiente';
const isDeliveredStatus = ['recogido', 'entregado', 'listo'].includes(statusKey);
const canReview = isDeliveredStatus && !hasReview;

console.log('🔍 Review Status:', {
  orderId,
  estado: order.estado,
  statusKey,
  isDeliveredStatus,
  hasReview,
  canReview,
  showExistingReview
});
```

### MyReviewsScreen.js

Ya está correctamente implementado con:
- `useFocusEffect` para recargar al enfocar
- Pull-to-refresh funcional
- Manejo correcto de estados vacíos

## Flujo Completo de Reviews

### 1. Usuario completa una compra
- Estado inicial: "pendiente"
- Tras confirmación: "confirmado"
- Comercio prepara: "en_preparacion"
- Listo para recoger: "listo"
- Usuario recoge: "recogido"

### 2. OrderDetailScreen detecta estado elegible
```javascript
// Estados que permiten review
const isDeliveredStatus = ['recogido', 'entregado', 'listo'].includes(statusKey);
```

### 3. Verifica si ya existe review
```javascript
const reviews = await api.get('/reviews/my');
const orderReview = reviews.find(r => 
  r.order_id === orderId || r.order_id === parseInt(orderId)
);
```

### 4. Muestra formulario si aplica
```javascript
const canReview = isDeliveredStatus && !hasReview;

{canReview && (
  <View style={styles.section}>
    <StarRating rating={rating} setRating={setRating} />
    <TextInput value={comment} onChangeText={setComment} />
    <Button onPress={handleSubmitReview} />
  </View>
)}
```

### 5. Usuario envía review
```javascript
await api.post('/reviews', {
  order_id: orderId,
  product_id: order?.product_id,
  calificacion: rating,
  comentario: comment
});
```

### 6. Backend valida y crea
```javascript
// reviewController.js
exports.createReview = async (req, res) => {
  // Valida que el pedido pertenezca al usuario
  // Verifica que no exista review previa
  // Crea la review
  // Actualiza promedios de producto y tienda
};
```

### 7. Frontend actualiza estado
```javascript
setHasReview(true);
setExistingReview(newReview);
fetchOrderDetails(); // Refrescar
```

### 8. MyReviewsScreen muestra la nueva review
- `useFocusEffect` detecta el cambio al volver a la pantalla
- Recarga automáticamente con `fetchReviews()`
- Muestra la nueva review en la lista

## Pruebas Realizadas

### Script de prueba automática
```bash
./test-review-flow.sh
```

Resultado:
```
✅ Token obtenido
✅ Pedido seleccionado: 20 (Estado: Entregado)
✅ Review creada exitosamente
✅ Total de reviews después: 3
```

### Verificación manual
1. ✅ Login como comprador
2. ✅ Ver lista de pedidos
3. ✅ Abrir pedido en estado "recogido"
4. ✅ Ver formulario de review
5. ✅ Enviar review con 5 estrellas
6. ✅ Ver confirmación
7. ✅ Navegar a "Mis Reseñas"
8. ✅ Ver nueva review en la lista

## Estados de Pedido y Permisos

| Estado | Puede Reseñar | Visible en Lista | Notas |
|--------|---------------|------------------|-------|
| pendiente | ❌ | ✅ | Esperando confirmación |
| confirmado | ❌ | ✅ | Comercio no ha preparado |
| en_preparacion | ❌ | ✅ | En proceso |
| listo | ✅ | ✅ | Puede reseñar anticipadamente |
| recogido | ✅ | ✅ (como "Entregado") | Estado final, debe reseñar |
| entregado | ✅ | ✅ | Alternativa a "recogido" |
| cancelado | ❌ | ✅ | No puede reseñar |

## Logs para Debugging

### En OrderDetailScreen
```javascript
console.log('📦 Order Details:', { orderId, estado, productId });
console.log('📝 My Reviews:', reviews.length, 'reviews found');
console.log('🔍 Review Status:', { canReview, hasReview, showExistingReview });
console.log('📤 Submitting review:', reviewData);
console.log('✅ Review submitted successfully:', response.data);
```

### En Backend (reviewController.js)
```javascript
console.log('Creating review:', { orderId, productId, rating });
console.log('Review created successfully:', newReview.rows[0]);
console.error('Error creating review:', error.message);
```

## Checklist de Validación

- [✅] Formulario aparece en pedidos "recogido"
- [✅] Formulario aparece en pedidos "entregado"  
- [✅] Formulario aparece en pedidos "listo"
- [✅] No aparece en pedidos "pendiente"
- [✅] No aparece en pedidos "confirmado"
- [✅] No aparece si ya existe review
- [✅] Muestra review existente correctamente
- [✅] Calificación requerida (mínimo 1 estrella)
- [✅] Comentario opcional (máx 500 caracteres)
- [✅] Loading state durante envío
- [✅] Mensaje de éxito tras enviar
- [✅] Estado local se actualiza inmediatamente
- [✅] MyReviewsScreen se refresca al enfocar
- [✅] Pull-to-refresh funciona
- [✅] Backend valida permisos correctamente
- [✅] Backend previene reviews duplicadas
- [✅] Promedios se actualizan correctamente

## Comandos Útiles

### Ver logs del backend
```bash
tail -f /workspaces/Delicrunch/backend.log
```

### Ver logs de Expo
```bash
tail -f /workspaces/Delicrunch/scripts/expo.log
```

### Probar API directamente
```bash
# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"comprador@delicrunch.com","password":"Comprador123"}'

# Obtener mis reviews
curl http://localhost:5001/api/reviews/my \
  -H "x-auth-token: YOUR_TOKEN"

# Crear review
curl -X POST http://localhost:5001/api/reviews \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_TOKEN" \
  -d '{"order_id":20,"product_id":642,"calificacion":5,"comentario":"Test"}'
```

### Actualizar estado de pedido (testing)
```bash
docker compose exec -T postgres psql -U postgres -d delicrunch \
  -c "UPDATE orders SET estado = 'recogido' WHERE id = 20;"
```

## Próximos Pasos

1. ✅ Corregir mapeo de estados en backend (consistencia)
2. ⏳ Agregar tests unitarios para reviewController
3. ⏳ Agregar tests de integración para flujo completo
4. ⏳ Mejorar manejo de errores en frontend
5. ⏳ Agregar analytics para tracking de reviews
6. ⏳ Implementar notificaciones push para respuestas del comercio

## Notas Técnicas

- **product_id** en order puede ser null si se usa order_items
- **order_items** tabla separada permite múltiples productos por pedido
- Por ahora, sistema asume 1 producto por pedido para simplificar reviews
- Para pedidos con múltiples productos, se debe iterar y permitir review por producto

## Referencias

- Backend: `/Backend/controllers/reviewController.js`
- Frontend: `/Frontend/app/OrderDetailScreen.js`
- Pantalla reviews: `/Frontend/app/MyReviewsScreen.js`
- Rutas: `/Backend/routes/reviewRoutes.js`
- Tests: `/test-review-flow.sh`
