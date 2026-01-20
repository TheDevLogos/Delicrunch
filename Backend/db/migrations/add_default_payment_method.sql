-- Migración: Agregar soporte completo para payment methods por defecto
-- Fecha: 2026-01-14

-- 1. Agregar columna default_payment_method_id en profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS default_payment_method_id VARCHAR(255);

-- 2. Agregar comentario explicativo
COMMENT ON COLUMN profiles.default_payment_method_id IS 
'ID del Stripe Payment Method establecido como predeterminado para este usuario';

-- 3. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_default_payment_method 
ON profiles(default_payment_method_id);

-- 4. Agregar índice en saved_cards para búsquedas por payment_method_id
CREATE INDEX IF NOT EXISTS idx_saved_cards_stripe_pm_id 
ON saved_cards(stripe_payment_method_id);

-- 5. Agregar índice para búsquedas de tarjetas por defecto
CREATE INDEX IF NOT EXISTS idx_saved_cards_user_default 
ON saved_cards(user_id, is_default) WHERE is_default = TRUE;

-- 6. Verificar integridad: Solo una tarjeta por defecto por usuario
-- (Se manejará en código, pero agregamos constraint como seguridad adicional)
CREATE OR REPLACE FUNCTION check_one_default_card_per_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        -- Desmarcar otras tarjetas del mismo usuario
        UPDATE saved_cards 
        SET is_default = FALSE 
        WHERE user_id = NEW.user_id 
        AND id != NEW.id 
        AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS enforce_one_default_card ON saved_cards;
CREATE TRIGGER enforce_one_default_card
    BEFORE INSERT OR UPDATE ON saved_cards
    FOR EACH ROW
    EXECUTE FUNCTION check_one_default_card_per_user();

-- 7. Actualizar tarjetas existentes que deberían ser default
-- (Primera tarjeta de cada usuario sin default)
WITH first_cards AS (
    SELECT DISTINCT ON (user_id) 
        id, user_id
    FROM saved_cards
    WHERE user_id IN (
        SELECT user_id 
        FROM saved_cards 
        GROUP BY user_id 
        HAVING SUM(CASE WHEN is_default THEN 1 ELSE 0 END) = 0
    )
    ORDER BY user_id, created_at ASC
)
UPDATE saved_cards sc
SET is_default = TRUE
FROM first_cards fc
WHERE sc.id = fc.id;

-- 8. Sincronizar default_payment_method_id en profiles con saved_cards
UPDATE profiles p
SET default_payment_method_id = sc.stripe_payment_method_id
FROM saved_cards sc
WHERE p.user_id = sc.user_id 
AND sc.is_default = TRUE
AND p.default_payment_method_id IS NULL;

-- Mostrar resumen
DO $$
DECLARE
    profiles_updated INTEGER;
    default_cards INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_updated 
    FROM profiles 
    WHERE default_payment_method_id IS NOT NULL;
    
    SELECT COUNT(*) INTO default_cards 
    FROM saved_cards 
    WHERE is_default = TRUE;
    
    RAISE NOTICE '✅ Migración completada:';
    RAISE NOTICE '   - Profiles con payment method default: %', profiles_updated;
    RAISE NOTICE '   - Tarjetas marcadas como default: %', default_cards;
END $$;
