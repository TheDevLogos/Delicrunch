const express = require('express');
const router = express.Router();

// Importamos el controlador y el middleware
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// @ruta    GET api/profiles/me
// @desc    Obtener el perfil del usuario logueado
// @acceso  Privado (requiere token)
//
// Aquí está la magia: pasamos 'authMiddleware' como segundo argumento.
// Express lo ejecutará antes de pasar la solicitud a 'getLoggedInUserProfile'.
router.get('/me', authMiddleware, profileController.getLoggedInUserProfile);

// @ruta    PUT api/profiles/me
// @desc    Actualizar datos del usuario (nombre, ciudad, teléfono, dirección, foto de perfil)
// @acceso  Privado (requiere token)
router.put('/me', authMiddleware, upload.single('foto_perfil'), profileController.updateLoggedInUserProfile);

// @ruta    PUT api/profiles/store
// @desc    Actualizar el perfil de la tienda del comercio logueado
// @acceso  Privado (requiere token y ser rol 'comercio')
router.put('/store', authMiddleware, profileController.updateStoreProfile);


module.exports = router;