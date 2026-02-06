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
    
    // El vendedor es el usuario actual - obtener store_id del usuario
    const userId = req.user.id;
    
    // Obtener store_id del usuario comercio
    const storeResult = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1',
        [userId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(400).json({ msg: 'No tienes una tienda asociada' });
    }
    
    const storeId = storeResult.rows[0].id;

    // Insertar el nuevo producto en la base de datos con columnas en español
    const newProduct = await pool.query(
        `INSERT INTO products (store_id, nombre, descripcion, precio_descuento, precio_original, 
            cantidad_disponible, categoria, imagen_url, activo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING 
                id,
                nombre,
                descripcion,
                precio_descuento,
                precio_original,
                cantidad_disponible,
                categoria,
                imagen_url,
                activo,
                created_at`,
        [storeId, productName, productDescription, productPrice, productComparePrice, 
         productStock, productCategory, finalImageUrl]
    );

    res.status(201).json(newProduct.rows[0]);
});

// @desc    Obtener todos los productos de la tienda del comercio logueado
// @acceso  Privado (solo para rol 'comercio')
exports.getStoreProducts = asyncHandler(async (req, res, next) => {
    // El vendedor es el usuario actual - obtener store_id
    const userId = req.user.id;
    
    // Obtener store_id del usuario
    const storeResult = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1',
        [userId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'No tienes una tienda asociada' });
    }
    
    const storeId = storeResult.rows[0].id;

    const products = await pool.query(
        `SELECT 
            id,
            nombre,
            descripcion,
            precio_descuento,
            precio_original,
            cantidad_disponible,
            categoria,
            imagen_url,
            activo,
            destacado,
            producto_listo,
            created_at,
            updated_at
        FROM products 
        WHERE store_id = $1 
        ORDER BY created_at DESC`, 
        [storeId]
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
    const userId = req.user.id;
    
    // Obtener store_id del usuario
    const storeResult = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1',
        [userId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'No tienes una tienda asociada' });
    }
    
    const storeId = storeResult.rows[0].id;
    
    // Aceptar campos en español (frontend)
    const { 
        nombre,
        descripcion,
        precio_original,
        precio_descuento,
        cantidad_disponible,
        categoria,
        imagen_url,
        activo
    } = req.body;

    // Verificar que el producto pertenece a la tienda del usuario
    const currentProduct = await pool.query(
        'SELECT * FROM products WHERE id = $1 AND store_id = $2', 
        [productId, storeId]
    );
    if (currentProduct.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado o no tienes permiso para editarlo.' });
    }
    const current = currentProduct.rows[0];

    // --- INICIO LÓGICA PARA BORRAR IMAGEN ANTIGUA ---
    if (req.file) {
        const oldImageUrl = current.imagen_url;
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
    const newImageUrl = req.file ? `/uploads/${req.file.filename}` : imagen_url;
    
    // Mapear campos (usar valores proporcionados o mantener actuales)
    const finalNombre = nombre || current.nombre;
    const finalDescripcion = descripcion !== undefined ? descripcion : current.descripcion;
    const finalPrecioOriginal = precio_original || current.precio_original;
    const finalPrecioDescuento = precio_descuento || current.precio_descuento;
    const finalCantidadDisponible = cantidad_disponible !== undefined ? cantidad_disponible : current.cantidad_disponible;
    const finalCategoria = categoria || current.categoria;
    const finalActivo = activo !== undefined ? activo : current.activo;

    // Actualizar producto con columnas en español
    const updatedProduct = await pool.query(
        `UPDATE products SET 
            nombre = $1, 
            descripcion = $2, 
            precio_original = $3, 
            precio_descuento = $4, 
            cantidad_disponible = $5, 
            categoria = $6,
            imagen_url = $7,
            activo = $8,
            updated_at = CURRENT_TIMESTAMP
         WHERE id = $9 
         RETURNING 
            id,
            nombre,
            descripcion,
            precio_descuento,
            precio_original,
            cantidad_disponible,
            categoria,
            imagen_url,
            activo,
            updated_at`,
        [
            finalNombre, 
            finalDescripcion, 
            finalPrecioOriginal, 
            finalPrecioDescuento, 
            finalCantidadDisponible, 
            finalCategoria,
            newImageUrl || current.imagen_url,
            finalActivo,
            productId
        ]
    );

    res.json(updatedProduct.rows[0]);
});

// @desc    Eliminar un producto
// @acceso  Privado (solo el comercio dueño del producto)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const userId = req.user.id;
    
    // Obtener store_id del usuario
    const storeResult = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1',
        [userId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'No tienes una tienda asociada' });
    }
    
    const storeId = storeResult.rows[0].id;

    // Verificar propiedad y obtener imagen para eliminar
    const productResult = await pool.query(
        'SELECT imagen_url FROM products WHERE id = $1 AND store_id = $2', 
        [productId, storeId]
    );
    
    if (productResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado o no tienes permiso para eliminarlo.' });
    }

    // Eliminar imagen si existe
    const imageUrl = productResult.rows[0].imagen_url;
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
            p.nombre,
            p.descripcion,
            p.precio_descuento,
            p.precio_original,
            p.cantidad_disponible,
            p.categoria,
            p.imagen_url,
            p.activo,
            p.destacado,
            p.store_id,
            p.created_at,
            -- Información de la tienda
            s.nombre_comercio,
            s.direccion,
            s.telefono,
            s.latitud,
            s.longitud
        FROM products p
        LEFT JOIN stores s ON p.store_id = s.id
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
    const userId = req.user.id;
    
    // Obtener store_id del usuario
    const storeResult = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1',
        [userId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'No tienes una tienda asociada' });
    }
    
    const storeId = storeResult.rows[0].id;

    const stats = await pool.query(
        `SELECT 
            p.id, 
            p.nombre, 
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
         LEFT JOIN favorites f ON p.id = f.product_id
         WHERE (o.user_id = $1 OR f.user_id = $1) AND p.categoria IS NOT NULL
         LIMIT 10`,
        [userId]
    );

    const categories = userCategories.rows.map(row => row.categoria);

    if (categories.length === 0) {
        // Si no hay categorías, devolver productos aleatorios
        const randomProducts = await pool.query(
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
                s.nombre_comercio,
                s.direccion,
                s.latitud,
                s.longitud
             FROM products p
             LEFT JOIN stores s ON p.store_id = s.id
             WHERE p.cantidad_disponible > 0 AND p.activo = true
             ORDER BY RANDOM()
             LIMIT 20`
        );
        return res.json(randomProducts.rows);
    }

    // Obtener productos de las categorías favoritas del usuario
    const recommendedProducts = await pool.query(
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
            s.nombre_comercio,
            s.direccion,
            s.latitud,
            s.longitud
         FROM products p
         LEFT JOIN stores s ON p.store_id = s.id
         WHERE p.categoria = ANY($1) AND p.cantidad_disponible > 0 AND p.activo = true
         ORDER BY p.created_at DESC
         LIMIT 20`,
        [categories]
    );

    res.json(recommendedProducts.rows);
});

// @desc    Obtener productos destacados (destacado = true)
// @acceso  Público
exports.getReadyProducts = asyncHandler(async (req, res, next) => {
    const readyProducts = await pool.query(
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
            p.destacado,
            p.producto_listo,
            s.nombre_comercio,
            s.direccion,
            s.latitud,
            s.longitud
         FROM products p
         LEFT JOIN stores s ON p.store_id = s.id
         WHERE (p.destacado = true OR p.producto_listo = true) AND p.cantidad_disponible > 0 AND p.activo = true
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
            p.nombre,
            p.descripcion,
            p.precio_descuento,
            p.precio_original,
            p.cantidad_disponible,
            p.categoria,
            p.imagen_url,
            p.activo,
            p.created_at,
            s.nombre_comercio,
            s.direccion,
            s.latitud,
            s.longitud,
            s.created_at as store_created_at
         FROM products p
         LEFT JOIN stores s ON p.store_id = s.id
         WHERE p.cantidad_disponible > 0 AND p.activo = true
         AND (p.created_at >= CURRENT_DATE OR s.created_at >= CURRENT_DATE - INTERVAL '7 days')
         ORDER BY p.created_at DESC
         LIMIT 20`
    );

    res.json(newProducts.rows);
});