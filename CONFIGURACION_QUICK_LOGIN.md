# 🚀 Configuración Quick Login y Navegación por Roles

## ✅ Usuarios Configurados

### 👤 Comprador
- **Nombre:** María González
- **Email:** `comprador1@test.com`
- **Password:** `password123`
- **Rol:** `buyer` (se muestra como "comprador" en la app)
- **Pantalla Inicial:** DiscoverScreen.js (Descubre comercios)
- **Navegación:** CompradorTabs (Descubre, Buscar, Favoritos, Recompensas, Perfil)
- **Ciudad:** Delicias, Chihuahua

### 🏪 Comercio
- **Nombre:** Tacos Don Rafa
- **Email:** `comercio.tacosdonrafa@test.com`
- **Password:** `password123`
- **Rol:** `seller` (se muestra como "comercio" en la app)
- **Pantalla Inicial:** MerchantDashboardScreen.js (Panel de control)
- **Navegación:** ComercioTabs (Dashboard, Productos, Pedidos, Premios, Perfil)
- **Ciudad:** Delicias, Chihuahua
- **Tienda:** Tiene productos creados y disponibles

### 👑 Admin
- **Nombre:** Administrador Delicrunch
- **Email:** `admin@delicrunch.com`
- **Password:** `password123`
- **Rol:** `admin`
- **Pantalla Inicial:** AdminDashboardScreen.js (Panel administrativo)
- **Navegación:** AdminTabs (Panel, Comercios, Reviews, Pagos, SuperAdmin)
- **Permisos:** Acceso completo a todas las funciones y vistas

---

## 🔄 Sistema de Navegación

### Arquitectura
```
App.js
  └─ AuthProvider (gestiona autenticación y roles)
      └─ AppNavigator
          ├─ AuthStack (no autenticado) → LoginScreen
          └─ AppStack (autenticado)
              └─ BottomTabNavigator
                  ├─ CompradorTabs (buyer)
                  ├─ ComercioTabs (seller)
                  └─ AdminTabs (admin)
```

### Mapeo de Roles
El sistema internamente usa roles en inglés (BD) pero los mapea a español (UI):
- `buyer` → `comprador`
- `seller` → `comercio`
- `admin` → `admin`

**Archivo:** `Frontend/navigation/BottomTabNavigator.js`

---

## 🔌 Endpoints Principales por Rol

### 🔐 Autenticación (Todos)
```
POST /api/auth/login
  Body: { email, password }
  Response: { token }

GET /api/profiles/me
  Headers: { x-auth-token: <token> }
  Response: { id, nombre, email, rol, telefono_usuario, ... }
```

### 👤 Comprador (Buyer)
```
GET /api/products                    # Ver productos disponibles
GET /api/stores/with-products        # Ver tiendas con productos
POST /api/orders                     # Crear pedido
  Body: { productId, cantidad, stripePaymentIntentId }
GET /api/orders/my-orders            # Ver mis pedidos
POST /api/reviews                    # Dejar reseña
  Body: { storeId, orderId, rating, comment }
```

### 🏪 Comercio (Seller)
```
GET /api/products/my-products        # Ver mis productos
POST /api/products                   # Crear producto
  Body: { name, price, stock, description, categoria, ... }
PATCH /api/products/:id              # Editar producto
DELETE /api/products/:id             # Eliminar producto
GET /api/orders/store-orders         # Ver pedidos de mi tienda
PATCH /api/orders/:id                # Actualizar estado del pedido
  Body: { status: 'confirmed' | 'ready' | 'delivered' | 'cancelled' }
GET /api/reviews/store/:storeId      # Ver reseñas de mi tienda
```

### 👑 Admin
```
GET /api/admin/stores                # Ver todos los comercios
GET /api/admin/users                 # Ver todos los usuarios
GET /api/admin/metrics               # Ver métricas del sistema
GET /api/admin/transactions          # Ver transacciones
PATCH /api/admin/stores/:id          # Actualizar comercio
  Body: { activo: true/false, ... }
```

---

## 🔄 Actualización Cruzada de Información

### Flujo de Compra
1. **Comprador crea orden** (`POST /api/orders`)
   - ✅ Actualiza stock del producto
   - ✅ Crea registro en tabla `orders`
   - ✅ Actualiza estadísticas del comprador en `profiles`
     - `total_pedidos += 1`
     - `total_ahorrado += ahorro`
     - `co2_ahorrado += co2`

2. **Comercio ve orden** (`GET /api/orders/store-orders`)
   - ✅ Ve pedidos con estado `confirmed`
   - ✅ Puede ver detalles del comprador

3. **Comercio actualiza estado** (`PATCH /api/orders/:id`)
   - ✅ Cambia estado a `ready` → Notifica al comprador (futuro)
   - ✅ Cambia estado a `delivered` → Actualiza métricas:
     - `products.sales_count += 1`
   - ✅ Impacta en estadísticas del comercio

### Flujo de Reseñas
1. **Comprador deja reseña** (`POST /api/reviews`)
   - ✅ Crea registro en tabla `reviews`
   - ✅ Actualiza rating promedio de la tienda
   - ✅ Incrementa contador de reseñas

2. **Comercio ve reseñas** (`GET /api/reviews/store/:storeId`)
   - ✅ Ve todas las reseñas de su tienda
   - ✅ Puede responder (futuro)

3. **Admin modera** (`GET /api/admin/reviews`)
   - ✅ Ve todas las reseñas del sistema
   - ✅ Puede eliminar reseñas inapropiadas

---

## 📊 Variables Compartidas Entre Perfiles

### Tabla `orders`
Conecta **Comprador** ↔ **Comercio**
```sql
- user_id (comprador)
- seller_id (comercio)
- status (actualizado por comercio, leído por comprador)
- subtotal, total (visibles para ambos)
- order_number (código de recogida)
```

### Tabla `products`
Administrado por **Comercio**, visible para **Comprador**
```sql
- seller_id (propietario)
- stock (actualizado automáticamente al crear orden)
- sales_count (actualizado al marcar orden como delivered)
- rating, rating_count (actualizado al crear reseña)
```

### Tabla `profiles`
Estadísticas de **Comprador**
```sql
- total_pedidos (incrementa con cada orden)
- total_ahorrado (suma de ahorros)
- co2_ahorrado (suma de CO2 ahorrado)
- total_xp (gamificación)
```

### Tabla `reviews`
Conecta **Comprador** ↔ **Comercio**
```sql
- user_id (comprador que escribe)
- store_id (comercio evaluado)
- order_id (orden relacionada)
- rating (afecta promedio del comercio)
```

---

## 🎨 Personalización por Rol

### AuthProvider
**Archivo:** `Frontend/contexts/AuthProvider.js`
- Gestiona autenticación con JWT
- Almacena usuario en `AsyncStorage`
- Expone `user.rol` para navegación
- Soporta simulación de roles (admin puede ver vista de comprador/comercio)

### BottomTabNavigator
**Archivo:** `Frontend/navigation/BottomTabNavigator.js`
- Lee `effectiveRole` del contexto
- Mapea roles inglés → español
- Renderiza tabs apropiados
- Muestra badge "👑" para admin

---

## 🧪 Testing

### Quick Login en Desarrollo
En `LoginScreen.js`, cuando `__DEV__` es true, aparecen 3 botones:
- **Comprador** → `comprador1@test.com`
- **Comercio** → `comercio.tacosdonrafa@test.com`
- **Admin** → `admin@delicrunch.com`

### Verificar Login
```bash
# Backend
curl -X POST https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"comprador1@test.com","password":"password123"}'

# Debe devolver: { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

### Verificar Perfil
```bash
curl -X GET https://silver-telegram-7vx44jrgxxqrhrw79-5001.app.github.dev/api/profiles/me \
  -H "x-auth-token: <TOKEN>"

# Debe devolver: { "id": 1, "nombre": "...", "rol": "buyer", ... }
```

---

## 📝 Notas Importantes

1. **Passwords:** Todos usan `password123` (testing)
2. **Tokens:** Expiran en 5 horas
3. **Roles en BD:** Siempre en inglés (`buyer`, `seller`, `admin`)
4. **Roles en UI:** Mapeados a español (`comprador`, `comercio`, `admin`)
5. **Navegación:** Automática según rol al hacer login
6. **Transacciones:** Todas las operaciones de orden usan transacciones SQL (BEGIN/COMMIT)
7. **Actualización:** Los cambios de estado de orden actualizan múltiples tablas automáticamente

---

## 🔧 Mantenimiento

### Agregar Nuevo Usuario
```bash
cd Backend
node -e "
const pool = require('./db');
const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('password123', 10);
  await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES (\$1, \$2, \$3, \$4)',
    ['Nuevo Usuario', 'nuevo@test.com', hash, 'buyer']
  );
  console.log('✅ Usuario creado');
  await pool.end();
})();
"
```

### Verificar Usuarios
```bash
psql postgresql://postgres:Qazwsx1234@localhost:5432/delicrunch \
  -c "SELECT email, role FROM users WHERE email LIKE '%test.com';"
```

---

## ✅ Checklist de Validación

- [x] Quick Login Buttons actualizados con credenciales correctas
- [x] Los 3 usuarios existen en la BD con password123
- [x] Roles mapeados correctamente (inglés ↔ español)
- [x] Navegación inicial correcta por rol
- [x] Endpoints documentados por perfil
- [x] Sistema de actualización cruzada verificado
- [x] Transacciones SQL para integridad de datos
- [x] AuthProvider gestiona roles correctamente

---

**Fecha:** 26 de enero de 2026  
**Versión:** 1.0  
**Estado:** ✅ Configuración Completa
