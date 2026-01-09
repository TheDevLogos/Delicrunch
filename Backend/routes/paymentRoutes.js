const express = require('express');
const router = express.Router();
const { 
    createPaymentIntent, 
    createAccountLink,
    handleOnboardingRefresh,
    getAccountStatus,
    listSavedCards,
    addSavedCard,
    deleteSavedCard,
    setDefaultSavedCard,
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

// Métodos de pago guardados (solo metadatos, no PCI)
router.get('/methods', authMiddleware, listSavedCards);
router.post('/methods', authMiddleware, addSavedCard);
router.delete('/methods/:id', authMiddleware, deleteSavedCard);
router.put('/methods/:id/default', authMiddleware, setDefaultSavedCard);

module.exports = router;