const pool = require('../db');

const checkProductOwnership = async (req, res, next) => {
    // 1. Verificar si el usuario es un comercio o admin
    if (req.user.rol !== 'comercio' && req.user.rol !== 'admin') {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios.' });
    }

    const productId = req.params.id;
    const userId = req.user.id;

    try {
        // 2. Obtener el producto y verificar si pertenece a alguna tienda del usuario
        const query = `
            SELECT p.id, p.store_id
            FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE p.id = $1 AND s.user_id = $2
        `;
        const result = await pool.query(query, [productId, userId]);

        // Si es admin, permitir acceso a cualquier producto
        if (req.user.rol === 'admin') {
            const productExists = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
            if (productExists.rows.length === 0) {
                return res.status(404).json({ msg: 'Producto no encontrado.' });
            }
            return next();
        }

        if (result.rows.length === 0) {
            // Verificar si el producto existe
            const productExists = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
            if (productExists.rows.length === 0) {
                return res.status(404).json({ msg: 'Producto no encontrado.' });
            }
            return res.status(403).json({ msg: 'No tiene permiso para modificar este recurso.' });
        }

        // 3. Si la verificación es exitosa, continuar
        req.storeId = result.rows[0].store_id;
        next();
    } catch (error) {
        console.error('checkProductOwnership error:', error.message);
        res.status(500).send('Error en el servidor');
    }
};

module.exports = checkProductOwnership;