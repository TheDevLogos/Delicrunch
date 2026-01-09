const pool = require('../db');
const bcrypt = require('bcryptjs');

async function ensureAdminUser() {
  const email = 'admindeli@delicrunch.com';
  const nombre = 'Admin Delicrunch';
  const password = 'Admin1234';
  const rol = 'admin';

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    if (existing.rows.length > 0) {
      // Actualizar contraseña por si está desincronizada
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
      console.log('✓ Usuario admin ya existe (contraseña sincronizada)');
      return;
    }

    const insert = await pool.query(
      'INSERT INTO users (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre, email, passwordHash, rol]
    );
    console.log('✓ Usuario admin creado con id:', insert.rows[0].id);
  } catch (err) {
    console.error('Error creando usuario admin:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

ensureAdminUser();
