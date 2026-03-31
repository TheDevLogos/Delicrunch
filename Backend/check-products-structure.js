const pool = require('./db');

async function checkProductsStructure() {
    try {
        console.log('🔍 Verificando estructura de tabla products...\n');
        
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'products'
            ORDER BY ordinal_position
        `);
        
        console.log('Columnas de la tabla products:');
        result.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // También verificar algunos productos
        console.log('\n🔍 Productos en la base de datos:');
        const products = await pool.query('SELECT * FROM products LIMIT 3');
        console.log(`Total encontrados: ${products.rows.length}`);
        if (products.rows.length > 0) {
            console.log('\nPrimer producto:', JSON.stringify(products.rows[0], null, 2));
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkProductsStructure();
