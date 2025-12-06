const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

// Función auxiliar para generar un código de recogida simple y legible
const generatePickupCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
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


// @desc    Crear un nuevo pedido
// @acceso  Privado (solo para rol 'comprador')
exports.createOrder = asyncHandler(async (req, res, next) => {
    // 1. Verificar si el usuario es un comprador
    if (req.user.rol !== 'comprador') {
        return res.status(403).json({ msg: 'Solo los compradores pueden realizar pedidos.' });
    }

    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
        return res.status(400).json({ msg: 'Se requiere el ID del producto.' });
    }

    // --- INICIO DE LA TRANSACCIÓN DE BASE DE DATOS ---
    // Usamos un 'cliente' del pool para asegurar que todas las operaciones
    // dentro de esta función ocurran en la misma conexión a la base de datos.
    const client = await pool.connect();

    try {
        // Marcamos el inicio de la transacción.
        await client.query('BEGIN');

        // A. Bloquear la fila del producto para evitar 'race conditions' (que dos personas compren el último item a la vez).
        const productResult = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [productId]);
        if (productResult.rows.length === 0) {
            throw new Error('Producto no encontrado.');
        }

        const product = productResult.rows[0];

        // B. Verificar si hay stock disponible.
        if (product.cantidad_disponible <= 0) {
            throw new Error('Producto sin stock.');
        }

        // C. Actualizar la cantidad disponible del producto.
        await client.query(
            'UPDATE products SET cantidad_disponible = cantidad_disponible - 1 WHERE id = $1',
            [productId]
        );

        // D. Generar un código de recogida único y crear el nuevo pedido.
        const pickupCode = generatePickupCode();
        const newOrder = await client.query(
            `INSERT INTO orders (user_id, product_id, store_id, precio_total, codigo_recogida)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, productId, product.store_id, product.precio_descuento, pickupCode]
        );

        // Si todas las operaciones anteriores fueron exitosas, confirmamos la transacción.
        await client.query('COMMIT');
        res.status(201).json(newOrder.rows[0]);

    } catch (error) {
        // Si cualquier operación dentro del bloque 'try' falla, deshacemos todos los cambios.
        await client.query('ROLLBACK');
        console.error('Error en la transacción:', error.message);
        next(error); // Pasamos el error al manejador de errores centralizado
    } finally {
        // Finalmente, liberamos al cliente para que pueda ser usado por otras solicitudes.
        // Esto es MUY importante para evitar que el pool de conexiones se agote.
        client.release();
    }
});

// @desc    Obtener los pedidos del comprador logueado
// @acceso  Privado (Comprador)
exports.getMyOrders = asyncHandler(async (req, res, next) => {
    if (req.user.rol !== 'comprador') {
        return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    const orders = await pool.query(
        `SELECT o.*, s.nombre_comercio, p.nombre AS nombre_producto,
            CASE WHEN r.id IS NOT NULL THEN true ELSE false END AS tiene_resena
            FROM orders o
            JOIN stores s ON o.store_id = s.id
            JOIN products p ON o.product_id = p.id
            LEFT JOIN reviews r ON o.id = r.order_id
            WHERE o.user_id = $1
            ORDER BY o.fecha_pedido DESC`,
        [req.user.id]
    );
    res.json(orders.rows);
});

// @desc    Obtener los pedidos recibidos por la tienda del comercio logueado
// @acceso  Privado (Comercio)
exports.getStoreOrders = asyncHandler(async (req, res, next) => {
    // El middleware getStoreId se encargará de esto en las rutas.
    const storeId = req.storeId;
    
    // Obtener todos los pedidos de esa tienda
    const orders = await pool.query(
        `SELECT o.*, u.nombre AS nombre_comprador, p.nombre AS nombre_producto
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN products p ON o.product_id = p.id
            WHERE o.store_id = $1
            ORDER BY o.fecha_pedido DESC`,
            [storeId]
    );
    res.json(orders.rows);
});