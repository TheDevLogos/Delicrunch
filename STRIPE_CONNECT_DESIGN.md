# 🎨 STRIPE CONNECT - Diseño Visual TGTG

## Capturas de Pantalla y Diseño

Este documento muestra el diseño visual implementado siguiendo la estética de Too Good To Go.

---

## 📱 MerchantDashboardScreen (Dashboard de Comercio)

### Vista Completa

```
╔═════════════════════════════════════════════╗
║  [HERO con imagen de fondo]                 ║
║  ╔═══════════════════════════════════════╗  ║
║  ║ [🏪]  ¡Bienvenido! 👋          [💡]   ║  ║
║  ║       Mi Tienda                        ║  ║
║  ║       ⭐ 4.5 • 12 reseñas              ║  ║
║  ║                                        ║  ║
║  ║  $1,250  |  3  |  8                   ║  ║
║  ║  Hoy     Pend  Hoy                    ║  ║
║  ╚═══════════════════════════════════════╝  ║
╠═════════════════════════════════════════════╣
║  ⚠️  Configura tu cuenta de pagos           ║ ← Warning
║      Conecta tu cuenta bancaria con Stripe  ║
╠═════════════════════════════════════════════╣
║  📊 Métricas Principales                    ║
║  ┌──────────────┐  ┌──────────────┐        ║
║  │ 💰 $3,250    │  │ 📦 15        │        ║
║  │ Total Ventas │  │ Pedidos      │        ║
║  └──────────────┘  └──────────────┘        ║
╠═════════════════════════════════════════════╣
║  📋 Pedidos Recientes                       ║
║  ┌─────────────────────────────────────┐   ║
║  │ #AB-123  [Pendiente]               │   ║
║  │ Pack Sorpresa Premium              │   ║
║  │ Juan Pérez            $150.00      │   ║
║  └─────────────────────────────────────┘   ║
╠═════════════════════════════════════════════╣
║  ⚡ Acciones Rápidas                        ║
║  ┌───┐  ┌───┐  ┌───┐  ┌───┐              ║
║  │ + │  │🏷️ │  │💳 │  │💬 │              ║
║  │   │  │   │  │   │  │   │              ║
║  │New│  │Pro│  │Pay│  │Rev│              ║
║  └───┘  └───┘  └───┘  └───┘              ║
╚═════════════════════════════════════════════╝
```

### Colores del Warning

```
┌────────────────────────────────────────┐
│ [⚠️]  Configura tu cuenta de pagos     │ ← Fondo: #FFF4E5
│       Conecta tu cuenta bancaria       │   Borde: #FF9500
│                                   [→] │   Texto: #CC7A00
└────────────────────────────────────────┘
```

---

## 💳 MerchantPaymentSettingsScreen

### Estado: Sin Cuenta Configurada

```
╔═════════════════════════════════════════════╗
║  [←] Configuración de Pagos                 ║
╠═════════════════════════════════════════════╣
║                                              ║
║  🏦 Estado de tu Cuenta                      ║
║  ┌──────────────────────────────────────┐   ║
║  │ [ℹ️]  No has configurado tu cuenta   │   ║
║  │                                       │   ║
║  │ Para recibir pagos por tus ventas,   │   ║
║  │ necesitas conectar una cuenta        │   ║
║  │ bancaria con Stripe.                 │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  📊 Comisiones                               ║
║  ┌──────────────────────────────────────┐   ║
║  │ Comercio recibe:    75% ████████     │   ║
║  │ Plataforma cobra:   25% ██           │   ║
║  │                                       │   ║
║  │ ℹ️ Las comisiones se aplican         │   ║
║  │    automáticamente en cada venta     │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  ┌──────────────────────────────────────┐   ║
║  │      [Conectar con Stripe]           │   ║ ← Botón verde
║  └──────────────────────────────────────┘   ║
║                                              ║
║  Serás redirigido a Stripe para completar   ║
║  tu cuenta de forma segura                  ║
║                                              ║
╚═════════════════════════════════════════════╝
```

### Estado: Cuenta Activa

```
╔═════════════════════════════════════════════╗
║  [←] Configuración de Pagos                 ║
╠═════════════════════════════════════════════╣
║                                              ║
║  🏦 Estado de tu Cuenta                      ║
║  ┌──────────────────────────────────────┐   ║
║  │ [✅] Puede recibir pagos             │   ║ ← Verde #10B981
║  │ [✅] Puede recibir transferencias    │   ║
║  │ [✅] Información completa            │   ║
║  │ ─────────────────────────────────    │   ║
║  │ Tipo: Express                        │   ║
║  │ País: México                         │   ║
║  │ Email: comercio@example.com          │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  💰 Balance                                  ║
║  ┌──────────────────────────────────────┐   ║
║  │ ╔════════════════════════════════╗   │   ║
║  │ ║ [GRADIENT #036B52 → #024A38]  ║   │   ║ ← LinearGradient
║  │ ║                                ║   │   ║
║  │ ║ Disponible    |    Pendiente   ║   │   ║
║  │ ║ $1,250.50 MXN | $350.00 MXN    ║   │   ║
║  │ ║                                ║   │   ║
║  │ ╚════════════════════════════════╝   │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  📊 Comisiones                               ║
║  ┌──────────────────────────────────────┐   ║
║  │ Comercio recibe:    75% ████████     │   ║ ← Verde
║  │ Plataforma cobra:   25% ██           │   ║ ← Azul
║  └──────────────────────────────────────┘   ║
║                                              ║
║  📅 Próximos Pagos                           ║
║  ┌──────────────────────────────────────┐   ║
║  │ [✅] Pagado                          │   ║
║  │ $1,250.50 MXN                        │   ║
║  │ Llegada: 16 Ene 2025  | Transferenc │   ║
║  └──────────────────────────────────────┘   ║
║  ┌──────────────────────────────────────┐   ║
║  │ [⏳] Pendiente                       │   ║ ← Naranja
║  │ $350.00 MXN                          │   ║
║  │ Llegada: 20 Ene 2025  | Transferenc │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  ┌──────────────────────────────────────┐   ║
║  │      [Gestionar Cuenta]              │   ║ ← Botón verde
║  └──────────────────────────────────────┘   ║
║                                              ║
╚═════════════════════════════════════════════╝
```

### Estado: Cuenta Incompleta

```
╔═════════════════════════════════════════════╗
║  [←] Configuración de Pagos                 ║
╠═════════════════════════════════════════════╣
║                                              ║
║  🏦 Estado de tu Cuenta                      ║
║  ┌──────────────────────────────────────┐   ║
║  │ [❌] No puede recibir pagos aún      │   ║ ← Rojo/Naranja
║  │ [❌] No puede recibir transferenc... │   ║
║  │ [⚠️]  Información incompleta         │   ║ ← Naranja
║  │ ─────────────────────────────────    │   ║
║  │ Tipo: Express                        │   ║
║  │ País: México                         │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  📊 Comisiones                               ║
║  ┌──────────────────────────────────────┐   ║
║  │ Comercio recibe:    75%              │   ║
║  │ Plataforma cobra:   25%              │   ║
║  └──────────────────────────────────────┘   ║
║                                              ║
║  ┌──────────────────────────────────────┐   ║
║  │    [Continuar Configuración]         │   ║ ← Botón naranja
║  └──────────────────────────────────────┘   ║
║                                              ║
╚═════════════════════════════════════════════╝
```

---

## 🎨 Paleta de Colores

### Colores Principales

```css
/* Verde principal TGTG */
#036B52 ████████  COLORS.primary
#024A38 ████████  COLORS.primaryDark

/* Semafóro de estados */
#10B981 ████████  COLORS.success (Verde éxito)
#F59E0B ████████  COLORS.warning (Naranja advertencia)
#EF4444 ████████  COLORS.error (Rojo error)
#3B82F6 ████████  COLORS.info (Azul info)

/* Textos */
#1A1A1A ████████  COLORS.text (Negro)
#6B7280 ████████  COLORS.textSecondary (Gris)
#9CA3AF ████████  COLORS.textLight (Gris claro)

/* Fondos */
#FFFFFF ████████  COLORS.white (Blanco)
#F8F9FA ████████  COLORS.surface (Gris muy claro)
#E5E7EB ████████  COLORS.border (Borde)
```

### Gradientes

```css
/* Balance Card */
LinearGradient
  colors: [#036B52, #024A38]
  start: {x: 0, y: 0}
  end: {x: 1, y: 1}

/* Hero Header */
LinearGradient
  colors: ['rgba(0,0,0,0.3)', 'rgba(3,107,82,0.85)']
```

---

## 🔲 Componentes Visuales

### Cards con Sombras

```javascript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}
```

### Iconos de Estado

```
✅ checkmark-circle  → Verde #10B981  → Activo
⚠️  alert-circle     → Naranja #F59E0B → Advertencia
❌ close-circle      → Rojo #EF4444    → Error
ℹ️  information      → Azul #3B82F6    → Info
⏳ time-outline      → Naranja #F59E0B → Pendiente
```

### Barras de Comisión

```
Comercio (75%):
████████████████████████████  Verde #10B981

Plataforma (25%):
█████████  Azul #036B52
```

---

## 📐 Dimensiones y Espaciado

### Spacing System

```javascript
SPACING.xs  = 4px   // Extra small
SPACING.sm  = 8px   // Small
SPACING.md  = 16px  // Medium (default)
SPACING.lg  = 24px  // Large
SPACING.xl  = 32px  // Extra large
```

### Typography

```javascript
// Títulos
fontSize: 24, fontWeight: '700'  → Títulos principales
fontSize: 18, fontWeight: '700'  → Secciones
fontSize: 17, fontWeight: '700'  → Botones

// Texto normal
fontSize: 15, fontWeight: '400'  → Cuerpo
fontSize: 14, fontWeight: '400'  → Secundario
fontSize: 13, fontWeight: '400'  → Labels

// Valores numéricos
fontSize: 22-24, fontWeight: '700'  → Montos grandes
```

### Border Radius

```javascript
12px  → Cards, botones
30px  → Avatares circulares
```

---

## 🎯 Estados Interactivos

### Loading State

```
┌─────────────────────────────┐
│                              │
│    [Spinner animado]         │
│    Cargando configuración... │
│                              │
└─────────────────────────────┘
```

### Pull to Refresh

```
     ↓  [Spinner]
┌─────────────────────────────┐
│ Contenido                    │
│ ...                          │
```

### Button States

```javascript
// Normal
backgroundColor: COLORS.primary
opacity: 1.0

// Pressed
backgroundColor: COLORS.primaryDark
opacity: 0.9

// Disabled
backgroundColor: COLORS.primary
opacity: 0.6
```

---

## 🌈 Variaciones de Diseño

### Warning Styles

**Stripe Not Configured:**
```
┌────────────────────────────────┐
│ [⚠️]  Configura tu cuenta      │
│       Texto explicativo        │
│                           [→] │
└────────────────────────────────┘
backgroundColor: #FFF4E5
borderLeftColor: #FF9500
borderLeftWidth: 4
```

**Info:**
```
┌────────────────────────────────┐
│ [ℹ️]  Información importante   │
│       Texto explicativo        │
└────────────────────────────────┘
backgroundColor: #E3F2FD
borderLeftColor: #3B82F6
```

**Success:**
```
┌────────────────────────────────┐
│ [✅] Operación exitosa         │
│      Cuenta configurada        │
└────────────────────────────────┘
backgroundColor: #F0FDF4
borderLeftColor: #10B981
```

---

## 🎬 Animaciones

### Fade In
```javascript
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
})
```

### Slide Up
```javascript
Animated.spring(translateY, {
  toValue: 0,
  tension: 65,
  friction: 11,
  useNativeDriver: true,
})
```

---

## 📱 Responsive Design

### Phone (width < 375)
- Fuentes más pequeñas
- Padding reducido
- Cards más compactas

### Tablet (width > 768)
- Columnas múltiples
- Más espacio en blanco
- Cards más anchas

---

**Diseño implementado siguiendo las guías de Too Good To Go**

*Colores, tipografía y componentes alineados con TGTG design system*
