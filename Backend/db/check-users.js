const pool = require('./index');
const bcrypt = require('bcryptjs');

async function checkAndUpdate() {
  try {
    // Verificar usuarios actuales
    const result = await pool.query("SELECT id, email, role, substring(password, 1, 30) as pwd FROM users WHERE email IN ('comprador1@test.com', 'comercio.tacosdonrafa@test.com', 'admin@delicrunch.com')");
    console.log('Usuarios actuales:');
    result.rows.forEach(u => console.log(`  - ${u.email} (${u.role}): pwd=${u.pwd}`));
    
    // Verificar si admin existe
    const adminCheck = result.rows.find(u => u.email === 'admin@delicrunch.com');
    if (!adminCheck) {
      console.log('\n⚠️  Admin no existe, creándolo...');
      const hash = await bcrypt.hash('password123', 10);
      await pool.query("INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@delicrunch.com', $1, 'admin')", [hash]);
      console.log('✅ Admin creado');
    } else {
      console.log('\n✅ Admin ya existe');
    }
    
    // Verificar password de cada uno
    console.log('\nVerificando contraseñas con password123:');
    const finalUsers = await pool.query("SELECT email, password FROM users WHERE email IN ('comprador1@test.com', 'comercio.tacosdonrafa@test.com', 'admin@delicrunch.com')");
    for (const user of finalUsers.rows) {
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log(`  - ${user.email}: ${isMatch ? '✅ password123 funciona' : '❌ password123 NO funciona'}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndUpdate();
