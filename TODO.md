# TODO: Implement Cache-Busting for Banner Images and Daily Revalidation

## Steps to Complete

1. **Check/Add updated_at to banners table**
   - Verify if banners table has updated_at column.
   - If not, create a migration to add updated_at with trigger.
   - ✅ Created migration 002_add_banners_table.sql with updated_at and trigger.

2. **Modify src/app/page.tsx**
   - Remove `export const dynamic = "force-dynamic";`
   - Add `export const revalidate = 86400;`
   - Fetch banners server-side: select("image_url, link_url, created_at, updated_at").eq("is_active", true).order("order_index")
   - Pass fetched banners to BannerCarousel component.

3. **Modify src/components/BannerCarousel.tsx**
   - Update Banner type to include created_at and updated_at.
   - Accept banners as optional prop (default to empty array).
   - Remove client-side fetch useEffect.
   - In images useMemo, apply cache-busting: `${b.image_url}?v=${new Date(b.updated_at ?? b.created_at ?? Date.now()).getTime()}`
   - If no banners, use FALLBACK_IMAGES.

4. **Update Admin Files**
   - In src/app/admin/banners/page.tsx and BannersClient.tsx, update select to include updated_at.
   - Update Banner type in admin to include updated_at.

5. **Test Changes**
   - Verify banners load with versioned URLs.
   - Check that page revalidates daily (simulate or wait).
   - Ensure fallback works if no banners.

## Progress
- [x] Step 1: Check/Add updated_at
- [ ] Step 2: Modify page.tsx
- [ ] Step 3: Modify BannerCarousel.tsx
- [ ] Step 4: Update Admin
- [ ] Step 5: Test
