const errorHandler = (err, req, res, next) => {
    // Copia el objeto de error para poder modificarlo
    let error = { ...err };

    error.message = err.message;

    // Log en la consola para el desarrollador
    console.error('❌ Error:', err.stack);

    // Puedes añadir manejos de errores específicos de la base de datos (como códigos de error de PostgreSQL)
    // o de validación si lo necesitas en el futuro.

    // Asegurar que siempre respondemos con JSON válido
    const statusCode = error.statusCode || 500;
    const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Error en el servidor' 
        : error.message || 'Error en el servidor';

    // Prevenir headers ya enviados
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

module.exports = errorHandler;