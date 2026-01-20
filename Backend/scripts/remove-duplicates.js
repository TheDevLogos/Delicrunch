/**
 * Script para detectar y eliminar comercios y productos duplicados
 * Ejecutar con: node Backend/scripts/remove-duplicates.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findDuplicateStores() {
  console.log('\n🔍 Buscando comercios duplicados...\n');
  
  const result = await pool.query(`
    SELECT 
      nombre_comercio,
      direccion,
      user_id,
      COUNT(*) as count,
      array_agg(id ORDER BY created_at) as ids,
      array_agg(created_at ORDER BY created_at) as dates
    FROM stores
    GROUP BY nombre_comercio, direccion, user_id
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);

  if (result.rows.length === 0) {
    console.log('✅ No se encontraron comercios duplicados');
    return [];
  }

  console.log(`⚠️  Se encontraron ${result.rows.length} grupos de comercios duplicados:\n`);
  
  result.rows.forEach((row, idx) => {
    console.log(`${idx + 1}. "${row.nombre_comercio}" - ${row.count} duplicados`);
    console.log(`   IDs: ${row.ids.join(', ')}`);
    console.log(`   Fechas: ${row.dates.map(d => new Date(d).toLocaleDateString()).join(', ')}\n`);
  });

  return result.rows;
}

async function findDuplicateProducts() {
  console.log('\n🔍 Buscando productos duplicados...\n');
  
  const result = await pool.query(`
    SELECT 
      nombre,
      store_id,
      precio_original,
      COUNT(*) as count,
      array_agg(id ORDER BY created_at) as ids,
      array_agg(created_at ORDER BY created_at) as dates
    FROM products
    GROUP BY nombre, store_id, precio_original
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);

  if (result.rows.length === 0) {
    console.log('✅ No se encontraron productos duplicados');
    return [];
  }

  console.log(`⚠️  Se encontraron ${result.rows.length} grupos de productos duplicados:\n`);
  
  result.rows.forEach((row, idx) => {
    console.log(`${idx + 1}. "${row.nombre}" (Store ${row.store_id}) - ${row.count} duplicados`);
    console.log(`   IDs: ${row.ids.join(', ')}`);
    console.log(`   Fechas: ${row.dates.map(d => new Date(d).toLocaleDateString()).join(', ')}\n`);
  });

  return result.rows;
}

async function removeDuplicateStores(duplicates, dryRun = true) {
  if (duplicates.length === 0) return;

  console.log(`\n${dryRun ? '🔍 SIMULACIÓN' : '🗑️  ELIMINANDO'} duplicados de comercios...\n`);

  let totalRemoved = 0;

  for (const dup of duplicates) {
    // Mantener el primero (más antiguo), eliminar el resto
    const [keepId, ...removeIds] = dup.ids;
    
    console.log(`Manteniendo comercio ID ${keepId}, eliminando ${removeIds.length} duplicados: ${removeIds.join(', ')}`);

    if (!dryRun) {
      try {
        // Actualizar referencias en otras tablas primero
        await pool.query('UPDATE products SET store_id = $1 WHERE store_id = ANY($2)', [keepId, removeIds]);
        await pool.query('UPDATE orders SET store_id = $1 WHERE store_id = ANY($2)', [keepId, removeIds]);
        await pool.query('UPDATE reviews SET store_id = $1 WHERE store_id = ANY($2)', [keepId, removeIds]);
        
        // Eliminar duplicados
        const deleteResult = await pool.query('DELETE FROM stores WHERE id = ANY($1)', [removeIds]);
        totalRemoved += deleteResult.rowCount;
        
        console.log(`✅ Eliminados ${deleteResult.rowCount} registros duplicados\n`);
      } catch (error) {
        console.error(`❌ Error eliminando duplicados: ${error.message}\n`);
      }
    }
  }

  if (dryRun) {
    console.log(`\n📊 SIMULACIÓN: Se eliminarían ${duplicates.reduce((sum, d) => sum + (d.count - 1), 0)} comercios duplicados`);
  } else {
    console.log(`\n✅ Total eliminado: ${totalRemoved} comercios duplicados`);
  }
}

async function removeDuplicateProducts(duplicates, dryRun = true) {
  if (duplicates.length === 0) return;

  console.log(`\n${dryRun ? '🔍 SIMULACIÓN' : '🗑️  ELIMINANDO'} duplicados de productos...\n`);

  let totalRemoved = 0;

  for (const dup of duplicates) {
    // Mantener el primero (más antiguo), eliminar el resto
    const [keepId, ...removeIds] = dup.ids;
    
    console.log(`Manteniendo producto ID ${keepId}, eliminando ${removeIds.length} duplicados: ${removeIds.join(', ')}`);

    if (!dryRun) {
      try {
        // Actualizar referencias en otras tablas primero
        await pool.query('UPDATE order_items SET product_id = $1 WHERE product_id = ANY($2)', [keepId, removeIds]);
        await pool.query('UPDATE reviews SET product_id = $1 WHERE product_id = ANY($2)', [keepId, removeIds]);
        
        // Eliminar duplicados
        const deleteResult = await pool.query('DELETE FROM products WHERE id = ANY($1)', [removeIds]);
        totalRemoved += deleteResult.rowCount;
        
        console.log(`✅ Eliminados ${deleteResult.rowCount} registros duplicados\n`);
      } catch (error) {
        console.error(`❌ Error eliminando duplicados: ${error.message}\n`);
      }
    }
  }

  if (dryRun) {
    console.log(`\n📊 SIMULACIÓN: Se eliminarían ${duplicates.reduce((sum, d) => sum + (d.count - 1), 0)} productos duplicados`);
  } else {
    console.log(`\n✅ Total eliminado: ${totalRemoved} productos duplicados`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  try {
    console.log('\n' + '='.repeat(60));
    console.log('  LIMPIEZA DE DUPLICADOS EN BASE DE DATOS');
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('\n⚠️  MODO SIMULACIÓN - No se eliminarán registros');
      console.log('   Para ejecutar realmente, usa: --execute\n');
    } else {
      console.log('\n🔴 MODO EJECUCIÓN - Se eliminarán duplicados\n');
    }

    // Buscar duplicados
    const duplicateStores = await findDuplicateStores();
    const duplicateProducts = await findDuplicateProducts();

    // Mostrar resumen
    const storesTotal = duplicateStores.reduce((sum, d) => sum + (d.count - 1), 0);
    const productsTotal = duplicateProducts.reduce((sum, d) => sum + (d.count - 1), 0);
    
    console.log('\n' + '='.repeat(60));
    console.log('  RESUMEN');
    console.log('='.repeat(60));
    console.log(`Comercios duplicados a eliminar: ${storesTotal}`);
    console.log(`Productos duplicados a eliminar: ${productsTotal}`);
    console.log('='.repeat(60) + '\n');

    if (!dryRun && (storesTotal > 0 || productsTotal > 0)) {
      console.log('⏳ Ejecutando limpieza...\n');
      
      // Eliminar duplicados
      await removeDuplicateStores(duplicateStores, false);
      await removeDuplicateProducts(duplicateProducts, false);
      
      console.log('\n✅ Limpieza completada exitosamente');
    } else if (dryRun) {
      console.log('ℹ️  Ejecuta con --execute para eliminar duplicados');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
