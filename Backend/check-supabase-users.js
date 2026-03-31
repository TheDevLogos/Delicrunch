const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 REVISANDO USUARIOS EN SUPABASE\n');
    console.log('='.repeat(60));
    
    const result = await client.query(`
      SELECT 
        id,
        nombre as name,
        email,
        rol as role,
        ciudad as city,
        telefono as phone,
        activo as is_active,
        verificado as is_verified,
        fecha_creacion as created_at
      FROM usuarios
      ORDER BY rol, nombre
    `);
    
    console.log(`\n📊 Total de usuarios: ${result.rows.length}\n`);
    
    // Agrupar por rol
    const byRole = {
      admin: [],
      comercio: [],
      comprador: []
    };
    
    result.rows.forEach(user => {
      byRole[user.role] = byRole[user.role] || [];
      byRole[user.role].push(user);
    });
    
    // Mostrar admin
    console.log('👑 ADMINISTRADORES:');
    console.log('-'.repeat(60));
    if (byRole.admin && byRole.admin.length > 0) {
      byRole.admin.forEach(u => {
        console.log(`   ✅ ${u.name}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      Activo: ${u.is_active ? 'Sí' : 'No'}`);
        console.log(`      Verificado: ${u.is_verified ? 'Sí' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No hay administradores\n');
    }
    
    // Mostrar comercios
    console.log('🏪 COMERCIOS:');
    console.log('-'.repeat(60));
    if (byRole.comercio && byRole.comercio.length > 0) {
      byRole.comercio.forEach(u => {
        console.log(`   ✅ ${u.name}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      Ciudad: ${u.city || 'N/A'}`);
        console.log(`      Teléfono: ${u.phone || 'N/A'}`);
        console.log(`      Activo: ${u.is_active ? 'Sí' : 'No'}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No hay comercios registrados\n');
    }
    
    // Mostrar compradores
    console.log('🛒 COMPRADORES:');
    console.log('-'.repeat(60));
    if (byRole.comprador && byRole.comprador.length > 0) {
      byRole.comprador.forEach(u => {
        console.log(`   ✅ ${u.name}`);
        console.log(`      Email: ${u.email}`);
        console.log(`      Ciudad: ${u.city || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('   ❌ No hay compradores\n');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers();
