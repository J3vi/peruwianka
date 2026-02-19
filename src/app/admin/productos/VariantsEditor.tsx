"use client";

import { useState, useEffect, useRef } from "react";

export interface VariantFormData {
  id?: number; // undefined for new variants
  label: string;
  amount: number;
  unit: string;
  price: number;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
}

interface VariantsEditorProps {
  initialVariants?: VariantFormData[];
  initialHasVariants?: boolean;
  hasVariantsInputId?: string;
  variantsJsonInputId?: string;
}

const UNITS = [
  { value: "g", label: "g (gramos)" },
  { value: "kg", label: "kg (kilogramos)" },
  { value: "ml", label: "ml (mililitros)" },
  { value: "l", label: "l (litros)" },
  { value: "und", label: "und (unidades)" },
];

export default function VariantsEditor({
  initialVariants = [],
  initialHasVariants = false,
  hasVariantsInputId = "has_variants_input",
  variantsJsonInputId = "variants_json_input",
}: VariantsEditorProps) {
  const [variants, setVariants] = useState<VariantFormData[]>(initialVariants);
  const [hasVariants, setHasVariants] = useState(initialHasVariants || initialVariants.length > 0);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const hasVariantsRef = useRef<HTMLInputElement | null>(null);
  const variantsJsonRef = useRef<HTMLInputElement | null>(null);

  // Get refs to hidden inputs
  useEffect(() => {
    hasVariantsRef.current = document.getElementById(hasVariantsInputId) as HTMLInputElement;
    variantsJsonRef.current = document.getElementById(variantsJsonInputId) as HTMLInputElement;
  }, [hasVariantsInputId, variantsJsonInputId]);

  // Sync hidden inputs when state changes
  useEffect(() => {
    if (hasVariantsRef.current) {
      hasVariantsRef.current.value = hasVariants ? "on" : "";
    }
    if (variantsJsonRef.current) {
      variantsJsonRef.current.value = JSON.stringify(variants);
    }
  }, [hasVariants, variants]);

  // Initialize with one default variant if empty and hasVariants is true
  useEffect(() => {
    if (hasVariants && variants.length === 0) {
      const defaultVariant: VariantFormData = {
        label: "",
        amount: 0,
        unit: "g",
        price: 0,
        is_default: true,
        sort_order: 0,
        is_active: true,
      };
      setVariants([defaultVariant]);
    }
  }, [hasVariants, variants.length]);


  const validateVariant = (variant: VariantFormData, index: number): string | null => {
    if (!variant.label.trim()) {
      return "La etiqueta es requerida";
    }
    if (variant.amount <= 0) {
      return "La cantidad debe ser mayor a 0";
    }
    if (variant.price <= 0) {
      return "El precio debe ser mayor a 0";
    }
    if (!variant.unit) {
      return "La unidad es requerida";
    }
    return null;
  };

  const validateAll = (): boolean => {
    const newErrors: Record<number, string> = {};
    let hasError = false;

    variants.forEach((variant, index) => {
      const error = validateVariant(variant, index);
      if (error) {
        newErrors[index] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  const addVariant = () => {
    const newVariant: VariantFormData = {
      label: "",
      amount: 0,
      unit: "g",
      price: 0,
      is_default: variants.length === 0, // First variant is default
      sort_order: variants.length,
      is_active: true,
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    
    // If we removed the default, make the first active one the default
    const wasDefault = variants[index]?.is_default;
    if (wasDefault && newVariants.length > 0) {
      const firstActiveIndex = newVariants.findIndex(v => v.is_active);
      if (firstActiveIndex >= 0) {
        newVariants[firstActiveIndex].is_default = true;
      } else {
        newVariants[0].is_default = true;
      }
    }

    // Re-calculate sort orders
    newVariants.forEach((v, i) => {
      v.sort_order = i;
    });

    setVariants(newVariants);
  };

  const updateVariant = (index: number, updates: Partial<VariantFormData>) => {
    const newVariants = [...variants];
    const currentVariant = newVariants[index];
    
    // If trying to deactivate a default variant, prevent it
    if (updates.is_active === false && currentVariant.is_default) {
      alert("La variante por defecto debe estar activa");
      return;
    }
    
    newVariants[index] = { ...currentVariant, ...updates };

    // If setting this variant as default, force is_active=true and unset others
    if (updates.is_default === true) {
      newVariants[index].is_active = true;
      newVariants.forEach((v, i) => {
        if (i !== index) {
          v.is_default = false;
        }
      });
    }

    // Clear error for this variant if it exists
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }

    setVariants(newVariants);
  };


  const handleToggleChange = (checked: boolean) => {
    setHasVariants(checked);
    if (!checked) {
      // When disabling variants, keep data but mark all as inactive
      const inactiveVariants = variants.map(v => ({ ...v, is_active: false }));
      setVariants(inactiveVariants);
    } else if (variants.length === 0) {
      // When enabling and no variants, create default one
      const defaultVariant: VariantFormData = {
        label: "",
        amount: 0,
        unit: "g",
        price: 0,
        is_default: true,
        sort_order: 0,
        is_active: true,
      };
      setVariants([defaultVariant]);
    }
  };


  return (
    <div className="mt-4">
      {/* Toggle for has_variants */}
      <label className="flex items-center gap-3 cursor-pointer py-3 border-b border-gray-200">
        <input
          type="checkbox"
          checked={hasVariants}
          onChange={(e) => handleToggleChange(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 cursor-pointer"
        />
        <span className="font-semibold text-gray-800">
          Este producto tiene variantes
        </span>
      </label>

      {/* Variants Editor - only show when hasVariants is true */}
      {hasVariants && (
        <div className="mt-4">
          {/* Variants Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-[50px_1fr_80px_100px_100px_60px_60px_50px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-sm items-center">
              <span>Activo</span>
              <span>Etiqueta</span>
              <span>Cant.</span>
              <span>Unidad</span>
              <span>Precio</span>
              <span className="text-center">Def.</span>
              <span className="text-center">Ord.</span>
              <span></span>
            </div>

            {/* Mobile Header - visible only on small screens */}
            <div className="md:hidden grid grid-cols-[50px_1fr_50px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-sm items-center">
              <span>Act.</span>
              <span>Variante</span>
              <span></span>
            </div>

            {/* Variant Rows */}
            {variants.map((variant, index) => (
              <div
                key={index}
                className={`grid md:grid-cols-[50px_1fr_80px_100px_100px_60px_60px_50px] grid-cols-[50px_1fr_50px] gap-2 px-4 py-3 items-center ${
                  index < variants.length - 1 ? "border-b border-gray-100" : ""
                } ${errors[index] ? "bg-red-50" : "bg-white"}`}
              >
                {/* Active Switch */}
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variant.is_active}
                    onChange={(e) =>
                      updateVariant(index, { is_active: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                </label>

                {/* Desktop: Individual fields */}
                <div className="hidden md:block">
                  <input
                    type="text"
                    value={variant.label}
                    onChange={(e) =>
                      updateVariant(index, { label: e.target.value })
                    }
                    placeholder="Ej: 250g"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Mobile: Combined fields */}
                <div className="md:hidden space-y-2">
                  <input
                    type="text"
                    value={variant.label}
                    onChange={(e) =>
                      updateVariant(index, { label: e.target.value })
                    }
                    placeholder="Etiqueta (ej: 250g)"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={variant.amount || ""}
                      onChange={(e) =>
                        updateVariant(index, {
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Cant."
                      className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <select
                      value={variant.unit}
                      onChange={(e) =>
                        updateVariant(index, { unit: e.target.value })
                      }
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.value}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={variant.price || ""}
                      onChange={(e) =>
                        updateVariant(index, {
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="Precio"
                      className="w-24 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Amount - Desktop only */}
                <div className="hidden md:block">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={variant.amount || ""}
                    onChange={(e) =>
                      updateVariant(index, {
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Unit - Desktop only */}
                <div className="hidden md:block">
                  <select
                    value={variant.unit}
                    onChange={(e) =>
                      updateVariant(index, { unit: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price - Desktop only */}
                <div className="hidden md:block">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={variant.price || ""}
                    onChange={(e) =>
                      updateVariant(index, {
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Default Radio */}
                <label className="hidden md:flex items-center justify-center cursor-pointer">
                  <input
                    type="radio"
                    name="default_variant"
                    checked={variant.is_default}
                    onChange={() => updateVariant(index, { is_default: true })}
                    className="w-4 h-4 cursor-pointer"
                  />
                </label>

                {/* Sort Order - Desktop only */}
                <div className="hidden md:block">
                  <input
                    type="number"
                    min="0"
                    value={variant.sort_order}
                    onChange={(e) =>
                      updateVariant(index, {
                        sort_order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm text-center focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  disabled={variants.length === 1}
                  className={`px-2 py-1 rounded-md text-white text-sm font-semibold ${
                    variants.length === 1
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 cursor-pointer"
                  }`}
                  title={
                    variants.length === 1
                      ? "Debe tener al menos una variante"
                      : "Eliminar variante"
                  }
                >
                  ×
                </button>
              </div>
            ))}

            {/* Error Messages */}
            {Object.keys(errors).length > 0 && (
              <div className="px-4 py-3 bg-red-50 border-t border-red-400">
                {Object.entries(errors).map(([index, error]) => (
                  <div key={index} className="text-red-600 text-sm">
                    Variante {parseInt(index) + 1}: {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Variant Button */}
          <button
            type="button"
            onClick={addVariant}
            className="mt-4 px-4 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            + Agregar variante
          </button>

          {/* Helper Text */}
          <p className="mt-3 text-sm text-gray-500 italic">
            * Solo una variante puede ser la default. Si no marca ninguna, se
            usará la primera activa automáticamente.
          </p>
        </div>
      )}
    </div>
  );

}
