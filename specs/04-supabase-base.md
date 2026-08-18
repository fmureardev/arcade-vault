# SPEC 04 — Configuración base de Supabase

> **Status:** Implemented
> **Depends on:** SPEC 03
> **Date:** 2026-08-18
> **Objective:** Instalar y configurar el cliente de Supabase (`@supabase/ssr`) en el proyecto Next.js, creando los helpers de cliente/servidor/middleware y generando los tipos TypeScript, sin conectar ninguna pantalla ni crear tablas de datos todavía.

## Scope

**In:**

- Instalación de `@supabase/ssr` y `@supabase/supabase-js`.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` documentadas en `.env.example`.
- Helper de cliente para Client Components: `lib/supabase/client.ts` (usa `createBrowserClient`).
- Helper de servidor para Server Components, Route Handlers y Server Actions: `lib/supabase/server.ts` (usa `createServerClient` con lectura/escritura de cookies vía `next/headers`).
- `middleware.ts` en la raíz del proyecto: refresca la sesión en cada request para mantener las cookies de auth actualizadas. Sin lógica de redirección ni protección de rutas.
- Generación de `lib/database.types.ts` con los tipos TypeScript del esquema remoto de Supabase (por ahora minimal — el esquema público está vacío; establece el patrón tipado para specs futuras).
- Actualización de `.env.example` añadiendo las dos nuevas variables junto a `RESEND_API_KEY` ya existente.

**Out of scope:**

- Creación de ninguna tabla en Supabase (sin `CREATE TABLE`, sin migraciones).
- Conexión de la pantalla `/login` a Supabase Auth (el flujo funcional de login va en una spec futura).
- Cambios visuales en ninguna pantalla (Nav, Home, Biblioteca, Salón, About, Login).
- Registro (`signup`) o recuperación de contraseña.
- OAuth, magic link u otros proveedores de auth distintos de email/contraseña.
- Supabase local con Docker (`supabase start`).
- Row Level Security (RLS) — se configura cuando se creen las primeras tablas.
- Protección de rutas en el middleware.

## Data model

No se crea ninguna tabla. El único artefacto de datos es `lib/database.types.ts`, generado desde el esquema remoto vía `supabase gen types typescript`. En este momento el esquema solo contiene las tablas internas de `auth.*`, así que el tipo `Database` exportado tendrá `public: { Tables: {}; Views: {}; Functions: {} }`. Sirve como base tipada sobre la que specs futuras añadirán sus tablas.

## Implementation plan

1. Instalar dependencias: `npm install @supabase/supabase-js @supabase/ssr`.
2. Añadir a `.env.example` (junto a `RESEND_API_KEY=` ya existente):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
   ```
   Añadir también estas dos variables a `.env.local` con los valores reales del proyecto Supabase remoto (sin versionar; `.env.local` ya está en `.gitignore`).
3. Crear `lib/supabase/client.ts` con `createBrowserClient<Database>` usando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Exportar como función `createClient()`.
4. Crear `lib/supabase/server.ts` con `createServerClient<Database>` async, leyendo las cookies vía `await cookies()` de `next/headers`. Implementar `getAll` y `setAll` en el objeto `cookies` del cliente. Exportar como función `createClient()` async.
5. Crear `middleware.ts` en la raíz del proyecto: instanciar `createServerClient` sobre `request`/`response` de Next.js (patrón de `@supabase/ssr` para middleware), llamar a `supabase.auth.getUser()` para refrescar la sesión, y devolver la `response` con las cookies actualizadas. Configurar el `matcher` para excluir `_next/static`, `_next/image` y `favicon.ico`.
6. Generar `lib/database.types.ts` vía el MCP de Supabase (`generate_typescript_types`) o mediante `npx supabase gen types typescript --project-id <id> --schema public > lib/database.types.ts`. Committear el archivo generado.
7. Verificación: `npm run dev` arranca sin errores, `npm run build` completa sin errores de TypeScript, y `lib/database.types.ts` existe y exporta un tipo `Database`.

## Acceptance criteria

- [ ] `@supabase/supabase-js` y `@supabase/ssr` aparecen en `dependencies` de `package.json` sin conflictos.
- [ ] `.env.example` contiene `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=` junto a `RESEND_API_KEY=`.
- [ ] `lib/supabase/client.ts` exporta `createClient()` que devuelve un cliente tipado con `Database`.
- [ ] `lib/supabase/server.ts` exporta `createClient()` async que devuelve un cliente tipado con `Database` y acceso a cookies.
- [ ] `middleware.ts` existe en la raíz y refresca la sesión sin lógica de redirección.
- [ ] `lib/database.types.ts` existe y exporta un tipo `Database`.
- [ ] `npm run dev` arranca sin errores de compilación ni de TypeScript.
- [ ] `npm run build` completa sin errores.
- [ ] Ninguna pantalla existente (Home, Biblioteca, Salón, About, Login) muestra regresiones visuales ni errores en consola.

## Decisions

- **Sí:** usar `@supabase/ssr` en vez de `@supabase/auth-helpers-nextjs` (deprecado). Es el paquete oficial para Next.js App Router con soporte de cookies en servidor y middleware.
- **Sí:** `lib/supabase/` como directorio de helpers, consistente con `lib/data.ts` y `lib/types.ts` ya existentes en el proyecto.
- **Sí:** generar `lib/database.types.ts` ahora aunque el esquema público esté vacío. Establece el patrón y permite que los helpers sean tipados desde el primer día.
- **No:** crear tablas en esta spec. El modelo de datos se define en specs dedicadas a cada dominio (puntuaciones, perfiles de usuario, etc.).
- **No:** conectar el formulario `/login` en esta spec. La infraestructura queda lista; el flujo funcional de auth va en la siguiente spec.
- **No:** usar Supabase local con Docker. El proyecto está en fase MVP con un único entorno remoto; el overhead de gestionar migraciones locales se justifica cuando haya más tablas y más desarrolladores.
- **No:** añadir lógica de redirección en el middleware. Solo refresco de sesión. La protección de rutas (`/perfil`, `/jugar`) va en la spec que implemente el flujo de auth.

## Risks

| Riesgo                                                                                                                   | Mitigación                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY` no configuradas en `.env.local` causarán errores en runtime | Los helpers usan non-null assertion (`!`) porque estas variables son obligatorias; si faltan, el error de runtime es inmediato y claro. Documentado en `.env.example`.         |
| `middleware.ts` mal configurado puede bloquear rutas o provocar loops de redirección                                     | En esta spec el middleware solo llama a `getUser()` para refrescar la sesión y devuelve la response sin redirecciones — cero riesgo de loops.                                  |
| `lib/database.types.ts` generado puede quedar desactualizado al añadir tablas futuras                                    | Se regenera explícitamente en cada spec que modifique el esquema; nunca se edita a mano.                                                                                       |
| `@supabase/ssr` puede requerir una versión mínima de Next.js incompatible con la v16 del proyecto                        | Verificar en `node_modules/next/dist/docs/` que el patrón de `cookies()` de `next/headers` y el API de middleware son compatibles antes de escribir el código en `/spec-impl`. |
