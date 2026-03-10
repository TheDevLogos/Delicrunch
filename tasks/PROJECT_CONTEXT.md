# 📊 Estado Actual del Proyecto - Delicrunch

> **Última actualización:** 25 de febrero de 2026
> **Propósito:** Documentación viva del estado del proyecto para contexto rápido

---

## 🎯 Resumen Ejecutivo

**Delicrunch** es una aplicación móvil de marketplace local que conecta compradores con tiendas. 

### Stack Tecnológico
- **Frontend:** React Native + Expo SDK 54
- **Backend:** Node.js + Express
- **Base de Datos:** Supabase (PostgreSQL)
- **Pagos:** MercadoPago
- **Deployment:** Render (Backend) + Expo (Mobile)

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios
```
/workspaces/Delicrunch/
├── Backend/              # API Node.js/Express
│   ├── controllers/     # Lógica de negocio
│   ├── middlewares/     # Auth, validación
│   ├── routes/          # Definición de endpoints
│   ├── db/              # Pool de conexiones
│   └── server.js        # Entry point
├── Frontend/            # App React Native
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── screens/     # Pantallas de la app
│   │   ├── navigation/  # React Navigation
│   │   └── context/     # Context API (Auth, etc)
│   └── app.json         # Configuración Expo
├── tasks/               # 🆕 Gestión de tareas
│   ├── todo.md         # Lista de tareas activas
│   └── lessons.md      # Lecciones aprendidas
├── scripts/            # Scripts de automatización
└── supabase-migration/ # Migraciones y seeds SQL
```

---

## 🗄️ Schema de Base de Datos

### Tablas Principales (100% en Español)

#### `users` - Usuarios del sistema
```sql
- id (uuid, PK)
- email (text, UNIQUE)
- password_hash (text)
- nombre (text) -- NO "name"
- rol (text) -- NO "role" -- valores: 'comprador', 'comercio', 'admin'
- created_at (timestamp)
```

#### `stores` - Tiendas/Comercios
```sql
- id (serial, PK)
- user_id (uuid, FK → users.id)
- nombre (text)
- descripcion (text)
- direccion (text)
- telefono (text)
- latitud (decimal)
- longitud (decimal)
- horario_apertura (time)
- horario_cierre (time)
- imagen_url (text)
- calificacion_promedio (decimal)
- created_at (timestamp)
```

#### `products` - Productos
```sql
- id (serial, PK)
- store_id (int, FK → stores.id) -- NO "seller_id"
- nombre (text) -- NO "name"
- descripcion (text) -- NO "description"
- precio_descuento (decimal) -- NO "price"
- precio_original (decimal) -- NO "compare_price"
- cantidad_disponible (int) -- NO "stock"
- activo (boolean) -- NO "is_active"
- imagen_url (text)
- categoria (text)
- subcategoria (text)
- created_at (timestamp)
```

#### `profiles` - Perfiles de usuario extendidos
```sql
- id (uuid, PK, FK → users.id)
- telefono (text)
- direccion (text)
- ciudad (text)
- codigo_postal (text)
- fecha_nacimiento (date)
- genero (text)
```

#### `orders` - Pedidos
```sql
- id (serial, PK)
- user_id (uuid, FK → users.id)
- store_id (int, FK → stores.id)
- total (decimal)
- estado (text) -- pending, confirmed, preparing, ready, delivered, cancelled
- metodo_pago (text)
- direccion_entrega (text)
- created_at (timestamp)
```

#### `order_items` - Items de pedidos
```sql
- id (serial, PK)
- order_id (int, FK → orders.id)
- product_id (int, FK → products.id)
- cantidad (int)
- precio_unitario (decimal)
```

#### `reviews` - Reseñas
```sql
- id (serial, PK)
- user_id (uuid, FK → users.id)
- store_id (int, FK → stores.id)
- calificacion (int) -- NO "rating"
- comentario (text) -- NO "comment"
- created_at (timestamp)
```

---

## ⚠️ Problemas Conocidos y Soluciones

### 1. Inconsistencia de Columnas (CRÍTICO)

**Problema:** Schema 100% en español pero algunos controllers usaban inglés

**Estado:** ✅ CORREGIDO en mayoría de controllers

**Controllers Corregidos:**
- ✅ `authController.js` - usa `nombre`, `rol`, `password_hash`
- ✅ `productController.js` - usa `store_id`, `nombre`, `precio_descuento`, etc.
- ✅ `profileController.js` - usa `nombre`, `rol`
- ✅ `storeController.js` - usa `nombre`, `calificacion`, `comentario`

**Controllers Pendientes:**
- ⚠️ `orderController.js` - aún usa algunos campos en inglés
- ⚠️ `paymentController.js` - aún usa algunos campos en inglés
- ⚠️ `reviewController.js` - parcialmente corregido

### 2. Seeds de Datos

**Problema:** Base de datos vacía en Supabase

**Solución:** Ejecutar seeds en orden:
```sql
1. supabase-migration/01-initial-schema.sql
2. supabase-migration/02-seed-data.sql  
3. supabase-migration/03-fix-schema-inconsistencies.sql
```

**Datos de Prueba:**
- 6 usuarios (compradores, sellers, admin)
- 3 stores: Taquería las Delicias, Pizza Orsinis, Café Placeres
- Productos variados por tienda
- Password de prueba: `Password123`

### 3. MercadoPago Integration

**Estado:** ✅ Configurado

**Variables de Entorno Necesarias:**
```env
MERCADOPAGO_ACCESS_TOKEN=tu_token_aqui
MERCADOPAGO_PUBLIC_KEY=tu_public_key_aqui
```

### 4. Expo SDK 54

**Estado:** ✅ Actualizado

**Comandos para iniciar:**
```bash
# Todo junto
./start-delicrunch.sh

# Solo frontend
cd Frontend && npx expo start --tunnel
```

---

## 🔑 Usuarios de Prueba

### Comprador
```
Email: comprador1@test.com
Password: Password123
Rol: buyer
```

### Seller (Taquería las Delicias)
```
Email: seller1@test.com
Password: Password123
Rol: seller
Store ID: 1
```

### Admin
```
Email: admin@delicrunch.com
Password: Password123
Rol: admin
```

---

## 🚀 Comandos Importantes

### Backend
```bash
cd Backend

# Iniciar servidor
npm start              # Producción
npm run dev            # Desarrollo con nodemon

# Base de datos
npm run migrate        # Ejecutar migraciones
npm run seed           # Poblar datos de prueba
npm run setup          # Migrate + Seed
```

### Frontend
```bash
cd Frontend

# Iniciar Expo
npx expo start         # Normal
npx expo start --tunnel # Tunnel (para Codespaces)
npx expo start --clear  # Clear cache

# Build
eas build --platform android
```

### Scripts Útiles
```bash
# Inicio rápido completo
./start-delicrunch.sh

# Diagnóstico
./diagnose-connectivity.sh

# Configurar puertos públicos (Codespaces)
./configure-public-ports.sh
```

---

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token

### Productos
- `GET /api/products` - Todos los productos disponibles
- `GET /api/products/:id` - Producto por ID
- `GET /api/products/store/:storeId` - Productos de una tienda
- `POST /api/products` - Crear producto (auth seller)
- `PUT /api/products/:id` - Actualizar producto (auth seller)
- `DELETE /api/products/:id` - Eliminar producto (auth seller)

### Tiendas
- `GET /api/stores` - Todas las tiendas
- `GET /api/stores/:id` - Tienda por ID
- `GET /api/stores/user/:userId` - Tienda de un usuario
- `POST /api/stores` - Crear tienda (auth seller)
- `PUT /api/stores/:id` - Actualizar tienda (auth seller)

### Órdenes
- `GET /api/orders` - Órdenes del usuario (auth)
- `GET /api/orders/:id` - Orden por ID (auth)
- `POST /api/orders` - Crear orden (auth)
- `PUT /api/orders/:id/status` - Actualizar estado (auth seller)

### Perfil
- `GET /api/profile/me` - Perfil del usuario logueado (auth)
- `PUT /api/profile/me` - Actualizar perfil (auth)

### Pagos
- `POST /api/payments/create-preference` - Crear preferencia de pago
- `POST /api/payments/webhook` - Webhook de MercadoPago
- `GET /api/payments/:id/status` - Estado de pago

---

## 🌍 Entorno de Desarrollo

### Variables de Entorno (Backend)

```env
# Base de datos
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@host:5432/database

# JWT
JWT_SECRET=your-jwt-secret

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=your-token
MERCADOPAGO_PUBLIC_KEY=your-public-key

# Server
PORT=3000
NODE_ENV=development
```

### Variables de Entorno (Frontend)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your-public-key
```

---

## 📝 Documentos Importantes del Proyecto

### Guías de Deployment
- [`DEPLOYMENT_GUIDE_SUPABASE_RENDER.md`](DEPLOYMENT_GUIDE_SUPABASE_RENDER.md)
- [`RENDER_DEPLOY_FIX.md`](RENDER_DEPLOY_FIX.md)
- [`EAS_BUILD_GUIDE.md`](EAS_BUILD_GUIDE.md)

### Migraciones y Schemas
- [`GUIA_MIGRACION_SQL.md`](GUIA_MIGRACION_SQL.md)
- [`RESUMEN_MIGRACION_SQL.md`](RESUMEN_MIGRACION_SQL.md)
- [`CAMBIOS_MIGRACION_ACTUALIZADA.md`](CAMBIOS_MIGRACION_ACTUALIZADA.md)

### Configuraciones Específicas
- [`MERCADOPAGO_SETUP_COMPLETE.md`](MERCADOPAGO_SETUP_COMPLETE.md)
- [`CONFIGURACION_QUICK_LOGIN.md`](CONFIGURACION_QUICK_LOGIN.md)
- [`CO2_CATEGORY_SYSTEM.md`](CO2_CATEGORY_SYSTEM.md)

### Estado del Sistema
- [`ESTADO_SISTEMA_COMPLETO.md`](ESTADO_SISTEMA_COMPLETO.md)
- [`REVISION_COMPLETA_SISTEMA.md`](REVISION_COMPLETA_SISTEMA.md)

---

## 🎯 Próximos Pasos

### Tareas Pendientes de Corrección
1. Terminar de corregir `orderController.js` con columnas en español
2. Terminar de corregir `paymentController.js` con columnas en español
3. Revisar y testear todos los endpoints
4. Implementar tests automatizados

### Features Planificadas
- Sistema de notificaciones push
- Chat en tiempo real seller-buyer
- Sistema de cupones/descuentos
- Programa de lealtad/puntos

### Mejoras Técnicas
- Implementar caching (Redis)
- Optimizar queries de base de datos
- Implementar rate limiting
- Mejorar manejo de errores

---

## 🐛 Debugging

### Logs del Backend
```bash
# Ver logs en tiempo real
cd Backend
npm run dev

# Verificar conexión a Supabase
node -e "const { createClient } = require('@supabase/supabase-js'); const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); console.log('Connected:', !!client);"
```

### Logs del Frontend
```bash
# Ver logs de Expo
npx expo start

# Clear cache si hay problemas
npx expo start --clear
```

### Base de Datos
```bash
# Conectar a PostgreSQL
psql $DATABASE_URL

# Ver tablas
\dt

# Ver datos de una tabla
SELECT * FROM users LIMIT 5;
```

---

## 📊 Métricas del Proyecto

### Líneas de Código (Aproximado)
- Backend: ~5,000 líneas
- Frontend: ~8,000 líneas
- SQL/Migraciones: ~1,500 líneas

### Archivos del Proyecto
- Total archivos: ~200
- Controllers: 8
- Componentes React: ~30
- Pantallas: ~15

---

## 🔄 Workflow Implementado

A partir del 25 de febrero de 2026, se implementó un **Workflow Orchestration Framework** para mejorar la calidad del desarrollo.

**Documentos del Framework:**
- [`WORKFLOW_GUIDELINES.md`](WORKFLOW_GUIDELINES.md) - Guidelines completas
- [`tasks/todo.md`](tasks/todo.md) - Lista de tareas activas
- [`tasks/lessons.md`](tasks/lessons.md) - Lecciones aprendidas

**Principios Clave:**
1. **Plan Mode Default** - Planificar antes de implementar
2. **Subagent Strategy** - Usar subagentes para investigación
3. **Self-Improvement Loop** - Aprender de errores
4. **Verification Before Done** - Verificar antes de marcar completo
5. **Demand Elegance** - Buscar soluciones elegantes
6. **Autonomous Bug Fixing** - Resolver bugs autónomamente

---

## 📞 Contacto y Recursos

### Repositorio
- **GitHub:** Alonsovl88074/Delicrunch
- **Branch Principal:** main

### Recursos Externos
- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev/)
- [MercadoPago Docs](https://www.mercadopago.com.mx/developers)
- [React Native Docs](https://reactnative.dev/)

---

**🎯 Objetivo:** Mantener este documento actualizado con cada cambio significativo del proyecto

*Última revisión: 25 de febrero de 2026*
