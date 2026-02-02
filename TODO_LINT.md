# TODO: Limpiar Warnings de ESLint

## Archivos modificados:

### 1. src/app/admin/productos/ImageCell.tsx ✓
- [x] Reemplazar `<img>` por `<Image />`
- [x] Añadir fill, sizes, width/height mediante wrapper div
- [x] Mantener alt, className, loading, onError

### 2. src/components/CartDropdown.tsx ✓
- [x] Reemplazar `<img>` del map por `<Image />` con width/height/alt
- [x] useMemo total: quitar `cart` de deps, dejar `[getTotal]`
- [x] useMemo count: quitar `cart` de deps, dejar `[getCount]`

### 3. src/app/cuenta/page.tsx ✓
- [x] Envolver `loadUserAndOrders` en `useCallback` con deps [supabase, router]
- [x] Agregar `[loadUserAndOrders]` al useEffect deps

### 4. Verificación
- [x] next.config.js tiene remotePatterns para supabase.co ✓

## Comandos finales (por ejecutar):
- npm run lint
- npm run build

