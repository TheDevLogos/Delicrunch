const pool = require('../db');
const bcrypt = require('bcryptjs');

/**
 * Script de Seed completo para Delicias, Chihuahua
 * - 5 comercios con coordenadas en Delicias
 * - 3 productos por comercio (15 total)
 * - Imágenes de alta calidad
 * - Datos completos
 */

async function seed() {
  console.log('🌱 Iniciando seed de Delicias...\n');

  try {
    // 1. LIMPIAR DATOS EXISTENTES
    console.log('🧹 Limpiando datos existentes...');
    await pool.query('DELETE FROM reviews');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM stores');
    await pool.query('DELETE FROM users WHERE role != $1', ['admin']);
    console.log('✅ Datos limpiados\n');

    // 2. CREAR COMERCIOS EN DELICIAS con coordenadas reales
    console.log('🏪 Creando 5 comercios en Delicias...');
    
    const comercios = [
      {
        nombre: 'Tacos Don Rafa',
        email: 'comercio.tacosdonrafa@test.com',
        direccion: 'Av. 3ra Norte #401, Centro, Delicias',
        ciudad: 'Delicias',
        latitud: 28.1908,
        longitud: -105.4695,
        telefono: '6391234567',
        horario: '08:00 - 22:00',
        descripcion: 'Los mejores tacos de carne asada de Delicias. Preparados al momento con los mejores ingredientes.',
        categoria: 'Tacos',
        logo_url: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800',
        productos: [
          {
            nombre: 'Pack Sorpresa de Tacos',
            descripcion: 'Selección variada de 6 tacos: carne asada, pastor, pollo. Incluye guarniciones y salsas.',
            precio_original: 150,
            precio_descuento: 89,
            stock: 3,
            categoria: 'Tacos',
            imagen: 'https://images.unsplash.com/photo-1599974579688-8dbdd335635f?w=800',
          },
          {
            nombre: 'Combo Familiar Sorpresa',
            descripcion: '12 tacos variados + 1L de refresco + guacamole. Perfecto para 4 personas.',
            precio_original: 280,
            precio_descuento: 159,
            stock: 3,
            categoria: 'Tacos',
            imagen: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=800',
          },
          {
            nombre: 'Pack Especial Al Pastor',
            descripcion: '8 tacos al pastor con piña, cebolla, cilantro y salsas especiales.',
            precio_original: 180,
            precio_descuento: 109,
            stock: 3,
            categoria: 'Tacos',
            imagen: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
          },
        ],
      },
      {
        nombre: 'Pizzería Napolitana',
        email: 'comercio.pizzerianapolitana@test.com',
        direccion: 'Calle 5ta Sur #234, Col. Las Américas, Delicias',
        ciudad: 'Delicias',
        latitud: 28.1875,
        longitud: -105.4742,
        telefono: '6391234568',
        horario: '12:00 - 23:00',
        descripcion: 'Pizza artesanal con masa madre y horno de leña. Recetas tradicionales italianas.',
        categoria: 'Pizza',
        logo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
        productos: [
          {
            nombre: 'Pizza Sorpresa Grande',
            descripcion: 'Pizza grande de especialidad del día. Ingredientes premium y queso mozzarella.',
            precio_original: 220,
            precio_descuento: 129,
            stock: 3,
            categoria: 'Pizza',
            imagen: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
          },
          {
            nombre: 'Pack Duo Pizzas',
            descripcion: '2 pizzas medianas de especialidad + refresco 2L. Perfectas para compartir.',
            precio_original: 350,
            precio_descuento: 199,
            stock: 3,
            categoria: 'Pizza',
            imagen: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96f47?w=800',
          },
          {
            nombre: 'Pizza Individual + Ensalada',
            descripcion: 'Pizza individual de especialidad con ensalada fresca y aderezo casero.',
            precio_original: 140,
            precio_descuento: 79,
            stock: 3,
            categoria: 'Pizza',
            imagen: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
          },
        ],
      },
      {
        nombre: 'Sushi Sakura',
        email: 'comercio.sushisakura@test.com',
        direccion: 'Blvd. Universidad #567, Col. Universitaria, Delicias',
        ciudad: 'Delicias',
        latitud: 28.1942,
        longitud: -105.4668,
        telefono: '6391234569',
        horario: '13:00 - 22:00',
        descripcion: 'Sushi fresco preparado por chef certificado. Rollos tradicionales y fusión.',
        categoria: 'Sushi',
        logo_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800',
        productos: [
          {
            nombre: 'Pack Sorpresa de Sushi',
            descripcion: '24 piezas variadas: makis, nigiris y california rolls. Incluye wasabi y jengibre.',
            precio_original: 280,
            precio_descuento: 169,
            stock: 3,
            categoria: 'Sushi',
            imagen: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800',
          },
          {
            nombre: 'Combo Premium',
            descripcion: '36 piezas: california, philadelphia, dinamita y spicy tuna. Para compartir.',
            precio_original: 420,
            precio_descuento: 249,
            stock: 3,
            categoria: 'Sushi',
            imagen: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800',
          },
          {
            nombre: 'Bowl Poke Sorpresa',
            descripcion: 'Bowl de arroz con salmón fresco, aguacate, edamame y vegetales. Muy saludable.',
            precio_original: 160,
            precio_descuento: 95,
            stock: 3,
            categoria: 'Sushi',
            imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
          },
        ],
      },
      {
        nombre: 'Café Delicias',
        email: 'comercio.cafedelicias@test.com',
        direccion: 'Calle 1ra Norte #178, Centro, Delicias',
        ciudad: 'Delicias',
        latitud: 28.1895,
        longitud: -105.4710,
        telefono: '6391234570',
        horario: '07:00 - 20:00',
        descripcion: 'Café de especialidad, repostería artesanal y desayunos. Ambiente acogedor.',
        categoria: 'Café',
        logo_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
        productos: [
          {
            nombre: 'Pack Desayuno Sorpresa',
            descripcion: 'Café gourmet + croissant + jugo natural + fruta. El mejor inicio del día.',
            precio_original: 120,
            precio_descuento: 69,
            stock: 3,
            categoria: 'Café',
            imagen: 'https://images.unsplash.com/photo-1525097487452-6278ff080c31?w=800',
          },
          {
            nombre: 'Caja de Repostería',
            descripcion: 'Selección de 6 piezas de repostería del día: muffins, brownies, galletas.',
            precio_original: 150,
            precio_descuento: 89,
            stock: 3,
            categoria: 'Café',
            imagen: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800',
          },
          {
            nombre: 'Pack Lunch Ejecutivo',
            descripcion: 'Sandwich gourmet + café americano + postre. Perfecto para el trabajo.',
            precio_original: 140,
            precio_descuento: 85,
            stock: 3,
            categoria: 'Café',
            imagen: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800',
          },
        ],
      },
      {
        nombre: 'La Hamburguesa del Barrio',
        email: 'comercio.hamburguesadelbarrio@test.com',
        direccion: 'Av. 4ta Poniente #890, Col. Obrera, Delicias',
        ciudad: 'Delicias',
        latitud: 28.1860,
        longitud: -105.4725,
        telefono: '6391234571',
        horario: '12:00 - 00:00',
        descripcion: 'Hamburguesas gourmet con carne angus, ingredientes frescos y papas artesanales.',
        categoria: 'Hamburguesas',
        logo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        productos: [
          {
            nombre: 'Hamburguesa Sorpresa + Papas',
            descripcion: 'Hamburguesa de especialidad con carne angus 200g, quesos premium, papas y refresco.',
            precio_original: 180,
            precio_descuento: 109,
            stock: 3,
            categoria: 'Hamburguesas',
            imagen: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
          },
          {
            nombre: 'Pack Familiar Burgers',
            descripcion: '4 hamburguesas + papas grandes + aros de cebolla + 4 refrescos.',
            precio_original: 520,
            precio_descuento: 299,
            stock: 3,
            categoria: 'Hamburguesas',
            imagen: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
          },
          {
            nombre: 'Combo Doble Carne',
            descripcion: 'Hamburguesa doble carne con tocino, queso cheddar, papas y malteada.',
            precio_original: 220,
            precio_descuento: 129,
            stock: 3,
            categoria: 'Hamburguesas',
            imagen: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800',
          },
        ],
      },
    ];

    // Hash de contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Crear comercios y productos
    for (const comercio of comercios) {
      // Crear usuario vendedor
      const userResult = await pool.query(
        `INSERT INTO users (name, email, password, role, phone, street, city, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          comercio.nombre,
          comercio.email,
          passwordHash,
          'seller',
          comercio.telefono,
          comercio.direccion,
          comercio.ciudad,
          comercio.latitud,
          comercio.longitud,
        ]
      );
      const userId = userResult.rows[0].id;

      // Crear tienda
      const storeResult = await pool.query(
        `INSERT INTO stores (user_id, nombre_comercio, direccion, latitud, longitud, telefono, horario, descripcion, categoria, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          userId,
          comercio.nombre,
          comercio.direccion,
          comercio.latitud,
          comercio.longitud,
          comercio.telefono,
          comercio.horario,
          comercio.descripcion,
          comercio.categoria,
          true,
        ]
      );
      const storeId = storeResult.rows[0].id;

      console.log(`✅ ${comercio.nombre}`);
      console.log(`   📧 ${comercio.email}`);
      console.log(`   📍 ${comercio.direccion}`);
      console.log(`   🗺️  ${comercio.latitud}, ${comercio.longitud}`);

      // Crear productos
      for (const producto of comercio.productos) {
        await pool.query(
          `INSERT INTO products (
            seller_id, name, description, price, compare_price, 
            stock, category, image_url, is_active, latitude, longitude
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            userId,
            producto.nombre,
            producto.descripcion,
            producto.precio_descuento,
            producto.precio_original,
            producto.stock,
            producto.categoria,
            producto.imagen,
            true,
            comercio.latitud,
            comercio.longitud,
          ]
        );
        console.log(`   📦 ${producto.nombre} - $${producto.precio_descuento} (${producto.stock} unidades)`);
      }
      console.log('');
    }

    // 3. CREAR COMPRADORES
    console.log('👥 Creando compradores de prueba...');
    const compradores = [
      {
        nombre: 'María González',
        email: 'comprador1@test.com',
        ciudad: 'Delicias',
        direccion: 'Calle 2da #123',
        telefono: '6391112233',
      },
      {
        nombre: 'Juan Pérez',
        email: 'comprador2@test.com',
        ciudad: 'Delicias',
        direccion: 'Av. Libertad #456',
        telefono: '6391112234',
      },
      {
        nombre: 'Ana Martínez',
        email: 'comprador3@test.com',
        ciudad: 'Delicias',
        direccion: 'Blvd. Universidad #789',
        telefono: '6391112235',
      },
    ];

    for (const comprador of compradores) {
      await pool.query(
        `INSERT INTO users (name, email, password, role, phone, street, city)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          comprador.nombre,
          comprador.email,
          passwordHash,
          'buyer',
          comprador.telefono,
          comprador.direccion,
          comprador.ciudad,
        ]
      );
      console.log(`✅ ${comprador.email}`);
    }

    // 4. RESUMEN
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   ✅ SEED DE DELICIAS COMPLETADO             ║');
    console.log('╚══════════════════════════════════════════════╝');
    
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'seller') as vendedores,
        (SELECT COUNT(*) FROM users WHERE role = 'buyer') as compradores,
        (SELECT COUNT(*) FROM stores) as tiendas,
        (SELECT COUNT(*) FROM products) as productos
    `);
    
    console.log('\n📊 Estadísticas:');
    console.log(`   🏪 Comercios: ${stats.rows[0].tiendas}`);
    console.log(`   👤 Vendedores: ${stats.rows[0].vendedores}`);
    console.log(`   👥 Compradores: ${stats.rows[0].compradores}`);
    console.log(`   📦 Productos: ${stats.rows[0].productos}`);
    
    console.log('\n🔐 Credenciales:');
    console.log('   Comercios: password123');
    console.log('   Compradores: password123');
    
    console.log('\n✅ ¡Listo! Puedes iniciar sesión con cualquiera de los emails creados.\n');

  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar
seed().catch(console.error);
