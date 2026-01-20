const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncHandler = require('../middleware/asyncHandler');
const pool = require('../db');

/**
 * @desc    Crear Customer Session para guardar tarjetas (Ephemeral Key + SetupIntent)
 * @route   POST /api/payments/customer-session
 * @access  Privado (Comprador)
 */
exports.createCustomerSession = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // 1. Validar que el usuario sea comprador o admin
    if (req.user.rol !== 'comprador' && req.user.rol !== 'admin') {
        return res.status(403).json({ 
            msg: 'Acción no autorizada. Solo compradores y administradores pueden guardar tarjetas.' 
        });
    }

    // 2. Buscar el perfil del usuario y su stripe_customer_id
    const profileResult = await pool.query(
        'SELECT id, stripe_customer_id FROM profiles WHERE user_id = $1',
        [userId]
    );

    if (profileResult.rows.length === 0) {
        return res.status(404).json({ 
            msg: 'Perfil no encontrado. Verifica que el usuario esté registrado correctamente.' 
        });
    }

    let { stripe_customer_id: stripeCustomerId } = profileResult.rows[0];
    const profileId = profileResult.rows[0].id;

    // 3. Si no existe stripe_customer_id, crear un Customer en Stripe
    if (!stripeCustomerId) {
        try {
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    user_id: userId.toString(),
                    profile_id: profileId.toString(),
                    platform: 'delicrunch',
                },
            });
            
            stripeCustomerId = customer.id;

            // Guardar el customer_id en la base de datos
            await pool.query(
                'UPDATE profiles SET stripe_customer_id = $1 WHERE id = $2',
                [stripeCustomerId, profileId]
            );

            console.log(`✅ Stripe Customer creado: ${stripeCustomerId} para user_id: ${userId}`);
        } catch (error) {
            console.error('❌ Error al crear Stripe Customer:', error);
            return res.status(500).json({ 
                msg: 'Error al crear cliente en Stripe.',
                error: error.message 
            });
        }
    }

    // 4. Crear Ephemeral Key para el Customer
    let ephemeralKey;
    try {
        ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: stripeCustomerId },
            { apiVersion: '2024-12-18.acacia' } // Versión fija de la API de Stripe
        );
    } catch (error) {
        console.error('❌ Error al crear Ephemeral Key:', error);
        return res.status(500).json({ 
            msg: 'Error al crear clave efímera.',
            error: error.message 
        });
    }

    // 5. Crear SetupIntent para guardar método de pago
    let setupIntent;
    try {
        setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            usage: 'off_session', // Para pagos futuros sin que el usuario esté presente
            metadata: {
                user_id: userId.toString(),
                purpose: 'save_card_for_future_payments',
            },
        });
    } catch (error) {
        console.error('❌ Error al crear SetupIntent:', error);
        return res.status(500).json({ 
            msg: 'Error al crear intención de configuración.',
            error: error.message 
        });
    }

    // 6. Retornar los datos necesarios al cliente
    res.json({
        customerId: stripeCustomerId,
        ephemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: setupIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
});

/**
 * @desc    Crear una intención de pago para un marketplace (Stripe Connect)
 * @route   POST /api/payments/create-payment-intent
 * @access  Privado (Comprador)
 * 
 * MODELO: Destination Charges
 * - La plataforma (Delicrunch) cobra al comprador
 * - Se envía 75% al comercio automáticamente (transfer_data)
 * - La plataforma retiene 25% (application_fee_amount)
 * - Comprador ve "Delicrunch" como merchant
 * 
 * IDEMPOTENCIA: Usa idempotency_key para evitar duplicados
 */
exports.createPaymentIntent = asyncHandler(async (req, res, next) => {
    const { productId, cantidad = 1, coupon_discount = 0, payment_method_id } = req.body;
    const userId = req.user.id;

    // === VALIDACIONES MEJORADAS ===
    if (!productId) {
        console.warn('⚠️ Payment Intent: Missing productId', { userId });
        return res.status(400).json({ msg: 'Se requiere el ID del producto.' });
    }

    if (cantidad < 1 || cantidad > 10) {
        return res.status(400).json({ 
            msg: 'La cantidad debe estar entre 1 y 10 unidades.' 
        });
    }

    // === IDEMPOTENCY KEY ===
    // Previene duplicación si usuario hace doble clic
    const timestamp = Date.now();
    const idempotencyKey = `pi_${userId}_${productId}_${cantidad}_${timestamp}`;

    console.log('💰 Creating Payment Intent', {
        userId,
        productId,
        cantidad,
        couponDiscount: coupon_discount,
        idempotencyKey,
        timestamp: new Date(timestamp).toISOString(),
    });

    try {
        // 1. Obtener producto completo con datos del comercio
        const productResult = await pool.query(
            `SELECT p.id, p.nombre, p.precio_descuento, p.store_id, p.activo,
                    s.stripe_account_id, s.nombre_comercio, s.comision_plataforma
             FROM products p
             JOIN stores s ON p.store_id = s.id
             WHERE p.id = $1`,
            [productId]
        );

        if (productResult.rows.length === 0) {
            console.warn('⚠️ Product not found or inactive', { productId });
            return res.status(404).json({ msg: 'Producto no encontrado.' });
        }

        const product = productResult.rows[0];

        // Verificar que producto esté activo
        if (!product.activo) {
            return res.status(400).json({ msg: 'Este producto no está disponible actualmente.' });
        }

        const merchantStripeAccountId = product.stripe_account_id;

        if (!merchantStripeAccountId) {
            console.error('❌ Merchant not configured for payments', {
                storeId: product.store_id,
                productId,
                storeName: product.nombre_comercio,
            });
            return res.status(400).json({ 
                msg: 'El comercio asociado a este producto no está configurado para recibir pagos.' 
            });
        }

        // === VALIDAR ESTADO DE CUENTA MERCHANT ===
        // Crítico: Verificar que la cuenta pueda recibir pagos
        let merchantAccount;
        try {
            merchantAccount = await stripe.accounts.retrieve(merchantStripeAccountId);
            
            if (!merchantAccount.charges_enabled) {
                console.error('❌ Merchant charges not enabled', {
                    accountId: merchantStripeAccountId,
                    storeName: product.nombre_comercio,
                });
                return res.status(400).json({
                    msg: 'El comercio no puede recibir pagos en este momento. Por favor, contacta soporte.'
                });
            }

            console.log('✅ Merchant account validated', {
                accountId: merchantStripeAccountId,
                chargesEnabled: merchantAccount.charges_enabled,
                payoutsEnabled: merchantAccount.payouts_enabled,
            });
        } catch (error) {
            console.error('❌ Error retrieving merchant account', {
                accountId: merchantStripeAccountId,
                error: error.message,
            });
            return res.status(500).json({
                msg: 'Error al verificar la cuenta del comercio. Intenta de nuevo.'
            });
        }

        // 2. Obtener stripe_customer_id del comprador
        const profileResult = await pool.query(
            'SELECT stripe_customer_id FROM profiles WHERE user_id = $1',
            [userId]
        );

        let stripeCustomerId = null;
        if (profileResult.rows.length > 0) {
            stripeCustomerId = profileResult.rows[0].stripe_customer_id;
        }

        // 3. Calcular montos en centavos
        const subtotal = Number(product.precio_descuento) * Number(cantidad);
        const totalAfterCoupon = Math.max(0, subtotal - Number(coupon_discount));
        
        // Validar mínimo de transacción (Stripe MXN: ~$10)
        if (totalAfterCoupon < 10) {
            return res.status(400).json({
                msg: 'El monto mínimo de compra es $10.00 MXN.'
            });
        }

        // Validar máximo (prevenir errores)
        if (totalAfterCoupon > 500000) {
            return res.status(400).json({
                msg: 'El monto máximo por transacción es $500,000.00 MXN.'
            });
        }

        const priceInCents = Math.round(totalAfterCoupon * 100);
        const comisionPorcentaje = product.comision_plataforma || 25; // Default 25%
        const applicationFeeAmount = Math.round(priceInCents * (comisionPorcentaje / 100));
        const merchantAmount = priceInCents - applicationFeeAmount;

        console.log('💰 Payment calculation', {
            productName: product.nombre,
            storeName: product.nombre_comercio,
            cantidad,
            subtotal,
            couponDiscount: coupon_discount,
            totalAfterCoupon,
            priceInCents,
            applicationFeeAmount,
            merchantAmount,
            platformPercentage: comisionPorcentaje,
            merchantPercentage: 100 - comisionPorcentaje,
        });

        // 4. Crear el PaymentIntent con la división del pago
        const paymentIntentData = {
            amount: priceInCents,
            currency: 'mxn',
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never', // Solo tarjetas, no OXXO/SPEI
            },
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
                destination: merchantStripeAccountId,
            },
            metadata: {
                product_id: productId.toString(),
                product_name: product.nombre,
                cantidad: cantidad.toString(),
                user_id: userId.toString(),
                store_id: product.store_id.toString(),
                store_name: product.nombre_comercio,
                coupon_discount: coupon_discount.toString(),
                subtotal: subtotal.toString(),
                total: totalAfterCoupon.toString(),
                commission_percentage: comisionPorcentaje.toString(),
                platform_fee: (applicationFeeAmount / 100).toString(),
                merchant_amount: (merchantAmount / 100).toString(),
            },
            description: `${cantidad}x ${product.nombre} - ${product.nombre_comercio}`,
        };

        // Si existe customer, asociarlo para usar tarjetas guardadas
        if (stripeCustomerId) {
            paymentIntentData.customer = stripeCustomerId;
        }

        // Si se proporciona payment_method, asociarlo
        if (payment_method_id) {
            paymentIntentData.payment_method = payment_method_id;
            paymentIntentData.confirm = false; // El frontend confirmará
        }

        // Crear PaymentIntent con IDEMPOTENCIA
        const paymentIntent = await stripe.paymentIntents.create(
            paymentIntentData,
            {
                idempotencyKey: idempotencyKey,
            }
        );

        console.log('✅ Payment Intent created successfully', {
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status,
            applicationFeeAmount: paymentIntent.application_fee_amount,
            merchantAccount: merchantStripeAccountId,
        });

        // 5. Guardar en BD para auditoría (opcional pero recomendado)
        try {
            await pool.query(
                `INSERT INTO payment_intents (
                    stripe_payment_intent_id, user_id, product_id, store_id,
                    amount, currency, status, application_fee_amount, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (stripe_payment_intent_id) DO NOTHING`,
                [
                    paymentIntent.id,
                    userId,
                    productId,
                    product.store_id,
                    priceInCents,
                    'mxn',
                    paymentIntent.status,
                    applicationFeeAmount,
                    JSON.stringify(paymentIntent.metadata),
                ]
            );
        } catch (dbError) {
            // No fallar si la tabla no existe aún, solo log warning
            console.warn('⚠️ Could not save payment_intent to DB (table may not exist)', {
                error: dbError.message,
            });
        }

        // 6. Enviar el client_secret al frontend para que inicialice el PaymentSheet
        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: totalAfterCoupon,
            merchantAmount: merchantAmount / 100,
            platformFee: applicationFeeAmount / 100,
        });

    } catch (error) {
        console.error('❌ Error creating Payment Intent', {
            userId,
            productId,
            error: error.message,
            errorType: error.type,
            errorCode: error.code,
            errorParam: error.param,
        });

        // === MANEJO ESPECÍFICO DE ERRORES STRIPE ===
        if (error.type === 'StripeCardError') {
            return res.status(402).json({
                msg: 'Tu tarjeta fue declinada.',
                decline_code: error.decline_code,
            });
        }

        if (error.type === 'StripeRateLimitError') {
            return res.status(429).json({
                msg: 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.',
            });
        }

        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({
                msg: 'Solicitud inválida. Verifica los datos e intenta de nuevo.',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            });
        }

        if (error.type === 'StripeAPIError') {
            return res.status(500).json({
                msg: 'Error en el servicio de pagos. Intenta más tarde.',
            });
        }

        if (error.type === 'StripeConnectionError') {
            return res.status(503).json({
                msg: 'No se pudo conectar con el servicio de pagos. Verifica tu conexión.',
            });
        }

        if (error.type === 'StripeAuthenticationError') {
            console.error('🔥 CRITICAL: Stripe authentication failed', { 
                error: error.message 
            });
            return res.status(500).json({
                msg: 'Error de autenticación con el servicio de pagos. Contacta soporte.',
            });
        }

        // Error genérico
        return res.status(500).json({
            msg: 'Error al crear la intención de pago.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

/**
 * @desc    Crear un enlace de onboarding de Stripe Connect para un comercio
 * @route   POST /api/payments/create-account-link
 * @access  Privado (Comercio)
 */
exports.createAccountLink = asyncHandler(async (req, res, next) => {
    // 1. Asegurarse de que el usuario es un comercio o admin
    if (req.user.rol !== 'comercio' && req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios y administradores.' });
    }

    const userId = req.user.id;
    let stripeAccountId, entityId, tableName;

    // 2. Buscar stripe_account_id según el rol
    if (req.user.rol === 'comercio') {
        // Para comercios, usar stores
        const storeResult = await pool.query('SELECT id, stripe_account_id FROM stores WHERE user_id = $1', [userId]);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Tienda no encontrada para este usuario.' });
        }
        stripeAccountId = storeResult.rows[0].stripe_account_id;
        entityId = storeResult.rows[0].id;
        tableName = 'stores';
    } else {
        // Para admin, usar profiles
        const profileResult = await pool.query('SELECT id, stripe_account_id FROM profiles WHERE user_id = $1', [userId]);
        if (profileResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Perfil no encontrado para este usuario.' });
        }
        stripeAccountId = profileResult.rows[0].stripe_account_id;
        entityId = profileResult.rows[0].id;
        tableName = 'profiles';
    }

    // 3. Si aún no tiene una cuenta de Stripe, crear una
    if (!stripeAccountId) {
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'MX',
            email: req.user.email,
        });
        stripeAccountId = account.id;

        // Guardar el nuevo ID en nuestra base de datos
        await pool.query(`UPDATE ${tableName} SET stripe_account_id = $1 WHERE id = $2`, [stripeAccountId, entityId]);
    }

    // 4. Crear el enlace de la cuenta para el onboarding
    const returnUrl = `${process.env.FRONTEND_URL}/stripe-onboarding-success`;
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
    if (req.user.rol !== 'comercio' && req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios y administradores.' });
    }

    let stripeAccountId;

    // Buscar stripe_account_id según el rol
    if (req.user.rol === 'comercio') {
        const storeResult = await pool.query('SELECT stripe_account_id FROM stores WHERE user_id = $1', [req.user.id]);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Tienda no encontrada.' });
        }
        stripeAccountId = storeResult.rows[0].stripe_account_id;
    } else {
        const profileResult = await pool.query('SELECT stripe_account_id FROM profiles WHERE user_id = $1', [req.user.id]);
        if (profileResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Perfil no encontrado.' });
        }
        stripeAccountId = profileResult.rows[0].stripe_account_id;
    }

    if (!stripeAccountId) {
        return res.json({ 
            hasStripeAccount: false, 
            chargesEnabled: false,
            payoutsEnabled: false,
            detailsSubmitted: false,
        });
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    res.json({
        hasStripeAccount: true,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        country: account.country,
        defaultCurrency: account.default_currency,
        type: account.type,
        email: account.email,
    });
});

/**
 * @desc    Obtener balance de la cuenta conectada del comercio
 * @route   GET /api/payments/connected-account-balance
 * @access  Privado (Comercio)
 */
exports.getConnectedAccountBalance = asyncHandler(async (req, res, next) => {
    if (req.user.rol !== 'comercio' && req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios y administradores.' });
    }

    let stripeAccountId;

    // Buscar stripe_account_id según el rol
    if (req.user.rol === 'comercio') {
        const storeResult = await pool.query('SELECT stripe_account_id FROM stores WHERE user_id = $1', [req.user.id]);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Tienda no encontrada.' });
        }
        stripeAccountId = storeResult.rows[0].stripe_account_id;
    } else {
        const profileResult = await pool.query('SELECT stripe_account_id FROM profiles WHERE user_id = $1', [req.user.id]);
        if (profileResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Perfil no encontrado.' });
        }
        stripeAccountId = profileResult.rows[0].stripe_account_id;
    }

    if (!stripeAccountId) {
        return res.status(400).json({ msg: 'No tienes una cuenta de Stripe conectada.' });
    }

    // Obtener balance de la cuenta conectada
    const balance = await stripe.balance.retrieve({
        stripeAccount: stripeAccountId,
    });

    // Formatear respuesta
    res.json({
        available: balance.available.map(b => ({
            amount: b.amount / 100, // Convertir de centavos a pesos
            currency: b.currency.toUpperCase(),
        })),
        pending: balance.pending.map(b => ({
            amount: b.amount / 100,
            currency: b.currency.toUpperCase(),
        })),
    });
});

/**
 * @desc    Obtener próximos pagos (payouts) de la cuenta conectada
 * @route   GET /api/payments/upcoming-payouts
 * @access  Privado (Comercio)
 */
exports.getUpcomingPayouts = asyncHandler(async (req, res, next) => {
    if (req.user.rol !== 'comercio' && req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios y administradores.' });
    }

    let stripeAccountId;

    // Buscar stripe_account_id según el rol
    if (req.user.rol === 'comercio') {
        const storeResult = await pool.query('SELECT stripe_account_id FROM stores WHERE user_id = $1', [req.user.id]);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Tienda no encontrada.' });
        }
        stripeAccountId = storeResult.rows[0].stripe_account_id;
    } else {
        const profileResult = await pool.query('SELECT stripe_account_id FROM profiles WHERE user_id = $1', [req.user.id]);
        if (profileResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Perfil no encontrado.' });
        }
        stripeAccountId = profileResult.rows[0].stripe_account_id;
    }

    if (!stripeAccountId) {
        return res.status(400).json({ msg: 'No tienes una cuenta de Stripe conectada.' });
    }

    // Obtener últimos payouts
    const payouts = await stripe.payouts.list(
        { limit: 10 },
        { stripeAccount: stripeAccountId }
    );

    // Formatear respuesta
    const formattedPayouts = payouts.data.map(payout => ({
        id: payout.id,
        amount: payout.amount / 100,
        currency: payout.currency.toUpperCase(),
        status: payout.status,
        arrivalDate: payout.arrival_date,
        created: payout.created,
        description: payout.description,
        method: payout.method,
        type: payout.type,
    }));

    res.json({ payouts: formattedPayouts });
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
 * @desc    Obtener las tarjetas guardadas en Stripe de un customer
 * @route   GET /api/payments/stripe-cards/:customerId
 * @access  Privado (Comprador)
 */
exports.getStripeCustomerCards = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { customerId } = req.params;

    // Validar que el usuario sea comprador o admin
    if (req.user.rol !== 'comprador' && req.user.rol !== 'admin') {
        return res.status(403).json({ 
            msg: 'Acción no autorizada. Solo compradores y administradores pueden ver sus tarjetas.' 
        });
    }

    // Verificar que el customerId pertenece al usuario
    const profileResult = await pool.query(
        'SELECT stripe_customer_id FROM profiles WHERE user_id = $1',
        [userId]
    );

    if (profileResult.rows.length === 0 || profileResult.rows[0].stripe_customer_id !== customerId) {
        return res.status(403).json({ 
            msg: 'No tienes permisos para acceder a este customer.' 
        });
    }

    try {
        // Obtener payment methods del customer en Stripe
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
        });

        // Formatear la respuesta para el frontend
        const cards = paymentMethods.data.map(pm => ({
            id: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            funding: pm.card.funding,
            created: pm.created,
        }));

        console.log(`✅ Obtenidas ${cards.length} tarjetas para customer ${customerId}`);

        res.json({
            success: true,
            cards,
            count: cards.length,
        });

    } catch (error) {
        console.error('❌ Error al obtener tarjetas de Stripe:', error);
        res.status(500).json({ 
            msg: 'Error al obtener tarjetas guardadas.',
            error: error.message 
        });
    }
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

/**
 * @desc    Establecer payment method de Stripe como predeterminado
 * @route   PUT /api/payments/set-default-payment-method
 * @access  Privado (Comprador)
 */
exports.setDefaultPaymentMethod = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { paymentMethodId } = req.body;

    // Validar rol
    if (req.user.rol !== 'comprador' && req.user.rol !== 'admin') {
        return res.status(403).json({ 
            msg: 'Acción no autorizada. Solo compradores y administradores.' 
        });
    }

    if (!paymentMethodId) {
        return res.status(400).json({ msg: 'paymentMethodId es requerido' });
    }

    // 1. Obtener stripe_customer_id
    const profileResult = await pool.query(
        'SELECT stripe_customer_id FROM profiles WHERE user_id = $1',
        [userId]
    );

    if (profileResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Perfil no encontrado' });
    }

    const { stripe_customer_id: customerId } = profileResult.rows[0];

    if (!customerId) {
        return res.status(400).json({ msg: 'Usuario no tiene Customer en Stripe' });
    }

    try {
        // 2. Verificar que el payment method pertenece al customer
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        
        if (paymentMethod.customer !== customerId) {
            return res.status(403).json({ 
                msg: 'Este método de pago no pertenece a este usuario' 
            });
        }

        // 3. Actualizar en Stripe como payment method por defecto
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        // 4. Actualizar en BD local (profiles)
        await pool.query(
            'UPDATE profiles SET default_payment_method_id = $1 WHERE user_id = $2',
            [paymentMethodId, userId]
        );

        // 5. Actualizar saved_cards (mantener sincronía)
        await pool.query('UPDATE saved_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
        await pool.query(
            'UPDATE saved_cards SET is_default = TRUE WHERE stripe_payment_method_id = $1 AND user_id = $2',
            [paymentMethodId, userId]
        );

        console.log(`✅ Payment method ${paymentMethodId} establecido como default para user ${userId}`);

        res.json({
            success: true,
            msg: 'Método de pago establecido como predeterminado',
            paymentMethodId
        });

    } catch (error) {
        console.error('❌ Error al establecer payment method:', error);
        res.status(500).json({
            msg: 'Error al actualizar método de pago',
            error: error.message
        });
    }
});

/**
 * @desc    Sincronizar tarjetas de Stripe con BD local
 * @route   POST /api/payments/sync-cards
 * @access  Privado (Comprador)
 */
exports.syncCards = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Validar rol
    if (req.user.rol !== 'comprador' && req.user.rol !== 'admin') {
        return res.status(403).json({ 
            msg: 'Acción no autorizada. Solo compradores y administradores.' 
        });
    }

    // 1. Obtener stripe_customer_id
    const profileResult = await pool.query(
        'SELECT stripe_customer_id, default_payment_method_id FROM profiles WHERE user_id = $1',
        [userId]
    );

    if (profileResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Perfil no encontrado' });
    }

    const { stripe_customer_id: customerId, default_payment_method_id: currentDefault } = profileResult.rows[0];

    if (!customerId) {
        return res.status(400).json({ msg: 'Usuario no tiene Customer en Stripe' });
    }

    try {
        // 2. Obtener payment methods de Stripe
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
        });

        // 3. Obtener default payment method del customer en Stripe
        const customer = await stripe.customers.retrieve(customerId);
        const stripeDefaultPM = customer.invoice_settings?.default_payment_method;

        // 4. Eliminar tarjetas locales que no existen en Stripe
        await pool.query(
            `DELETE FROM saved_cards 
             WHERE user_id = $1 
             AND stripe_payment_method_id NOT IN (${paymentMethods.data.map((_, i) => `$${i + 2}`).join(',')})`,
            [userId, ...paymentMethods.data.map(pm => pm.id)]
        );

        // 5. Insertar o actualizar tarjetas
        for (const pm of paymentMethods.data) {
            const isDefault = stripeDefaultPM === pm.id;

            await pool.query(
                `INSERT INTO saved_cards 
                (user_id, stripe_payment_method_id, brand, last4, exp_month, exp_year, is_default)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, stripe_payment_method_id) 
                DO UPDATE SET 
                    brand = EXCLUDED.brand,
                    last4 = EXCLUDED.last4,
                    exp_month = EXCLUDED.exp_month,
                    exp_year = EXCLUDED.exp_year,
                    is_default = EXCLUDED.is_default`,
                [
                    userId,
                    pm.id,
                    pm.card.brand,
                    pm.card.last4,
                    pm.card.exp_month,
                    pm.card.exp_year,
                    isDefault
                ]
            );
        }

        // 6. Actualizar default en profiles si cambió en Stripe
        if (stripeDefaultPM && stripeDefaultPM !== currentDefault) {
            await pool.query(
                'UPDATE profiles SET default_payment_method_id = $1 WHERE user_id = $2',
                [stripeDefaultPM, userId]
            );
        }

        console.log(`✅ Sincronizadas ${paymentMethods.data.length} tarjetas para user ${userId}`);

        res.json({
            success: true,
            msg: 'Tarjetas sincronizadas correctamente',
            synced: paymentMethods.data.length,
            defaultPaymentMethodId: stripeDefaultPM
        });

    } catch (error) {
        console.error('❌ Error al sincronizar tarjetas:', error);
        res.status(500).json({
            msg: 'Error al sincronizar tarjetas',
            error: error.message
        });
    }
});

/**
 * @desc    Eliminar un payment method de Stripe
 * @route   DELETE /api/payments/payment-methods/:paymentMethodId
 * @access  Privado (Comprador)
 */
exports.deletePaymentMethod = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { paymentMethodId } = req.params;

    if (!paymentMethodId) {
        return res.status(400).json({ msg: 'paymentMethodId es requerido' });
    }

    // 1. Obtener customer
    const profileResult = await pool.query(
        'SELECT stripe_customer_id, default_payment_method_id FROM profiles WHERE user_id = $1',
        [userId]
    );

    if (profileResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Perfil no encontrado' });
    }

    const { stripe_customer_id: customerId, default_payment_method_id: defaultPM } = profileResult.rows[0];

    try {
        // 2. Verificar que el payment method pertenece al customer
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        
        if (paymentMethod.customer !== customerId) {
            return res.status(403).json({ 
                msg: 'Este método de pago no pertenece a este usuario' 
            });
        }

        // 3. Detach de Stripe
        await stripe.paymentMethods.detach(paymentMethodId);

        // 4. Eliminar de BD local
        await pool.query(
            'DELETE FROM saved_cards WHERE stripe_payment_method_id = $1 AND user_id = $2',
            [paymentMethodId, userId]
        );

        // 5. Si era la tarjeta por defecto, limpiar en profiles
        if (defaultPM === paymentMethodId) {
            await pool.query(
                'UPDATE profiles SET default_payment_method_id = NULL WHERE user_id = $1',
                [userId]
            );

            // Establecer otra tarjeta como default si existe
            const remainingCards = await pool.query(
                'SELECT stripe_payment_method_id FROM saved_cards WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1',
                [userId]
            );

            if (remainingCards.rows.length > 0) {
                const newDefaultPM = remainingCards.rows[0].stripe_payment_method_id;
                
                await stripe.customers.update(customerId, {
                    invoice_settings: {
                        default_payment_method: newDefaultPM
                    }
                });

                await pool.query(
                    'UPDATE profiles SET default_payment_method_id = $1 WHERE user_id = $2',
                    [newDefaultPM, userId]
                );

                await pool.query(
                    'UPDATE saved_cards SET is_default = TRUE WHERE stripe_payment_method_id = $1 AND user_id = $2',
                    [newDefaultPM, userId]
                );
            }
        }

        console.log(`✅ Payment method ${paymentMethodId} eliminado para user ${userId}`);

        res.json({
            success: true,
            msg: 'Método de pago eliminado correctamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar payment method:', error);
        res.status(500).json({
            msg: 'Error al eliminar método de pago',
            error: error.message
        });
    }
});