const pool = require('./db');

async function createPaymentPreferencesTable() {
    try {
        console.log('📋 Creando tabla payment_preferences...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_preferences (
                id SERIAL PRIMARY KEY,
                mercadopago_preference_id VARCHAR(255) UNIQUE NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                store_id INTEGER,
                -- Montos
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
                platform_fee_amount DECIMAL(10,2),
                merchant_amount DECIMAL(10,2),
                -- Estado
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                -- Metadata
                metadata JSONB,
                external_reference TEXT,
                -- Auditoría
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Tabla payment_preferences creada');
        
        // Crear índices
        console.log('📋 Creando índices...');
        
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_preferences_user ON payment_preferences(user_id);
            CREATE INDEX IF NOT EXISTS idx_payment_preferences_product ON payment_preferences(product_id);
            CREATE INDEX IF NOT EXISTS idx_payment_preferences_store ON payment_preferences(store_id);
            CREATE INDEX IF NOT EXISTS idx_payment_preferences_status ON payment_preferences(status);
        `);
        
        console.log('✅ Índices creados');
        
        // Verificar
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'payment_preferences'
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Tabla payment_preferences verificada correctamente');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

createPaymentPreferencesTable();
