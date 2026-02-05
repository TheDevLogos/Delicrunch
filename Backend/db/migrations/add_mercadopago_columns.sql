-- Migración: Agregar columnas de Mercado Pago
-- Fecha: 2025-01-13
-- Descripción: Reemplaza las columnas de Stripe por columnas de Mercado Pago

-- Agregar columnas de Mercado Pago en stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mercadopago_email VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mercadopago_configured BOOLEAN DEFAULT FALSE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS mercadopago_collector_id VARCHAR(255);

-- Agregar columnas de Mercado Pago en orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mercadopago_preference_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mercadopago_payment_id VARCHAR(255);

-- Agregar columnas de Mercado Pago en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mercadopago_customer_id VARCHAR(255);

-- Nota: No eliminamos las columnas de Stripe para mantener datos históricos
-- Las nuevas órdenes usarán Mercado Pago, las antiguas conservan sus datos de Stripe
