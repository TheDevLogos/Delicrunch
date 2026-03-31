const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 BUSCANDO TABLA DE USUARIOS\n');
    
    // Buscar tablas que podrían ser de usuarios
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas disponibles:');
    tables.rows.forEach(t => console.log(`   - ${t.table_name}`));
    console.log('');
    
    // Buscar columnas de la tabla users (posible nombre)
    const userTables = tables.rows.filter(t => 
      t.table_name.toLowerCase().includes('user') || 
      t.table_name.toLowerCase().includes('usuario')
    );
    
    if (userTables.length > 0) {
      for (const table of userTables) {
        console.log(`\n🔍 Columnas de tabla "${table.table_name}":`);
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table.table_name]);
        
        columns.rows.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
