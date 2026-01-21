// Backend/middleware/ensureJson.js
// Middleware para asegurar que todas las respuestas sean JSON

const ensureJson = (req, res, next) => {
    // Interceptar el método send y json para asegurar formato JSON
    const originalSend = res.send;
    const originalJson = res.json;

    // Override send para convertir texto a JSON
    res.send = function(data) {
        // Si no es un objeto, convertirlo a JSON
        if (typeof data === 'string' && !res.get('Content-Type')?.includes('application/json')) {
            res.type('application/json');
            return originalJson.call(this, {
                success: true,
                message: data
            });
        }
        return originalSend.call(this, data);
    };

    // Asegurar que json siempre establece el content-type correcto
    res.json = function(data) {
        res.type('application/json');
        return originalJson.call(this, data);
    };

    next();
};

module.exports = ensureJson;
