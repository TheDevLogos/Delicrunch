const pool = require('./db');

async function testMercadoPagoConfig() {
    try {
        console.log('🔍 Verificando configuración de MercadoPago...\n');
        
        // 1. Verificar token
        const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
        console.log('Token presente:', token ? '✅ SI' : '❌ NO');
        if (token) {
            console.log('Token (primeros 20 chars):', token.substring(0, 20) + '...');
            console.log('Longitud:', token.length);
        }
        
        // 2. Probar conexión a MercadoPago
        console.log('\n🔄 Probando conexión con API de MercadoPago...');
        const { MercadoPagoConfig, Preference } = require('mercadopago');
        
        const client = new MercadoPagoConfig({ 
            accessToken: token,
            options: { timeout: 5000 }
        });
        
        console.log('✅ Cliente de MercadoPago inicializado');
        
        // 3. Verificar productos en BD
        console.log('\n🔍 Verificando productos en base de datos...');
        const productsResult = await pool.query(`
            SELECT p.id, p.name, p.price, p.seller_id, u.email as seller_email
            FROM products p
            LEFT JOIN users u ON p.seller_id = u.id
            WHERE p.is_active = true
            LIMIT 3
        `);
        
        console.log(`Productos activos encontrados: ${productsResult.rows.length}`);
        if (productsResult.rows.length > 0) {
            console.log('\nEjemplos:');
            productsResult.rows.forEach(p => {
                console.log(`  - ID: ${p.id}, Nombre: ${p.name}, Precio: $${p.price}`);
            });
        }
        
        // 4. Verificar usuarios
        console.log('\n🔍 Verificando usuarios...');
        const usersResult = await pool.query(`
            SELECT id, email, name, role
            FROM users
            LIMIT 3
        `);
        
        console.log(`Usuarios encontrados: ${usersResult.rows.length}`);
        if (usersResult.rows.length > 0) {
            console.log('\nEjemplos:');
            usersResult.rows.forEach(u => {
                console.log(`  - ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
            });
        }
        
        console.log('\n✅ Verificación completa');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testMercadoPagoConfig();
