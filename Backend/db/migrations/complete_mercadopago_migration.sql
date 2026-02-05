-- ========================================
-- MIGRACIÓN COMPLETA A MERCADO PAGO
-- Fecha: 2026-01-23
-- Descripción: Actualiza todo el sistema para usar Mercado Pago Checkout Pro
-- ========================================

-- ========================================
-- 1. TABLA STORES - Agregar columnas de Mercado Pago
-- ========================================
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mercadopago_email VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mercadopago_configured BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mercadopago_collector_id VARCHAR(255);
COMMENT ON COLUMN stores.mercadopago_email IS 'Email de la cuenta de Mercado Pago del comercio';
COMMENT ON COLUMN stores.mercadopago_configured IS 'Indica si el comercio completó la configuración de Mercado Pago';
COMMENT ON COLUMN stores.mercadopago_collector_id IS 'ID del collector en Mercado Pago';

-- ========================================
-- 2. TABLA ORDERS - Agregar columnas de Mercado Pago
-- ========================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mercadopago_preference_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mercadopago_payment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mercadopago_merchant_order_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mercadopago_external_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS merchant_amount DECIMAL(10,2) DEFAULT 0.00;
COMMENT ON COLUMN orders.mercadopago_preference_id IS 'ID de la preferencia de Mercado Pago';
COMMENT ON COLUMN orders.mercadopago_payment_id IS 'ID del pago en Mercado Pago';
COMMENT ON COLUMN orders.mercadopago_merchant_order_id IS 'ID de la orden de comercio en Mercado Pago';
COMMENT ON COLUMN orders.platform_fee_amount IS 'Monto de comisión de la plataforma';
COMMENT ON COLUMN orders.merchant_amount IS 'Monto que recibe el comercio';

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_orders_mp_preference ON orders(mercadopago_preference_id);
CREATE INDEX IF NOT EXISTS idx_orders_mp_payment ON orders(mercadopago_payment_id);

-- ========================================
-- 3. TABLA PROFILES - Agregar columnas de Mercado Pago
-- ========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mercadopago_customer_id VARCHAR(255);
COMMENT ON COLUMN profiles.mercadopago_customer_id IS 'ID del cliente en Mercado Pago';

-- ========================================
-- 4. TABLA PAYMENT_INTENTS - Actualizar para Mercado Pago
-- ========================================
-- Renombrar columna de Stripe a un nombre genérico
ALTER TABLE payment_intents RENAME COLUMN stripe_payment_intent_id TO payment_provider_id;
ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) DEFAULT 'mercadopago';
ALTER TABLE payment_intents ADD COLUMN IF NOT EXISTS preference_id VARCHAR(255);
COMMENT ON COLUMN payment_intents.payment_provider IS 'Proveedor de pago: mercadopago, stripe, etc.';
COMMENT ON COLUMN payment_intents.preference_id IS 'ID de preferencia (para Mercado Pago)';

-- Actualizar índice
DROP INDEX IF EXISTS idx_payment_intents_stripe_id;
CREATE INDEX IF NOT EXISTS idx_payment_intents_provider_id ON payment_intents(payment_provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_preference ON payment_intents(preference_id);

-- ========================================
-- 5. NUEVA TABLA: PAYMENT_PREFERENCES
-- Para tracking de preferencias creadas
-- ========================================
CREATE TABLE IF NOT EXISTS payment_preferences (
    id SERIAL PRIMARY KEY,
    mercadopago_preference_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
    -- Montos
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
    platform_fee_amount DECIMAL(10,2),
    merchant_amount DECIMAL(10,2),
    -- Estado
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, expired, cancelled
    -- URLs
    init_point TEXT,
    sandbox_init_point TEXT,
    -- Metadata
    metadata JSONB,
    external_reference TEXT,
    -- Expiración
    expires_at TIMESTAMP,
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE payment_preferences IS 'Registro de preferencias de Mercado Pago Checkout Pro';

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_preferences_user ON payment_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_product ON payment_preferences(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_store ON payment_preferences(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_preferences_status ON payment_preferences(status);

-- ========================================
-- 6. TABLA PAYMENTS - Renombrar a partir de pagos de Mercado Pago
-- Esta tabla ya existe y está bien estructurada
-- ========================================
-- Agregar índices adicionales
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

-- ========================================
-- 7. TABLA FINANCIAL_METRICS - Agregar campos de Mercado Pago
-- ========================================
ALTER TABLE financial_metrics ADD COLUMN IF NOT EXISTS mercadopago_fees DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE financial_metrics ADD COLUMN IF NOT EXISTS payment_provider_fees DECIMAL(10,2) DEFAULT 0.00;
COMMENT ON COLUMN financial_metrics.mercadopago_fees IS 'Comisiones cobradas por Mercado Pago';
COMMENT ON COLUMN financial_metrics.payment_provider_fees IS 'Comisiones totales del proveedor de pagos';

-- ========================================
-- 8. VISTA: payment_details_view
-- Vista consolidada de todos los pagos con información completa
-- ========================================
CREATE OR REPLACE VIEW payment_details_view AS
SELECT 
    p.id,
    p.order_id,
    p.user_id,
    p.mp_payment_id,
    p.mp_preference_id,
    p.amount,
    p.status,
    p.payment_type,
    p.payment_method_id,
    p.created_at,
    p.approved_at,
    -- Información del usuario
    u.name as user_name,
    u.email as user_email,
    -- Información de la orden
    o.codigo_recogida,
    o.store_id,
    o.platform_fee_amount,
    o.merchant_amount,
    -- Información del comercio
    s.nombre_comercio,
    s.mercadopago_email as store_mp_email,
    -- Cálculos
    o.platform_fee_amount as platform_commission,
    (p.amount - COALESCE(o.platform_fee_amount, 0)) as merchant_payout
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN orders o ON p.order_id = o.id
LEFT JOIN stores s ON o.store_id = s.id;

COMMENT ON VIEW payment_details_view IS 'Vista consolidada de pagos con información completa para reportes y estadísticas';

-- ========================================
-- 9. VISTA: store_revenue_summary
-- Resumen de ingresos por tienda
-- ========================================
CREATE OR REPLACE VIEW store_revenue_summary AS
SELECT 
    s.id as store_id,
    s.nombre_comercio,
    s.mercadopago_email,
    s.mercadopago_configured,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.estado = 'pagado' THEN o.id END) as paid_orders,
    SUM(CASE WHEN o.estado = 'pagado' THEN o.total ELSE 0 END) as total_revenue,
    SUM(CASE WHEN o.estado = 'pagado' THEN o.platform_fee_amount ELSE 0 END) as total_platform_fees,
    SUM(CASE WHEN o.estado = 'pagado' THEN o.merchant_amount ELSE 0 END) as total_merchant_amount,
    AVG(CASE WHEN o.estado = 'pagado' THEN o.comision_plataforma END) as avg_commission_percentage
FROM stores s
LEFT JOIN orders o ON s.id = o.store_id
GROUP BY s.id, s.nombre_comercio, s.mercadopago_email, s.mercadopago_configured;

COMMENT ON VIEW store_revenue_summary IS 'Resumen de ingresos y comisiones por tienda';

-- ========================================
-- 10. VISTA: daily_metrics
-- Métricas diarias de la plataforma
-- ========================================
CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
    DATE(o.created_at) as date,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.estado = 'pagado' THEN o.id END) as paid_orders,
    COUNT(DISTINCT o.user_id) as unique_customers,
    COUNT(DISTINCT o.store_id) as active_stores,
    SUM(CASE WHEN o.estado = 'pagado' THEN o.total ELSE 0 END) as gross_revenue,
    SUM(CASE WHEN o.estado = 'pagado' THEN o.platform_fee_amount ELSE 0 END) as platform_revenue,
    SUM(CASE WHEN o.estado = 'pagado' THEN o.merchant_amount ELSE 0 END) as merchant_payouts
FROM orders o
GROUP BY DATE(o.created_at)
ORDER BY date DESC;

COMMENT ON VIEW daily_metrics IS 'Métricas diarias de ventas y comisiones de la plataforma';

-- ========================================
-- 11. FUNCIÓN: update_financial_metrics
-- Actualiza las métricas financieras después de cada pago
-- ========================================
CREATE OR REPLACE FUNCTION update_financial_metrics_after_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar cuando el pago es aprobado
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO financial_metrics (
            store_id, 
            fecha, 
            total_ventas, 
            comision_plataforma, 
            ingreso_comercio,
            numero_ordenes,
            ordenes_completadas
        )
        SELECT 
            o.store_id,
            CURRENT_DATE,
            NEW.amount,
            COALESCE(o.platform_fee_amount, 0),
            COALESCE(o.merchant_amount, 0),
            1,
            1
        FROM orders o
        WHERE o.id = NEW.order_id
        ON CONFLICT (store_id, fecha) DO UPDATE SET
            total_ventas = financial_metrics.total_ventas + EXCLUDED.total_ventas,
            comision_plataforma = financial_metrics.comision_plataforma + EXCLUDED.comision_plataforma,
            ingreso_comercio = financial_metrics.ingreso_comercio + EXCLUDED.ingreso_comercio,
            numero_ordenes = financial_metrics.numero_ordenes + 1,
            ordenes_completadas = financial_metrics.ordenes_completadas + 1,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_update_financial_metrics ON payments;
CREATE TRIGGER trigger_update_financial_metrics
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_metrics_after_payment();

-- ========================================
-- 12. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_estado_created ON orders(estado, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_approved_at ON payments(approved_at);
CREATE INDEX IF NOT EXISTS idx_stores_mp_configured ON stores(mercadopago_configured);

-- ========================================
-- 13. CONFIGURACIÓN DEFAULT
-- ========================================
-- Establecer Mercado Pago como método de pago por defecto en nuevas órdenes
ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'mercadopago';

-- ========================================
-- MIGRACIÓN COMPLETADA
-- ========================================
-- Insertar registro de migración
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO migration_history (migration_name) 
VALUES ('complete_mercadopago_migration_2026_01_23')
ON CONFLICT (migration_name) DO NOTHING;
