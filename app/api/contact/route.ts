import { Resend } from "resend";

type ContactPayload = { name: string; email: string; msg: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_RECIPIENT = "fmureardev@gmail.com";

function isValidPayload(body: unknown): body is ContactPayload {
  if (typeof body !== "object" || body === null) return false;
  const { name, email, msg } = body as Record<string, unknown>;
  if (typeof name !== "string" || name.trim() === "") return false;
  if (typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) return false;
  if (typeof msg !== "string" || msg.trim() === "") return false;
  return true;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return Response.json({ ok: false, error: "Datos de contacto inválidos." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "El servicio de contacto no está configurado." }, { status: 500 });
  }

  const { name, email, msg } = body;
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: "Arcade Vault <onboarding@resend.dev>",
      to: CONTACT_RECIPIENT,
      subject: `Nuevo mensaje de contacto de ${name.trim()}`,
      replyTo: email.trim(),
      text: `Nombre: ${name.trim()}\nEmail: ${email.trim()}\n\n${msg.trim()}`,
    });

    if (error) {
      return Response.json({ ok: false, error: "No se pudo enviar el mensaje." }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "No se pudo enviar el mensaje." }, { status: 502 });
  }
}
