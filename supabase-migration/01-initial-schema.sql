-- =============================================
-- MIGRACIÓN DE DELICRUNCH A SUPABASE
-- Fecha: 2026-02-04
-- =============================================

-- Eliminar tablas existentes si existen (para migración limpia)
DROP TABLE IF EXISTS payment_intents CASCADE;
DROP TABLE IF EXISTS admin_metrics CASCADE;
DROP TABLE IF EXISTS financial_metrics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS saved_cards CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- TABLA: users
-- Usuarios del sistema (compradores, comercios, admin)
-- =============================================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('comprador', 'comercio', 'admin')),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por email
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_rol ON users(rol);

-- =============================================
-- TABLA: stores
-- Comercios/tiendas registradas
-- =============================================
CREATE TABLE stores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    nombre_comercio VARCHAR(255) NOT NULL,
    direccion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    telefono VARCHAR(50),
    horario TEXT,
    descripcion TEXT,
    logo_url TEXT,
    cover_url TEXT,
    categoria VARCHAR(100), -- tacos, pizza, cafe, etc.
    -- Stripe/MercadoPago Connect para pagos divididos
    stripe_account_id VARCHAR(255),
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    mercadopago_user_id VARCHAR(255),
    mercadopago_public_key TEXT,
    mercadopago_access_token TEXT,
    mercadopago_onboarding_complete BOOLEAN DEFAULT FALSE,
    -- Configuración de la tienda
    comision_plataforma DECIMAL(5,2) DEFAULT 25.00, -- Porcentaje para Delicrunch
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_stores_activo ON stores(activo);
CREATE INDEX idx_stores_categoria ON stores(categoria);
CREATE INDEX idx_stores_location ON stores(latitud, longitud);

-- =============================================
-- TABLA: products
-- Productos (packs sorpresa estilo TGTG)
-- =============================================
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    -- Precios
    precio_original DECIMAL(10, 2) NOT NULL,
    precio_descuento DECIMAL(10, 2) NOT NULL,
    -- Inventario
    cantidad_disponible INTEGER NOT NULL DEFAULT 0,
    cantidad_maxima_diaria INTEGER DEFAULT 10, -- Límite diario
    -- Categorización
    categoria VARCHAR(100),
    tipo_contenido TEXT, -- "Puede contener: pan, lácteos, etc."
    imagen_url TEXT,
    -- Horarios de recogida
    hora_recogida_inicio TIME DEFAULT '14:00',
    hora_recogida_fin TIME DEFAULT '18:00',
    dias_disponibles TEXT DEFAULT 'lun,mar,mie,jue,vie', -- días separados por coma
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    producto_listo BOOLEAN DEFAULT FALSE, -- Marca si el producto está listo para "Ahorra antes de que sea tarde"
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_activo ON products(activo);
CREATE INDEX idx_products_categoria ON products(categoria);
CREATE INDEX idx_products_destacado ON products(destacado);

-- =============================================
-- TABLA: profiles
-- Perfiles de compradores
-- =============================================
CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    telefono VARCHAR(50),
    direccion TEXT,
    foto_perfil TEXT,
    ciudad TEXT,
    preferencias_alimentarias TEXT[],
    -- Estadísticas del comprador
    total_pedidos INTEGER DEFAULT 0,
    total_ahorrado DECIMAL(10,2) DEFAULT 0.00,
    co2_ahorrado DECIMAL(10,2) DEFAULT 0.00, -- kg de CO2 ahorrados
    -- Campos de gamificación
    total_xp INTEGER DEFAULT 0,
    total_packs_saved INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    unlocked_badges JSONB DEFAULT '[]'::jsonb,
    -- Stripe customer
    stripe_customer_id VARCHAR(255),
    -- MercadoPago customer
    mercadopago_customer_id VARCHAR(255),
    -- Control de primer login
    first_login_shown BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_ciudad ON profiles(ciudad);

-- =============================================
-- TABLA: saved_cards
-- Métodos de pago guardados (solo metadatos)
-- =============================================
CREATE TABLE saved_cards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255), -- ID del payment method en Stripe
    mercadopago_card_id VARCHAR(255), -- ID de la tarjeta en MercadoPago
    brand VARCHAR(50) NOT NULL, -- visa, mastercard, amex
    last4 VARCHAR(4) NOT NULL,
    exp_month INTEGER NOT NULL CHECK (exp_month >= 1 AND exp_month <= 12),
    exp_year INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_saved_cards_user_id ON saved_cards(user_id);

-- =============================================
-- TABLA: orders
-- Pedidos realizados
-- =============================================
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
    -- Código de recogida (como TGTG: XX-123)
    codigo_recogida VARCHAR(10) NOT NULL,
    -- Totales y pagos
    subtotal DECIMAL(10, 2) NOT NULL,
    comision_plataforma DECIMAL(10, 2) NOT NULL, -- 25% para Delicrunch
    total DECIMAL(10, 2) NOT NULL,
    -- Estado del pedido
    estado VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado', 'confirmado', 'en_preparacion', 'listo', 'recogido', 'cancelado', 'reembolsado')),
    -- Información de pago
    metodo_pago VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255), -- ID de la transferencia al comercio
    mercadopago_payment_id VARCHAR(255), -- ID del pago en MercadoPago
    mercadopago_preference_id VARCHAR(255), -- ID de la preferencia en MercadoPago
    -- Fechas
    fecha_pedido TIMESTAMPTZ DEFAULT NOW(),
    fecha_recogida_programada TIMESTAMPTZ,
    fecha_recogida_real TIMESTAMPTZ,
    -- Notas
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_estado ON orders(estado);
CREATE INDEX idx_orders_codigo_recogida ON orders(codigo_recogida);
CREATE INDEX idx_orders_fecha_pedido ON orders(fecha_pedido);

-- =============================================
-- TABLA: order_items
-- Ítems de cada pedido
-- =============================================
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- =============================================
-- TABLA: reviews
-- Reseñas de compradores
-- =============================================
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    -- Aspectos específicos (estilo TGTG)
    calidad_comida INTEGER CHECK (calidad_comida >= 1 AND calidad_comida <= 5),
    valor_precio INTEGER CHECK (valor_precio >= 1 AND valor_precio <= 5),
    experiencia_recogida INTEGER CHECK (experiencia_recogida >= 1 AND experiencia_recogida <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, order_id)
);

-- Índices
CREATE INDEX idx_reviews_store_id ON reviews(store_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_order_id ON reviews(order_id);

-- =============================================
-- TABLA: favorites
-- Tiendas favoritas de usuarios
-- =============================================
CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- Índices
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_store_id ON favorites(store_id);

-- =============================================
-- TABLA: notifications
-- Notificaciones para usuarios
-- =============================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'pedido', 'promocion', 'recordatorio', 'sistema'
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT,
    leido BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}'::jsonb, -- datos adicionales en JSON
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_leido ON notifications(leido);
CREATE INDEX idx_notifications_tipo ON notifications(tipo);

-- =============================================
-- TABLA: financial_metrics
-- Métricas financieras por tienda
-- =============================================
CREATE TABLE financial_metrics (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    -- Métricas del día
    total_ventas DECIMAL(10, 2) DEFAULT 0.00,
    comision_plataforma DECIMAL(10, 2) DEFAULT 0.00,
    ingreso_comercio DECIMAL(10, 2) DEFAULT 0.00,
    numero_ordenes INTEGER DEFAULT 0,
    ordenes_completadas INTEGER DEFAULT 0,
    ordenes_canceladas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, fecha)
);

-- Índices
CREATE INDEX idx_financial_metrics_store_fecha ON financial_metrics(store_id, fecha);
CREATE INDEX idx_financial_metrics_fecha ON financial_metrics(fecha);

-- =============================================
-- TABLA: admin_metrics
-- Métricas globales del admin
-- =============================================
CREATE TABLE admin_metrics (
    id BIGSERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    -- Métricas globales del día
    total_ventas DECIMAL(10, 2) DEFAULT 0.00,
    total_comisiones DECIMAL(10, 2) DEFAULT 0.00,
    total_ordenes INTEGER DEFAULT 0,
    ordenes_completadas INTEGER DEFAULT 0,
    ordenes_canceladas INTEGER DEFAULT 0,
    nuevos_usuarios INTEGER DEFAULT 0,
    nuevos_comercios INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_admin_metrics_fecha ON admin_metrics(fecha);

-- =============================================
-- TABLA: payment_intents
-- PaymentIntents para auditoría y seguimiento
-- =============================================
CREATE TABLE payment_intents (
    id BIGSERIAL PRIMARY KEY,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    mercadopago_payment_id VARCHAR(255),
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    store_id BIGINT REFERENCES stores(id) ON DELETE SET NULL,
    -- Montos (en centavos)
    amount INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'mxn',
    application_fee_amount INTEGER, -- Comisión de la plataforma
    -- Estado del PaymentIntent
    status VARCHAR(50) NOT NULL, -- requires_payment_method, requires_confirmation, processing, succeeded, canceled
    -- Metadata adicional
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Auditoría
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX idx_payment_intents_mercadopago_id ON payment_intents(mercadopago_payment_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_store_id ON payment_intents(store_id);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_metrics_updated_at BEFORE UPDATE ON financial_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_metrics_updated_at BEFORE UPDATE ON admin_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Políticas para users (solo admin puede ver todos los usuarios)
-- Por ahora permitimos acceso completo para compatibilidad con el sistema actual
-- Ajustar según necesidades de seguridad
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow insert to users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to users" ON users FOR UPDATE USING (true);

-- Políticas para stores (públicas para lectura)
CREATE POLICY "Allow public read access to stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Allow insert to stores" ON stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to stores" ON stores FOR UPDATE USING (true);

-- Políticas para products (públicas para lectura)
CREATE POLICY "Allow public read access to products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow insert to products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to products" ON products FOR UPDATE USING (true);

-- Políticas para profiles
CREATE POLICY "Allow public read access to profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert to profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to profiles" ON profiles FOR UPDATE USING (true);

-- Políticas para saved_cards
CREATE POLICY "Allow public read access to saved_cards" ON saved_cards FOR SELECT USING (true);
CREATE POLICY "Allow insert to saved_cards" ON saved_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to saved_cards" ON saved_cards FOR UPDATE USING (true);
CREATE POLICY "Allow delete to saved_cards" ON saved_cards FOR DELETE USING (true);

-- Políticas para orders
CREATE POLICY "Allow public read access to orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow insert to orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to orders" ON orders FOR UPDATE USING (true);

-- Políticas para order_items
CREATE POLICY "Allow public read access to order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow insert to order_items" ON order_items FOR INSERT WITH CHECK (true);

-- Políticas para reviews
CREATE POLICY "Allow public read access to reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Allow insert to reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to reviews" ON reviews FOR UPDATE USING (true);

-- Políticas para favorites
CREATE POLICY "Allow public read access to favorites" ON favorites FOR SELECT USING (true);
CREATE POLICY "Allow insert to favorites" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete to favorites" ON favorites FOR DELETE USING (true);

-- Políticas para notifications
CREATE POLICY "Allow public read access to notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert to notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to notifications" ON notifications FOR UPDATE USING (true);

-- Políticas para financial_metrics
CREATE POLICY "Allow public read access to financial_metrics" ON financial_metrics FOR SELECT USING (true);
CREATE POLICY "Allow insert to financial_metrics" ON financial_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to financial_metrics" ON financial_metrics FOR UPDATE USING (true);

-- Políticas para admin_metrics
CREATE POLICY "Allow public read access to admin_metrics" ON admin_metrics FOR SELECT USING (true);
CREATE POLICY "Allow insert to admin_metrics" ON admin_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to admin_metrics" ON admin_metrics FOR UPDATE USING (true);

-- Políticas para payment_intents
CREATE POLICY "Allow public read access to payment_intents" ON payment_intents FOR SELECT USING (true);
CREATE POLICY "Allow insert to payment_intents" ON payment_intents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update to payment_intents" ON payment_intents FOR UPDATE USING (true);

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista de tiendas con calificación promedio
CREATE OR REPLACE VIEW stores_with_ratings AS
SELECT 
    s.*,
    COALESCE(AVG(r.calificacion), 0) as calificacion_promedio,
    COUNT(r.id) as total_reviews
FROM stores s
LEFT JOIN reviews r ON s.id = r.store_id
GROUP BY s.id;

-- Vista de productos con información de tienda
CREATE OR REPLACE VIEW products_with_store AS
SELECT 
    p.*,
    s.nombre_comercio,
    s.direccion as store_direccion,
    s.latitud as store_latitud,
    s.longitud as store_longitud,
    s.logo_url as store_logo_url,
    s.categoria as store_categoria,
    COALESCE(AVG(r.calificacion), 0) as store_rating,
    COUNT(DISTINCT r.id) as store_reviews_count
FROM products p
JOIN stores s ON p.store_id = s.id
LEFT JOIN reviews r ON s.id = r.store_id
GROUP BY p.id, s.id;

-- Vista de resumen de pedidos
CREATE OR REPLACE VIEW orders_summary AS
SELECT 
    o.*,
    u.nombre as user_nombre,
    u.email as user_email,
    s.nombre_comercio,
    s.telefono as store_telefono,
    s.direccion as store_direccion,
    COUNT(oi.id) as total_items
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN stores s ON o.store_id = s.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.id, s.id;

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON TABLE users IS 'Usuarios del sistema: compradores, comercios y administradores';
COMMENT ON TABLE stores IS 'Comercios registrados en la plataforma';
COMMENT ON TABLE products IS 'Productos/packs sorpresa disponibles para compra';
COMMENT ON TABLE profiles IS 'Perfiles extendidos de usuarios compradores';
COMMENT ON TABLE orders IS 'Pedidos realizados por los compradores';
COMMENT ON TABLE reviews IS 'Reseñas de compradores sobre tiendas';
COMMENT ON TABLE financial_metrics IS 'Métricas financieras agregadas por tienda y fecha';
COMMENT ON TABLE admin_metrics IS 'Métricas globales para el panel de administración';

-- =============================================
-- FIN DE LA MIGRACIÓN
-- =============================================
