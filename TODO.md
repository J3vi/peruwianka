# TODO: Agregar botón "Eliminar" en panel admin productos

## Pasos completados:
- [x] 1. Agregar endpoint DELETE en `src/app/api/admin/productos/[id]/route.ts`
- [x] 2. Crear componente `DeleteButton.tsx` en `src/app/admin/productos/`
- [x] 3. Actualizar `page.tsx` para usar el botón Eliminar

## Notas:
- Ruta del fetch: `/api/admin/productos/` + id
- Mensaje confirmación: "Esta acción no se puede deshacer."
- Si ok: router.refresh() + alert("Eliminado")
- Si error: alert("No se pudo eliminar")

