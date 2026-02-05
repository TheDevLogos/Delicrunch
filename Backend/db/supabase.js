// =============================================
// CONFIGURACIÓN DE SUPABASE PARA BACKEND
// =============================================

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// =============================================
// OPCIÓN 1: Cliente Supabase JS (Recomendado)
// =============================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// =============================================
// OPCIÓN 2: Pool de PostgreSQL directo
// (Compatible con código existente)
// =============================================
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Necesario para Supabase
    }
});

// Función para verificar la conexión
const checkConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ Conexión con Supabase establecida exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con Supabase:', error.message);
        return false;
    }
};

// Función para verificar conexión PostgreSQL directa
const checkPoolConnection = async () => {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Conexión PostgreSQL con Supabase establecida exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con PostgreSQL de Supabase:', error.message);
        return false;
    }
};

// Exportar ambas opciones
module.exports = {
    supabase,      // Cliente Supabase JS
    pool,          // Pool PostgreSQL directo (compatible con código existente)
    checkConnection,
    checkPoolConnection
};
