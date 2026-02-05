const pool = require('./index');
const bcrypt = require('bcryptjs');

async function createUsers() {
  try {
    const users = [
      { name: 'Comprador Demo', email: 'comprador1@test.com', role: 'buyer' },
      { name: 'Tacos Don Rafa', email: 'comercio.tacosdonrafa@test.com', role: 'seller' },
      { name: 'Admin', email: 'admin@delicrunch.com', role: 'admin' },
    ];

    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);

    for (const u of users) {
      // Upsert: si existe el email, actualizar password y role
      await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role RETURNING id`,
        [u.name, u.email, hash, u.role]
      );
      console.log('Upserted user:', u.email);
    }

    console.log('Usuarios quick created/updated.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error creating users:', err);
    process.exit(1);
  }
}

createUsers();
