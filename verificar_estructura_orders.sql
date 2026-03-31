-- =========================================================================
-- SCRIPT DE VERIFICACIÓN - ESTRUCTURA ACTUAL DE LA TABLA ORDERS
-- =========================================================================
-- Ejecuta este script PRIMERO en Supabase para ver tu estructura actual
-- =========================================================================

-- Ver todas las columnas de la tabla orders
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Ver foreign keys existentes en orders
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'orders';

-- Ver índices en orders
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'orders'
ORDER BY indexname;
