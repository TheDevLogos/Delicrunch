const express = require('express');
const router = express.Router();

// Legacy clients must never create a charge after the cash-only transition.
// Keep the path explicit so old app versions receive a clear response.
router.all('*', (req, res) => {
    res.status(410).json({
        msg: 'Los pagos en la app ya no están disponibles. Actualiza Delicrunch para reservar y pagar en efectivo en el comercio.',
    });
});

module.exports = router;
