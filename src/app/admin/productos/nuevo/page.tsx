import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import VariantsEditor from "../VariantsEditor";


function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Verifica si un descuento está vencido (pero aún tiene discount_percent > 0)
 */
function isDiscountExpired(discount_percent: number | null, discount_until: string | null): boolean {
  const discount = Number(discount_percent ?? 0);
  if (discount <= 0) return false;
  if (!discount_until) return false;
  const until = new Date(discount_until).getTime();
  return until <= Date.now();
}

export default async function NuevoProductoPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  // Cargar categorías y marcas
  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });

  const { data: brands } = await supabase
    .from("brands")
    .select("id,name")
    .order("name", { ascending: true });

  async function createProduct(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const price = Number(formData.get("price") ?? 0);
    const weight = Number(formData.get("weight") ?? 0);
    const discount_percent = Number(formData.get("discount_percent") ?? 0);
    const discount_until_raw = formData.get("discount_until");
    const category_id_raw = formData.get("category_id");
    const brand_id_raw = formData.get("brand_id");
    const image_url = String(formData.get("image_url") ?? "").trim();
    const file = formData.get("file");

    // Leer variantes del formulario primero para validación condicional
    const has_variants = formData.get("has_variants") === "on";
    
    // Validar campos obligatorios básicos
    const errors: string[] = [];
    if (!name) errors.push("nombre");
    if (!description) errors.push("descripción");
    // Solo validar precio y peso si no tiene variantes
    if (!has_variants && (!price || price <= 0)) errors.push("precio (mayor a 0)");
    if (!has_variants && (!weight || weight <= 0)) errors.push("peso (mayor a 0)");
    if (!category_id_raw || String(category_id_raw) === "") errors.push("categoría");
    if (!brand_id_raw || String(brand_id_raw) === "") errors.push("marca");


    const category_id = Number(category_id_raw);
    const brand_id = Number(brand_id_raw);

    // Validar imagen
    const hasFile = file instanceof File && file.size > 0;
    const hasImageUrl = image_url.startsWith("http");

    if (!hasFile && !hasImageUrl) {
      redirect(
        `/admin/productos/nuevo?error=${encodeURIComponent(
          "Sube una imagen o pega una URL"
        )}`
      );
    }

    if (errors.length > 0) {
      redirect(
        `/admin/productos/nuevo?error=${encodeURIComponent(
          `Faltan campos: ${errors.join(", ")}`
        )}`
      );
    }

    // Validar discount_percent (0-90)
    let discount = discount_percent;
    if (discount < 0 || discount > 90) {
      discount = 0;
    }

    const origin = headers().get("origin") ?? "http://localhost:3000";
    const cookieHeader = cookies()
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    let finalImageUrl = image_url;

    // Subir imagen si hay archivo
    if (hasFile) {
      const fd = new FormData();
      fd.set("file", file);

      const upRes = await fetch(`${origin}/api/admin/productos/upload`, {
        method: "POST",
        body: fd,
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });

      if (!upRes.ok) {
        const j = await upRes.json().catch(() => ({}));
        redirect(
          `/admin/productos/nuevo?error=${encodeURIComponent(
            j?.error || "Error subiendo imagen"
          )}`
        );
      }

      const upJson = await upRes.json();
      finalImageUrl = upJson.publicUrl;
    }

    // Generar slug
    let slug = String(formData.get("slug") ?? "").trim();
    if (!slug && name) {
      slug = slugify(name);
    }

    // Procesar discount_until
    const discount_until =
      discount_until_raw && String(discount_until_raw).trim() !== ""
        ? new Date(String(discount_until_raw)).toISOString()
        : null;

    // Leer variantes del formulario
    const variantsJson = String(formData.get("variants_json") || "[]");

    let variants: any[] = [];
    try {
      variants = JSON.parse(variantsJson);
    } catch {
      variants = [];
    }

    // Enviar al API

    const res = await fetch(`${origin}/api/admin/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        name,
        slug,
        description,
        price,
        weight,
        discount_percent: discount,
        discount_until,
        category_id,
        brand_id,
        image_url: finalImageUrl,
        has_variants,
        variants: has_variants ? variants : [],
      }),

      cache: "no-store",
    });

    const j = await res.json().catch(() => ({}));

    if (!res.ok) {
      redirect(
        `/admin/productos/nuevo?error=${encodeURIComponent(
          j?.error ?? "Error creando producto"
        )}`
      );
    }

    redirect(`/admin/productos/${j.data.id}?ok=1`);
  }

  const errorMsg =
    typeof searchParams.error === "string"
      ? decodeURIComponent(searchParams.error)
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Crear producto</h1>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-400 rounded-xl text-red-700">
          {errorMsg}
        </div>
      )}

      <form action={createProduct} className="grid grid-cols-12 gap-6">
        {/* Left Column - 8 cols */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Información básica</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  name="name"
                  placeholder="Ej: Ají Amarillo"
                  required
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (opcional, se genera del nombre)
                </label>
                <input
                  name="slug"
                  placeholder="Ej: aji-amarillo"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  placeholder="Describe el producto..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Precio e inventario</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio (PLN) <span id="price-required">*</span>
                </label>
                <input
                  name="price"
                  id="price_input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (g) <span id="weight-required">*</span>
                </label>
                <input
                  name="weight"
                  id="weight_input"
                  type="number"
                  min="1"
                  required
                  placeholder="0"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento %
                </label>
                <input
                  name="discount_percent"
                  type="number"
                  min="0"
                  max="90"
                  defaultValue={0}
                  placeholder="0"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento hasta (fecha)
                </label>
                <input
                  name="discount_until"
                  type="datetime-local"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
            <p id="variants-helper-text" className="mt-3 text-sm text-gray-500 hidden">
              ℹ️ El precio y peso final lo define la variante seleccionada
            </p>
          </div>


          {/* Variants Card */}
          <div id="variants_card" className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Variantes</h2>
            <VariantsEditor />
            <input type="hidden" name="has_variants" id="has_variants_input" />
            <input type="hidden" name="variants_json" id="variants_json_input" />
          </div>
        </div>

        {/* Right Column - 4 cols */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Categories & Brand Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Categorización</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  name="category_id"
                  required
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca *
                </label>
                <select
                  name="brand_id"
                  required
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {(brands ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Image Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Imagen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subir imagen (JPG/PNG)
                </label>
                <input
                  type="file"
                  name="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="w-full text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Recomendado: 800×800 o 1200×1200, formato JPG o PNG.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  O URL de imagen
                </label>
                <input
                  name="image_url"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>


          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Acciones</h2>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                id="create-button"
                className="w-full px-4 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Crear producto
              </button>
              <a
                href="/admin/productos"
                className="w-full px-4 py-3 text-center text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </a>
            </div>
          </div>
        </div>
      </form>



      {/* Client-side validation for discount expiration, variants toggle, and button state */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // === Button State Management ===
              const createButton = document.getElementById('create-button');
              
              function updateButtonState(isSubmitting) {
                if (!createButton) return;
                
                if (isSubmitting) {
                  createButton.textContent = 'Creando...';
                  createButton.disabled = true;
                } else {
                  createButton.textContent = 'Crear producto';
                  createButton.disabled = false;
                }
              }
              
              // === Variants Toggle ===
              const form = document.querySelector('form');
              const discountPercentInput = document.querySelector('input[name="discount_percent"]');
              const discountUntilInput = document.querySelector('input[name="discount_until"]');
              const hasVariantsInput = document.getElementById('has_variants_input');
              const priceInput = document.getElementById('price_input');
              const weightInput = document.getElementById('weight_input');
              const priceRequired = document.getElementById('price-required');
              const weightRequired = document.getElementById('weight-required');
              const variantsHelper = document.getElementById('variants-helper-text');
              const variantsCard = document.getElementById('variants_card');
              
              function checkDiscountExpiration() {
                const discount = parseFloat(discountPercentInput?.value) || 0;
                const untilValue = discountUntilInput?.value;
                
                // Remove existing warning
                const existingWarning = document.getElementById('discount-expired-warning');
                if (existingWarning) existingWarning.remove();
                
                if (discount > 0 && untilValue) {
                  const untilDate = new Date(untilValue);
                  if (untilDate.getTime() <= Date.now()) {
                    // Show warning
                    const warning = document.createElement('div');
                    warning.id = 'discount-expired-warning';
                    warning.style.cssText = 'margin-top: 8px; padding: 8px 12px; background: #ff4d4f; color: white; border-radius: 4px; font-size: 13px; font-weight: 600;';
                    warning.textContent = '⚠️ Fecha vencida - El descuento ya no estará activo';
                    discountUntilInput?.parentElement?.appendChild(warning);
                  }
                }
              }
              
              function updateVariantsState() {
                const hasVariants = hasVariantsInput?.value === 'on';
                
                if (hasVariants) {
                  // Disable price and weight inputs
                  priceInput.disabled = true;
                  weightInput.disabled = true;
                  priceInput.placeholder = 'Se define por variantes';
                  weightInput.placeholder = 'Se define por variantes';
                  priceInput.value = '';
                  weightInput.value = '';
                  if (priceRequired) priceRequired.style.display = 'none';
                  if (weightRequired) weightRequired.style.display = 'none';
                  if (variantsHelper) variantsHelper.classList.remove('hidden');
                  // Show variants section
                  if (variantsCard) variantsCard.classList.remove('hidden');
                } else {
                  // Enable price and weight inputs
                  priceInput.disabled = false;
                  weightInput.disabled = false;
                  priceInput.placeholder = '0.00';
                  weightInput.placeholder = '0';
                  if (priceRequired) priceRequired.style.display = 'inline';
                  if (weightRequired) weightRequired.style.display = 'inline';
                  if (variantsHelper) variantsHelper.classList.add('hidden');
                  // Hide variants section
                  if (variantsCard) variantsCard.classList.add('hidden');
                }
              }
              
              // Watch for changes on has_variants input
              const observer = new MutationObserver(updateVariantsState);
              if (hasVariantsInput) {
                observer.observe(hasVariantsInput, { attributes: true, attributeFilter: ['value'] });
              }
              
              // Initial check
              setTimeout(updateVariantsState, 100);
              
              if (form && discountPercentInput && discountUntilInput) {
                discountPercentInput.addEventListener('input', checkDiscountExpiration);
                discountUntilInput.addEventListener('input', checkDiscountExpiration);
              }

              // Intercept form submission to show loading state
              if (form) {
                form.addEventListener('submit', function() {
                  updateButtonState(true);
                });
              }

            })();
          `,
        }}
      />


    </div>
  );
}
