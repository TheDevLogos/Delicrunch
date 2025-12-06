const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const fs = require('fs');
const path = require('path');


// @desc    Crear un nuevo producto (Pack Sorpresa)
// @acceso  Privado (solo para rol 'comercio')
exports.createProduct = asyncHandler(async (req, res, next) => {
    // 2. Extraer los datos del producto del cuerpo de la solicitud
    const {
        nombre,
        descripcion,
        precio_original,
        precio_descuento,
        cantidad_inicial,
        hora_recogida_inicio,
        hora_recogida_fin
    } = req.body;

    // Validación básica
    if (!nombre || !precio_original || !precio_descuento || !cantidad_inicial || !hora_recogida_inicio || !hora_recogida_fin) {
        return res.status(400).json({ msg: 'Por favor, complete todos los campos obligatorios.' });
    }
    
    // La URL de la imagen viene de multer (si se subió un archivo)
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
    
    // El middleware getStoreId nos proporciona req.storeId
    const storeId = req.storeId;


    // Insertar el nuevo producto en la base de datos
    const newProduct = await pool.query(
        `INSERT INTO products (store_id, nombre, descripcion, precio_original, precio_descuento, cantidad_inicial, cantidad_disponible, hora_recogida_inicio, hora_recogida_fin, imagen_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *`,
        [storeId, nombre, descripcion, precio_original, precio_descuento, cantidad_inicial, cantidad_inicial, hora_recogida_inicio, hora_recogida_fin, imagen_url]
    );

    res.status(201).json(newProduct.rows[0]);
});

// @desc    Obtener todos los productos de la tienda del comercio logueado
// @acceso  Privado (solo para rol 'comercio')
exports.getStoreProducts = asyncHandler(async (req, res, next) => {
    // El middleware getStoreId nos proporciona req.storeId
    const storeId = req.storeId;

    const products = await pool.query('SELECT * FROM products WHERE store_id = $1 ORDER BY fecha_creacion DESC', [storeId]);
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
            ORDER BY p.fecha_creacion DESC`
    );
    res.json(products.rows);
});


// @desc    Actualizar un producto existente
// @acceso  Privado (solo el comercio dueño del producto)
exports.updateProduct = asyncHandler(async (req, res, next) => {
    const productId = req.params.id;
    const { nombre, descripcion, precio_original, precio_descuento, cantidad_disponible, hora_recogida_inicio, hora_recogida_fin, imagen_url } = req.body;

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
    // La URL para guardar en la DB será la ruta de acceso público.
    const newImageUrl = req.file ? `/uploads/${req.file.filename}` : imagen_url;
    // La verificación de propiedad ahora la hace el middleware `checkProductOwnership`
    // Procedemos directamente a actualizar
    const updatedProduct = await pool.query(
        `UPDATE products SET nombre = $1, descripcion = $2, precio_original = $3, precio_descuento = $4, cantidad_disponible = $5, hora_recogida_inicio = $6, hora_recogida_fin = $7, imagen_url = $8
            WHERE id = $9 RETURNING *`,
        [nombre, descripcion, precio_original, precio_descuento, cantidad_disponible, hora_recogida_inicio, hora_recogida_fin, newImageUrl, productId]
    );

    if (updatedProduct.rows.length === 0) {
        return res.status(404).json({ msg: 'Producto no encontrado.' });
    }

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
            p.cantidad_inicial, 
            p.cantidad_disponible,
            p.precio_descuento,
            COUNT(o.id) AS total_pedidos
         FROM products p
         LEFT JOIN orders o ON p.id = o.product_id
         WHERE p.store_id = $1
         GROUP BY p.id
         ORDER BY total_pedidos DESC`,
        [storeId]
    );

    res.json(stats.rows);
});