const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Obtener el perfil del usuario logueado (y su tienda si es comercio)
exports.getLoggedInUserProfile = asyncHandler(async (req, res, next) => {
    // Gracias a nuestro middleware, tenemos acceso a req.user.id
    const userId = req.user.id;

    // Hacemos una consulta que une la tabla de usuarios con la de tiendas.
    // Un LEFT JOIN asegura que obtengamos los datos del usuario incluso si no es un comercio (en cuyo caso los campos de la tienda serán null).
    const profileData = await pool.query(
        `SELECT u.id, u.nombre, u.email, u.rol, u.fecha_creacion,
                s.id AS store_id, s.nombre_comercio, s.direccion, s.latitud, s.longitud, s.descripcion, s.horario_recogida
         FROM users u
         LEFT JOIN stores s ON u.id = s.user_id
         WHERE u.id = $1`,
        [userId]
    );

    if (profileData.rows.length === 0) {
        return res.status(404).json({ msg: 'Perfil no encontrado.' });
    }

    res.json(profileData.rows[0]);
});

// @desc    Actualizar el perfil de la tienda para un usuario de tipo 'comercio'
exports.updateStoreProfile = asyncHandler(async (req, res, next) => {
    // Primero, verificamos que el usuario logueado es un comercio.
    if (req.user.rol !== 'comercio') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios.' }); // 403 Forbidden
    }

    const { nombre_comercio, direccion, descripcion, horario_recogida } = req.body;
    const userId = req.user.id;

    const updatedStore = await pool.query(
        `UPDATE stores SET nombre_comercio = $1, direccion = $2, descripcion = $3, horario_recogida = $4 WHERE user_id = $5 RETURNING *`,
        [nombre_comercio, direccion, descripcion, horario_recogida, userId]
    );

    if (updatedStore.rows.length === 0) {
        return res.status(404).json({ msg: 'Tienda no encontrada para este usuario.' });
    }

    res.json(updatedStore.rows[0]);
});