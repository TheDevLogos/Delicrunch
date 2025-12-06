const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const checkProductOwnership = require('../middleware/checkProductOwnership');
const upload = require('../middleware/upload');
const getStoreId = require('../middleware/getStoreId');
// === RUTAS PÚBLICAS (No requieren token) ===

// @ruta    GET api/products
// @desc    Obtener todos los productos disponibles para la venta
// @acceso  Público
router.get('/', productController.getAllAvailableProducts);

// === RUTAS PRIVADAS (Requieren token y rol 'comercio') ===

// @ruta    POST api/products
// @desc    Crear un nuevo producto
// @acceso  Privado (Comercio)
router.post('/', [authMiddleware, getStoreId, upload.single('imagen')], productController.createProduct); // Aseguramos que la creación de producto pueda recibir una imagen

// @ruta    GET api/products/mystore
// @desc    Obtener todos los productos de la tienda del comercio logueado
// @acceso  Privado (Comercio)
router.get('/mystore', [authMiddleware, getStoreId], productController.getStoreProducts);

// @ruta    GET api/products/mystore/stats
// @desc    Obtener estadísticas de los productos de la tienda del comercio
// @acceso  Privado (Comercio)
router.get('/mystore/stats', [authMiddleware, getStoreId], productController.getProductStats);

// @ruta    GET api/products/:id
// @desc    Obtener un único producto por su ID
// @acceso  Público
// La colocamos aquí para que no entre en conflicto con '/mystore'
router.get('/:id', productController.getProductById);

// @ruta    PUT api/products/:id
// @desc    Actualizar un producto por su ID
// @acceso  Privado (Comercio)
router.put('/:id', [authMiddleware, checkProductOwnership, upload.single('imagen')], productController.updateProduct);

// @ruta    DELETE api/products/:id
// @desc    Eliminar un producto por su ID
// @acceso  Privado (Comercio)
router.delete('/:id', [authMiddleware, checkProductOwnership], productController.deleteProduct);


module.exports = router;