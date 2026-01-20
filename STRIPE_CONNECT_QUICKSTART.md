# 🚀 GUÍA RÁPIDA - Stripe Connect para Comercios

## ⚡ Inicio Rápido (5 minutos)

### 1. Iniciar el Sistema

```bash
# Terminal 1 - Backend
cd Backend
npm start

# Terminal 2 - Frontend
cd Frontend
npx expo start --tunnel
```

### 2. Probar como Comercio

1. **Login** como comercio (o registrar uno nuevo)
2. **Ir al Dashboard** de comercio
3. Si NO está configurado → verás un **warning naranja**
4. Presionar **"Pagos"** en acciones rápidas

---

## 📱 Pantallas y Flujos

### Dashboard de Comercio

**Lo que verás:**
```
┌─────────────────────────────────────┐
│  [Logo] Mi Tienda              💡   │
│  ⭐ 4.5 • 12 reseñas                │
│  $1,250 | 3 | 8                     │
├─────────────────────────────────────┤
│  ⚠️ Configura tu cuenta de pagos    │ ← Si no configurado
│      Conecta tu cuenta bancaria     │
├─────────────────────────────────────┤
│  📊 Métricas                        │
│  💰 Ventas  📦 Pedidos  🏷️ Productos│
├─────────────────────────────────────┤
│  ⚡ Acciones Rápidas                │
│  [+]     [🏷️]     [💳]     [💬]     │
│  Nuevo   Productos  Pagos  Reseñas │
└─────────────────────────────────────┘
```

### Pantalla de Configuración de Pagos

**Primera vez (sin cuenta):**
```
┌─────────────────────────────────────┐
│  ← Configuración de Pagos           │
├─────────────────────────────────────┤
│  🏦 Estado de tu Cuenta              │
│  ℹ️ No has configurado tu cuenta    │
│     Para recibir pagos, conecta     │
│     una cuenta bancaria con Stripe  │
│                                      │
│  [Conectar con Stripe]               │
└─────────────────────────────────────┘
```

**Cuenta activa:**
```
┌─────────────────────────────────────┐
│  ← Configuración de Pagos           │
├─────────────────────────────────────┤
│  🏦 Estado de tu Cuenta              │
│  ✅ Puede recibir pagos              │
│  ✅ Puede recibir transferencias     │
│  ✅ Información completa             │
│  Tipo: Express | País: México       │
├─────────────────────────────────────┤
│  💰 Balance                          │
│  [GRADIENT VERDE]                    │
│  Disponible: $1,250.50 MXN          │
│  Pendiente:   $350.00 MXN           │
├─────────────────────────────────────┤
│  📊 Comisiones                       │
│  Comercio:     75% ████████         │
│  Plataforma:   25% ██               │
├─────────────────────────────────────┤
│  📅 Próximos Pagos                   │
│  ✅ Pagado                           │
│  $1,250.50 MXN                       │
│  Llegada: 16 Ene 2025               │
│                                      │
│  [Gestionar Cuenta]                  │
└─────────────────────────────────────┘
```

---

## 🔄 Flujos de Usuario

### Flujo 1: Configuración Inicial

```
Login → Dashboard → Warning "Configura pagos"
     ↓
Presiona Warning o "Pagos"
     ↓
MerchantPaymentSettingsScreen
     ↓
Estado: "No has configurado"
     ↓
Presiona "Conectar con Stripe"
     ↓
Se abre WebBrowser
     ↓
Completa formulario Stripe:
  - Tipo de negocio
  - Información bancaria
  - Información fiscal
     ↓
Stripe redirige de vuelta
     ↓
App recarga datos
     ↓
✅ Cuenta activa y lista
```

### Flujo 2: Ver Balance y Pagos

```
Dashboard → Presiona "Pagos"
     ↓
MerchantPaymentSettingsScreen carga:
  - Estado de cuenta
  - Balance disponible
  - Balance pendiente
  - Próximos pagos
     ↓
Pull-to-refresh para actualizar
     ↓
Presiona "Gestionar Cuenta" para cambios
```

### Flujo 3: Completar Información Faltante

```
Dashboard → Warning "Completa configuración"
     ↓
Presiona Warning
     ↓
Estado muestra:
  ❌ No puede recibir pagos
  ⚠️ Información incompleta
     ↓
Presiona "Continuar Configuración"
     ↓
Completa información en Stripe
     ↓
✅ Cuenta activada
```

---

## 🧪 Pruebas con Stripe Test Mode

### Datos de Prueba

**Información de negocio:**
- Nombre: "Mi Comercio Test"
- Tipo: Individual
- País: México

**Información bancaria (México):**
- CLABE: `000000000000000000` (18 ceros)
- O cualquier CLABE de 18 dígitos

**Verificación:**
- Código SMS: `000000`
- Fecha de nacimiento: Cualquier fecha válida

### Verificar en Stripe Dashboard

1. Ir a: https://dashboard.stripe.com/test/connect/accounts
2. Buscar tu cuenta creada
3. Ver estado:
   - `charges_enabled: true`
   - `payouts_enabled: true`
   - `details_submitted: true`

---

## 🔧 Endpoints Disponibles

### 1. Estado de Cuenta
```bash
GET /api/payments/stripe-account-status
Authorization: Bearer TOKEN_COMERCIO

Respuesta:
{
  "hasStripeAccount": true,
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true,
  "country": "MX",
  "defaultCurrency": "mxn",
  "type": "express",
  "email": "comercio@example.com"
}
```

### 2. Balance de Cuenta
```bash
GET /api/payments/connected-account-balance
Authorization: Bearer TOKEN_COMERCIO

Respuesta:
{
  "available": [
    { "amount": 1250.50, "currency": "MXN" }
  ],
  "pending": [
    { "amount": 350.00, "currency": "MXN" }
  ]
}
```

### 3. Próximos Pagos
```bash
GET /api/payments/upcoming-payouts
Authorization: Bearer TOKEN_COMERCIO

Respuesta:
{
  "payouts": [
    {
      "id": "po_xxx",
      "amount": 1250.50,
      "currency": "MXN",
      "status": "paid",
      "arrivalDate": 1705420800,
      "method": "standard"
    }
  ]
}
```

### 4. Crear Account Link
```bash
POST /api/payments/create-account-link
Authorization: Bearer TOKEN_COMERCIO

Respuesta:
{
  "url": "https://connect.stripe.com/setup/..."
}
```

---

## ✅ Checklist de Validación

### Backend
- [ ] Backend corriendo en puerto 5001
- [ ] Endpoints responden correctamente
- [ ] Stripe API keys configuradas
- [ ] Base de datos conectada

### Frontend
- [ ] App corriendo en Expo
- [ ] Navegación funciona
- [ ] Pantallas se ven correctamente
- [ ] WebBrowser abre URLs

### Flujos
- [ ] Login como comercio funciona
- [ ] Dashboard muestra warning si no configurado
- [ ] PaymentSettings carga correctamente
- [ ] Conectar con Stripe abre navegador
- [ ] Estado actualiza después de onboarding
- [ ] Balance y payouts se muestran
- [ ] Pull-to-refresh funciona

---

## 🐛 Solución de Problemas

### Error: "Backend NO está corriendo"
```bash
cd Backend
npm start
```

### Error: "No se pudo generar el enlace"
- Verificar que `STRIPE_SECRET_KEY` está en `.env`
- Verificar que el usuario es comercio
- Verificar que tiene una tienda en BD

### Error: "No tiene cuenta de Stripe conectada"
- Primero crear la cuenta con "Conectar con Stripe"
- Luego intentar ver balance

### WebBrowser no abre
- Verificar permisos de la app
- Intentar en dispositivo físico (no emulador)

### Balance o payouts vacíos
- Normal si la cuenta es nueva
- Hacer una venta de prueba primero
- Esperar procesamiento de Stripe (2-7 días)

---

## 📚 Documentación Adicional

- **Análisis completo:** [STRIPE_CONNECT_ANALYSIS.md](STRIPE_CONNECT_ANALYSIS.md)
- **Implementación:** [STRIPE_CONNECT_IMPLEMENTATION.md](STRIPE_CONNECT_IMPLEMENTATION.md)
- **Resumen:** [STRIPE_CONNECT_SUMMARY.md](STRIPE_CONNECT_SUMMARY.md)

---

## 🎉 ¡Listo!

Tu sistema de Stripe Connect está completamente funcional. Los comercios ahora pueden:

✅ Conectar sus cuentas bancarias
✅ Ver su balance disponible
✅ Ver próximos pagos
✅ Recibir transferencias automáticas
✅ Todo con diseño TGTG

**¡Buen trabajo! 🚀**
