const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const path = require('path');

// Cargar variables de entorno desde Backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// =============================================
// POOL PERSISTENTE DE POSTGRESQL
// Se inicializa UNA VEZ y se reutiliza en todas las queries
// Transaction Pooler de Supabase (puerto 6543) - compatible con IPv4/IPv6
// =============================================
const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    // Límites conservadores para Transaction Pooler de Supabase
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
});

pgPool.on('error', (err) => {
    console.error('❌ Error inesperado en pg pool:', err.message);
});

// =============================================
// CLIENTE SUPABASE (para operaciones con Auth y Storage)
// =============================================
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        db: {
            schema: 'public'
        }
    }
);

// API compatible con todo el código existente que usa pool.query() y pool.connect()
const pool = {
    query: (text, params) => {
        return pgPool.query(text, params);
    },
    connect: () => {
        return pgPool.connect();
    },
    end: () => {
        return pgPool.end();
    },
};

// Exportar pool y cliente de Supabase
module.exports = pool;
module.exports.supabase = supabase;
module.exports.pgPool = pgPool;

console.log('✅ Pool PostgreSQL inicializado (IPv4/IPv6 compatible)');
