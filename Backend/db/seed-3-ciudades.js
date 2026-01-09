/**
 * ============================================================
 * SEED COMPLETO PARA TESTING - 3 CIUDADES DE CHIHUAHUA
 * ============================================================
 * - Meoqui, Delicias, Camargo
 * - Comercios reales con coordenadas GPS
 * - Usuarios compradores para cada ciudad
 * - Productos, órdenes y reseñas realistas
 * ============================================================
 */

const pool = require('./index');
const bcrypt = require('bcryptjs');

// ============================================================
// DATOS DE CIUDADES
// ============================================================
const CIUDADES = {
  meoqui: {
    nombre: 'Meoqui, Chihuahua',
    centro: { lat: 28.2722, lng: -105.4817 },
    cp: '33130'
  },
  delicias: {
    nombre: 'Delicias, Chihuahua',
    centro: { lat: 28.1910, lng: -105.4708 },
    cp: '33000'
  },
  camargo: {
    nombre: 'Camargo, Chihuahua',
    centro: { lat: 27.6833, lng: -105.1667 },
    cp: '33700'
  }
};

// ============================================================
// USUARIOS COMPRADORES
// ============================================================
const COMPRADORES = [
  // Meoqui
  { nombre: 'Laura Martínez Soto', email: 'laura.meoqui@test.com', ciudad: 'Meoqui, Chihuahua' },
  { nombre: 'Pedro Rodríguez Luna', email: 'pedro.meoqui@test.com', ciudad: 'Meoqui, Chihuahua' },
  // Delicias
  { nombre: 'Ana García Torres', email: 'ana.delicias@test.com', ciudad: 'Delicias, Chihuahua' },
  { nombre: 'Carlos López Rivera', email: 'carlos.delicias@test.com', ciudad: 'Delicias, Chihuahua' },
  { nombre: 'María Hernández Vega', email: 'maria.delicias@test.com', ciudad: 'Delicias, Chihuahua' },
  // Camargo
  { nombre: 'Roberto Sánchez Ibarra', email: 'roberto.camargo@test.com', ciudad: 'Camargo, Chihuahua' },
  { nombre: 'Patricia Ruiz Medina', email: 'patricia.camargo@test.com', ciudad: 'Camargo, Chihuahua' },
];

// ============================================================
// COMERCIOS POR CIUDAD
// ============================================================
const COMERCIOS = [
  // ========== MEOQUI (3 comercios) ==========
  {
    usuario: { nombre: 'Francisco Villa Domínguez', email: 'tacos.meoqui@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Tacos El Pancho',
      direccion: 'Av. Juárez 215, Centro, 33130 Meoqui, Chih.',
      latitud: 28.2728,
      longitud: -105.4822,
      telefono: '+52 639 123 4567',
      horario: 'Lun-Dom 8:00 AM - 10:00 PM',
      descripcion: 'Los tacos más sabrosos de Meoqui. Carne asada en carbón, tortillas de maíz hechas a mano y salsas picantes de la abuela.',
      categoria: 'tacos'
    },
    productos: [
      { nombre: 'Pack 8 Tacos Surtidos', descripcion: 'Tacos de asada, pastor, chorizo y suadero con cebollitas asadas.', precio_original: 140.00, precio_descuento: 85.00, cantidad: 10, categoria: 'Tacos', imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400' },
      { nombre: 'Torta de Asada XL', descripcion: 'Torta gigante con carne asada, frijoles, aguacate, queso y jalapeños.', precio_original: 95.00, precio_descuento: 60.00, cantidad: 8, categoria: 'Tortas', imagen: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=400' },
      { nombre: 'Gringas de Pastor', descripcion: '3 gringas con queso derretido, piña y carne al pastor.', precio_original: 110.00, precio_descuento: 70.00, cantidad: 6, categoria: 'Gringas', imagen: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400' },
    ]
  },
  {
    usuario: { nombre: 'Elena Morales Castro', email: 'panaderia.meoqui@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Panadería La Espigas de Oro',
      direccion: 'Calle Hidalgo 108, Centro, 33130 Meoqui, Chih.',
      latitud: 28.2715,
      longitud: -105.4830,
      telefono: '+52 639 234 5678',
      horario: 'Lun-Sáb 6:00 AM - 8:00 PM',
      descripcion: 'Panadería tradicional desde 1978. Pan de levadura, conchas, cuernos y pasteles para toda ocasión.',
      categoria: 'panaderia'
    },
    productos: [
      { nombre: 'Bolsa Pan Dulce 12 pzas', descripcion: 'Conchas, cuernos, orejas, polvorones surtidos del día.', precio_original: 85.00, precio_descuento: 50.00, cantidad: 15, categoria: 'Panadería', imagen: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400' },
      { nombre: 'Pay de Nuez Familiar', descripcion: 'Pay tradicional de nuez con base crujiente. Para 8 personas.', precio_original: 220.00, precio_descuento: 140.00, cantidad: 4, categoria: 'Postres', imagen: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=400' },
    ]
  },
  {
    usuario: { nombre: 'Miguel Ángel Pérez', email: 'pollo.meoqui@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Pollos Asados Don Miguel',
      direccion: 'Blvd. Allende 502, Col. Industrial, 33130 Meoqui, Chih.',
      latitud: 28.2740,
      longitud: -105.4795,
      telefono: '+52 639 345 6789',
      horario: 'Lun-Dom 11:00 AM - 9:00 PM',
      descripcion: 'Pollo rostizado al carbón con nuestro secreto familiar de especias. Incluye tortillas, salsa y cebollitas.',
      categoria: 'pollo'
    },
    productos: [
      { nombre: 'Pollo Entero + Complementos', descripcion: 'Pollo completo con tortillas, arroz, frijoles y salsa verde.', precio_original: 195.00, precio_descuento: 125.00, cantidad: 6, categoria: 'Pollo', imagen: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400' },
      { nombre: 'Medio Pollo Express', descripcion: 'Medio pollo con ensalada de repollo y 6 tortillas.', precio_original: 110.00, precio_descuento: 70.00, cantidad: 10, categoria: 'Pollo', imagen: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400' },
    ]
  },

  // ========== DELICIAS (4 comercios) ==========
  {
    usuario: { nombre: 'Antonio Orsini Mendoza', email: 'pizza.orsinis@delicrunch.com' },
    tienda: {
      nombre_comercio: "Pizza Orsini's",
      direccion: 'Av. 4a Poniente 810, Col. Centro, 33000 Delicias, Chih.',
      latitud: 28.1898,
      longitud: -105.4721,
      telefono: '+52 639 472 3456',
      horario: 'Mar-Dom 1:00 PM - 10:00 PM',
      descripcion: 'Auténtica pizza italiana con recetas familiares desde 1992. Masa artesanal fermentada 48 horas e ingredientes importados.',
      categoria: 'pizza'
    },
    productos: [
      { nombre: 'Pizza Margherita Grande', descripcion: 'Salsa San Marzano, mozzarella di bufala, albahaca fresca. Masa 48h.', precio_original: 195.00, precio_descuento: 125.00, cantidad: 5, categoria: 'Pizza', imagen: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
      { nombre: 'Pizza Pepperoni Familiar', descripcion: 'Extra queso mozzarella y doble pepperoni importado.', precio_original: 245.00, precio_descuento: 155.00, cantidad: 4, categoria: 'Pizza', imagen: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400' },
      { nombre: 'Tiramisú Italiano', descripcion: 'Postre clásico con mascarpone, café espresso y cacao.', precio_original: 95.00, precio_descuento: 60.00, cantidad: 8, categoria: 'Postres', imagen: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400' },
      { nombre: 'Pasta Carbonara', descripcion: 'Spaghetti con salsa cremosa, pancetta, huevo y parmesano.', precio_original: 165.00, precio_descuento: 105.00, cantidad: 6, categoria: 'Pastas', imagen: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400' },
    ]
  },
  {
    usuario: { nombre: 'Kenji Tanaka Ruiz', email: 'sushi.delicias@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Dr. Sushi Delicias',
      direccion: 'Blvd. Milenio 340, Plaza Las Américas, 33088 Delicias, Chih.',
      latitud: 28.1962,
      longitud: -105.4635,
      telefono: '+52 639 476 7890',
      horario: 'Lun-Dom 12:00 PM - 10:00 PM',
      descripcion: 'Fusión de sabores japoneses y mexicanos. Sushi fresco, poke bowls y ramen artesanal.',
      categoria: 'sushi'
    },
    productos: [
      { nombre: 'Combo Dragon Roll 12 pzas', descripcion: 'Camarón tempura, aguacate, anguila y salsa unagi. Con edamames.', precio_original: 225.00, precio_descuento: 145.00, cantidad: 5, categoria: 'Sushi', imagen: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400' },
      { nombre: 'Poke Bowl Salmón', descripcion: 'Arroz, salmón fresco, mango, aguacate y salsa ponzu.', precio_original: 175.00, precio_descuento: 115.00, cantidad: 7, categoria: 'Bowls', imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
      { nombre: 'Ramen Tonkotsu', descripcion: 'Caldo 12 horas, chashu, huevo marinado, nori y fideos frescos.', precio_original: 155.00, precio_descuento: 100.00, cantidad: 5, categoria: 'Ramen', imagen: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400' },
    ]
  },
  {
    usuario: { nombre: 'María Fernanda Ríos', email: 'chilaquiles.delicias@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Chilaquiles La Carreta',
      direccion: 'Blvd. Río Chuviscar 1205, 33089 Delicias, Chih.',
      latitud: 28.1945,
      longitud: -105.4752,
      telefono: '+52 639 474 9012',
      horario: 'Lun-Sáb 7:00 AM - 2:00 PM',
      descripcion: 'Los mejores chilaquiles del norte. Rojos, verdes o divorciados con pollo, huevo o arrachera.',
      categoria: 'desayunos'
    },
    productos: [
      { nombre: 'Chilaquiles Divorciados', descripcion: 'Mitad rojos, mitad verdes con pollo y huevo. Frijoles incluidos.', precio_original: 105.00, precio_descuento: 68.00, cantidad: 12, categoria: 'Desayunos', imagen: 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=400' },
      { nombre: 'Huevos Rancheros Completos', descripcion: 'Huevos con salsa roja, frijoles, tortillas y café de olla.', precio_original: 95.00, precio_descuento: 62.00, cantidad: 10, categoria: 'Desayunos', imagen: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400' },
    ]
  },
  {
    usuario: { nombre: 'Carolina Placeres Vega', email: 'cafe.delicias@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Café Placeres',
      direccion: 'Calle 3a Norte 215, Col. Centro, 33000 Delicias, Chih.',
      latitud: 28.1922,
      longitud: -105.4695,
      telefono: '+52 639 471 2345',
      horario: 'Lun-Sáb 7:00 AM - 9:00 PM',
      descripcion: 'Cafetería boutique con granos de Chiapas. Repostería francesa y ambiente acogedor.',
      categoria: 'cafe'
    },
    productos: [
      { nombre: 'Brunch Box Premium', descripcion: 'Croissant, huevos benedictinos, fruta y café de especialidad.', precio_original: 195.00, precio_descuento: 128.00, cantidad: 5, categoria: 'Brunch', imagen: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400' },
      { nombre: 'Caja Repostería Francesa 6 pzas', descripcion: 'Pain au chocolat, croissants, éclairs y macarons surtidos.', precio_original: 165.00, precio_descuento: 105.00, cantidad: 6, categoria: 'Repostería', imagen: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400' },
      { nombre: 'Café + Cheesecake', descripcion: 'Espresso de Chiapas + rebanada cheesecake frutos rojos.', precio_original: 115.00, precio_descuento: 75.00, cantidad: 10, categoria: 'Combos', imagen: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' },
    ]
  },

  // ========== CAMARGO (3 comercios) ==========
  {
    usuario: { nombre: 'Ramón González Fierro', email: 'carnes.camargo@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Carnes Asadas El Fierro',
      direccion: 'Av. Juárez 890, Centro, 33700 Camargo, Chih.',
      latitud: 27.6845,
      longitud: -105.1680,
      telefono: '+52 648 462 1234',
      horario: 'Mié-Dom 12:00 PM - 10:00 PM',
      descripcion: 'Las mejores carnes del norte: arrachera, ribeye y cortes especiales al carbón.',
      categoria: 'carnes'
    },
    productos: [
      { nombre: 'Arrachera 500g + Guarniciones', descripcion: 'Arrachera marinada con cebollitas, guacamole, frijoles y tortillas.', precio_original: 295.00, precio_descuento: 195.00, cantidad: 4, categoria: 'Carnes', imagen: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400' },
      { nombre: 'Parrillada Familiar', descripcion: 'Arrachera, chorizo, costilla y pollo para 4 personas.', precio_original: 595.00, precio_descuento: 395.00, cantidad: 3, categoria: 'Carnes', imagen: 'https://images.unsplash.com/photo-1558030006-450675393462?w=400' },
      { nombre: 'Tacos de Arrachera 6 pzas', descripcion: 'Tacos con carne premium, cebolla asada y salsa chimichurri.', precio_original: 145.00, precio_descuento: 95.00, cantidad: 8, categoria: 'Tacos', imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400' },
    ]
  },
  {
    usuario: { nombre: 'Lucía Contreras Mendez', email: 'gorditas.camargo@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Gorditas Doña Lucía',
      direccion: 'Calle Hidalgo 234, Col. Centro, 33700 Camargo, Chih.',
      latitud: 27.6820,
      longitud: -105.1655,
      telefono: '+52 648 462 5678',
      horario: 'Lun-Sáb 7:00 AM - 4:00 PM',
      descripcion: 'Gorditas de harina rellenas como las hacía mi abuelita. Machaca, chicharrón y picadillo.',
      categoria: 'gorditas'
    },
    productos: [
      { nombre: 'Pack 4 Gorditas Surtidas', descripcion: 'Machaca, chicharrón, rajas con queso y picadillo.', precio_original: 95.00, precio_descuento: 62.00, cantidad: 12, categoria: 'Gorditas', imagen: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400' },
      { nombre: 'Desayuno Norteño', descripcion: '2 gorditas + huevos revueltos + frijoles + café.', precio_original: 85.00, precio_descuento: 55.00, cantidad: 10, categoria: 'Desayunos', imagen: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400' },
    ]
  },
  {
    usuario: { nombre: 'José Luis Valdez', email: 'mariscos.camargo@delicrunch.com' },
    tienda: {
      nombre_comercio: 'Mariscos El Barco',
      direccion: 'Blvd. Independencia 456, 33700 Camargo, Chih.',
      latitud: 27.6860,
      longitud: -105.1700,
      telefono: '+52 648 463 9012',
      horario: 'Jue-Dom 11:00 AM - 8:00 PM',
      descripcion: 'Mariscos frescos del Pacífico. Cocteles, ceviches, aguachiles y pescado zarandeado.',
      categoria: 'mariscos'
    },
    productos: [
      { nombre: 'Coctel de Camarón Grande', descripcion: 'Camarones frescos con aguacate, pepino y salsa negra.', precio_original: 175.00, precio_descuento: 115.00, cantidad: 6, categoria: 'Mariscos', imagen: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400' },
      { nombre: 'Aguachile Negro', descripcion: 'Camarón crudo en salsa de soya y chile serrano con pepino.', precio_original: 185.00, precio_descuento: 120.00, cantidad: 5, categoria: 'Mariscos', imagen: 'https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=400' },
      { nombre: 'Tacos Gobernador 4 pzas', descripcion: 'Tacos de camarón con queso derretido y chile poblano.', precio_original: 145.00, precio_descuento: 95.00, cantidad: 8, categoria: 'Tacos', imagen: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400' },
    ]
  },
];

// ============================================================
// FUNCIÓN PRINCIPAL DE SEED
// ============================================================
async function seedTresCiudades() {
  const client = await pool.connect();
  
  try {
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('🚀 INICIANDO SEED COMPLETO - 3 CIUDADES DE CHIHUAHUA');
    console.log('════════════════════════════════════════════════════════════\n');

    await client.query('BEGIN');

    // ========== PASO 1: LIMPIAR DATOS ANTERIORES ==========
    console.log('🧹 Limpiando datos anteriores...');
    
    // Eliminar en orden correcto por foreign keys
    await client.query('DELETE FROM reviews');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM favorites');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM financial_metrics');
    await client.query('DELETE FROM admin_metrics');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM stores');
    await client.query('DELETE FROM profiles');
    await client.query('DELETE FROM saved_cards');
    await client.query("DELETE FROM users WHERE email != 'admindeli@delicrunch.com'");
    
    console.log('   ✅ Tablas limpiadas\n');

    // ========== PASO 2: CREAR USUARIOS ADMIN ==========
    const adminHash = await bcrypt.hash('Admin1234', 10);
    
    // Verificar si existe el admin, si no crearlo
    const adminCheck = await client.query(
      "SELECT id FROM users WHERE email = 'admindeli@delicrunch.com'"
    );
    
    let adminId;
    if (adminCheck.rows.length === 0) {
      const adminResult = await client.query(
        `INSERT INTO users (nombre, email, password_hash, rol)
         VALUES ('Admin Delicrunch', 'admindeli@delicrunch.com', $1, 'admin')
         RETURNING id`,
        [adminHash]
      );
      adminId = adminResult.rows[0].id;
      console.log('👑 Usuario Admin creado');
    } else {
      adminId = adminCheck.rows[0].id;
      await client.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [adminHash, adminId]
      );
      console.log('👑 Usuario Admin actualizado');
    }

    // ========== PASO 3: CREAR USUARIOS COMPRADORES ==========
    console.log('\n👥 Creando usuarios compradores...');
    const buyerHash = await bcrypt.hash('Comprador123', 10);
    const buyerIds = [];

    for (const buyer of COMPRADORES) {
      const result = await client.query(
        `INSERT INTO users (nombre, email, password_hash, rol)
         VALUES ($1, $2, $3, 'comprador')
         RETURNING id`,
        [buyer.nombre, buyer.email, buyerHash]
      );
      buyerIds.push({ id: result.rows[0].id, ...buyer });
      
      // Crear perfil del comprador
      await client.query(
        `INSERT INTO profiles (user_id, ciudad, telefono)
         VALUES ($1, $2, $3)`,
        [result.rows[0].id, buyer.ciudad, '+52 639 000 ' + Math.floor(1000 + Math.random() * 9000)]
      );
      
      console.log(`   ✅ ${buyer.nombre} (${buyer.ciudad.split(',')[0]})`);
    }

    // ========== PASO 4: CREAR COMERCIOS Y PRODUCTOS ==========
    console.log('\n🏪 Creando comercios y productos...');
    const comercioHash = await bcrypt.hash('Comercio123', 10);
    const allStores = [];
    const allProducts = [];

    for (const comercio of COMERCIOS) {
      // Crear usuario comercio
      const userResult = await client.query(
        `INSERT INTO users (nombre, email, password_hash, rol)
         VALUES ($1, $2, $3, 'comercio')
         RETURNING id`,
        [comercio.usuario.nombre, comercio.usuario.email, comercioHash]
      );
      const userId = userResult.rows[0].id;

      // Crear tienda
      const storeResult = await client.query(
        `INSERT INTO stores (user_id, nombre_comercio, direccion, latitud, longitud, telefono, horario, descripcion, categoria, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
         RETURNING id`,
        [
          userId,
          comercio.tienda.nombre_comercio,
          comercio.tienda.direccion,
          comercio.tienda.latitud,
          comercio.tienda.longitud,
          comercio.tienda.telefono,
          comercio.tienda.horario,
          comercio.tienda.descripcion,
          comercio.tienda.categoria
        ]
      );
      const storeId = storeResult.rows[0].id;
      
      // Determinar ciudad del comercio
      let ciudad = 'Desconocida';
      if (comercio.tienda.direccion.includes('Meoqui')) ciudad = 'Meoqui, Chihuahua';
      else if (comercio.tienda.direccion.includes('Delicias')) ciudad = 'Delicias, Chihuahua';
      else if (comercio.tienda.direccion.includes('Camargo')) ciudad = 'Camargo, Chihuahua';

      allStores.push({ id: storeId, nombre: comercio.tienda.nombre_comercio, ciudad, userId });

      // Crear perfil del comerciante
      await client.query(
        `INSERT INTO profiles (user_id, ciudad, telefono)
         VALUES ($1, $2, $3)`,
        [userId, ciudad, comercio.tienda.telefono]
      );

      // Crear productos
      for (const prod of comercio.productos) {
        const prodResult = await client.query(
          `INSERT INTO products (store_id, nombre, descripcion, precio_original, precio_descuento, cantidad_disponible, categoria, imagen_url, activo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
           RETURNING id`,
          [storeId, prod.nombre, prod.descripcion, prod.precio_original, prod.precio_descuento, prod.cantidad, prod.categoria, prod.imagen]
        );
        allProducts.push({ id: prodResult.rows[0].id, storeId, ...prod });
      }

      console.log(`   🏪 ${comercio.tienda.nombre_comercio} (${ciudad.split(',')[0]}) - ${comercio.productos.length} productos`);
    }

    // ========== PASO 5: CREAR ÓRDENES DE PRUEBA ==========
    console.log('\n📦 Creando órdenes de prueba...');
    // Estados válidos en BD actual: 'pendiente', 'confirmado', 'en_preparacion', 'listo', 'recogido', 'cancelado'
    const orderStatuses = ['recogido', 'listo', 'confirmado', 'pendiente', 'en_preparacion'];
    const orders = [];

    // Crear varias órdenes por comprador
    for (const buyer of buyerIds) {
      // Filtrar tiendas de la misma ciudad
      const cityStores = allStores.filter(s => s.ciudad === buyer.ciudad);
      
      if (cityStores.length === 0) continue;

      // Crear 2-3 órdenes por comprador
      const numOrders = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numOrders; i++) {
        const store = cityStores[Math.floor(Math.random() * cityStores.length)];
        const storeProducts = allProducts.filter(p => p.storeId === store.id);
        
        if (storeProducts.length === 0) continue;

        const product = storeProducts[Math.floor(Math.random() * storeProducts.length)];
        const cantidad = Math.floor(Math.random() * 2) + 1;
        const subtotal = product.precio_descuento * cantidad;
        const comision = subtotal * 0.25;
        const total = subtotal;
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const codigoRecogida = `DC-${Math.floor(100 + Math.random() * 900)}`;

        // Crear fecha aleatoria en los últimos 30 días
        const daysAgo = Math.floor(Math.random() * 30);
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);

        const orderResult = await client.query(
          `INSERT INTO orders (user_id, store_id, codigo_recogida, subtotal, comision_plataforma, total, estado, metodo_pago, fecha_pedido, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'tarjeta', $8, $8)
           RETURNING id`,
          [buyer.id, store.id, codigoRecogida, subtotal, comision, total, status, orderDate]
        );
        const orderId = orderResult.rows[0].id;

        // Crear order_item
        await client.query(
          `INSERT INTO order_items (order_id, product_id, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, product.id, cantidad, product.precio_descuento, subtotal]
        );

        orders.push({ 
          id: orderId, 
          buyerId: buyer.id, 
          storeId: store.id, 
          status,
          storeName: store.nombre,
          buyerName: buyer.nombre 
        });
      }
    }
    console.log(`   ✅ ${orders.length} órdenes creadas`);

    // ========== PASO 6: CREAR RESEÑAS ==========
    console.log('\n⭐ Creando reseñas...');
    const comentarios = [
      { texto: '¡Excelente! Muy buena relación calidad-precio. Definitivamente regresaré.', rating: 5 },
      { texto: 'Muy rica la comida, fresca y abundante. Recomendado.', rating: 5 },
      { texto: 'Buena opción para no desperdiciar comida. El pack valió la pena.', rating: 4 },
      { texto: 'Todo bien, llegó caliente y en buen estado. Volveré a ordenar.', rating: 4 },
      { texto: 'Buen sabor aunque esperaba un poco más de cantidad.', rating: 3 },
      { texto: 'La comida estaba rica. El servicio de recogida fue rápido.', rating: 4 },
      { texto: '¡Delicioso! Superó mis expectativas. El mejor deal de la semana.', rating: 5 },
      { texto: 'Muy satisfecho con mi compra. Comida fresca y bien preparada.', rating: 5 },
    ];

    let reviewCount = 0;
    // Solo crear reseñas para órdenes recogidas o listas
    const completedOrders = orders.filter(o => o.status === 'recogido' || o.status === 'listo');
    
    for (const order of completedOrders) {
      // 80% de probabilidad de dejar reseña
      if (Math.random() > 0.2) {
        const comentario = comentarios[Math.floor(Math.random() * comentarios.length)];
        
        try {
          // Estructura simplificada según la BD actual
          await client.query(
            `INSERT INTO reviews (user_id, store_id, order_id, calificacion, comentario, rating, visible)
             VALUES ($1, $2, $3, $4, $5, $6, true)`,
            [
              order.buyerId,
              order.storeId,
              order.id,
              comentario.rating,
              comentario.texto,
              comentario.rating
            ]
          );
          reviewCount++;
        } catch (e) {
          // Ignorar duplicados pero loguear otros errores
          if (!e.message.includes('duplicate') && !e.message.includes('unique')) {
            console.log(`   ⚠️ Error review: ${e.message}`);
          }
        }
      }
    }
    console.log(`   ✅ ${reviewCount} reseñas creadas`);

    // ========== PASO 7: CREAR FAVORITOS ==========
    console.log('\n❤️ Creando favoritos...');
    let favCount = 0;
    
    for (const buyer of buyerIds) {
      const cityStores = allStores.filter(s => s.ciudad === buyer.ciudad);
      // Agregar 1-2 favoritos por comprador
      const numFavs = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numFavs && i < cityStores.length; i++) {
        try {
          await client.query(
            `INSERT INTO favorites (user_id, store_id) VALUES ($1, $2)`,
            [buyer.id, cityStores[i].id]
          );
          favCount++;
        } catch (e) {
          // Ignorar duplicados pero loguear otros errores
          if (!e.message.includes('duplicate') && !e.message.includes('unique')) {
            console.log(`   ⚠️ Error favorito: ${e.message}`);
          }
        }
      }
    }
    console.log(`   ✅ ${favCount} favoritos creados`);

    // ========== PASO 8: CREAR NOTIFICACIONES ==========
    console.log('\n🔔 Creando notificaciones...');
    
    for (const buyer of buyerIds) {
      await client.query(
        `INSERT INTO notifications (user_id, tipo, titulo, mensaje, leido)
         VALUES ($1, 'sistema', '¡Bienvenido a Delicrunch!', 'Descubre ofertas increíbles en tu ciudad y ayuda a reducir el desperdicio de alimentos.', false)`,
        [buyer.id]
      );
    }
    console.log(`   ✅ ${buyerIds.length} notificaciones creadas`);

    await client.query('COMMIT');

    // ========== RESUMEN FINAL ==========
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('════════════════════════════════════════════════════════════');
    console.log('\n📊 RESUMEN:');
    console.log(`   🏪 Comercios: ${allStores.length}`);
    console.log(`   🍽️  Productos: ${allProducts.length}`);
    console.log(`   👥 Compradores: ${buyerIds.length}`);
    console.log(`   📦 Órdenes: ${orders.length}`);
    console.log(`   ⭐ Reseñas: ${reviewCount}`);
    console.log(`   ❤️ Favoritos: ${favCount}`);
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('🔐 CREDENCIALES DE PRUEBA');
    console.log('════════════════════════════════════════════════════════════');
    
    console.log('\n👑 ADMIN:');
    console.log('   Email: admindeli@delicrunch.com');
    console.log('   Password: Admin1234');
    
    console.log('\n🏪 COMERCIOS (Password: Comercio123):');
    console.log('   📍 MEOQUI:');
    console.log('      - tacos.meoqui@delicrunch.com (Tacos El Pancho)');
    console.log('      - panaderia.meoqui@delicrunch.com (Panadería La Espiga)');
    console.log('      - pollo.meoqui@delicrunch.com (Pollos Don Miguel)');
    console.log('   📍 DELICIAS:');
    console.log('      - pizza.orsinis@delicrunch.com (Pizza Orsini\'s) ⭐');
    console.log('      - sushi.delicias@delicrunch.com (Dr. Sushi)');
    console.log('      - chilaquiles.delicias@delicrunch.com (Chilaquiles La Carreta)');
    console.log('      - cafe.delicias@delicrunch.com (Café Placeres)');
    console.log('   📍 CAMARGO:');
    console.log('      - carnes.camargo@delicrunch.com (Carnes El Fierro)');
    console.log('      - gorditas.camargo@delicrunch.com (Gorditas Doña Lucía)');
    console.log('      - mariscos.camargo@delicrunch.com (Mariscos El Barco)');
    
    console.log('\n👤 COMPRADORES (Password: Comprador123):');
    console.log('   📍 MEOQUI:');
    console.log('      - laura.meoqui@test.com (Laura Martínez)');
    console.log('      - pedro.meoqui@test.com (Pedro Rodríguez)');
    console.log('   📍 DELICIAS:');
    console.log('      - ana.delicias@test.com (Ana García)');
    console.log('      - carlos.delicias@test.com (Carlos López)');
    console.log('      - maria.delicias@test.com (María Hernández)');
    console.log('   📍 CAMARGO:');
    console.log('      - roberto.camargo@test.com (Roberto Sánchez)');
    console.log('      - patricia.camargo@test.com (Patricia Ruiz)');
    
    console.log('\n════════════════════════════════════════════════════════════\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar
seedTresCiudades().catch(console.error);
