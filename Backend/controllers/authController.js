const pool = require('../db'); // Importamos el pool de conexión
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Módulo nativo de Node.js
const asyncHandler = require('../middleware/asyncHandler');

// Función para registrar un nuevo usuario
exports.registerUser = asyncHandler(async (req, res, next) => {
    // Obtenemos los datos del cuerpo de la solicitud 
    const { nombre, email, password, rol } = req.body;

    // Validación básica
    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ msg: 'Por favor, incluye todos los campos.' });
    }

    // 1. Verificar si el usuario ya existe
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
        return res.status(400).json({ msg: 'El correo electrónico ya está registrado.' });
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insertar el nuevo usuario en la base de datos
    const newUser = await pool.query(
        'INSERT INTO users (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING *',
        [nombre, email, passwordHash, rol]
    );

    // 4. Lógica específica si el rol es 'comercio'
    if (rol === 'comercio') {
        // Creamos una entrada básica en la tabla 'stores' asociada a este nuevo usuario
        await pool.query(
            'INSERT INTO stores (user_id, nombre_comercio, direccion) VALUES ($1, $2, $3)',
            [newUser.rows[0].id, `${nombre}'s Store`, 'Dirección por definir']
        );
    }

    // 5. Crear y firmar el JWT
    const payload = {
        user: {
            id: newUser.rows[0].id,
            rol: newUser.rows[0].rol,
        },
    };

    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5h' }, // El token expira en 5 horas
        (err, token) => {
            if (err) return next(err);
            res.status(201).json({ token }); // Respondemos con el token
        }
    );
});

// --- SECCIÓN CORREGIDA ---
// La función loginUser ahora contiene toda su lógica dentro de sus llaves {}.
// Función para iniciar sesión
exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    
    // Validación básica
    if (!email || !password) {
        return res.status(400).json({ msg: 'Por favor, incluye email y contraseña.' });
    }

    // 1. Buscar al usuario por email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
        return res.status(400).json({ msg: 'Credenciales inválidas.' });
    }

    const user = userResult.rows[0];

    // 2. Comparar la contraseña enviada con la hasheada en la DB
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        return res.status(400).json({ msg: 'Credenciales inválidas.' });
    }

    // 3. Si todo es correcto, crear y firmar el JWT
    const payload = {
        user: {
            id: user.id,
            rol: user.rol,
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


// @desc    Manejar "Olvidé mi contraseña" y enviar email
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
        // Por seguridad, no revelamos si el email existe.
        return res.status(200).json({ msg: 'Si existe una cuenta con este email, recibirás un enlace para restablecer tu contraseña.' });
    }
    const resetToken = crypto.randomBytes(20).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora
    await pool.query(
        'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
        [passwordResetToken, passwordResetExpires, email]
    );
    const resetUrl = `http://localhost:8081/reset-password/${resetToken}`;
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true, // true para el puerto 465 (SSL)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: '"Delicrunch Support" <support@delicrunch.com>',
        to: email,
        subject: 'Restablecimiento de Contraseña de Delicrunch',
        text: `Has recibido este email porque solicitaste un restablecimiento de contraseña. Por favor, haz clic en el siguiente enlace, o pégalo en tu navegador para completar el proceso: \n\n ${resetUrl}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email de recuperación enviado exitosamente a:", email, "Message ID:", info.messageId);

    res.status(200).json({ msg: 'Email enviado.' });
});

// @desc    Restablecer la contraseña
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const resetToken = req.params.token;
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const userResult = await pool.query(
        'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [passwordResetToken]
    );

    if (userResult.rows.length === 0) {
        return res.status(400).json({ msg: 'El token para restablecer la contraseña no es válido o ha expirado.' });
    }

    const user = userResult.rows[0];
    const { password } = req.body;

    const isSamePassword = await bcrypt.compare(password, user.password_hash);

    if (isSamePassword) {
        return res.status(400).json({ msg: 'La nueva contraseña no puede ser igual a la anterior.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    await pool.query(
        'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
        [passwordHash, user.id]
    );
    
    res.status(200).json({ msg: 'Contraseña actualizada exitosamente.' });
});
