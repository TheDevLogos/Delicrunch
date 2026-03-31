const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Probando conexión a Supabase...\n');

console.log('Configuración:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✓ Configurada' : '✗ No configurada');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '✓ Configurada' : '✗ No configurada');
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('\n');

// Test 1: Cliente Supabase
console.log('Test 1: Cliente Supabase...');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

supabase
    .from('users')
    .select('count')
    .then(({ data, error }) => {
        if (error) {
            console.log('❌ Error con cliente Supabase:', error.message);
        } else {
            console.log('✅ Cliente Supabase funciona correctamente');
            console.log('Datos:', data);
        }
    })
    .catch(err => {
        console.log('❌ Exception con cliente Supabase:', err.message);
    });

// Test 2: PostgreSQL Direct
console.log('\nTest 2: PostgreSQL Direct Connection...');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
});

pool
    .query('SELECT NOW()')
    .then(result => {
        console.log('✅ PostgreSQL Direct Connection funciona correctamente');
        console.log('Timestamp:', result.rows[0].now);
        pool.end();
    })
    .catch(err => {
        console.log('❌ Error con PostgreSQL:', err.message);
        pool.end();
    });
