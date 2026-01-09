const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Obtener el perfil del usuario logueado (con datos de perfil y su tienda si es comercio)
exports.getLoggedInUserProfile = asyncHandler(async (req, res, next) => {
    // Gracias a nuestro middleware, tenemos acceso a req.user.id
    const userId = req.user.id;

    // Unimos users + profiles (datos de comprador) + stores (si es comercio)
    const profileData = await pool.query(
        `SELECT 
            u.id,
            u.nombre,
            u.email,
            u.rol,
            u.created_at,
            p.telefono,
            p.direccion,
            p.ciudad,
            p.foto_perfil,
            p.preferencias_alimentarias,
            s.id AS store_id,
            s.nombre_comercio,
            s.direccion AS store_direccion,
            s.latitud,
            s.longitud,
            s.descripcion,
            s.horario AS horario_recogida
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
         LEFT JOIN stores s ON u.id = s.user_id
         WHERE u.id = $1`,
        [userId]
    );

    if (profileData.rows.length === 0) {
        return res.status(404).json({ msg: 'Perfil no encontrado.' });
    }

    res.json(profileData.rows[0]);
});

// @desc    Actualizar datos del usuario logueado (nombre, teléfono, dirección, ciudad, foto_perfil)
exports.updateLoggedInUserProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const { nombre, telefono, direccion, ciudad } = req.body;
    const fotoFile = req.file; // upload.single('foto_perfil')

    // Empezamos una transacción para consistencia
    await pool.query('BEGIN');
    try {
        // 1) Actualizar nombre del usuario si viene
        if (nombre && nombre.trim().length > 0) {
            await pool.query('UPDATE users SET nombre = $1, updated_at = NOW() WHERE id = $2', [nombre.trim(), userId]);
        }

        // 2) Preparar valores de perfil
        const foto_perfil = fotoFile ? `/uploads/${fotoFile.filename}` : null; // Ruta relativa servida por /uploads

        // 3) Hacer upsert en profiles
        const upsertResult = await pool.query(
            `INSERT INTO profiles (user_id, telefono, direccion, ciudad, foto_perfil, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW())
             ON CONFLICT (user_id)
             DO UPDATE SET
                telefono = COALESCE(EXCLUDED.telefono, profiles.telefono),
                direccion = COALESCE(EXCLUDED.direccion, profiles.direccion),
                ciudad   = COALESCE(EXCLUDED.ciudad, profiles.ciudad),
                foto_perfil = COALESCE(EXCLUDED.foto_perfil, profiles.foto_perfil),
                updated_at = NOW()
             RETURNING *`,
            [userId, telefono || null, direccion || null, ciudad || null, foto_perfil]
        );

        await pool.query('COMMIT');

        res.json({ msg: 'Perfil actualizado correctamente', profile: upsertResult.rows[0] });
    } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
    }
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