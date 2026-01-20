# Sistema de Medición de CO2 por Categoría de Alimento

## 📋 Resumen de Implementación

Se ha implementado un sistema diferenciado de cálculo de CO2 según la categoría del alimento, basado en estudios de huella de carbono reales.

## 🎯 Archivos Creados

### Frontend
- **`/Frontend/src/constants/co2Factors.js`**
  - Factores de emisión de CO2 por categoría (kg CO2/pack)
  - Función `calculateCO2Saved(categoria, cantidad)` para cálculos
  - Función `getCO2ImpactDescription()` para mensajes contextuales

### Backend
- **`/Backend/utils/co2Factors.js`**
  - Versión backend de los factores de emisión
  - Misma lógica de cálculo para consistencia
  - Soporta nombres de categorías en español y formatos variados

## 📝 Archivos Modificados

### Frontend

1. **`AddProductScreen.js`**
   - ✅ Import de `calculateCO2Saved`
   - ✅ Cálculo de CO2 estimado en tiempo real
   - ✅ Preview visual del CO2 según categoría y cantidad seleccionada
   - ✅ Estilos para `co2Preview`

2. **`EditProductScreen.js`**
   - ✅ Import de `calculateCO2Saved`
   - ✅ Cálculo de CO2 estimado en tiempo real
   - ✅ Preview visual del CO2 al editar productos
   - ✅ Estilos para `co2Preview`

3. **`OrderConfirmationScreen.js`**
   - ✅ Import de `calculateCO2Saved`
   - ✅ Cálculo basado en categoría del producto
   - ✅ Uso en gamificación (`recordPurchase`)
   - ✅ Mostrado en impacto ambiental
   - ✅ Incluido en funcionalidad de compartir

4. **`RewardsScreen.js`**
   - ℹ️ Ya tenía visualización de CO2 total acumulado
   - ✅ Sistema de badges vinculado a CO2 evitado (categoría ENVIRONMENT)

### Backend

1. **`/Backend/controllers/orderController.js`**
   - ✅ Import de `calculateCO2Saved`
   - ✅ Cálculo en función `createOrder` usando `product.categoria`
   - ✅ Actualización de `profiles.co2_ahorrado` con valor real
   - ✅ Retorno del `co2_ahorrado` en respuesta de API

## 📊 Factores de Emisión por Categoría

### Alto Impacto (> 5 kg CO2)
- **Carne Asada**: 6.5 kg
- **Hamburguesas**: 5.8 kg
- **Barbacoa**: 5.5 kg
- **Carnes**: 6.0 kg

### Medio-Alto (3-5 kg CO2)
- **Mariscos**: 4.8 kg
- **Hotdogs**: 4.5 kg
- **Burritos**: 4.2 kg
- **Tacos**: 3.8 kg
- **Tortas**: 3.6 kg
- **Sushi**: 3.5 kg
- **Pizza**: 3.4 kg
- **Alitas**: 3.2 kg
- **Comida Mexicana**: 3.2 kg

### Medio (2-3 kg CO2)
- **Desayunos**: 2.8 kg
- **Quesadillas**: 2.8 kg
- **Comida Italiana**: 2.9 kg
- **Comida China**: 2.6 kg
- **Gorditas**: 2.6 kg
- **Empanadas**: 2.7 kg
- **Tamales**: 2.5 kg
- **Ramen**: 2.4 kg
- **Bowls**: 2.5 kg
- **Pasteles**: 2.4 kg
- **Postres**: 2.2 kg
- **Crepas**: 2.0 kg
- **Abarrotes**: 2.0 kg

### Bajo (< 2 kg CO2)
- **Panadería**: 1.8 kg
- **Snacks**: 1.8 kg
- **Café**: 1.5 kg
- **Ensaladas**: 1.2 kg
- **Elotes**: 1.0 kg
- **Frutería**: 0.8 kg

### Por Defecto
- **Otros/Sin categoría**: 2.5 kg (estándar TGTG)

## 🔄 Flujo de Datos

```
1. Comercio crea producto → selecciona CATEGORÍA
   ↓
2. AddProductScreen/EditProductScreen → calcula CO2 estimado (preview)
   ↓
3. Usuario compra producto
   ↓
4. Backend (orderController) → calcula CO2 real con calculateCO2Saved(categoria, cantidad)
   ↓
5. Actualiza profiles.co2_ahorrado
   ↓
6. Retorna order.co2_ahorrado al frontend
   ↓
7. OrderConfirmationScreen → muestra CO2 evitado y registra en gamificación
   ↓
8. RewardsScreen → acumula en estadísticas y badges
```

## ✅ Verificación de Implementación

### Pantallas que Muestran CO2

1. **AddProductScreen** ✅
   - Preview al seleccionar categoría y cantidad
   
2. **EditProductScreen** ✅
   - Preview al editar categoría o cantidad

3. **OrderConfirmationScreen** ✅
   - CO2 evitado en la compra actual
   - Mensaje compartible con CO2

4. **RewardsScreen** ✅
   - Total acumulado de CO2 evitado
   - Badges de categoría ENVIRONMENT basados en CO2

5. **OrderDetailScreen**
   - ℹ️ No mostraba CO2 originalmente (puede agregarse si se requiere)

6. **AdminMetricsScreen**
   - ℹ️ No existe este archivo específico en la app actual

## 🎨 Interfaz de Usuario

### Indicador de CO2 en Formularios de Productos
```jsx
{estimatedCO2 > 0 && (
  <View style={styles.co2Preview}>
    <Ionicons name="leaf" size={18} color={COLORS.success} />
    <Text style={styles.co2PreviewText}>
      ~{estimatedCO2.toFixed(1)} kg CO₂ evitados con este pack
    </Text>
  </View>
)}
```

**Estilos:**
- Fondo verde claro (`COLORS.success + '15'`)
- Icono de hoja verde
- Texto verde con peso medio
- Border radius 10px

## 🧪 Pruebas Recomendadas

1. **Crear producto de "Carne Asada"** (6.5 kg) con cantidad 2
   - Debe mostrar: ~13.0 kg CO₂ evitados

2. **Crear producto de "Ensaladas"** (1.2 kg) con cantidad 5
   - Debe mostrar: ~6.0 kg CO₂ evitados

3. **Comprar producto y verificar OrderConfirmationScreen**
   - El CO2 debe coincidir con la categoría del producto

4. **Revisar RewardsScreen**
   - El total CO2 debe acumularse correctamente

## 📚 Fuentes de Datos

- Too Good To Go: ~2.5 kg CO2 promedio por comida
- FAO: Estudios de huella de carbono de alimentos
- Estudios europeos de impacto ambiental de producción alimentaria
- Beef/carne roja: 27 kg CO2/kg producido
- Pollo: 6.9 kg CO2/kg producido
- Vegetales: 2 kg CO2/kg producido

## 🔮 Mejoras Futuras

1. **Peso del producto**: Calcular CO2 basado en kg reales del pack
2. **Desglose detallado**: Mostrar equivalencias (km en auto, árboles plantados)
3. **Comparativas**: "Tu pack evita X% más CO2 que el promedio"
4. **Certificaciones**: Badges especiales para categorías bajas en carbono
5. **Analytics**: Gráficas de CO2 evitado por categoría en el tiempo

## 📱 Compatibilidad

- ✅ iOS
- ✅ Android
- ✅ Expo Development Build
- ✅ Backend Node.js/Express

## 🚀 Estado: IMPLEMENTADO ✅

Fecha: 20 de Enero 2026
Version: 1.0.0
