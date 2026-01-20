const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const fs = require('fs');
const path = require('path');


exports.createProduct = asyncHandler(async (req, res, next) => {
    // Extraer los datos del producto del cuerpo de la solicitud
    const {
        nombre,
        descripcion,
        precio_original,
        precio_descuento,
        cantidad_inicial,      // Alias para cantidad_disponible
        cantidad_disponible,   // Campo directo
        cantidad_maxima_diaria,
        categoria,
        hora_recogida_inicio,
        hora_recogida_fin,
        producto_listo         // Nuevo campo para marcar productos listos
    } = req.body;

    // Usar cantidad_disponible o cantidad_inicial (para compatibilidad con frontend)
    const cantidadDisponible = parseInt(cantidad_disponible || cantidad_inicial || 0);
    const cantidadMaxima = parseInt(cantidad_maxima_diaria || cantidadDisponible || 10);

    // Validación básica
    if (!nombre || !precio_original || !precio_descuento || !cantidadDisponible) {
        return res.status(400).json({ msg: 'Por favor, complete todos los campos obligatorios (nombre, precios, cantidad).' });
    }
    
    // La URL de la imagen viene de multer (si se subió un archivo) o del body
    let imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
    if (!imagen_url && req.body.imagen_url) {
        imagen_url = req.body.imagen_url;
    }
    
    // El middleware getStoreId nos proporciona req.storeId
    const storeId = req.storeId;

    // Insertar el nuevo producto en la base de datos
    const newProduct = await pool.query(
        `INSERT INTO products (store_id, nombre, descripcion, precio_original, precio_descuento, 
            cantidad_disponible, cantidad_maxima_diaria, categoria, hora_recogida_inicio, hora_recogida_fin, imagen_url, producto_listo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *`,
        [storeId, nombre, descripcion || '', precio_original, precio_descuento, 
         cantidadDisponible, cantidadMaxima, categoria || 'Otros', 
         hora_recogida_inicio || '14:00', hora_recogida_fin || '18:00', imagen_url, producto_listo || false]
    );

    res.status(201).json(newProduct.rows[0]);
});

// @desc    Obtener todos los productos de la tienda del comercio logueado
// @acceso  Privado (solo para rol 'comercio')
exports.getStoreProducts = asyncHandler(async (req, res, next) => {
    // El middleware getStoreId nos proporciona req.storeId
    const storeId = req.storeId;

    const products = await pool.query('SELECT * FROM products WHERE store_id = $1 ORDER BY created_at DESC', [storeId]);
    res.json(products.rows);
});

// @desc    Obtener TODOS los productos disponibles de TODAS las tiendas
// @acceso  Público
exports.getAllAvailableProducts = asyncHandler(async (req, res, next) => {
    // Obtenemos productos y unimos la tabla de tiendas para incluir información del comercio
    const products = await pool.query(
        `SELECT p.*, s.nombre_comercio, s.direccion
            FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE p.cantidad_disponible > 0
            ORDER BY p.created_at DESC`
    );
    res.json(products.rows);
});


// @desc    Actualizar un producto existente
// @acceso  Privado (solo el comercio dueño del producto)
exports.updateProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const { 
        nombre, 
        descripcion, 
        precio_original, 
        precio_descuento, 
        cantidad_disponible, 
        cantidad_maxima_diaria,
        categoria,
        hora_recogida_inicio, 
        hora_recogida_fin, 
        imagen_url,
        activo,
        producto_listo  // Nuevo campo
    } = req.body;

    // --- INICIO LÓGICA PARA BORRAR IMAGEN ANTIGUA ---
    // Si se sube un archivo nuevo, buscamos y eliminamos el antiguo.
    if (req.file) {
        const productResult = await pool.query('SELECT imagen_url FROM products WHERE id = $1', [productId]);
        if (productResult.rows.length > 0) {
            const oldImageUrl = productResult.rows[0].imagen_url;
            if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
                const oldImagePath = path.join(__dirname, '..', oldImageUrl);
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error(`Error al eliminar imagen antigua: ${oldImagePath}`, err);
                    else console.log(`Imagen antigua eliminada: ${oldImagePath}`);
                });
            }
        }
    }
    // --- FIN LÓGICA ---

    // Si se sube una nueva imagen, req.file contendrá la información.
    const newImageUrl = req.file ? `/uploads/${req.file.filename}` : imagen_url;
    
    // Obtener valores actuales del producto para campos no proporcionados
    const currentProduct = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (currentProduct.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado.' });
    }
    const current = currentProduct.rows[0];

    // Actualizar producto con valores proporcionados o existentes
    const updatedProduct = await pool.query(
        `UPDATE products SET 
            nombre = $1, 
            descripcion = $2, 
            precio_original = $3, 
            precio_descuento = $4, 
            cantidad_disponible = $5, 
            cantidad_maxima_diaria = $6,
            categoria = $7,
            hora_recogida_inicio = $8, 
            hora_recogida_fin = $9, 
            imagen_url = $10,
            activo = $11,
            producto_listo = $12,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $13 RETURNING *`,
        [
            nombre || current.nombre, 
            descripcion !== undefined ? descripcion : current.descripcion, 
            precio_original || current.precio_original, 
            precio_descuento || current.precio_descuento, 
            cantidad_disponible !== undefined ? cantidad_disponible : current.cantidad_disponible, 
            cantidad_maxima_diaria || current.cantidad_maxima_diaria,
            categoria || current.categoria,
            hora_recogida_inicio || current.hora_recogida_inicio, 
            hora_recogida_fin || current.hora_recogida_fin, 
            newImageUrl || current.imagen_url,
            activo !== undefined ? activo : current.activo,
            producto_listo !== undefined ? producto_listo : current.producto_listo,
            productId
        ]
    );

    res.json(updatedProduct.rows[0]);
});

// @desc    Eliminar un producto
// @acceso  Privado (solo el comercio dueño del producto)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;

    // --- INICIO LÓGICA PARA BORRAR IMAGEN ---
    // Antes de eliminar el producto, obtenemos la URL de su imagen para borrar el archivo.
    const productResult = await pool.query('SELECT imagen_url FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length > 0) {
        const imageUrl = productResult.rows[0].imagen_url;
        if (imageUrl && imageUrl.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', imageUrl);
            fs.unlink(imagePath, (err) => {
                if (err) console.error(`Error al eliminar imagen: ${imagePath}`, err);
                else console.log(`Imagen eliminada: ${imagePath}`);
            });
        }
    }
    // --- FIN LÓGICA ---

    // La verificación de propiedad ahora la hace el middleware `checkProductOwnership`
    // Procedemos directamente a eliminar.
    const result = await pool.query('DELETE FROM products WHERE id = $1', [productId]);
    
    if (result.rowCount === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado.' });
    }
    
    res.json({ msg: 'Producto eliminado exitosamente.' });
});


// @desc    Obtener un único producto por su ID
// @acceso  Público
exports.getProductById = asyncHandler(async (req, res, next) => {
    const productId = req.params.id; // Obtenemos el ID de los parámetros de la URL

    const product = await pool.query(
        `SELECT p.*, s.nombre_comercio, s.direccion, s.descripcion AS store_description
            FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE p.id = $1`,
        [productId]
    );

    if (product.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado.' });
    }

    res.json(product.rows[0]);
});

// @desc    Obtener estadísticas de productos para la tienda del comercio
// @acceso  Privado (solo para rol 'comercio')
exports.getProductStats = asyncHandler(async (req, res, next) => {
    // El middleware getStoreId nos proporciona req.storeId
    const storeId = req.storeId;

    const stats = await pool.query(
        `SELECT 
            p.id, 
            p.nombre, 
            p.cantidad_maxima_diaria as cantidad_inicial, 
            p.cantidad_disponible,
            p.precio_descuento,
            COUNT(oi.id) AS total_pedidos
         FROM products p
         LEFT JOIN order_items oi ON p.id = oi.product_id
         WHERE p.store_id = $1
         GROUP BY p.id
         ORDER BY total_pedidos DESC`,
        [storeId]
    );

    res.json(stats.rows);
});

// @desc    Obtener productos recomendados para el usuario basados en su historial
// @acceso  Privado (solo para rol 'comprador')
exports.getRecommendedProducts = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Obtener categorías de productos que el usuario ha comprado o marcado como favoritos
    const userCategories = await pool.query(
        `SELECT DISTINCT p.categoria
         FROM products p
         LEFT JOIN order_items oi ON p.id = oi.product_id
         LEFT JOIN orders o ON oi.order_id = o.id
         LEFT JOIN favorites f ON p.store_id = f.store_id
         WHERE (o.user_id = $1 OR f.user_id = $1) AND p.categoria IS NOT NULL
         LIMIT 10`,
        [userId]
    );

    const categories = userCategories.rows.map(row => row.categoria);

    if (categories.length === 0) {
        // Si no hay categorías, devolver productos aleatorios
        const randomProducts = await pool.query(
            `SELECT p.*, s.nombre_comercio, s.direccion, s.latitud, s.longitud
             FROM products p
             JOIN stores s ON p.store_id = s.id
             WHERE p.cantidad_disponible > 0 AND p.activo = true
             ORDER BY RANDOM()
             LIMIT 20`
        );
        return res.json(randomProducts.rows);
    }

    // Obtener productos de las categorías favoritas del usuario
    const recommendedProducts = await pool.query(
        `SELECT p.*, s.nombre_comercio, s.direccion, s.latitud, s.longitud
         FROM products p
         JOIN stores s ON p.store_id = s.id
         WHERE p.categoria = ANY($1) AND p.cantidad_disponible > 0 AND p.activo = true
         ORDER BY p.created_at DESC
         LIMIT 20`,
        [categories]
    );

    res.json(recommendedProducts.rows);
});

// @desc    Obtener productos listos (marcados como producto_listo)
// @acceso  Público
exports.getReadyProducts = asyncHandler(async (req, res, next) => {
    const readyProducts = await pool.query(
        `SELECT p.*, s.nombre_comercio, s.direccion, s.latitud, s.longitud
         FROM products p
         JOIN stores s ON p.store_id = s.id
         WHERE p.producto_listo = true AND p.cantidad_disponible > 0 AND p.activo = true
         ORDER BY p.created_at DESC
         LIMIT 20`
    );

    res.json(readyProducts.rows);
});

// @desc    Obtener productos nuevos (creados hoy o de tiendas nuevas)
// @acceso  Público
exports.getNewProducts = asyncHandler(async (req, res, next) => {
    const newProducts = await pool.query(
        `SELECT p.*, s.nombre_comercio, s.direccion, s.latitud, s.longitud, s.created_at as store_created_at
         FROM products p
         JOIN stores s ON p.store_id = s.id
         WHERE p.cantidad_disponible > 0 AND p.activo = true
         AND (p.created_at >= CURRENT_DATE OR s.created_at >= CURRENT_DATE - INTERVAL '7 days')
         ORDER BY p.created_at DESC
         LIMIT 20`
    );

    res.json(newProducts.rows);
});