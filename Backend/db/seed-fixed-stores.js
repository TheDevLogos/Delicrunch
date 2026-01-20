const pool = require('./index');

/**
 * Seed seguro para crear/activar tiendas fijas sin crear usuarios/productos
 * - No crea usuarios ni productos
 * - No borra datos existentes
 * - Si la tienda ya existe, la marca como activa y actualiza metadatos mínimos
 */

const STORES = [
  {
    nombre_comercio: 'Delicias Fijo',
    direccion: 'Centro, Delicias, Chihuahua',
    latitud: 28.1910,
    longitud: -105.4708,
    telefono: '+52 639 000 0001',
    horario: 'Lun-Dom 8:00 AM - 10:00 PM',
    descripcion: 'Tienda fija de referencia en Delicias para pruebas locales',
    categoria: 'varios'
  },
  {
    nombre_comercio: 'Meoqui Fijo',
    direccion: 'Centro, Meoqui, Chihuahua',
    latitud: 28.2722,
    longitud: -105.4817,
    telefono: '+52 639 000 0002',
    horario: 'Lun-Dom 8:00 AM - 10:00 PM',
    descripcion: 'Tienda fija de referencia en Meoqui para pruebas locales',
    categoria: 'varios'
  },
  {
    nombre_comercio: 'Camargo Fijo',
    direccion: 'Centro, Camargo, Chihuahua',
    latitud: 27.6833,
    longitud: -105.1667,
    telefono: '+52 639 000 0003',
    horario: 'Lun-Dom 8:00 AM - 10:00 PM',
    descripcion: 'Tienda fija de referencia en Camargo para pruebas locales',
    categoria: 'varios'
  }
];

async function seedFixedStores() {
  const client = await pool.connect();
  try {
    console.log('\n🔒 Iniciando seed seguro de tiendas fijas (no destructivo)');
    await client.query('BEGIN');

    for (const s of STORES) {
      // Buscar por nombre exacto o por dirección aproximada
      const existing = await client.query(
        `SELECT id, nombre_comercio, direccion FROM stores WHERE lower(nombre_comercio) = lower($1) OR lower(direccion) LIKE lower($2) LIMIT 1`,
        [s.nombre_comercio, `%${s.direccion.split(',')[0]}%`]
      );

      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        await client.query(
          `UPDATE stores SET direccion = COALESCE($1, direccion), latitud = COALESCE($2, latitud), longitud = COALESCE($3, longitud), telefono = COALESCE($4, telefono), horario = COALESCE($5, horario), descripcion = COALESCE($6, descripcion), categoria = COALESCE($7, categoria), activo = TRUE, stripe_onboarding_complete = TRUE, updated_at = NOW() WHERE id = $8`,
          [s.direccion, s.latitud, s.longitud, s.telefono, s.horario, s.descripcion, s.categoria, id]
        );
        console.log(`✅ Tienda existente actualizada: ${s.nombre_comercio} (id: ${id})`);
      } else {
        // Insertar sin crear usuario (user_id NULL) para no generar nuevos usuarios
        const insert = await client.query(
          `INSERT INTO stores (user_id, nombre_comercio, direccion, latitud, longitud, telefono, horario, descripcion, categoria, activo, stripe_onboarding_complete)
           VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, TRUE, TRUE)
           RETURNING id`,
          [s.nombre_comercio, s.direccion, s.latitud, s.longitud, s.telefono, s.horario, s.descripcion, s.categoria]
        );
        console.log(`🟢 Tienda creada (user_id=NULL): ${s.nombre_comercio} (id: ${insert.rows[0].id})`);
      }
    }

    await client.query('COMMIT');
    console.log('\n✅ Seed seguro completado. No se crearon usuarios ni productos.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed-fixed-stores:', err.message || err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedFixedStores()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedFixedStores;
