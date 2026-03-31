# 🔍 AUDITORÍA: Implementación Portada de Tiendas (Cover URL)

**Fecha:** 31 Mar 2026  
**Estado:** Análisis completado - SEGURO para implementar

---

## 📊 ESTADO ACTUAL

### ✅ Base de Datos (Schema)
- **Tabla:** `stores`
- **Columnas Existentes:**
  - `logo_url TEXT` — URL del logo de la tienda (ya existe)
  - `cover_url TEXT` — URL de portada/banner (ya existe)
- **Seed Data:** Taquería Delicias tiene `cover_url` poblado en seed
- **Riesgo:** NINGUNO — columnas inactivas, no usadas

### ❌ Backend (Controllers & Routes)

| Área | Estado | Detalle |
|------|--------|---------|
| `storeController.getAllStores()` | ❌ Falta | SELECT no incluye `cover_url` |
| `storeController.getStoresWithProducts()` | ❌ Falta | SELECT no incluye `cover_url` |
| `storeController.getStoreById()` | ❌ Falta | SELECT no incluye `cover_url` |
| `PUT /api/stores/me` | ❌ No existe | Endpoint para actualizar tienda propia |
| `PUT /api/stores/:id/cover` | ❌ No existe | Endpoint para upload de portada |
| **Riesgo:** BAJO — nuevas columnas en SELECT, no rompe queries existentes |

### ❌ Frontend (UI Components)

| Pantalla | Estado | Detalle |
|----------|--------|---------|
| `StoreProfileScreen.js` | ⚠️ Sin uso | NO renderiza `cover_url` (no busca campo) |
| `MerchantDashboardScreen.js` | ✅ Existente | Panel comercio, puede agregar botón |
| `ProfileScreen.js` (comprador) | ✅ Existente | Puede subir foto perfil (ya lo hace) |
| `EditProfileScreen.js` | ✅ Existente | Permite editar perfil comprador |
| **Riesgo:** NINGUNO — nadie depende de `cover_url` aún |

---

## ✅ COMPONENTES QUE SE PUEDEN REUTILIZAR

### Backend - Profile Endpoint (para referencia)
- **Archivo:** `Backend/controllers/profileController.js`
- **Función:** `exports.updateProfile = async (...)`
- **Patrón:** Usa `FormData` + `multipart/form-data`, soporta upload
- **Usa:** `pool.query()` con transacciones
- **Seguro copiar este patrón:** SÍ (auditoría reciente)

### Frontend - Image Upload
- **Archivo:** `Frontend/app/ProfileScreen.js`
- **Componente:** `pickLogo()` + `uploadLogo()`
- **Patrón:** `expo-image-picker` → `FormData` → `api.put()`
- **Seguro copiar este patrón:** SÍ (ya validado)

### Frontend - Hero Image Display
- **Archivo:** `Frontend/app/ProductDetailScreen.js`
- **Patrón:** Hero 280px alto, `Image` con fallback URL
- **Seguro reutilizar:** SÍ (patrón TGTG confirmado)

---

## 🚨 COMPONENTES EXISTENTES A NO ROMPER

| Archivo | Crítico | Razón |
|---------|---------|-------|
| storeController - getAllStores | CRÍTICO | Usado por HomeScreen, DiscoverScreen, BrowseScreen |
| storeController - getStoreById | CRÍTICO | Usado por StoreProfileScreen (perfil tienda) |
| StoreProfileScreen.js | CRÍTICO | Visitada por compradores constantemente |
| MerchantDashboardScreen.js | MEDIO | Panel admin comercio, no blocking |

**Plan:** Agregar `cover_url` a SELECT sin REMOVER campos existentes → 100% backward compatible

---

## 📋 LISTA DE CAMBIOS A HACER

### FASE 1: Backend (30 min)
- [ ] **Actualizar `storeController.getAllStores()`** — agregar `cover_url` al SELECT
- [ ] **Actualizar `storeController.getStoresWithProducts()`** — agregar `cover_url` al SELECT
- [ ] **Actualizar `storeController.getStoreById()`** — agregar `cover_url` al SELECT
- [ ] **Crear `PUT /api/stores/me/cover`** — endpoint para upload
- [ ] **Crear `PUT /api/stores/:id`** (admin only o owner) — endpoint para actualizar tienda
- [ ] **No tocar:** profileController, authController, paymentController

### FASE 2: Frontend (1.5 h)
- [ ] **Actualizar `StoreProfileScreen.js`** — agregar hero/banner con `cover_url`
- [ ] **Crear `UploadCoverModal.js`** — componente modal reutilizable
- [ ] **Actualizar `MerchantDashboardScreen.js`** — agregar botón para editar portada
- [ ] **No tocar:** ProfileScreen (comprador), AuthContext, AppNavigator

### FASE 3: Testing (20 min)
- [ ] Verificar que `GET /stores/:id` devuelve `cover_url`
- [ ] Test upload de cover en merchant panel
- [ ] Verificar fallback si `cover_url` es NULL en frontend
- [ ] Verificar que compradores ven portada en `StoreProfileScreen`

---

## 🔒 GARANTÍAS DE NO DUPLICAR/ROMPER

✅ **NO HAY DUPLICACIÓN:**
- Portada de tienda = `cover_url` (no se llama portada ni hero en otro lado)
- Foto de perfil comprador ≠ portada tienda (son tablas diferentes: profiles vs stores)
- Ya existe columna → no hay conflicto de nombres

✅ **NO ROMPE COMPONENTES:**
- Agregar `cover_url` al SELECT NO rompe queries (es `*` o campos no afectan)
- Nuevo endpoint `PUT /api/stores/me/cover` NO interfiere con existentes
- Frontend renderiza fallback si `cover_url` es NULL

✅ **TODO.MD CONSISTENT:**
- Este cambio NO existe en todo.md aún → primera vez haciendo esto
- Google Play no requiere portada de tienda (comprador no ve en listings)
- Mejora UX interna (compradores ven tienda realista)

---

## 🎯 CÓDIGO LISTO PARA COPIAR

### Pattern Backend (ProfileController reference)
```javascript
const uploadProfilePhoto = async (userId, filePath) => {
  const formData = new FormData();
  formData.append('foto_perfil', {
    uri: filePath,
    name: `profile_${userId}_${Date.now()}.jpg`,
    type: 'image/jpeg',
  });

  const result = await pool.query(
    'UPDATE profiles SET foto_perfil = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
    [uploadUrl, userId]
  );
  return result.rows[0];
};
```

### Pattern Frontend (ProfileScreen reference)
```javascript
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [16, 9], // Para portada
    quality: 0.8,
  });
  
  if (!result.canceled && result.assets?.length > 0) {
    await uploadCover(result.assets[0].uri);
  }
};
```

---

## 📌 DECISIONES FINALES

1. **¿Migración SQL necesaria?** NO — columna ya existe en schema
2. **¿Riesgos de romper?** NO — cambios son aditivos
3. **¿Duplica features?** NO — portada ≠ foto perfil (stores vs profiles)
4. **¿En todo.md?** NO — crear nuevas líneas bajo "V. Portada Tiendas"
5. **¿Ready to code?** ✅ SÍ — empezar ahora con backend SELECT

---

## 🚀 NEXT STEPS

1. Update backend SELECTs to include `cover_url` (+5 min)
2. Create `PUT /stores/me/cover` endpoint (+15 min)  
3. Update `StoreProfileScreen` hero Image (+20 min)
4. Create `UploadCoverModal` component (+30 min)
5. Test E2E (+15 min)
6. Commit y push

**Total: ~1h 25 min**
