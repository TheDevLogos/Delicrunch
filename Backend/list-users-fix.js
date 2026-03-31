const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function listUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 USUARIOS ACTUALES EN SUPABASE\n');
    console.log('='.repeat(70));
    
    const result = await client.query(`
      SELECT 
        id,
        nombre,
        email,
        rol,
        created_at
      FROM users
      WHERE nombre IS NOT NULL
      ORDER BY 
        CASE 
          WHEN rol = 'admin' THEN 1
          WHEN rol = 'comercio' THEN 2
          WHEN rol = 'comprador' THEN 3
          ELSE 4
        END,
        nombre
    `);
    
    console.log(`\n📊 Total de usuarios: ${result.rows.length}\n`);
    
    // Agrupar por rol
    const byRole = {
      admin: [],
      comercio: [],
      comprador: []
    };
    
    result.rows.forEach(user => {
      const role = user.rol || 'unknown';
      if (!byRole[role]) byRole[role] = [];
      byRole[role].push(user);
    });
    
    // Mostrar admin
    if (byRole.admin && byRole.admin.length > 0) {
      console.log('👑 ADMINISTRADORES:');
      console.log('-'.repeat(70));
      byRole.admin.forEach(u => {
        console.log(`   ✅ ${u.nombre}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      ID: ${u.id}`);
        console.log('');
      });
    } else {
      console.log('👑 ADMINISTRADORES:');
      console.log('-'.repeat(70));
      console.log('   ❌ No hay administradores\n');
    }
    
    // Mostrar comercios
    if (byRole.comercio && byRole.comercio.length > 0) {
      console.log('🏪 COMERCIOS:');
      console.log('-'.repeat(70));
      byRole.comercio.forEach(u => {
        console.log(`   ✅ ${u.nombre}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      ID: ${u.id}`);
        console.log('');
      });
    } else {
      console.log('🏪 COMERCIOS:');
      console.log('-'.repeat(70));
      console.log('   ❌ No hay comercios\n');
    }
    
    // Mostrar compradores
    if (byRole.comprador && byRole.comprador.length > 0) {
      console.log('🛒 COMPRADORES:');
      console.log('-'.repeat(70));
      byRole.comprador.forEach(u => {
        console.log(`   ✅ ${u.nombre}`);
        console.log(`      Email: ${u.email}`);
        console.log('');
      });
    } else {
      console.log('🛒 COMPRADORES:');
      console.log('-'.repeat(70));
      console.log('   ❌ No hay compradores\n');
    }
    
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

listUsers();
