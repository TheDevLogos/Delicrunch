const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkReviewsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 VERIFICANDO SCHEMA DE TABLA REVIEWS\n');
    console.log('='.repeat(70));
    
    // Verificar si existe la tabla reviews
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'reviews'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ La tabla reviews no existe\n');
      return;
    }
    
    console.log('✅ Tabla reviews encontrada\n');
    
    // Obtener columnas
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'reviews'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 COLUMNAS DE LA TABLA REVIEWS:\n');
    columns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`   ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)} ${nullable}${def}`);
    });
    
    console.log('\n' + '='.repeat(70));
    
    // Verificar columnas específicas que necesitamos
    const requiredColumns = [
      'respuesta_admin',
      'respuesta_comercio', 
      'fecha_respuesta_admin',
      'fecha_respuesta_comercio',
      'visible',
      'moderada'
    ];
    
    console.log('\n🔍 VERIFICANDO COLUMNAS PARA MODERACIÓN:\n');
    
    for (const colName of requiredColumns) {
      const exists = columns.rows.find(c => c.column_name === colName);
      if (exists) {
        console.log(`   ✅ ${colName} - EXISTE`);
      } else {
        console.log(`   ❌ ${colName} - NO EXISTE (necesita ser agregada)`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    
    // Verificar cantidad de reseñas
    const count = await client.query('SELECT COUNT(*) FROM reviews');
    console.log(`\n📊 Total de reseñas en la base: ${count.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkReviewsSchema();
