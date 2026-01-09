/**
 * Seed de datos para Delicias, Chihuahua
 * 5 tiendas y 15+ productos con datos completos
 */

const pool = require('./index');
const bcrypt = require('bcryptjs');

const seedDelicias = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌮 Iniciando seed de Delicias, Chihuahua...\n');

    // ========== USUARIOS COMERCIO ==========
    const passwordHash = await bcrypt.hash('Comercio123', 10);
    
    const comercios = [
      { nombre: 'Juan Pérez García', email: 'taqueria.lasdelicias@delicrunch.com' },
      { nombre: 'Roberto Hernández Luna', email: 'borrego.oro@delicrunch.com' },
      { nombre: 'María Fernanda Ríos', email: 'chilaquiles.carreta@delicrunch.com' },
      { nombre: 'Antonio Orsini Mendoza', email: 'pizza.orsinis@delicrunch.com' },
      { nombre: 'Kenji Tanaka Ruiz', email: 'dr.sushi@delicrunch.com' },
      { nombre: 'Carolina Placeres Vega', email: 'cafe.placeres@delicrunch.com' },
    ];

    const userIds = [];
    for (const c of comercios) {
      const result = await client.query(
        `INSERT INTO users (nombre, email, password_hash, rol)
         VALUES ($1, $2, $3, 'comercio')
         ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre
         RETURNING id`,
        [c.nombre, c.email, passwordHash]
      );
      userIds.push(result.rows[0].id);
      console.log(`✅ Usuario comercio: ${c.email}`);
    }

    // ========== TIENDAS ==========
    // Coordenadas reales de Delicias, Chihuahua (centro y alrededores)
    const tiendas = [
      {
        user_id: userIds[0],
        nombre_comercio: 'Taquería Las Delicias',
        direccion: 'Av. Agricultura Norte 512, Centro, 33000 Delicias, Chih.',
        latitud: 28.1910,
        longitud: -105.4708,
        telefono: '+52 639 472 1234',
        horario: 'Lun-Dom 8:00 AM - 11:00 PM',
        descripcion: 'La taquería más tradicional de Delicias desde 1985. Tacos de carne asada, tripitas, cabeza y nuestros famosos burritos norteños. Tortillas hechas a mano y salsas caseras.',
      },
      {
        user_id: userIds[1],
        nombre_comercio: 'El Borrego de Oro',
        direccion: 'Calle 6a Sur 402, Col. Centro, 33000 Delicias, Chih.',
        latitud: 28.1875,
        longitud: -105.4685,
        telefono: '+52 639 472 5678',
        horario: 'Vie-Dom 7:00 AM - 4:00 PM',
        descripcion: 'Especialistas en barbacoa de borrego estilo Chihuahua. Consomé, mixiotes, tacos de barbacoa y machaca. Solo fines de semana, ¡llega temprano porque se acaba!',
      },
      {
        user_id: userIds[2],
        nombre_comercio: 'Chilaquiles La Carreta',
        direccion: 'Blvd. Río Chuviscar 1205, Fraccionamiento del Valle, 33089 Delicias, Chih.',
        latitud: 28.1945,
        longitud: -105.4752,
        telefono: '+52 639 474 9012',
        horario: 'Lun-Sáb 7:00 AM - 2:00 PM',
        descripcion: 'Los mejores chilaquiles del norte de México. Rojos, verdes o divorciados, con pollo, huevo o arrachera. Desayunos completos y café de olla incluido.',
      },
      {
        user_id: userIds[3],
        nombre_comercio: 'Pizza Orsini\'s',
        direccion: 'Av. 4a Poniente 810, Col. Centro, 33000 Delicias, Chih.',
        latitud: 28.1898,
        longitud: -105.4721,
        telefono: '+52 639 472 3456',
        horario: 'Mar-Dom 1:00 PM - 10:00 PM',
        descripcion: 'Auténtica pizza italiana con recetas familiares desde 1992. Masa artesanal fermentada 48 horas, ingredientes importados y horno de leña. Pastas frescas y tiramisú casero.',
      },
      {
        user_id: userIds[4],
        nombre_comercio: 'Dr. Sushi',
        direccion: 'Blvd. Milenio 340, Plaza Las Américas, 33088 Delicias, Chih.',
        latitud: 28.1962,
        longitud: -105.4635,
        telefono: '+52 639 476 7890',
        horario: 'Lun-Dom 12:00 PM - 10:00 PM',
        descripcion: 'Fusión de sabores japoneses y mexicanos. Sushi rolls creativos, poke bowls, ramen artesanal y nuestros famosos tacos de atún sellado. Pescado fresco diario.',
      },
      {
        user_id: userIds[5],
        nombre_comercio: 'Café Placeres',
        direccion: 'Calle 3a Norte 215, Col. Centro, 33000 Delicias, Chih.',
        latitud: 28.1922,
        longitud: -105.4695,
        telefono: '+52 639 471 2345',
        horario: 'Lun-Sáb 7:00 AM - 9:00 PM, Dom 8:00 AM - 6:00 PM',
        descripcion: 'Cafetería boutique con granos de Chiapas tostados artesanalmente. Repostería francesa, brunch gourmet y ambiente acogedor. El lugar perfecto para trabajar o relajarse.',
      },
    ];

    const storeIds = [];
    for (const t of tiendas) {
      const result = await client.query(
        `INSERT INTO stores (user_id, nombre_comercio, direccion, latitud, longitud, telefono, horario, descripcion)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [t.user_id, t.nombre_comercio, t.direccion, t.latitud, t.longitud, t.telefono, t.horario, t.descripcion]
      );
      if (result.rows.length > 0) {
        storeIds.push(result.rows[0].id);
        console.log(`🏪 Tienda creada: ${t.nombre_comercio}`);
      } else {
        // Si ya existe, obtener el ID
        const existing = await client.query(
          `SELECT id FROM stores WHERE user_id = $1`,
          [t.user_id]
        );
        storeIds.push(existing.rows[0].id);
        console.log(`🏪 Tienda existente: ${t.nombre_comercio}`);
      }
    }

    // ========== PRODUCTOS ==========
    // Imágenes ficticias usando placeholders con temática de comida
    const productos = [
      // Taquería Las Delicias (storeIds[0])
      {
        store_id: storeIds[0],
        nombre: 'Pack Sorpresa Taquero',
        descripcion: '6 tacos surtidos de carne asada, al pastor y tripitas con guacamole, cebollitas y salsas. Tortillas de maíz recién hechas.',
        precio_original: 120.00,
        precio_descuento: 75.00,
        cantidad_disponible: 8,
        categoria: 'Tacos',
        imagen_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
      },
      {
        store_id: storeIds[0],
        nombre: 'Burrito Norteño XL',
        descripcion: 'Burrito gigante de carne asada con frijoles charros, queso asadero derretido, aguacate y pico de gallo. ¡Pesa medio kilo!',
        precio_original: 95.00,
        precio_descuento: 60.00,
        cantidad_disponible: 5,
        categoria: 'Burritos',
        imagen_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400',
      },
      {
        store_id: storeIds[0],
        nombre: 'Quesadilla Maestra',
        descripcion: 'Quesadilla de harina con queso Chihuahua, champiñones, rajas y arrachera. Servida con crema y salsa verde.',
        precio_original: 85.00,
        precio_descuento: 55.00,
        cantidad_disponible: 6,
        categoria: 'Quesadillas',
        imagen_url: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400',
      },

      // El Borrego de Oro (storeIds[1])
      {
        store_id: storeIds[1],
        nombre: 'Barbacoa Familiar',
        descripcion: 'Medio kilo de barbacoa de borrego con consomé, tortillas de maíz, cilantro, cebolla y limones. Salsa borracha incluida.',
        precio_original: 280.00,
        precio_descuento: 180.00,
        cantidad_disponible: 4,
        categoria: 'Barbacoa',
        imagen_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
      },
      {
        store_id: storeIds[1],
        nombre: 'Mixiotes de Borrego',
        descripcion: '3 mixiotes tradicionales cocinados al vapor con chile guajillo, especias y hoja de maguey. Sabor ancestral.',
        precio_original: 150.00,
        precio_descuento: 95.00,
        cantidad_disponible: 6,
        categoria: 'Barbacoa',
        imagen_url: 'https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=400',
      },

      // Chilaquiles La Carreta (storeIds[2])
      {
        store_id: storeIds[2],
        nombre: 'Chilaquiles Divorciados',
        descripcion: 'Mitad rojos, mitad verdes con pollo deshebrado, crema, queso fresco y dos huevos estrellados. Frijoles refritos de lado.',
        precio_original: 95.00,
        precio_descuento: 62.00,
        cantidad_disponible: 10,
        categoria: 'Desayunos',
        imagen_url: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=400',
      },
      {
        store_id: storeIds[2],
        nombre: 'Desayuno Ranchero',
        descripcion: 'Huevos rancheros con salsa roja, chilaquiles verdes, frijoles charros, nopales y jugo de naranja natural.',
        precio_original: 110.00,
        precio_descuento: 72.00,
        cantidad_disponible: 8,
        categoria: 'Desayunos',
        imagen_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
      },
      {
        store_id: storeIds[2],
        nombre: 'Molletes Gratinados',
        descripcion: '2 bolillos abiertos con frijoles, queso gratinado, pico de gallo y tu elección de jamón, tocino o chorizo.',
        precio_original: 75.00,
        precio_descuento: 48.00,
        cantidad_disponible: 12,
        categoria: 'Desayunos',
        imagen_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400',
      },

      // Pizza Orsini's (storeIds[3])
      {
        store_id: storeIds[3],
        nombre: 'Pizza Margherita Auténtica',
        descripcion: 'Pizza clásica italiana con salsa San Marzano, mozzarella di bufala, albahaca fresca y aceite de oliva extra virgen. Masa 48h.',
        precio_original: 180.00,
        precio_descuento: 115.00,
        cantidad_disponible: 5,
        categoria: 'Pizzas',
        imagen_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      },
      {
        store_id: storeIds[3],
        nombre: 'Pizza Quattro Formaggi',
        descripcion: 'Cuatro quesos italianos: mozzarella, gorgonzola, parmesano y fontina. Nueces caramelizadas y miel de trufa.',
        precio_original: 220.00,
        precio_descuento: 145.00,
        cantidad_disponible: 4,
        categoria: 'Pizzas',
        imagen_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      },
      {
        store_id: storeIds[3],
        nombre: 'Tiramisú Casero',
        descripcion: 'Auténtico tiramisú italiano con mascarpone, café espresso, savoiardi y cacao amargo. Porción generosa.',
        precio_original: 85.00,
        precio_descuento: 55.00,
        cantidad_disponible: 8,
        categoria: 'Postres',
        imagen_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
      },

      // Dr. Sushi (storeIds[4])
      {
        store_id: storeIds[4],
        nombre: 'Combo Dragon Roll',
        descripcion: '8 piezas de Dragon Roll con camarón tempura, aguacate, anguila y salsa unagi. Incluye edamames y sopa miso.',
        precio_original: 195.00,
        precio_descuento: 125.00,
        cantidad_disponible: 6,
        categoria: 'Sushi',
        imagen_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
      },
      {
        store_id: storeIds[4],
        nombre: 'Poke Bowl Hawaiano',
        descripcion: 'Arroz de sushi, atún fresco marinado, mango, aguacate, edamame, alga wakame y salsa ponzu. Bowl abundante.',
        precio_original: 165.00,
        precio_descuento: 105.00,
        cantidad_disponible: 7,
        categoria: 'Bowls',
        imagen_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      },
      {
        store_id: storeIds[4],
        nombre: 'Ramen Tonkotsu',
        descripcion: 'Caldo de cerdo cocido 12 horas, fideos frescos, chashu, huevo marinado, nori y cebollín. Intenso y reconfortante.',
        precio_original: 145.00,
        precio_descuento: 95.00,
        cantidad_disponible: 5,
        categoria: 'Ramen',
        imagen_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
      },

      // Café Placeres (storeIds[5])
      {
        store_id: storeIds[5],
        nombre: 'Brunch Box Premium',
        descripcion: 'Croissant recién horneado, huevos benedictinos, fruta de temporada, yogurt griego y café de especialidad.',
        precio_original: 185.00,
        precio_descuento: 120.00,
        cantidad_disponible: 6,
        categoria: 'Brunch',
        imagen_url: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400',
      },
      {
        store_id: storeIds[5],
        nombre: 'Caja de Repostería Francesa',
        descripcion: '4 piezas surtidas: pain au chocolat, croissant de almendra, éclair de café y macaron. Ideales para compartir.',
        precio_original: 145.00,
        precio_descuento: 92.00,
        cantidad_disponible: 8,
        categoria: 'Repostería',
        imagen_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400',
      },
      {
        store_id: storeIds[5],
        nombre: 'Café de Especialidad + Postre',
        descripcion: 'Elige tu método: espresso, pour over o cold brew de Chiapas + rebanada de cheesecake de frutos rojos.',
        precio_original: 110.00,
        precio_descuento: 72.00,
        cantidad_disponible: 15,
        categoria: 'Combos',
        imagen_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      },
    ];

    let productCount = 0;
    for (const p of productos) {
      await client.query(
        `INSERT INTO products (store_id, nombre, descripcion, precio_original, precio_descuento, cantidad_disponible, categoria, imagen_url, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
        [p.store_id, p.nombre, p.descripcion, p.precio_original, p.precio_descuento, p.cantidad_disponible, p.categoria, p.imagen_url]
      );
      productCount++;
    }
    console.log(`\n🍽️  ${productCount} productos creados exitosamente`);

    // ========== PERFILES PARA COMERCIOS ==========
    for (let i = 0; i < userIds.length; i++) {
      await client.query(
        `INSERT INTO profiles (user_id, ciudad, telefono)
         VALUES ($1, 'Delicias, Chihuahua', $2)
         ON CONFLICT (user_id) DO UPDATE SET ciudad = 'Delicias, Chihuahua'`,
        [userIds[i], tiendas[i].telefono]
      );
    }
    console.log('👤 Perfiles de comerciantes actualizados');

    await client.query('COMMIT');
    
    console.log('\n════════════════════════════════════════');
    console.log('✅ SEED DE DELICIAS COMPLETADO');
    console.log('════════════════════════════════════════');
    console.log(`📍 Ciudad: Delicias, Chihuahua`);
    console.log(`🏪 Tiendas creadas: ${storeIds.length}`);
    console.log(`🍽️  Productos creados: ${productCount}`);
    console.log(`👤 Usuarios comercio: ${userIds.length}`);
    console.log('\n📝 Credenciales de prueba:');
    console.log('   Email: taqueria.lasdelicias@delicrunch.com');
    console.log('   Password: Comercio123');
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDelicias()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedDelicias;
