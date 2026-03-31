-- =============================================
-- SCRIPT UNIFICADO: SETUP COMPLETO DELICRUNCH
-- Ejecutar en Supabase SQL Editor
-- =============================================
-- Este script AUTOMÁTICAMENTE:
-- 1. Crea usuarios de prueba CON password_hash correcto
-- 2. Crea 3 stores funcionales
-- 3. Crea 9 productos listos para vender
-- 4. Configura reviews para permitir product_id
--
-- Password para todos: Password123
-- =============================================

BEGIN;

-- =============================================
-- 1. AGREGAR product_id a reviews (si no existe)
-- =============================================
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_order_id_key;

-- =============================================
-- 2. LIMPIAR DATOS DE PRUEBA EXISTENTES
-- =============================================
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM reviews WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@delicrunch.com');
DELETE FROM products WHERE store_id IN (SELECT id FROM stores WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@delicrunch.com'));
DELETE FROM stores WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@delicrunch.com');
DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@delicrunch.com');
DELETE FROM users WHERE email LIKE '%@delicrunch.com';

-- =============================================
-- 3. CREAR USUARIOS CON PASSWORD CORRECTO
-- =============================================
-- Password: Password123
-- Hash: $2b$10$ccQyqcfrQNynnFXRRkWBrORbK99J214Or3cvZY9bmCtN9S3Zq95LK

INSERT INTO users (nombre, email, password_hash, rol, created_at)
VALUES 
-- Comercios
('Taquería las Delicias', 'comercio@delicrunch.com', '$2b$10$ccQyqcfrQNynnFXRRkWBrORbK99J214Or3cvZY9bmCtN9S3Zq95LK', 'comercio', NOW()),
('Pizza Orsinis', 'pizza@delicrunch.com', '$2b$10$ccQyqcfrQNynnFXRRkWBrORbK99J214Or3cvZY9bmCtN9S3Zq95LK', 'comercio', NOW()),
('Café Placeres', 'cafe@delicrunch.com', '$2b$10$ccQyqcfrQNynnFXRRkWBrORbK99J214Or3cvZY9bmCtN9S3Zq95LK', 'comercio', NOW()),
-- Compradores
('Cliente de Prueba', 'cliente@delicrunch.com', '$2b$10$ccQyqcfrQNynnFXRRkWBrORbK99J214Or3cvZY9bmCtN9S3Zq95LK', 'comprador', NOW()),
('María González', 'maria@delicrunch.com', '$2b$10$ccQyqcfrQNynnFXRRkWBrORbK99J214Or3cvZY9bmCtN9S3Zq95LK', 'comprador', NOW()),
-- Admin
('Admin Delicrunch', 'admin@delicrunch.com', '$2b$10$ccQyqcfrQNynnFXRRkWBrORbK99J214Or3cvZY9bmCtN9S3Zq95LK', 'admin', NOW());

-- =============================================
-- 4. CREAR PERFILES PARA COMPRADORES
-- =============================================
INSERT INTO profiles (user_id, telefono, direccion, ciudad, total_pedidos, total_ahorrado, co2_ahorrado, total_xp)
VALUES 
((SELECT id FROM users WHERE email = 'cliente@delicrunch.com'), '639-474-1234', 'Av. Tercera Sur 456, Col. Centro', 'Ciudad Delicias', 0, 0.00, 0.00, 0),
((SELECT id FROM users WHERE email = 'maria@delicrunch.com'), '639-474-5678', 'Calle 5ta Norte 123', 'Ciudad Delicias', 0, 0.00, 0.00, 0);

-- =============================================
-- 5. CREAR STORES
-- =============================================
INSERT INTO stores (
    user_id, 
    nombre_comercio, 
    direccion, 
    latitud, 
    longitud, 
    telefono, 
    horario, 
    descripcion, 
    logo_url, 
    cover_url, 
    categoria, 
    comision_plataforma, 
    activo
)
VALUES 
-- Store 1: Taquería
(
    (SELECT id FROM users WHERE email = 'comercio@delicrunch.com'),
    'Taquería las Delicias',
    'Av. 3ra Sur 1205, Col. Centro, Cd. Delicias, Chihuahua',
    28.1889,
    -105.4706,
    '639-474-2345',
    'Lun-Dom: 8:00 AM - 10:00 PM',
    'Auténtica comida mexicana con más de 20 años de tradición. Especialistas en tacos al pastor, carne asada y guisados caseros.',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    'Tacos',
    25.00,
    TRUE
),
-- Store 2: Pizza
(
    (SELECT id FROM users WHERE email = 'pizza@delicrunch.com'),
    'Pizza Orsinis',
    'Av. 4ta Oriente 815, Col. Los Olivos, Cd. Delicias, Chihuahua',
    28.1923,
    -105.4689,
    '639-474-3456',
    'Lun-Dom: 12:00 PM - 11:00 PM',
    'Pizzería artesanal con recetas tradicionales italianas. Masa fermentada 48 horas y ingredientes frescos.',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    'Pizza',
    25.00,
    TRUE
),
-- Store 3: Café
(
    (SELECT id FROM users WHERE email = 'cafe@delicrunch.com'),
    'Café Placeres',
    'Av. 5ta Norte 340, Col. Residencial del Norte, Cd. Delicias, Chihuahua',
    28.1965,
    -105.4725,
    '639-474-4567',
    'Lun-Vie: 7:00 AM - 8:00 PM, Sáb-Dom: 8:00 AM - 9:00 PM',
    'Cafetería y panadería artesanal con café de especialidad mexicano. Pan recién horneado diariamente.',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    'Café',
    25.00,
    TRUE
);

-- =============================================
-- 6. CREAR PRODUCTOS
-- =============================================

-- PRODUCTOS DE TAQUERÍA (3 productos)
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    categoria,
    imagen_url,
    activo,
    destacado
)
VALUES
-- Taquería - Producto 1
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Taquería las Delicias'),
    'Pack Sorpresa de Tacos',
    'Pack sorpresa con 5-7 tacos variados (asada, pastor, bistec). ¡Evita el desperdicio y ahorra!',
    150.00,
    75.00,
    5,
    'Tacos',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
    TRUE,
    TRUE
),
-- Taquería - Producto 2
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Taquería las Delicias'),
    'Quesadillas del Día',
    'Paquete de 3-4 quesadillas con guisos caseros variados.',
    120.00,
    60.00,
    3,
    'Tacos',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600',
    TRUE,
    FALSE
),
-- Taquería - Producto 3
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Taquería las Delicias'),
    'Mega Pack Familiar',
    'Paquete familiar para 4-5 personas: tacos, quesadillas, guacamole y salsas.',
    300.00,
    150.00,
    2,
    'Tacos',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600',
    TRUE,
    TRUE
);

-- PRODUCTOS DE PIZZA (3 productos)
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    categoria,
    imagen_url,
    activo,
    destacado
)
VALUES
-- Pizza - Producto 1
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Pizza Orsinis'),
    'Pizza Sorpresa Grande',
    'Pizza grande con ingredientes del día. Variedad de sabores (vegetariana, pepperoni, hawaiana).',
    250.00,
    125.00,
    4,
    'Pizza',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    TRUE,
    TRUE
),
-- Pizza - Producto 2
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Pizza Orsinis'),
    'Combo 2 Pizzas Medianas',
    'Dos pizzas medianas con sabores variados + bebidas.',
    400.00,
    200.00,
    3,
    'Pizza',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
    TRUE,
    FALSE
),
-- Pizza - Producto 3
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Pizza Orsinis'),
    'Calzone del Chef',
    'Calzone relleno con ingredientes premium. Sabor sorpresa.',
    180.00,
    90.00,
    5,
    'Pizza',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600',
    TRUE,
    FALSE
);

-- PRODUCTOS DE CAFÉ (3 productos)
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    categoria,
    imagen_url,
    activo,
    destacado
)
VALUES
-- Café - Producto 1
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Café Placeres'),
    'Pack de Panadería Variada',
    'Bolsa sorpresa con 6-8 piezas de pan dulce y salado del día.',
    120.00,
    60.00,
    6,
    'Café',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
    TRUE,
    TRUE
),
-- Café - Producto 2
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Café Placeres'),
    'Pasteles y Postres Sorpresa',
    'Rebanadas de pastel y postres variados (cheesecake, brownies, pay).',
    150.00,
    75.00,
    4,
    'Café',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
    TRUE,
    FALSE
),
-- Café - Producto 3
(
    (SELECT id FROM stores WHERE nombre_comercio = 'Café Placeres'),
    'Box de Café Gourmet',
    'Café de especialidad (250g) + 3 panes artesanales.',
    200.00,
    100.00,
    3,
    'Café',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600',
    TRUE,
    TRUE
);

-- =============================================
-- 7. VERIFICACIÓN FINAL
-- =============================================
SELECT 
    'USUARIOS CREADOS' as seccion,
    COUNT(*) as total,
    string_agg(DISTINCT rol, ', ') as roles
FROM users
WHERE email LIKE '%@delicrunch.com'
UNION ALL
SELECT 
    'STORES CREADOS' as seccion,
    COUNT(*) as total,
    string_agg(nombre_comercio, ', ') as stores
FROM stores
UNION ALL
SELECT 
    'PRODUCTOS CREADOS' as seccion,
    COUNT(*) as total,
    SUM(cantidad_disponible)::text as stock_total
FROM products
WHERE store_id IN (SELECT id FROM stores);

-- Mostrar detalles de stores
SELECT 
    s.id,
    s.nombre_comercio,
    u.email,
    u.nombre as propietario,
    COUNT(p.id) as total_productos
FROM stores s
JOIN users u ON s.user_id = u.id
LEFT JOIN products p ON p.store_id = s.id
GROUP BY s.id, s.nombre_comercio, u.email, u.nombre
ORDER BY s.id;

COMMIT;

-- =============================================
-- ✅ SETUP COMPLETADO
-- =============================================
-- Credenciales para probar:
--
-- Comercios:
-- - comercio@delicrunch.com / Password123
-- - pizza@delicrunch.com / Password123
-- - cafe@delicrunch.com / Password123
--
-- Compradores:
-- - cliente@delicrunch.com / Password123
-- - maria@delicrunch.com / Password123
--
-- Admin:
-- - admin@delicrunch.com / Password123
-- =============================================
