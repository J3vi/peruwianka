import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      topic,
      category,
      subcategory,
      orderId,
      message,
      fullName,
      email,
      phone,
    } = body ?? {};

    // Validación mínima (server-side)
    if (!fullName?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json(
        { ok: false, error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const safe = (v: any) => String(v ?? "").replace(/[<>&"]/g, (c) => ({
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
    }[c] as string));

    const html = `
      <h2>Nuevo mensaje desde Peruwianka</h2>
      <p><b>Nombre:</b> ${safe(fullName)}</p>
      <p><b>Email:</b> ${safe(email)}</p>
      <p><b>Teléfono:</b> ${safe(phone)}</p>
      <p><b>Tema:</b> ${safe(topic)}</p>
      <p><b>Categoría:</b> ${safe(category)}</p>
      <p><b>Subcategoría:</b> ${safe(subcategory)}</p>
      <p><b>Pedido:</b> ${safe(orderId)}</p>
      <hr/>
      <p style="white-space:pre-wrap">${safe(message)}</p>
    `;

    const to = process.env.CONTACT_TO_EMAIL!; // <- TU DESTINO

    const { data, error } = await resend.emails.send({
      from: "Peruwianka <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `Contacto Peruwianka — ${fullName}`,
      html,
    });

    console.log("RESEND data:", data);
    console.log("RESEND error:", error);

    if (error) {
      return Response.json(
        { ok: false, message: error.message },
        { status: error.statusCode ?? 400 }
      );
      
    }

    return Response.json({ ok: true, data });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}
