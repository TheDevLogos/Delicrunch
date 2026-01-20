# Sistema de Recompensas - Validación Completa ✅

**Fecha:** 13 de Enero, 2026  
**Estado:** Sistema validado y funcionando correctamente

## Resumen Ejecutivo

Se ha implementado y validado completamente el **Sistema de Recompensas (Gamificación)** en Delicrunch, que incluye:

- ✅ Acumulación de EXP por compras
- ✅ Sistema de niveles jerárquicos (Bronce → Diamante)
- ✅ Insignias desbloqueables con progreso porcentual
- ✅ Cupones automáticos por nivel alcanzado
- ✅ Persistencia en backend (PostgreSQL)
- ✅ Sincronización frontend-backend
- ✅ Descripciones de insignias interactivas

---

## 🔧 Cambios Implementados

### 1. Backend - Base de Datos

**Archivo:** `Backend/db/schema.sql`

Se añadieron las siguientes columnas a la tabla `profiles`:

```sql
-- Campos de gamificación
total_xp INTEGER DEFAULT 0,
total_packs_saved INTEGER DEFAULT 0,
total_reviews INTEGER DEFAULT 0,
unlocked_badges JSONB DEFAULT '[]'
```

### 2. Backend - Controlador de Perfiles

**Archivo:** `Backend/controllers/profileController.js`

Se implementaron dos nuevos endpoints:

#### GET `/api/profiles/gamification`
- Devuelve el estado de gamificación del usuario
- Incluye: XP total, packs salvados, ahorros, CO₂ evitado, insignias desbloqueadas

```javascript
exports.getGamification = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const result = await pool.query(
        `SELECT 
            COALESCE(p.total_xp, 0) AS total_xp,
            COALESCE(p.total_pedidos, 0) AS total_packs_saved,
            COALESCE(p.total_ahorrado, 0) AS total_savings,
            COALESCE(p.co2_ahorrado, 0) AS total_co2_saved,
            COALESCE(p.total_reviews, 0) AS total_reviews,
            COALESCE(p.unlocked_badges, '[]'::jsonb) AS unlocked_badges
         FROM profiles p
         WHERE p.user_id = $1`,
        [userId]
    );
    // ...
});
```

#### POST `/api/profiles/gamification`
- Registra XP ganada, packs salvados, nuevas insignias
- Actualiza totales acumulativos
- Evita duplicación de insignias

```javascript
exports.postGamification = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { xp_gained, packs_saved, savings, co2_saved, new_badges } = req.body;
    
    // Actualiza valores acumulativos
    await client.query(
        `UPDATE profiles SET
            total_xp = COALESCE(total_xp, 0) + $1,
            total_pedidos = COALESCE(total_pedidos, 0) + $2,
            total_ahorrado = COALESCE(total_ahorrado, 0) + $3,
            co2_ahorrado = COALESCE(co2_ahorrado, 0) + $4,
            // ...
        WHERE user_id = $5`,
        [xp_gained, packs_saved, savings, co2_saved, userId]
    );
    // ...
});
```

### 3. Backend - Rutas

**Archivo:** `Backend/routes/profileRoutes.js`

```javascript
// Gamification endpoints
router.get('/gamification', authMiddleware, profileController.getGamification);
router.post('/gamification', authMiddleware, profileController.postGamification);
```

### 4. Frontend - Pantalla de Recompensas

**Archivo:** `Frontend/app/RewardsScreen.js`

Se añadió interactividad a las insignias:

```javascript
const BadgeCard = ({ badge }) => {
  const handlePress = () => {
    let how = '';
    switch (badge.category) {
      case 'PACKS': how = `Rescata ${badge.requirement} pack(s) de comida.`; break;
      case 'ENVIRONMENT': how = `Evita ${badge.requirement} kg de CO₂`; break;
      case 'STREAK': how = `Mantén una racha de ${badge.requirement} días.`; break;
      case 'LEVEL': how = `Alcanza el nivel ${badge.requirement}.`; break;
      case 'SAVINGS': how = `Ahorra $${badge.requirement} MXN en total.`; break;
      // ...
    }
    
    Alert.alert(
      `${badge.name} ${isUnlocked ? '(Desbloqueada)' : ''}`,
      `${badge.description}\n\nCómo desbloquear:\n${how}`,
      [{ text: 'Cerrar' }]
    );
  };
  
  return (
    <TouchableOpacity onPress={handlePress}>
      {/* Badge UI */}
    </TouchableOpacity>
  );
};
```

### 5. Frontend - Contexto de Gamificación

**Archivo:** `Frontend/contexts/GamificationContext.js`

- Ya existente, se validó integración con los nuevos endpoints
- Sincroniza XP, insignias y cupones con el backend
- Detecta subida de nivel y otorga cupones automáticos

### 6. Script de Inicio - Simplificado y Robusto

**Archivo:** `scripts/start-dev.sh`

Se reescribió completamente para ser más robusto:

```bash
#!/usr/bin/env bash
set -e

# Limpieza de Docker
docker compose down -v 2>/dev/null || true

# Inicio de PostgreSQL
docker compose up -d postgres
# Espera hasta que esté listo...

# Aplicación de migraciones y seeds
node Backend/db/migrate.js
node Backend/db/seed.js
# ... más seeds

# Inicio de servicios
cd Backend && PORT=5001 node server.js &
cd Frontend && npm start &

# Verificación de credenciales
curl -X POST http://localhost:5001/api/auth/login \
  -d '{"email":"admindeli@delicrunch.com","password":"Admin1234"}'
```

---

## 🎮 Cómo Funciona el Sistema

### Flujo de Compra → EXP → Insignias → Cupones

1. **Compra de Pack**
   - Usuario compra un pack sorpresa
   - Se registra en `OrderConfirmationScreen.js`
   
2. **Cálculo de EXP**
   ```javascript
   const xp = calculateXP(packsSaved, savingsAmount, co2Avoided);
   // Fórmula: 32 XP base + 0.65 * ahorro + 6.5 * CO₂
   ```

3. **Registro en Backend**
   ```javascript
   await recordPurchase(packsSaved, savings, co2);
   // Llama a POST /api/profiles/gamification
   ```

4. **Verificación de Insignias**
   - Backend verifica condiciones de desbloqueo
   - Compara contra requisitos (packs, CO₂, racha, etc.)
   - Añade nuevas insignias al array `unlocked_badges`

5. **Subida de Nivel**
   - Si el XP acumulado alcanza el siguiente nivel
   - Se otorga automáticamente un cupón
   - Se notifica al usuario con `BadgeNotification`

6. **Cupones Desbloqueados**
   - Cada nivel tiene un cupón asociado (ver `gamification.js`)
   - Ejemplos:
     - **Nivel 2:** 5% descuento universal
     - **Nivel 4:** $15 OFF en comida mexicana
     - **Nivel 7:** 12% OFF universal (oro)
     - **Nivel 15:** 30% OFF + pack gratis mensual (diamante)

---

## 📊 Sistema de Niveles

| Tier | Niveles | XP Requerida | Recompensas |
|------|---------|--------------|-------------|
| 🥉 **Bronce** | 1-3 | 0 - 340 XP | Cupones básicos (5-10%) |
| 🥈 **Plata** | 4-6 | 675 - 1,755 XP | 2x1, descuentos por categoría |
| 🥇 **Oro** | 7-9 | 2,700 - 6,075 XP | Cupones premium (12-25%) |
| 💎 **Platino** | 10-12 | 8,775 - 16,875 XP | Exclusivos + prioridad |
| 💎 **Diamante** | 13-15 | 23,625 - 47,250 XP | Élite (30% + extras) |

---

## 🏆 Tipos de Insignias

### Por Packs Rescatados
- 🌱 **Primer Rescate** (1 pack)
- 🛡️ **Guardián Novato** (10 packs)
- ⭐ **Héroe Local** (50 packs) - RARA
- 🏆 **Salvador de Alimentos** (100 packs) - ÉPICA
- 🎗️ **Leyenda Anti-Desperdicio** (500 packs) - LEGENDARIA

### Por Impacto Ambiental
- 👣 **Pequeña Huella Verde** (10 kg CO₂)
- 🌍 **Eco-Guerrero** (100 kg CO₂)
- 🌐 **Protector del Planeta** (500 kg CO₂)
- ⚡ **Salvavidas Energético** (50 kWh)
- ⛈️ **Maestro de la Eficiencia** (200 kWh)

### Por Racha
- 📅 **Compromiso Semanal** (7 días)
- 📆 **Mes Dedicado** (30 días)
- 🏅 **Guardián del Año** (365 días)

### Por Ahorro
- 💰 **Ahorrador Inicial** ($100 MXN)
- 💵 **Comprador Inteligente** ($500 MXN)
- 💳 **Campeón del Ahorro** ($2,000 MXN)
- ✨ **Mago Financiero** ($10,000 MXN)

---

## 🎁 Sistema de Cupones

### Categorías de Cupones
- ⚡ **Vegetariano** - Descuentos en packs vegetarianos
- 🌶️ **Mexicano** - Tacos, quesadillas, etc.
- 🍰 **Repostería** - Postres y dulces
- ☕ **Café** - Packs de cafeterías
- 🍞 **Panadería** - Pan artesanal
- 🍣 **Sushi** - Comida japonesa
- 🍕 **Pizza** - Packs de pizzerías
- 🥗 **Saludable** - Opciones healthy
- 🌟 **Universal** - Cualquier categoría

### Tipos de Descuento
1. **Porcentual** (`percentage`) - ej: 15% OFF
2. **Fijo** (`fixed`) - ej: $25 OFF
3. **2x1** (`2x1`) - Lleva 2 paga 1
4. **Gratis** (`free_item`) - Pack gratis

---

## 🧪 Cómo Probar

### 1. Iniciar el Sistema

```bash
cd /workspaces/Delicrunch
./scripts/start-dev.sh
```

Verás algo como:

```
╔════════════════════════════════════════════════╗
║     Delicrunch Dev Environment                ║
╚════════════════════════════════════════════════╝

[1/5] Limpiando recursos...
[2/5] Iniciando PostgreSQL...
[3/5] Esperando PostgreSQL...
✓ PostgreSQL listo
[4/5] Configurando base de datos...
✓ Base de datos lista
[5/5] Iniciando servicios...
✓ Servicios iniciados

═══ Verificando Login ═══

✓ Admin login OK
✓ Merchant login OK
✓ Buyer login OK
Products: 31 items

═══ Ready ═══

Backend:   http://localhost:5001
Database:  localhost:5432 (postgres/Qazwsx1234)

Accounts:
  ├─ Admin:    admindeli@delicrunch.com / Admin1234
  ├─ Merchant: espiga@demo.com / Admin1234
  └─ Buyer:    comprador@delicrunch.com / Comprador123
```

### 2. Probar Login de Comprador

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"comprador@delicrunch.com","password":"Comprador123"}' | jq '.'
```

**Respuesta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 10,
    "rol": "comprador"
  }
}
```

### 3. Verificar Estado de Gamificación

```bash
TOKEN="<tu_token_aqui>"

curl -X GET http://localhost:5001/api/profiles/gamification \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Respuesta esperada (usuario nuevo):**
```json
{
  "total_xp": 0,
  "total_packs_saved": 0,
  "total_savings": "0.00",
  "total_co2_saved": "0.00",
  "total_reviews": 0,
  "unlocked_badges": []
}
```

### 4. Simular Compra y Ganancia de XP

```bash
curl -X POST http://localhost:5001/api/profiles/gamification \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "xp_gained": 150,
    "packs_saved": 3,
    "savings": 120,
    "co2_saved": 7.5,
    "new_badges": ["first_rescue", "novice_guardian"]
  }' | jq '.'
```

**Respuesta esperada:**
```json
{
  "msg": "Gamification updated",
  "total_xp": 150,
  "total_packs_saved": 3,
  "total_savings": "120.00",
  "total_co2_saved": "7.50",
  "total_reviews": 0,
  "unlocked_badges": [
    {
      "id": "first_rescue",
      "unlockedAt": "2026-01-13T16:30:00.000Z"
    },
    {
      "id": "novice_guardian",
      "unlockedAt": "2026-01-13T16:30:00.000Z"
    }
  ]
}
```

### 5. Probar en la App Móvil

1. **Abrir Expo Go**
   - Escanea el QR desde `frontend.log`
   - O visita http://localhost:19006 (web)

2. **Login como Comprador**
   - Email: `comprador@delicrunch.com`
   - Password: `Comprador123`

3. **Comprar un Pack**
   - Navega a productos
   - Selecciona un pack sorpresa
   - Completa el pago (simulado)
   
4. **Ver Recompensas**
   - En `OrderConfirmationScreen` verás: **+XP ganada**
   - Navega a **Recompensas** (tab inferior)
   - Verás:
     - Tu nivel actual (ej: Bronce II)
     - Barra de progreso hacia el siguiente nivel
     - Insignias con progreso porcentual
     - Cupones desbloqueados

5. **Tocar una Insignia**
   - Pulsa cualquier insignia
   - Verás un Alert con:
     - Descripción de la insignia
     - Cómo desbloquearla
     - Progreso actual (si no está desbloqueada)

---

## 🐛 Solución de Problemas

### Error: "relation \"users\" does not exist"

**Causa:** La base de datos no está inicializada.

**Solución:**
```bash
cd /workspaces/Delicrunch
node Backend/db/migrate.js
node Backend/db/seed.js
node Backend/db/seed-demo.js
node Backend/db/seed-delicias.js
node Backend/db/create-buyer.js
node Backend/db/seed-products-complete.js
```

### Error: Docker "file exists"

**Causa:** Contenedores previos no limpiados correctamente.

**Solución:**
```bash
docker compose down -v
docker system prune -f
# Luego reinicia: ./scripts/start-dev.sh
```

### Backend no responde

**Verificar si está corriendo:**
```bash
curl http://localhost:5001/ 
# Debería responder: "¡El servidor de Delicrunch está funcionando!"
```

**Si no responde:**
```bash
cd /workspaces/Delicrunch/Backend
PORT=5001 node server.js &
tail -f /tmp/backend.log  # Ver logs
```

### Frontend no carga

**Verificar proceso de Expo:**
```bash
ps aux | grep expo
```

**Reiniciar:**
```bash
cd /workspaces/Delicrunch/Frontend
npm start &
tail -f /workspaces/Delicrunch/frontend.log
```

---

## 📝 Logs y Monitoreo

### Logs Backend
```bash
tail -f /workspaces/Delicrunch/backend.log
# o
tail -f /tmp/backend.log
```

### Logs Frontend
```bash
tail -f /workspaces/Delicrunch/frontend.log
```

### Logs PostgreSQL
```bash
docker compose logs -f postgres
```

### Verificar Procesos Activos
```bash
# Backend
cat /workspaces/Delicrunch/Backend/server.pid
ps -p $(cat /workspaces/Delicrunch/Backend/server.pid)

# Frontend
cat /workspaces/Delicrunch/scripts/expo.pid
ps -p $(cat /workspaces/Delicrunch/scripts/expo.pid)
```

---

## ✅ Checklist de Validación

- [x] Backend responde en http://localhost:5001
- [x] PostgreSQL corriendo (docker compose ps)
- [x] Migraciones aplicadas (tabla `profiles` tiene columnas de gamificación)
- [x] Login de admin funciona
- [x] Login de merchant funciona
- [x] Login de buyer funciona
- [x] Endpoint GET `/api/profiles/gamification` devuelve datos
- [x] Endpoint POST `/api/profiles/gamification` actualiza XP e insignias
- [x] Frontend sincroniza con backend (GamificationContext)
- [x] Insignias son tocables y muestran descripción
- [x] Barras de progreso se actualizan correctamente
- [x] Cupones se crean al subir de nivel
- [x] Script `start-dev.sh` limpia Docker correctamente
- [x] Credenciales de prueba verificadas automáticamente

---

## 🚀 Próximos Pasos Sugeridos

1. **Testing E2E**
   - Crear flujo completo: registro → compra → verificar XP → verificar insignia
   - Automatizar con Cypress o Detox

2. **Notificaciones Push**
   - Integrar Firebase/Expo Notifications
   - Notificar cuando se desbloquea una insignia
   - Recordar usar cupones antes de expirar

3. **Leaderboard Real**
   - Implementar ranking global en backend
   - Mostrar top usuarios por ciudad/región
   - Sistema de "amigos" para comparar progreso

4. **Retos Ecológicos**
   - Crear retos semanales/mensuales
   - Bonos de XP por completar retos
   - Insignias especiales por participar

5. **Analytics**
   - Trackear engagement con sistema de recompensas
   - Medir tasa de retención por niveles
   - A/B testing de valores de XP y cupones

---

## 📞 Contacto y Soporte

Para dudas o problemas con el sistema de recompensas:

1. Revisa este documento
2. Consulta los logs (backend/frontend/postgres)
3. Verifica que todos los seeds se hayan aplicado
4. Comprueba que Docker esté corriendo correctamente

**Archivos clave:**
- Backend: `Backend/controllers/profileController.js`
- Frontend: `Frontend/contexts/GamificationContext.js`
- Constantes: `Frontend/src/constants/gamification.js`
- Pantalla: `Frontend/app/RewardsScreen.js`
- Script: `scripts/start-dev.sh`

---

**Fecha de última actualización:** 13 de Enero, 2026  
**Versión del sistema:** 1.0  
**Estado:** ✅ Validado y Funcionando
