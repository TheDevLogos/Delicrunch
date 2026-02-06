-- ============================================
-- DELICRUNCH - Esquema de Base de Datos
-- Compatible con Mercado Pago Checkout Pro
-- ============================================

-- Extensión para UUID (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: users
-- ============================================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'buyer' CHECK (role IN ('admin', 'seller', 'buyer', 'delivery')),
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Dirección
    street VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'México',
    zip_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Datos del vendedor (para Mercado Pago)
    mp_user_id VARCHAR(100),
    mp_access_token TEXT,
    mp_refresh_token TEXT,
    mp_public_key VARCHAR(255),
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: categories
-- ============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    image_url TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: products
-- ============================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    compare_price DECIMAL(10, 2),
    
    -- Relaciones
    seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    category VARCHAR(100),
    
    -- Inventario
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    sku VARCHAR(100),
    
    -- Imágenes
    image_url TEXT,
    images TEXT[], -- Array de URLs
    
    -- Ubicación (heredada del vendedor)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Mercado Pago
    mp_item_id VARCHAR(100),
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Estadísticas
    views_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    rating DECIMAL(2, 1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: orders
-- ============================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE,
    
    -- Relaciones
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    seller_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Estado del pedido
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'confirmed', 'preparing', 'ready', 
        'in_delivery', 'delivered', 'cancelled', 'refunded'
    )),
    
    -- Totales
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Dirección de entrega
    delivery_address TEXT,
    delivery_street VARCHAR(255),
    delivery_city VARCHAR(100),
    delivery_state VARCHAR(100),
    delivery_zip VARCHAR(20),
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    delivery_instructions TEXT,
    
    -- Pago - Mercado Pago
    payment_method VARCHAR(50) DEFAULT 'mercadopago',
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'approved', 'authorized', 'in_process', 
        'in_mediation', 'rejected', 'cancelled', 'refunded', 'charged_back'
    )),
    mp_preference_id VARCHAR(255),
    mp_payment_id VARCHAR(255),
    mp_merchant_order_id VARCHAR(255),
    mp_external_reference VARCHAR(255),
    mp_payment_type VARCHAR(50),
    mp_payment_method_id VARCHAR(50),
    mp_status VARCHAR(50),
    mp_status_detail VARCHAR(100),
    
    -- Cupón
    coupon_code VARCHAR(50),
    coupon_discount DECIMAL(10, 2) DEFAULT 0,
    
    -- Notas
    notes TEXT,
    customer_notes TEXT,
    seller_notes TEXT,
    
    -- Timestamps
    confirmed_at TIMESTAMP,
    preparing_at TIMESTAMP,
    ready_at TIMESTAMP,
    delivered_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: order_items
-- ============================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    
    -- Datos del producto (snapshot)
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    product_image TEXT,
    
    -- Cantidades y precios
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    
    -- Opciones
    options JSONB,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: payments (historial detallado)
-- ============================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Mercado Pago IDs
    mp_payment_id VARCHAR(255) UNIQUE,
    mp_preference_id VARCHAR(255),
    mp_merchant_order_id VARCHAR(255),
    mp_external_reference VARCHAR(255),
    
    -- Detalles del pago
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'MXN',
    status VARCHAR(50) NOT NULL,
    status_detail VARCHAR(100),
    
    -- Método de pago
    payment_type VARCHAR(50),
    payment_method_id VARCHAR(50),
    payment_method_name VARCHAR(100),
    card_last_four VARCHAR(4),
    card_brand VARCHAR(50),
    
    -- Pagador
    payer_email VARCHAR(255),
    payer_id VARCHAR(100),
    payer_name VARCHAR(255),
    
    -- Fechas
    approved_at TIMESTAMP,
    money_release_date TIMESTAMP,
    
    -- Respuesta completa de MP
    mp_response JSONB,
    
    -- Webhook
    webhook_received_at TIMESTAMP,
    webhook_data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: cart_items (carrito persistente)
-- ============================================
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    options JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- ============================================
-- TABLA: favorites
-- ============================================
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- ============================================
-- TABLA: reviews
-- ============================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, order_id)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_mp_preference ON orders(mp_preference_id);
CREATE INDEX idx_orders_mp_payment ON orders(mp_payment_id);
CREATE INDEX idx_payments_mp_payment ON payments(mp_payment_id);
CREATE INDEX idx_payments_order ON payments(order_id);

-- ============================================
-- FUNCIÓN: Actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCIÓN: Generar número de orden
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'DC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

SELECT 'Esquema creado exitosamente' AS resultado;
