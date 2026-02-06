const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const fs = require('fs');
const path = require('path');


exports.createProduct = asyncHandler(async (req, res, next) => {
    // Extraer los datos del producto - aceptar nombres en español del frontend
    const {
        // Nombres en español del frontend
        nombre,
        descripcion,
        precio_original,
        precio_descuento,
        cantidad_inicial,
        cantidad_disponible,
        categoria,
        imagen_url: imagenUrlBody,
        // Nombres en inglés alternativos
        name,
        description,
        price,
        compare_price,
        stock,
        category,
        image_url: imageUrlBody
    } = req.body;

    // Mapear a nombres reales de la BD (inglés)
    const productName = nombre || name;
    const productDescription = descripcion || description || '';
    const productPrice = parseFloat(precio_descuento || price || 0);
    const productComparePrice = parseFloat(precio_original || compare_price || productPrice);
    const productStock = parseInt(cantidad_disponible || cantidad_inicial || stock || 0);
    const productCategory = categoria || category || 'Otros';

    // Validación básica
    if (!productName || !productPrice || productStock < 0) {
        return res.status(400).json({ msg: 'Por favor, complete todos los campos obligatorios (nombre, precio, cantidad).' });
    }
    
    // La URL de la imagen viene de multer (si se subió un archivo) o del body
    let finalImageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!finalImageUrl) {
        finalImageUrl = imagenUrlBody || imageUrlBody || null;
    }
    
    // El vendedor es el usuario actual (seller_id = user.id)
    const sellerId = req.user.id;

    // Insertar el nuevo producto en la base de datos con campos reales
    const newProduct = await pool.query(
        `INSERT INTO products (seller_id, name, description, price, compare_price, 
            stock, category, image_url, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING 
                id,
                name as nombre,
                description as descripcion,
                price as precio_descuento,
                compare_price as precio_original,
                stock as cantidad_disponible,
                category as categoria,
                image_url as imagen_url,
                is_active as activo,
                created_at`,
        [sellerId, productName, productDescription, productPrice, productComparePrice, 
         productStock, productCategory, finalImageUrl]
    );

    res.status(201).json(newProduct.rows[0]);
});

// @desc    Obtener todos los productos de la tienda del comercio logueado
// @acceso  Privado (solo para rol 'comercio')
exports.getStoreProducts = asyncHandler(async (req, res, next) => {
    // El vendedor es el usuario actual
    const sellerId = req.user.id;

    const products = await pool.query(
        `SELECT 
            id,
            name as nombre,
            description as descripcion,
            price as precio_descuento,
            compare_price as precio_original,
            stock as cantidad_disponible,
            category as categoria,
            image_url as imagen_url,
            images,
            is_active as activo,
            is_featured,
            rating as calificacion_promedio,
            reviews_count as total_resenas,
            sales_count,
            created_at,
            updated_at
        FROM products 
        WHERE seller_id = $1 
        ORDER BY created_at DESC`, 
        [sellerId]
    );
    res.json(products.rows);
});

// @desc    Obtener TODOS los productos disponibles de TODAS las tiendas
// @acceso  Público
exports.getAllAvailableProducts = asyncHandler(async (req, res, next) => {
    // Obtenemos productos con aliases para compatibilidad con frontend (español)
    const products = await pool.query(
        `SELECT 
            p.id,
            p.nombre,
            p.descripcion,
            p.precio_descuento,
            p.precio_original,
            p.cantidad_disponible,
            p.categoria,
            p.imagen_url,
            p.activo,
            p.store_id,
            p.created_at,
            p.updated_at,
            -- Campos del comercio
            s.nombre_comercio,
            s.direccion,
            s.latitud,
            s.longitud,
            s.telefono
        FROM products p
        LEFT JOIN stores s ON  p.store_id = s.id
        WHERE p.cantidad_disponible > 0 AND p.activo = true
        ORDER BY p.created_at DESC`
    );
    res.json(products.rows);
});


// @desc    Actualizar un producto existente
// @acceso  Privado (solo el comercio dueño del producto)
exports.updateProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const sellerId = req.user.id;
    
    // Aceptar campos en español (frontend) o inglés (BD)
    const { 
        nombre, name,
        descripcion, description,
        precio_original, compare_price,
        precio_descuento, price,
        cantidad_disponible, stock,
        categoria, category,
        imagen_url, image_url,
        activo, is_active
    } = req.body;

    // Verificar que el producto pertenece al vendedor
    const currentProduct = await pool.query(
        'SELECT * FROM products WHERE id = $1 AND seller_id = $2', 
        [productId, sellerId]
    );
    if (currentProduct.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado o no tienes permiso para editarlo.' });
    }
    const current = currentProduct.rows[0];

    // --- INICIO LÓGICA PARA BORRAR IMAGEN ANTIGUA ---
    if (req.file) {
        const oldImageUrl = current.image_url;
        if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
            const oldImagePath = path.join(__dirname, '..', oldImageUrl);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error(`Error al eliminar imagen antigua: ${oldImagePath}`, err);
                else console.log(`Imagen antigua eliminada: ${oldImagePath}`);
            });
        }
    }
    // --- FIN LÓGICA ---

    // Si se sube una nueva imagen, req.file contendrá la información.
    const newImageUrl = req.file ? `/uploads/${req.file.filename}` : (imagen_url || image_url);
    
    // Mapear campos (aceptar español o inglés)
    const finalName = nombre || name || current.name;
    const finalDescription = descripcion !== undefined ? descripcion : (description !== undefined ? description : current.description);
    const finalComparePrice = precio_original || compare_price || current.compare_price;
    const finalPrice = precio_descuento || price || current.price;
    const finalStock = cantidad_disponible !== undefined ? cantidad_disponible : (stock !== undefined ? stock : current.stock);
    const finalCategory = categoria || category || current.category;
    const finalIsActive = activo !== undefined ? activo : (is_active !== undefined ? is_active : current.is_active);

    // Actualizar producto con campos reales de la BD
    const updatedProduct = await pool.query(
        `UPDATE products SET 
            name = $1, 
            description = $2, 
            compare_price = $3, 
            price = $4, 
            stock = $5, 
            category = $6,
            image_url = $7,
            is_active = $8,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $9 
         RETURNING 
            id,
            name as nombre,
            description as descripcion,
            price as precio_descuento,
            compare_price as precio_original,
            stock as cantidad_disponible,
            category as categoria,
            image_url as imagen_url,
            is_active as activo,
            updated_at`,
        [
            finalName, 
            finalDescription, 
            finalComparePrice, 
            finalPrice, 
            finalStock, 
            finalCategory,
            newImageUrl || current.image_url,
            finalIsActive,
            productId
        ]
    );

    res.json(updatedProduct.rows[0]);
});

// @desc    Eliminar un producto
// @acceso  Privado (solo el comercio dueño del producto)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const sellerId = req.user.id;

    // Verificar propiedad y obtener imagen para eliminar
    const productResult = await pool.query(
        'SELECT image_url FROM products WHERE id = $1 AND seller_id = $2', 
        [productId, sellerId]
    );
    
    if (productResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado o no tienes permiso para eliminarlo.' });
    }

    // Eliminar imagen si existe
    const imageUrl = productResult.rows[0].image_url;
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '..', imageUrl);
        fs.unlink(imagePath, (err) => {
            if (err) console.error(`Error al eliminar imagen: ${imagePath}`, err);
            else console.log(`Imagen eliminada: ${imagePath}`);
        });
    }

    // Eliminar el producto
    await pool.query('DELETE FROM products WHERE id = $1', [productId]);
    
    res.json({ msg: 'Producto eliminado exitosamente.' });
});


// @desc    Obtener un único producto por su ID
// @acceso  Público
exports.getProductById = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;

    const product = await pool.query(
        `SELECT 
            p.id,
            p.name as nombre,
            p.description as descripcion,
            p.price as precio_descuento,
            p.compare_price as precio_original,
            p.stock as cantidad_disponible,
            p.category as categoria,
            p.image_url as imagen_url,
            p.images,
            p.is_active as activo,
            p.is_featured,
            p.rating as calificacion_promedio,
            p.reviews_count as total_resenas,
            p.sales_count,
            p.views_count,
            p.seller_id,
            p.latitude,
            p.longitude,
            p.created_at,
            -- Información del vendedor
            u.name as nombre_comercio,
            u.city as ciudad,
            u.street as direccion,
            u.phone as telefono_comercio,
            u.latitude as latitud,
            u.longitude as longitud
        FROM products p
        LEFT JOIN users u ON u.id = p.seller_id
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
    const sellerId = req.user.id;

    const stats = await pool.query(
        `SELECT 
            p.id, 
            p.name as nombre, 
            p.stock as cantidad_disponible,
            p.price as precio_descuento,
            p.sales_count as total_vendidos,
            COUNT(oi.id) AS total_pedidos
         FROM products p
         LEFT JOIN order_items oi ON p.id = oi.product_id
         WHERE p.seller_id = $1
         GROUP BY p.id
         ORDER BY total_pedidos DESC`,
        [sellerId]
    );

    res.json(stats.rows);
});

// @desc    Obtener productos recomendados para el usuario basados en su historial
// @acceso  Privado (solo para rol 'comprador')
exports.getRecommendedProducts = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Obtener categorías de productos que el usuario ha comprado o marcado como favoritos
    const userCategories = await pool.query(
        `SELECT DISTINCT p.category as categoria
         FROM products p
         LEFT JOIN order_items oi ON p.id = oi.product_id
         LEFT JOIN orders o ON oi.order_id = o.id
         LEFT JOIN favorites f ON p.id = f.product_id
         WHERE (o.user_id = $1 OR f.user_id = $1) AND p.category IS NOT NULL
         LIMIT 10`,
        [userId]
    );

    const categories = userCategories.rows.map(row => row.categoria);

    if (categories.length === 0) {
        // Si no hay categorías, devolver productos aleatorios
        const randomProducts = await pool.query(
            `SELECT 
                p.id,
                p.name as nombre,
                p.description as descripcion,
                p.price as precio_descuento,
                p.compare_price as precio_original,
                p.stock as cantidad_disponible,
                p.category as categoria,
                p.image_url as imagen_url,
                p.is_active as activo,
                p.rating as calificacion_promedio,
                u.name as nombre_comercio,
                u.street as direccion,
                u.latitude as latitud,
                u.longitude as longitud
             FROM products p
             LEFT JOIN users u ON u.id = p.seller_id
             WHERE p.stock > 0 AND p.is_active = true
             ORDER BY RANDOM()
             LIMIT 20`
        );
        return res.json(randomProducts.rows);
    }

    // Obtener productos de las categorías favoritas del usuario
    const recommendedProducts = await pool.query(
        `SELECT 
            p.id,
            p.name as nombre,
            p.description as descripcion,
            p.price as precio_descuento,
            p.compare_price as precio_original,
            p.stock as cantidad_disponible,
            p.category as categoria,
            p.image_url as imagen_url,
            p.is_active as activo,
            p.rating as calificacion_promedio,
            u.name as nombre_comercio,
            u.street as direccion,
            u.latitude as latitud,
            u.longitude as longitud
         FROM products p
         LEFT JOIN users u ON u.id = p.seller_id
         WHERE p.category = ANY($1) AND p.stock > 0 AND p.is_active = true
         ORDER BY p.created_at DESC
         LIMIT 20`,
        [categories]
    );

    res.json(recommendedProducts.rows);
});

// @desc    Obtener productos destacados (is_featured = true)
// @acceso  Público
exports.getReadyProducts = asyncHandler(async (req, res, next) => {
    const readyProducts = await pool.query(
        `SELECT 
            p.id,
            p.name as nombre,
            p.description as descripcion,
            p.price as precio_descuento,
            p.compare_price as precio_original,
            p.stock as cantidad_disponible,
            p.category as categoria,
            p.image_url as imagen_url,
            p.is_active as activo,
            p.is_featured,
            p.rating as calificacion_promedio,
            u.name as nombre_comercio,
            u.street as direccion,
            u.latitude as latitud,
            u.longitude as longitud
         FROM products p
         LEFT JOIN users u ON u.id = p.seller_id
         WHERE p.is_featured = true AND p.stock > 0 AND p.is_active = true
         ORDER BY p.created_at DESC
         LIMIT 20`
    );

    res.json(readyProducts.rows);
});

// @desc    Obtener productos nuevos (creados hoy o de tiendas nuevas)
// @acceso  Público
exports.getNewProducts = asyncHandler(async (req, res, next) => {
    const newProducts = await pool.query(
        `SELECT 
            p.id,
            p.name as nombre,
            p.description as descripcion,
            p.price as precio_descuento,
            p.compare_price as precio_original,
            p.stock as cantidad_disponible,
            p.category as categoria,
            p.image_url as imagen_url,
            p.is_active as activo,
            p.rating as calificacion_promedio,
            p.created_at,
            u.name as nombre_comercio,
            u.street as direccion,
            u.latitude as latitud,
            u.longitude as longitud,
            u.created_at as seller_created_at
         FROM products p
         LEFT JOIN users u ON u.id = p.seller_id
         WHERE p.stock > 0 AND p.is_active = true
         AND (p.created_at >= CURRENT_DATE OR u.created_at >= CURRENT_DATE - INTERVAL '7 days')
         ORDER BY p.created_at DESC
         LIMIT 20`
    );

    res.json(newProducts.rows);
});