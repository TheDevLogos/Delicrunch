const pool = require('../db'); // Importamos el pool de conexión
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Módulo nativo de Node.js
const asyncHandler = require('../middleware/asyncHandler');
const { OAuth2Client } = require('google-auth-library');
const googleOAuthClient = new OAuth2Client();

// Función para registrar un nuevo usuario
exports.registerUser = asyncHandler(async (req, res, next) => {
    const { nombre, name, email, password } = req.body;
    const userName = typeof (nombre || name) === 'string' ? (nombre || name).trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!userName || !normalizedEmail || !password) {
        return res.status(400).json({ msg: 'Por favor, incluye todos los campos (nombre, email, password).' });
    }
    const userExists = await pool.query('SELECT id FROM users WHERE lower(email) = $1', [normalizedEmail]);
    if (userExists.rows.length > 0) {
        return res.status(400).json({ msg: 'El correo electrónico ya está registrado.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    // La elección se confirma tras el primer acceso, también para cuentas de correo.
    const newUser = await pool.query(
        `INSERT INTO users (nombre, email, password_hash, rol, role_selected_at)
         VALUES ($1, $2, $3, 'comprador', NULL) RETURNING id, rol`,
        [userName, normalizedEmail, passwordHash]
    );
    const payload = {
        user: {
            id: newUser.rows[0].id,
            rol: newUser.rows[0].rol,
            onboardingPending: true,
        },
    };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
            if (err) return next(err);
            res.status(201).json({ token });
        }
    );
});

// --- SECCIÓN CORREGIDA ---
// La función loginUser ahora contiene toda su lógica dentro de sus llaves {}.
// Función para iniciar sesión
exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    
        // Validación básica
    if (!normalizedEmail || !password) {
        return res.status(400).json({ msg: 'Por favor, incluye email y contraseña.' });
    }

    // 1. Buscar al usuario por email
    const userResult = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [normalizedEmail]);
    if (userResult.rows.length === 0) {
        return res.status(400).json({ msg: 'Credenciales inválidas.' });
    }

    const user = userResult.rows[0];
    // 2. Comparar la contraseña enviada con la hasheada en la DB
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch || user.rol === 'admin') {
        return res.status(400).json({ msg: 'Credenciales inválidas.' });
    }

    // 3. Si todo es correcto, crear y firmar el JWT
    const payload = {
        user: {
            id: user.id,
            rol: user.rol,
            onboardingPending: user.role_selected_at === null,
        },
    };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
        (err, token) => {
            if (err) return next(err);
            res.json({ token });
        }
    );
});
// --- FIN DE LA SECCIÓN CORREGIDA ---

// Inicio de sesión con un ID token verificado por Google.
exports.loginWithGoogle = asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    if (typeof idToken !== 'string' || !idToken.trim()) {
        return res.status(400).json({ msg: 'Falta el comprobante de inicio de sesión de Google.' });
    }

    const clientIds = (process.env.GOOGLE_CLIENT_IDS || '')
        .split(',')
        .map((clientId) => clientId.trim())
        .filter(Boolean);
    const adminEmail = (process.env.GOOGLE_ADMIN_EMAIL || '').trim().toLowerCase();
    if (!clientIds.length || !adminEmail) {
        return res.status(503).json({ msg: 'El inicio de sesión seguro con Google todavía no está configurado.' });
    }

    let payload;
    try {
        const ticket = await googleOAuthClient.verifyIdToken({ idToken: idToken.trim(), audience: clientIds });
        payload = ticket.getPayload();
    } catch (error) {
        return res.status(401).json({ msg: 'Google no pudo verificar esta sesión. Inténtalo de nuevo.' });
    }

    const verifiedEmail = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
    if (!verifiedEmail || payload.email_verified !== true) {
        return res.status(401).json({ msg: 'La cuenta de Google debe tener un correo verificado.' });
    }
    const isAdminAccount = verifiedEmail === adminEmail;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const existingUser = await client.query(
            'SELECT id, rol, role_selected_at FROM users WHERE lower(email) = $1 FOR UPDATE',
            [verifiedEmail]
        );

        let user;
        if (isAdminAccount && existingUser.rows.length) {
            // Solo el correo permitido por el servidor puede recibir admin.
            const passwordHash = await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 12);
            const promotedUser = await client.query(
                `UPDATE users
                 SET rol = 'admin', password_hash = $2,
                     password_reset_token = NULL, password_reset_expires = NULL,
                     role_selected_at = COALESCE(role_selected_at, NOW())
                 WHERE id = $1
                 RETURNING id, rol, role_selected_at`,
                [existingUser.rows[0].id, passwordHash]
            );
            user = promotedUser.rows[0];
        } else if (isAdminAccount) {
            const passwordHash = await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 12);
            const createdUser = await client.query(
                `INSERT INTO users (nombre, email, password_hash, rol, role_selected_at)
                 VALUES ($1, $2, $3, 'admin', NOW())
                 ON CONFLICT (email) DO UPDATE
                 SET rol = 'admin', password_hash = EXCLUDED.password_hash,
                     password_reset_token = NULL, password_reset_expires = NULL,
                     role_selected_at = COALESCE(users.role_selected_at, NOW())
                 RETURNING id, rol, role_selected_at`,
                [payload.name || verifiedEmail.split('@')[0], verifiedEmail, passwordHash]
            );
            user = createdUser.rows[0];
        } else if (existingUser.rows.length) {
            user = existingUser.rows[0];
            if (user.rol === 'admin') {
                await client.query('ROLLBACK');
                return res.status(403).json({ msg: 'Esta cuenta no puede usar el acceso administrador.' });
            }
        } else {
            // El rol comprador es provisional hasta que el usuario elija.
            const passwordHash = await bcrypt.hash(crypto.randomBytes(48).toString('hex'), 12);
            const createdUser = await client.query(
                `INSERT INTO users (nombre, email, password_hash, rol, role_selected_at)
                 VALUES ($1, $2, $3, 'comprador', NULL)
                 ON CONFLICT (email) DO NOTHING
                 RETURNING id, rol, role_selected_at`,
                [payload.name || verifiedEmail.split('@')[0], verifiedEmail, passwordHash]
            );
            user = createdUser.rows[0] || (await client.query(
                'SELECT id, rol, role_selected_at FROM users WHERE lower(email) = $1 FOR UPDATE',
                [verifiedEmail]
            )).rows[0];
        }

        if (isAdminAccount) {
            // Conserva la regla previa: solo una cuenta administradora.
            await client.query(
                "UPDATE users SET rol = 'comprador' WHERE rol = 'admin' AND lower(email) <> $1",
                [verifiedEmail]
            );
        }
        await client.query('COMMIT');

        const token = jwt.sign(
            { user: {
                id: user.id,
                rol: user.rol,
                authProvider: 'google',
                onboardingPending: user.role_selected_at === null,
            } },
            process.env.JWT_SECRET,
            { expiresIn: '5h' }
        );
        return res.json({ token });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al iniciar sesión con Google:', error.message);
        return res.status(500).json({ msg: 'No se pudo completar el inicio de sesión con Google.' });
    } finally {
        client.release();
    }
});

// La primera elección se guarda en la cuenta y no puede cambiarse desde este endpoint.
exports.chooseRole = asyncHandler(async (req, res) => {
    const role = req.body?.rol;
    if (!['comprador', 'comercio'].includes(role)) {
        return res.status(400).json({ msg: 'Elige cliente o comercio.' });
    }
    const storeData = req.body?.storeData;
    let normalizedStore;
    if (role === 'comercio') {
        const name = typeof storeData?.nombre_comercio === 'string' ? storeData.nombre_comercio.trim() : '';
        const address = typeof storeData?.direccion === 'string' ? storeData.direccion.trim() : '';
        const phone = typeof storeData?.telefono === 'string' ? storeData.telefono.trim() : '';
        if (!name || !address || !phone || name.length > 255 || address.length > 500 || phone.length > 50) {
            return res.status(400).json({ msg: 'Completa nombre, dirección y teléfono válidos de tu comercio.' });
        }
        normalizedStore = { name, address, phone };
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(
            'SELECT id, nombre, rol, role_selected_at FROM users WHERE id = $1 FOR UPDATE',
            [req.user.id]
        );
        const user = result.rows[0];
        if (!user || user.rol === 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ msg: 'No se puede cambiar el tipo de esta cuenta.' });
        }
        if (user.role_selected_at && user.rol !== role) {
            await client.query('ROLLBACK');
            return res.status(409).json({ msg: 'El tipo de cuenta ya fue elegido.' });
        }
        if (!user.role_selected_at) {
            await client.query(
                'UPDATE users SET rol = $1, role_selected_at = NOW(), updated_at = NOW() WHERE id = $2',
                [role, user.id]
            );
            if (role === 'comercio') {
                const store = await client.query('SELECT id FROM stores WHERE user_id = $1 LIMIT 1', [user.id]);
                if (!store.rows.length) {
                    await client.query(
                        `INSERT INTO stores (user_id, nombre_comercio, direccion, telefono, horario, activo)
                         VALUES ($1, $2, $3, $4, 'Por definir', true)`,
                        [user.id, normalizedStore.name, normalizedStore.address, normalizedStore.phone]
                    );
                }
            }
        }
        await client.query('COMMIT');
        const token = jwt.sign(
            { user: { id: user.id, rol: role, authProvider: req.user.authProvider, onboardingPending: false } },
            process.env.JWT_SECRET,
            { expiresIn: '5h' }
        );
        return res.json({ token, rol: role });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
});


// @desc    Manejar "Olvidé mi contraseña" y enviar email
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const userResult = await pool.query('SELECT id, rol FROM users WHERE lower(email) = lower($1)', [normalizedEmail]);
    if (userResult.rows.length === 0 || userResult.rows[0].rol === 'admin') {
        // Por seguridad, no revelamos si el email existe.
        return res.status(200).json({ msg: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.' });
    }
    const resetToken = crypto.randomBytes(20).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora
    await pool.query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
        [passwordResetToken, passwordResetExpires, userResult.rows[0].id]
    );
    const frontendUrl = (process.env.FRONTEND_URL || 'https://delicrunch.vercel.app').replace(/\/+$/, '');
    const resetUrl = frontendUrl + '/reset-password/' + encodeURIComponent(resetToken);
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 465),
        secure: Number(process.env.EMAIL_PORT || 465) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: normalizedEmail,
        subject: 'Restablecimiento de Contraseña de Delicrunch',
        text: `Has recibido este email porque solicitaste un restablecimiento de contraseña. Por favor, haz clic en el siguiente enlace, o pégalo en tu navegador para completar el proceso: \n\n ${resetUrl}`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: 'Email enviado.' });
});

// @desc    Restablecer la contraseña
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const resetToken = req.params.token;
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const userResult = await pool.query(
        `SELECT id, password_hash, rol FROM users
         WHERE password_reset_token = $1 AND password_reset_expires > NOW()`,
        [passwordResetToken]
    );

    if (userResult.rows.length === 0) {
        return res.status(400).json({ msg: 'El token para restablecer la contraseña no es válido o ha expirado.' });
    }

    const user = userResult.rows[0];
    if (user.rol === 'admin') {
        return res.status(403).json({ msg: 'Las cuentas administradoras acceden con Google y no pueden restablecer contraseña.' });
    }
    const { password } = req.body;
    if (typeof password !== 'string' || password.length < 12) {
        return res.status(400).json({ msg: 'La nueva contraseña debe tener al menos 12 caracteres.' });
    }

    const isSamePassword = await bcrypt.compare(password, user.password_hash);

    if (isSamePassword) {
        return res.status(400).json({ msg: 'La nueva contraseña no puede ser igual a la anterior.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await pool.query(
        'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2 AND password_reset_token = $3 AND password_reset_expires > NOW() RETURNING id',
        [passwordHash, user.id, passwordResetToken]
    );
    if (result.rows.length === 0) {
        return res.status(400).json({ msg: 'El enlace para restablecer la contraseña no es válido o ha expirado.' });
    }
    
    res.status(200).json({ msg: 'Contraseña actualizada exitosamente.' });
});
