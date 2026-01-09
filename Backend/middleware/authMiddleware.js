const jwt = require('jsonwebtoken');
const pool = require('../db');
require('dotenv').config();

/**
 * Middleware de protección de rutas
 * Verifica que el usuario tenga un token JWT válido
 */
const protect = function (req, res, next) {
    // 1. Obtener el token del encabezado de la solicitud
    // Soportamos dos formatos: 'x-auth-token' y 'Authorization: Bearer <token>'
    let token = req.header('x-auth-token');
    
    // Si no hay x-auth-token, intentar con Authorization Bearer
    if (!token) {
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

    // 2. Verificar si no hay token
    if (!token) {
        // Si no hay token, respondemos con un error 401 (No Autorizado)
        return res.status(401).json({ msg: 'No hay token, autorización denegada.' });
    }

    // 3. Si hay un token, verificar su validez
    try {
        // jwt.verify() decodifica el token. Si es válido, nos devuelve el 'payload'
        // que nosotros mismos creamos al registrar/loguear al usuario.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Añadir el usuario del payload al objeto de la solicitud (req)
        // Esto es MUY importante. Al hacer esto, todas las rutas que usen este
        // middleware tendrán acceso a la información del usuario logueado.
        req.user = decoded.user;

        // 5. Llamar a next() para que la solicitud continúe hacia la ruta final
        next();

    } catch (error) {
        // Si el token no es válido (ha expirado, está manipulado, etc.),
        // jwt.verify() lanzará un error que capturamos aquí.
        res.status(401).json({ msg: 'Token no es válido.' });
    }
};

/**
 * Middleware para restringir acceso por rol
 * @param  {...string} roles - Roles permitidos ('admin', 'comercio', 'comprador')
 */
const restrictTo = (...roles) => {
    return async (req, res, next) => {
        try {
            // Obtener el rol del usuario desde la base de datos
            const result = await pool.query(
                'SELECT rol FROM users WHERE id = $1',
                [req.user.id]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ msg: 'Usuario no encontrado' });
            }

            const userRole = result.rows[0].rol;

            // Verificar si el rol del usuario está en los roles permitidos
            if (!roles.includes(userRole)) {
                return res.status(403).json({ 
                    msg: 'No tienes permisos para realizar esta acción' 
                });
            }

            // Agregar el rol al objeto request para uso posterior
            req.userRole = userRole;
            next();
        } catch (error) {
            console.error('Error al verificar rol:', error);
            res.status(500).json({ msg: 'Error del servidor' });
        }
    };
};

// Exportar como módulo con múltiples funciones
module.exports = protect;
module.exports.protect = protect;
module.exports.restrictTo = restrictTo;