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
                p.name as nombre, 
                p.price as precio_descuento, 
                p.seller_id, 
                p.is_active as activo, 
                p.image_url as imagen_url,
                u.name as nombre_comercio,
                u.email as seller_email
             FROM products p
             LEFT JOIN users u ON p.seller_id = u.id
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

        const comisionPorcentaje = 25; // Default 25%
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
            'SELECT email, name as nombre FROM users WHERE id = $1',
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
            // auto_return solo funciona con URLs públicas (no localhost)
            // auto_return: 'approved',
            notification_url: `${backendUrl}/api/payments/webhook`,
            external_reference: JSON.stringify({
                user_id: userId,
                product_id: productId,
                seller_id: product.seller_id,
                cantidad: cantidad,
                coupon_discount: coupon_discount,
                subtotal: subtotal,
                total: totalAfterCoupon,
                platform_fee: platformFeeAmount,
                merchant_amount: merchantAmount,
            }),
            metadata: {
                user_id: userId,
                product_id: productId,
                seller_id: product.seller_id,
                product_name: product.nombre,
                store_name: product.nombre_comercio,
                cantidad: cantidad,
                coupon_discount: coupon_discount,
                platform_fee: platformFeeAmount,
                merchant_amount: merchantAmount,
            },
            statement_descriptor: 'DELICRUNCH',
            expires: true,
            expiration_date_from: new Date().toISOString(),
            expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        };

        // Si el vendedor tiene cuenta de Mercado Pago, configurar marketplace fee
        if (product.seller_email) {
            preferenceData.marketplace_fee = platformFeeAmount;
        }

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
                    amount, currency, status, platform_fee_amount, metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (mercadopago_preference_id) DO NOTHING`,
                [
                    preference.id,
                    userId,
                    productId,
                    product.seller_id,
                    totalAfterCoupon,
                    'MXN',
                    'pending',
                    platformFeeAmount,
                    JSON.stringify(preferenceData.metadata),
                ]
            );
        } catch (dbError) {
            console.warn('⚠️ Could not save preference to DB', { error: dbError.message });
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
            error: error.message,
        });

        return res.status(500).json({
            msg: 'Error al crear la preferencia de pago.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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
            });

            // Parsear external_reference
            let orderData;
            try {
                orderData = JSON.parse(payment.external_reference);
            } catch (e) {
                console.warn('⚠️ Could not parse external_reference');
                orderData = {};
            }

            // Actualizar o crear orden según el estado del pago
            if (payment.status === 'approved') {
                // Generar número de orden único
                const orderNumber = `DC-${Date.now().toString(36).toUpperCase()}`;
                
                // Obtener seller_id del producto
                let sellerId = orderData.seller_id;
                if (!sellerId && orderData.product_id) {
                    const productRes = await pool.query(
                        'SELECT seller_id FROM products WHERE id = $1',
                        [orderData.product_id]
                    );
                    sellerId = productRes.rows[0]?.seller_id;
                }

                // Crear orden exitosa con campos correctos de la tabla orders
                const orderResult = await pool.query(
                    `INSERT INTO orders (
                        user_id, seller_id, order_number, total, subtotal,
                        status, payment_status, payment_method, mp_payment_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (order_number) DO NOTHING
                    RETURNING id`,
                    [
                        orderData.user_id,
                        sellerId,
                        orderNumber,
                        orderData.total,
                        orderData.subtotal || orderData.total,
                        'confirmed',
                        'approved',
                        'mercadopago',
                        payment.id.toString()
                    ]
                );

                // Crear order_item si se creó la orden
                if (orderResult.rows.length > 0 && orderData.product_id) {
                    const productRes = await pool.query(
                        'SELECT name, price, image_url FROM products WHERE id = $1',
                        [orderData.product_id]
                    );
                    const prod = productRes.rows[0];
                    
                    await pool.query(
                        `INSERT INTO order_items (
                            order_id, product_id, product_name, quantity, unit_price, subtotal
                        ) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            orderResult.rows[0].id,
                            orderData.product_id,
                            prod?.name || 'Producto',
                            orderData.cantidad || 1,
                            prod?.price || orderData.total,
                            orderData.total
                        ]
                    );
                }

                console.log('✅ Order created from webhook', { paymentId: payment.id, orderId: orderResult.rows[0]?.id });
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

    try {
        const payment = await paymentClient.get({ id: paymentId });

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
                'SELECT name, street, phone FROM users WHERE id = $1',
                [userId]
            );
            const user = userInfo.rows[0];
            
            storeResult = await pool.query(
                `INSERT INTO stores (user_id, nombre_comercio, direccion, telefono, activo, mercadopago_email, mercadopago_configured)
                 VALUES ($1, $2, $3, $4, true, $5, true)
                 RETURNING id, nombre_comercio`,
                [userId, user?.name || 'Mi Tienda', user?.street || '', user?.phone || '', mercadopago_email]
            );
        } else {
            // Actualizar tienda existente
            storeResult = await pool.query(
                `UPDATE stores 
                 SET mercadopago_email = $1, 
                     mercadopago_configured = true,
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
            `SELECT id, nombre_comercio, mercadopago_email, mercadopago_configured,
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
            hasMercadoPagoAccount: !!store.mercadopago_configured,
            mercadopagoEmail: store.mercadopago_email,
            chargesEnabled: store.mercadopago_configured || false,
            payoutsEnabled: store.mercadopago_configured || false,
            detailsSubmitted: store.mercadopago_configured || false,
            comisionPlataforma: store.comision_plataforma || 25,
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

    const userId = req.user.id;

    try {
        // Calcular balance basado en órdenes del vendedor
        const balanceResult = await pool.query(
            `SELECT 
                COALESCE(SUM(CASE WHEN payment_status = 'approved' THEN total * 0.75 ELSE 0 END), 0) as available,
                COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN total * 0.75 ELSE 0 END), 0) as pending
             FROM orders 
             WHERE seller_id = $1`,
            [userId]
        );

        const balance = balanceResult.rows[0];

        res.json({
            available: [{ amount: parseFloat(balance.available) || 0, currency: 'MXN' }],
            pending: [{ amount: parseFloat(balance.pending) || 0, currency: 'MXN' }],
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

    const userId = req.user.id;

    try {
        // Obtener últimas órdenes pagadas como "payouts"
        const payoutsResult = await pool.query(
            `SELECT id, total * 0.75 as amount, payment_status as status, 
                    created_at, mp_payment_id as payment_id
             FROM orders 
             WHERE seller_id = $1 AND payment_status = 'approved'
             ORDER BY created_at DESC
             LIMIT 10`,
            [userId]
        );

        const payouts = payoutsResult.rows.map(p => ({
            id: p.id,
            amount: parseFloat(p.amount) || 0,
            currency: 'MXN',
            status: 'paid',
            arrivalDate: p.created_at,
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
