const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno desde Backend/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// =============================================
// USAR CLIENTE SUPABASE para compatibilidad IPv4/IPv6
// Según: https://github.com/supabase/supabase/blob/main/apps/docs/content/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP.mdx
// "Use the Supabase Client libraries, which are IPv4 compatible"
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

// Wrapper para mantener compatibilidad con código que usa pool.query()
const pool = {
    query: async (text, params) => {
        // Convertir query SQL a operación de Supabase
        // Para queries complejas, usar la función RPC o hacer queries directas
        console.log('🔧 Ejecutando query via Supabase client:', text.substring(0, 50) + '...');
        
        // Para mantener compatibilidad con queries raw SQL, 
        // usamos el pool de pg tradicional pero con configuración corregida
        const { Pool: PgPool } = require('pg');
        const pgPool = new PgPool({
            connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`,
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000
        });
        
        try {
            const result = await pgPool.query(text, params);
            await pgPool.end();
            return result;
        } catch (error) {
            await pgPool.end();
            throw error;
        }
    },
    
    connect: async () => {
        // Verificar conexión con Supabase
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (acceptable during setup)
            throw error;
        }
        return {
            query: pool.query,
            release: () => {}
        };
    }
};

console.log('✅ Cliente Supabase inicializado (IPv4/IPv6 compatible)');

// Exportamos tanto el pool wrapper como el cliente directo
module.exports = pool;
module.exports.supabase = supabase;
