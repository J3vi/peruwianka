"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Category = {
  id: number;
  name: string;
  slug: string;
};

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
}: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;

    // Build new URL with preserved query params
    const params = new URLSearchParams(searchParams.toString());

    if (newValue) {
      params.set("categoria", newValue);
    } else {
      params.delete("categoria");
    }

    router.push(`/admin/productos?${params.toString()}`);
  };

  return (
    <select
      value={selectedCategory}
      onChange={handleChange}
      style={{
        width: 200,
        padding: "8px 10px",
        border: "1px solid #ccc",
        borderRadius: 10,
        cursor: "pointer",
      }}
    >
      <option value="">Todas las categorías</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.slug}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}

