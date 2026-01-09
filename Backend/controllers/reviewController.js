const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Recalcula y actualiza la calificación promedio de un producto.
 * @param {number} productId - El ID del producto.
 * @param {object} client - El cliente de la base de datos para la transacción.
 */
const updateProductAverageRating = async (productId, client) => {
    const dbClient = client || pool;
    // Calculamos promedio desde reviews que tienen ese product_id
    const avgResult = await dbClient.query(
         `SELECT AVG(calificacion) as average, COUNT(*) as total
         FROM reviews 
         WHERE product_id = $1 AND visible = TRUE`,
        [productId]
    );
    const average = parseFloat(avgResult.rows[0].average) || 0;
    const total = parseInt(avgResult.rows[0].total) || 0;
    await dbClient.query(
        'UPDATE products SET calificacion_promedio = $1, total_reviews = $2 WHERE id = $3',
        [average.toFixed(2), total, productId]
    );
    return { average, total };
};

/**
 * Recalcula y actualiza la calificación promedio de una tienda.
 * @param {number} storeId - El ID de la tienda.
 * @param {object} client - El cliente de la base de datos para la transacción.
 */
const updateStoreAverageRating = async (storeId, client) => {
    const dbClient = client || pool;
    const avgResult = await dbClient.query(
        `SELECT AVG(calificacion) as average, COUNT(*) as total 
         FROM reviews 
         WHERE store_id = $1 AND visible = TRUE`,
        [storeId]
    );
    const average = parseFloat(avgResult.rows[0].average) || 0;
    const total = parseInt(avgResult.rows[0].total) || 0;
    await dbClient.query(
        'UPDATE stores SET calificacion_promedio = $1, total_reviews = $2 WHERE id = $3',
        [average.toFixed(2), total, storeId]
    );
    return { average, total };
};

// @desc    Crear una nueva reseña
// @acceso  Privado (Comprador)
exports.createReview = asyncHandler(async (req, res, next) => {
    // Aceptamos múltiples nombres de campos para flexibilidad
    const { 
        orderId, order_id, pedido_id,
        productId, producto_id, product_id,
        puntuacion, calificacion, rating,
        comentario 
    } = req.body;
    
    const finalOrderId = orderId || order_id || pedido_id;
    const finalProductId = productId || producto_id || product_id;
    const finalRating = puntuacion || calificacion || rating;
    
    const userId = req.user.id;

    if (!finalRating || finalRating < 1 || finalRating > 5) {
        return res.status(400).json({ msg: 'La calificación debe ser entre 1 y 5.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let storeId, productIdToUse, productName;

        // Si viene un orderId, validamos que el pedido pertenezca al usuario
        if (finalOrderId) {
            const orderResult = await client.query(
                `SELECT o.user_id, o.store_id, oi.product_id, p.nombre as product_name
                 FROM orders o
                 LEFT JOIN order_items oi ON o.id = oi.order_id
                 LEFT JOIN products p ON oi.product_id = p.id
                 WHERE o.id = $1`,
                [finalOrderId]
            );
            
            if (orderResult.rows.length === 0) {
                throw new Error('El pedido no existe.');
            }
            
            if (orderResult.rows[0].user_id !== userId) {
                throw new Error('No tiene permiso para reseñar este pedido.');
            }

            // Verificar que no exista ya una reseña para este pedido
            const reviewExists = await client.query(
                'SELECT id FROM reviews WHERE order_id = $1 AND user_id = $2',
                [finalOrderId, userId]
            );
            if (reviewExists.rows.length > 0) {
                throw new Error('Ya ha enviado una reseña para este pedido.');
            }

            storeId = orderResult.rows[0].store_id;
            productIdToUse = orderResult.rows[0].product_id || finalProductId;
            productName = orderResult.rows[0].product_name;
        } 
        // Si viene productId sin orderId, verificamos que el usuario haya comprado ese producto
        else if (finalProductId) {
            const purchaseCheck = await client.query(
                `SELECT o.id as order_id, o.store_id, p.nombre as product_name
                 FROM orders o
                 JOIN order_items oi ON o.id = oi.order_id
                 JOIN products p ON oi.product_id = p.id
                 WHERE o.user_id = $1 AND oi.product_id = $2 AND o.estado IN ('listo', 'recogido', 'Entregado', 'pagado', 'confirmado')
                 ORDER BY o.created_at DESC
                 LIMIT 1`,
                [userId, finalProductId]
            );
            
            if (purchaseCheck.rows.length === 0) {
                throw new Error('Debe comprar este producto antes de poder reseñarlo.');
            }

            // Verificar que no exista ya una reseña para este producto por este usuario
            const reviewExists = await client.query(
                'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
                [finalProductId]
            );
            if (reviewExists.rows.length > 0) {
                throw new Error('Ya ha enviado una reseña para este producto.');
            }

            storeId = purchaseCheck.rows[0].store_id;
            productIdToUse = finalProductId;
            productName = purchaseCheck.rows[0].product_name;
        } else {
            throw new Error('Debe proporcionar un ID de pedido o producto.');
        }

        // Crear la reseña
        const newReview = await client.query(
            `INSERT INTO reviews (
                order_id, user_id, store_id, product_id, 
                calificacion, comentario, nombre_producto, visible
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) 
            RETURNING *`,
            [finalOrderId, userId, storeId, productIdToUse, finalRating, comentario || '', productName]
        );

        // Recalcular promedios
        if (productIdToUse) {
            await updateProductAverageRating(productIdToUse, client);
        }
        await updateStoreAverageRating(storeId, client);

        await client.query('COMMIT');
        
        res.status(201).json({
            ...newReview.rows[0],
            msg: '¡Gracias por tu reseña!'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating review:', error.message);
        return res.status(400).json({ msg: error.message });
    } finally {
        client.release();
    }
});

// @desc    Obtener todas las reseñas de un producto
// @acceso  Público
exports.getProductReviews = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    
    const reviews = await pool.query(
        `SELECT r.*, u.nombre as nombre_usuario,
                p.avatar_icon_id as user_avatar
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         LEFT JOIN profiles p ON r.user_id = p.user_id
         WHERE r.product_id = $1 AND r.visible = TRUE
         ORDER BY r.created_at DESC`,
        [productId]
    );
    res.json(reviews.rows);
});

// @desc    Obtener todas las reseñas de una tienda
// @acceso  Público
exports.getStoreReviews = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;
    
    const reviews = await pool.query(
        `SELECT r.*, u.nombre as nombre_usuario,
                p.avatar_icon_id as user_avatar,
                pr.nombre as nombre_producto
         FROM reviews r 
         JOIN users u ON r.user_id = u.id 
         LEFT JOIN profiles p ON r.user_id = p.user_id
         LEFT JOIN products pr ON r.product_id = pr.id
         WHERE r.store_id = $1 AND r.visible = TRUE
         ORDER BY r.created_at DESC`,
        [storeId]
    );
    res.json(reviews.rows);
});

// @desc    Obtener todas las reseñas del usuario autenticado
// @acceso  Privado
exports.getUserReviews = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const reviews = await pool.query(
        `SELECT r.*, s.nombre_comercio, s.logo_url as store_logo,
                p.nombre as nombre_producto, p.imagen_url as product_image
         FROM reviews r
         JOIN stores s ON r.store_id = s.id
         LEFT JOIN products p ON r.product_id = p.id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
    );
    res.json(reviews.rows);
});

// @desc    Obtener reseñas de los productos de MI tienda (para comercios)
// @acceso  Privado (Comercio)
exports.getMyStoreReviews = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    
    // Primero obtener la tienda del usuario
    const storeResult = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1',
        [userId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'No tiene una tienda registrada.' });
    }
    
    const storeId = storeResult.rows[0].id;
    
    const reviews = await pool.query(
        `SELECT r.*, u.nombre as nombre_usuario, u.email as user_email,
                p.nombre as nombre_producto, p.imagen_url as product_image,
                o.codigo_recogida
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         LEFT JOIN products p ON r.product_id = p.id
         LEFT JOIN orders o ON r.order_id = o.id
         WHERE r.store_id = $1
         ORDER BY r.created_at DESC`,
        [storeId]
    );
    res.json(reviews.rows);
});

// @desc    Obtener TODAS las reseñas (Admin)
// @acceso  Privado (Admin)
exports.getAllReviews = asyncHandler(async (req, res, next) => {
    // Verificar que el usuario es admin
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acceso denegado. Solo administradores.' });
    }
    
    const { storeId, productId, visible, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
        SELECT r.*, 
               u.nombre as nombre_usuario, u.email as user_email,
               s.nombre_comercio, s.logo_url as store_logo,
               p.nombre as nombre_producto, p.imagen_url as product_image,
               admin.nombre as admin_respondio
         FROM reviews r
         JOIN users u ON r.user_id = u.id
         JOIN stores s ON r.store_id = s.id
         LEFT JOIN products p ON r.product_id = p.id
         LEFT JOIN users admin ON r.respondido_por_admin_id = admin.id
         WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (storeId) {
        query += ` AND r.store_id = $${paramIndex}`;
        params.push(storeId);
        paramIndex++;
    }
    
    if (productId) {
        query += ` AND r.product_id = $${paramIndex}`;
        params.push(productId);
        paramIndex++;
    }
    
    if (visible !== undefined) {
        query += ` AND r.visible = $${paramIndex}`;
        params.push(visible === 'true');
        paramIndex++;
    }
    
    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const reviews = await pool.query(query, params);
    
    // Obtener conteo total
    let countQuery = `SELECT COUNT(*) FROM reviews r WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;
    
    if (storeId) {
        countQuery += ` AND r.store_id = $${countIndex}`;
        countParams.push(storeId);
        countIndex++;
    }
    if (productId) {
        countQuery += ` AND r.product_id = $${countIndex}`;
        countParams.push(productId);
        countIndex++;
    }
    if (visible !== undefined) {
        countQuery += ` AND r.visible = $${countIndex}`;
        countParams.push(visible === 'true');
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
        reviews: reviews.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
});

// @desc    Responder a una reseña (Admin)
// @acceso  Privado (Admin)
exports.respondToReview = asyncHandler(async (req, res, next) => {
    // Verificar que el usuario es admin
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acceso denegado. Solo administradores.' });
    }
    
    const { reviewId } = req.params;
    const { respuesta } = req.body;
    const adminId = req.user.id;
    
    if (!respuesta || respuesta.trim() === '') {
        return res.status(400).json({ msg: 'La respuesta no puede estar vacía.' });
    }
    
    const result = await pool.query(
        `UPDATE reviews 
         SET respuesta_admin = $1, 
             fecha_respuesta = CURRENT_TIMESTAMP,
             respondido_por_admin_id = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [respuesta.trim(), adminId, reviewId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ msg: 'Reseña no encontrada.' });
    }
    
    res.json({
        ...result.rows[0],
        msg: 'Respuesta agregada correctamente.'
    });
});

// @desc    Responder a una reseña de mi tienda (Comercio)
// @acceso  Privado (Comercio)
exports.storeRespondToReview = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { respuesta } = req.body;
    
    if (!respuesta || respuesta.trim() === '') {
        return res.status(400).json({ msg: 'La respuesta no puede estar vacía.' });
    }
    
    // Verificar que la reseña pertenece a una tienda del usuario
    const storeResult = await pool.query(
        'SELECT id FROM stores WHERE user_id = $1',
        [userId]
    );
    
    if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'No tiene una tienda registrada.' });
    }
    
    const storeId = storeResult.rows[0].id;
    
    // Verificar que la reseña pertenece a esta tienda
    const reviewCheck = await pool.query(
        'SELECT * FROM reviews WHERE id = $1 AND store_id = $2',
        [reviewId, storeId]
    );
    
    if (reviewCheck.rows.length === 0) {
        return res.status(403).json({ msg: 'No tiene permiso para responder esta reseña.' });
    }
    
    const result = await pool.query(
        `UPDATE reviews 
         SET respuesta_admin = $1, 
             fecha_respuesta = CURRENT_TIMESTAMP,
             respondido_por_admin_id = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [respuesta.trim(), userId, reviewId]
    );
    
    res.json({
        ...result.rows[0],
        msg: 'Respuesta enviada correctamente.'
    });
});

// @desc    Ocultar/Mostrar una reseña (Admin)
// @acceso  Privado (Admin)
exports.toggleReviewVisibility = asyncHandler(async (req, res, next) => {
    // Verificar que el usuario es admin
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acceso denegado. Solo administradores.' });
    }
    
    const { reviewId } = req.params;
    const { visible } = req.body;
    
    const result = await pool.query(
        `UPDATE reviews 
         SET visible = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [visible, reviewId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ msg: 'Reseña no encontrada.' });
    }
    
    // Recalcular promedios después de cambiar visibilidad
    const review = result.rows[0];
    if (review.product_id) {
        await updateProductAverageRating(review.product_id);
    }
    await updateStoreAverageRating(review.store_id);
    
    res.json({
        ...result.rows[0],
        msg: visible ? 'Reseña visible.' : 'Reseña ocultada.'
    });
});

// @desc    Eliminar una reseña (Admin o dueño)
// @acceso  Privado (Admin o propietario de la reseña)
exports.deleteReview = asyncHandler(async (req, res, next) => {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userRol = req.user.rol;
    
    // Obtener la reseña primero
    const reviewResult = await pool.query(
        'SELECT * FROM reviews WHERE id = $1',
        [reviewId]
    );
    
    if (reviewResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Reseña no encontrada.' });
    }
    
    const review = reviewResult.rows[0];
    
    // Verificar permisos: admin puede eliminar cualquiera, usuario solo las suyas
    if (userRol !== 'admin' && review.user_id !== userId) {
        return res.status(403).json({ msg: 'No tiene permiso para eliminar esta reseña.' });
    }
    
    // Eliminar la reseña
    await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    
    // Recalcular promedios
    if (review.product_id) {
        await updateProductAverageRating(review.product_id);
    }
    await updateStoreAverageRating(review.store_id);
    
    res.json({ msg: 'Reseña eliminada correctamente.' });
});

// @desc    Obtener estadísticas de reseñas para una tienda
// @acceso  Público
exports.getStoreReviewStats = asyncHandler(async (req, res, next) => {
    const { storeId } = req.params;
    
    const stats = await pool.query(
        `SELECT 
            COUNT(*) as total_reviews,
            AVG(calificacion) as promedio,
            COUNT(CASE WHEN calificacion = 5 THEN 1 END) as cinco_estrellas,
            COUNT(CASE WHEN calificacion = 4 THEN 1 END) as cuatro_estrellas,
            COUNT(CASE WHEN calificacion = 3 THEN 1 END) as tres_estrellas,
            COUNT(CASE WHEN calificacion = 2 THEN 1 END) as dos_estrellas,
            COUNT(CASE WHEN calificacion = 1 THEN 1 END) as una_estrella
         FROM reviews 
         WHERE store_id = $1 AND visible = TRUE`,
        [storeId]
    );
    
    const result = stats.rows[0];
    res.json({
        total: parseInt(result.total_reviews) || 0,
        promedio: parseFloat(result.promedio) || 0,
        distribucion: {
            5: parseInt(result.cinco_estrellas) || 0,
            4: parseInt(result.cuatro_estrellas) || 0,
            3: parseInt(result.tres_estrellas) || 0,
            2: parseInt(result.dos_estrellas) || 0,
            1: parseInt(result.una_estrella) || 0
        }
    });
});

// @desc    Editar una reseña (solo el propietario)
// @acceso  Privado
exports.updateReview = asyncHandler(async (req, res, next) => {
    const { reviewId } = req.params;
    const { calificacion, comentario } = req.body;
    const userId = req.user.id;
    
    // Verificar que la reseña pertenece al usuario
    const reviewResult = await pool.query(
        'SELECT * FROM reviews WHERE id = $1 AND user_id = $2',
        [reviewId, userId]
    );
    
    if (reviewResult.rows.length === 0) {
        return res.status(404).json({ msg: 'Reseña no encontrada o no tiene permiso.' });
    }
    
    const review = reviewResult.rows[0];
    
    // Actualizar la reseña
    const result = await pool.query(
        `UPDATE reviews 
         SET calificacion = COALESCE($1, calificacion),
             comentario = COALESCE($2, comentario),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [calificacion, comentario, reviewId]
    );
    
    // Recalcular promedios si cambió la calificación
    if (calificacion && calificacion !== review.calificacion) {
        if (review.product_id) {
            await updateProductAverageRating(review.product_id);
        }
        await updateStoreAverageRating(review.store_id);
    }
    
    res.json({
        ...result.rows[0],
        msg: 'Reseña actualizada correctamente.'
    });
});