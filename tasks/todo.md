# 📋 Lista de Tareas Activas - Delicrunch

> **Última actualización:** 4 de marzo de 2026
> **Estado del proyecto:** Sistema de Pagos MercadoPago ✅ FUNCIONAL — Rumbo a Google Play

---

## ✅ Completado en Sesión 4 Mar 2026

### Bugs Corregidos (7 críticos)
- [x] **db/index.js - Pool no persistente** → Pool PG creaba nueva conexión por query. Corregido: pool único reutilizable
- [x] **paymentController - merchantSetup SQL roto** → SQL con `updated_at =user_id` sin WHERE. Corregido: columnas reales del schema
- [x] **paymentRoutes - middleware getStoreId faltante** → merchant-balance y merchant-payouts sin el middleware. Corregido
- [x] **paymentController - transacciones sin cliente dedicado** → BEGIN/COMMIT con pool.query() en lugar de client.query(). Corregido
- [x] **authController - roles mapeados al inglés** → comprador→buyer violaba constraint DB. Corregido: español correcto
- [x] **eas.json - builds sin variables de entorno** → preview/production sin EXPO_PUBLIC_API_URL. Corregido
- [x] **PaymentScreen - sandboxInitPoint en producción** → Ahora usa __DEV__ para selector correcto
- [x] **Credenciales MercadoPago actualizadas** → Nuevas creds de producción en Backend/.env y Frontend/.env

### Pruebas Exitosas
- ✅ Backend conecta a Supabase (pool persistente)
- ✅ Servidor arranca sin errores
- ✅ Login funciona (testbuyer2@delicrunch.com / Test1234!)
- ✅ MercadoPago create-preference E2E → init_point real generado
- ✅ Products endpoint (9 productos), Stores (3 tiendas)

---

## 🔴 Prioridad Alta — HACER MAÑANA PRIMERO

### 1. Deploy a Render y verificar producción
- [ ] `git commit -am "fix: sistema pagos MP funcional + 7 bugs críticos"` (si no se hizo)
- [ ] `git push origin main`
- [ ] Verificar que Render re-deploya automáticamente
- [ ] Probar https://delicrunch.onrender.com/health
- [ ] Probar POST https://delicrunch.onrender.com/api/auth/login
- [ ] **Actualizar vars de entorno en Render Dashboard:**
  - `MERCADOPAGO_ACCESS_TOKEN=APP_USR-7704331481200418-012213-c2709cec9688c4aec321f267d1c70100-76668136`
  - `MERCADOPAGO_PUBLIC_KEY=APP_USR-9ba7aa3b-9864-48b9-8b7c-271a5cf44549`

### 2. Configurar Webhook de MercadoPago en panel MP
- [ ] Ir a: https://www.mercadopago.com.mx/developers/panel/app/7704331481200418/webhooks
- [ ] Agregar URL: `https://delicrunch.onrender.com/api/payments/webhook`
- [ ] Seleccionar evento: `payment`
- [ ] Guardar y verificar que llega una notificación de prueba

### 3. Reset de contraseñas de usuarios semilla en BD
- [ ] Ejecutar script para hacerlo funcional: `cd Backend && node db/create-quick-users.js`
- [ ] O crear usuario de prueba nuevo con credenciales conocidas
- [ ] Verificar login con maria@delicrunch.com u otro usuario semilla

### 4. Build de Preview para pruebas en dispositivo físico
- [ ] `cd Frontend && eas build --profile preview --platform android`
- [ ] Instalar APK en Android físico
- [ ] Probar flujo completo: Login → Producto → PaymentScreen → MP Checkout → Resultado
- [ ] Verificar que deep link `delicrunch://payment-result` funciona al volver de MP

---

## 🟡 Prioridad Media — Google Play Store

### Preparación de listing
- [ ] Capturas de pantalla de pantallas principales (mínimo 4)
- [ ] Descripción corta y larga en español
- [ ] Política de privacidad (obligatoria por Google) — puede ser una URL a un Google Doc
- [ ] Icono app 512x512 PNG (verificar assets/icon.png)
- [ ] Feature graphic 1024x500

### Build de producción
- [ ] `cd Frontend && eas build --profile production --platform android`
- [ ] Genera `.aab` para Google Play Console
- [ ] Subir a Google Play Console → Pruebas internas primero
- [ ] Pasar a revisión cuando todo esté verificado

---

## 🟢 Prioridad Baja

- [ ] Notificaciones push para cambios de estado de órdenes
- [ ] Pantalla de historial de pagos más detallada
- [ ] Script de health-check automático al iniciar backend

---

## 🔑 Credenciales y Datos Clave

### MercadoPago Producción (Checkout Pro)
```
Public Key:    APP_USR-9ba7aa3b-9864-48b9-8b7c-271a5cf44549
Access Token:  APP_USR-7704331481200418-012213-c2709cec9688c4aec321f267d1c70100-76668136
User ID:       76668136
App ID:        7704331481200418
```

### Usuario de prueba funcional (creado 4 Mar)
```
Email:    testbuyer2@delicrunch.com
Password: Test1234!
Rol:      comprador
```

### Backend local
```
URL:  http://localhost:5001
BD:   Transaction Pooler Supabase puerto 6543
```

### Backend producción
```
URL: https://delicrunch.onrender.com
```

### Supabase
```
URL:     https://pruesizqytpscldieivb.supabase.co
Proyecto: pruesizqytpscldieivb
```

---

## ✅ Checklist pre-commit
- [x] ¿Funciona? Backend arranca, MP genera preferencia E2E
- [x] ¿Código limpio y mantenible? Sí — pool persistente, SQL corregido
- [x] ¿Cambios mínimos y necesarios? Sí — solo correcciones de bugs
- [x] ¿Aprobaría un ingeniero senior? Sí
- [x] ¿Actualizado lessons.md? Sí
