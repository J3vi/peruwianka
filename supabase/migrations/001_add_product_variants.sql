-- ============================================
-- MIGRACIÓN: Agregar soporte de variantes a productos
-- ============================================

-- 1. Agregar columna has_variants a la tabla products
ALTER TABLE products 
ADD COLUMN has_variants BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Crear tabla de variantes de producto
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- ej: '250 g', '1 L', 'Pack 6 unidades'
  amount NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL, -- g, kg, ml, l, und
  price NUMERIC(10,2) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Crear índices
-- Índice para búsquedas por producto
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

-- Índice único parcial: solo una variante default por producto
CREATE UNIQUE INDEX idx_product_variants_one_default_per_product 
ON product_variants(product_id) 
WHERE is_default = TRUE;

-- Índice para ordenamiento
CREATE INDEX idx_product_variants_sort_order ON product_variants(product_id, sort_order);

-- Índice para filtrar activos
CREATE INDEX idx_product_variants_active ON product_variants(product_id, is_active) 
WHERE is_active = TRUE;

-- 4. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para product_variants
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de RLS

-- Política: Las variantes son visibles por todos (solo activas)
CREATE POLICY "Product variants are viewable by everyone" 
ON product_variants FOR SELECT 
USING (is_active = TRUE);

-- Política: Las variantes son insertables solo por admins
CREATE POLICY "Product variants are insertable by admins only" 
ON product_variants FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Política: Las variantes son actualizables solo por admins
CREATE POLICY "Product variants are updatable by admins only" 
ON product_variants FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Política: Las variantes son eliminables solo por admins
CREATE POLICY "Product variants are deletable by admins only" 
ON product_variants FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- 8. Comentarios para documentación
COMMENT ON TABLE product_variants IS 'Variantes de productos (tamaños, presentaciones, etc.)';
COMMENT ON COLUMN product_variants.label IS 'Etiqueta descriptiva ej: 250 g, 1 L, Pack 6 unidades';
COMMENT ON COLUMN product_variants.amount IS 'Cantidad numérica del producto';
COMMENT ON COLUMN product_variants.unit IS 'Unidad de medida: g, kg, ml, l, und';
COMMENT ON COLUMN product_variants.is_default IS 'Indica si es la variante por defecto del producto (solo una por producto)';
COMMENT ON COLUMN product_variants.sort_order IS 'Orden de visualización de las variantes';
