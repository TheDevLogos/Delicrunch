const pool = require('./index');
const bcrypt = require('bcryptjs');

async function seedDemoData() {
  try {
    const passwordHash = await bcrypt.hash('Admin1234', 10);

    // Crear un usuario comercio de ejemplo
    const comercio1 = await pool.query(`
      INSERT INTO users (nombre, email, password_hash, rol)
      VALUES ('Panadería La Espiga', 'espiga@demo.com', $1, 'comercio')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [passwordHash]);

    const comercio2 = await pool.query(`
      INSERT INTO users (nombre, email, password_hash, rol)
      VALUES ('Café Aroma', 'aroma@demo.com', $1, 'comercio')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [passwordHash]);

    // Crear tiendas con ubicaciones en Ciudad de México
    const store1 = await pool.query(`
      INSERT INTO stores (user_id, nombre_comercio, direccion, latitud, longitud, telefono, horario)
      VALUES ($1, 'Panadería La Espiga', 'Av. Insurgentes Sur 123, Col. Roma', 19.4179, -99.1621, '5555-1234', '7:00 AM - 9:00 PM')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [comercio1.rows[0]?.id || 2]);

    const store2 = await pool.query(`
      INSERT INTO stores (user_id, nombre_comercio, direccion, latitud, longitud, telefono, horario)
      VALUES ($1, 'Café Aroma', 'Calle Álvaro Obregón 456, Col. Condesa', 19.4106, -99.1693, '5555-5678', '8:00 AM - 8:00 PM')
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [comercio2.rows[0]?.id || 3]);

    // Crear productos de ejemplo
    await pool.query(`
      INSERT INTO products (store_id, nombre, descripcion, precio_original, precio_descuento, cantidad_disponible, categoria, activo)
      VALUES 
      ($1, 'Pack Pan del Día', 'Variedad de pan fresco del día anterior', 120.00, 60.00, 5, 'Panadería', true),
      ($1, 'Pack Repostería Sorpresa', 'Pasteles y galletas variadas', 200.00, 100.00, 3, 'Repostería', true),
      ($2, 'Pack Café y Pastel', 'Café americano + pastel del día', 150.00, 75.00, 8, 'Cafetería', true),
      ($2, 'Pack Desayuno Express', 'Café + croissant + jugo', 180.00, 90.00, 6, 'Desayuno', true)
      ON CONFLICT DO NOTHING
    `, [store1.rows[0]?.id || 1, store2.rows[0]?.id || 2]);

    console.log('✓ Datos de ejemplo creados: 2 tiendas y 4 productos');
  } catch (err) {
    console.error('Error creando datos de ejemplo:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedDemoData();
