const pool = require('./db');
const fs = require('fs');

async function auditCompleteStructure() {
    try {
        console.log('🔍 AUDITORÍA COMPLETA DE ESTRUCTURA DE SUPABASE\n');
        console.log('='.repeat(100));
        
        const report = [];
        
        // 1. Obtener todas las tablas
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        const tables = tablesResult.rows.map(r => r.table_name);
        
        console.log('\n📋 TABLAS ENCONTRADAS:');
        console.log(tables.join(', '));
        report.push(`TABLAS: ${tables.length}`);
        report.push(tables.join(', '));
        
        // 2. Para cada tabla, obtener estructura detallada
        for (const tableName of tables) {
            console.log('\n' + '='.repeat(100));
            console.log(`📊 TABLA: ${tableName.toUpperCase()}`);
            console.log('='.repeat(100));
            
            // Columnas
            const columnsResult = await pool.query(`
                SELECT 
                    column_name, 
                    data_type, 
                    character_maximum_length,
                    is_nullable, 
                    column_default
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            
            console.log('\nCOLUMNAS:');
            report.push(`\n${tableName}:`);
            columnsResult.rows.forEach(col => {
                const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
                const line = `  ${col.column_name.padEnd(35)} ${(col.data_type + length).padEnd(25)} ${nullable.padEnd(10)}${def}`;
                console.log(line);
                report.push(`  ${col.column_name}: ${col.data_type}${length} ${nullable}`);
            });
            
            // Foreign Keys
            const fkResult = await pool.query(`
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = $1
            `, [tableName]);
            
            if (fkResult.rows.length > 0) {
                console.log('\nFOREIGN KEYS:');
                fkResult.rows.forEach(fk => {
                    const line = `  ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`;
                    console.log(line);
                    report.push(`  FK: ${line}`);
                });
            }
            
            // Índices
            const indexResult = await pool.query(`
                SELECT
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE tablename = $1
                AND schemaname = 'public'
            `, [tableName]);
            
            if (indexResult.rows.length > 0) {
                console.log('\nÍNDICES:');
                indexResult.rows.forEach(idx => {
                    console.log(`  ${idx.indexname}`);
                });
            }
            
            // Contar registros
            const countResult = await pool.query(`SELECT COUNT(*) as total FROM ${tableName}`);
            console.log(`\n📊 Total registros: ${countResult.rows[0].total}`);
            report.push(`  Registros: ${countResult.rows[0].total}`);
        }
        
        console.log('\n' + '='.repeat(100));
        console.log('✅ AUDITORÍA COMPLETADA');
        console.log('='.repeat(100));
        
        // Guardar reporte
        fs.writeFileSync('./audit-report.txt', report.join('\n'));
        console.log('\n📄 Reporte guardado en: ./audit-report.txt');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

auditCompleteStructure();
