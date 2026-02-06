const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Genera un código de recogida legible estilo TGTG (ej: AB-123)
 */
const generatePickupCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sin I, O para evitar confusión
    const nums = '0123456789';
    let code = '';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    code += nums.charAt(Math.floor(Math.random() * nums.length));
    code += nums.charAt(Math.floor(Math.random() * nums.length));
    code += nums.charAt(Math.floor(Math.random() * nums.length));
    return code;
};

/**
 * Calcula la comisión de la plataforma (25% por defecto)
 */
const calculatePlatformFee = (total, feePercentage = 25) => {
    return Math.round(total * (feePercentage / 100) * 100) / 100;
};

// @desc    Crear un nuevo pedido (después de pago exitoso)
// @route   POST /api/orders
// @access  Privado (comprador)
exports.createOrder = asyncHandler(async (req, res, next) => {
    // Aceptar tanto inglés como español para compatibilidad
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    if (!['buyer', 'comprador', 'admin'].includes(userRole)) {
        return res.status(403).json({ msg: 'Solo los compradores pueden realizar pedidos.' });
    }

    const { productId, cantidad = 1, stripePaymentIntentId } = req.body;
    const userId = req.user.id;

    if (!productId) {
        return res.status(400).json({ msg: 'Se requiere el ID del producto.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener producto con bloqueo para evitar race conditions
        const productResult = await client.query(
            'SELECT p.*, u.name as seller_name FROM products p JOIN users u ON p.seller_id = u.id WHERE p.id = $1 FOR UPDATE',
            [productId]
        );
        
        if (productResult.rows.length === 0) {
            throw new Error('Producto no encontrado.');
        }

        const product = productResult.rows[0];

        // 2. Verificar stock
        if (product.stock < cantidad) {
            throw new Error(`Stock insuficiente. Solo hay ${product.stock} disponibles.`);
        }

        // 3. Calcular totales
        const subtotal = parseFloat(product.price) * cantidad;
        const comisionPorcentaje = 25; // Comisión fija del 25%
        const comisionPlataforma = calculatePlatformFee(subtotal, comisionPorcentaje);
        const total = subtotal;

        // 4. Generar código de recogida único
        let codigoRecogida;
        let codigoUnico = false;
        while (!codigoUnico) {
            codigoRecogida = generatePickupCode();
            const existe = await client.query(
                "SELECT id FROM orders WHERE order_number = $1 AND status NOT IN ('delivered', 'cancelled', 'refunded')",
                [codigoRecogida]
            );
            if (existe.rows.length === 0) codigoUnico = true;
        }

        // 5. Fecha de recogida (hoy)
        const hoy = new Date();
        const fechaRecogida = new Date(hoy);

        // 6. Actualizar stock
        await client.query(
            'UPDATE products SET stock = stock - $1 WHERE id = $2',
            [cantidad, productId]
        );

        // 7. Crear el pedido
        const orderResult = await client.query(
            `INSERT INTO orders (
                user_id, seller_id, order_number, subtotal, 
                total, status, payment_method, mp_payment_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [
                userId, 
                product.seller_id, 
                codigoRecogida, 
                subtotal, 
                total, 
                'confirmed', 
                'stripe',
                stripePaymentIntentId || null
            ]
        );

        const newOrder = orderResult.rows[0];

        // 8. Crear items del pedido
        await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_name, subtotal)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [newOrder.id, productId, cantidad, product.price, product.name, subtotal]
        );

        // 9. Actualizar estadísticas del comprador (si existe tabla profiles)
        const ahorro = (parseFloat(product.compare_price || product.price) - parseFloat(product.price)) * cantidad;
        
        // Calcular CO2 según categoría del producto
        const { calculateCO2Saved } = require('../utils/co2Factors');
        const co2Ahorrado = calculateCO2Saved(product.categoria || 'otros', cantidad);
        
        await client.query(
            `UPDATE profiles SET 
                total_pedidos = COALESCE(total_pedidos, 0) + 1,
                total_ahorrado = COALESCE(total_ahorrado, 0) + $1,
                co2_ahorrado = COALESCE(co2_ahorrado, 0) + $2
             WHERE user_id = $3`,
            [ahorro, co2Ahorrado, userId]
        );

        await client.query('COMMIT');

        // 10. Obtener datos completos para la respuesta
        const orderComplete = await pool.query(
            `SELECT o.*, seller.name as seller_name, seller.street, seller.phone, seller.latitude, seller.longitude,
                    p.name AS product_name, p.image_url
             FROM orders o
             JOIN users seller ON o.seller_id = seller.id
             JOIN order_items oi ON oi.order_id = o.id
             JOIN products p ON oi.product_id = p.id
             WHERE o.id = $1`,
            [newOrder.id]
        );

        res.status(201).json({
            ...orderComplete.rows[0],
            ahorro_total: ahorro,
            co2_ahorrado: co2Ahorrado,
            precio_total: total // Alias para compatibilidad con frontend
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en la transacción:', error.message);
        
        if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrado')) {
            return res.status(400).json({ msg: error.message });
        }
        next(error);
    } finally {
        client.release();
    }
});

// @desc    Obtener un pedido específico por ID
// @route   GET /api/orders/:id
// @access  Privado (propietario del pedido o admin)
exports.getOrderById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();

    const orderResult = await pool.query(
        `SELECT o.*, 
                seller.name as seller_name, seller.street, seller.phone, seller.latitude, seller.longitude,
                oi.product_id, oi.quantity, oi.unit_price,
                p.name AS product_name, p.image_url
         FROM orders o
         JOIN users seller ON o.seller_id = seller.id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.id = $1`,
        [id]
    );

    if (orderResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Pedido no encontrado.' });
    }

    const order = orderResult.rows[0];

    // Verificar que el usuario sea el dueño del pedido o admin
    if (order.user_id !== userId && !['admin', 'administrador'].includes(userRole)) {
        return res.status(403).json({ msg: 'No tienes permiso para ver este pedido.' });
    }

    res.json(order);
});

// @desc    Obtener los pedidos del comprador logueado
// @acceso  Privado (Comprador)
exports.getMyOrders = asyncHandler(async (req, res, next) => {
    // Permitir compradores y admins para pruebas - aceptar inglés y español
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();
    if (!['buyer', 'comprador', 'admin'].includes(userRole)) {
        return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const orders = await pool.query(
        `SELECT 
            o.id,
            o.user_id,
            o.seller_id,
            o.created_at as fecha_pedido,
            o.created_at as fecha_recogida,
            -- Mapear estado 'delivered' a 'Entregado' para el frontend
            CASE WHEN o.status = 'delivered' THEN 'Entregado' ELSE o.status END AS estado,
            -- Alias del total para compatibilidad con frontend
            o.total AS precio_total,
            seller.name as nombre_comercio,
            p.name AS nombre_producto,
            oi.product_id AS producto_id,
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END AS tiene_resena
        FROM orders o
        JOIN users seller ON o.seller_id = seller.id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN reviews r ON o.id = r.order_id
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC`,
        [req.user.id]
    );
    res.json(orders.rows);
});

// @desc    Obtener los pedidos recibidos por la tienda del comercio logueado
// @acceso  Privado (Comercio)
exports.getStoreOrders = asyncHandler(async (req, res, next) => {
    // El middleware getStoreId proporciona req.storeId
    const storeId = req.storeId;
    
    if (!storeId) {
        return res.status(400).json({ msg: 'Store ID no disponible' });
    }
    
    console.log('🏪 getStoreOrders - storeId:', storeId, 'userId:', req.user.id, 'role:', req.user.rol);
    
    // Obtener todos los pedidos de esa tienda con información completa (COLUMNAS EN ESPAÑOL)
    const orders = await pool.query(
        `SELECT 
            o.*,
            u.nombre AS nombre_comprador, 
            u.email AS email_comprador,
            oi.quantity as cantidad, 
            oi.unit_price as precio_unitario,
            p.nombre AS nombre_producto, 
            p.imagen_url as imagen_url
         FROM orders o
         JOIN users u ON o.user_id = u.id
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.store_id = $1
         ORDER BY o.created_at DESC`,
        [storeId]
    );
    
    console.log('📦 Found', orders.rows.length, 'orders for store', storeId);
    res.json(orders.rows);
});

// @desc    Actualizar el estado de un pedido (comercio puede marcar como listo/entregado)
// @route   PATCH /api/orders/:id
// @access  Privado (Comercio o Admin)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status, estado } = req.body; // Aceptar ambos nombres
    const finalStatus = status || estado;
    const userId = req.user.id;
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();

    // Validar estado - usar nombres en inglés del schema
    const estadosPermitidos = ['pending', 'confirmed', 'preparing', 'ready', 'in_delivery', 'delivered', 'cancelled', 'refunded'];
    if (!estadosPermitidos.includes(finalStatus)) {
        return res.status(400).json({ msg: 'Estado inválido.' });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Obtener la orden con store_id
        const orderResult = await client.query(
            'SELECT o.*, o.store_id FROM orders o WHERE o.id = $1',
            [id]
        );

        if (orderResult.rows.length === 0) {
            throw new Error('Pedido no encontrado.');
        }

        const order = orderResult.rows[0];

        // Verificar permisos: solo el comercio dueño de la tienda o admin pueden actualizar
        if (!['admin', 'administrador'].includes(userRole)) {
            // Verificar que el usuario sea dueño de la tienda
            const storeOwner = await client.query(
                'SELECT user_id FROM stores WHERE id = $1',
                [order.store_id]
            );
            
            if (storeOwner.rows.length === 0 || storeOwner.rows[0].user_id !== userId) {
                return res.status(403).json({ msg: 'No tienes permisos para actualizar este pedido.' });
            }
        }

        // Si se marca como delivered, registrar fecha
        const deliveredAt = finalStatus === 'delivered' ? new Date() : null;
        const confirmedAt = finalStatus === 'confirmed' ? new Date() : null;
        const readyAt = finalStatus === 'ready' ? new Date() : null;

        // Actualizar el estado
        const updateResult = await client.query(
            `UPDATE orders 
             SET status = $1, 
                 delivered_at = COALESCE($2, delivered_at),
                 confirmed_at = COALESCE($3, confirmed_at),
                 ready_at = COALESCE($4, ready_at),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [finalStatus, deliveredAt, confirmedAt, readyAt, id]
        );

        // Si la orden se completa (delivered), actualizar métricas si existen funciones
        if (finalStatus === 'delivered' && order.status !== 'delivered') {
            // Actualizar sales_count del producto
            await client.query(
                `UPDATE products SET sales_count = sales_count + 1 
                 WHERE id IN (SELECT product_id FROM order_items WHERE order_id = $1)`,
                [id]
            );
        }

        await client.query('COMMIT');

        res.json({
            msg: 'Estado actualizado exitosamente',
            order: updateResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error actualizando estado de orden:', error.message);
        
        if (error.message.includes('no encontrado') || error.message.includes('permisos')) {
            return res.status(error.message.includes('permisos') ? 403 : 404).json({ msg: error.message });
        }
        next(error);
    } finally {
        client.release();
    }
});

// @desc    Obtener métricas financieras del comercio
// @route   GET /api/orders/store-metrics
// @access  Privado (Comercio)
exports.getStoreMetrics = asyncHandler(async (req, res, next) => {
    // El middleware getStoreId asigna storeId, pero usamos seller_id (user_id del comercio)
    const sellerId = req.user.id;
    const { days = 30 } = req.query;

    // Métricas generales - usando campos correctos del schema
    const generalMetrics = await pool.query(
        `SELECT 
            COUNT(*) as total_ordenes,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as ordenes_completadas,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as ordenes_canceladas,
            COUNT(CASE WHEN status IN ('confirmed', 'preparing', 'ready') THEN 1 END) as ordenes_pendientes,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as ventas_totales,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN ROUND(total * 0.25, 2) ELSE 0 END), 0) as comisiones_totales,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN ROUND(total * 0.75, 2) ELSE 0 END), 0) as ingresos_netos
         FROM orders 
         WHERE seller_id = $1 AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'`,
        [sellerId]
    );

    // Métricas por día (últimos 30 días)
    const dailyMetrics = await pool.query(
        `SELECT 
            DATE(created_at) as fecha,
            COUNT(*) as ordenes,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as ventas,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN ROUND(total * 0.75, 2) ELSE 0 END), 0) as ingresos
         FROM orders 
         WHERE seller_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY fecha DESC`,
        [sellerId]
    );

    // Productos más vendidos
    const topProducts = await pool.query(
        `SELECT 
            p.id, p.name AS nombre, 
            COUNT(oi.id) as veces_vendido,
            SUM(oi.quantity) as unidades_vendidas,
            COALESCE(SUM(oi.subtotal), 0) as ingresos_totales
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.seller_id = $1 AND o.status = 'delivered' AND o.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
         GROUP BY p.id, p.name
         ORDER BY veces_vendido DESC
         LIMIT 5`,
        [sellerId]
    );

    res.json({
        general: generalMetrics.rows[0],
        daily: dailyMetrics.rows,
        topProducts: topProducts.rows
    });
});

// @desc    Obtener estadísticas detalladas del comercio
// @route   GET /api/orders/store-analytics
// @access  Privado (Comercio)
exports.getStoreAnalytics = asyncHandler(async (req, res, next) => {
    // Usar seller_id (user_id del comercio) en lugar de storeId
    const sellerId = req.user.id;
    const { period = '30' } = req.query; // días

    // 1. Resumen general - usando campos correctos del schema
    const summary = await pool.query(
        `SELECT 
            COUNT(DISTINCT o.id) as total_pedidos,
            COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as pedidos_completados,
            COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as pedidos_cancelados,
            COUNT(DISTINCT CASE WHEN o.status IN ('pending', 'confirmed', 'ready') THEN o.id END) as pedidos_activos,
            COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) as ventas_totales,
            COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN ROUND(o.total * 0.25, 2) ELSE 0 END), 0) as comisiones_totales,
            COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN ROUND(o.total * 0.75, 2) ELSE 0 END), 0) as ingresos_netos,
            COALESCE(AVG(CASE WHEN o.status = 'delivered' THEN o.total END), 0) as ticket_promedio,
            COUNT(DISTINCT o.user_id) as clientes_unicos
         FROM orders o
         WHERE o.seller_id = $1 AND o.created_at >= NOW() - INTERVAL '${parseInt(period)} days'`,
        [sellerId]
    );

    // 2. Tendencia diaria (últimos 30 días)
    const dailyTrend = await pool.query(
        `SELECT 
            DATE(o.created_at) as fecha,
            COUNT(*) as pedidos,
            COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completados,
            COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) as ventas,
            COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN ROUND(o.total * 0.75, 2) ELSE 0 END), 0) as ingresos
         FROM orders o
         WHERE o.seller_id = $1 AND o.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(o.created_at)
         ORDER BY fecha ASC`,
        [sellerId]
    );

    // 3. Top productos - usando campos correctos del schema
    const topProducts = await pool.query(
        `SELECT 
            p.id, 
            p.name AS nombre,
            p.image_url AS imagen_url,
            COUNT(DISTINCT o.id) as pedidos,
            SUM(oi.quantity) as unidades,
            COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN oi.unit_price * oi.quantity ELSE 0 END), 0) as ingresos,
            ROUND(AVG(p.rating), 2) as rating
         FROM products p
         LEFT JOIN order_items oi ON oi.product_id = p.id
         LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= NOW() - INTERVAL '${parseInt(period)} days'
         WHERE p.seller_id = $1
         GROUP BY p.id, p.name, p.image_url
         ORDER BY pedidos DESC NULLS LAST, ingresos DESC
         LIMIT 10`,
        [sellerId]
    );

    // 4. Distribución por estado
    const statusDistribution = await pool.query(
        `SELECT 
            o.status AS estado,
            COUNT(*) as cantidad,
            ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) as porcentaje
         FROM orders o
         WHERE o.seller_id = $1 AND o.created_at >= NOW() - INTERVAL '${parseInt(period)} days'
         GROUP BY o.status
         ORDER BY cantidad DESC`,
        [sellerId]
    );

    // 5. Horarios de mayor demanda
    const peakHours = await pool.query(
        `SELECT 
            EXTRACT(HOUR FROM o.created_at) as hora,
            COUNT(*) as pedidos,
            COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) as ventas
         FROM orders o
         WHERE o.seller_id = $1 AND o.created_at >= NOW() - INTERVAL '${parseInt(period)} days'
         GROUP BY hora
         ORDER BY pedidos DESC`,
        [sellerId]
    );

    // 6. Tasa de conversión (pedidos completados vs totales)
    const conversionRate = summary.rows[0].total_pedidos > 0
        ? ((summary.rows[0].pedidos_completados / summary.rows[0].total_pedidos) * 100).toFixed(1)
        : 0;

    // 7. Comparación con período anterior
    const previousPeriod = await pool.query(
        `SELECT 
            COUNT(*) as pedidos_anteriores,
            COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as ventas_anteriores
         FROM orders
         WHERE seller_id = $1 
           AND created_at >= NOW() - INTERVAL '${parseInt(period) * 2} days'
           AND created_at < NOW() - INTERVAL '${parseInt(period)} days'`,
        [sellerId]
    );

    const prevData = previousPeriod.rows[0];
    const currentData = summary.rows[0];
    
    const pedidosGrowth = prevData.pedidos_anteriores > 0
        ? (((currentData.total_pedidos - prevData.pedidos_anteriores) / prevData.pedidos_anteriores) * 100).toFixed(1)
        : 0;
    
    const ventasGrowth = parseFloat(prevData.ventas_anteriores) > 0
        ? (((parseFloat(currentData.ventas_totales) - parseFloat(prevData.ventas_anteriores)) / parseFloat(prevData.ventas_anteriores)) * 100).toFixed(1)
        : 0;

    res.json({
        summary: {
            ...summary.rows[0],
            conversion_rate: conversionRate,
            pedidos_growth: pedidosGrowth,
            ventas_growth: ventasGrowth
        },
        dailyTrend: dailyTrend.rows,
        topProducts: topProducts.rows,
        statusDistribution: statusDistribution.rows,
        peakHours: peakHours.rows
    });
});

/**
 * Función auxiliar para actualizar métricas financieras del comercio
 */
async function updateFinancialMetrics(client, storeId, total, comision) {
    const fecha = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    const ingresoComercio = total - comision;

    await client.query(
        `INSERT INTO financial_metrics (store_id, fecha, total_ventas, comision_plataforma, ingreso_comercio, numero_ordenes, ordenes_completadas)
         VALUES ($1, $2, $3, $4, $5, 1, 1)
         ON CONFLICT (store_id, fecha) 
         DO UPDATE SET 
            total_ventas = financial_metrics.total_ventas + $3,
            comision_plataforma = financial_metrics.comision_plataforma + $4,
            ingreso_comercio = financial_metrics.ingreso_comercio + $5,
            numero_ordenes = financial_metrics.numero_ordenes + 1,
            ordenes_completadas = financial_metrics.ordenes_completadas + 1,
            updated_at = NOW()`,
        [storeId, fecha, total, comision, ingresoComercio]
    );
}

/**
 * Función auxiliar para actualizar métricas globales del admin
 */
async function updateAdminMetrics(client, total, comision) {
    const fecha = new Date().toISOString().split('T')[0];

    await client.query(
        `INSERT INTO admin_metrics (fecha, total_ventas, total_comisiones, total_ordenes, ordenes_completadas)
         VALUES ($1, $2, $3, 1, 1)
         ON CONFLICT (fecha)
         DO UPDATE SET
            total_ventas = admin_metrics.total_ventas + $2,
            total_comisiones = admin_metrics.total_comisiones + $3,
            total_ordenes = admin_metrics.total_ordenes + 1,
            ordenes_completadas = admin_metrics.ordenes_completadas + 1,
            updated_at = NOW()`,
        [fecha, total, comision]
    );
}