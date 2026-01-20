require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  try {
    const total = await pool.query('SELECT COUNT(*) as total FROM stores');
    console.log('\n✅ Total comercios:', total.rows[0].total);
    
    const dups = await pool.query(`
      SELECT nombre_comercio, direccion, COUNT(*) as count 
      FROM stores 
      GROUP BY nombre_comercio, direccion 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Comercios duplicados:', dups.rows.length);
    dups.rows.forEach(d => {
      console.log(`  - ${d.nombre_comercio} (${d.count} duplicados)`);
    });
    
    const prodDups = await pool.query(`
      SELECT nombre, store_id, COUNT(*) as count 
      FROM products 
      GROUP BY nombre, store_id 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    console.log('\n📦 Productos duplicados (top 10):', prodDups.rows.length);
    prodDups.rows.forEach(d => {
      console.log(`  - ${d.nombre} en store ${d.store_id} (${d.count} duplicados)`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

check();
