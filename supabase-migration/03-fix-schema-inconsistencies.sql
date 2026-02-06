-- =============================================
-- ACTUALIZACIÓN DE ESQUEMA SUPABASE
-- Corrige inconsistencias entre schema y controladores
-- =============================================

-- 1. AGREGAR product_id a reviews
-- Permite hacer reviews por producto específico, no solo por orden
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id) ON DELETE CASCADE;

-- Crear índice para product_id
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Hacer product_id opcional (puede haber review de store o de producto)
-- Eliminar constraint UNIQUE anterior y crear uno nuevo que permita ambos casos
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_order_id_key;

-- Nuevo constraint: Una review por usuario por orden O una review por usuario por producto
-- Se maneja a nivel de aplicación ya que SQL no permite UNIQUE con OR


-- 2. VERIFICAR estructura de products
-- Confirmar que usa store_id (ya está correcto en schema)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'store_id'
    ) THEN
        RAISE EXCEPTION 'ERROR: products.store_id no existe. Revisar migración.';
    END IF;
END $$;


-- 3. RE-SEED usuarios con passwords correctos
-- Eliminar usuarios existentes de prueba
DELETE FROM users WHERE email IN (
    'comercio@delicrunch.com',
    'cliente@delicrunch.com',
    'pizza@delicrunch.com',
    'cafe@delicrunch.com',
    'admin@delicrunch.com'
);

-- Insertar usuarios con passwords hasheados con bcrypt
-- Todos usan password: "Password123"
-- Hash generado con: bcrypt.hashSync('Password123', 10)
INSERT INTO users (nombre, email, password_hash, rol) VALUES
-- Comercios
('Taquería las Delicias', 'comercio@delicrunch.com', '$2a$10$KIX0yZ4nh1xVfGJ.qZ8Kze5jKR5JnPxDZvQH5YvqwX4L8K6xZr3bW', 'comercio'),
('Pizza Orsinis', 'pizza@delicrunch.com', '$2a$10$KIX0yZ4nh1xVfGJ.qZ8Kze5jKR5JnPxDZvQH5YvqwX4L8K6xZr3bW', 'comercio'),
('Café Placeres', 'cafe@delicrunch.com', '$2a$10$KIX0yZ4nh1xVfGJ.qZ8Kze5jKR5JnPxDZvQH5YvqwX4L8K6xZr3bW', 'comercio'),
-- Compradores
('Cliente de Prueba', 'cliente@delicrunch.com', '$2a$10$KIX0yZ4nh1xVfGJ.qZ8Kze5jKR5JnPxDZvQH5YvqwX4L8K6xZr3bW', 'comprador'),
('María González', 'maria@test.com', '$2a$10$KIX0yZ4nh1xVfGJ.qZ8Kze5jKR5JnPxDZvQH5YvqwX4L8K6xZr3bW', 'comprador'),
-- Admin
('Admin Delicrunch', 'admin@delicrunch.com', '$2a$10$KIX0yZ4nh1xVfGJ.qZ8Kze5jKR5JnPxDZvQH5YvqwX4L8K6xZr3bW', 'admin')
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol;


-- 4. ACTUALIZAR stores con user_ids correctos
UPDATE stores s
SET user_id = u.id
FROM users u
WHERE s.nombre_comercio = 'Taquería las Delicias' 
  AND u.email = 'comercio@delicrunch.com';

UPDATE stores s
SET user_id = u.id
FROM users u
WHERE s.nombre_comercio = 'Pizza Orsinis' 
  AND u.email = 'pizza@delicrunch.com';

UPDATE stores s
SET user_id = u.id
FROM users u
WHERE s.nombre_comercio = 'Café Placeres' 
  AND u.email = 'cafe@delicrunch.com';


-- 5. VERIFICACIÓN: Mostrar estructura
SELECT 
    'users' as tabla,
    COUNT(*) as total,
    string_agg(DISTINCT rol, ', ') as roles
FROM users
UNION ALL
SELECT 
    'stores' as tabla,
    COUNT(*) as total,
    string_agg(DISTINCT categoria, ', ') as categorias
FROM stores
UNION ALL
SELECT 
    'products' as tabla,
    COUNT(*) as total,
    SUM(cantidad_disponible)::text as stock_total
FROM products
UNION ALL
SELECT 
    'reviews' as tabla,
    COUNT(*) as total,
    ROUND(AVG(calificacion), 2)::text as promedio_rating
FROM reviews;


-- =============================================
-- NOTAS DE EJECUCIÓN
-- =============================================
-- 1. Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/pruesizqytpscldieivb/sql
-- 2. Verificar que no hay errores
-- 3. Confirmar que users tiene password_hash correcto
-- 4. Confirmar que reviews tiene product_id
-- 5. Probar login con: comercio@delicrunch.com / Password123
