# SPEC 03 — Página "Acerca de" con formulario de contacto vía Resend

> **Status:** Implementado
> **Depends on:** SPEC 02
> **Date:** 2026-08-13
> **Objective:** Añadir la página `/about` (`references/templates/home-about/about.jsx`) con su formulario de contacto conectado a un envío real de correo mediante Resend, y enlazarla desde el Nav.

## Scope

**In:**

- Nueva pantalla "Acerca de" portada desde `references/templates/home-about/about.jsx` a `app/about/page.tsx` (ruta `/about`), como componente cliente (`"use client"`), incluyendo: hero de misión (`about-hero` con kicker, título, texto de misión, `highlight-row` con los 3 `HighlightIcon` SVG pixel), banner divisor animado (`about-divider`), y sección de contacto (`about-contact` con `contact-intro` + `contact-form`).
- El hook de reveal (`IntersectionObserver` sobre `.reveal`) portado igual que en Home (spec 02), como efecto local del componente.
- Formulario de contacto (`name`, `email`, `msg`) que, al enviarse, hace `POST` a un nuevo Route Handler `app/api/contact/route.ts`, el cual usa el SDK `resend` para enviar un correo real.
- Instalación de la dependencia `resend` (`npm install resend`).
- Variable de entorno `RESEND_API_KEY` leída en el Route Handler desde `process.env`, documentada en un nuevo `.env.example` (el `.env.local` real con la key no se versiona).
- Remitente fijo `Arcade Vault <onboarding@resend.dev>` (dominio de pruebas de Resend, no requiere verificación de dominio propio).
- Destinatario fijo `fmureardev@gmail.com` (hardcodeado como constante en el Route Handler).
- Estados de UI del formulario: `idle` (formulario visible) → `loading` (botón deshabilitado, texto "ENVIANDO…") → `success` (se muestra el `terminal-success` ya existente en el template) **o** `error` (mensaje de error visible + `shake`, el usuario puede corregir y reintentar sin perder lo escrito).
- Validación en cliente antes de enviar: `name`, `email` y `msg` no vacíos (tras `trim`) + formato de email válido mediante una regex simple (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Si falla, se dispara el `shake` existente sin llamar al API.
- Validación equivalente en servidor (Route Handler): rechaza con `400` si falta algún campo o el email no tiene formato válido, para no depender solo del cliente.
- Enlace "Acerca de" añadido a `components/Nav.tsx` apuntando a `/about`, tanto en el menú desktop (`links`) como en el panel móvil (`av-mobile-panel`), entre "Salón de la Fama" y el botón de autenticación — replicando la posición de `nav.jsx` del template.
- Lógica de estado activo del Nav: nueva entrada `"about"` en `NavSection` que devuelve `pathname === "/about"`.
- CSS: añadir a `app/globals.css` únicamente los selectores nuevos que usa About y que no existen ya (portados literalmente desde `references/templates/home-about/styles.css`, reutilizando variables ya presentes):
  - `.about`, `.about-hero` (+ `.kicker`), `.about-title`, `.about-mission`
  - `.highlight-row`, `.highlight` (+ `.cyan/.magenta/.green`, `.hl-icon`, `.hl-text`)
  - `.about-divider`, `.div-bar`, `.div-pixels` (+ `@keyframes pxblink` si no existe ya)
  - `.about-contact`, `.contact-grid`, `.contact-intro` (+ `.kicker`, `.contact-title`, `.contact-sub`), `.contact-tips` (+ `.tip`, `.tip-led` + `.y`/`.m`)
  - `.contact-form` (+ `::before`, `.shake`, inputs/textarea, placeholders)
  - `.terminal-success` (+ `.term-bar`, `.dot` + `.r/.y/.g`, `.term-title`, `.term-body`, `.line` + `.dim`/`.success`, `.prompt`, `.caret`)
  - `@keyframes shake` (si no existe ya)
  - Nueva clase de error del formulario (`.contact-error`, a definir en el paso de implementación) para mostrar el mensaje cuando el envío falla — no existe en el template original porque este simulaba siempre éxito.

**Out of scope (for future specs):**

- Verificación de un dominio propio en Resend (se usa el dominio de pruebas `onboarding@resend.dev`).
- Rate limiting o protección anti-spam/anti-bot (captcha, honeypot) en el formulario de contacto.
- Persistencia de los mensajes enviados (no se guardan en ningún almacenamiento; solo se envían por correo).
- Notificación de confirmación al remitente (el usuario que rellena el formulario no recibe copia del mensaje).
- Internacionalización o soporte multi-idioma del formulario.
- Cualquier cambio a Home, Biblioteca, Salón o Login fuera de la adición del link "Acerca de" en el Nav.

## Data model

No se introduce ningún modelo de datos persistente ni tipo en `lib/types.ts`. Se define únicamente:

- Un tipo local en el Route Handler (`app/api/contact/route.ts`) para el cuerpo de la petición, p. ej.:
  ```ts
  type ContactPayload = { name: string; email: string; msg: string };
  ```
- La variable de entorno `RESEND_API_KEY` (string), documentada en `.env.example`:
  ```
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

## Implementation plan

1. `npm install resend`.
2. Crear `.env.example` en la raíz con `RESEND_API_KEY=` (placeholder, sin valor real) y confirmar que `.env.local` está en `.gitignore` (Next.js lo ignora por defecto).
3. Crear `app/api/contact/route.ts`: `POST` handler que valida `ContactPayload` (campos no vacíos + formato de email), instancia `new Resend(process.env.RESEND_API_KEY)`, llama a `resend.emails.send({ from: "Arcade Vault <onboarding@resend.dev>", to: "fmureardev@gmail.com", subject: ..., text/html: ... })`, y devuelve `Response.json({ ok: true })` en éxito o `Response.json({ ok: false, error }, { status: 400|500 })` en fallo.
4. Crear `app/about/page.tsx` portando `about.jsx`: componente `About` con el hook de reveal, el formulario con estados `idle/loading/success/error`, sustituyendo el `setSent` simulado por un `fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })` real; y `HighlightIcon` como función local en el mismo archivo (igual criterio que `MiniCard`/`FeatureIcon` en spec 02: no se reutiliza en otras pantallas).
5. Añadir a `app/globals.css` los selectores y `@keyframes` listados en Scope, copiados literalmente desde `references/templates/home-about/styles.css`, más la nueva clase de error del formulario.
6. Actualizar `components/Nav.tsx`: añadir `"about"` a `NavSection`, `isActive("about")` (`pathname === "/about"`), y el `<Link href="/about">Acerca de</Link>` en desktop y en el panel móvil, entre "Salón de la Fama" y el botón de auth.
7. Verificación manual con `npm run dev`: recorrer `/about`, comprobar el efecto reveal, rellenar y enviar el formulario con datos válidos (confirmar que llega el correo real a `fmureardev@gmail.com` usando una API key de prueba de Resend), probar validación con campos vacíos/email inválido (debe hacer `shake` sin llamar al API), y simular un fallo del API (por ejemplo con una `RESEND_API_KEY` inválida) para confirmar que se muestra el estado de error y se puede reintentar.

## Acceptance criteria

- [x] `npm run dev` arranca sin errores y `/about` muestra el hero de misión, los 3 `highlight`, el divisor animado y la sección de contacto.
- [x] El Nav muestra "Acerca de" como enlace, activo únicamente en `/about`, tanto en desktop como en el panel móvil.
- [x] Enviar el formulario con `name`, `email` y `msg` válidos dispara `POST /api/contact`, muestra el estado "ENVIANDO…" mientras espera, y al recibir éxito muestra el `terminal-success` con el nombre en mayúsculas, igual que en el template.
- [x] Con una `RESEND_API_KEY` válida configurada en `.env.local`, el envío real llega a la bandeja de `fmureardev@gmail.com`.
- [x] Enviar el formulario con algún campo vacío o email con formato inválido dispara el `shake` y NO hace ninguna petición al API (validación en cliente).
- [x] Si el `POST /api/contact` responde con error (4xx/5xx o red caída), se muestra un mensaje de error visible en el formulario y el usuario puede corregir y reintentar sin perder lo ya escrito.
- [x] El Route Handler rechaza con `400` una petición sin `RESEND_API_KEY` configurada o con payload inválido, sin exponer la API key en la respuesta ni en el cliente.
- [x] Botón "ENVIAR OTRO MENSAJE" tras un envío exitoso limpia el formulario y vuelve al estado `idle`, igual que en el template.
- [x] No hay errores de consola ni clases CSS sin estilos aplicados en `/about`.
- [x] `.env.example` existe en la raíz con `RESEND_API_KEY=` como placeholder; `.env.local` con la key real no está trackeado por git.

## Decisions

- **Sí:** usar Route Handler (`app/api/contact/route.ts`) en vez de Server Action. Es el patrón más explícito para un endpoint que solo envía datos externos (correo), mantiene la key de Resend en servidor y es fácil de probar de forma aislada (curl/Postman) sin depender del formulario.
- **Sí:** remitente `onboarding@resend.dev` (dominio de pruebas de Resend) en vez de exigir verificación de dominio propio. Evita bloquear la spec en configuración de DNS; se puede migrar a un dominio propio más adelante sin cambiar el resto del flujo.
- **Sí:** destinatario fijo `fmureardev@gmail.com` hardcodeado como constante, no configurable desde UI. Es un formulario de contacto de un solo equipo, no necesita selección dinámica de destinatario.
- **Sí:** añadir manejo real de estado `loading`/`error`, distinto del template original (que solo simulaba éxito instantáneo). Es imprescindible porque ahora hay una llamada de red real que puede fallar o tardar.
- **Sí:** añadir validación de formato de email tanto en cliente como en servidor. En cliente evita llamadas innecesarias a la API de Resend; en servidor evita depender solo de una validación que el cliente podría saltarse.
- **Sí:** añadir el link "Acerca de" al Nav en esta misma spec (a diferencia de spec 02, que lo dejó pendiente explícitamente hasta que existiera la pantalla). Ahora que `/about` existe, no tiene sentido seguir sin enlazarla.
- **No:** implementar rate limiting, captcha o persistencia de mensajes. Fuera del alcance de un formulario de contacto simple en un proyecto en etapa MVP; se puede abordar en una spec futura si se detecta abuso real.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Sin `RESEND_API_KEY` configurada (o inválida), el envío fallará siempre en desarrollo local | El Route Handler valida la presencia de la variable y devuelve un error claro (500) en vez de lanzar una excepción sin manejar; se documenta en `.env.example` y en la verificación manual del paso 7. |
| El dominio de pruebas `onboarding@resend.dev` de Resend puede tener límites de envío o marcarse como spam en algunos proveedores de correo | Aceptable para el MVP; si se convierte en problema real, se aborda en una spec futura de verificación de dominio propio. |
| Selectores CSS nuevos (`.about-*`, `.contact-*`, `.terminal-success`, etc.) podrían chocar por nombre con clases ya existentes en `globals.css` | Antes de copiar, verificar que ninguno de los nombres de clase listados en Scope ya existe en `globals.css` (confirmado sin colisiones al momento de escribir esta spec); si aparece alguna en el futuro, resolver renombrando en el paso 5. |
| La clase de error del formulario no existe en el template original, así que su estilo no está definido en `styles.css` | Se diseña como una variante mínima reutilizando tokens ya existentes (`--red`/`--magenta` según lo que tenga `globals.css`), sin inventar un nuevo sistema visual — a resolver en el paso 5 de implementación. |

## What is **not** in this spec

- Verificación de dominio propio en Resend.
- Rate limiting / anti-spam en el formulario.
- Persistencia de los mensajes de contacto enviados.
- Copia de confirmación al remitente del formulario.
- Cambios a Home, Biblioteca, Salón o Login más allá del link de Nav.

Cada uno de estos, si se aborda, va en su propia spec.
