const pool = require('../db');
const asyncHandler = require('./asyncHandler');

/**
 * Middleware para verificar si el usuario es un 'comercio' y obtener el ID de su tienda.
 * Asume que el middleware 'authMiddleware' ya se ha ejecutado.
 * Adjunta el `storeId` al objeto `req`.
 * 
 * Casos especiales:
 * - Admin simulando comercio: usa la primera tienda disponible (demo)
 */
const getStoreId = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const userRole = (req.user.rol || req.user.role || '').toLowerCase();

    // 1. Verificar permisos (aceptar español e inglés)
    if (!['seller', 'comercio', 'admin', 'administrador'].includes(userRole)) {
        return res.status(403).json({ msg: 'Acción no autorizada. Solo para comercios.' });
    }

    // 2. Buscar la tienda asociada al ID del usuario
    let storeResult = await pool.query(`
        SELECT s.id, 
               (SELECT COUNT(*) FROM products WHERE seller_id = s.user_id) as productos,
               (SELECT COUNT(*) FROM orders WHERE seller_id = s.user_id) as pedidos
        FROM stores s 
        WHERE s.user_id = $1 
        ORDER BY pedidos DESC, productos DESC, s.id DESC
        LIMIT 1
    `, [userId]);

    console.log(`🔍 getStoreId - userId: ${userId}, role: ${userRole}, stores found: ${storeResult.rows.length}`);

    // 3. Si es admin y no tiene tienda (está simulando), usar tienda demo
    if (['admin', 'administrador'].includes(userRole) && storeResult.rows.length === 0) {
        // Usar la primera tienda disponible como tienda demo para el admin
        storeResult = await pool.query('SELECT id FROM stores ORDER BY id LIMIT 1');
        
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ msg: 'No hay tiendas disponibles en el sistema.' });
        }
        
        console.log(`🔑 Admin simulando comercio - Usando tienda demo ID: ${storeResult.rows[0].id}`);
    } else if (storeResult.rows.length === 0) {
        return res.status(404).json({ msg: 'No se encontró una tienda asociada a este usuario.' });
    }

    // 4. Adjuntar el ID de la tienda a la solicitud para que los controladores puedan usarlo
    const assignedStoreId = storeResult.rows[0].id;
    console.log(`✅ getStoreId - Assigned storeId: ${assignedStoreId} to userId: ${userId}`);
    req.storeId = assignedStoreId;
    next();
});

module.exports = getStoreId;