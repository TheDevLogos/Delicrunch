/**
 * seed-taqueria-delicias.js
 * 
 * Script para crear "Taquería las Delicias" con 3 productos
 * Elimina productos y tiendas existentes primero
 * Adaptado al schema real de la BD (mezcla de estilos)
 */
const pool = require('./index');
const bcrypt = require('bcryptjs');

// ==========================================
// DATOS DE LA TAQUERÍA LAS DELICIAS
// ==========================================
const TAQUERIA_DATA = {
  // Datos del usuario (tabla users con campos en inglés)
  usuario: {
    name: 'Taquería las Delicias',
    email: 'taqueria.lasdelicias@delicrunch.com',
    password: 'password123',
    role: 'seller', // role en inglés según BD real
    phone: '+52 614 555 1234',
    street: 'Av. Independencia #1234',
    city: 'Chihuahua',
    state: 'Chihuahua',
    country: 'México',
    zip_code: '31000',
    latitude: 28.6353,
    longitude: -106.0889,
    is_active: true,
    is_verified: true,
  },

  // Datos de la tienda (tabla stores con campos en español)
  tienda: {
    nombre_comercio: 'Taquería las Delicias',
    direccion: 'Av. Independencia #1234, Col. Centro, Chihuahua, Chih.',
    latitud: 28.6353,
    longitud: -106.0889,
    telefono: '+52 614 555 1234',
    horario: 'Lun-Dom 10:00-22:00',
    descripcion: 'La mejor taquería de Chihuahua. Desde 1985 ofreciendo los tacos, burritos y tortas más deliciosos de la región. Ingredientes frescos, recetas tradicionales y el sazón que nos distingue.',
    logo_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    cover_url: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=800',
    categoria: 'comida-mexicana',
    activo: true,
    calificacion_promedio: 4.8,
    total_reviews: 6,
  },

  // Productos (tabla products con campos en inglés: name, price, stock, etc)
  productos: [
    {
      name: 'Burrito Las Delicias',
      description: 'Nuestro burrito estrella: tortilla de harina rellena de jugosa carne asada, frijoles refritos, arroz mexicano, queso fundido, pico de gallo, guacamole y crema. Un clásico que te transporta al corazón de México. ¡Cada mordida es una fiesta de sabores!',
      compare_price: 129.00, // precio original
      price: 79.00,          // precio con descuento
      stock: 1,
      category: 'burritos',
      image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800',
      is_active: true,
      is_featured: true,
      co2_factor: 4.2,
      xp_reward: 50,
    },
    {
      name: 'Promo Tacos al Pastor',
      description: '¡3 tacos al pastor por un precio increíble! Carne de cerdo marinada con achiote y especias, cocinada lentamente en trompo, servida con piña fresca, cilantro, cebolla y nuestra salsa verde casera. El sabor auténtico de la taquería mexicana.',
      compare_price: 99.00,
      price: 59.00,
      stock: 1,
      category: 'tacos',
      image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
      is_active: true,
      is_featured: true,
      co2_factor: 3.8,
      xp_reward: 40,
    },
    {
      name: 'Torta Campechana',
      description: 'La legendaria Torta Campechana: telera crujiente rellena de milanesa de res Y jamón, con aguacate, jitomate, cebolla, jalapeños, frijoles refritos, queso Oaxaca derretido, lechuga y mayonesa. ¡Una bomba de sabor que no te puedes perder!',
      compare_price: 109.00,
      price: 69.00,
      stock: 1,
      category: 'tortas',
      image_url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
      is_active: true,
      is_featured: true,
      co2_factor: 3.6,
      xp_reward: 45,
    },
  ],
};

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================
async function seedTaqueriaDelicias() {
  const client = await pool.connect();
  
  try {
    console.log('🌮 INICIANDO SEED DE TAQUERÍA LAS DELICIAS');
    console.log('==========================================\n');

    await client.query('BEGIN');

    // 1. Eliminar registros existentes
    console.log('🗑️  Paso 1: Eliminando registros existentes...');
    
    // Eliminar en orden por dependencias
    try { await client.query('DELETE FROM order_items'); console.log('   ✓ order_items eliminados'); } catch (e) { }
    try { await client.query('DELETE FROM orders'); console.log('   ✓ orders eliminados'); } catch (e) { }
    try { await client.query('DELETE FROM reviews'); console.log('   ✓ reviews eliminados'); } catch (e) { }
    try { await client.query('DELETE FROM products'); console.log('   ✓ products eliminados'); } catch (e) { }
    try { await client.query('DELETE FROM stores'); console.log('   ✓ stores eliminados'); } catch (e) { }
    try { 
      await client.query(`DELETE FROM users WHERE role = 'seller'`); 
      console.log('   ✓ sellers eliminados\n'); 
    } catch (e) { 
      console.log('   ⚠ No se pudieron eliminar sellers\n'); 
    }

    // 2. Crear el usuario vendedor
    console.log('👤 Paso 2: Creando usuario vendedor...');
    
    const hashedPassword = await bcrypt.hash(TAQUERIA_DATA.usuario.password, 10);
    const u = TAQUERIA_DATA.usuario;
    
    const userResult = await client.query(`
      INSERT INTO users (
        name, email, password, role, phone,
        street, city, state, country, zip_code,
        latitude, longitude, is_active, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        is_verified = EXCLUDED.is_verified,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email
    `, [
      u.name, u.email, hashedPassword, u.role, u.phone,
      u.street, u.city, u.state, u.country, u.zip_code,
      u.latitude, u.longitude, u.is_active, u.is_verified
    ]);
    
    const userId = userResult.rows[0].id;
    console.log(`   ✓ Usuario vendedor creado con ID: ${userId}`);
    console.log(`   📧 Email: ${u.email}\n`);

    // 3. Crear la tienda
    console.log('🏪 Paso 3: Creando tienda...');
    
    const t = TAQUERIA_DATA.tienda;
    
    const storeResult = await client.query(`
      INSERT INTO stores (
        user_id, nombre_comercio, direccion, latitud, longitud,
        telefono, horario, descripcion, logo_url, cover_url,
        categoria, activo, calificacion_promedio, total_reviews
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, nombre_comercio
    `, [
      userId, t.nombre_comercio, t.direccion, t.latitud, t.longitud,
      t.telefono, t.horario, t.descripcion, t.logo_url, t.cover_url,
      t.categoria, t.activo, t.calificacion_promedio, t.total_reviews
    ]);
    
    const storeId = storeResult.rows[0].id;
    console.log(`   ✓ Tienda creada con ID: ${storeId}`);
    console.log(`   📍 ${t.direccion}\n`);

    // 4. Crear productos
    console.log('🍽️  Paso 4: Creando productos...');
    
    const productIds = [];
    for (const p of TAQUERIA_DATA.productos) {
      const productResult = await client.query(`
        INSERT INTO products (
          name, description, price, compare_price,
          seller_id, category, stock, image_url,
          latitude, longitude, is_active, is_featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, name
      `, [
        p.name, p.description, p.price, p.compare_price,
        userId, p.category, p.stock, p.image_url,
        u.latitude, u.longitude, p.is_active, p.is_featured
      ]);
      
      productIds.push(productResult.rows[0].id);
      const descuento = Math.round(((p.compare_price - p.price) / p.compare_price) * 100);
      console.log(`   ✓ ${p.name}`);
      console.log(`     💰 $${p.price} MXN (${descuento}% OFF - antes $${p.compare_price})`);
      console.log(`     🌿 CO2: ${p.co2_factor}kg | ⭐ XP: +${p.xp_reward}`);
    }
    console.log('');

    // 5. Crear comprador de prueba
    console.log('👤 Paso 5: Creando comprador de prueba...');
    
    const buyerHash = await bcrypt.hash('password123', 10);
    const buyerResult = await client.query(`
      INSERT INTO users (name, email, password, role, is_active, is_verified)
      VALUES ('Comprador Demo', 'comprador@delicrunch.com', $1, 'buyer', true, true)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        is_active = true,
        is_verified = true
      RETURNING id
    `, [buyerHash]);
    
    const buyerId = buyerResult.rows[0].id;
    console.log('   ✓ comprador@delicrunch.com / password123\n');

    // 6. Crear admin
    console.log('🔐 Paso 6: Verificando admin...');
    
    const adminHash = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (name, email, password, role, is_active, is_verified)
      VALUES ('Admin Delicrunch', 'admin@delicrunch.com', $1, 'admin', true, true)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        is_active = true,
        is_verified = true
    `, [adminHash]);
    console.log('   ✓ admin@delicrunch.com / password123\n');

    // 7. Crear reviews (usando estructura real de BD)
    console.log('⭐ Paso 7: Creando reseñas...');
    
    try {
      const reviews = [
        { calificacion: 5, comentario: '¡El mejor burrito de Chihuahua! Super generoso y delicioso.' },
        { calificacion: 5, comentario: 'Increíble calidad-precio con Delicrunch. Todo estaba recién hecho.' },
        { calificacion: 5, comentario: 'Los tacos al pastor más auténticos. La piña le da el toque perfecto.' },
        { calificacion: 4, comentario: 'Muy buenos tacos, llegaron calientitos. Repetiré seguro.' },
        { calificacion: 5, comentario: '¡Enorme y deliciosa! La Torta Campechana es brutal.' },
        { calificacion: 5, comentario: 'Salvé comida y comí como rey. Esta app es increíble.' },
      ];
      
      for (const r of reviews) {
        await client.query(`
          INSERT INTO reviews (store_id, user_id, calificacion, comentario)
          VALUES ($1, $2, $3, $4)
        `, [storeId, buyerId, r.calificacion, r.comentario]);
      }
      console.log('   ✓ 6 reseñas creadas\n');
    } catch (e) {
      console.log('   ⚠ No se pudieron crear reviews (tabla puede no existir)\n');
    }

    await client.query('COMMIT');
    
    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('==========================================');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('==========================================\n');
    
    console.log('📋 CREDENCIALES DE ACCESO:');
    console.log('─────────────────────────────────────────');
    console.log('');
    console.log('🌮 COMERCIO (Taquería las Delicias):');
    console.log(`   📧 Email: ${u.email}`);
    console.log(`   🔐 Password: ${TAQUERIA_DATA.usuario.password}`);
    console.log('');
    console.log('🛒 COMPRADOR:');
    console.log('   📧 Email: comprador@delicrunch.com');
    console.log('   🔐 Password: password123');
    console.log('');
    console.log('🔐 ADMIN:');
    console.log('   📧 Email: admin@delicrunch.com');
    console.log('   🔐 Password: password123');
    console.log('');
    console.log('─────────────────────────────────────────');
    console.log('');
    console.log('🍽️  PRODUCTOS DISPONIBLES:');
    console.log('─────────────────────────────────────────');
    for (const p of TAQUERIA_DATA.productos) {
      const descuento = Math.round(((p.compare_price - p.price) / p.compare_price) * 100);
      console.log(`• ${p.name}`);
      console.log(`  $${p.price} MXN (antes $${p.compare_price} - ${descuento}% OFF)`);
      console.log(`  Stock: ${p.stock} | CO2: ${p.co2_factor}kg | XP: +${p.xp_reward}`);
      console.log('');
    }
    console.log('─────────────────────────────────────────\n');

    return { userId, storeId, productIds };

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar
if (require.main === module) {
  seedTaqueriaDelicias()
    .then(() => {
      console.log('🌮 ¡Taquería las Delicias lista para probar!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}

module.exports = { seedTaqueriaDelicias };
