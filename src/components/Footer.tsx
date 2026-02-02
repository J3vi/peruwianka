import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">PERUWIANKA</h3>
            <p>El causa de un peruano es otro Kausa</p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Enlaces</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-green-400">Inicio</Link></li>
              <li><Link href="/productos" className="hover:text-green-400">Productos</Link></li>
              <li><Link href="/contacto" className="hover:text-green-400">Contacto</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/politica-de-privacidad" className="hover:text-green-400">Política de Privacidad</Link></li>
              <li><Link href="/terminos" className="hover:text-green-400">Términos y Condiciones</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4">Contacto</h4>
            <p>Email: info@peruwianka.com</p>
            <p>Tel: +48 123 456 789</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p>&copy; 2026 peruwianka. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
