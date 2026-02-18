-- Add stock_qty column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN products.stock_qty IS 'Current stock quantity for restock management';

