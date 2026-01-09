const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const getStoreId = require('../middleware/getStoreId');

// Todas las rutas en este archivo estarán protegidas, por lo que aplicamos el middleware al inicio.
router.use(authMiddleware);

// @ruta    POST api/orders
// @desc    Crear un nuevo pedido
// @acceso  Privado (Comprador)
router.post('/', orderController.createOrder);

// @ruta    GET api/orders/myorders
// @desc    Obtener el historial de pedidos del comprador
// @acceso  Privado (Comprador)
router.get('/myorders', orderController.getMyOrders);

// @ruta    GET api/orders/mystoreorders
// @desc    Obtener los pedidos recibidos por la tienda del comercio
// @acceso  Privado (Comercio)
router.get('/mystoreorders', getStoreId, orderController.getStoreOrders);

// @ruta    GET api/orders/store-metrics
// @desc    Obtener métricas financieras del comercio
// @acceso  Privado (Comercio)
router.get('/store-metrics', getStoreId, orderController.getStoreMetrics);

// @ruta    GET api/orders/store-analytics
// @desc    Obtener estadísticas detalladas del comercio
// @acceso  Privado (Comercio)
router.get('/store-analytics', getStoreId, orderController.getStoreAnalytics);

// @ruta    GET api/orders/:id
// @desc    Obtener un pedido específico por ID
// @acceso  Privado (propietario o admin)
router.get('/:id', orderController.getOrderById);

// @ruta    PATCH api/orders/:id
// @desc    Actualizar el estado de un pedido
// @acceso  Privado (Comercio o Admin)
router.patch('/:id', orderController.updateOrderStatus);

module.exports = router;