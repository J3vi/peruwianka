
// src/app/politica-de-privacidad/page.tsx

export default function PoliticaDePrivacidad() {
  const Code = ({ children }: { children: React.ReactNode }) => (
    <code className="px-1 py-0.5 rounded bg-gray-100">{children}</code>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <header className="mb-10">
        <h1 className="text-4xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-gray-500">Fecha de última actualización: 21/02/2026</p>
      </header>

      <article className="space-y-10">
        <section>
          <p className="leading-relaxed">
            Gracias por visitar nuestro sitio web (el <Code>Sitio</Code>). La protección de tu privacidad es importante para nosotros. Esta Política
            explica cómo tratamos tus datos personales cuando utilizas el Sitio, creas una cuenta, realizas una compra o te contactas con nosotros.
          </p>
          <p className="leading-relaxed mt-4">
            Esta Política se redacta conforme al Reglamento (UE) 2016/679 (GDPR/RODO).
          </p>
        </section>

        {/* 1 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">1) ¿Quién es el responsable del tratamiento?</h2>
          <p className="mb-3">El responsable del tratamiento de tus datos personales es:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>PERUWIANKA FOOD &amp; DRINKS DISTRIBUTION</strong>
            </li>
            <li>Domicilio: Ul. Ignacego Łukasiewicza 5A</li>
            <li>NIP (si aplica): En trámite</li>
            <li>Correo de contacto (privacidad): peruwiankapl@gmail.com</li>
          </ul>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">2) ¿Cómo puedes contactarnos sobre privacidad?</h2>
          <p className="leading-relaxed">
            Para cualquier asunto sobre datos personales, puedes escribir a: <strong>peruwiankapl@gmail.com</strong>.
          </p>
          <p className="leading-relaxed mt-2">
            Asunto sugerido: <Code>Privacidad – Solicitud GDPR</Code>
          </p>

          <div className="mt-4">
            <p className="mb-2">
              <strong>Delegado de Protección de Datos (DPO):</strong>
            </p>
            <p>No hemos designado DPO.</p>
          </div>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">3) Qué datos personales tratamos</h2>
          <p className="mb-4">Según el uso que hagas del Sitio, podemos tratar estas categorías:</p>

          <h3 className="text-xl font-medium mb-2">A. Datos que tú nos das</h3>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Identificación y contacto: nombre, apellidos, email, teléfono.</li>
            <li>Compra y entrega: dirección, ciudad, código postal, país, detalles del pedido.</li>
            <li>Cuenta: credenciales de acceso (si creas cuenta).</li>
            <li>Atención al cliente: mensajes, consultas, incidencias y comunicaciones.</li>
            <li>Facturación (si aplica): datos necesarios para factura o recibo según normativa.</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">B. Datos técnicos (automáticos)</h3>
          <p className="leading-relaxed mb-4">
            Dirección IP, identificadores del dispositivo o navegador, logs, fecha y hora de acceso, páginas visitadas y cookies o tecnologías
            similares.
          </p>

          <h3 className="text-xl font-medium mb-2">C. Datos de terceros (solo si aplica)</h3>
          <p className="leading-relaxed">
            Si pagas mediante proveedor externo, este puede confirmarnos el estado del pago (por ejemplo: <Code>pagado/no pagado</Code> y referencia
            de transacción). No almacenamos números completos de tarjeta; eso lo gestiona el proveedor de pago.
          </p>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">4) Para qué usamos tus datos y con qué base legal</h2>
          <p className="mb-4 leading-relaxed">Tratamos datos solo cuando existe una base legal válida (art. 6 GDPR/RODO).</p>

          <ol className="list-decimal pl-6 space-y-4">
            <li>
              <strong>Gestionar pedidos y entregas (compra online)</strong>
              <br />
              Finalidad: procesar el pedido, preparar envío, atención postventa.
              <br />
              Base legal: ejecución de contrato (art. 6.1.b).
            </li>

            <li>
              <strong>Crear y administrar tu cuenta (si existe registro)</strong>
              <br />
              Finalidad: permitir acceso, historial, favoritos, etc.
              <br />
              Base legal: ejecución de contrato (art. 6.1.b).
            </li>

            <li>
              <strong>Soporte y contacto</strong>
              <br />
              Finalidad: responder consultas, solicitudes o reclamos.
              <br />
              Base legal: interés legítimo (art. 6.1.f) o medidas precontractuales o contrato (art. 6.1.b), según el caso.
            </li>

            <li>
              <strong>Cumplir obligaciones legales (contabilidad, fiscal, seguridad)</strong>
              <br />
              Finalidad: cumplir normas aplicables (por ejemplo contables o fiscales).
              <br />
              Base legal: obligación legal (art. 6.1.c).
            </li>

            <li>
              <strong>Seguridad del Sitio y prevención de fraude</strong>
              <br />
              Finalidad: proteger la infraestructura y detectar accesos indebidos.
              <br />
              Base legal: interés legítimo (art. 6.1.f).
            </li>

            <li>
              <strong>Marketing y comunicaciones comerciales (si las activas)</strong>
              <br />
              Newsletter o promociones por email.
              <br />
              Base legal: consentimiento (art. 6.1.a).
              <br />
              Puedes retirar tu consentimiento en cualquier momento (por ejemplo mediante un enlace de baja).
            </li>

            <li>
              <strong>Analítica, medición y publicidad (cookies no esenciales, si las usas)</strong>
              <br />
              Base legal: consentimiento para cookies no esenciales (según configuración).
              <br />
              Si no hay consentimiento, solo usamos cookies estrictamente necesarias.
            </li>
          </ol>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">5) Con quién compartimos tus datos (destinatarios)</h2>
          <p className="mb-4">Podemos compartir datos solo cuando sea necesario con:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Proveedores de hosting e infraestructura (servidores, almacenamiento, seguridad).</li>
            <li>Proveedores de email (confirmaciones de pedido y soporte).</li>
            <li>Proveedores de pago (procesar pagos y confirmar estado).</li>
            <li>Empresas de mensajería o entrega (enviar tu pedido).</li>
            <li>Proveedores de TI o soporte técnico (mantenimiento del Sitio).</li>
            <li>Asesoría contable o fiscal (si aplica).</li>
            <li>Autoridades públicas cuando exista obligación legal.</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            En estos casos, los proveedores actúan como encargados del tratamiento y están obligados a proteger tus datos.
          </p>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">6) Transferencias internacionales</h2>
          <p className="leading-relaxed">
            Si alguno de nuestros proveedores está fuera del EEE (Espacio Económico Europeo), tus datos podrían transferirse usando garantías
            adecuadas (por ejemplo cláusulas contractuales tipo u otros mecanismos previstos por GDPR/RODO).
          </p>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">7) Cuánto tiempo conservamos tus datos</h2>
          <p className="mb-4">Conservamos los datos solo el tiempo necesario según la finalidad:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Pedidos y facturación: durante los plazos exigidos por normativa fiscal o contable aplicable.</li>
            <li>Cuenta: mientras mantengas la cuenta activa; si la eliminas, bloqueamos o suprimimos lo que no debamos conservar por ley.</li>
            <li>Atención al cliente: el tiempo necesario para resolver y dejar constancia razonable.</li>
            <li>Logs de seguridad: durante un período limitado para prevención y auditoría.</li>
          </ul>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">8) Tus derechos (GDPR/RODO)</h2>
          <p className="mb-4">Puedes solicitar:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>Acceso a tus datos</li>
            <li>Rectificación</li>
            <li>Supresión (derecho al olvido, cuando aplique)</li>
            <li>Limitación del tratamiento</li>
            <li>Portabilidad</li>
            <li>Oposición (especialmente a marketing basado en interés legítimo)</li>
            <li>Retirar el consentimiento cuando la base sea consentimiento (sin afectar lo anterior)</li>
          </ul>
          <p className="leading-relaxed">
            También tienes derecho a presentar una queja ante la autoridad de control en Polonia: Urząd Ochrony Danych Osobowych (UODO).
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">9) Decisiones automatizadas y perfiles</h2>
          <p className="leading-relaxed">
            Podemos usar herramientas de analítica o segmentación para mejorar contenidos y marketing. No adoptamos decisiones automatizadas que
            produzcan efectos legales sobre ti, salvo que se indique expresamente y exista base legal.
          </p>
          <p className="mt-2">Puedes oponerte al marketing y ajustar cookies.</p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">10) Cookies y tecnologías similares</h2>
          <p className="mb-4">El Sitio utiliza cookies y tecnologías similares:</p>
          <ul className="list-disc pl-6 space-y-1 mb-4">
            <li>
              <strong>Necesarias:</strong> para que el Sitio funcione correctamente.
            </li>
            <li>
              <strong>Opcionales (si las activas):</strong> analítica y publicidad.
            </li>
          </ul>
          <p className="text-sm text-gray-600">Consulta la Política de Cookies para más información.</p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">11) Seguridad</h2>
          <p className="leading-relaxed">
            Aplicamos medidas técnicas y organizativas razonables para proteger los datos (control de accesos, cifrado en tránsito cuando aplica,
            registros, etc.). Aun así, ningún sistema es 100% invulnerable.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">12) Cambios de esta Política</h2>
          <p className="leading-relaxed">
            Podemos actualizar esta Política cuando cambie el Sitio, la ley o nuestros proveedores. Publicaremos la versión vigente con su fecha de
            actualización.
          </p>
        </section>
      </article>
    </div>
  )
}


