const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/stores
// @desc    Obtener todas las tiendas (sin filtros)
// @access  Público
router.get('/', storeController.getAllStores);

// @route   GET /api/stores/my-store
// @desc    Obtener la tienda del usuario autenticado
// @access  Privado (Solo comercios)
router.get('/my-store', authMiddleware, storeController.getMyStore);

// @route   GET /api/stores/with-products
// @desc    Obtener todas las tiendas con packs disponibles y ubicación
// @access  Público
router.get('/with-products', storeController.getStoresWithProducts);

// @route   PUT /api/stores/me/cover
// @desc    Actualizar portada (cover_url) de la tienda del usuario
// @access  Privado (Solo comercios)
router.put('/me/cover', authMiddleware, storeController.updateStoreCover);

// @route   GET /api/stores/:id
// @desc    Obtener detalles de una tienda específica con productos y reseñas
// @access  Público
router.get('/:id', storeController.getStoreById);

module.exports = router;
