import React from 'react';

const categories = [
  { name: 'Todos', slug: 'todos' },
  { name: 'Condimentos y Especies', slug: 'condimentos-y-especies' },
  { name: 'Bebidas', slug: 'bebidas' },
  { name: 'Granos', slug: 'granos' },
  { name: 'Snacks', slug: 'snacks' },
  { name: 'Pastas y salsas', slug: 'pastas-y-salsas' },
  { name: 'Marcas', slug: 'marcas' },
];

export default function Categories() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {categories.map(category => (
        <div key={category.slug} className="p-4 border rounded-lg">
          <h2 className="text-lg font-bold">{category.name}</h2>
          {/* Additional icon or content can be added here */}
        </div>
      ))}
    </div>
  );
}
