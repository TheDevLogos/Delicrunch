// Script corregido para poblar Supabase con datos de Chihuahua
// NOTA: Usa columnas en ESPAÑOL como las requiere Supabase
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const ciudadesChihuahua = [
  { nombre: 'Delicias', lat: 28.1906, lng: -105.4711 },
  { nombre: 'Meoqui', lat: 28.2667, lng: -105.4833 },
  { nombre: 'Saucillo', lat: 28.0333, lng: -105.2833 }
];

const comercios = [
  { nombre: 'Tacos El Norteño', categoria: 'Tacos' },
  { nombre: 'Pizzería La Italiana', categoria: 'Pizza' },
  { nombre: 'Hamburguesas Premium', categoria: 'Hamburguesas' },
  { nombre: 'Sushi Express', categoria: 'Sushi' },
  { nombre: 'Café Gourmet', categoria: 'Café' },
  { nombre: 'Postres Delicias', categoria: 'Postres' }
];

const productosTemplate = {
  'Tacos': [
    { nombre: 'Tacos de Asada', descripcion: 'Deliciosos tacos de carne asada con cebolla y cilantro', precio_original: 60, precio_descuento: 45, categoria: 'carnes', imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400' },
    { nombre: 'Tacos de Pastor', descripcion: 'Tacos al pastor con piña y especias', precio_original: 60, precio_descuento: 45, categoria: 'carnes', imagen: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400' },
    { nombre: 'Orden de Tacos (5 piezas)', descripcion: 'Orden completa de tacos variados', precio_original: 250, precio_descuento: 200, categoria: 'carnes', imagen: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400' }
  ],
  'Pizza': [
    { nombre: 'Pizza Hawaiana', descripcion: 'Pizza con jamón, piña y queso mozzarella', precio_original: 220, precio_descuento: 180, categoria: 'comida_preparada', imagen: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
    { nombre: 'Pizza Pepperoni', descripcion: 'Pizza clásica de pepperoni con queso', precio_original: 200, precio_descuento: 160, categoria: 'comida_preparada', imagen: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
    { nombre: 'Pizza Mexicana', descripcion: 'Pizza con jalapeño, carne molida y especias', precio_original: 230, precio_descuento: 190, categoria: 'comida_preparada', imagen: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' }
  ],
  'Hamburguesas': [
    { nombre: 'Hamburguesa Clásica', descripcion: 'Carne de res, lechuga, tomate y queso', precio_original: 110, precio_descuento: 85, categoria: 'carnes', imagen: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    { nombre: 'Hamburguesa Doble', descripcion: 'Doble carne con queso americano', precio_original: 150, precio_descuento: 120, categoria: 'carnes', imagen: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
    { nombre: 'Hamburguesa BBQ', descripcion: 'Con salsa BBQ, cebolla caramelizada y tocino', precio_original: 160, precio_descuento: 130, categoria: 'carnes', imagen: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400' }
  ],
  'Sushi': [
    { nombre: 'Rollo California', descripcion: 'Surimi, aguacate y pepino', precio_original: 140, precio_descuento: 110, categoria: 'pescado', imagen: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400' },
    { nombre: 'Rollo Philadelphia', descripcion: 'Salmón, queso crema y pepino', precio_original: 170, precio_descuento: 140, categoria: 'pescado', imagen: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400' },
    { nombre: 'Combo Sushi (20 piezas)', descripcion: 'Variedad de rollos premium', precio_original: 430, precio_descuento: 350, categoria: 'pescado', imagen: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400' }
  ],
  'Café': [
    { nombre: 'Cappuccino', descripcion: 'Espresso con leche vaporizada y espuma', precio_original: 70, precio_descuento: 55, categoria: 'bebidas', imagen: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400' },
    { nombre: 'Latte Vainilla', descripcion: 'Café con leche y jarabe de vainilla', precio_original: 75, precio_descuento: 60, categoria: 'bebidas', imagen: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
    { nombre: 'Frappé Chocolate', descripcion: 'Bebida fría de café con chocolate', precio_original: 85, precio_descuento: 70, categoria: 'bebidas', imagen: 'https://images.unsplash.com/photo-1530373239216-42518e6b4063?w=400' }
  ],
  'Postres': [
    { nombre: 'Pastel de Chocolate', descripcion: 'Rebanada de pastel de chocolate con betún', precio_original: 80, precio_descuento: 65, categoria: 'postres', imagen: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400' },
    { nombre: 'Cheesecake Fresa', descripcion: 'Cheesecake con cobertura de fresas', precio_original: 90, precio_descuento: 75, categoria: 'postres', imagen: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400' },
    { nombre: 'Brownie con Helado', descripcion: 'Brownie caliente con helado de vainilla', precio_original: 95, precio_descuento: 80, categoria: 'postres', imagen: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400' }
  ]
};

async function seedSupabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔌 Conectando a Supabase PostgreSQL...');
    console.log(`   Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[1] || 'Unknown'}`);
    console.log('');
    
    // Limpiar datos de prueba existentes
    console.log('🧹 Limpiando datos de prueba...');
    
    // Eliminar en orden para respetar foreign keys
    await client.query("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com' OR email LIKE '%@delicrunch.com'))");
    await client.query("DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@test.com' OR email LIKE '%@delicrunch.com')");
    await client.query("DELETE FROM reviews WHERE store_id IN (SELECT id FROM stores WHERE email LIKE '%@test.com' OR email LIKE '%@delicrunch.com')");
    await client.query("DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE email LIKE '%@test.com' OR email LIKE '%@delicrunch.com')");
    await client.query("DELETE FROM stores WHERE email LIKE '%@test.com' OR email LIKE '%@delicrunch.com'");
    await client.query("DELETE FROM users WHERE email LIKE '%@test.com' OR email LIKE '%@delicrunch.com'");
    
    console.log('   ✅ Datos de prueba eliminados\n');
    
    // Crear Admin
    console.log('👑 Creando usuario Admin...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const adminResult = await client.query(`
      INSERT INTO users (nombre, email, password_hash, rol, created_at, updated_at)
      VALUES ($1, $2, $3, 'admin', NOW(), NOW())
      RETURNING id
    `, ['Admin Delicrunch', 'admin@delicrunch.com', adminPassword]);
    console.log(`   ✅ admin@delicrunch.com / Admin123! (ID: ${adminResult.rows[0].id})\n`);
    
    // Crear comercios y sus tiendas
    console.log('🏪 Creando comercios y productos...');
    let totalProducts = 0;
    let storeCount = 0;
    
    for (const comercio of comercios) {
      const ciudad = ciudadesChihuahua[Math.floor(Math.random() * ciudadesChihuahua.length)];
      const emailSlug = comercio.nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      const email = `${emailSlug}@test.com`;
      const password = await bcrypt.hash('Comercio123!', 10);
      const telefono = `614${Math.floor(Math.random() * 9000000) + 1000000}`;
      
      const lat = ciudad.lat + (Math.random() * 0.02 - 0.01);
      const lng = ciudad.lng + (Math.random() * 0.02 - 0.01);
      const direccion = `Calle ${Math.floor(Math.random() * 100) + 1}, ${ciudad.nombre}`;
      
      // Crear usuario comercio
      const userResult = await client.query(`
        INSERT INTO users (nombre, email, password_hash, rol, created_at, updated_at)
        VALUES ($1, $2, $3, 'comercio', NOW(), NOW())
        RETURNING id
      `, [comercio.nombre, email, password]);
      
      const userId = userResult.rows[0].id;
      
      // Crear store asociada
      const storeResult = await client.query(`
        INSERT INTO stores (
          user_id, nombre_comercio, email, telefono, direccion, 
          ciudad, latitud, longitud, activo, verificado,
          hora_recogida_inicio, hora_recogida_fin,
          fecha_creacion, fecha_actualizacion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, '14:00', '18:00', NOW(), NOW())
        RETURNING id
      `, [
        userId, comercio.nombre, email, telefono, direccion,
        ciudad.nombre, lat, lng
      ]);
      
      const storeId = storeResult.rows[0].id;
      storeCount++;
      
      console.log(`   ✅ ${comercio.nombre} (${ciudad.nombre})`);
      console.log(`      User: ${email} / Comercio123!`);
      console.log(`      Store ID: ${storeId}`);
      
      // Crear productos para esta tienda
      const productos = productosTemplate[comercio.categoria];
      for (const prod of productos) {
        await client.query(`
          INSERT INTO products (
            store_id, nombre, descripcion, precio_original, precio_descuento,
            categoria, cantidad_disponible, imagen_url, activo,
            hora_recogida_inicio, hora_recogida_fin,
            fecha_creacion, fecha_actualizacion
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, '14:00', '18:00', NOW(), NOW())
        `, [
          storeId, prod.nombre, prod.descripcion, 
          prod.precio_original, prod.precio_descuento,
          prod.categoria,
          Math.floor(Math.random() * 10) + 3, // 3-12 unidades disponibles
          prod.imagen
        ]);
        totalProducts++;
      }
    }
    
    console.log(`   📦 ${totalProducts} productos creados para ${storeCount} comercios\n`);
    
    // Crear compradores
    console.log('👥 Creando compradores de prueba...');
    const compradores = [
      { nombre: 'Test Buyer', email: 'testbuyer@test.com', ciudad: 'Delicias' },
      { nombre: 'Test Buyer 2', email: 'testbuyer2@delicrunch.com', ciudad: 'Meoqui' },
      { nombre: 'Comprador Saucillo', email: 'comprador@test.com', ciudad: 'Saucillo' }
    ];
    
    for (const comprador of compradores) {
      const password = await bcrypt.hash('Test1234!', 10);
      const ciudad = ciudadesChihuahua.find(c => c.nombre === comprador.ciudad);
      
      await client.query(`
        INSERT INTO users (nombre, email, password_hash, rol, created_at, updated_at)
        VALUES ($1, $2, $3, 'comprador', NOW(), NOW())
      `, [comprador.nombre, comprador.email, password]);
      
      console.log(`   ✅ ${comprador.email} / Test1234! (${comprador.ciudad})`);
    }
    
    // Resumen
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM users WHERE rol = 'comercio') as comercios,
        (SELECT COUNT(*) FROM users WHERE rol = 'comprador') as compradores,
        (SELECT COUNT(*) FROM stores) as stores,
        (SELECT COUNT(*) FROM products) as products
    `);
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ BASE DE DATOS SUPABASE LISTA');
    console.log('═'.repeat(70));
    console.log(`   👥 Usuarios: ${counts.rows[0].users}`);
    console.log(`   👑 Admin: 1`);
    console.log(`   🏪 Comercios: ${counts.rows[0].comercios}`);
    console.log(`   🛒 Compradores: ${counts.rows[0].compradores}`);
    console.log(`   🏬 Stores: ${counts.rows[0].stores}`);
    console.log(`   📦 Productos: ${counts.rows[0].products}`);
    console.log('═'.repeat(70));
    console.log('\n📋 CREDENCIALES DE ACCESO:\n');
    console.log('👑 ADMIN:');
    console.log('   admin@delicrunch.com / Admin123!\n');
    console.log('🏪 COMERCIOS (todos con password: Comercio123!):');
    comercios.forEach(c => {
      const slug = c.nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      console.log(`   ${slug}@test.com`);
    });
    console.log('\n🛒 COMPRADORES (todos con password: Test1234!):');
    console.log('   testbuyer@test.com');
    console.log('   testbuyer2@delicrunch.com');
    console.log('   comprador@test.com');
    console.log('');
    console.log('✅ Seed completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedSupabase().catch(console.error);
