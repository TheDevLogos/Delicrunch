const express = require('express');
const router = express.Router();
const { 
    createPreference,
    handleWebhook,
    getPaymentStatus,
    merchantSetup,
    getMerchantStatus,
    getMerchantBalance,
    getMerchantPayouts,
    listSavedCards,
    addSavedCard,
    deleteSavedCard,
    setDefaultSavedCard,
    paymentCallback,
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// === MERCADO PAGO CHECKOUT PRO ===

// @route   POST /api/payments/create-preference
// @desc    Crea una preferencia de pago para Checkout Pro
// @access  Privado (Comprador)
router.post('/create-preference', authMiddleware, createPreference);

// @route   POST /api/payments/webhook
// @desc    Webhook para notificaciones de Mercado Pago
// @access  Público (llamado por Mercado Pago)
router.post('/webhook', handleWebhook);

// @route   GET /api/payments/status/:paymentId
// @desc    Obtiene el estado de un pago
// @access  Privado
router.get('/status/:paymentId', authMiddleware, getPaymentStatus);

// === CALLBACKS DE MERCADO PAGO ===

// @route   GET /api/payments/callback/success
// @desc    Callback de pago exitoso - redirige a la app móvil
// @access  Público (llamado por Mercado Pago redirect)
router.get('/callback/success', paymentCallback);

// @route   GET /api/payments/callback/failure
// @desc    Callback de pago fallido - redirige a la app móvil
// @access  Público (llamado por Mercado Pago redirect)
router.get('/callback/failure', paymentCallback);

// @route   GET /api/payments/callback/pending
// @desc    Callback de pago pendiente - redirige a la app móvil
// @access  Público (llamado por Mercado Pago redirect)
router.get('/callback/pending', paymentCallback);

// === CONFIGURACIÓN DE COMERCIOS ===

// @route   POST /api/payments/merchant-setup
// @desc    Configura cuenta de Mercado Pago para comercio
// @access  Privado (Comercio)
router.post('/merchant-setup', authMiddleware, merchantSetup);

// @route   GET /api/payments/merchant-status
// @desc    Obtiene el estado de configuración del comercio
// @access  Privado (Comercio)
router.get('/merchant-status', authMiddleware, getMerchantStatus);

// @route   GET /api/payments/merchant-balance
// @desc    Obtiene el balance del comercio
// @access  Privado (Comercio)
router.get('/merchant-balance', authMiddleware, getMerchantBalance);

// @route   GET /api/payments/merchant-payouts
// @desc    Obtiene historial de pagos del comercio
// @access  Privado (Comercio)
router.get('/merchant-payouts', authMiddleware, getMerchantPayouts);

// === MÉTODOS DE PAGO GUARDADOS ===

// @route   GET /api/payments/methods
// @desc    Lista métodos de pago guardados
// @access  Privado
router.get('/methods', authMiddleware, listSavedCards);

// @route   POST /api/payments/methods
// @desc    Agrega un método de pago
// @access  Privado
router.post('/methods', authMiddleware, addSavedCard);

// @route   DELETE /api/payments/methods/:id
// @desc    Elimina un método de pago
// @access  Privado
router.delete('/methods/:id', authMiddleware, deleteSavedCard);

// @route   PUT /api/payments/methods/:id/default
// @desc    Establece método de pago como predeterminado
// @access  Privado
router.put('/methods/:id/default', authMiddleware, setDefaultSavedCard);

module.exports = router;
