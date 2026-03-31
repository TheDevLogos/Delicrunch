#!/usr/bin/env node

/**
 * Script completo para poblar la base de datos de producción (Supabase)
 * con datos de prueba: usuarios, comercios, productos, órdenes y reseñas
 * 
 * Uso: node seed-complete-system.js
 */

const pool = require('./db/index');
const bcrypt = require('bcryptjs');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m'
};

const log = {
    header: (msg) => console.log(`\n${colors.bright}${colors.blue}${'='.repeat(70)}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    section: (msg) => console.log(`\n${colors.bright}${colors.yellow}${msg}${colors.reset}`)
};

async function seedCompleteSystem() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        log.header();
        log.section('🚀 INICIANDO SEED COMPLETO DEL SISTEMA');
        log.header();

        // 1. VERIFICAR USUARIOS
        log.section('1️⃣  VERIFICANDO USUARIOS');
        const usersResult = await client.query('SELECT id, email, nombre, rol FROM users ORDER BY rol, id');
        
        let adminId, comercioIds = [], compradorId;
        
        usersResult.rows.forEach(user => {
            log.info(`Usuario: ${user.nombre} (${user.email}) - Rol: ${user.rol}`);
            if (user.rol === 'admin') adminId = user.id;
            else if (user.rol === 'comercio') comercioIds.push(user.id);
            else if (user.rol === 'comprador') compradorId = user.id;
        });
        
        if (!compradorId) {
            log.error('No hay compradores en la BD. Creando uno...');
            const hash = await bcrypt.hash('Test1234!', 10);
            const newBuyer = await client.query(
                `INSERT INTO users (email, nombre, password_hash, rol, is_verified)
                 VALUES ($1, $2, $3, $4, true)
                 RETURNING id`,
                ['testbuyer2@delicrunch.com', 'Test Buyer', hash, 'comprador']
            );
            compradorId = newBuyer.rows[0].id;
            log.success('Comprador creado');
        }
        
        if (comercioIds.length === 0) {
            log.error('No hay comercios en la BD');
            throw new Error('Se requiere al menos un comercio para el seed');
        }
        
        log.success(`Usuarios verificados: ${usersResult.rows.length}`);

        // 2. VERIFICAR/CREAR TIENDAS
        log.section('2️⃣  VERIFICANDO TIENDAS');
        const storesResult = await client.query(`
            SELECT s.id, s.nombre_comercio, s.user_id, u.nombre as owner_name
            FROM stores s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.id
        `);
        
        let storeIds = [];
        storesResult.rows.forEach(store => {
            log.info(`Tienda: ${store.nombre_comercio} (Owner: ${store.owner_name})`);
            storeIds.push(store.id);
        });
        
        if (storeIds.length === 0) {
            log.error('No hay tiendas. Creando tienda de prueba...');
            const newStore = await client.query(
                `INSERT INTO stores (user_id, nombre_comercio, direccion, ciudad, estado, telefono, horario_apertura, horario_cierre)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING id`,
                [comercioIds[0], 'Tienda Demo', 'Av. Principal 123', 'Chihuahua', 'Chihuahua', '6141234567', '09:00', '21:00']
            );
            storeIds.push(newStore.rows[0].id);
            log.success('Tienda creada');
        }
        
        log.success(`Tiendas verificadas: ${storeIds.length}`);

        // 3. VERIFICAR/CREAR PRODUCTOS
        log.section('3️⃣  VERIFICANDO PRODUCTOS');
        const productsResult = await client.query(`
            SELECT p.id, p.nombre, p.precio, s.nombre_comercio
            FROM products p
            JOIN stores s ON p.store_id = s.id
            WHERE p.disponible = true
            ORDER BY p.id
            LIMIT 10
        `);
        
        let productIds = [];
        productsResult.rows.forEach(product => {
            log.info(`Producto: ${product.nombre} - $${product.precio} (${product.nombre_comercio})`);
            productIds.push(product.id);
        });
        
        if (productIds.length === 0) {
            log.error('No hay productos. Creando productos de prueba...');
            
            for (let i = 0; i < Math.min(3, storeIds.length); i++) {
                const products = [
                    { nombre: 'Tacos al Pastor', precio: 50, descripcion: 'Deliciosos tacos con carne al pastor' },
                    { nombre: 'Burrito de Carne', precio: 75, descripcion: 'Burrito grande con carne y frijoles' },
                    { nombre: 'Quesadilla', precio: 45, descripcion: 'Quesadilla de queso con tortilla de maíz' }
                ];
                
                for (const prod of products) {
                    const newProd = await client.query(
                        `INSERT INTO products (store_id, nombre, descripcion, precio, disponible, categoria)
                         VALUES ($1, $2, $3, $4, true, $5)
                         RETURNING id`,
                        [storeIds[i], prod.nombre, prod.descripcion, prod.precio, 'Comida']
                    );
                    productIds.push(newProd.rows[0].id);
                }
            }
            log.success(`${productIds.length} productos creados`);
        }
        
        log.success(`Productos disponibles: ${productIds.length}`);

        // 4. CREAR ÓRDENES
        log.section('4️⃣  CREANDO ÓRDENES DE PRUEBA');
        
        const ordersCheck = await client.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [compradorId]);
        const existingOrders = parseInt(ordersCheck.rows[0].count);
        
        let orderIds = [];
        
        if (existingOrders === 0) {
            log.info(`Creando 5 órdenes para el comprador...`);
            
            for (let i = 0; i < 5; i++) {
                // Seleccionar producto aleatorio
                const productId = productIds[i % productIds.length];
                const productData = await client.query(
                    'SELECT precio, store_id FROM products WHERE id = $1',
                    [productId]
                );
                
                const precio = productData.rows[0].precio;
                const storeId = productData.rows[0].store_id;
                const total = precio * (i + 1); // Cantidad variable
                
                // Crear orden
                const newOrder = await client.query(
                    `INSERT INTO orders (user_id, store_id, total, estado, metodo_pago, created_at)
                     VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${i} days')
                     RETURNING id`,
                    [compradorId, storeId, total, 'completado', 'efectivo']
                );
                
                const orderId = newOrder.rows[0].id;
                orderIds.push(orderId);
                
                // Crear order_items
                await client.query(
                    `INSERT INTO order_items (order_id, product_id, cantidad, precio_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [orderId, productId, i + 1, precio, total]
                );
                
                log.success(`Orden ${orderId} creada - Producto ${productId} - Total: $${total}`);
            }
        } else {
            log.info(`Ya existen ${existingOrders} órdenes`);
            const existingOrdersResult = await client.query(
                'SELECT id FROM orders WHERE user_id = $1 AND estado IN ($2, $3, $4) LIMIT 5',
                [compradorId, 'completado', 'entregado', 'listo']
            );
            orderIds = existingOrdersResult.rows.map(o => o.id);
        }
        
        log.success(`${orderIds.length} órdenes disponibles para reseñas`);

        // 5. CREAR RESEÑAS
        log.section('5️⃣  CREANDO RESEÑAS DE PRUEBA');
        
        const reviewsCheck = await client.query('SELECT COUNT(*) FROM reviews WHERE user_id = $1', [compradorId]);
        const existingReviews = parseInt(reviewsCheck.rows[0].count);
        
        if (existingReviews === 0) {
            log.info('Creando reseñas para las órdenes...');
            
            const comentarios = [
                '¡Excelente! Muy recomendado, volveré pronto.',
                'Buena calidad y buen precio. Satisfecho con mi compra.',
                'El producto está bien pero esperaba un poco más.',
                'Increíble sabor, definitivamente el mejor lugar.',
                'Muy buena atención y producto de calidad.'
            ];
            
            for (let i = 0; i < Math.min(orderIds.length, 5); i++) {
                const orderId = orderIds[i];
                
                // Obtener product_id de la orden
                const orderItem = await client.query(
                    'SELECT product_id FROM order_items WHERE order_id = $1 LIMIT 1',
                    [orderId]
                );
                
                if (orderItem.rows.length === 0) continue;
                
                const productId = orderItem.rows[0].product_id;
                const calificacion = 5 - (i % 3); // Variedad de calificaciones
                
                await client.query(
                    `INSERT INTO reviews (
                        order_id, user_id, product_id,
                        calificacion, comentario, is_verified,
                        calidad_comida, valor_precio, experiencia_recogida,
                        visible, moderada,
                        created_at
                    ) VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, true, false, NOW() - INTERVAL '${i} hours')`,
                    [
                        orderId, compradorId, productId,
                        calificacion, comentarios[i],
                        calificacion, calificacion, calificacion
                    ]
                );
                
                log.success(`Reseña creada: ${calificacion} estrellas - "${comentarios[i].substring(0, 40)}..."`);
            }
        } else {
            log.info(`Ya existen ${existingReviews} reseñas`);
        }

        await client.query('COMMIT');
        
        // RESUMEN FINAL
        log.header();
        log.section('✅ SEED COMPLETADO EXITOSAMENTE');
        log.header();
        
        const finalStats = {
            users: await client.query('SELECT COUNT(*) FROM users'),
            stores: await client.query('SELECT COUNT(*) FROM stores'),
            products: await client.query('SELECT COUNT(*) FROM products WHERE disponible = true'),
            orders: await client.query('SELECT COUNT(*) FROM orders'),
            reviews: await client.query('SELECT COUNT(*) FROM reviews')
        };
        
        console.log('\n📊 ESTADÍSTICAS FINALES:');
        log.info(`   Usuarios: ${finalStats.users.rows[0].count}`);
        log.info(`   Tiendas: ${finalStats.stores.rows[0].count}`);
        log.info(`   Productos disponibles: ${finalStats.products.rows[0].count}`);
        log.info(`   Órdenes: ${finalStats.orders.rows[0].count}`);
        log.info(`   Reseñas: ${finalStats.reviews.rows[0].count}`);
        
        console.log('\n🔑 CREDENCIALES DE PRUEBA:');
        log.info('   Admin: admin@delicrunch.com / Admin123!');
        log.info('   Comercio: comercio@delicrunch.com / Comercio123!');
        log.info('   Comprador: testbuyer2@delicrunch.com / Test1234!');
        
        log.header();
        
    } catch (error) {
        await client.query('ROLLBACK');
        log.error(`Error en seed: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar
seedCompleteSystem()
    .then(() => {
        console.log('\n✨ Sistema listo para usar\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });
