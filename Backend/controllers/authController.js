const pool = require('../db'); // Importamos el pool de conexión
const bcrypt = require('bcryptjs'); // Para hashear contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Módulo nativo de Node.js
const asyncHandler = require('../middleware/asyncHandler');

// Función para registrar un nuevo usuario
exports.registerUser = asyncHandler(async (req, res, next) => {
    // Obtenemos los datos del cuerpo de la solicitud - aceptar español o inglés
    const { nombre, name, email, password, rol, role, storeData } = req.body;
    
    // Mapear campos
    const userName = nombre || name;
    const userRole = rol || role || 'buyer';

    // Validación básica
    if (!userName || !email || !password) {
        return res.status(400).json({ msg: 'Por favor, incluye todos los campos (nombre, email, password).' });
    }
    
    // Mapear roles al español (nombres correctos en la BD)
    // La BD acepta: 'comprador', 'comercio', 'admin'
    let dbRole = userRole.toLowerCase();
    // Compatibilidad: aceptar roles en inglés y convertir a español
    if (dbRole === 'buyer') dbRole = 'comprador';
    if (dbRole === 'seller') dbRole = 'comercio';
    if (dbRole === 'administrador') dbRole = 'admin';
    // El rol admin nunca se acepta desde el endpoint público de registro.
    if (dbRole === 'admin') {
        return res.status(403).json({ msg: 'El rol administrador solo puede asignarlo el equipo de Delicrunch.' });
    }
    // Si no es un rol válido, usar comprador por defecto
    if (!['comprador', 'comercio'].includes(dbRole)) dbRole = 'comprador';
    
    // Validación adicional para comercios/sellers
    if (['comercio', 'seller'].includes(userRole.toLowerCase())) {
        dbRole = 'comercio';
        if (!storeData || !storeData.nombre_comercio || !storeData.direccion || !storeData.telefono) {
            return res.status(400).json({ msg: 'Por favor, incluye todos los campos requeridos del comercio (nombre, dirección, teléfono).' });
        }
        
        // Validar coordenadas si se proporcionan
        if (storeData.latitud !== null && storeData.latitud !== undefined) {
            if (isNaN(storeData.latitud) || storeData.latitud < -90 || storeData.latitud > 90) {
                return res.status(400).json({ msg: 'Latitud debe ser un número entre -90 y 90.' });
            }
        }
        
        if (storeData.longitud !== null && storeData.longitud !== undefined) {
            if (isNaN(storeData.longitud) || storeData.longitud < -180 || storeData.longitud > 180) {
                return res.status(400).json({ msg: 'Longitud debe ser un número entre -180 y 180.' });
            }
        }
    }

    // 1. Verificar si el usuario ya existe
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
        return res.status(400).json({ msg: 'El correo electrónico ya está registrado.' });
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insertar el nuevo usuario en la base de datos con campos reales
    const newUser = await pool.query(
        `INSERT INTO users (nombre, email, password_hash, rol) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userName, email, passwordHash, dbRole]
    );

    // 4. Lógica específica si el rol es 'comercio'
    if (dbRole === 'comercio' && storeData) {
        // Creamos una entrada en la tabla 'stores' asociada a este nuevo usuario
        await pool.query(
            `INSERT INTO stores 
            (user_id, nombre_comercio, direccion, latitud, longitud, telefono, horario, descripcion, categoria, activo) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                newUser.rows[0].id,
                storeData.nombre_comercio,
                storeData.direccion,
                storeData.latitud || null,
                storeData.longitud || null,
                storeData.telefono,
                storeData.horario || 'Por definir',
                storeData.descripcion || '',
                storeData.categoria || 'Otros',
                true
            ]
        );
        
        console.log('✅ Comercio creado exitosamente:', {
            user_id: newUser.rows[0].id,
            nombre_comercio: storeData.nombre_comercio,
            categoria: storeData.categoria
        });
    }

    // 5. Crear y firmar el JWT - usar 'rol' para compatibilidad con frontend
    const payload = {
        user: {
            id: newUser.rows[0].id,
            rol: newUser.rows[0].rol,
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
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const userResult = await pool.query('SELECT id FROM users WHERE lower(email) = lower($1)', [normalizedEmail]);
    if (userResult.rows.length === 0) {
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
    const frontendUrl = (process.env.FRONTEND_URL || 'https://delicrunch.vercel.app').replace(/\\/+$/, '');
    const resetUrl = frontendUrl + '/reset-password/' + encodeURIComponent(resetToken);
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: Number(process.env.EMAIL_PORT || 465) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'Restablecimiento de Contraseña de Delicrunch',
        text: `Has recibido este email porque solicitaste un restablecimiento de contraseña. Por favor, haz clic en el siguiente enlace, o pégalo en tu navegador para completar el proceso: \n\n ${resetUrl}`
    };

    const info = await transporter.sendMail(mailOptions);

    res.status(200).json({ msg: 'Email enviado.' });
});

// @desc    Restablecer la contraseña
exports.resetPassword = asyncHandler(async (req, res, next) => {
    const resetToken = req.params.token;
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const userResult = await pool.query(
        'SELECT id, password_hash FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
        [passwordResetToken]
    );

    if (userResult.rows.length === 0) {
        return res.status(400).json({ msg: 'El token para restablecer la contraseña no es válido o ha expirado.' });
    }

    const user = userResult.rows[0];
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
