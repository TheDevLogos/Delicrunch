# SOLUCIÓN: Value<!doctype of type java.lang.String cannot be converted to JSONObject

## ✅ Problema Resuelto

El error `Value<!doctype of type java.lang.String cannot be converted to JSONObject` ocurría porque:

1. **El backend respondía con HTML en lugar de JSON** en algunas rutas
2. **Localtunnel devolvía páginas de verificación HTML** la primera vez
3. **Errores del servidor** devolvían páginas HTML de error

## 🔧 Cambios Implementados

### 1. Backend Corregido ([Backend/server.js](Backend/server.js))

**Antes:**
```javascript
app.get('/', (req, res) => {
    res.send('¡El servidor de Delicrunch está funcionando!');
});
```

**Después:**
```javascript
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Delicrunch API está funcionando',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
```

### 2. Middleware para Forzar JSON ([Backend/middleware/ensureJson.js](Backend/middleware/ensureJson.js))

Nuevo middleware que intercepta todas las respuestas y garantiza que sean JSON:

```javascript
const ensureJson = (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(data) {
        if (typeof data === 'string' && !res.get('Content-Type')?.includes('application/json')) {
            res.type('application/json');
            return originalJson.call(this, {
                success: true,
                message: data
            });
        }
        return originalSend.call(this, data);
    };

    res.json = function(data) {
        res.type('application/json');
        return originalJson.call(this, data);
    };

    next();
};
```

### 3. Manejo de Rutas No Encontradas (404)

Ahora las rutas inexistentes devuelven JSON en lugar de HTML:

```javascript
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.path}`,
        error: 'Not Found'
    });
});
```

### 4. Error Handler Mejorado ([Backend/middleware/errorHandler.js](Backend/middleware/errorHandler.js))

```javascript
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    
    const statusCode = error.statusCode || 500;
    const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Error en el servidor' 
        : error.message || 'Error en el servidor';

    if (res.headersSent) {
        console.error('Headers ya enviados, no se puede responder');
        return next(err);
    }

    res.status(statusCode).json({
        success: false,
        error: errorMessage,
        message: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};
```

### 5. Interceptor Frontend ([Frontend/services/api.js](Frontend/services/api.js))

Detecta respuestas HTML y proporciona error descriptivo:

```javascript
api.interceptors.response.use(
  (response) => {
    // Verificar si la respuesta es HTML cuando esperamos JSON
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      console.error('⚠️ Servidor respondió con HTML:', response.config.url);
      throw new Error('El servidor respondió con HTML en lugar de JSON.');
    }
    return response;
  },
  async (error) => {
    // Detectar respuestas HTML en errores
    const contentType = error.response?.headers['content-type'] || '';
    if (contentType.includes('text/html') || error.message?.includes('<!doctype')) {
      return Promise.reject(new Error('El servidor respondió con HTML.'));
    }
    return Promise.reject(error);
  }
);
```

### 6. Validación en Script de Inicio ([start-expo-dev-build.sh](start-expo-dev-build.sh))

El script ahora detecta y advierte sobre respuestas HTML:

```bash
# Verificar que el túnel responde con JSON y no HTML
TUNNEL_CONTENT=$(curl -s "${TUNNEL_URL}/" | head -1)
if echo "$TUNNEL_CONTENT" | grep -qi '<!doctype\|<html'; then
    echo "⚠️ PROBLEMA: El túnel responde con HTML en lugar de JSON"
    echo "Esto causará: 'Value<!doctype cannot be converted to JSON'"
    echo ""
    echo "Solución:"
    echo "1. Abre en tu navegador: ${TUNNEL_URL}"
    echo "2. Completa la verificación si aparece"
    echo "3. Luego intenta conectar tu app"
fi
```

## 🧪 Validación

Ejecuta el script de prueba:

```bash
./test-json-response.sh
```

Este script valida que:
- ✅ Ruta raíz `/` responde con JSON
- ✅ Health check `/health` responde con JSON
- ✅ API endpoints responden con JSON
- ✅ Rutas no encontradas (404) responden con JSON
- ✅ No hay respuestas HTML

## 🚀 Uso

### 1. Iniciar el Sistema

```bash
./start-expo-dev-build.sh --clean
```

El script ahora:
- ✅ Valida que el backend responde con JSON
- ✅ Detecta automáticamente páginas HTML
- ✅ Advierte si localtunnel requiere verificación
- ✅ Proporciona instrucciones claras de solución

### 2. Verificar Respuestas

```bash
# Verificar backend
curl -s http://localhost:5001/ | jq .

# Verificar health check
curl -s http://localhost:5001/health | jq .

# Verificar API
curl -s http://localhost:5001/api/products | jq .
```

Todas las respuestas deben ser JSON válido.

## 🔍 Diagnóstico de Problemas

Si aún ves el error, verifica:

### 1. Backend Responde con JSON

```bash
curl -s http://localhost:5001/ | jq .
```

Debe mostrar:
```json
{
  "success": true,
  "message": "Delicrunch API está funcionando",
  "version": "1.0.0",
  "timestamp": "2026-01-21T..."
}
```

### 2. Túnel No Devuelve HTML

```bash
curl -s https://[TU-TUNNEL-URL]/ | head -1
```

Si muestra `<!DOCTYPE` o `<html>`, el túnel está devolviendo HTML.

**Solución para Localtunnel:**
1. Abre la URL en tu navegador
2. Completa la verificación
3. Vuelve a probar

**Solución para Codespaces (RECOMENDADO):**
- Los puertos de Codespaces son más confiables
- Configura puerto 5001 como "Public"
- No requiere verificación

### 3. Frontend Actualizado

Asegúrate de que el frontend tiene los interceptores actualizados:

```bash
cd Frontend
npm install
# Reinicia Expo
```

## ⚙️ Configuración Permanente

Los cambios son permanentes y están integrados en:

1. **Backend:**
   - `Backend/server.js` - Rutas devuelven JSON
   - `Backend/middleware/ensureJson.js` - Fuerza JSON en todas las respuestas
   - `Backend/middleware/errorHandler.js` - Errores devuelven JSON

2. **Frontend:**
   - `Frontend/services/api.js` - Intercepta y detecta HTML

3. **Scripts:**
   - `start-expo-dev-build.sh` - Valida respuestas JSON
   - `test-json-response.sh` - Suite de pruebas

## ✨ Beneficios

- ✅ **Backend siempre responde JSON** - Sin importar la ruta o error
- ✅ **Detección temprana** - El script advierte sobre problemas antes de conectar
- ✅ **Mensajes claros** - Errores descriptivos en lugar de crashes
- ✅ **Validación automática** - Pruebas integradas en el flujo de inicio
- ✅ **Sin sorpresas** - No más errores inesperados de parseo JSON

## 📝 Resumen Técnico

**Error Original:**
```
java.lang.RuntimeException: Value<!doctype of type java.lang.String cannot be converted to JSONObject
```

**Causa Raíz:**
- Backend devolvía texto plano o HTML
- JSON.parse() intentaba parsear HTML
- No había validación de content-type

**Solución:**
- Forzar JSON en todas las respuestas del backend
- Interceptar y validar content-type en frontend
- Detectar HTML antes de enviar a la app
- Proporcionar mensajes de error claros

---

**Fecha de solución:** 21 de enero de 2026  
**Commit:** fix: Asegurar que backend siempre responde JSON y detectar respuestas HTML
