# Implementación de Variantes de Producto - Resumen

## Archivos Modificados/Creados

### 1. Componente Compartido
**`src/app/admin/productos/VariantsEditor.tsx`** (NUEVO)
- Componente cliente para gestionar variantes de producto
- Features:
  - Toggle "Este producto tiene variantes"
  - Tabla de variantes con columnas: Activo, Etiqueta, Cantidad, Unidad, Precio, Default, Orden, Eliminar
  - Botón "+ Agregar variante"
  - Validaciones en tiempo real
  - Solo una variante puede ser default (auto-desmarca otras)
  - Sincronización automática con inputs ocultos del formulario

### 2. Crear Producto
**`src/app/admin/productos/nuevo/page.tsx`** (MODIFICADO)
- Agregado import de VariantsEditor
- Agregada sección "Variantes" debajo de Precio/Peso/Descuento
- Agregados inputs ocultos para has_variants y variants_json
- Modificado server action createProduct para leer y enviar variantes al API

### 3. Editar Producto
**`src/app/admin/productos/[id]/page.tsx`** (MODIFICADO)
- Agregado import de VariantsEditor
- Agregada carga de variantes existentes desde la base de datos
- Agregada sección "Variantes" con VariantsEditor
- Modificado server action updateProduct para leer y enviar variantes al API

### 4. API - Crear Producto
**`src/app/api/admin/productos/route.ts`** (MODIFICADO)
- Agregado soporte para has_variants y variants en el body
- Lógica de inserción de variantes después de crear el producto
- Validación: al menos una variante debe ser default
- Si no hay default explícito, la primera activa se marca como default

### 5. API - Editar Producto
**`src/app/api/admin/productos/[id]/route.ts`** (MODIFICADO)
- Agregado soporte para has_variants y variants en el body
- Implementada lógica de sincronización (sync):
  1. Eliminar variantes que ya no están en la lista
  2. Actualizar variantes existentes (upsert)
  3. Insertar nuevas variantes
- Si has_variants = false, todas las variantes se marcan como inactivas (is_active = false)
- Validación: al menos una variante debe ser default

## Cómo Probar en Local

### 1. Crear Producto con Variantes
1. Ir a `/admin/productos/nuevo`
2. Llenar datos básicos (nombre, descripción, precio, peso, categoría, marca, imagen)
3. Activar toggle "Este producto tiene variantes"
4. Agregar variantes:
   - Ejemplo 1: Etiqueta "250g", Cantidad 250, Unidad "g", Precio 15.00, Default: Sí
   - Ejemplo 2: Etiqueta "500g", Cantidad 500, Unidad "g", Precio 25.00, Default: No
5. Click en "Crear producto"
6. Verificar en base de datos:
   ```sql
   SELECT * FROM products WHERE has_variants = true;
   SELECT * FROM product_variants WHERE product_id = <id>;
   ```

### 2. Editar Producto con Variantes
1. Ir a `/admin/productos/[id]` (producto con variantes)
2. Modificar precio de una variante
3. Agregar nueva variante
4. Eliminar una variante existente
5. Cambiar cuál es la default
6. Guardar cambios
7. Verificar en base de datos que los cambios se reflejaron

### 3. Desactivar Variantes
1. Editar producto con variantes
2. Desactivar toggle "Este producto tiene variantes"
3. Guardar
4. Verificar que has_variants = false y todas las variantes tienen is_active = false

## Reglas de Negocio Implementadas

1. **Solo una variante default**: Al marcar una variante como default, las demás se desmarcan automáticamente
2. **Validaciones frontend**:
   - Etiqueta requerida
   - Cantidad > 0
   - Precio > 0
   - Unidad requerida
3. **Auto-default**: Si no hay ninguna variante marcada como default, la primera activa se marca automáticamente
4. **Preservación de datos**: Al desactivar variantes (has_variants = false), los datos se mantienen pero se marcan como inactivos

## Notas Técnicas

- El componente VariantsEditor es un Client Component que usa React state
- La comunicación con el formulario server-side se hace mediante inputs ocultos (hidden inputs)
- El componente usa useEffect para sincronizar el estado con los inputs ocultos
- Las validaciones ocurren tanto en frontend (UX) como en backend (seguridad)
