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

// El canje se valida y ejecuta únicamente al crear el ticket.

// Otorgar cupón por nivel
router.post('/grant-level', couponController.grantLevelCoupon);

// Obtener definiciones / estado por nivel
router.get('/definitions', couponController.getLevelCoupons);

// La XP solo se acredita en el servidor al verificar la recogida.
router.get('/xp/history', couponController.getXpHistory);

// Estadísticas de gamificación
router.get('/stats', couponController.getGamificationStats);

module.exports = router;
