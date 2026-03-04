const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// ============ RUTAS PÚBLICAS ============

// @ruta    GET api/reviews/product/:productId
// @desc    Obtener todas las reseñas de un producto
// @acceso  Público
router.get('/product/:productId', reviewController.getProductReviews);

// @ruta    GET api/reviews/store/:storeId
// @desc    Obtener todas las reseñas de una tienda
// @acceso  Público
router.get('/store/:storeId', reviewController.getStoreReviews);

// @ruta    GET api/reviews/store/:storeId/stats
// @desc    Obtener estadísticas de reseñas de una tienda
// @acceso  Público
router.get('/store/:storeId/stats', reviewController.getStoreReviewStats);

// ============ RUTAS PRIVADAS (COMPRADOR) ============

// @ruta    POST api/reviews
// @desc    Crear una nueva reseña para un pedido/producto (con soporte de imágenes)
// @acceso  Privado (solo compradores que hayan comprado)
router.post('/', authMiddleware, upload.array('images', 3), reviewController.createReview);

// @ruta    GET api/reviews/my
// @desc    Obtener reseñas del usuario autenticado
// @acceso  Privado
router.get('/my', authMiddleware, reviewController.getUserReviews);

// @ruta    PUT api/reviews/:reviewId
// @desc    Actualizar una reseña propia
// @acceso  Privado (solo el propietario)
router.put('/:reviewId', authMiddleware, reviewController.updateReview);

// @ruta    DELETE api/reviews/:reviewId
// @desc    Eliminar una reseña (propietario o admin)
// @acceso  Privado
router.delete('/:reviewId', authMiddleware, reviewController.deleteReview);

// ============ RUTAS PARA COMERCIOS ============

// @ruta    GET api/reviews/mystore
// @desc    Obtener reseñas de mi tienda (para comercios)
// @acceso  Privado (Comercio)
router.get('/mystore', authMiddleware, reviewController.getMyStoreReviews);

// @ruta    POST api/reviews/mystore/:reviewId/respond
// @desc    Responder a una reseña de mi tienda (para comercios)
// @acceso  Privado (Comercio)
router.post('/mystore/:reviewId/respond', authMiddleware, reviewController.storeRespondToReview);

// ============ RUTAS ADMIN ============

// @ruta    GET api/reviews/admin/all
// @desc    Obtener TODAS las reseñas (con filtros)
// @acceso  Privado (Admin)
router.get('/admin/all', authMiddleware, reviewController.getAllReviews);

// @ruta    POST api/reviews/admin/:reviewId/respond
// @desc    Responder a una reseña
// @acceso  Privado (Admin)
router.post('/admin/:reviewId/respond', authMiddleware, reviewController.respondToReview);

// @ruta    PATCH api/reviews/admin/:reviewId/visibility
// @desc    Cambiar visibilidad de una reseña
// @acceso  Privado (Admin)
router.patch('/admin/:reviewId/visibility', authMiddleware, reviewController.toggleReviewVisibility);

// ============ RUTAS LEGACY (mantener compatibilidad) ============

// @ruta    GET api/reviews
// @desc    Obtener reseñas del usuario autenticado (legacy)
// @acceso  Privado
router.get('/', authMiddleware, reviewController.getUserReviews);

// @ruta    GET api/reviews/:productId
// @desc    Obtener todas las reseñas de un producto (legacy)
// @acceso  Público
router.get('/:productId', reviewController.getProductReviews);

module.exports = router;