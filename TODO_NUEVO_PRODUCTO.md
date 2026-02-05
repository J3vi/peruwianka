# TODO - Implementar formulario nuevo producto

## 1. Backend API - Validar y crear producto
- [x] Crear `/src/app/api/admin/productos/upload/route.ts`:
  - [x] Endpoint POST que reciba FormData con `file`
  - [x] Upload a Supabase Storage (bucket: product-images)
  - [x] Retornar publicUrl

- [x] Modificar `/src/app/api/admin/productos/route.ts` POST:
  - [x] Agregar validación de campos obligatorios: name, description, price, weight, category_id, brand_id
  - [x] Validar discount_percent (0-90)
  - [x] **CRÍTICO**: Si no hay image_url → devolver 400 con "Sube una imagen o pega una URL"
  - [x] Cambiar price_estimated a price en el payload

## 3. Frontend - Página nuevo producto
- [x] Modificar `/src/app/admin/productos/nuevo/page.tsx`:
  - [x] Cargar categories y brands desde Supabase
  - [x] Agregar campos: price, weight, discount_percent, category_id, brand_id
  - [x] Agregar input image_url y input type="file"
  - [x] Validar en frontend que haya imagen (archivo o URL)
  - [x] En submit: primero upload imagen → obtener URL → POST con todos los datos

## Notas:
- El campo de precio debe ser `price` (no `price_estimated`)
- discount_percent opcional con default 0, validar rango 0-90
- slug autogenerado desde name si no se envía

