const pool = require('./index');

async function seedCompleteProducts() {
  try {
    // Obtener tiendas existentes
    const storesResult = await pool.query('SELECT id FROM stores LIMIT 2');
    if (storesResult.rows.length === 0) {
      console.log('⚠️ No hay tiendas. Crea tiendas primero.');
      process.exitCode = 1;
      return;
    }

    const store1Id = storesResult.rows[0].id;
    const store2Id = storesResult.rows.length > 1 ? storesResult.rows[1].id : store1Id;

    // 10 productos variados con información completa
    const products = [
      {
        store_id: store1Id,
        nombre: 'Pack Pan Artesanal Premium',
        descripcion: 'Surtido de pan artesanal del día. Incluye baguette, ciabatta y pan integral. Perfecto para el desayuno.',
        precio_original: 150.00,
        precio_descuento: 75.00,
        cantidad_disponible: 8,
        categoria: 'Panadería'
      },
      {
        store_id: store1Id,
        nombre: 'Pack Repostería Gourmet',
        descripcion: 'Selección de pasteles caseros: brownies, mini tartas de chocolate y macarrones. Ideales para sorprender.',
        precio_original: 280.00,
        precio_descuento: 140.00,
        cantidad_disponible: 5,
        categoria: 'Repostería'
      },
      {
        store_id: store1Id,
        nombre: 'Pack Desayuno Deluxe',
        descripcion: 'Croissants frescos, mermelada artesanal, té y café premium. Envase especial para llevar.',
        precio_original: 220.00,
        precio_descuento: 110.00,
        cantidad_disponible: 6,
        categoria: 'Desayuno'
      },
      {
        store_id: store1Id,
        nombre: 'Pack Dulces Navideños',
        descripcion: 'Polvorones, roscón de reyes mini, turrón casero y galletas festivas. Edición limitada.',
        precio_original: 250.00,
        precio_descuento: 125.00,
        cantidad_disponible: 10,
        categoria: 'Especial'
      },
      {
        store_id: store1Id,
        nombre: 'Pack Sándwiches Gourmet',
        descripcion: 'Tres sándwiches variados: jamón ibérico, pavo ahumado y vegetariano. Pan casero.',
        precio_original: 180.00,
        precio_descuento: 90.00,
        cantidad_disponible: 7,
        categoria: 'Sándwiches'
      },
      {
        store_id: store2Id,
        nombre: 'Pack Café y Postres',
        descripcion: 'Café premium + brownie + cheesecake mini. Perfecto para una merienda especial.',
        precio_original: 200.00,
        precio_descuento: 100.00,
        cantidad_disponible: 9,
        categoria: 'Cafetería'
      },
      {
        store_id: store2Id,
        nombre: 'Pack Bebidas y Pastelería',
        descripcion: 'Jugo natural + smoothie + muffin + croissant. Opciones saludables y deliciosas.',
        precio_original: 190.00,
        precio_descuento: 95.00,
        cantidad_disponible: 12,
        categoria: 'Bebidas'
      },
      {
        store_id: store2Id,
        nombre: 'Pack Desayuno Vegano',
        descripcion: 'Café de avena, pan integral vegano, mermelada sin azúcar y granola casera.',
        precio_original: 170.00,
        precio_descuento: 85.00,
        cantidad_disponible: 6,
        categoria: 'Vegano'
      },
      {
        store_id: store2Id,
        nombre: 'Pack Tarde Chocolate',
        descripcion: 'Chocolate caliente artesanal + churros + galletas. Lo mejor de la tradición.',
        precio_original: 160.00,
        precio_descuento: 80.00,
        cantidad_disponible: 8,
        categoria: 'Chocolates'
      },
      {
        store_id: store2Id,
        nombre: 'Pack Frutas y Yogur',
        descripcion: 'Fruta fresca de temporada + yogur probiótico + granola premium. Opción saludable.',
        precio_original: 140.00,
        precio_descuento: 70.00,
        cantidad_disponible: 11,
        categoria: 'Saludable'
      }
    ];

    let count = 0;
    for (const product of products) {
      await pool.query(
        `INSERT INTO products (store_id, nombre, descripcion, precio_original, precio_descuento, cantidad_disponible, categoria, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT DO NOTHING`,
        [product.store_id, product.nombre, product.descripcion, product.precio_original, product.precio_descuento, product.cantidad_disponible, product.categoria]
      );
      count++;
    }

    console.log(`✓ Se insertaron ${count} productos completos`);
  } catch (err) {
    console.error('Error insertando productos:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedCompleteProducts();
