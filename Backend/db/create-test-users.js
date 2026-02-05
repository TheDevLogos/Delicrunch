/**
 * Crear usuarios de prueba para desarrollo
 * Ejecutar: node db/create-test-users.js
 */
const pool = require('./index');
const bcrypt = require('bcryptjs');

const createTestUsers = async () => {
  console.log('👥 Creando usuarios de prueba...\n');

  try {
    // Contraseña común para todos los usuarios de prueba
    const testPassword = 'password123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Usuario Comprador - Delicias
    const comprador = await pool.query(
      `INSERT INTO users (name, email, password, role, city, state)
       VALUES ($1, $2, $3, 'buyer', 'Delicias', 'Chihuahua')
       ON CONFLICT (email) 
       DO UPDATE SET password = EXCLUDED.password
       RETURNING id`,
      ['Comprador Delicias', 'compradordelicias@test.com', hashedPassword]
    );
    console.log('✅ Usuario comprador creado: compradordelicias@test.com');
    console.log(`   ID: ${comprador.rows[0].id}\n`);

    // Usuario Comercio - Tacos el Norteño
    const comercio = await pool.query(
      `INSERT INTO users (name, email, password, role, city, state)
       VALUES ($1, $2, $3, 'seller', 'Delicias', 'Chihuahua')
       ON CONFLICT (email) 
       DO UPDATE SET password = EXCLUDED.password, role = 'seller'
       RETURNING id`,
      ['Tacos el Norteño', 'comerciotacoselNorteno@test.com', hashedPassword]
    );
    console.log('✅ Usuario comercio creado: comerciotacoselNorteno@test.com');
    console.log(`   ID: ${comercio.rows[0].id}\n`);

    // Usuario Admin
    const adminPassword = 'Admin123!';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
    
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) 
       DO UPDATE SET password = EXCLUDED.password, role = 'admin'`,
      ['Administrador', 'admin@delicrunch.com', hashedAdminPassword]
    );
    console.log('✅ Usuario admin creado: admin@delicrunch.com\n');

    console.log('🎉 Usuarios de prueba creados exitosamente!\n');
    console.log('📋 Credenciales para Quick Login:');
    console.log('   Comprador: compradordelicias@test.com / password123');
    console.log('   Comercio:  comerciotacoselNorteno@test.com / password123');
    console.log('   Admin:     admin@delicrunch.com / Admin123!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuarios de prueba:', error);
    process.exit(1);
  }
};

createTestUsers();
