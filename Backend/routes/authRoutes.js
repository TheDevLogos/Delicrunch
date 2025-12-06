const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @ruta    POST api/auth/register
// @desc    Registrar un nuevo usuario (comprador o comercio)
// @acceso  Público
router.post('/register', authController.registerUser);
// @ruta    POST api/auth/login
// @desc    Iniciar sesión y obtener token
// @acceso  Público
router.post('/login', authController.loginUser);
// @ruta    POST api/auth/forgot-password
// @desc    Solicitar restablecimiento de contraseña
// @acceso  Público
router.post('/forgot-password', authController.forgotPassword);
// @ruta    POST api/auth/reset-password/:token
// @desc    Restablecer la contraseña con un token
// @acceso  Público
router.post('/reset-password/:token', authController.resetPassword);
module.exports = router;
