# TODO: Category Filter for Admin Productos

## Objective
Add a category filter dropdown to `/admin/productos` page using a `<select>` above the table.

## Tasks

- [x] 1. Analyze current implementation and understand the codebase
- [x] 2. Create plan with user confirmation
- [x] 3. Create `CategoryFilter.tsx` (Client Component)
- [x] 4. Modify `page.tsx`:
      - Add `categoria` to searchParams type
      - Fetch categories from DB (public.categories)
      - Modify product query to filter by category slug
      - Render CategoryFilter component
- [x] 5. Test the implementation (Build passed successfully!)

## Implementation Details

### CategoryFilter.tsx
- Accepts `categories` array and `selectedCategory` slug
- Renders `<select>` with "Todas las categorías" as first option
- On change: navigates preserving existing query params
- If categoria is empty, removes the param from URL

### page.tsx
- Fetch categories: `select id, name, slug from categories order by name`
- Product query: if selected is not empty, filter by category using join with categories table
- Filter by `categories.slug = <param>`

