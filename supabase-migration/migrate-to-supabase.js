#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN DE DATOS A SUPABASE
 * 
 * Este script migra los datos existentes de tu base de datos local
 * a la nueva base de datos de Supabase.
 * 
 * PRERREQUISITOS:
 * 1. Ya debes haber ejecutado el esquema SQL en Supabase (01-initial-schema.sql)
 * 2. Debes tener las credenciales de Supabase configuradas en .env
 * 3. Tu base de datos local debe estar activa y accesible
 * 
 * USO:
 * node migrate-to-supabase.js
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// =============================================
// CONFIGURACIÓN DE CONEXIONES
// =============================================

// Pool de la base de datos LOCAL (origen)
const localPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'delicrunch',
    password: 'Qazwsx1234',
    port: 5432,
});

// Pool de la base de datos SUPABASE (destino)
const supabasePool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

// =============================================
// ORDEN DE TABLAS PARA MIGRACIÓN
// (Respetando las foreign keys)
// =============================================
const TABLES_ORDER = [
    'users',
    'stores',
    'profiles',
    'products',
    'saved_cards',
    'orders',
    'order_items',
    'reviews',
    'favorites',
    'notifications',
    'financial_metrics',
    'admin_metrics',
    'payment_intents'
];

// =============================================
// FUNCIONES AUXILIARES
// =============================================

async function testConnections() {
    console.log('\n🔍 Verificando conexiones...\n');
    
    try {
        await localPool.query('SELECT NOW()');
        console.log('✅ Conexión LOCAL establecida');
    } catch (error) {
        console.error('❌ Error conectando a la base de datos LOCAL:', error.message);
        throw error;
    }
    
    try {
        await supabasePool.query('SELECT NOW()');
        console.log('✅ Conexión SUPABASE establecida\n');
    } catch (error) {
        console.error('❌ Error conectando a SUPABASE:', error.message);
        throw error;
    }
}

async function getTableRowCount(pool, tableName) {
    try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        return parseInt(result.rows[0].count);
    } catch (error) {
        // Si la tabla no existe, retornar 0
        return 0;
    }
}

async function migrateTable(tableName) {
    console.log(`\n📦 Migrando tabla: ${tableName}`);
    console.log('─'.repeat(50));
    
    try {
        // Contar registros en origen
        const sourceCount = await getTableRowCount(localPool, tableName);
        console.log(`   📊 Registros en origen: ${sourceCount}`);
        
        if (sourceCount === 0) {
            console.log('   ⚠️  No hay datos para migrar');
            return { success: true, migrated: 0 };
        }
        
        // Obtener todos los datos de la tabla origen
        const result = await localPool.query(`SELECT * FROM ${tableName}`);
        const rows = result.rows;
        
        if (rows.length === 0) {
            console.log('   ⚠️  No hay datos para migrar');
            return { success: true, migrated: 0 };
        }
        
        // Obtener los nombres de las columnas
        const columns = Object.keys(rows[0]);
        const columnsList = columns.join(', ');
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        
        // Insertar cada registro en Supabase
        let migrated = 0;
        let errors = 0;
        
        for (const row of rows) {
            try {
                const values = columns.map(col => row[col]);
                const query = `
                    INSERT INTO ${tableName} (${columnsList})
                    VALUES (${placeholders})
                    ON CONFLICT DO NOTHING
                `;
                
                await supabasePool.query(query, values);
                migrated++;
                
                // Mostrar progreso cada 10 registros
                if (migrated % 10 === 0) {
                    console.log(`   ⏳ Progreso: ${migrated}/${rows.length}`);
                }
            } catch (error) {
                errors++;
                console.error(`   ❌ Error en registro ${migrated + errors}:`, error.message);
            }
        }
        
        // Verificar el conteo final en destino
        const destCount = await getTableRowCount(supabasePool, tableName);
        
        console.log(`   ✅ Migración completada`);
        console.log(`   📊 Registros migrados: ${migrated}`);
        console.log(`   📊 Total en destino: ${destCount}`);
        if (errors > 0) {
            console.log(`   ⚠️  Errores: ${errors}`);
        }
        
        return { success: true, migrated, errors };
        
    } catch (error) {
        console.error(`   ❌ Error migrando ${tableName}:`, error.message);
        return { success: false, error: error.message };
    }
}

async function resetSequences() {
    console.log('\n🔄 Reseteando secuencias de IDs...\n');
    
    for (const tableName of TABLES_ORDER) {
        try {
            // Obtener el valor máximo actual del id
            const result = await supabasePool.query(`
                SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM ${tableName}
            `);
            const nextId = result.rows[0].next_id;
            
            // Resetear la secuencia
            await supabasePool.query(`
                SELECT setval('${tableName}_id_seq', ${nextId}, false)
            `);
            
            console.log(`   ✅ ${tableName}: secuencia ajustada a ${nextId}`);
        } catch (error) {
            console.log(`   ⚠️  ${tableName}: ${error.message}`);
        }
    }
}

// =============================================
// FUNCIÓN PRINCIPAL
// =============================================

async function main() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  MIGRACIÓN DE DELICRUNCH A SUPABASE       ║');
    console.log('╚════════════════════════════════════════════╝');
    
    const startTime = Date.now();
    let totalMigrated = 0;
    let totalErrors = 0;
    
    try {
        // 1. Verificar conexiones
        await testConnections();
        
        // 2. Migrar cada tabla en orden
        console.log('\n📋 Iniciando migración de datos...\n');
        
        for (const tableName of TABLES_ORDER) {
            const result = await migrateTable(tableName);
            if (result.success) {
                totalMigrated += result.migrated || 0;
                totalErrors += result.errors || 0;
            }
        }
        
        // 3. Resetear secuencias
        await resetSequences();
        
        // 4. Resumen final
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║  MIGRACIÓN COMPLETADA                     ║');
        console.log('╚════════════════════════════════════════════╝');
        console.log(`\n✅ Total de registros migrados: ${totalMigrated}`);
        if (totalErrors > 0) {
            console.log(`⚠️  Total de errores: ${totalErrors}`);
        }
        console.log(`⏱️  Tiempo total: ${duration}s\n`);
        
        console.log('📝 PRÓXIMOS PASOS:');
        console.log('   1. Verifica los datos en Supabase Dashboard');
        console.log('   2. Actualiza las credenciales en Backend/.env');
        console.log('   3. Reinicia tu servidor backend');
        console.log('   4. Prueba la aplicación con Supabase\n');
        
    } catch (error) {
        console.error('\n❌ Error fatal durante la migración:', error);
    } finally {
        // Cerrar conexiones
        await localPool.end();
        await supabasePool.end();
    }
}

// =============================================
// EJECUTAR
// =============================================

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
