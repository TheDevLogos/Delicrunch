const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Usuarios con sus nuevas contraseñas
const USERS = [
  {
    email: 'admin@delicrunch.com',
    password: 'Admin123!',
    rol: 'admin',
    nombre: 'Admin Delicrunch'
  },
  {
    email: 'comercio@delicrunch.com', 
    password: 'Comercio123!',
    rol: 'comercio',
    nombre: 'Taquería las Delicias'
  },
  {
    email: 'pizza@delicrunch.com',
    password: 'Comercio123!',
    rol: 'comercio',
    nombre: 'Pizza Orsinis'
  },
  {
    email: 'cafe@delicrunch.com',
    password: 'Comercio123!',
    rol: 'comercio',
    nombre: 'Café Placeres'
  },
  {
    email: 'testbuyer2@delicrunch.com',
    password: 'Test1234!',
    rol: 'comprador',
    nombre: 'Test Buyer'
  }
];

async function updatePasswords() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 ACTUALIZANDO CONTRASEÑAS DE USUARIOS\n');
    console.log('='.repeat(70));
    
    for (const user of USERS) {
      console.log(`\n📝 Procesando: ${user.nombre} (${user.email})`);
      
      // Hash de la contraseña
      const passwordHash = await bcrypt.hash(user.password, 10);
      console.log(`   🔑 Hash generado: ${passwordHash.substring(0, 30)}...`);
      
      // Verificar si el usuario existe
      const check = await client.query(
        'SELECT id, nombre, email, rol FROM users WHERE email = $1',
        [user.email]
      );
      
      if (check.rows.length > 0) {
        // Usuario existe - actualizar contraseña
        await client.query(
          'UPDATE users SET password_hash = $1 WHERE email = $2',
          [passwordHash, user.email]
        );
        console.log(`   ✅ Contraseña actualizada`);
      } else {
        // Usuario no existe - crear nuevo
        await client.query(`
          INSERT INTO users (nombre, email, password_hash, rol, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [user.nombre, user.email, passwordHash, user.rol]);
        console.log(`   ✅ Usuario creado`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ CONTRASEÑAS ACTUALIZADAS EXITOSAMENTE\n');
    console.log('📋 CREDENCIALES PARA ACCESO:\n');
    console.log('👑 ADMIN:');
    console.log('   Email: admin@delicrunch.com');
    console.log('   Password: Admin123!\n');
    console.log('🏪 COMERCIOS:');
    console.log('   Email: comercio@delicrunch.com');
    console.log('   Password: Comercio123!');
    console.log('   ---');
    console.log('   Email: pizza@delicrunch.com');
    console.log('   Password: Comercio123!');
    console.log('   ---');
    console.log('   Email: cafe@delicrunch.com');
    console.log('   Password: Comercio123!\n');
    console.log('🛒 COMPRADOR:');
    console.log('   Email: testbuyer2@delicrunch.com');
    console.log('   Password: Test1234!\n');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updatePasswords();
