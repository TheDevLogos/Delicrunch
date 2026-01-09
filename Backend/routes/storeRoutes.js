const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// @route   GET /api/stores/with-products
// @desc    Obtener todas las tiendas con packs disponibles y ubicación
// @access  Público
router.get('/with-products', storeController.getStoresWithProducts);

// @route   GET /api/stores/:id
// @desc    Obtener detalles de una tienda específica con productos y reseñas
// @access  Público
router.get('/:id', storeController.getStoreById);

module.exports = router;
