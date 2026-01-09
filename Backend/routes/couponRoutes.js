/**
 * Coupon Routes
 * Endpoints para el sistema de cupones y recompensas
 */
const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Cupones del usuario
router.get('/my', couponController.getMyCoupons);
router.get('/available', couponController.getAvailableCoupons);

// Validar y usar cupones
router.post('/validate', couponController.validateCoupon);
router.post('/use', couponController.useCoupon);

// Otorgar cupón por nivel
router.post('/grant-level', couponController.grantLevelCoupon);

// XP y transacciones
router.post('/xp', couponController.recordXpTransaction);
router.get('/xp/history', couponController.getXpHistory);

// Estadísticas de gamificación
router.get('/stats', couponController.getGamificationStats);

module.exports = router;
