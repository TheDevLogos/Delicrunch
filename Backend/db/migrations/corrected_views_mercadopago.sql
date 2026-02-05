-- ========================================
-- VISTAS Y FUNCIONES CORREGIDAS PARA MERCADO PAGO
-- Adaptadas a la estructura real de la base de datos
-- ========================================

-- ========================================
-- 1. VISTA: payment_details_view
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
    o.order_number,
    o.seller_id as store_id,
    o.platform_fee_amount,
    o.merchant_amount,
    -- Información del comercio
    s.nombre_comercio,
    s.mercadopago_email as store_mp_email,
    -- Cálculos
    COALESCE(o.platform_fee_amount, 0) as platform_commission,
    (p.amount - COALESCE(o.platform_fee_amount, 0)) as merchant_payout
FROM payments p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN orders o ON p.order_id = o.id
LEFT JOIN stores s ON o.seller_id = s.id;

COMMENT ON VIEW payment_details_view IS 'Vista consolidada de pagos con información completa para reportes y estadísticas';

-- ========================================
-- 2. VISTA: store_revenue_summary
-- Resumen de ingresos por tienda
-- ========================================
CREATE OR REPLACE VIEW store_revenue_summary AS
SELECT 
    s.id as store_id,
    s.nombre_comercio,
    s.mercadopago_email,
    s.mercadopago_configured,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.payment_status = 'approved' THEN o.id END) as paid_orders,
    SUM(CASE WHEN o.payment_status = 'approved' THEN o.total ELSE 0 END) as total_revenue,
    SUM(CASE WHEN o.payment_status = 'approved' THEN COALESCE(o.platform_fee_amount, 0) ELSE 0 END) as total_platform_fees,
    SUM(CASE WHEN o.payment_status = 'approved' THEN COALESCE(o.merchant_amount, 0) ELSE 0 END) as total_merchant_amount,
    AVG(CASE WHEN o.payment_status = 'approved' THEN s.comision_plataforma END) as avg_commission_percentage
FROM stores s
LEFT JOIN orders o ON s.id = o.seller_id
GROUP BY s.id, s.nombre_comercio, s.mercadopago_email, s.mercadopago_configured;

COMMENT ON VIEW store_revenue_summary IS 'Resumen de ingresos y comisiones por tienda';

-- ========================================
-- 3. VISTA: daily_metrics
-- Métricas diarias de la plataforma
-- ========================================
CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
    DATE(o.created_at) as date,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.payment_status = 'approved' THEN o.id END) as paid_orders,
    COUNT(DISTINCT o.user_id) as unique_customers,
    COUNT(DISTINCT o.seller_id) as active_stores,
    SUM(CASE WHEN o.payment_status = 'approved' THEN o.total ELSE 0 END) as gross_revenue,
    SUM(CASE WHEN o.payment_status = 'approved' THEN COALESCE(o.platform_fee_amount, 0) ELSE 0 END) as platform_revenue,
    SUM(CASE WHEN o.payment_status = 'approved' THEN COALESCE(o.merchant_amount, 0) ELSE 0 END) as merchant_payouts,
    AVG(CASE WHEN o.payment_status = 'approved' THEN o.total END) as avg_order_value
FROM orders o
GROUP BY DATE(o.created_at)
ORDER BY date DESC;

COMMENT ON VIEW daily_metrics IS 'Métricas diarias de ventas y comisiones de la plataforma';

-- ========================================
-- 4. VISTA: monthly_store_performance
-- Rendimiento mensual por tienda
-- ========================================
CREATE OR REPLACE VIEW monthly_store_performance AS
SELECT 
    s.id as store_id,
    s.nombre_comercio,
    DATE_TRUNC('month', o.created_at) as month,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.payment_status = 'approved' THEN o.id END) as paid_orders,
    SUM(CASE WHEN o.payment_status = 'approved' THEN o.total ELSE 0 END) as monthly_revenue,
    SUM(CASE WHEN o.payment_status = 'approved' THEN COALESCE(o.platform_fee_amount, 0) ELSE 0 END) as monthly_platform_fees,
    SUM(CASE WHEN o.payment_status = 'approved' THEN COALESCE(o.merchant_amount, 0) ELSE 0 END) as monthly_merchant_earnings,
    AVG(CASE WHEN o.payment_status = 'approved' THEN o.total END) as avg_order_value,
    COUNT(DISTINCT o.user_id) as unique_customers
FROM stores s
LEFT JOIN orders o ON s.id = o.seller_id
GROUP BY s.id, s.nombre_comercio, DATE_TRUNC('month', o.created_at)
ORDER BY month DESC, monthly_revenue DESC;

COMMENT ON VIEW monthly_store_performance IS 'Rendimiento mensual detallado por tienda';

-- ========================================
-- 5. VISTA: payment_method_statistics
-- Estadísticas por método de pago
-- ========================================
CREATE OR REPLACE VIEW payment_method_statistics AS
SELECT 
    p.payment_method_id,
    p.payment_type,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_payments,
    COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) as rejected_payments,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_payments,
    SUM(CASE WHEN p.status = 'approved' THEN p.amount ELSE 0 END) as total_approved_amount,
    AVG(CASE WHEN p.status = 'approved' THEN p.amount END) as avg_approved_amount,
    ROUND(
        100.0 * COUNT(CASE WHEN p.status = 'approved' THEN 1 END) / NULLIF(COUNT(*), 0),
        2
    ) as approval_rate_percent
FROM payments p
GROUP BY p.payment_method_id, p.payment_type
ORDER BY total_approved_amount DESC;

COMMENT ON VIEW payment_method_statistics IS 'Estadísticas de pagos por método y tipo';

-- ========================================
-- 6. FUNCIÓN: update_financial_metrics (Corregida)
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
            o.seller_id as store_id,
            CURRENT_DATE,
            NEW.amount,
            COALESCE(o.platform_fee_amount, 0),
            COALESCE(o.merchant_amount, 0),
            1,
            1
        FROM orders o
        WHERE o.id = NEW.order_id AND o.seller_id IS NOT NULL
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

-- Recrear trigger
DROP TRIGGER IF EXISTS trigger_update_financial_metrics ON payments;
CREATE TRIGGER trigger_update_financial_metrics
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_metrics_after_payment();

-- ========================================
-- 7. ÍNDICES ADICIONALES (Corregidos)
-- ========================================
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_approved_at ON payments(approved_at);
CREATE INDEX IF NOT EXISTS idx_stores_mp_configured ON stores(mercadopago_configured);

-- ========================================
-- MIGRACIÓN DE VISTAS COMPLETADA
-- ========================================
INSERT INTO migration_history (migration_name) 
VALUES ('corrected_views_and_triggers_2026_01_23')
ON CONFLICT (migration_name) DO NOTHING;
