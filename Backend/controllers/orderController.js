const pool = require('../db');
const { randomInt } = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Genera un código de recogida legible estilo TGTG (ej: AB-123)
 */
const generatePickupCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sin I, O para evitar confusión
    const nums = '0123456789';
    let code = '';
    code += chars.charAt(randomInt(chars.length));
    code += chars.charAt(randomInt(chars.length));
    code += '-';
    for (let i = 0; i < 5; i += 1) code += nums.charAt(randomInt(nums.length));
    return code;
};

// @desc    Reservar un producto y emitir un ticket para pago en efectivo en tienda
// @route   POST /api/orders
// @access  Privado (comprador)
exports.createOrder = asyncHandler(async (req, res, next) => {
    const roleResult = await pool.query('SELECT rol FROM users WHERE id = $1', [req.user.id]);
    const userRole = (roleResult.rows[0]?.rol || '').toLowerCase();
    if (!['buyer', 'comprador', 'admin'].includes(userRole)) {
        return res.status(403).json({ msg: 'Solo los compradores pueden realizar pedidos.' });
    }

    const { productId, cantidad = 1 } = req.body;
    const userId = req.user.id;

    if (!Number.isSafeInteger(Number(productId)) || Number(productId) <= 0 ||
        !Number.isSafeInteger(Number(cantidad)) || Number(cantidad) <= 0 || Number(cantidad) > 100) {
        return res.status(400).json({ msg: 'Producto o cantidad inválida.' });
    }

    const client = await pool.connect();
    let committed = false;

    try {
        await client.query('BEGIN');

        // 1. Obtener producto con bloqueo para evitar race conditions
        const productResult = await client.query(
            `SELECT p.*, s.nombre_comercio as seller_name, s.direccion as store_address, s.activo as store_active
             FROM products p 
             LEFT JOIN stores s ON p.store_id = s.id 
             WHERE p.id = $1 FOR UPDATE OF p`,
            [productId]
        );
        
        if (productResult.rows.length === 0) {
            throw new Error('Producto no encontrado.');
        }

        const product = productResult.rows[0];

        if (!product.activo || !product.store_id || !product.store_active) {
            throw new Error('Producto no disponible.');
        }

        // 2. Verificar stock
        if (product.cantidad_disponible < cantidad) {
            throw new Error(`Stock insuficiente. Solo hay ${product.cantidad_disponible} disponibles.`);
        }

        // 3. Calcular totales
        const subtotal = parseFloat(product.precio_descuento) * Number(cantidad);
        if (!Number.isFinite(subtotal) || subtotal < 0) {
            throw new Error('Precio del producto inválido.');
        }
        // Delicrunch no cobra ni transfiere dinero en reservas en efectivo.
        const comisionPlataforma = 0;
        const total = subtotal;

        // 4. Generar código de recogida único
        let codigoRecogida;
        let codigoUnico = false;
        for (let attempt = 0; attempt < 20 && !codigoUnico; attempt += 1) {
            codigoRecogida = generatePickupCode();
            const existe = await client.query(
                "SELECT id FROM orders WHERE codigo_recogida = $1",
                [codigoRecogida]
            );
            if (existe.rows.length === 0) codigoUnico = true;
        }
        if (!codigoUnico) throw new Error('No se pudo emitir un código de recogida.');

        // 5. Reservar stock
        await client.query(
            'UPDATE products SET cantidad_disponible = cantidad_disponible - $1 WHERE id = $2',
            [cantidad, productId]
        );

        // 6. Crear el pedido
        const orderResult = await client.query(
            `INSERT INTO orders (
                user_id, store_id, codigo_recogida, subtotal, 
                total, comision_plataforma, estado, metodo_pago
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                userId, 
                product.store_id, 
                codigoRecogida, 
                subtotal, 
                total,
                comisionPlataforma,
                'confirmado',
                'efectivo'
            ]
        );

        const newOrder = orderResult.rows[0];

        // 7. Crear items del pedido
        await client.query(
            `INSERT INTO order_items (order_id, product_id, cantidad, precio_unitario, subtotal)
             VALUES ($1, $2, $3, $4, $5)`,
            [newOrder.id, productId, cantidad, product.precio_descuento, subtotal]
        );

        // El ahorro se acredita cuando el comercio verifica la entrega.
        const ahorro = (parseFloat(product.precio_original || product.precio_descuento) - parseFloat(product.precio_descuento)) * cantidad;
        const { calculateCO2Saved } = require('../utils/co2Factors');
        const co2Ahorrado = calculateCO2Saved(product.categoria || 'otros', cantidad);

        await client.query('COMMIT');
        committed = true;

        res.status(201).json({
            ...newOrder,
            nombre_comercio: product.seller_name,
            direccion_comercio: product.store_address,
            nombre_producto: product.nombre,
            imagen_url: product.imagen_url,
            cantidad: Number(cantidad),
            ahorro_total: ahorro,
            co2_ahorrado: co2Ahorrado,
            precio_total: total,
            ahorro,
            pago_pendiente_en_comercio: true
        });

    } catch (error) {
        if (!committed) await client.query('ROLLBACK');
        console.error('Error en la transacción:', error.message);
        
        if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrado') ||
            error.message.includes('no disponible') || error.message.includes('inválido')) {
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
    const roleResult = await pool.query('SELECT rol FROM users WHERE id = $1', [userId]);
    const userRole = (roleResult.rows[0]?.rol || '').toLowerCase();

    const orderResult = await pool.query(
        `SELECT o.*,  
                s.nombre_comercio as seller_name, s.direccion as street, s.telefono as phone, 
                s.latitud as latitude, s.longitud as longitude,
                oi.product_id, oi.cantidad as quantity, oi.precio_unitario as unit_price,
                p.nombre AS product_name, p.imagen_url
         FROM orders o
         LEFT JOIN stores s ON o.store_id = s.id
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
            o.store_id,
            o.created_at as fecha_pedido,
            o.created_at as fecha_recogida,
            o.codigo_recogida,
            o.metodo_pago,
            -- Mapear estado 'recogido' a 'Recogido' para el frontend
            CASE WHEN o.estado = 'recogido' THEN 'Recogido' ELSE o.estado END AS estado,
            -- Alias del total para compatibilidad con frontend
            o.total AS precio_total,
            s.nombre_comercio as nombre_comercio,
            p.nombre AS nombre_producto,
            oi.product_id AS producto_id,
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END AS tiene_resena
        FROM orders o
        JOIN stores s ON o.store_id = s.id
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
    
    // Obtener todos los pedidos de esa tienda con información completa (COLUMNAS EN ESPAÑOL)
    const orders = await pool.query(
        `SELECT 
            o.*,
            u.nombre AS nombre_comprador, 
            u.email AS email_comprador,
            oi.cantidad as cantidad, 
            oi.precio_unitario as precio_unitario,
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
    
    // The code is the customer's proof of pickup, so it must not be sent in
    // the merchant order list before the customer presents it.
    res.json(orders.rows.map(({ codigo_recogida, ...order }) => order));
});

// @desc    Actualizar el estado de un pedido (comercio puede marcar como listo/recogido)
// @route   PATCH /api/orders/:id
// @access  Privado (Comercio o Admin)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { estado, codigo_recogida } = req.body;
    const userId = req.user.id;
    const roleResult = await pool.query('SELECT rol FROM users WHERE id = $1', [userId]);
    const userRole = (roleResult.rows[0]?.rol || '').toLowerCase();

    // Validar estado - usar nombres en español del schema
    const estadosPermitidos = ['en_preparacion', 'listo', 'recogido', 'cancelado'];
    if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({ msg: 'Estado inválido.' });
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Obtener la orden con store_id
        const orderResult = await client.query(
            'SELECT o.* FROM orders o WHERE o.id = $1 FOR UPDATE',
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
                await client.query('ROLLBACK');
                return res.status(403).json({ msg: 'No tienes permisos para actualizar este pedido.' });
            }
        }

        if (order.metodo_pago !== 'efectivo') {
            await client.query('ROLLBACK');
            return res.status(409).json({ msg: 'Los pedidos de pago anteriores son de solo lectura.' });
        }
        const transitions = {
            confirmado: ['en_preparacion', 'listo', 'recogido', 'cancelado'],
            en_preparacion: ['listo', 'recogido', 'cancelado'],
            listo: ['recogido', 'cancelado'],
        };
        if (!transitions[order.estado]?.includes(estado)) {
            await client.query('ROLLBACK');
            return res.status(409).json({ msg: 'Este cambio de estado no está permitido para el ticket.' });
        }
        if (estado === 'recogido' &&
            String(codigo_recogida || '').trim().toUpperCase() !== order.codigo_recogida) {
            await client.query('ROLLBACK');
            return res.status(400).json({ msg: 'El código de recogida no coincide.' });
        }

        if (estado === 'cancelado' && order.estado !== 'cancelado') {
            await client.query(
                `UPDATE products p SET cantidad_disponible = p.cantidad_disponible + oi.cantidad
                 FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = p.id`,
                [id]
            );
        }

        // Actualizar fecha de recogida real si el estado es 'recogido'
        const fechaRecogidaReal = estado === 'recogido' ? new Date() : null;

        // Actualizar el estado
        const updateResult = await client.query(
            `UPDATE orders 
             SET estado = $1, 
                 fecha_recogida_real = COALESCE($2, fecha_recogida_real),
                 updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [estado, fechaRecogidaReal, id]
        );

        // Si la orden se completa (recogido), actualizar métricas si existen funciones
        if (estado === 'recogido' && order.estado !== 'recogido') {
            const delivered = await client.query(
                `SELECT oi.cantidad, p.categoria, p.precio_original, oi.precio_unitario
                 FROM order_items oi JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = $1`, [id]
            );
            const { calculateCO2Saved } = require('../utils/co2Factors');
            const ahorro = delivered.rows.reduce((sum, item) =>
                sum + Math.max(0, (Number(item.precio_original || item.precio_unitario) - Number(item.precio_unitario)) * item.cantidad), 0);
            const co2Ahorrado = delivered.rows.reduce((sum, item) =>
                sum + calculateCO2Saved(item.categoria || 'otros', item.cantidad), 0);
            await client.query(
                `UPDATE profiles SET total_pedidos = COALESCE(total_pedidos, 0) + 1,
                    total_ahorrado = COALESCE(total_ahorrado, 0) + $1,
                    co2_ahorrado = COALESCE(co2_ahorrado, 0) + $2
                 WHERE user_id = $3`, [ahorro, co2Ahorrado, order.user_id]
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
    // El middleware getStoreId asigna storeId
    const storeId = req.storeId;
    const { days = 30 } = req.query;
    const daysCount = Number(days);
    if (!Number.isInteger(daysCount) || daysCount < 1 || daysCount > 365) {
        return res.status(400).json({ msg: 'Periodo inválido.' });
    }

    if (!storeId) {
        return res.status(400).json({ msg: 'Store ID no disponible' });
    }

    // Métricas generales - usando campos correctos del schema
    const generalMetrics = await pool.query(
        `SELECT 
            COUNT(*) as total_ordenes,
            COUNT(CASE WHEN estado = 'recogido' THEN 1 END) as ordenes_completadas,
            COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as ordenes_canceladas,
            COUNT(CASE WHEN estado IN ('confirmado', 'en_preparacion', 'listo') THEN 1 END) as ordenes_pendientes,
            COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END), 0) as ventas_totales,
            COALESCE(SUM(CASE WHEN estado = 'recogido' THEN comision_plataforma ELSE 0 END), 0) as comisiones_totales,
            COALESCE(SUM(CASE WHEN estado = 'recogido' THEN (total - comision_plataforma) ELSE 0 END), 0) as ingresos_netos
         FROM orders 
         WHERE store_id = $1 AND created_at >= NOW() - ($2::int * INTERVAL '1 day')`,
        [storeId, daysCount]
    );

    // Métricas por día (últimos 30 días)
    const dailyMetrics = await pool.query(
        `SELECT 
            DATE(created_at) as fecha,
            COUNT(*) as ordenes,
            COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END), 0) as ventas,
            COALESCE(SUM(CASE WHEN estado = 'recogido' THEN (total - comision_plataforma) ELSE 0 END), 0) as ingresos
         FROM orders 
         WHERE store_id = $1 AND created_at >= NOW() - ($2::int * INTERVAL '1 day')
         GROUP BY DATE(created_at)
         ORDER BY fecha DESC`,
        [storeId, daysCount]
    );

    // Productos más vendidos
    const topProducts = await pool.query(
        `SELECT 
            p.id, p.nombre AS nombre, 
            COUNT(oi.id) as veces_vendido,
            SUM(oi.cantidad) as unidades_vendidas,
            COALESCE(SUM(oi.subtotal), 0) as ingresos_totales
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         WHERE o.store_id = $1 AND o.estado = 'recogido' AND o.created_at >= NOW() - ($2::int * INTERVAL '1 day')
         GROUP BY p.id, p.nombre
         ORDER BY veces_vendido DESC
         LIMIT 5`,
        [storeId, daysCount]
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
    // Usar store_id en lugar de seller_id
    const storeId = req.storeId; // Proporcionado por el middleware getStoreId
    const { period = '30' } = req.query; // días
    const periodDays = Number(period);
    if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365) {
        return res.status(400).json({ msg: 'Periodo inválido.' });
    }

    if (!storeId) {
        return res.status(400).json({ msg: 'Store ID no disponible' });
    }

    // 1. Resumen general - usando campos correctos del schema
    const summary = await pool.query(
        `SELECT 
            COUNT(DISTINCT o.id) as total_pedidos,
            COUNT(DISTINCT CASE WHEN o.estado = 'recogido' THEN o.id END) as pedidos_completados,
            COUNT(DISTINCT CASE WHEN o.estado = 'cancelado' THEN o.id END) as pedidos_cancelados,
            COUNT(DISTINCT CASE WHEN o.estado IN ('pendiente', 'confirmado', 'listo') THEN o.id END) as pedidos_activos,
            COALESCE(SUM(CASE WHEN o.estado = 'recogido' THEN o.total ELSE 0 END), 0) as ventas_totales,
            COALESCE(SUM(CASE WHEN o.estado = 'recogido' THEN o.comision_plataforma ELSE 0 END), 0) as comisiones_totales,
            COALESCE(SUM(CASE WHEN o.estado = 'recogido' THEN (o.total - o.comision_plataforma) ELSE 0 END), 0) as ingresos_netos,
            COALESCE(AVG(CASE WHEN o.estado = 'recogido' THEN o.total END), 0) as ticket_promedio,
            COUNT(DISTINCT o.user_id) as clientes_unicos
         FROM orders o
         WHERE o.store_id = $1 AND o.created_at >= NOW() - ($2::int * INTERVAL '1 day')`,
        [storeId, periodDays]
    );

    // 2. Tendencia diaria (últimos 30 días)
    const dailyTrend = await pool.query(
        `SELECT 
            DATE(o.created_at) as fecha,
            COUNT(*) as pedidos,
            COUNT(CASE WHEN o.estado = 'recogido' THEN 1 END) as completados,
            COALESCE(SUM(CASE WHEN estado = 'recogido' THEN comision_plataforma ELSE 0 END), 0) as comision,
            COALESCE(SUM(CASE WHEN estado = 'recogido' THEN (total - comision_plataforma) ELSE 0 END), 0) as ingreso
         FROM orders o
         WHERE o.store_id = $1 AND o.created_at >= NOW() - ($2::int * INTERVAL '1 day')
         GROUP BY DATE(o.created_at)
         ORDER BY fecha ASC`,
        [storeId, periodDays]
    );

    // 3. Top productos - usando campos correctos del schema
    const topProducts = await pool.query(
        `SELECT 
            p.id, 
            p.nombre AS nombre,
            p.imagen_url AS imagen_url,
            COUNT(DISTINCT o.id) as pedidos,
            SUM(oi.cantidad) as unidades,
            COALESCE(SUM(CASE WHEN o.estado = 'recogido' THEN oi.precio_unitario * oi.cantidad ELSE 0 END), 0) as ingresos
         FROM products p
         LEFT JOIN order_items oi ON oi.product_id = p.id
         LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= NOW() - ($2::int * INTERVAL '1 day')
         WHERE p.store_id = $1
         GROUP BY p.id, p.nombre, p.imagen_url
         ORDER BY pedidos DESC NULLS LAST, ingresos DESC
         LIMIT 10`,
        [storeId, periodDays]
    );

    // 4. Distribución por estado
    const statusDistribution = await pool.query(
        `SELECT 
            o.estado AS estado,
            COUNT(*) as cantidad,
            ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) as porcentaje
         FROM orders o
         WHERE o.store_id = $1 AND o.created_at >= NOW() - ($2::int * INTERVAL '1 day')
         GROUP BY o.estado
         ORDER BY cantidad DESC`,
        [storeId, periodDays]
    );

    // 5. Horarios de mayor demanda
    const peakHours = await pool.query(
        `SELECT 
            EXTRACT(HOUR FROM o.created_at) as hora,
            COUNT(*) as pedidos,
            COALESCE(SUM(CASE WHEN o.estado = 'recogido' THEN o.total ELSE 0 END), 0) as ventas
         FROM orders o
         WHERE o.store_id = $1 AND o.created_at >= NOW() - ($2::int * INTERVAL '1 day')
         GROUP BY hora
         ORDER BY pedidos DESC`,
        [storeId, periodDays]
    );

    // 6. Tasa de conversión (pedidos completados vs totales)
    const conversionRate = summary.rows[0].total_pedidos > 0
        ? ((summary.rows[0].pedidos_completados / summary.rows[0].total_pedidos) * 100).toFixed(1)
        : 0;

    // 7. Comparación con período anterior
    const previousPeriod = await pool.query(
        `SELECT 
            COUNT(*) as pedidos_anteriores,
            COALESCE(SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END), 0) as ventas_anteriores
         FROM orders
         WHERE store_id = $1 
           AND created_at >= NOW() - ($2::int * INTERVAL '2 days')
           AND created_at < NOW() - ($2::int * INTERVAL '1 day')`,
        [storeId, periodDays]
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
