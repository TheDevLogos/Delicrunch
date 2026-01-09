# 📱 Guía de Uso - DrawerNavigator Delicrunch

## 🎯 Objetivo
Este documento explica cómo usar las nuevas pantallas integradas en el **DrawerNavigator** para compradores.

---

## 🔑 Autenticación

### Credenciales de Admin (Prueba)
```
Email: admindeli@delicrunch.com
Contraseña: Admin1234
Rol: admin (acceso a todas las funciones)
```

### Crear Comprador de Prueba
Si deseas probar como comprador puro, puedes:

1. **Opción 1**: Usar la app de registro
2. **Opción 2**: SQL directo en PostgreSQL
   ```sql
   INSERT INTO users (email, password, nombre, rol, activo, created_at)
   VALUES ('test@example.com', '$2b$10$hashedpassword', 'Test Buyer', 'buyer', true, NOW());
   ```

---

## 🏠 Pantalla Home

**Ruta**: `DrawerNavigator -> Home`

### Características:
- ✅ Lista de productos disponibles
- ✅ Buscador por nombre
- ✅ Filtro por categoría (selector desplegable)
- ✅ Tarjetas de producto con:
  - Nombre y descripción
  - Precio original (tachado)
  - Precio con descuento (destacado)
  - Tienda
  - Stock disponible
  - Botón "Ver Detalles"

### Acciones:
```
Tocar ProductCard → Ir a ProductDetailScreen
```

---

## 👤 Pantalla Mi Perfil

**Ruta**: `DrawerNavigator -> Profile`

### Muestra:
- Avatar del usuario
- Nombre completo
- Email registrado
- Rol (Comprador, Vendedor, Admin)
- Fecha de registro
- Información de tienda (si es vendedor)

### Opciones:
- Botón "Editar Perfil" → EditProfileScreen
- Botón "Cerrar Sesión" → Logout

---

## 🛍️ Pantalla Mis Compras (NUEVA)

**Ruta**: `DrawerNavigator -> Mis Compras`

### Descripción:
Muestra el historial completo de pedidos realizados por el comprador.

### Información de cada pedido:
| Campo | Descripción |
|-------|-------------|
| **ID** | Número único del pedido |
| **Producto** | Nombre del pack comprado |
| **Tienda** | Nombre del comercio |
| **Estado** | Pendiente / Confirmado / En Preparación / Listo / Recogido / Cancelado |
| **Total** | Monto total del pedido |
| **Método de Pago** | Tarjeta / Transferencia / Efectivo |
| **Fecha** | Fecha de compra |
| **Hora Recogida** | Horario programado |

### Acciones por Estado:
```
Estado: Recogido + Sin Reseña
└─→ Botón "Dejar Reseña" disponible
    └─→ Navega a LeaveReviewScreen

Otros Estados
└─→ Sin opciones (esperando cambio de estado)
```

### Ejemplo de Estructura:
```json
{
  "id": 1,
  "producto_id": 7,
  "nombre_producto": "Pack Pan Artesanal Premium",
  "nombre_comercio": "Panadería La Espiga",
  "estado": "Recogido",
  "precio_total": 75.00,
  "metodo_pago": "Tarjeta",
  "fecha_pedido": "2025-12-10T10:30:00Z",
  "horario_recogida": "14:00",
  "tiene_resena": false
}
```

### UI Features:
- 🔄 Pull-to-Refresh (deslizar hacia abajo)
- 📊 Cada orden en tarjeta neobrutalism
- 🏷️ Badges de estado con colores:
  - 🟢 Confirmado (Green)
  - 🟠 En Preparación (Orange)
  - 🔵 Listo (Blue)
  - 🟣 Recogido (Purple)
  - 🔴 Cancelado (Red)
  - ⚪ Pendiente (Gray)
- 📝 Botón de reseña cuando aplica

---

## ⭐ Pantalla Mis Reseñas (NUEVA)

**Ruta**: `DrawerNavigator -> Mis Reseñas`

### Descripción:
Muestra todas las reseñas y calificaciones que el comprador ha dejado.

### Información de cada reseña:
| Campo | Descripción |
|-------|-------------|
| **Tienda** | Nombre del comercio |
| **Calificación** | Estrellas (1-5) |
| **Comentario** | Texto de la reseña |
| **Fecha** | Cuándo se escribió |
| **Tipo** | Puede ser para producto o tienda |

### Ejemplo:
```json
{
  "id": 1,
  "nombre_comercio": "Panadería La Espiga",
  "calificacion": 5,
  "comentario": "Excelente calidad, muy fresco",
  "fecha_resena": "2025-12-10T15:45:00Z"
}
```

### UI Features:
- ⭐ Visualización de estrellas (llenas/vacías)
- 📝 Comentario en texto plano
- 📅 Fecha de la reseña
- 🏪 Nombre de la tienda destacado
- 📜 Scroll vertical si hay muchas reseñas
- 🎨 Tarjetas con borde neobrutalism 3px

### Estado Vacío:
```
"No has dejado reseñas aún.
Deja una reseña después de hacer una compra."
```

---

## ❤️ Pantalla Favoritos (NUEVA)

**Ruta**: `DrawerNavigator -> Favoritos`

### Descripción:
Productos guardados como favoritos para acceso rápido.

### Información de cada favorito:
| Campo | Descripción |
|-------|-------------|
| **Nombre** | Nombre del producto |
| **Tienda** | Nombre del comercio |
| **Precio Original** | $XXX.XX (tachado) |
| **Precio con Descuento** | $YYY.YY (destacado) |
| **Ahorro** | $ (diferencia) |
| **Imagen** | Foto del producto |

### Acciones:
```
Tocar Favorito
└─→ "Ver" → ProductDetailScreen

Botón "Eliminar"
└─→ Confirmación
    └─→ "¿Quitar de favoritos?"
        ├─→ Sí → Eliminar
        └─→ No → Cancelar
```

### UI Features:
- 🖼️ Grid layout (2 columnas)
- 💰 Comparación precio antes/después
- ✂️ Botón eliminar por tarjeta
- 👁️ Botón "Ver" para detalles
- 📱 Scroll horizontal si muchos favoritos
- 🎨 Neobrutalism styling

### Ejemplo de Datos:
```json
{
  "id": 7,
  "nombre": "Pack Pan Artesanal Premium",
  "nombre_comercio": "Panadería La Espiga",
  "precio_original": 150.00,
  "precio_descuento": 75.00,
  "ahorro": 75.00,
  "imagen_url": "https://..."
}
```

---

## 📂 Pantallas de Categorías

**Rutas**: 
- `DrawerNavigator -> Panadería`
- `DrawerNavigator -> Cafetería`
- `DrawerNavigator -> Repostería`
- `DrawerNavigator -> Saludable`

### Comportamiento:
- Muestran los productos de esa categoría
- Misma interfaz que HomeScreen
- Con filtro ya aplicado

---

## 🎨 Diseño Visual (Neobrutalism)

### Colores:
```
COLORES PRINCIPALES:
├─ Primario (Naranja): #FF5400
├─ Fondo: #F7F5E6
├─ Texto: #000000
├─ Bordes: #000000
├─ Gris: #CCCCCC
├─ Éxito: #4CAF50
├─ Error: #D32F2F
├─ Advertencia: #FF9800
└─ Info: #2196F3
```

### Características:
- ✅ Bordes gruesos: 2-3px
- ✅ Esquinas cuadradas: border-radius: 0
- ✅ Sin sombras (flat design)
- ✅ Alto contraste
- ✅ Tipografía Bold/Semi-bold
- ✅ Espaciado generoso

### Elementos:
```
Botones:
├─ Fondo: #FF5400
├─ Texto: blanco
├─ Borde: 3px sólido #000000
└─ Sin sombra

Tarjetas:
├─ Fondo: #F7F5E6
├─ Borde: 2px sólido #000000
├─ Padding: 15px
└─ Esquinas: 0px

Headers:
├─ Fondo: #FF5400
├─ Texto: blanco
├─ Altura: 60px
└─ Borde inferior: 3px
```

---

## 🔄 Flujo Completo de Uso

### 1. **Inicio**
```
Login (admin@test.com / Admin1234)
    ↓
HomeScreen (productos)
```

### 2. **Ver Producto**
```
Tocar ProductCard
    ↓
ProductDetailScreen
    ├─ Ver detalles
    ├─ Agregar favorito
    └─ Comprar
```

### 3. **Después de Comprar**
```
OrderConfirmation
    ↓
DrawerNavigator → Mis Compras
    ├─ Ver orden en estado "Pendiente"
    ├─ Esperar estado → "Recogido"
    └─ Botón "Dejar Reseña"
```

### 4. **Dejar Reseña**
```
LeaveReviewScreen
    ├─ Calificación (1-5 estrellas)
    ├─ Comentario
    └─ Enviar
        ↓
Guardar en BD
    ↓
MyReviewsScreen (aparece la reseña)
```

### 5. **Guardar Favorito**
```
ProductDetailScreen → Botón ❤️
    ↓
FavoritesScreen (producto aparece)
    ├─ Ver lista completa
    └─ Eliminar si desea
```

---

## 🐛 Troubleshooting

### Problema: "No se pudieron cargar tus compras"
**Solución**:
1. Verificar token JWT en AsyncStorage
2. Verificar que el usuario tiene rol 'buyer'
3. Revisar logs de backend
   ```bash
   cat /tmp/backend.log
   ```

### Problema: Imágenes no cargan
**Causa**: No hay URL en la BD  
**Solución**: Agregar `imagen_url` en seed de productos

### Problema: Botón "Dejar Reseña" no aparece
**Requisitos**:
- Estado del pedido: "Recogido"
- `tiene_resena: false` en BD

---

## 📊 API Endpoints Utilizados

| Pantalla | Método | Endpoint | Parámetros |
|----------|--------|----------|-----------|
| Home | GET | `/api/products` | `?category=X` |
| MyOrders | GET | `/api/orders/myorders` | - |
| MyReviews | GET | `/api/reviews` | - |
| Favorites | GET | `/api/products/favorites` | - |
| DetailScreen | GET | `/api/products/{id}` | - |
| Reviews Prod | GET | `/api/orders/{id}/reviews` | - |

---

## ✅ Checklist para Producción

- [ ] Crear usuario comprador de prueba
- [ ] Realizar compra de prueba
- [ ] Verificar que aparece en "Mis Compras"
- [ ] Cambiar estado en base de datos
- [ ] Dejar reseña
- [ ] Verificar que aparece en "Mis Reseñas"
- [ ] Guardar como favorito
- [ ] Verificar que aparece en "Favoritos"
- [ ] Probar eliminar favorito
- [ ] Pull-to-refresh en "Mis Compras"
- [ ] Logout y login nuevamente

---

## 📞 Soporte

Para reportar problemas:
1. Revisar `/tmp/backend.log`
2. Revisar console de Expo (Press `j` en terminal)
3. Verificar estado de PostgreSQL
4. Revisar AuthContext en AsyncStorage

---

**Última actualización**: 2025-12-11  
**Versión**: 1.0.0  
**Estado**: ✅ Producción Listo
