const pool = require('./index');

/**
 * seed-flash-deals.js
 * Crea al menos 10 productos con descuento >= 50% distribuidos entre tiendas existentes.
 */

const SAMPLE_NAMES = [
  'Pack Fiesta Gourmet',
  'Sorpresa Veggie Deluxe',
  'Caja de Postres Premium',
  'Pack Desayuno Express',
  'Combo Cena Familiar',
  'Bolsa Sorpresa Saludable',
  'Pack Bocadillos Artesanales',
  'Selección de Panes y Dulces',
  'Pack Snack Nocturno',
  'Caja Frutas + Yogur',
  'Pack Tacos Callejeros',
  'Pack Pizza Party'
];

const SAMPLE_CATS = ['Repostería','Panadería','Desayuno','Cena','Vegano','Cafetería','Snacks','Pizza','Tacos','Saludable'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedFlashDeals() {
  try {
    const storesRes = await pool.query('SELECT id, nombre_comercio FROM stores WHERE activo = true');
    const stores = storesRes.rows;
    if (stores.length === 0) {
      console.log('⚠️ No se encontraron tiendas activas. Crea tiendas primero.');
      process.exitCode = 1;
      return;
    }

    const totalToCreate = 10;
    let created = 0;

    for (let i = 0; i < totalToCreate; i++) {
      const store = stores[i % stores.length];
      const name = SAMPLE_NAMES[i % SAMPLE_NAMES.length] + (i >= SAMPLE_NAMES.length ? ` ${i}` : '');

      // Precio original entre 80 y 500
      const precio_original = Number((Math.random() * 420 + 80).toFixed(2));
      // Descuento entre 50% y 80%
      const discountPercent = randomInt(50, 80);
      const precio_descuento = Number((precio_original * (1 - discountPercent / 100)).toFixed(2));

      const cantidad_disponible = randomInt(3, 20);
      const categoria = SAMPLE_CATS[i % SAMPLE_CATS.length];
      const descripcion = `Pack especial (${categoria}) de ${store.nombre_comercio}. Incluye variedad seleccionada por el comercio.`;
      const tipo_contenido = 'Puede contener: productos frescos, preparados del día.';

      // Imagen aleatoria reproducible
      const seed = `flash-deal-${Date.now()}-${i}`;
      const imagen_url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;

      // Horarios de recogida: entre 12:00 y 21:00
      const startHour = randomInt(12, 18);
      const endHour = startHour + randomInt(1, 4);
      const hora_recogida_inicio = `${String(startHour).padStart(2,'0')}:00`;
      const hora_recogida_fin = `${String(Math.min(endHour,23)).padStart(2,'0')}:00`;

      await pool.query(
        `INSERT INTO products (store_id, nombre, descripcion, precio_original, precio_descuento, cantidad_disponible, categoria, tipo_contenido, imagen_url, hora_recogida_inicio, hora_recogida_fin, dias_disponibles, activo, destacado)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,true)`,
        [store.id, name, descripcion, precio_original, precio_descuento, cantidad_disponible, categoria, tipo_contenido, imagen_url, hora_recogida_inicio, hora_recogida_fin, 'lun,mar,mie,jue,vie']
      );
      created++;
      console.log(`✓ Insertado: ${name} @ ${store.nombre_comercio} (-${discountPercent}%, stock: ${cantidad_disponible})`);
    }

    console.log(`
✅ Se insertaron ${created} flash deals con descuento >=50%`);
  } catch (err) {
    console.error('Error en seed-flash-deals:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seedFlashDeals();
