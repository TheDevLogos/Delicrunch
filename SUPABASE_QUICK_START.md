# 🚀 MIGRACIÓN A SUPABASE - REFERENCIA RÁPIDA

## Archivos Creados

### 📂 `supabase-migration/`
```
01-initial-schema.sql       # Esquema SQL completo para Supabase
migrate-to-supabase.js      # Script automático de migración de datos
setup-supabase.sh           # Script de configuración
README.md                   # Documentación completa
```

### 🔧 Archivos Modificados
```
Backend/.env                # Credenciales de Supabase añadidas
Backend/db/index.js         # Soporte SSL para Supabase
Backend/db/supabase.js      # Nueva configuración Supabase (NUEVO)
Frontend/.env               # Variables de Supabase
Frontend/config/supabase.js # Cliente Supabase Frontend (NUEVO)
```

## ⚡ Inicio Rápido (3 pasos)

### 1. Completar Credenciales

Edita `Backend/.env` y reemplaza:
```env
SUPABASE_SERVICE_KEY=tu_service_role_key_aqui
DB_PASSWORD=tu_contraseña_de_base_de_datos_aqui
DATABASE_URL=postgresql://postgres:tu_contraseña_aqui@db.pruesizqytpscldieivb.supabase.co:5432/postgres
```

**¿Dónde obtener estas credenciales?**
- **Service Key**: https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/api
- **DB Password**: https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/database

### 2. Ejecutar Esquema SQL

1. Abre: https://supabase.com/dashboard/project/pruesizqytpscldieivb/sql/new
2. Copia el contenido de: `supabase-migration/01-initial-schema.sql`
3. Pégalo y haz clic en "Run"

### 3. Instalar Dependencias

```bash
cd /workspaces/Delicrunch
bash supabase-migration/setup-supabase.sh
```

## 🎯 Comandos Útiles

### Verificar Conexión Backend
```bash
cd Backend
node -e "const {checkPoolConnection} = require('./db/supabase'); checkPoolConnection();"
```

### Migrar Datos Existentes (Opcional)
```bash
cd supabase-migration
node migrate-to-supabase.js
```

### Iniciar Aplicación
```bash
# Backend
cd Backend && npm start

# Frontend (otra terminal)
cd Frontend && npm start
```

## 📊 Estructura de Base de Datos

### Tablas Migradas (13 tablas)
- ✅ users
- ✅ stores
- ✅ products
- ✅ profiles
- ✅ saved_cards
- ✅ orders
- ✅ order_items
- ✅ reviews
- ✅ favorites
- ✅ notifications
- ✅ financial_metrics
- ✅ admin_metrics
- ✅ payment_intents

### Características Implementadas
- ✅ Row Level Security (RLS)
- ✅ Índices optimizados
- ✅ Triggers para updated_at
- ✅ Vistas útiles (stores_with_ratings, products_with_store, orders_summary)
- ✅ Soporte para Stripe y MercadoPago

## 🔐 Configuración de Seguridad

### Claves Configuradas

| Clave | Ubicación | Uso |
|-------|-----------|-----|
| `SUPABASE_ANON_KEY` | Frontend + Backend | Acceso público |
| `SUPABASE_SERVICE_KEY` | Backend | Operaciones privilegiadas |

### Variables de Entorno

#### Backend `.env`
```env
SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
SUPABASE_SERVICE_KEY=<obtener-desde-dashboard>
DB_HOST=db.pruesizqytpscldieivb.supabase.co
DB_PASSWORD=<obtener-desde-dashboard>
```

#### Frontend `.env`
```env
EXPO_PUBLIC_SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
```

## 🚨 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Connection refused" | Verifica que DB_HOST sea `db.pruesizqytpscldieivb.supabase.co` |
| "Password authentication failed" | Resetea la contraseña en Supabase Dashboard |
| "SSL required" | Verifica que `ssl: {rejectUnauthorized: false}` esté en la config |
| Dependencias faltantes | Ejecuta `setup-supabase.sh` |

## 📝 Próximos Pasos

1. [ ] Obtener Service Role Key de Supabase
2. [ ] Obtener contraseña de base de datos
3. [ ] Actualizar `Backend/.env`
4. [ ] Ejecutar esquema SQL en Supabase
5. [ ] Instalar dependencias (`setup-supabase.sh`)
6. [ ] Migrar datos (opcional)
7. [ ] Probar la aplicación
8. [ ] Verificar que todo funcione correctamente

## 📚 Recursos

- [Dashboard Supabase](https://supabase.com/dashboard/project/pruesizqytpscldieivb)
- [SQL Editor](https://supabase.com/dashboard/project/pruesizqytpscldieivb/sql)
- [API Settings](https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/api)
- [Database Settings](https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/database)
- [Documentación Completa](supabase-migration/README.md)

---

**Creado**: 2026-02-04 | **Proyecto**: Delicrunch → Supabase
