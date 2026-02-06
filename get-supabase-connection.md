# Obtener la Cadena de Conexión Correcta de Supabase

Según la documentación oficial de Supabase en:
- https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- https://github.com/supabase/supabase/blob/main/apps/docs/content/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP.mdx

## El problema actual

El error "Tenant or user not found" indica que el pooler de Supabase no reconoce el proyecto o el formato del usuario es incorrecto.

## Solución: Copiar la cadena exacta desde el Dashboard

### Paso 1: Accede al Dashboard de Supabase
Ve a: https://supabase.com/dashboard/project/pruesizqytpscldieivb/settings/database

### Paso 2: Haz clic en el botón "Connect"
O ve directamente a: https://supabase.com/dashboard/project/pruesizqytpscldieivb?showConnect=true

### Paso 3: Selecciona "Session Pooler" (RECOMENDADO para Codespaces)
- **Puerto 5432** (Session Mode)
- **Siempre usa IPv4** (no requiere addon pagado)
- **Compatible con prepared statements**
- Ejemplo del formato esperado:
  ```
  postgresql://postgres.pruesizqytpscldieivb:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
  ```

### Paso 4: Copia la cadena EXACTA
La región (`us-west-1`) y el formato del usuario pueden variar. **No inventes el formato**, cópialo exactamente como aparece en el dashboard.

### Paso 5: Reemplaza [PASSWORD] con tu contraseña
Tu contraseña actual es: `bfOJpzZtcoGhAJdP`

## Alternativa: Transaction Pooler (para serverless/edge functions)

Si prefieres Transaction Mode (puerto 6543):
```
postgresql://postgres.pruesizqytpscldieivb:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**IMPORTANTE**: Transaction mode **NO soporta prepared statements**. Algunas librerías (como Prisma) requieren deshabilitarlos.

## ¿Por qué no funciona actualmente?

Posibles razones:
1. **El pooler no está habilitado** para tu proyecto (requiere configuración en el dashboard)
2. **La región es diferente** a `us-west-1`
3. **El formato del usuario es diferente** (puede ser solo `postgres` sin el `.pruesizqytpscldieivb`)

## Información clave de la documentación

Según Supabase docs:

> "Pooler session mode: Always uses an IPv4 address"
> "IPv4 proxied for free" - No requiere el addon de $4/mes

### Formato del usuario en Supavisor:
```
postgres.[PROJECT_REF]
```

Donde `PROJECT_REF` = `pruesizqytpscldieivb` en tu caso.

### Verificación con psql:
Una vez que obtengas la cadena correcta del dashboard, prueba:
```bash
PGPASSWORD=bfOJpzZtcoGhAJdP psql -h [HOST_FROM_DASHBOARD] -p [PORT] -U [USER_FROM_DASHBOARD] -d postgres -c "SELECT 1;"
```

## Próximos pasos

1. ✅ Ve al dashboard y copia la cadena exacta del Session Pooler
2. ✅ Actualiza `Backend/.env` con los valores correctos:
   ```env
   DB_USER=[el usuario exacto del dashboard]
   DB_HOST=[el host exacto del dashboard]
   DB_PORT=5432
   DB_PASSWORD=bfOJpzZtcoGhAJdP
   ```
3. ✅ Prueba la conexión con psql
4. ✅ Inicia el backend

## Recursos adicionales

- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [IPv4/IPv6 Compatibility](https://github.com/orgs/supabase/discussions/27034)
- [Supavisor FAQ](https://github.com/orgs/supabase/discussions/21566)
