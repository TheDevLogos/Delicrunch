/**
 * Migración para agregar tablas de métricas financieras
 * Ejecutar con: node Backend/db/migrate-metrics.js
 */
const pool = require('./index');

async function runMigration() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Iniciando migración de métricas financieras...');
        
        await client.query('BEGIN');
        
        // 1. Crear tabla de métricas financieras por comercio
        console.log('📊 Creando tabla financial_metrics...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS financial_metrics (
                id SERIAL PRIMARY KEY,
                store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
                fecha DATE NOT NULL,
                -- Métricas del día
                total_ventas DECIMAL(10, 2) DEFAULT 0.00,
                comision_plataforma DECIMAL(10, 2) DEFAULT 0.00,
                ingreso_comercio DECIMAL(10, 2) DEFAULT 0.00,
                numero_ordenes INTEGER DEFAULT 0,
                ordenes_completadas INTEGER DEFAULT 0,
                ordenes_canceladas INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(store_id, fecha)
            );
        `);
        
        // 2. Crear tabla de métricas globales del admin
        console.log('📊 Creando tabla admin_metrics...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS admin_metrics (
                id SERIAL PRIMARY KEY,
                fecha DATE NOT NULL UNIQUE,
                -- Métricas globales del día
                total_ventas DECIMAL(10, 2) DEFAULT 0.00,
                total_comisiones DECIMAL(10, 2) DEFAULT 0.00,
                total_ordenes INTEGER DEFAULT 0,
                ordenes_completadas INTEGER DEFAULT 0,
                ordenes_canceladas INTEGER DEFAULT 0,
                nuevos_usuarios INTEGER DEFAULT 0,
                nuevos_comercios INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // 3. Crear índices
        console.log('🔍 Creando índices...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_financial_metrics_store_fecha 
            ON financial_metrics(store_id, fecha);
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_admin_metrics_fecha 
            ON admin_metrics(fecha);
        `);
        
        // 4. Poblar métricas históricas desde órdenes existentes
        console.log('📈 Poblando métricas históricas...');
        
        // Poblar financial_metrics desde órdenes existentes
        await client.query(`
            INSERT INTO financial_metrics (store_id, fecha, total_ventas, comision_plataforma, ingreso_comercio, numero_ordenes, ordenes_completadas)
            SELECT 
                store_id,
                DATE(created_at) as fecha,
                SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END) as total_ventas,
                SUM(CASE WHEN estado = 'recogido' THEN comision_plataforma ELSE 0 END) as comision_plataforma,
                SUM(CASE WHEN estado = 'recogido' THEN (total - comision_plataforma) ELSE 0 END) as ingreso_comercio,
                COUNT(*) as numero_ordenes,
                COUNT(CASE WHEN estado = 'recogido' THEN 1 END) as ordenes_completadas
            FROM orders
            GROUP BY store_id, DATE(created_at)
            ON CONFLICT (store_id, fecha) DO NOTHING;
        `);
        
        // Poblar admin_metrics desde órdenes existentes
        await client.query(`
            INSERT INTO admin_metrics (fecha, total_ventas, total_comisiones, total_ordenes, ordenes_completadas, ordenes_canceladas)
            SELECT 
                DATE(created_at) as fecha,
                SUM(CASE WHEN estado = 'recogido' THEN total ELSE 0 END) as total_ventas,
                SUM(CASE WHEN estado = 'recogido' THEN comision_plataforma ELSE 0 END) as total_comisiones,
                COUNT(*) as total_ordenes,
                COUNT(CASE WHEN estado = 'recogido' THEN 1 END) as ordenes_completadas,
                COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as ordenes_canceladas
            FROM orders
            GROUP BY DATE(created_at)
            ON CONFLICT (fecha) DO NOTHING;
        `);
        
        await client.query('COMMIT');
        
        console.log('✅ Migración completada exitosamente!');
        console.log('');
        console.log('📊 Resumen:');
        
        const metricsCount = await client.query('SELECT COUNT(*) FROM financial_metrics');
        const adminMetricsCount = await client.query('SELECT COUNT(*) FROM admin_metrics');
        
        console.log(`   - ${metricsCount.rows[0].count} registros en financial_metrics`);
        console.log(`   - ${adminMetricsCount.rows[0].count} registros en admin_metrics`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en la migración:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar migración
runMigration()
    .then(() => {
        console.log('🎉 Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
