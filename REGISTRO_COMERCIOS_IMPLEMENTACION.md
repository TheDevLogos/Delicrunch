# Implementación de Registro de Comercios

## 📋 Resumen de Cambios

Se ha implementado un sistema completo de registro para comercios que permite capturar toda la información necesaria para crear una tienda en la plataforma Delicrunch.

## 🎯 Funcionalidades Implementadas

### Frontend (RegisterScreen.js)

#### Nuevos Estados
Se agregaron los siguientes estados para capturar información del comercio:
- `nombreComercio`: Nombre del establecimiento
- `direccion`: Dirección completa del negocio
- `telefono`: Número de contacto
- `horario`: Horario de operación
- `descripcion`: Descripción del negocio
- `categoria`: Tipo de comercio (tacos, panadería, café, etc.)
- `latitud`: Coordenada de latitud (formato decimal)
- `longitud`: Coordenada de longitud (formato decimal)

#### Validaciones
1. **Campos Requeridos para Comercios**:
   - Nombre del comercio
   - Dirección
   - Teléfono
   - Categoría

2. **Validación de Coordenadas**:
   - Latitud: -90 a 90 grados
   - Longitud: -180 a 180 grados
   - Formato numérico decimal

3. **Campos Opcionales**:
   - Horario (default: "Por definir")
   - Descripción
   - Coordenadas (lat/lon)

#### UI Condicional
- Los campos específicos de comercio solo se muestran cuando se selecciona el rol "Comercio"
- Se agregó una sección titulada "Información del Comercio"
- Campos con iconos descriptivos para mejor UX
- Campo de descripción con soporte multilínea

#### Formato de Datos Enviados
```javascript
{
  nombre: "Juan Pérez",
  email: "juan@example.com",
  password: "******",
  rol: "comercio",
  storeData: {
    nombre_comercio: "Tacos Don Juan",
    direccion: "Av. Principal 123, Centro",
    telefono: "+52 639 123 4567",
    horario: "Lun-Dom 8:00 AM - 10:00 PM",
    descripcion: "Los mejores tacos de la ciudad",
    categoria: "tacos",
    latitud: 28.2722,
    longitud: -105.4817
  }
}
```

### Backend (authController.js)

#### Validaciones del Servidor
1. **Validación de Campos Requeridos**:
   - Verifica que todos los campos obligatorios estén presentes
   - Retorna error 400 si faltan campos

2. **Validación de Coordenadas**:
   - Valida rangos correctos de latitud y longitud
   - Permite valores null/undefined (opcionales)

3. **Registro en Base de Datos**:
   ```sql
   INSERT INTO stores 
   (user_id, nombre_comercio, direccion, latitud, longitud, telefono, 
    horario, descripcion, categoria, activo) 
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
   ```

#### Campos Almacenados en la Tabla `stores`
- `user_id`: Relación con el usuario
- `nombre_comercio`: Nombre del negocio
- `direccion`: Dirección completa
- `latitud`: Coordenada decimal (DECIMAL(10, 8))
- `longitud`: Coordenada decimal (DECIMAL(11, 8))
- `telefono`: Número de contacto
- `horario`: Horario de atención
- `descripcion`: Descripción del negocio
- `categoria`: Tipo de comercio
- `activo`: Estado (true por defecto)

#### Respuesta del Servidor
- **Éxito (201)**: Retorna token JWT para autenticación inmediata
- **Error (400)**: Mensaje descriptivo del problema
  - Email ya registrado
  - Campos faltantes
  - Coordenadas inválidas

## 🔐 Flujo de Autenticación

### 1. Registro
```
Usuario → RegisterScreen → API (/api/auth/register) → authController.registerUser
                                                      ↓
                                              Crear Usuario en DB
                                                      ↓
                                              Crear Store en DB
                                                      ↓
                                              Generar Token JWT
                                                      ↓
                                              Retornar Token
```

### 2. Token JWT
El token generado contiene:
```javascript
{
  user: {
    id: 123,
    rol: "comercio"
  }
}
```
- Validez: 5 horas
- Firmado con JWT_SECRET
- Se almacena en AsyncStorage del cliente
- Se incluye automáticamente en todas las peticiones subsecuentes (via interceptor)

### 3. Middleware de Autenticación
El token se inyecta automáticamente en cada petición mediante el interceptor de axios:
```javascript
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});
```

## 📍 Formato de Coordenadas

### Especificación
- **Formato**: Decimal Degrees (DD)
- **Latitud**: -90.0 a 90.0 (negativo = sur, positivo = norte)
- **Longitud**: -180.0 a 180.0 (negativo = oeste, positivo = este)

### Ejemplos para Chihuahua
```javascript
// Meoqui
{ latitud: 28.2722, longitud: -105.4817 }

// Delicias
{ latitud: 28.1910, longitud: -105.4708 }

// Camargo
{ latitud: 27.6833, longitud: -105.1667 }
```

### Compatible con Google Maps API
```javascript
const location = {
  lat: parseFloat(store.latitud),
  lng: parseFloat(store.longitud)
};

// Uso en react-native-maps
<MapView
  initialRegion={{
    latitude: store.latitud,
    longitude: store.longitud,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }}
>
  <Marker
    coordinate={{
      latitude: store.latitud,
      longitude: store.longitud,
    }}
    title={store.nombre_comercio}
  />
</MapView>
```

## 🔄 Endpoints Relacionados

### Registro de Comercio
- **Endpoint**: `POST /api/auth/register`
- **Autenticación**: No requerida
- **Body**: Ver formato en sección "Formato de Datos Enviados"
- **Respuesta**: `{ token: "jwt_token_here" }`

### Login
- **Endpoint**: `POST /api/auth/login`
- **Autenticación**: No requerida
- **Body**: `{ email, password }`
- **Respuesta**: `{ token: "jwt_token_here" }`

## ✅ Validación del Sistema

### Checklist de Funcionalidad
- [x] Campos adicionales se muestran al seleccionar "Comercio"
- [x] Validación de campos requeridos en frontend
- [x] Validación de formato de coordenadas
- [x] Envío correcto de datos a backend
- [x] Validación de datos en backend
- [x] Creación de usuario en tabla `users`
- [x] Creación de tienda en tabla `stores` con todos los campos
- [x] Generación de token JWT
- [x] Almacenamiento de token en cliente
- [x] Redirección a Login tras registro exitoso

### Casos de Prueba Recomendados

#### 1. Registro Exitoso de Comercio
```javascript
{
  nombre: "Test Comercio",
  email: "test@comercio.com",
  password: "123456",
  confirmPassword: "123456",
  rol: "comercio",
  storeData: {
    nombre_comercio: "Tacos Test",
    direccion: "Calle Test 123",
    telefono: "+52 639 123 4567",
    categoria: "tacos",
    latitud: 28.2722,
    longitud: -105.4817,
    horario: "9:00 AM - 9:00 PM",
    descripcion: "Tacos de prueba"
  }
}
```

#### 2. Validación de Coordenadas Inválidas
```javascript
// Debe fallar
latitud: 100  // > 90
longitud: -200  // < -180
```

#### 3. Campos Opcionales
```javascript
// Debe funcionar sin horario ni descripción
storeData: {
  nombre_comercio: "Tacos Test",
  direccion: "Calle Test 123",
  telefono: "+52 639 123 4567",
  categoria: "tacos"
  // horario y descripcion omitidos
}
```

## 🎨 Nuevos Estilos Agregados

```javascript
sectionTitle: {
  marginTop: SPACING.md,
  marginBottom: SPACING.sm,
  paddingLeft: SPACING.xs,
},
sectionTitleText: {
  fontSize: 16,
  fontWeight: '700',
  color: COLORS.primary,
},
coordinatesRow: {
  flexDirection: 'row',
  gap: SPACING.md,
},
coordinateInput: {
  flex: 1,
},
textArea: {
  height: 80,
  textAlignVertical: 'top',
  paddingTop: SPACING.md,
}
```

## 🚀 Próximos Pasos Sugeridos

1. **Selector de Ubicación en Mapa**:
   - Integrar selector visual de coordenadas
   - Autocompletar dirección desde coordenadas

2. **Validación de Teléfono**:
   - Formateo automático (+52 XXX XXX XXXX)
   - Validación de número válido

3. **Categorías Predefinidas**:
   - Dropdown con categorías comunes
   - Evitar errores tipográficos

4. **Upload de Logo**:
   - Implementar en pantalla de perfil
   - No incluido en registro inicial (como solicitado)

5. **Verificación de Comercio**:
   - Sistema de aprobación manual
   - Estado "pendiente" → "aprobado"

## 📝 Notas Técnicas

- Las coordenadas se almacenan como DECIMAL en PostgreSQL para precisión
- El formato decimal permite compatibilidad directa con APIs de mapas
- El token JWT incluye el rol del usuario para autorización
- Los campos opcionales pueden ser null en la base de datos
- El interceptor de axios maneja automáticamente la autenticación

## 🐛 Troubleshooting

### Problema: Coordenadas no se guardan
- **Solución**: Verificar que se envíen como números, no strings
- Frontend: `parseFloat(latitud)`
- Backend: Validar que no sean NaN

### Problema: Error 400 "Incluye todos los campos"
- **Solución**: Verificar que `storeData` tenga todos los campos requeridos
- Campos obligatorios: nombre_comercio, direccion, telefono, categoria

### Problema: Token no persiste
- **Solución**: Verificar que el token se guarda tras registro exitoso
- Agregar: `await AsyncStorage.setItem('userToken', response.data.token);`

---

**Fecha de Implementación**: Enero 2026  
**Versión**: 1.0  
**Estado**: ✅ Completado
