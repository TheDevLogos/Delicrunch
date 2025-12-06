const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function (req, res, next) {
    // 1. Obtener el token del encabezado de la solicitud
    // Por convención, los tokens se envían en un encabezado llamado 'x-auth-token'
    // o 'Authorization: Bearer <token>'. Usaremos 'x-auth-token' por simplicidad.
    const token = req.header('x-auth-token');

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