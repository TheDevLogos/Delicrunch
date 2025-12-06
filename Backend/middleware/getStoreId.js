const pool = require('../db');
const asyncHandler = require('./asyncHandler');

/**
 * Middleware para verificar si el usuario es un 'comercio' y obtener el ID de su tienda.
 * Asume que el middleware 'authMiddleware' ya se ha ejecutado.
 * Adjunta el `storeId` al objeto `req`.
 */
const getStoreId = asyncHandler(async (req, res, next) => {
    // 1. Verificar que el usuario tiene el rol de 'comercio'.
    if (req.user.rol !== 'comercio') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios.' });
    }

    const userId = req.user.id;

    // 2. Buscar la tienda asociada al ID del usuario.
    const storeResult = await pool.query('SELECT id FROM stores WHERE user_id = $1', [userId]);

    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'No se encontró una tienda asociada a este usuario.' });
    }

    // 3. Adjuntar el ID de la tienda a la solicitud para que los controladores puedan usarlo.
    req.storeId = storeResult.rows[0].id;
    next();
});

module.exports = getStoreId;