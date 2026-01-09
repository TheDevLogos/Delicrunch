const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('./index');
const fs = require('fs');

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✓ Esquema de base de datos aplicado exitosamente');
  } catch (err) {
    console.error('Error aplicando esquema:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
