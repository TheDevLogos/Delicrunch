const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');

exports.googleLogin = asyncHandler(async (req, res) => {
    const { accessToken } = req.body || {};
    if (!accessToken || typeof accessToken !== 'string') {
        return res.status(400).json({ msg: 'Falta la sesión de Google.' });
    }

    // Validar el token con Supabase Auth; nunca confiar en datos de perfil enviados por el navegador.
    const { data, error } = await pool.supabase.auth.getUser(accessToken);
    const authUser = data?.user;
    if (error || !authUser?.email || !authUser.email_confirmed_at) {
        return res.status(401).json({ msg: 'La sesión de Google no es válida o no tiene correo verificado.' });
    }

    const email = authUser.email.trim().toLowerCase();
    const displayName = authUser.user_metadata?.full_name
        || authUser.user_metadata?.name
        || email.split('@')[0];
    const configuredAdminEmail = (process.env.GOOGLE_ADMIN_EMAIL || '').trim().toLowerCase();
    const requestedRole = configuredAdminEmail && email === configuredAdminEmail ? 'admin' : 'comprador';

    let result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [email]);
    let user = result.rows[0];

    if (!user) {
        // Google será la única vía de acceso para esta cuenta hasta que se defina una contraseña.
        const randomPassword = crypto.randomBytes(48).toString('base64url');
        const passwordHash = await bcrypt.hash(randomPassword, 12);
        result = await pool.query(
            'INSERT INTO users (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING *',
            [displayName, email, passwordHash, requestedRole]
        );
        user = result.rows[0];
    } else if (requestedRole === 'admin' && user.rol !== 'admin') {
        result = await pool.query(
            "UPDATE users SET rol = 'admin', updated_at = NOW() WHERE id = $1 RETURNING *",
            [user.id]
        );
        user = result.rows[0];
    }

    const payload = { user: { id: user.id, rol: user.rol } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) return res.status(500).json({ msg: 'No se pudo crear la sesión de Delicrunch.' });
        return res.json({ token });
    });
});
