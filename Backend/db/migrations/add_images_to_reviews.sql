-- Agregar soporte de imágenes a reviews
-- Los usuarios podrán subir fotos de los productos cuando dejen una reseña

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

-- También agregar product_id si no existe
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE CASCADE;

-- Agregar campo de rating (alias de calificacion para compatibilidad)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating INTEGER;

-- Agregar campo de comment (alias de comentario para compatibilidad)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS comment TEXT;

-- Agregar campo de verificación
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Crear índice para búsquedas por product_id
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);

-- Comentarios
COMMENT ON COLUMN reviews.images IS 'Array JSON de URLs de imágenes subidas por el usuario [{url: string, thumbnail: string}]';
COMMENT ON COLUMN reviews.is_verified IS 'Indica si la reseña es de una compra verificada';
