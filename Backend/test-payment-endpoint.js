const pool = require('./db');
const jwt = require('jsonwebtoken');

async function testPaymentEndpoint() {
    try {
        console.log('🔍 PROBANDO ENDPOINT DE PAGO COMPLETO\n');
        console.log('='.repeat(80));
        
        // 1. Obtener un usuario cliente
        console.log('\n1️⃣  Obteniendo usuario cliente...');
        const userResult = await pool.query(`
            SELECT id, email, nombre, rol
            FROM users
            WHERE rol IN ('cliente', 'comprador', 'buyer')
            LIMIT 1
        `);
        
        if (userResult.rows.length === 0) {
            console.error('❌ No se encontró ningún usuario cliente');
            process.exit(1);
        }
        
        const user = userResult.rows[0];
        console.log(`✅ Usuario encontrado: ${user.nombre || user.email} (${user.email})`);
        
        // 2. Crear token JWT
        console.log('\n2️⃣  Generando token JWT...');
        const payload = {
            user: {
                id: user.id,
                rol: user.rol || 'cliente'
            }
        };
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(`✅ Token generado: ${token.substring(0, 30)}...`);
        
        // 3. Obtener un producto activo
        console.log('\n3️⃣  Obteniendo producto activo...');
        const productResult = await pool.query(`
            SELECT p.id, p.nombre, p.precio_descuento, p.store_id, s.nombre_comercio
            FROM products p
            LEFT JOIN stores s ON p.store_id = s.id
            WHERE p.activo = true AND p.cantidad_disponible > 0
            LIMIT 1
        `);
        
        if (productResult.rows.length === 0) {
            console.error('❌ No se encontró ning\u00fan producto activo');
            process.exit(1);
        }
        
        const product = productResult.rows[0];
        console.log(`✅ Producto encontrado: ${product.nombre}`);
        console.log(`   Precio: $${product.precio_descuento}`);
        console.log(`   Tienda: ${product.nombre_comercio || 'Sin tienda'}`);
        console.log(`   Store ID: ${product.store_id}`);
        
        // 4. Hacer la petición al endpoint
        console.log('\n4️⃣  Haciendo petici\u00f3n al endpoint de crear preferencia...');
        // Usar Render ya que el backend está desplegado allí
        const backendUrl = 'https://delicrunch.onrender.com';
        console.log(`   URL: ${backendUrl}/api/payments/create-preference`);
        
        const response = await fetch(`${backendUrl}/api/payments/create-preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                productId: product.id,
                cantidad: 1,
                coupon_discount: 0,
            }),
        });
        
        console.log(`   Response Status: ${response.status} ${response.statusText}`);
        
        const textResponse = await response.text();
        console.log(`   Response Length: ${textResponse.length} bytes`);
        
        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (parseError) {
            console.error('\n❌ ERROR: La respuesta no es JSON válido');
            console.error('   Primeros 200 caracteres:', textResponse.substring(0, 200));
            throw new Error('Respuesta inválida del servidor');
        }
        
        console.log('\n5️⃣  Respuesta del servidor:');
        console.log('   Status:', response.status);
        console.log('   Status Text:', response.statusText);
        
        if (response.ok) {
            console.log('\n✅ ¡PREFERENCIA CREADA EXITOSAMENTE!');
            console.log('='.repeat(80));
            console.log(`   Preference ID: ${data.preferenceId}`);
            console.log(`   Monto: $${data.amount}`);
            console.log(`   Init Point: ${data.initPoint}`);
            console.log(`   Comisi\u00f3n Plataforma: $${data.platformFee}`);
            console.log(`   Monto Comercio: $${data.merchantAmount}`);
            console.log('='.repeat(80));
            console.log('\n✅ PRUEBA COMPLETADA CON \u00c9XITO\n');
        } else {
            console.log('\n❌ ERROR AL CREAR PREFERENCIA');
            console.log('='.repeat(80));
            console.log('Respuesta:', JSON.stringify(data, null, 2));
            console.log('='.repeat(80));
        }
        
        process.exit(response.ok ? 0 : 1);
        
    } catch (error) {
        console.error('\n❌ ERROR EN LA PRUEBA:');
        console.error('   Mensaje:', error.message);
        if (error.stack) {
            console.error('\n   Stack:', error.stack);
        }
        process.exit(1);
    }
}

testPaymentEndpoint();
