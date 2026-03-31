const fs = require('fs');
const pool = require('./db');

async function runMigration() {
    try {
        console.log('📋 Leyendo archivo de migración...');
        const sql = fs.readFileSync('./db/migrations/complete_mercadopago_migration.sql', 'utf8');
        
        console.log('🔄 Ejecutando migración...');
        await pool.query(sql);
        
        console.log('✅ Migración completada exitosamente');
        
        // Verificar que la tabla se creó
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payment_preferences'
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Tabla payment_preferences creada correctamente');
        } else {
            console.log('⚠️ Tabla payment_preferences no encontrada');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error ejecutando migración:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

runMigration();
