# 🚀 Guía de Migración a Supabase para Delicrunch

## 📋 Resumen

Esta guía te ayudará a migrar tu aplicación Delicrunch desde PostgreSQL local a Supabase.

## 🔧 Prerrequisitos

- [x] Cuenta de Supabase creada
- [x] Proyecto Supabase creado
- [x] Credenciales de Supabase obtenidas:
  - `SUPABASE_URL`: https://pruesizqytpscldieivb.supabase.co
  - `SUPABASE_ANON_KEY`: sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX

## 📁 Archivos Creados

```
supabase-migration/
├── 01-initial-schema.sql      # Esquema completo para Supabase
├── migrate-to-supabase.js     # Script de migración de datos
├── setup-supabase.sh          # Script de configuración automática
└── README.md                  # Esta guía
```

## 🎯 Pasos de Migración

### 1️⃣ Obtener Credenciales Adicionales

#### A. Contraseña de la Base de Datos

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/database)
2. En la sección **Database Settings**, encuentra la **Database Password**
3. Si no la recuerda, puedes resetearla desde ahí
4. Copia la contraseña

#### B. Service Role Key (para Backend)

1. Ve a [API Settings](https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/api)
2. Copia el **service_role key** (NO el anon key)
3. ⚠️ **IMPORTANTE**: Esta key es secreta, nunca la expongas en el frontend

### 2️⃣ Actualizar Variables de Entorno

#### Backend `.env`

Actualiza las siguientes variables en `/workspaces/Delicrunch/Backend/.env`:

```env
# ===== SUPABASE CONFIGURATION =====
SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
SUPABASE_SERVICE_KEY=tu_service_role_key_aqui

# Supabase Database Connection (PostgreSQL)
DB_USER=postgres
DB_HOST=db.pruesizqytpscldieivb.supabase.co
DB_DATABASE=postgres
DB_PASSWORD=tu_contraseña_de_base_de_datos_aqui
DB_PORT=5432

# Actualizar DATABASE_URL
DATABASE_URL=postgresql://postgres:tu_contraseña_aqui@db.pruesizqytpscldieivb.supabase.co:5432/postgres
```

#### Frontend `.env`

Ya está configurado con:

```env
EXPO_PUBLIC_SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
```

### 3️⃣ Ejecutar el Esquema SQL en Supabase

#### Opción A: Desde el Dashboard (Recomendado)

1. Ve al [SQL Editor de Supabase](https://supabase.com/dashboard/project/pruesizqytpscldieivb/sql/new)
2. Haz clic en **"New query"**
3. Copia todo el contenido del archivo `01-initial-schema.sql`
4. Pégalo en el editor
5. Haz clic en **"Run"**
6. Espera a que se ejecute (puede tardar 1-2 minutos)
7. Verifica que no haya errores

#### Opción B: Desde la Terminal

```bash
# Usando psql (si lo tienes instalado)
psql "postgresql://postgres:tu_contraseña@db.pruesizqytpscldieivb.supabase.co:5432/postgres" \
  -f supabase-migration/01-initial-schema.sql
```

### 4️⃣ Instalar Dependencias

```bash
# Desde la raíz del proyecto
bash supabase-migration/setup-supabase.sh
```

O manualmente:

```bash
# Backend
cd Backend
npm install @supabase/supabase-js

# Frontend
cd ../Frontend
npm install @supabase/supabase-js
```

### 5️⃣ Migrar Datos Existentes (Opcional)

Si tienes datos en tu base de datos local que quieres migrar:

```bash
# Asegúrate de que tu PostgreSQL local esté corriendo
# Desde la raíz del proyecto

cd supabase-migration
node migrate-to-supabase.js
```

El script:
- ✅ Verifica las conexiones
- ✅ Migra todas las tablas en el orden correcto
- ✅ Respeta las foreign keys
- ✅ Muestra el progreso en tiempo real
- ✅ Resetea las secuencias de IDs

### 6️⃣ Verificar la Conexión

#### Backend

```bash
cd Backend
node -e "const {checkPoolConnection} = require('./db/supabase'); checkPoolConnection();"
```

Deberías ver: `✅ Conexión PostgreSQL con Supabase establecida exitosamente`

#### Frontend

Inicia tu app y verifica en los logs:

```bash
cd Frontend
npm start
```

### 7️⃣ Probar la Aplicación

1. **Reinicia el backend**:
   ```bash
   cd Backend
   npm start
   ```

2. **Reinicia el frontend**:
   ```bash
   cd Frontend
   npm start
   ```

3. **Prueba las funcionalidades principales**:
   - Login/Register
   - Ver productos
   - Hacer un pedido
   - Ver perfil

## 🔍 Verificación en Supabase

1. Ve al [Table Editor](https://supabase.com/dashboard/project/pruesizqytpscldieivb/editor)
2. Verifica que todas las tablas se hayan creado:
   - users
   - stores
   - products
   - profiles
   - orders
   - order_items
   - reviews
   - favorites
   - notifications
   - financial_metrics
   - admin_metrics
   - payment_intents
   - saved_cards

## 🎨 Características de Supabase Implementadas

### ✅ Base de Datos PostgreSQL
- Esquema completo migrado
- Índices optimizados
- Foreign keys configuradas
- Triggers para `updated_at`

### ✅ Row Level Security (RLS)
- Políticas básicas configuradas
- Acceso público habilitado (ajustar según necesidades)

### ✅ Vistas Materializadas
- `stores_with_ratings`: Tiendas con calificaciones
- `products_with_store`: Productos con info de tienda
- `orders_summary`: Resumen de pedidos

### ✅ Funciones y Triggers
- Auto-actualización de `updated_at`
- Triggers configurados en todas las tablas relevantes

## 🔐 Seguridad

### Claves Configuradas

- **Anon Key** (Frontend): Acceso público limitado
- **Service Role Key** (Backend): Acceso completo para operaciones del servidor

### Row Level Security (RLS)

Por defecto, todas las tablas tienen RLS habilitado con políticas permisivas. Para producción, deberías:

1. Implementar autenticación con Supabase Auth
2. Ajustar las políticas RLS según roles
3. Limitar acceso a datos sensibles

## 🚨 Troubleshooting

### Error: "Connection refused"

```bash
# Verifica que el host sea correcto
# Debe ser: db.pruesizqytpscldieivb.supabase.co
# NO: pruesizqytpscldieivb.supabase.co
```

### Error: "Password authentication failed"

- Verifica que la contraseña en `.env` sea correcta
- Resetea la contraseña desde Supabase Dashboard si es necesario

### Error: "SSL required"

- Asegúrate de que el objeto `ssl: { rejectUnauthorized: false }` esté en la configuración del Pool

### Migraciones no completas

```bash
# Verifica los logs de migración
# Si hay errores de foreign key, verifica el orden de las tablas en TABLES_ORDER
```

## 📚 Recursos Adicionales

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL en Supabase](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs de la aplicación
2. Verifica las credenciales en `.env`
3. Consulta la [documentación de Supabase](https://supabase.com/docs)
4. Revisa los ejemplos de código en `Backend/db/supabase.js`

## ✅ Checklist de Migración

- [ ] Credenciales de Supabase obtenidas
- [ ] Variables de entorno actualizadas
- [ ] Esquema SQL ejecutado en Supabase
- [ ] Dependencias instaladas
- [ ] Datos migrados (si aplica)
- [ ] Conexión verificada
- [ ] Aplicación probada
- [ ] Todo funciona correctamente

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación Delicrunch estará funcionando completamente con Supabase.

---

**Fecha de creación**: 2026-02-04  
**Versión**: 1.0.0  
**Proyecto**: Delicrunch → Supabase Migration
