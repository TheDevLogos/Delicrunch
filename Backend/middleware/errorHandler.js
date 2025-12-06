const errorHandler = (err, req, res, next) => {
    // Copia el objeto de error para poder modificarlo
    let error = { ...err };

    error.message = err.message;

    // Log en la consola para el desarrollador
    console.error(err.stack);

    // Puedes añadir manejos de errores específicos de la base de datos (como códigos de error de PostgreSQL)
    // o de validación si lo necesitas en el futuro.

    res.status(error.statusCode || 500).json({
        success: false,
        // No expongas detalles del error en producción
        msg: process.env.NODE_ENV === 'production' ? 'Error en el servidor' : error.message || 'Error en el servidor'
    });
};

module.exports = errorHandler;