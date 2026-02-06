const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Obtener el perfil del usuario logueado (con datos de perfil y su tienda si es comercio)
exports.getLoggedInUserProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Unimos users + profiles (datos de comprador) + stores (si es comercio)
    const profileData = await pool.query(
        `SELECT 
            u.id,
            u.nombre,
            u.email,
            u.rol,
            u.created_at,
            -- Datos del perfil extendido
            p.telefono,
            p.direccion,
            p.ciudad,
            p.foto_perfil,
            p.preferencias_alimentarias,
            p.total_pedidos,
            p.total_ahorrado,
            p.co2_ahorrado,
            p.total_xp,
            -- Datos de tienda si es vendedor
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
    const fotoFile = req.file;

    await pool.query('BEGIN');
    try {
        // 1) Actualizar nombre del usuario si viene (users.nombre)
        if (nombre) {
            await pool.query(
                `UPDATE users SET 
                    nombre = $1,
                    updated_at = NOW() 
                 WHERE id = $2`, 
                [nombre, userId]
            );
        }

        // 2) Preparar valores de perfil
        const foto_perfil = fotoFile ? `/uploads/${fotoFile.filename}` : null;

        // 3) Hacer upsert en profiles (telefono, direccion, ciudad están en profiles, NO en users)
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
    // Verificar que el usuario es vendedor
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    if (!['seller', 'comercio', 'admin'].includes(userRole)) {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios.' });
    }

    const { nombre_comercio, direccion, descripcion, horario_recogida, horario } = req.body;
    const userId = req.user.id;

    // Primero verificar si existe la tienda
    const storeExists = await pool.query('SELECT id FROM stores WHERE user_id = $1', [userId]);
    
    let updatedStore;
    if (storeExists.rows.length === 0) {
        // Crear tienda si no existe
        updatedStore = await pool.query(
            `INSERT INTO stores (user_id, nombre_comercio, direccion, descripcion, horario, activo)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING *`,
            [userId, nombre_comercio, direccion, descripcion, horario_recogida || horario]
        );
    } else {
        // Actualizar tienda existente
        updatedStore = await pool.query(
            `UPDATE stores SET 
                nombre_comercio = COALESCE($1, nombre_comercio), 
                direccion = COALESCE($2, direccion), 
                descripcion = COALESCE($3, descripcion), 
                horario = COALESCE($4, horario),
                updated_at = NOW()
             WHERE user_id = $5 
             RETURNING *`,
            [nombre_comercio, direccion, descripcion, horario_recogida || horario, userId]
        );
    }

    res.json(updatedStore.rows[0]);
});

// @desc    Obtener datos de gamificación del usuario
// @route   GET /api/profiles/gamification
// @access  Privado
exports.getGamification = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const result = await pool.query(
        `SELECT 
            COALESCE(p.total_xp, 0) AS total_xp,
            COALESCE(p.total_pedidos, 0) AS total_packs_saved,
            COALESCE(p.total_ahorrado, 0) AS total_savings,
            COALESCE(p.co2_ahorrado, 0) AS total_co2_saved,
            COALESCE(p.total_reviews, 0) AS total_reviews,
            COALESCE(p.unlocked_badges, '[]'::jsonb) AS unlocked_badges
         FROM profiles p
         WHERE p.user_id = $1`,
        [userId]
    );

    // Si no existe perfil, devolver defaults
    if (result.rows.length === 0) {
        return res.json({
            total_xp: 0,
            total_packs_saved: 0,
            total_savings: 0,
            total_co2_saved: 0,
            total_reviews: 0,
            unlocked_badges: [],
        });
    }

    res.json(result.rows[0]);
});

// @desc    Registrar gamification events (XP ganada, packsSaved, badges nuevos)
// @route   POST /api/profiles/gamification
// @access  Privado
exports.postGamification = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { xp_gained = 0, packs_saved = 0, savings = 0, co2_saved = 0, new_badges = [] } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Upsert profile row if not exists
        await client.query(
            `INSERT INTO profiles (user_id, total_pedidos, total_ahorrado, co2_ahorrado, total_xp, total_packs_saved, total_reviews, unlocked_badges, created_at)
             VALUES ($1, 0, 0, 0, 0, 0, 0, '[]'::jsonb, NOW())
             ON CONFLICT (user_id) DO NOTHING`,
            [userId]
        );

        // Actualizar valores acumulativos
        const updateRes = await client.query(
            `UPDATE profiles SET
                total_xp = COALESCE(total_xp, 0) + $1,
                total_pedidos = COALESCE(total_pedidos, 0) + $2,
                total_ahorrado = COALESCE(total_ahorrado, 0) + $3,
                co2_ahorrado = COALESCE(co2_ahorrado, 0) + $4,
                total_packs_saved = COALESCE(total_packs_saved, 0) + $2,
                updated_at = NOW()
             WHERE user_id = $5
             RETURNING total_xp, total_pedidos, total_ahorrado, co2_ahorrado, total_packs_saved, total_reviews, unlocked_badges`,
            [xp_gained, packs_saved, savings, co2_saved, userId]
        );

        let profile = updateRes.rows[0];

        // Guardar badges nuevos en unlocked_badges (JSONB array), evitando duplicados
        if (new_badges && Array.isArray(new_badges) && new_badges.length > 0) {
            // Obtener badges actuales
            const existingBadgesRes = await client.query("SELECT COALESCE(unlocked_badges, '[]'::jsonb) AS unlocked_badges FROM profiles WHERE user_id = $1", [userId]);
            const existing = existingBadgesRes.rows[0] ? existingBadgesRes.rows[0].unlocked_badges : [];

            const toAdd = new_badges.filter(nb => !existing.some(e => (e.id ? e.id : e) === nb));
            if (toAdd.length > 0) {
                const newEntries = toAdd.map(id => ({ id, unlockedAt: new Date().toISOString() }));
                const merged = existing.concat(newEntries);
                await client.query('UPDATE profiles SET unlocked_badges = $1 WHERE user_id = $2', [JSON.stringify(merged), userId]);
                profile.unlocked_badges = merged;
            } else {
                profile.unlocked_badges = existing;
            }
        }

        await client.query('COMMIT');

        res.json({
            msg: 'Gamification updated',
            total_xp: profile.total_xp,
            total_packs_saved: profile.total_packs_saved || profile.total_pedidos,
            total_savings: profile.total_ahorrado,
            total_co2_saved: profile.co2_ahorrado,
            total_reviews: profile.total_reviews,
            unlocked_badges: profile.unlocked_badges || [],
        });
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
});

// @desc    Marcar que se ha mostrado el primer login modal
// @route   POST /api/profiles/first-login
// @access  Privado
exports.markFirstLoginShown = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Actualizar el perfil para marcar first_login_shown como true
    const result = await pool.query(
        `INSERT INTO profiles (user_id, first_login_shown, last_login_at, created_at, updated_at)
         VALUES ($1, true, NOW(), NOW(), NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
            first_login_shown = true,
            last_login_at = NOW(),
            updated_at = NOW()
         RETURNING first_login_shown, last_login_at`,
        [userId]
    );

    res.json({
        msg: 'First login marked as shown',
        first_login_shown: result.rows[0].first_login_shown,
        last_login_at: result.rows[0].last_login_at
    });
});

// @desc    Verificar si el usuario necesita ver el modal de primer login
// @route   GET /api/profiles/check-first-login
// @access  Privado
exports.checkFirstLogin = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const result = await pool.query(
        `SELECT COALESCE(first_login_shown, false) AS first_login_shown
         FROM profiles
         WHERE user_id = $1`,
        [userId]
    );

    // Si no existe perfil, significa que nunca se ha mostrado
    const shouldShow = result.rows.length === 0 || !result.rows[0].first_login_shown;

    res.json({
        should_show_modal: shouldShow,
        first_login_shown: result.rows.length > 0 ? result.rows[0].first_login_shown : false
    });
});