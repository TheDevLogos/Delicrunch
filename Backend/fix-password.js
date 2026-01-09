const bcrypt = require('bcryptjs');
const pool = require('./db');

(async () => {
  try {
    const r = await pool.query("SELECT id, email, password_hash FROM users WHERE email = 'admindeli@delicrunch.com'");
    if (r.rows.length === 0) {
      console.log('Usuario NO encontrado');
      process.exit(1);
    }
    const user = r.rows[0];
    console.log('Usuario:', user.email);
    
    const match = await bcrypt.compare('Admin1234', user.password_hash);
    console.log('Password match:', match);
    
    if (match === false) {
      const newHash = await bcrypt.hash('Admin1234', 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
      console.log('Password actualizado a Admin1234');
    } else {
      console.log('Password ya es correcto');
    }
    
    // Test login
    const testMatch = await bcrypt.compare('Admin1234', (await pool.query("SELECT password_hash FROM users WHERE email = 'admindeli@delicrunch.com'")).rows[0].password_hash);
    console.log('Verificación final:', testMatch);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
