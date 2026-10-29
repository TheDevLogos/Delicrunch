const pool = require('../db');
const { supabase } = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const crypto = require('crypto');

// Helper para subir imágenes a Supabase Storage
const uploadToSupabase = async (fileBuffer, originalFilename, folder = 'profiles') => {
    try {
        // Generar nombre único para el archivo
        const fileExt = originalFilename.split('.').pop();
        const fileName = `${folder}/${crypto.randomBytes(16).toString('hex')}-${Date.now()}.${fileExt}`;
        
        // Subir a Supabase Storage en el bucket 'avatars'
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(fileName, fileBuffer, {
                contentType: `image/${fileExt}`,
                upsert: false
            });
        
        if (error) {
            console.error('Error uploading to Supabase:', error);
            throw new Error('Error al subir imagen a Supabase Storage');
        }
        
        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
        
        return urlData.publicUrl;
    } catch (error) {
        console.error('Error in uploadToSupabase:', error);
        throw error;
    }
};

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

        // 2) Subir foto a Supabase Storage si viene archivo
        let foto_perfil = null;
        if (fotoFile && fotoFile.buffer) {
            foto_perfil = await uploadToSupabase(fotoFile.buffer, fotoFile.originalname, 'profiles');
        }

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
             RETURNING id, user_id, nombre_comercio, direccion, descripcion, horario, activo, updated_at`,
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
             RETURNING id, user_id, nombre_comercio, direccion, descripcion, horario, activo, updated_at`,
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
            COALESCE(p.total_packs_saved, 0) AS total_packs_saved,
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

// @desc    Obtener leaderboard de compradores ordenados por XP
// @route   GET /api/profiles/leaderboard
// @access  Privado
exports.getLeaderboard = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Umbrales XP por nivel — deben coincidir con Frontend/src/constants/gamification.js LEVELS
    const LEVEL_XP   = [0, 135, 340, 675, 1150, 1755, 2700, 4050, 6075, 8775, 12150, 16875, 23625, 33750, 47250];
    const LEVEL_TIER = ['BRONZE','BRONZE','BRONZE','SILVER','SILVER','SILVER','GOLD','GOLD','GOLD','PLATINUM','PLATINUM','PLATINUM','DIAMOND','DIAMOND','DIAMOND'];

    const calcLevel = (xp) => {
        for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
            if (xp >= LEVEL_XP[i]) return i + 1;
        }
        return 1;
    };
    const calcTier = (level) => LEVEL_TIER[Math.min(level - 1, LEVEL_TIER.length - 1)] || 'BRONZE';

    // Top 20 compradores por XP (incluye compradores, clientes y roles nulos)
    const topResult = await pool.query(`
        SELECT
            u.id,
            SPLIT_PART(u.nombre, ' ', 1) AS nickname,
            COALESCE(p.total_xp, 0) AS xp
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.rol IN ('comprador', 'buyer', 'cliente') OR u.rol IS NULL
        ORDER BY COALESCE(p.total_xp, 0) DESC
        LIMIT 20
    `);

    const leaderboard = topResult.rows.map((row, idx) => {
        const xp = parseInt(row.xp) || 0;
        const level = calcLevel(xp);
        return {
            id: row.id,
            nickname: row.nickname || 'Usuario',
            xp,
            level,
            tier: calcTier(level),
            rank: idx + 1,
        };
    });

    // Posición global del usuario actual
    const rankResult = await pool.query(`
        SELECT COUNT(*) + 1 AS user_rank
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE (u.rol IN ('comprador', 'buyer', 'cliente') OR u.rol IS NULL)
          AND COALESCE(p.total_xp, 0) > (
              SELECT COALESCE(p2.total_xp, 0) FROM profiles p2 WHERE p2.user_id = $1
          )
    `, [userId]);

    const userProfileRes = await pool.query(
        'SELECT COALESCE(total_xp, 0) AS xp FROM profiles WHERE user_id = $1',
        [userId]
    );
    const userXP = parseInt((userProfileRes.rows[0] || {}).xp) || 0;
    const userLevel = calcLevel(userXP);

    const userRank = {
        rank: parseInt(rankResult.rows[0].user_rank) || null,
        xp: userXP,
        level: userLevel,
        tier: calcTier(userLevel),
    };

    res.json({ leaderboard, userRank });
});