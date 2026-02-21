// src/app/terminos/page.tsx
import Link from "next/link"

export default function Terminos() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Términos y Condiciones – Peruwianka</h1>
        <p className="text-gray-500">Fecha de última actualización: 21/02/2026</p>
      </header>

      <article className="space-y-10">
        {/* 1 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">1) Información general y aceptación</h2>
          <p className="leading-relaxed">
            Estos Términos y Condiciones (<code className="px-1 py-0.5 rounded bg-gray-100">Términos</code>) regulan el acceso y uso del
            sitio web Peruwianka (el <code className="px-1 py-0.5 rounded bg-gray-100">Sitio</code>), así como las compras realizadas a través
            del Sitio. Al navegar, crear una cuenta o realizar un pedido, aceptas estos Términos.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">2) Identidad del vendedor</h2>
          <p className="mb-3">El vendedor y responsable del Sitio es:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>PERUWIANKA FOOD &amp; DRINKS DISTRIBUTION</strong>
            </li>
            <li>Dirección: Ul. Ignacego Łukasiewicza 5A</li>
            <li>NIP (si aplica): En trámite</li>
            <li>Email: peruwiankapl@gmail.com</li>
          </ul>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">3) Definiciones</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>
                <code className="px-1 py-0.5 rounded bg-gray-100">Cliente/Usuario</code>
              </strong>
              : persona que navega o compra en el Sitio.
            </li>
            <li>
              <strong>
                <code className="px-1 py-0.5 rounded bg-gray-100">Producto</code>
              </strong>
              : artículos ofrecidos en el Sitio.
            </li>
            <li>
              <strong>
                <code className="px-1 py-0.5 rounded bg-gray-100">Pedido</code>
              </strong>
              : solicitud de compra realizada por el Cliente.
            </li>
            <li>
              <strong>
                <code className="px-1 py-0.5 rounded bg-gray-100">Contrato</code>
              </strong>
              : acuerdo de compraventa entre el Cliente y el vendedor al confirmarse el Pedido.
            </li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">4) Requisitos para comprar</h2>
          <p className="mb-3">Para comprar debes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Ser mayor de edad y tener capacidad legal, o contar con autorización del tutor legal.</li>
            <li>Proporcionar datos veraces y completos.</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            Nos reservamos el derecho de rechazar pedidos con datos incompletos, falsos o sospechosos de fraude.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">5) Cuenta de usuario</h2>
          <p className="mb-3">Si el Sitio permite crear cuenta:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
            <li>Debes notificarnos cualquier uso no autorizado.</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            Podemos suspender o cancelar cuentas por uso fraudulento, abuso o incumplimiento de estos Términos.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">6) Información de productos, disponibilidad y precios</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Describimos los productos con el mayor cuidado posible. Las imágenes son referenciales.</li>
            <li>La disponibilidad puede cambiar sin previo aviso.</li>
            <li>
            Los precios se muestran en <strong>PLN</strong> e incluyen impuestos aplicables, salvo indicación expresa.
            </li>
            <li>Los costos de envío se informan antes de finalizar la compra.</li>
          </ul>
          <p className="leading-relaxed">
            Nos reservamos el derecho de corregir errores tipográficos o de precio evidentes y de cancelar pedidos derivados de dichos errores,
            reembolsando cualquier pago recibido.
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">7) Proceso de compra y confirmación</h2>
          <p className="mb-3 leading-relaxed">
            Un pedido se considera realizado cuando el Cliente completa el checkout. El Contrato se entiende celebrado cuando:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>enviamos una confirmación del pedido por email, o</li>
            <li>despachamos el pedido,</li>
          </ul>
          <p className="mb-3">lo que ocurra primero.</p>
          <p className="leading-relaxed">
            Podemos rechazar o cancelar pedidos por: falta de stock, sospecha de fraude, errores de precio, imposibilidad de entrega u otros motivos
            razonables.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">8) Métodos de pago</h2>
          <p className="mb-3 leading-relaxed">
            Los pagos se procesan mediante proveedores externos. Los métodos disponibles se mostrarán en el checkout.
          </p>
          <p className="leading-relaxed">
            El vendedor no almacena datos completos de tarjeta. En caso de pago fallido, el pedido puede quedar cancelado automáticamente.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">9) Entrega y envíos</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              <strong>Zonas de entrega:</strong> Polonia.
            </li>
            <li>
              <strong>Plazos estimados:</strong> se informan durante la compra y pueden variar por disponibilidad y transportista.
            </li>
            <li>
              <strong>Dirección:</strong> el Cliente es responsable de indicar una dirección correcta y accesible.
            </li>
          </ul>
          <p className="leading-relaxed">
            Si el pedido vuelve por dirección incorrecta o ausencia reiterada, el Cliente puede asumir costos adicionales de reenvío.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">10) Derecho de desistimiento (consumidores)</h2>
          <p className="mb-3 leading-relaxed">
            Si compras como consumidor, puedes desistir del contrato dentro de los <strong>[14]</strong> días naturales desde la recepción del pedido,
            sin necesidad de justificación, salvo excepciones legales.
          </p>
          <p className="mb-4 leading-relaxed">
          Para ejercerlo, debes comunicarlo por escrito a <strong>peruwiankapl@gmail.com</strong> indicando: número de pedido, nombre y datos de contacto.
          </p>

          <h3 className="text-xl font-medium mb-2">Efectos del desistimiento</h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Reembolsaremos el importe del producto y, cuando aplique, el coste estándar de envío inicial.</li>
            <li>El reembolso se realizará usando el mismo medio de pago, salvo acuerdo distinto.</li>
            <li>
              El Cliente debe devolver los productos sin demora indebida y en un plazo máximo de <strong>[14]</strong> días desde la comunicación del
              desistimiento.
            </li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Excepciones comunes (si aplica)</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Productos perecederos o con fecha de caducidad cercana.</li>
            <li>Productos desprecintados no aptos para devolución por razones de higiene o protección de la salud.</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            Peruwianka vende alimentos: algunas categorías pueden estar excluidas del desistimiento si se cumplen las condiciones legales. Se informará
            en la ficha del producto cuando aplique.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">11) Devoluciones, cambios y reembolsos</h2>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>
              <strong>Condición:</strong> los productos deben devolverse en buen estado y, si aplica, sin abrir o dañar el precinto original.
            </li>
            <li>
              <strong>Coste de devolución:</strong> a cargo del cliente (previa revisión del pedido). A cargo del vendedor en caso de error.
            </li>
            <li>
              Si recibes un producto equivocado o dañado, contáctanos dentro de <strong>48</strong> horas con fotos del paquete y del producto a{" "}
              <strong>peruwiankapl@gmail.com</strong>.
            </li>
          </ul>

          <h3 className="text-xl font-medium mb-2">Reembolsos</h3>
          <p className="leading-relaxed">Se procesarán tras recibir e inspeccionar la devolución, o tras verificar el incidente (daño o error).</p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">12) Reclamaciones y atención al cliente</h2>
          <p className="mb-2">Puedes presentar reclamaciones o solicitar soporte por:</p>
          <p className="mb-2">
          Email: <strong>peruwiankapl@gmail.com</strong>
          </p>
          <p className="mb-4">
            Asunto sugerido:{" "}
            <code className="px-1 py-0.5 rounded bg-gray-100">Reclamación – Pedido #____</code>
          </p>
          <p className="leading-relaxed">
            Responderemos en un plazo razonable y, cuando aplique, dentro de los plazos exigidos por normativa de consumo.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">13) Garantías y conformidad (consumidores)</h2>
          <p className="leading-relaxed">
            Cuando aplique la normativa de consumo, los productos deben ser conformes con el contrato. Si existe falta de conformidad, el Cliente puede
            tener derecho a reparación, sustitución, reducción del precio o resolución, según corresponda y conforme a la ley aplicable.
          </p>
        </section>

        {/* 14 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">14) Uso permitido del sitio y prohibiciones</h2>
          <p className="mb-3">Queda prohibido:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Usar el Sitio para fines ilícitos, fraude o suplantación.</li>
            <li>Interferir con la seguridad, servidores o funcionamiento del Sitio.</li>
            <li>Extraer contenido de forma masiva (scraping) sin autorización.</li>
          </ul>
          <p className="mt-4">Podemos bloquear accesos por abuso o ataques.</p>
        </section>

        {/* 15 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">15) Propiedad intelectual</h2>
          <p className="leading-relaxed">
            El contenido del Sitio (marca, logo, textos, diseño, imágenes) pertenece a Peruwianka o a sus licenciantes. No puedes reproducirlo o
            explotarlo sin autorización, salvo uso personal y no comercial permitido por ley.
          </p>
        </section>

        {/* 16 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">16) Responsabilidad</h2>
          <p className="mb-3">En la medida permitida por la ley:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>No garantizamos disponibilidad ininterrumpida del Sitio.</li>
            <li>No somos responsables por daños indirectos, pérdida de beneficios o interrupciones ajenas a nuestro control.</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            Nada limita derechos irrenunciables del consumidor ni nuestra responsabilidad cuando la ley no lo permite.
          </p>
        </section>

        {/* 17 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">17) Protección de datos</h2>
          <p className="leading-relaxed">
            El tratamiento de datos personales se rige por nuestra{" "}
            <Link href="/politica-de-privacidad" className="text-green-600 hover:underline">Política de Privacidad</Link>.
          </p>
        </section>

        {/* 18 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">18) Modificaciones de los términos</h2>
          <p className="leading-relaxed">
            Podemos actualizar estos Términos para reflejar cambios legales, operativos o técnicos. Publicaremos la versión vigente con su fecha de
            actualización. Los pedidos realizados antes del cambio se rigen por la versión aplicable al momento de compra.
          </p>
        </section>

        {/* 19 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">19) Ley aplicable y jurisdicción</h2>
          <p className="leading-relaxed">
            Estos Términos se rigen por la ley de <strong>Polonia</strong> y las normas de protección al consumidor aplicables. En caso de disputa, se
            buscará una solución amistosa; si no fuera posible, el asunto se someterá a los tribunales competentes, sin perjuicio de los derechos del
            consumidor.
          </p>
        </section>
      </article>
    </div>
  )
}
