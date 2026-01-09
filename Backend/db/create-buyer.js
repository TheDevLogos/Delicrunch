/**
 * Script para crear un usuario comprador de prueba
 */

const pool = require('./index');
const bcrypt = require('bcryptjs');

const createBuyerUser = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('👤 Creando usuario comprador de prueba...\n');

    // Password hash
    const passwordHash = await bcrypt.hash('Comprador123', 10);
    
    // Crear usuario comprador
    const userResult = await client.query(
      `INSERT INTO users (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, 'comprador')
       ON CONFLICT (email) DO UPDATE 
       SET nombre = EXCLUDED.nombre, password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['Carlos Rodríguez Méndez', 'comprador@delicrunch.com', passwordHash]
    );
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Usuario creado: comprador@delicrunch.com`);

    // Crear perfil completo del comprador
    await client.query(
      `INSERT INTO profiles (user_id, telefono, direccion, ciudad, preferencias_alimentarias, foto_perfil)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE 
       SET telefono = EXCLUDED.telefono,
           direccion = EXCLUDED.direccion,
           ciudad = EXCLUDED.ciudad,
           preferencias_alimentarias = EXCLUDED.preferencias_alimentarias,
           foto_perfil = EXCLUDED.foto_perfil`,
      [
        userId,
        '+52 639 123 4567',
        'Calle Insurgentes 123, Col. Centro, Delicias, Chih.',
        'Delicias, Chihuahua',
        ['Sin restricciones'],
        'https://i.pravatar.cc/300?img=12'
      ]
    );
    
    console.log(`✅ Perfil completo creado`);

    await client.query('COMMIT');
    
    console.log('\n════════════════════════════════════════');
    console.log('✅ USUARIO COMPRADOR CREADO');
    console.log('════════════════════════════════════════');
    console.log('📧 Email: comprador@delicrunch.com');
    console.log('🔐 Password: Comprador123');
    console.log('📍 Ciudad: Delicias, Chihuahua');
    console.log('════════════════════════════════════════\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando usuario:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  createBuyerUser()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = createBuyerUser;
