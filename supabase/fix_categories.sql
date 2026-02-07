-- ============================================================
-- SCRIPT DE REPARACIÓN DE CATEGORÍAS
-- Objetivo: Corregir slugs y asignar category_id a productos sin categoría
-- IMPORTANTE: Ejecutar este script en el SQL Editor de Supabase
-- ============================================================

-- ============================================================
-- PASO 1: Verificar categorías existentes
-- ============================================================
SELECT id, name, slug FROM categories ORDER BY name;

-- ============================================================
-- PASO 2: REPORTE - Ver qué categorías tienen productos
-- ============================================================
SELECT 
  c.id,
  c.name,
  c.slug,
  COUNT(p.id) as productos_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY productos_count DESC;

-- ============================================================
-- PASO 3: REPORTE - Productos sin categoría (category_id NULL)
-- ============================================================
SELECT 
  p.id,
  p.name,
  p.slug,
  p.category_id
FROM products p
WHERE p.category_id IS NULL
ORDER BY p.id;

-- ============================================================
-- PASO 4: CORRECCIÓN DE SLUGS DE CATEGORÍAS
-- ============================================================

-- 4.1. Corregir "Condimentos y Especies" -> "condimentos-y-especias"
-- Primero verificar que no exista ya el slug correcto
SELECT id, name, slug FROM categories WHERE slug IN ('condimentos-y-especias', 'Condimentos y Especies');

-- Actualizar el slug
UPDATE categories 
SET slug = 'condimentos-y-especias'
WHERE slug = 'Condimentos y Especies';

-- Verificar
SELECT id, name, slug FROM categories WHERE name ILIKE '%Condimentos%';

-- ============================================================
-- PASO 5: ASIGNAR CATEGORÍAS A PRODUCTOS
-- ============================================================

-- 5.1. Productos con "Sazón" -> Condimentos y Especias
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'condimentos-y-especias'
  AND p.category_id IS NULL
  AND LOWER(p.name) LIKE '%sazón%';

-- 5.2. Productos con "ají", "aji" -> ajies
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'ajies'
  AND p.category_id IS NULL
  AND (
    LOWER(p.name) LIKE '%ají%' OR 
    LOWER(p.name) LIKE '%aji%'
  );

-- 5.3. Productos con "culantro", "orégano", "huacatay" -> hierbas
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'hierbas'
  AND p.category_id IS NULL
  AND (
    LOWER(p.name) LIKE '%culantro%' OR 
    LOWER(p.name) LIKE '%orégano%' OR
    LOWER(p.name) LIKE '%oregano%' OR
    LOWER(p.name) LIKE '%huacatay%'
  );

-- 5.4. Productos con "tari", "cúrcuma", "achiote", "cacao" -> especias
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'especias'
  AND p.category_id IS NULL
  AND (
    LOWER(p.name) LIKE '%tari%' OR 
    LOWER(p.name) LIKE '%cúrcuma%' OR 
    LOWER(p.name) LIKE '%curcuma%' OR
    LOWER(p.name) LIKE '%achiote%' OR
    LOWER(p.name) LIKE '%cacao%'
  );

-- 5.5. Productos con "maíz", "maiz", "quinoa", "yuca" -> granos
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'granos'
  AND p.category_id IS NULL
  AND (
    LOWER(p.name) LIKE '%maíz%' OR 
    LOWER(p.name) LIKE '%maiz%' OR 
    LOWER(p.name) LIKE '%quinoa%' OR
    LOWER(p.name) LIKE '%yuca%'
  );

-- 5.6. Productos con "inca kola", "chicha", "café" -> bebidas
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'bebidas'
  AND p.category_id IS NULL
  AND (
    LOWER(p.name) LIKE '%inca kola%' OR 
    LOWER(p.name) LIKE '%chicha%' OR 
    LOWER(p.name) LIKE '%café%' OR
    LOWER(p.name) LIKE '%cafe%'
  );

-- 5.7. Productos con "papas", "canchita", "maní", "mani" -> snacks
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'snacks'
  AND p.category_id IS NULL
  AND (
    LOWER(p.name) LIKE '%papas%' OR 
    LOWER(p.name) LIKE '%canchita%' OR 
    LOWER(p.name) LIKE '%maní%' OR
    LOWER(p.name) LIKE '%mani%'
  );

-- 5.8. Productos con "atún", "atun", "palmito" -> conservas
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'conservas'
  AND p.category_id IS NULL
  AND (
    LOWER(p.name) LIKE '%atún%' OR 
    LOWER(p.name) LIKE '%atun%' OR 
    LOWER(p.name) LIKE '%palmito%'
  );

-- 5.9. Productos con "pack", "descubrimiento" -> pack
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE c.slug = 'pack'
  AND p.category_id IS NULL
  AND (
    LOWER(p.name) LIKE '%pack%' OR 
    LOWER(p.name) LIKE '%descubrimiento%'
  );

-- ============================================================
-- PASO 6: VERIFICACIÓN FINAL
-- ============================================================

-- 6.1. Ver productos por categoría
SELECT 
  c.name as categoria,
  c.slug,
  COUNT(p.id) as cantidad
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
GROUP BY c.id, c.name, c.slug
ORDER BY cantidad DESC;

-- 6.2. Verificar que bebidas y snacks tengan productos diferentes
-- Bebidas:
SELECT p.id, p.name, c.name as categoria, c.slug as categoria_slug
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'bebidas'
ORDER BY p.name;

-- Snacks:
SELECT p.id, p.name, c.name as categoria, c.slug as categoria_slug
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'snacks'
ORDER BY p.name;

-- 6.3. Verificar condimentos y especias
SELECT p.id, p.name, c.name as categoria, c.slug as categoria_slug
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.slug = 'condimentos-y-especias'
ORDER BY p.name;

-- 6.4. Total de productos
SELECT 
  COUNT(*) as total_productos,
  COUNT(category_id) as con_categoria,
  COUNT(*) - COUNT(category_id) as sin_categoria
FROM products;

