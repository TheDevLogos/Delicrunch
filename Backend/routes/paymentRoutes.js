const express = require('express');
const router = express.Router();
const { 
    createPaymentIntent, 
    createAccountLink,
    handleOnboardingRefresh,
    getAccountStatus
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/payments/create-payment-intent
// @desc    Crea una intención de pago con Stripe
// @access  Privado
router.post('/create-payment-intent', authMiddleware, createPaymentIntent);

// @route   POST /api/payments/create-account-link
// @desc    Crea un enlace de onboarding de Stripe para un comercio
// @access  Privado (Comercio)
router.post('/create-account-link', authMiddleware, createAccountLink);

// @route   GET /api/payments/stripe-account-status
// @desc    Obtiene el estado de la cuenta de Stripe del comercio
// @access  Privado (Comercio)
router.get('/stripe-account-status', authMiddleware, getAccountStatus);

router.get('/stripe-onboarding-refresh', handleOnboardingRefresh);

module.exports = router;