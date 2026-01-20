-- Esquema completo para Delicrunch
-- Basado en el modelo de Too Good To Go / Rappi / UberEats

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('comprador', 'comercio', 'admin')),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de comercios/tiendas
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
    -- Stripe Connect para pagos divididos
    stripe_account_id VARCHAR(255),
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    -- Configuración de la tienda
    comision_plataforma DECIMAL(5,2) DEFAULT 25.00, -- Porcentaje para Delicrunch
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos (packs sorpresa estilo TGTG)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de perfiles de compradores
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
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
    unlocked_badges JSONB DEFAULT '[]',
    -- Control de primer login
    first_login_shown BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Métodos de pago guardados (solo metadatos, nunca datos sensibles)
-- Los datos reales de la tarjeta se guardan en Stripe
CREATE TABLE IF NOT EXISTS saved_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255), -- ID del payment method en Stripe
    brand VARCHAR(50) NOT NULL, -- visa, mastercard, amex
    last4 VARCHAR(4) NOT NULL,
    exp_month INTEGER NOT NULL CHECK (exp_month >= 1 AND exp_month <= 12),
    exp_year INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asegurar columna ciudad exista si la tabla ya existía
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ciudad TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_pedidos INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_ahorrado DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS co2_ahorrado DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_login_shown BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Asegurar columna producto_listo exista en products
ALTER TABLE products ADD COLUMN IF NOT EXISTS producto_listo BOOLEAN DEFAULT FALSE;

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
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
    -- Fechas
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_recogida_programada TIMESTAMP,
    fecha_recogida_real TIMESTAMP,
    -- Notas
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar columnas faltantes a orders si ya existe
ALTER TABLE orders ADD COLUMN IF NOT EXISTS codigo_recogida VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS comision_plataforma DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_transfer_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fecha_recogida_programada TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fecha_recogida_real TIMESTAMP;

-- Tabla de ítems del pedido (relación muchos a muchos entre orders y products)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reseñas
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    -- Aspectos específicos (estilo TGTG)
    calidad_comida INTEGER CHECK (calidad_comida >= 1 AND calidad_comida <= 5),
    valor_precio INTEGER CHECK (valor_precio >= 1 AND valor_precio <= 5),
    experiencia_recogida INTEGER CHECK (experiencia_recogida >= 1 AND experiencia_recogida <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, order_id)
);

-- Tabla de favoritos
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, store_id)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'pedido', 'promocion', 'recordatorio', 'sistema'
    titulo VARCHAR(255) NOT NULL,
    mensaje TEXT,
    leido BOOLEAN DEFAULT FALSE,
    data JSONB, -- datos adicionales en JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de métricas financieras agregadas (para mejorar performance de consultas)
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

-- Tabla de métricas globales del admin (agregadas por día)
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

-- Tabla de PaymentIntents para auditoría y seguimiento
-- Registra todos los intentos de pago creados (exitosos o fallidos)
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

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_activo ON stores(activo);
CREATE INDEX IF NOT EXISTS idx_stores_categoria ON stores(categoria);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_activo ON products(activo);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_estado ON orders(estado);
CREATE INDEX IF NOT EXISTS idx_orders_codigo_recogida ON orders(codigo_recogida);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_metrics_store_fecha ON financial_metrics(store_id, fecha);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_fecha ON admin_metrics(fecha);
CREATE INDEX IF NOT EXISTS idx_payment_intents_user_id ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents(status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_store_id ON payment_intents(store_id);

