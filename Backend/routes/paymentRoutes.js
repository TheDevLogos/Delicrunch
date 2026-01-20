const express = require('express');
const router = express.Router();
const { 
    createCustomerSession,
    createPaymentIntent, 
    createAccountLink,
    handleOnboardingRefresh,
    getAccountStatus,
    getConnectedAccountBalance,
    getUpcomingPayouts,
    listSavedCards,
    addSavedCard,
    deleteSavedCard,
    setDefaultSavedCard,
    getStripeCustomerCards,
    setDefaultPaymentMethod,
    syncCards,
    deletePaymentMethod,
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/payments/customer-session
// @desc    Crea Customer, Ephemeral Key y SetupIntent para guardar tarjetas
// @access  Privado (Comprador)
router.post('/customer-session', authMiddleware, createCustomerSession);

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
// @route   GET /api/payments/connected-account-balance
// @desc    Obtiene el balance de la cuenta conectada del comercio
// @access  Privado (Comercio)
router.get('/connected-account-balance', authMiddleware, getConnectedAccountBalance);

// @route   GET /api/payments/upcoming-payouts
// @desc    Obtiene los próximos pagos de la cuenta conectada
// @access  Privado (Comercio)
router.get('/upcoming-payouts', authMiddleware, getUpcomingPayouts);

router.get('/stripe-account-status', authMiddleware, getAccountStatus);

router.get('/stripe-onboarding-refresh', handleOnboardingRefresh);

// @route   GET /api/payments/stripe-cards/:customerId
// @desc    Obtiene las tarjetas guardadas en Stripe de un customer
// @access  Privado (Comprador)
router.get('/stripe-cards/:customerId', authMiddleware, getStripeCustomerCards);

// @route   PUT /api/payments/set-default-payment-method
// @desc    Establece un payment method como predeterminado en Stripe y BD
// @access  Privado (Comprador)
router.put('/set-default-payment-method', authMiddleware, setDefaultPaymentMethod);

// @route   POST /api/payments/sync-cards
// @desc    Sincroniza tarjetas de Stripe con la base de datos local
// @access  Privado (Comprador)
router.post('/sync-cards', authMiddleware, syncCards);

// @route   DELETE /api/payments/payment-methods/:paymentMethodId
// @desc    Elimina un payment method de Stripe y BD
// @access  Privado (Comprador)
router.delete('/payment-methods/:paymentMethodId', authMiddleware, deletePaymentMethod);

// Métodos de pago guardados (solo metadatos, no PCI)
router.get('/methods', authMiddleware, listSavedCards);
router.post('/methods', authMiddleware, addSavedCard);
router.delete('/methods/:id', authMiddleware, deleteSavedCard);
router.put('/methods/:id/default', authMiddleware, setDefaultSavedCard);

module.exports = router;