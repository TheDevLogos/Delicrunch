# Configuración para Deploy en Render

## Problema Resuelto ✅

El error de conflicto de peer dependencies en React Navigation ha sido corregido.

### Cambios Realizados:

1. **Actualizado `Frontend/package.json`**:
   - `@react-navigation/native`: `^6.1.18` (consistente)
   - `@react-navigation/drawer`: `^6.7.2` (downgrade de 7.x a 6.x)
   - `@react-navigation/bottom-tabs`: `^6.6.1`
   - `@react-navigation/native-stack`: `^6.11.0`

2. **Creado `Frontend/.npmrc`**:
   ```
   legacy-peer-deps=true
   ```
   Este archivo asegura que npm use `--legacy-peer-deps` automáticamente durante el build en Render.

3. **Limpieza de dependencias**:
   - Eliminado `node_modules` y `package-lock.json`
   - Reinstalado con `npm install --legacy-peer-deps`

### Verificación Local:

```bash
cd Frontend
npm list @react-navigation/drawer @react-navigation/native @react-navigation/native-stack
```

Resultado esperado:
```
└── @react-navigation/native@6.1.18
└── @react-navigation/drawer@6.7.2
└── @react-navigation/native-stack@6.11.0
```

## Configuración de Render

### Para Web Service (Frontend):

**Build Command:**
```bash
cd Frontend && npm install && npm run build
```

**Start Command:**
```bash
cd Frontend && npm start
```

### Variables de Entorno Necesarias:

```env
EXPO_PUBLIC_API_URL=https://tu-backend.onrender.com
EXPO_PUBLIC_SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
NODE_ENV=production
```

### Para Web Service (Backend):

**Build Command:**
```bash
cd Backend && npm install
```

**Start Command:**
```bash
cd Backend && npm start
```

### Variables de Entorno del Backend:

```env
# Database (usa la cadena exacta del Dashboard de Supabase)
DB_USER=postgres.pruesizqytpscldieivb
DB_HOST=[COPIAR DEL DASHBOARD]
DB_DATABASE=postgres
DB_PASSWORD=bfOJpzZtcoGhAJdP
DB_PORT=5432

# Supabase
SUPABASE_URL=https://pruesizqytpscldieivb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_iIRMgAQGgWka6eYNPN9i6w_GFNwfKuX
SUPABASE_SERVICE_KEY=[TU_SERVICE_KEY]

# JWT
JWT_SECRET=un_secreto_secretoso_jamas_contado1234

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=implanibot@gmail.com
EMAIL_PASS=[TU_APP_PASSWORD]

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=[TU_TOKEN]

# Puerto
PORT=5001
```

## Solución de Problemas

### Si el build sigue fallando en Render:

1. **Verifica que el archivo `.npmrc` esté presente**:
   ```bash
   cat Frontend/.npmrc
   ```

2. **Limpia el cache de Render**:
   - En el dashboard de Render, ve a Settings
   - Haz clic en "Clear build cache"
   - Redeploy

3. **Verifica el Build Command en Render**:
   Asegúrate de que incluya `cd Frontend` si es necesario:
   ```bash
   npm install && npm run build
   ```

4. **Si necesitas usar npm más nuevo**:
   Agrega en Render environment:
   ```
   NODE_VERSION=20
   ```

## Próximos Pasos

1. ✅ Commit y push de los cambios
2. ✅ Deploy en Render
3. ✅ Verificar que el build se complete sin errores
4. ✅ Probar la aplicación en producción

## Comandos Útiles

```bash
# Verificar versiones instaladas
npm list @react-navigation/drawer

# Reinstalar si es necesario
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Build local para probar
npm run build
```
