const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// @ruta    POST api/reviews
// @desc    Crear una nueva reseña para un pedido
// @acceso  Privado (solo el comprador del pedido)
router.post('/', authMiddleware, reviewController.createReview);

// @ruta    GET api/reviews/:productId
// @desc    Obtener todas las reseñas de un producto
// @acceso  Público
router.get('/:productId', reviewController.getProductReviews);


module.exports = router;