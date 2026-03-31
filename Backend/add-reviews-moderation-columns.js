const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addModerationColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 AÑADIENDO COLUMNAS DE MODERACIÓN A TABLA REVIEWS\n');
    console.log('='.repeat(70));
    
    await client.query('BEGIN');
    
    // Verificar y añadir cada columna individualmente
    const columns = [
      { name: 'respuesta_admin', type: 'TEXT', nullable: true },
      { name: 'respuesta_comercio', type: 'TEXT', nullable: true },
      { name: 'fecha_respuesta_admin', type: 'TIMESTAMP WITH TIME ZONE', nullable: true },
      { name: 'fecha_respuesta_comercio', type: 'TIMESTAMP WITH TIME ZONE', nullable: true },
      { name: 'visible', type: 'BOOLEAN', default: 'true' },
      { name: 'moderada', type: 'BOOLEAN', default: 'false' }
    ];
    
    for (const col of columns) {
      // Verificar si la columna ya existe
      const check = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reviews' AND column_name = $1
      `, [col.name]);
      
      if (check.rows.length > 0) {
        console.log(`   ⏭️  ${col.name} - Ya existe, omitiendo`);
        continue;
      }
      
      // Construir query ALTER TABLE
      let alterQuery = `ALTER TABLE reviews ADD COLUMN ${col.name} ${col.type}`;
      
      if (col.default) {
        alterQuery += ` DEFAULT ${col.default}`;
      }
      
      if (col.nullable === true) {
        alterQuery += ` NULL`;
      }
      
      try {
        await client.query(alterQuery);
        console.log(`   ✅ ${col.name} - Añadida exitosamente`);
      } catch (error) {
        console.log(`   ❌ ${col.name} - Error: ${error.message}`);
        throw error;
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Todas las columnas de moderación añadidas correctamente\n');
    
    // Verificar resultado final
    const finalCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'reviews' 
      AND column_name IN ('respuesta_admin', 'respuesta_comercio', 'fecha_respuesta_admin', 
                          'fecha_respuesta_comercio', 'visible', 'moderada')
      ORDER BY column_name
    `);
    
    console.log('📋 VERIFICACIÓN FINAL:\n');
    finalCheck.rows.forEach(col => {
      console.log(`   ✅ ${col.column_name.padEnd(30)} (${col.data_type})`);
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Tabla reviews lista para moderación');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error al añadir columnas:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addModerationColumns();
