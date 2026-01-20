/**
 * Migración: Agregar tabla payment_intents
 * 
 * Esta tabla registra todos los PaymentIntents creados en Stripe
 * para auditoría, seguimiento y debugging
 */

const pool = require('./index');

async function migrate() {
    console.log('🔄 Running migration: payment_intents table...');

    try {
        // Crear tabla payment_intents
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_intents (
                id SERIAL PRIMARY KEY,
                stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
                -- Montos (en centavos)
                amount INTEGER NOT NULL,
                currency VARCHAR(3) NOT NULL DEFAULT 'mxn',
                application_fee_amount INTEGER, -- Comisión de la plataforma
                -- Estado del PaymentIntent
                status VARCHAR(50) NOT NULL, -- requires_payment_method, requires_confirmation, processing, succeeded, canceled
                -- Metadata adicional
                metadata JSONB,
                -- Auditoría
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Tabla payment_intents creada');

        // Crear índices
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id 
            ON payment_intents(user_id);
        `);
        console.log('✅ Índice idx_payment_intents_user_id creado');

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_id 
            ON payment_intents(stripe_payment_intent_id);
        `);
        console.log('✅ Índice idx_payment_intents_stripe_id creado');

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_intents_status 
            ON payment_intents(status);
        `);
        console.log('✅ Índice idx_payment_intents_status creado');

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payment_intents_store_id 
            ON payment_intents(store_id);
        `);
        console.log('✅ Índice idx_payment_intents_store_id creado');

        console.log('\n✅ Migración completada exitosamente!');
        console.log('La tabla payment_intents está lista para usar.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en migración:', error);
        process.exit(1);
    }
}

// Ejecutar migración
migrate();
