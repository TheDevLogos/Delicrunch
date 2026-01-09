const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncHandler = require('../middleware/asyncHandler');
const pool = require('../db');

/**
 * @desc    Crear una intención de pago para un marketplace (Stripe Connect)
 * @route   POST /api/payments/create-payment-intent
 * @access  Privado (Comprador)
 */
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { productId } = req.body;

    // Validación básica
    if (!productId) {
        return res.status(400).json({ msg: 'Se requiere el ID del producto.' });
    }

    // 1. Obtener el producto y el ID de la cuenta de Stripe del vendedor.
    const productResult = await pool.query(
        `SELECT p.precio_descuento, s.stripe_account_id
         FROM products p
         JOIN stores s ON p.store_id = s.id
         WHERE p.id = $1`,
        [productId]
    );

    if (productResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado.' });
    }

    const product = productResult.rows[0];
    const merchantStripeAccountId = product.stripe_account_id;

    if (!merchantStripeAccountId) {
        return res.status(400).json({ msg: 'El comercio asociado a este producto no está configurado para recibir pagos.' });
    }

    // 2. Calcular montos en centavos.
    const priceInCents = Math.round(product.precio_descuento * 100);
    const applicationFeeAmount = Math.round(priceInCents * 0.25); // Comisión del 25% para la plataforma

    // 3. Crear el PaymentIntent con la división del pago.
    const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: 'mxn',
        automatic_payment_methods: {
            enabled: true,
        },
        application_fee_amount: applicationFeeAmount, // La comisión que se queda la plataforma
        transfer_data: {
            destination: merchantStripeAccountId, // La cuenta del comercio que recibe el resto
        },
    });

    // 4. Enviar el client_secret al frontend para que inicialice el PaymentSheet.
    res.json({
        clientSecret: paymentIntent.client_secret,
    });
});

/**
 * @desc    Crear un enlace de onboarding de Stripe Connect para un comercio
 * @route   POST /api/payments/create-account-link
 * @access  Privado (Comercio)
 */
exports.createAccountLink = asyncHandler(async (req, res, next) => {
    // 1. Asegurarse de que el usuario es un comercio
    if (req.user.rol !== 'comercio') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios.' });
    }

    const userId = req.user.id;

    // 2. Buscar la tienda y su stripe_account_id
    const storeResult = await pool.query('SELECT id, stripe_account_id FROM stores WHERE user_id = $1', [userId]);
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Tienda no encontrada para este usuario.' });
    }

    let { stripe_account_id: stripeAccountId, id: storeId } = storeResult.rows[0];

    // 3. Si el comercio aún no tiene una cuenta de Stripe, crear una.
    if (!stripeAccountId) {
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'MX', // O el país que corresponda
            email: req.user.email, // Opcional, pero recomendado
        });
        stripeAccountId = account.id;

        // Guardar el nuevo ID en nuestra base de datos
        await pool.query('UPDATE stores SET stripe_account_id = $1 WHERE id = $2', [stripeAccountId, storeId]);
    }

    // 4. Crear el enlace de la cuenta para el onboarding
    // Estas son las URLs a las que Stripe redirigirá al usuario.
    const returnUrl = `${process.env.FRONTEND_URL}/stripe-onboarding-success`; // URL en tu frontend
    const refreshUrl = `${process.env.BACKEND_URL}/api/payments/stripe-onboarding-refresh`;

    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
    });

    // 5. Devolver la URL del enlace al frontend
    res.json({ url: accountLink.url });
});

/**
 * @desc    Manejar el refresh del enlace de onboarding de Stripe
 * @route   GET /api/payments/stripe-onboarding-refresh
 * @access  Público (invocado por Stripe)
 */
exports.handleOnboardingRefresh = asyncHandler(async (req, res, next) => {
    // Stripe añade 'account' como query param, pero no lo necesitamos para la lógica.
    // Simplemente redirigimos al usuario a una página de error en el frontend.
    // El frontend le pedirá al usuario que vuelva a intentar el proceso.
    res.redirect(`${process.env.FRONTEND_URL}/stripe-onboarding-error`);
});

/**
 * @desc    Obtener el estado de la cuenta de Stripe del comercio logueado
 * @route   GET /api/payments/stripe-account-status
 * @access  Privado (Comercio)
 */
exports.getAccountStatus = asyncHandler(async (req, res, next) => {
    if (req.user.rol !== 'comercio') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios.' });
    }

    const storeResult = await pool.query('SELECT stripe_account_id FROM stores WHERE user_id = $1', [req.user.id]);
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Tienda no encontrada.' });
    }

    const { stripe_account_id: stripeAccountId } = storeResult.rows[0];

    if (!stripeAccountId) {
        return res.json({ hasStripeAccount: false, chargesEnabled: false });
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    res.json({
        hasStripeAccount: true,
        chargesEnabled: account.charges_enabled,
    });
});

/**
 * @desc    Listar métodos de pago guardados del usuario (solo metadatos)
 * @route   GET /api/payments/methods
 * @access  Privado
 */
exports.listSavedCards = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await pool.query(
        'SELECT id, brand, last4, exp_month, exp_year, is_default, created_at FROM saved_cards WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
        [userId]
    );
    res.json(result.rows);
});

/**
 * @desc    Agregar un método de pago (solo metadatos, no almacenar PAN/CVV)
 * @route   POST /api/payments/methods
 * @access  Privado
 */
exports.addSavedCard = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { brand, last4, exp_month, exp_year, make_default } = req.body;

    if (!brand || !last4 || String(last4).length !== 4 || !exp_month || !exp_year) {
        return res.status(400).json({ msg: 'Datos de tarjeta inválidos (solo metadatos).' });
    }

    await pool.query('BEGIN');
    try {
        let isDefault = false;
        if (make_default) {
            await pool.query('UPDATE saved_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
            isDefault = true;
        }
        const insert = await pool.query(
            `INSERT INTO saved_cards (user_id, brand, last4, exp_month, exp_year, is_default)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, brand, last4, exp_month, exp_year, is_default, created_at`,
            [userId, brand, String(last4).slice(-4), parseInt(exp_month), parseInt(exp_year), isDefault]
        );
        await pool.query('COMMIT');
        res.status(201).json(insert.rows[0]);
    } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
    }
});

/**
 * @desc    Eliminar un método de pago guardado
 * @route   DELETE /api/payments/methods/:id
 * @access  Privado
 */
exports.deleteSavedCard = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const id = req.params.id;
    const del = await pool.query('DELETE FROM saved_cards WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    if (del.rowCount === 0) {
        return res.status(404).json({ msg: 'Tarjeta no encontrada' });
    }
    res.json({ msg: 'Eliminada' });
});

/**
 * @desc    Establecer un método de pago como predeterminado
 * @route   PUT /api/payments/methods/:id/default
 * @access  Privado
 */
exports.setDefaultSavedCard = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const id = req.params.id;
    await pool.query('BEGIN');
    try {
        const exists = await pool.query('SELECT id FROM saved_cards WHERE id = $1 AND user_id = $2', [id, userId]);
        if (exists.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ msg: 'Tarjeta no encontrada' });
        }
        await pool.query('UPDATE saved_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
        await pool.query('UPDATE saved_cards SET is_default = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
        await pool.query('COMMIT');
        res.json({ msg: 'Tarjeta establecida como predeterminada' });
    } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
    }
});