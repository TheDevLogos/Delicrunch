const pool = require('../db');

const checkProductOwnership = async (req, res, next) => {
    // 1. Verificar si el usuario es un comercio
    if (req.user.rol !== 'comercio') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios.' });
    }

    const productId = req.params.id;
    const userId = req.user.id;

    try {
        // 2. Obtener la tienda del usuario y el producto en una sola consulta para eficiencia
        const query = `
            SELECT 
                p.store_id AS product_store_id,
                s.id AS user_store_id
            FROM products p
            LEFT JOIN stores s ON s.user_id = $1
            WHERE p.id = $2;
        `;
        const result = await pool.query(query, [userId, productId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Producto no encontrado.' });
        }

        const { product_store_id, user_store_id } = result.rows[0];

        // 3. Comparar si la tienda del producto es la misma que la del usuario
        if (product_store_id !== user_store_id) {
            return res.status(403).json({ msg: 'No tiene permiso para modificar este recurso.' });
        }

        // 4. Si la verificación es exitosa, continuar
        next();
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};

module.exports = checkProductOwnership;