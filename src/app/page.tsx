export default function Page() {
  return (
    <main>
      <section className="bg-green-600 py-12">
        <h1 className="text-4xl font-bold text-center text-white">Hero Banner</h1>
      </section>
      <section className="py-10">
        <h2 className="text-3xl font-bold text-center">Categorías</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-bold">Condimentos y Especies</h2>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-bold">Bebidas</h2>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-bold">Granos</h2>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-bold">Snacks</h2>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-bold">Pastas y salsas</h2>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-bold">Marcas</h2>
          </div>
        </div>
      </section>
      <section>
        <h2 className="text-3xl font-bold text-center">Ofertas y Novedades</h2>
        {/* Placeholder for the product grid */}
      </section>
    </main>
  );
}
