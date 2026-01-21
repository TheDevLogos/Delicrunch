const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./db/index.js'); // CORRECCIÓN: Usar la ruta correcta y consistente
const errorHandler = require('./middleware/errorHandler');
const ensureJson = require('./middleware/ensureJson');

const app = express();
const PORT = process.env.PORT || 5001

// Función para probar la conexión a la DB
const checkDbConnection = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('Conexión con la base de datos establecida exitosamente.');
    } catch (error) {
        console.error('Error al conectar con la base de datos:', error);
    }
};

// Middlewares
app.use(cors());
app.use(express.json());
app.use(ensureJson); // Asegurar que todas las respuestas sean JSON

// Servir archivos estáticos desde la carpeta 'uploads'
// Esto permite que el frontend acceda a las imágenes subidas a través de una URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas de la API
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Delicrunch API está funcionando',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Ruta de health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Usamos las rutas de autenticación
app.use('/api/auth', require('./routes/authRoutes'));
// Usamos las rutas de perfiles
app.use('/api/profiles', require('./routes/profileRoutes'));
// Usamos las rutas de productos
app.use('/api/products', require('./routes/productRoutes'));
// Usamos las rutas de pedidos
app.use('/api/orders', require('./routes/orderRoutes'));
// Usamos las rutas de reseñas
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Usamos las rutas de tiendas
app.use('/api/stores', require('./routes/storeRoutes'));
// Usamos las rutas de pagos
app.use('/api/payments', require('./routes/paymentRoutes'));
// Usamos las rutas de administración
app.use('/api/admin', require('./routes/adminRoutes'));
// Usamos las rutas de cupones y recompensas
app.use('/api/coupons', require('./routes/couponRoutes'));

// Middleware para manejar rutas no encontradas (404)
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.path}`,
        error: 'Not Found'
    });
});

// Middleware de manejo de errores (debe ir después de las rutas)
app.use(errorHandler);
// Iniciar el servidor en todas las interfaces (0.0.0.0) para permitir acceso desde el túnel de Expo
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor escuchando en el puerto ${PORT} en todas las interfaces`);
    checkDbConnection();
});