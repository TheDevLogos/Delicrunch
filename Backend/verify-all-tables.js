const pool = require('./db');

async function verifyAllTables() {
    try {
        console.log('🔍 VERIFICANDO ESTRUCTURA DE TODAS LAS TABLAS\n');
        console.log('='.repeat(80));
        
        const tables = ['users', 'products', 'stores', 'orders', 'profiles', 'payment_preferences', 'payment_intents'];
        
        for (const tableName of tables) {
            console.log(`\n📋 Tabla: ${tableName.toUpperCase()}`);
            console.log('-'.repeat(80));
            
            const result = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            
            if (result.rows.length === 0) {
                console.log(`⚠️  Tabla no existe`);
            } else {
                result.rows.forEach(col => {
                    const nullable = col.is_nullable === 'YES' ? 'nullable' : 'NOT NULL';
                    const def = col.column_default ? `default: ${col.column_default}` : '';
                    console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)} ${nullable.padEnd(10)} ${def}`);
                });
                
                // Contar registros
                const count = await pool.query(`SELECT COUNT(*) as total FROM ${tableName}`);
                console.log(`\n  📊 Total de registros: ${count.rows[0].total}`);
            }
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ Verificación completa\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyAllTables();
