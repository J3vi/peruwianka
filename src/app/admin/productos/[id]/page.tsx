import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import ScrollToFlash from "./ScrollToFlash";
import { ClearDiscountButton } from "./ClearDiscountButton";
import VariantsEditor from "../VariantsEditor";
import type { VariantFormData } from "../VariantsEditor";


type PageProps = { params: { id: string }; searchParams?: { error?: string; success?: string } };

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

export default async function AdminProductoEditPage({ params, searchParams }: PageProps) {
  const supabase = await createClient();
  const id = Number(params.id);

  const errorMsg = searchParams?.error ? decodeURIComponent(searchParams.error) : null;
  const successMsg = searchParams?.success ? decodeURIComponent(searchParams.success) : null;

  if (!Number.isFinite(id)) {
    return (
      <div style={{ padding: 24 }}>
        <p>ID inválido.</p>
        <Link href="/admin/productos">← Volver</Link>
      </div>
    );
  }

  const { data: product, error } = await supabase
    .from("v_admin_products")
    .select("*")
    .eq("id", id)
    .single();

  // Load existing variants
  const { data: existingVariants } = await supabase
    .from("product_variants")
    .select("id,label,amount,unit,price,is_default,sort_order,is_active")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });


  if (error || !product) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Editar producto</h1>
        <p style={{ marginTop: 12, color: "crimson" }}>
          No se pudo cargar el producto: {error?.message ?? "No encontrado"}
        </p>
        <Link href="/admin/productos" style={{ textDecoration: "underline" }}>
          ← Volver
        </Link>
      </div>
    );
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });

  const { data: brands } = await supabase
    .from("brands")
    .select("id,name")
    .order("name", { ascending: true });

  async function updateProduct(formData: FormData) {
    "use server";
    const supabase = await createClient();

    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const image_url = String(formData.get("image_url") ?? "").trim();

    const price_estimated = Number(formData.get("price_estimated") ?? 0);
    const weight = Number(formData.get("weight") ?? 0);
    const discount_percent = Number(formData.get("discount_percent") ?? 0);
    const discount_until_raw = formData.get("discount_until");
    const discount_until = discount_until_raw && String(discount_until_raw).trim() !== "" 
      ? new Date(String(discount_until_raw)).toISOString() 
      : null;

    const is_active = formData.get("is_active") === "on";

    // Read variants data
    const has_variants = formData.get("has_variants") === "on";
    const variantsJson = String(formData.get("variants_json") || "[]");
    let variants: VariantFormData[] = [];
    try {
      variants = JSON.parse(variantsJson);
    } catch {
      variants = [];
    }

    const category_id_raw = formData.get("category_id");
    const brand_id_raw = formData.get("brand_id");


    const category_id =
      category_id_raw && String(category_id_raw) !== "" ? Number(category_id_raw) : null;
    const brand_id =
      brand_id_raw && String(brand_id_raw) !== "" ? Number(brand_id_raw) : null;

    if (!name) {
      // No tiramos exception: redirigimos a la misma página con un estado mínimo.
      redirect(`/admin/productos/${id}?error=NAME_REQUIRED`);
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();

    if (userErr) {
      redirect(`/admin/productos/${id}?error=${encodeURIComponent("getUser error: " + userErr.message)}`);
    }

    if (!userData?.user) {
      redirect(`/admin/productos/${id}?error=${encodeURIComponent("NO_USER: server action sin sesión (cookies)")}`);
    }

    const origin = headers().get("origin") || "http://localhost:3000";

    // 1) Subir imagen si hay archivo
    let uploadedPublicUrl: string | null = null;
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      const fd = new FormData();
      fd.set("file", file);

      const cookieHeader = cookies()
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join("; ");

      const upRes = await fetch(`${origin}/api/admin/productos/${id}/image`, {
        method: "POST",
        body: fd,
        headers: { cookie: cookieHeader },
        cache: "no-store",
      });

      if (!upRes.ok) {
        const j = await upRes.json().catch(() => ({}));
        throw new Error(j?.error || "Error subiendo imagen");
      }

      const upJson = await upRes.json();
      uploadedPublicUrl = upJson.publicUrl;
    }

    // 2) luego tu PATCH normal /api/admin/productos/${id}
    const cookieHeader = cookies().toString();

    const payload: any = {
      name,
      description,
      price_estimated: Number.isFinite(price_estimated) ? price_estimated : 0,
      weight: Number.isFinite(weight) ? Math.trunc(weight) : 0,
      discount_percent: Number.isFinite(discount_percent) ? Math.trunc(discount_percent) : 0,
      discount_until,
      is_active,
      has_variants,
      category_id,
      brand_id,
    };


    // SOLO si tienes una URL real (subida o editada):
    if (uploadedPublicUrl && uploadedPublicUrl.startsWith("http")) {
      payload.image_url = uploadedPublicUrl;
    } else if (image_url && !image_url.includes("placehold.co")) {
      payload.image_url = image_url;
    }

    const res = await fetch(`${origin}/api/admin/productos/${id}`, {
      method: "PATCH",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      body: JSON.stringify({
        ...payload,
        variants: has_variants ? variants : [],
      }),
    });


    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const msg = j?.error || "Error guardando producto";
      redirect(`/admin/productos/${id}?error=${encodeURIComponent(msg)}`);
    }

    revalidatePath("/admin/productos");
    revalidatePath(`/admin/productos/${id}`);
    redirect(`/admin/productos/${id}?success=${encodeURIComponent("Guardado con éxito")}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {(errorMsg || successMsg) && <ScrollToFlash id="flash-msg" />}
      
      {errorMsg && (
        <div id="flash-msg" className="mb-6 p-4 bg-red-50 border border-red-400 rounded-xl text-red-700">
          <b>Error:</b> {errorMsg}
        </div>
      )}
      
      {successMsg && (
        <div id="flash-msg" className="mb-6 p-4 bg-green-50 border border-green-400 rounded-xl text-green-700">
          <b>OK:</b> {successMsg}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Editar producto</h1>
        <Link href="/admin/productos" className="text-gray-600 hover:text-gray-800 underline">
          ← Volver a productos
        </Link>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        ID: <b>{product.id}</b> · Slug: <b>{product.slug}</b>
      </p>

      <form action={updateProduct} className="grid grid-cols-12 gap-6">
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
                  defaultValue={product.name ?? ""}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  defaultValue={product.description ?? ""}
                  rows={4}
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
                  Precio (PLN) <span id="edit-price-required">*</span>
                </label>
                <input
                  name="price_estimated"
                  id="edit_price_input"
                  type="number"
                  step="0.01"
                  defaultValue={product.price_estimated ?? 0}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso (g) <span id="edit-weight-required">*</span>
                </label>
                <input
                  name="weight"
                  id="edit_weight_input"
                  type="number"
                  defaultValue={product.weight ?? 0}
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
                  defaultValue={product.discount_percent ?? 0}
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
                  defaultValue={product.discount_until ? product.discount_until.slice(0, 16) : ""}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {isDiscountExpired(product.discount_percent, product.discount_until) && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      Descuento vencido
                    </span>
                    <ClearDiscountButton productId={product.id} productName={product.name} />
                  </div>
                )}
              </div>
            </div>
            <p id="edit-variants-helper-text" className="mt-3 text-sm text-gray-500 hidden">
              ℹ️ El precio y peso final lo define la variante seleccionada
            </p>
          </div>


          {/* Variants Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Variantes</h2>
            <VariantsEditor 
              initialVariants={existingVariants || []}
              initialHasVariants={!!product.has_variants}
              hasVariantsInputId="edit_has_variants_input"
              variantsJsonInputId="edit_variants_json_input"
            />
            <input type="hidden" name="has_variants" id="edit_has_variants_input" />
            <input type="hidden" name="variants_json" id="edit_variants_json_input" />
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
                  Categoría
                </label>
                <select
                  name="category_id"
                  defaultValue={product.category_id ?? ""}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                >
                  <option value="">—</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <select
                  name="brand_id"
                  defaultValue={product.brand_id ?? ""}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                >
                  <option value="">—</option>
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
              {/* Image Preview */}
              {product.image_url && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subir imagen (JPG/PNG)
                </label>
                <input
                  type="file"
                  name="file"
                  accept="image/png,image/jpeg"
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
                  defaultValue={product.image_url ?? ""}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            </div>
          </div>


          {/* Status Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Estado</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input 
                  name="is_active" 
                  type="checkbox" 
                  defaultChecked={!!product.is_active} 
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-gray-700">Producto activo</span>
              </label>
              <label className="flex items-center gap-3">
                <input 
                  name="has_variants" 
                  type="checkbox" 
                  id="edit_has_variants_checkbox"
                  defaultChecked={!!product.has_variants} 
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="text-gray-700">Este producto tiene variantes</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Acciones</h2>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                id="save-button"
                data-initial-saved={successMsg ? "true" : "false"}
                className="w-full px-4 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar cambios
              </button>
              <Link
                href="/admin/productos"
                className="w-full px-4 py-3 text-center text-gray-600 hover:text-gray-800 font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </form>

      {/* Client-side script for variants toggle and button states */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // === Button State Management ===
              const saveButton = document.getElementById('save-button');
              const initialSaved = saveButton?.dataset?.initialSaved === 'true';
              let isDirty = false;
              let saveState = initialSaved ? 'saved' : 'idle'; // 'idle' | 'saving' | 'saved'
              
              function updateButtonState() {
                if (!saveButton) return;
                
                if (saveState === 'saving') {
                  saveButton.textContent = 'Guardando...';
                  saveButton.disabled = true;
                } else if (saveState === 'saved' && !isDirty) {
                  saveButton.textContent = 'Guardado';
                  saveButton.disabled = true;
                } else {
                  saveButton.textContent = 'Guardar cambios';
                  saveButton.disabled = !isDirty;
                }
              }
              
              function setDirty() {
                if (!isDirty) {
                  isDirty = true;
                  if (saveState === 'saved') {
                    saveState = 'idle';
                  }
                  updateButtonState();
                }
              }
              
              // === Variants Toggle ===
              const hasVariantsCheckbox = document.getElementById('edit_has_variants_checkbox');
              const hasVariantsInput = document.getElementById('edit_has_variants_input');
              const priceInput = document.getElementById('edit_price_input');
              const weightInput = document.getElementById('edit_weight_input');
              const priceRequired = document.getElementById('edit-price-required');
              const weightRequired = document.getElementById('edit-weight-required');
              const variantsHelper = document.getElementById('edit-variants-helper-text');
              const variantsCard = document.querySelector('.bg-white.rounded-xl.border.border-gray-200.p-6:nth-child(3)');
              
              function updateVariantsState() {
                const hasVariants = hasVariantsCheckbox?.checked || hasVariantsInput?.value === 'on';
                
                // Sync hidden input with checkbox
                if (hasVariantsInput) {
                  hasVariantsInput.value = hasVariants ? 'on' : '';
                }
                
                if (hasVariants) {
                  // Disable price and weight inputs
                  priceInput.disabled = true;
                  weightInput.disabled = true;
                  priceInput.placeholder = 'Se define por variantes';
                  weightInput.placeholder = 'Se define por variantes';
                  if (priceRequired) priceRequired.style.display = 'none';
                  if (weightRequired) weightRequired.style.display = 'none';
                  if (variantsHelper) variantsHelper.classList.remove('hidden');
                  // Show variants section
                  if (variantsCard) variantsCard.classList.remove('hidden');
                } else {
                  // Enable price and weight inputs
                  priceInput.disabled = false;
                  priceInput.placeholder = '';
                  weightInput.placeholder = '';
                  if (priceRequired) priceRequired.style.display = 'inline';
                  if (weightRequired) weightRequired.style.display = 'inline';
                  if (variantsHelper) variantsHelper.classList.add('hidden');
                  // Hide variants section
                  if (variantsCard) variantsCard.classList.add('hidden');
                }
              }
              
              // Listen to checkbox changes directly
              if (hasVariantsCheckbox) {
                hasVariantsCheckbox.addEventListener('change', updateVariantsState);
              }
              
              // Watch for changes on has_variants input (from VariantsEditor)
              const observer = new MutationObserver(updateVariantsState);
              if (hasVariantsInput) {
                observer.observe(hasVariantsInput, { attributes: true, attributeFilter: ['value'] });
              }
              
              // Initial check - set hidden input based on checkbox state
              if (hasVariantsCheckbox && hasVariantsInput) {
                hasVariantsInput.value = hasVariantsCheckbox.checked ? 'on' : '';
              }
              
              // Initial check after DOM is ready
              setTimeout(updateVariantsState, 100);
              
              // === Dirty Tracking ===
              // Listen to all input changes in the form
              const form = document.querySelector('form');
              if (form) {
                const inputs = form.querySelectorAll('input, select, textarea');
                inputs.forEach(function(input) {
                  // Skip the file input
                  if (input.type === 'file') return;
                  input.addEventListener('input', setDirty);
                  input.addEventListener('change', setDirty);
                });
              }
              
              // Listen for variants changes
              const variantsJsonInput = document.getElementById('edit_variants_json_input');
              if (variantsJsonInput) {
                const variantsObserver = new MutationObserver(setDirty);
                variantsObserver.observe(variantsJsonInput, { attributes: true, attributeFilter: ['value'] });
              }
              
              // Initial button state
              updateButtonState();
              
              // Intercept form submission to show saving state
              if (form) {
                form.addEventListener('submit', function() {
                  saveState = 'saving';
                  updateButtonState();
                });
              }
            })();
          `,
        }}
      />

    </div>
  );
}
