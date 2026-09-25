/**
 * Payment Controller - Mercado Pago Checkout Pro
 * Implementación de pagos para marketplace con split de pagos
 */
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const asyncHandler = require('../middleware/asyncHandler');
const pool = require('../db');

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

/**
 * @desc    Crear preferencia de pago para Checkout Pro
 * @route   POST /api/payments/create-preference
 * @access  Privado (Comprador)
 */
exports.createPreference = asyncHandler(async (req, res, next) => {
    const { productId, cantidad = 1, coupon_discount = 0 } = req.body;
    const userId = req.user.id;

    // === VALIDACIONES ===
    if (!productId) {
        console.warn('⚠️ Preference: Missing productId', { userId });
        return res.status(400).json({ msg: 'Se requiere el ID del producto.' });
    }

    if (cantidad < 1 || cantidad > 10) {
        return res.status(400).json({ 
            msg: 'La cantidad debe estar entre 1 y 10 unidades.' 
        });
    }

    console.log('💰 Creating Mercado Pago Preference', {
        userId,
        productId,
        cantidad,
        couponDiscount: coupon_discount,
    });

    try {
        // 1. Obtener producto completo con datos del vendedor
        const productResult = await pool.query(
            `SELECT 
                p.id, 
                p.nombre, 
                p.precio_descuento, 
                p.store_id, 
                p.activo, 
                p.imagen_url,
                s.nombre_comercio,
                u.email as seller_email
             FROM products p
             LEFT JOIN stores s ON p.store_id = s.id
             LEFT JOIN users u ON s.user_id = u.id
             WHERE p.id = $1`,
            [productId]
        );

        if (productResult.rows.length === 0) {
            console.warn('⚠️ Product not found', { productId });
            return res.status(404).json({ msg: 'Producto no encontrado.' });
        }

        const product = productResult.rows[0];

        // Verificar que producto esté activo
        if (!product.activo) {
            return res.status(400).json({ msg: 'Este producto no está disponible actualmente.' });
        }

        // 2. Calcular montos
        const subtotal = Number(product.precio_descuento) * Number(cantidad);
        const totalAfterCoupon = Math.max(0, subtotal - Number(coupon_discount));
        
        // Validar mínimo de transacción (Mercado Pago MXN: $10)
        if (totalAfterCoupon < 10) {
            return res.status(400).json({
                msg: 'El monto mínimo de compra es $10.00 MXN.'
            });
        }

        // Validar máximo
        if (totalAfterCoupon > 500000) {
            return res.status(400).json({
                msg: 'El monto máximo por transacción es $500,000.00 MXN.'
            });
        }

        const comisionPorcentaje = 18; // 18% para admin, 82% para comercio
        const platformFeeAmount = Math.round(totalAfterCoupon * (comisionPorcentaje / 100) * 100) / 100;
        const merchantAmount = Math.round((totalAfterCoupon - platformFeeAmount) * 100) / 100;

        console.log('💰 Payment calculation', {
            productName: product.nombre,
            storeName: product.nombre_comercio,
            cantidad,
            subtotal,
            couponDiscount: coupon_discount,
            totalAfterCoupon,
            platformFeeAmount,
            merchantAmount,
            platformPercentage: comisionPorcentaje,
            merchantPercentage: 100 - comisionPorcentaje,
        });

        // 3. Obtener email del comprador
        const userResult = await pool.query(
            'SELECT email, nombre FROM users WHERE id = $1',
            [userId]
        );
        const userEmail = userResult.rows[0]?.email || '';
        const userName = userResult.rows[0]?.nombre || 'Cliente';

        // 4. Crear preferencia de Mercado Pago
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
        
        // Para Checkout Pro, usamos URLs del backend que redirigen a la app móvil
        // Mercado Pago requiere URLs HTTP/HTTPS, no deep links
        const successUrl = `${backendUrl}/api/payments/callback/success`;
        const failureUrl = `${backendUrl}/api/payments/callback/failure`;
        const pendingUrl = `${backendUrl}/api/payments/callback/pending`;
        
        // Generar external_reference simple (máx 256 chars)
        const timestamp = Date.now();
        const externalRef = `DC_${userId}_${productId}_${timestamp}`;
        
        const preferenceData = {
            items: [
                {
                    id: product.id.toString(),
                    title: product.nombre,
                    description: `${cantidad}x ${product.nombre} - ${product.nombre_comercio}`,
                    picture_url: product.imagen_url || '',
                    category_id: 'food',
                    quantity: cantidad,
                    currency_id: 'MXN',
                    unit_price: Number((totalAfterCoupon / cantidad).toFixed(2)),
                }
            ],
            payer: {
                email: userEmail,
                name: userName,
            },
            back_urls: {
                success: successUrl,
                failure: failureUrl,
                pending: pendingUrl,
            },
            auto_return: 'approved', // Redirigir automáticamente en pagos aprobados
            notification_url: `${backendUrl}/api/payments/webhook`,
            external_reference: externalRef,
            metadata: {
                user_id: userId,
                product_id: productId,
                store_id: product.store_id,
                product_name: product.nombre,
                store_name: product.nombre_comercio,
                cantidad: cantidad,
                coupon_discount: coupon_discount,
                subtotal: subtotal,
                total: totalAfterCoupon,
                platform_fee: platformFeeAmount,
                merchant_amount: merchantAmount,
                timestamp: timestamp
            },
            statement_descriptor: 'DELICRUNCH',
            expires: true,
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        };

        // NOTA: marketplace_fee removido temporalmente
        // Requiere que el seller tenga cuenta de MP registrada y vinculada
        // Para habilitarlo: seller debe completar onboarding de MP
        // Ref: https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/checkout-customization/checkout-pro-payments-split

        console.log('📝 Preference data to send:', JSON.stringify(preferenceData, null, 2));

        const preference = await preferenceClient.create({ body: preferenceData });

        console.log('✅ Mercado Pago Preference created', {
            preferenceId: preference.id,
            initPoint: preference.init_point,
        });

        // 5. Guardar preferencia en BD para auditoría
        try {
            await pool.query(
                `INSERT INTO payment_preferences (
                    mercadopago_preference_id, user_id, product_id, store_id,
                    amount, currency, status, platform_fee_amount, metadata, external_reference
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (mercadopago_preference_id) DO NOTHING`,
                [
                    preference.id,
                    userId,
                    productId,
                    product.store_id,
                    totalAfterCoupon,
                    'MXN',
                    'pending',
                    platformFeeAmount,
                    JSON.stringify(preferenceData.metadata),
                    externalRef,
                ]
            );
        } catch (dbError) {
            console.error('❌ Could not save preference to DB; refusing to return checkout URL', { error: dbError.message });
            throw dbError;
        }

        // 6. Responder al frontend
        res.json({
            preferenceId: preference.id,
            initPoint: preference.init_point,
            sandboxInitPoint: preference.sandbox_init_point,
            amount: totalAfterCoupon,
            merchantAmount: merchantAmount,
            platformFee: platformFeeAmount,
        });

    } catch (error) {
        console.error('❌ Error creating Mercado Pago Preference', {
            userId,
            productId,
            errorMessage: error.message,
            errorStack: error.stack,
            errorResponse: error.response?.data || error.response,
        });

        return res.status(500).json({
            msg: 'Error al crear la preferencia de pago.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined,
        });
    }
});

/**
 * @desc    Webhook para recibir notificaciones de Mercado Pago
 * @route   POST /api/payments/webhook
 * @access  Público (llamado por Mercado Pago)
 */
exports.handleWebhook = asyncHandler(async (req, res, next) => {
    const { type, data } = req.body;

    console.log('📩 Mercado Pago Webhook received:', { type, data });

    try {
        if (type === 'payment') {
            const paymentId = data?.id;
            if (!paymentId) {
                return res.status(200).json({ received: true });
            }

            // Obtener detalles del pago
            const payment = await paymentClient.get({ id: paymentId });

            console.log('💳 Payment details:', {
                id: payment.id,
                status: payment.status,
                statusDetail: payment.status_detail,
                externalReference: payment.external_reference,
                metadata: payment.metadata
            });

            // Order data is loaded from our saved checkout preference inside the transaction.
            let orderData = {};

            // Actualizar o crear orden según el estado del pago
            if (payment.status === 'approved') {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');

                    if (!payment.external_reference) {
                        await client.query('ROLLBACK');
                        console.warn('⚠️ Approved payment without external reference', { paymentId: payment.id });
                        return res.status(200).json({ received: true, invalidPayment: true });
                    }

                    const savedPreferenceResult = await client.query(
                        `SELECT user_id, product_id, store_id, amount, currency, metadata
                         FROM payment_preferences
                         WHERE external_reference = $1
                         LIMIT 1
                         FOR UPDATE`,
                        [payment.external_reference]
                    );

                    const savedPreference = savedPreferenceResult.rows[0];
                    const paymentAmountInCents = Math.round(Number(payment.transaction_amount) * 100);
                    const expectedAmountInCents = Math.round(Number(savedPreference?.amount) * 100);
                    if (
                        !savedPreference ||
                        !savedPreference.user_id ||
                        !savedPreference.product_id ||
                        payment.currency_id !== savedPreference.currency ||
                        paymentAmountInCents !== expectedAmountInCents
                    ) {
                        await client.query('ROLLBACK');
                        console.warn('⚠️ Approved payment does not match a saved checkout preference', { paymentId: payment.id });
                        return res.status(200).json({ received: true, invalidPayment: true });
                    }

                    const savedMetadata = typeof savedPreference.metadata === 'string'
                        ? JSON.parse(savedPreference.metadata)
                        : (savedPreference.metadata || {});
                    orderData = {
                        user_id: savedPreference.user_id,
                        product_id: savedPreference.product_id,
                        store_id: savedPreference.store_id,
                        cantidad: Number(savedMetadata.cantidad) || 1,
                        coupon_discount: Number(savedMetadata.coupon_discount) || 0,
                        subtotal: Number(savedMetadata.subtotal) || Number(savedPreference.amount),
                        total: Number(savedPreference.amount),
                        platform_fee: Number(savedMetadata.platform_fee) || 0,
                        merchant_amount: Number(savedMetadata.merchant_amount) || Number(savedPreference.amount),
                    };

                    // Idempotencia: verificar si ya existe una orden para este pago
                    const existingOrder = await client.query(
                        'SELECT id FROM orders WHERE mercadopago_payment_id = $1 LIMIT 1',
                        [payment.id.toString()]
                    );
                    if (existingOrder.rows.length > 0) {
                        console.log('⚠️ Order already exists for payment', payment.id, '— skipping duplicate');
                        await client.query('ROLLBACK');
                        client.release();
                        return res.status(200).json({ received: true, duplicate: true });
                    }
                
                    // Obtener store_id del producto
                    let storeId = orderData.store_id;
                    if (!storeId && orderData.product_id) {
                        const productRes = await client.query(
                            'SELECT store_id FROM products WHERE id = $1',
                            [orderData.product_id]
                        );
                        storeId = productRes.rows[0]?.store_id;
                    }

                    // Crear orden exitosa con campos correctos de la tabla orders
                    const orderResult = await client.query(
                        `INSERT INTO orders (
                            user_id, store_id, codigo_recogida, total, subtotal,
                            comision_plataforma, estado, metodo_pago, mercadopago_payment_id
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                        RETURNING id`,
                        [
                            orderData.user_id,
                            storeId,
                            `DC${Math.floor(1000 + Math.random() * 9000)}`,
                            orderData.total,
                            orderData.subtotal || orderData.total,
                            orderData.platform_fee || Math.round(orderData.total * 0.18 * 100) / 100,
                            'confirmado',
                            'mercadopago',
                            payment.id.toString()
                        ]
                    );

                    // Crear order_item, reducir stock y actualizar perfil (transaccional)
                    if (orderResult.rows.length > 0 && orderData.product_id) {
                        const cantidad = orderData.cantidad || 1;
                        const productRes = await client.query(
                            'SELECT nombre, precio_descuento, precio_original, imagen_url, cantidad_disponible, categoria FROM products WHERE id = $1 FOR UPDATE',
                            [orderData.product_id]
                        );
                        const prod = productRes.rows[0];
                        
                        await client.query(
                            `INSERT INTO order_items (
                                order_id, product_id, cantidad, precio_unitario, subtotal
                            ) VALUES ($1, $2, $3, $4, $5)`,
                            [
                                orderResult.rows[0].id,
                                orderData.product_id,
                                cantidad,
                                prod?.precio_descuento || 0,
                                cantidad * (prod?.precio_descuento || 0)
                            ]
                        );

                        // Reducir stock — cantidad_disponible no puede bajar de 0
                        await client.query(
                            `UPDATE products 
                             SET cantidad_disponible = GREATEST(0, cantidad_disponible - $1)
                             WHERE id = $2`,
                            [cantidad, orderData.product_id]
                        );

                        // Actualizar perfil del comprador (ahorro + CO2)
                        try {
                            const { calculateCO2Saved } = require('../utils/co2Factors');
                            const precioOriginal = parseFloat(prod?.precio_original || prod?.precio_descuento || 0);
                            const ahorro = (precioOriginal - parseFloat(prod?.precio_descuento || 0)) * cantidad;
                            const co2Ahorrado = calculateCO2Saved(prod?.categoria || 'otros', cantidad);
                            await client.query(
                                `UPDATE profiles SET 
                                    total_pedidos = COALESCE(total_pedidos, 0) + 1,
                                    total_ahorrado = COALESCE(total_ahorrado, 0) + $1,
                                    co2_ahorrado = COALESCE(co2_ahorrado, 0) + $2
                                 WHERE user_id = $3`,
                                [ahorro, co2Ahorrado, orderData.user_id]
                            );
                        } catch (profileErr) {
                            console.warn('⚠️ Could not update buyer profile stats:', profileErr.message);
                        }
                    }

                    await client.query('COMMIT');
                    console.log('✅ Order created from webhook', { paymentId: payment.id, orderId: orderResult.rows[0]?.id });
                } catch (txErr) {
                    await client.query('ROLLBACK');
                    console.error('❌ Transaction failed in webhook:', txErr.message);
                    throw txErr;
                } finally {
                    client.release();
                }
            } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
                // Registrar pago fallido
                console.log('❌ Payment failed', { 
                    paymentId: payment.id, 
                    status: payment.status,
                    statusDetail: payment.status_detail 
                });
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(200).json({ received: true }); // Siempre responder 200 a MP
    }
});

/**
 * @desc    Obtener estado de un pago
 * @route   GET /api/payments/status/:paymentId
 * @access  Privado
 */
exports.getPaymentStatus = asyncHandler(async (req, res, next) => {
    const { paymentId } = req.params;

    // Mercado Pago payment IDs are numeric. Reject malformed IDs before calling the provider.
    if (!/^\d+$/.test(String(paymentId || ''))) {
        return res.status(404).json({ msg: 'Pago no encontrado.' });
    }

    try {
        const payment = await paymentClient.get({ id: paymentId });

        // A payment status is private to the account that created its checkout preference.
        // Fail closed when Mercado Pago or our saved preference cannot prove ownership.
        if (!payment.external_reference) {
            return res.status(404).json({ msg: 'Pago no encontrado.' });
        }

        const preferenceResult = await pool.query(
            `SELECT id FROM payment_preferences
             WHERE external_reference = $1 AND user_id = $2
             LIMIT 1`,
            [payment.external_reference, req.user.id]
        );

        if (preferenceResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Pago no encontrado.' });
        }

        res.json({
            id: payment.id,
            status: payment.status,
            statusDetail: payment.status_detail,
            transactionAmount: payment.transaction_amount,
            currencyId: payment.currency_id,
            dateApproved: payment.date_approved,
            dateCreated: payment.date_created,
            paymentMethodId: payment.payment_method_id,
            paymentTypeId: payment.payment_type_id,
        });
    } catch (error) {
        console.error('❌ Error getting payment status:', error);
        res.status(500).json({ msg: 'Error al obtener estado del pago.' });
    }
});
/**
 * @desc    Configurar cuenta de Mercado Pago para comercio
 * @route   POST /api/payments/merchant-setup
 * @access  Privado (Comercio)
 */
exports.merchantSetup = asyncHandler(async (req, res, next) => {
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    if (!['seller', 'comercio', 'admin'].includes(userRole)) {
        return res.status(403).json({ msg: 'Acción no autorizada.' });
    }

    const userId = req.user.id;
    const { mercadopago_email } = req.body;

    if (!mercadopago_email) {
        return res.status(400).json({ msg: 'Se requiere el email de Mercado Pago.' });
    }

    try {
        // Actualizar usuario vendedor con info de Mercado Pago
        // Primero verificar si existe en stores, si no, crear
        let storeResult = await pool.query(
            'SELECT id FROM stores WHERE user_id = $1',
            [userId]
        );
        
        if (storeResult.rows.length === 0) {
            // Crear entrada en stores
            const userInfo = await pool.query(
                'SELECT nombre, email FROM users WHERE id = $1',
                [userId]
            );
            const user = userInfo.rows[0];
            
            storeResult = await pool.query(
                `INSERT INTO stores (user_id, nombre_comercio, direccion, telefono, activo, mercadopago_user_id)
                 VALUES ($1, $2, $3, $4, true, $5)
                 RETURNING id, nombre_comercio`,
                [userId, user?.nombre || 'Mi Tienda', '', '', mercadopago_email]
            );
        } else {
            // Actualizar tienda existente con el email/ID de Mercado Pago
            storeResult = await pool.query(
                `UPDATE stores 
                 SET mercadopago_user_id = $1, 
                     mercadopago_onboarding_complete = true,
                     updated_at = NOW()
                 WHERE user_id = $2
                 RETURNING id, nombre_comercio`,
                [mercadopago_email, userId]
            );
        }

        console.log('✅ Merchant Mercado Pago configured:', {
            storeId: storeResult.rows[0].id,
            storeName: storeResult.rows[0].nombre_comercio,
        });

        res.json({
            success: true,
            msg: 'Cuenta de Mercado Pago configurada correctamente.',
            store: storeResult.rows[0],
        });
    } catch (error) {
        console.error('❌ Error setting up merchant:', error);
        res.status(500).json({ msg: 'Error al configurar Mercado Pago.' });
    }
});

/**
 * @desc    Obtener estado de configuración del comercio
 * @route   GET /api/payments/merchant-status
 * @access  Privado (Comercio)
 */
exports.getMerchantStatus = asyncHandler(async (req, res, next) => {
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    if (!['seller', 'comercio', 'admin'].includes(userRole)) {
        return res.status(403).json({ msg: 'Acción no autorizada.' });
    }

    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT id, nombre_comercio, mercadopago_user_id, mercadopago_onboarding_complete,
                    comision_plataforma
             FROM stores WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            // Si no hay tienda, devolver estado por defecto
            return res.json({
                hasMercadoPagoAccount: false,
                mercadopagoEmail: null,
                chargesEnabled: false,
                payoutsEnabled: false,
                detailsSubmitted: false,
                comisionPlataforma: 25,
            });
        }

        const store = result.rows[0];

        res.json({
            hasMercadoPagoAccount: !!store.mercadopago_user_id,
            mercadopagoEmail: store.mercadopago_user_id,
            chargesEnabled: store.mercadopago_onboarding_complete || false,
            payoutsEnabled: store.mercadopago_onboarding_complete || false,
            detailsSubmitted: store.mercadopago_onboarding_complete || false,
            comisionPlataforma: store.comision_plataforma || 18
        });
    } catch (error) {
        console.error('❌ Error getting merchant status:', error);
        res.status(500).json({ msg: 'Error al obtener estado del comercio.' });
    }
});

/**
 * @desc    Obtener balance del comercio
 * @route   GET /api/payments/merchant-balance
 * @access  Privado (Comercio)
 */
exports.getMerchantBalance = asyncHandler(async (req, res, next) => {
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    if (!['seller', 'comercio', 'admin'].includes(userRole)) {
        return res.status(403).json({ msg: 'Acción no autorizada.' });
    }

    const storeId = req.storeId; // Proporcionado por middleware getStoreId

    if (!storeId) {
        return res.status(400).json({ msg: 'Store ID no disponible' });
    }

    try {
        // Calcular balance basado en órdenes de la tienda
        const balanceResult = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total * 0.82 ELSE 0 END), 0) as available,
                COALESCE(SUM(CASE WHEN estado = 'confirmado' THEN total * 0.82 ELSE 0 END), 0) as pending
             FROM orders 
             WHERE store_id = $1`,
            [storeId]
        );

        const balance = balanceResult.rows[0];

        res.json({
            available: [{ amount: parseFloat(balance.available) || 0, currency: 'MXN' }],
            pending: [{ amount: parseFloat(balance.pending) || 0, currency: 'MXN' }]
        });
    } catch (error) {
        console.error('❌ Error getting merchant balance:', error);
        res.status(500).json({ msg: 'Error al obtener balance.' });
    }
});

/**
 * @desc    Obtener historial de pagos del comercio
 * @route   GET /api/payments/merchant-payouts
 * @access  Privado (Comercio)
 */
exports.getMerchantPayouts = asyncHandler(async (req, res, next) => {
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    if (!['seller', 'comercio', 'admin'].includes(userRole)) {
        return res.status(403).json({ msg: 'Acción no autorizada.' });
    }

    const storeId = req.storeId; // Proporcionado por middleware getStoreId

    if (!storeId) {
        return res.status(400).json({ msg: 'Store ID no disponible' });
    }

    try {
        // Obtener últimas órdenes pagadas como "payouts"
        const payoutsResult = await pool.query(
            `SELECT id, total * 0.82 as amount, estado as status, 
                    created_at, mercadopago_payment_id as payment_id
             FROM orders 
             WHERE store_id = $1 AND estado = 'recogido'
             ORDER BY created_at DESC
             LIMIT 10`,
            [storeId]
        );

        const payouts = payoutsResult.rows.map(p => ({
            id: p.id,
            amount: parseFloat(p.amount) || 0,
            currency: 'MXN',
            status: p.status,
            created: p.created_at,
            description: `Venta #${p.id}`,
            method: 'mercadopago',
            type: 'bank_account',
        }));

        res.json({ payouts });
    } catch (error) {
        console.error('❌ Error getting merchant payouts:', error);
        res.status(500).json({ msg: 'Error al obtener historial de pagos.' });
    }
});

/**
 * @desc    Listar métodos de pago guardados del usuario (metadatos)
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
 * @desc    Agregar método de pago (metadatos)
 * @route   POST /api/payments/methods
 * @access  Privado
 */
exports.addSavedCard = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { brand, last4, exp_month, exp_year, make_default } = req.body;

    if (!brand || !last4 || String(last4).length !== 4 || !exp_month || !exp_year) {
        return res.status(400).json({ msg: 'Datos de tarjeta inválidos.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        let isDefault = false;
        if (make_default) {
            await client.query('UPDATE saved_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
            isDefault = true;
        }
        const insert = await client.query(
            `INSERT INTO saved_cards (user_id, brand, last4, exp_month, exp_year, is_default)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, brand, last4, exp_month, exp_year, is_default, created_at`,
            [userId, brand, String(last4).slice(-4), parseInt(exp_month), parseInt(exp_year), isDefault]
        );
        await client.query('COMMIT');
        res.status(201).json(insert.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
});

/**
 * @desc    Eliminar método de pago guardado
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
 * @desc    Establecer método de pago como predeterminado
 * @route   PUT /api/payments/methods/:id/default
 * @access  Privado
 */
exports.setDefaultSavedCard = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const id = req.params.id;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const exists = await client.query('SELECT id FROM saved_cards WHERE id = $1 AND user_id = $2', [id, userId]);
        if (exists.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ msg: 'Tarjeta no encontrada' });
        }
        await client.query('UPDATE saved_cards SET is_default = FALSE WHERE user_id = $1', [userId]);
        await client.query('UPDATE saved_cards SET is_default = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
        await client.query('COMMIT');
        res.json({ msg: 'Tarjeta establecida como predeterminada' });
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
});

/**
 * @desc    Callback de Mercado Pago - redirige a la app móvil
 * @route   GET /api/payments/callback/:status
 * @access  Público
 */
exports.paymentCallback = asyncHandler(async (req, res) => {
    const path = req.path;
    const status = path.includes('success') ? 'success' : path.includes('failure') ? 'failure' : 'pending';
    
    // Obtener parámetros de Mercado Pago
    const {
        collection_id,
        collection_status,
        payment_id,
        status: mpStatus,
        external_reference,
        payment_type,
        merchant_order_id,
        preference_id,
    } = req.query;

    console.log('📱 Payment Callback', {
        status,
        payment_id,
        collection_status,
        preference_id,
    });

    // Construir URL de deep link para la app móvil
    const appScheme = process.env.APP_SCHEME || 'delicrunch';
    const params = new URLSearchParams({
        status,
        payment_id: payment_id || '',
        collection_status: collection_status || '',
        external_reference: external_reference || '',
    });

    const deepLink = `${appScheme}://payment-result?${params.toString()}`;
    
    // HTML de redirección a la app móvil
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Delicrunch - ${status === 'success' ? 'Pago Exitoso' : status === 'failure' ? 'Pago Fallido' : 'Pago Pendiente'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        h1 { margin: 0 0 0.5rem 0; }
        p { opacity: 0.9; }
        .btn {
            display: inline-block;
            background: white;
            color: #10B981;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: bold;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">${status === 'success' ? '✅' : status === 'failure' ? '❌' : '⏳'}</div>
        <h1>${status === 'success' ? '¡Pago Exitoso!' : status === 'failure' ? 'Pago Fallido' : 'Pago Pendiente'}</h1>
        <p>${status === 'success' ? 'Tu compra se ha procesado correctamente.' : status === 'failure' ? 'Hubo un problema con tu pago.' : 'Tu pago está siendo procesado.'}</p>
        <a class="btn" href="${deepLink}">Abrir Delicrunch</a>
    </div>
    <script>
        // Intentar abrir la app automáticamente
        setTimeout(function() {
            window.location.href = "${deepLink}";
        }, 1000);
    </script>
</body>
</html>`;

    res.send(html);
});
/**
 * @desc    Obtener estado de pagos del usuario
 * @route   GET /api/payments/user-status
 * @access  Privado (Usuario)
 */
exports.getUserPaymentStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
        // Obtener historial de pagos completados del usuario
        // Estados válidos: pagado, confirmado, en_preparacion, listo, recogido
        const paymentsResult = await pool.query(
            `SELECT 
                COUNT(*) as total_payments, 
                MAX(created_at) as last_payment,
                SUM(total) as total_spent
             FROM orders
             WHERE user_id = $1 
             AND estado IN ('pagado', 'confirmado', 'en_preparacion', 'listo', 'recogido')
             AND mercadopago_payment_id IS NOT NULL`,
            [userId]
        );

        const stats = paymentsResult.rows[0];
        const totalPayments = parseInt(stats.total_payments) || 0;

        console.log('📊 User payment status:', {
            userId,
            totalPayments,
            lastPayment: stats.last_payment,
            totalSpent: stats.total_spent,
        });

        res.json({
            success: true,
            data: {
                totalPayments,
                lastPayment: stats.last_payment || null,
                totalSpent: parseFloat(stats.total_spent) || 0,
                hasCompletedPayment: totalPayments > 0,
                hasMercadoPagoAccount: totalPayments > 0, // Usuario ya ha pagado con MercadoPago
            }
        });
    } catch (error) {
        console.error('❌ Error getting user payment status:', error);
        res.status(500).json({
            success: false,
            msg: 'Error al obtener el estado de pagos',
        });
    }
});