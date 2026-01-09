/**
 * Seed Admin User - Crear usuario administrador
 * Ejecutar: node db/seed-admin.js
 */
const pool = require('./index');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  console.log('🔧 Creando usuario administrador...\n');

  const adminEmail = 'admindeli@delicrunch.com';
  const adminPassword = 'admin123'; // Cambiar en producción
  const adminName = 'Administrador Delicrunch';

  try {
    // Verificar si ya existe
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existing.rows.length > 0) {
      // Actualizar a rol admin si existe pero no es admin
      await pool.query(
        'UPDATE users SET rol = $1 WHERE email = $2',
        ['admin', adminEmail]
      );
      console.log('✅ Usuario admin actualizado:', adminEmail);
      console.log('   Rol: admin');
      console.log('   Password: (sin cambios)');
      return;
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Crear usuario admin
    const result = await pool.query(
      `INSERT INTO users (nombre, email, password, rol, avatar_icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, rol`,
      [adminName, adminEmail, hashedPassword, 'admin', 'shield-checkmark']
    );

    console.log('✅ Usuario administrador creado exitosamente!\n');
    console.log('   📧 Email:', adminEmail);
    console.log('   🔑 Password:', adminPassword);
    console.log('   👤 Nombre:', adminName);
    console.log('   🛡️  Rol: admin');
    console.log('   🆔 ID:', result.rows[0].id);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña en producción!\n');

  } catch (error) {
    console.error('❌ Error creando admin:', error.message);
  } finally {
    await pool.end();
  }
};

createAdmin();
