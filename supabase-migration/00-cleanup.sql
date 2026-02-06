-- =============================================
-- SCRIPT DE LIMPIEZA PARA SUPABASE
-- Ejecuta este script ANTES de ejecutar 01-initial-schema.sql
-- si ya tienes tablas existentes
-- =============================================

-- Deshabilitar RLS temporalmente para permitir la limpieza
ALTER TABLE IF EXISTS payment_intents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS financial_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas RLS existentes
DROP POLICY IF EXISTS "Allow public read access to payment_intents" ON payment_intents;
DROP POLICY IF EXISTS "Allow insert to payment_intents" ON payment_intents;
DROP POLICY IF EXISTS "Allow update to payment_intents" ON payment_intents;

DROP POLICY IF EXISTS "Allow public read access to admin_metrics" ON admin_metrics;
DROP POLICY IF EXISTS "Allow insert to admin_metrics" ON admin_metrics;
DROP POLICY IF EXISTS "Allow update to admin_metrics" ON admin_metrics;

DROP POLICY IF EXISTS "Allow public read access to financial_metrics" ON financial_metrics;
DROP POLICY IF EXISTS "Allow insert to financial_metrics" ON financial_metrics;
DROP POLICY IF EXISTS "Allow update to financial_metrics" ON financial_metrics;

DROP POLICY IF EXISTS "Allow public read access to notifications" ON notifications;
DROP POLICY IF EXISTS "Allow insert to notifications" ON notifications;
DROP POLICY IF EXISTS "Allow update to notifications" ON notifications;

DROP POLICY IF EXISTS "Allow public read access to favorites" ON favorites;
DROP POLICY IF EXISTS "Allow insert to favorites" ON favorites;
DROP POLICY IF EXISTS "Allow delete to favorites" ON favorites;

DROP POLICY IF EXISTS "Allow public read access to reviews" ON reviews;
DROP POLICY IF EXISTS "Allow insert to reviews" ON reviews;
DROP POLICY IF EXISTS "Allow update to reviews" ON reviews;

DROP POLICY IF EXISTS "Allow public read access to order_items" ON order_items;
DROP POLICY IF EXISTS "Allow insert to order_items" ON order_items;

DROP POLICY IF EXISTS "Allow public read access to orders" ON orders;
DROP POLICY IF EXISTS "Allow insert to orders" ON orders;
DROP POLICY IF EXISTS "Allow update to orders" ON orders;

DROP POLICY IF EXISTS "Allow public read access to saved_cards" ON saved_cards;
DROP POLICY IF EXISTS "Allow insert to saved_cards" ON saved_cards;
DROP POLICY IF EXISTS "Allow update to saved_cards" ON saved_cards;
DROP POLICY IF EXISTS "Allow delete to saved_cards" ON saved_cards;

DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow insert to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow update to profiles" ON profiles;

DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow insert to products" ON products;
DROP POLICY IF EXISTS "Allow update to products" ON products;

DROP POLICY IF EXISTS "Allow public read access to stores" ON stores;
DROP POLICY IF EXISTS "Allow insert to stores" ON stores;
DROP POLICY IF EXISTS "Allow update to stores" ON stores;

DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow insert to users" ON users;
DROP POLICY IF EXISTS "Allow update to users" ON users;

-- Eliminar vistas
DROP VIEW IF EXISTS orders_summary CASCADE;
DROP VIEW IF EXISTS products_with_store CASCADE;
DROP VIEW IF EXISTS stores_with_ratings CASCADE;

-- Eliminar triggers
DROP TRIGGER IF EXISTS update_payment_intents_updated_at ON payment_intents;
DROP TRIGGER IF EXISTS update_admin_metrics_updated_at ON admin_metrics;
DROP TRIGGER IF EXISTS update_financial_metrics_updated_at ON financial_metrics;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Eliminar función
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Eliminar tablas en orden inverso de dependencias
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

-- Mensaje de confirmación
SELECT 'Limpieza completada. Ahora puedes ejecutar 01-initial-schema.sql' as message;
