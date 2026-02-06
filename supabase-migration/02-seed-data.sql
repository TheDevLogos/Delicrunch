-- =============================================
-- SCRIPT DE SEED INICIAL PARA DELICRUNCH
-- Datos de prueba: Usuarios, Comercios y Productos
-- =============================================

-- =============================================
-- USUARIOS (3 usuarios)
-- =============================================

-- Contraseña para todos: "Password123" (hash bcrypt)
-- Hash generado: $2a$10$rJ5ZqJQ9Y6FZ7X.3yK0YJeHqZqK0YJeHqZqK0YJeHqZqK0YJeHqZqK

-- 1. Usuario Comprador
INSERT INTO users (nombre, email, password_hash, rol, created_at)
VALUES 
('Carlos Mendoza', 'comprador@delicrunch.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'comprador', NOW()),
('María López', 'comercio@delicrunch.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'comercio', NOW()),
('Jorge Ramírez', 'admin@delicrunch.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW()),
('Ana Martínez', 'comercio2@delicrunch.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'comercio', NOW()),
('Roberto Silva', 'comercio3@delicrunch.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'comercio', NOW());

-- =============================================
-- PERFILES
-- =============================================

-- Perfil del comprador
INSERT INTO profiles (user_id, telefono, direccion, ciudad, total_pedidos, total_ahorrado, co2_ahorrado, total_xp, first_login_shown)
VALUES 
(1, '639-474-1234', 'Av. Tercera Sur 456, Col. Centro, Cd. Delicias', 'Ciudad Delicias', 0, 0.00, 0.00, 0, FALSE);

-- =============================================
-- COMERCIOS (3 comercios)
-- =============================================

-- 1. Taquería las Delicias
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
VALUES (
    2,
    'Taquería las Delicias',
    'Av. 3ra Sur 1205, Col. Centro, Cd. Delicias, Chihuahua',
    28.1889,
    -105.4706,
    '639-474-2345',
    'Lun-Dom: 8:00 AM - 10:00 PM',
    'Auténtica comida mexicana con más de 20 años de tradición. Especialistas en tacos al pastor, carne asada y guisados caseros. ¡Rescata nuestros deliciosos packs sorpresa y evita el desperdicio!',
    'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    'Tacos',
    25.00,
    TRUE
);

-- 2. Pizza Orsinis
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
VALUES (
    4,
    'Pizza Orsinis',
    'Av. 4ta Oriente 815, Col. Los Olivos, Cd. Delicias, Chihuahua',
    28.1923,
    -105.4689,
    '639-474-3456',
    'Lun-Dom: 12:00 PM - 11:00 PM',
    'Pizzería artesanal con recetas tradicionales italianas. Masa fermentada 48 horas y ingredientes frescos. Nuestros packs sorpresa incluyen pizzas del día anterior, ¡perfectas para recalentar y disfrutar!',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    'Pizza',
    25.00,
    TRUE
);

-- 3. Café Placeres
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
VALUES (
    5,
    'Café Placeres',
    'Av. 5ta Norte 340, Col. Residencial del Norte, Cd. Delicias, Chihuahua',
    28.1965,
    -105.4725,
    '639-474-4567',
    'Lun-Vie: 7:00 AM - 8:00 PM, Sáb-Dom: 8:00 AM - 9:00 PM',
    'Cafetería y panadería artesanal con café de especialidad mexicano. Pan recién horneado diariamente. Nuestros packs incluyen pasteles, panes y cafés del día, ¡perfectos para un desayuno o merienda!',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    'Café',
    25.00,
    TRUE
);

-- =============================================
-- PRODUCTOS (3 por comercio = 9 total)
-- =============================================

-- PRODUCTOS DE TAQUERÍA LAS DELICIAS
-- 1. Pack Sorpresa de Tacos
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    1,
    'Pack Sorpresa de Tacos Mix',
    'Delicioso pack sorpresa con 5-7 tacos variados del día. Puede incluir: tacos al pastor, carne asada, pollo, carnitas o guisados especiales. Perfectos para llevar y disfrutar en casa. ¡Sabor auténtico mexicano a precio increíble!',
    120.00,
    40.00,
    5,
    8,
    'Tacos',
    'Puede contener: carne de res, cerdo, pollo, tortillas de maíz, salsas, cebolla, cilantro, limón',
    'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800',
    '18:30',
    '21:30',
    'lun,mar,mie,jue,vie,sab,dom',
    TRUE,
    TRUE,
    TRUE
);

-- 2. Pack de Quesadillas
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    1,
    'Pack de Quesadillas Gigantes',
    'Pack con 3-4 quesadillas gigantes con queso derretido y tu elección de guisado del día. Pueden incluir: pollo, champiñones, rajas o chicharrón. Incluye salsas y guarniciones. ¡Una comida completa para toda la familia!',
    150.00,
    50.00,
    4,
    6,
    'Tacos',
    'Puede contener: tortillas de harina, queso, pollo, champiñones, rajas, chicharrón, crema, lechuga',
    'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800',
    '19:00',
    '21:30',
    'lun,mar,mie,jue,vie,sab,dom',
    TRUE,
    FALSE,
    FALSE
);

-- 3. Pack de Guisados del Día
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    1,
    'Pack de Guisados Caseros',
    'Deliciosa variedad de guisados tradicionales mexicanos. Incluye 2-3 guisados diferentes del día en porciones generosas, acompañados de arroz, frijoles y tortillas. Perfecto para 2-3 personas. ¡Comida casera como en casa de mamá!',
    180.00,
    60.00,
    3,
    5,
    'Tacos',
    'Puede contener: bistec ranchero, pollo en mole, tinga, chile colorado, arroz, frijoles, tortillas',
    'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=800',
    '18:00',
    '21:00',
    'lun,mar,mie,jue,vie',
    TRUE,
    FALSE,
    FALSE
);

-- PRODUCTOS DE PIZZA ORSINIS
-- 4. Pack de Pizza Familiar
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    2,
    'Pack Pizza Familiar Sorpresa',
    'Pizza tamaño familiar completa con masa artesanal y ingredientes premium del día anterior. Puede incluir: Pepperoni, Hawaiana, 4 Quesos, Suprema o Vegetariana. ¡Perfecta para recalentar en casa y disfrutar en familia! Incluye salsa de ajo extra.',
    280.00,
    95.00,
    4,
    7,
    'Pizza',
    'Puede contener: harina, queso mozzarella, pepperoni, jamón, piña, champiñones, pimientos, aceitunas, salami',
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    '21:00',
    '23:00',
    'lun,mar,mie,jue,vie,sab,dom',
    TRUE,
    TRUE,
    TRUE
);

-- 5. Pack de Pizzas Individuales Mix
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    2,
    'Pack de 3 Pizzas Individuales',
    '¡Perfecto para grupos! Pack con 3 pizzas individuales de diferentes sabores. Combinación sorpresa de nuestros sabores más populares. Masa delgada y crujiente con ingredientes frescos. Ideales para recalentar en 5 minutos.',
    240.00,
    80.00,
    3,
    5,
    'Pizza',
    'Puede contener: harina, queso, pepperoni, jamón, salchicha italiana, arúgula, tomate cherry, albahaca',
    'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800',
    '21:00',
    '23:00',
    'lun,mar,mie,jue,vie,sab,dom',
    TRUE,
    FALSE,
    FALSE
);

-- 6. Pack de Pasta Italiana del Día
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    2,
    'Pack de Pasta Italiana Sorpresa',
    'Deliciosa pasta fresca del día en porciones abundantes. Puede incluir: Fettuccine Alfredo, Spaghetti Bolognesa, Penne Arrabiata o Lasagna. Acompaña con pan de ajo. ¡Sabor italiano auténtico!',
    200.00,
    70.00,
    4,
    6,
    'Pizza',
    'Puede contener: pasta, carne molida, crema, queso parmesano, tomate, albahaca, ajo, pan',
    'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    '20:30',
    '22:30',
    'mar,mie,jue,vie,sab',
    TRUE,
    FALSE,
    FALSE
);

-- PRODUCTOS DE CAFÉ PLACERES
-- 7. Pack de Panadería Dulce
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    3,
    'Pack Dulce del Día',
    'Bolsa sorpresa con 6-8 piezas de pan dulce artesanal recién horneado. Puede incluir: conchas, cuernos, orejas, polvorones, donas glaseadas, roles de canela. ¡Perfecto para el desayuno o la merienda familiar! Pan fresco y delicioso.',
    150.00,
    50.00,
    6,
    10,
    'Café',
    'Puede contener: harina de trigo, azúcar, huevo, mantequilla, levadura, canela, chocolate, leche',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    '18:00',
    '20:00',
    'lun,mar,mie,jue,vie,sab,dom',
    TRUE,
    TRUE,
    TRUE
);

-- 8. Pack de Café y Repostería
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    3,
    'Pack Café + Repostería Premium',
    'Pack especial con 250g de café molido de especialidad mexicano + selección de 4-5 piezas de repostería gourmet. Puede incluir: croissants, brownies, muffins, galletas artesanales, pays individuales. ¡El combo perfecto para disfrutar en casa!',
    280.00,
    90.00,
    4,
    6,
    'Café',
    'Puede contener: café arábica, harina, chocolate, nueces, frutos rojos, mantequilla, huevo, azúcar',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    '18:30',
    '20:00',
    'lun,mar,mie,jue,vie,sab',
    TRUE,
    TRUE,
    FALSE
);

-- 9. Pack de Sándwiches y Ensaladas
INSERT INTO products (
    store_id,
    nombre,
    descripcion,
    precio_original,
    precio_descuento,
    cantidad_disponible,
    cantidad_maxima_diaria,
    categoria,
    tipo_contenido,
    imagen_url,
    hora_recogida_inicio,
    hora_recogida_fin,
    dias_disponibles,
    activo,
    destacado,
    producto_listo
)
VALUES (
    3,
    'Pack Lunch Saludable',
    'Pack nutritivo perfecto para llevar. Incluye 2 sándwiches gourmet + 1 ensalada fresca del día + bebida natural. Los sándwiches pueden ser: pollo pesto, jamón serrano, atún, o vegetariano. Ensaladas: César, Caprese o Mediterránea. ¡Comida fresca y balanceada!',
    220.00,
    75.00,
    5,
    7,
    'Café',
    'Puede contener: pan integral, pollo, atún, jamón, lechuga, tomate, aguacate, queso, aderezo, vegetales frescos',
    'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800',
    '17:00',
    '19:30',
    'lun,mar,mie,jue,vie',
    TRUE,
    FALSE,
    FALSE
);

-- =============================================
-- MENSAJE DE CONFIRMACIÓN
-- =============================================

SELECT 
    'Datos de prueba insertados correctamente!' as mensaje,
    (SELECT COUNT(*) FROM users) as total_usuarios,
    (SELECT COUNT(*) FROM stores) as total_comercios,
    (SELECT COUNT(*) FROM products) as total_productos;

-- =============================================
-- CREDENCIALES DE ACCESO
-- =============================================

-- IMPORTANTE: Guarda estas credenciales
-- 
-- COMPRADOR:
--   Email: comprador@delicrunch.com
--   Password: Password123
-- 
-- COMERCIO (Taquería las Delicias):
--   Email: comercio@delicrunch.com
--   Password: Password123
-- 
-- COMERCIO (Pizza Orsinis):
--   Email: comercio2@delicrunch.com
--   Password: Password123
-- 
-- COMERCIO (Café Placeres):
--   Email: comercio3@delicrunch.com
--   Password: Password123
-- 
-- ADMIN:
--   Email: admin@delicrunch.com
--   Password: Password123
-- 
-- COMERCIOS CREADOS:
--   1. Taquería las Delicias (3 productos de tacos mexicanos)
--   2. Pizza Orsinis (3 productos italianos)
--   3. Café Placeres (3 productos de café y panadería)
-- 
-- Total: 5 usuarios, 3 comercios, 9 productos
