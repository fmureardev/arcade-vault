# SPEC 02 — Página de Home (landing) de Arcade Vault

> **Status:** Implementado
> **Depends on:** SPEC 01
> **Date:** 2026-08-13
> **Objective:** Añadir la landing page (`references/templates/home-about/home.jsx`) como nueva ruta `/`, moviendo la Biblioteca actual a `/biblioteca` y actualizando la navegación global para reflejarlo.

## Scope

**In:**

- Nueva pantalla Home portada desde `references/templates/home-about/home.jsx` a `app/page.tsx` (ruta `/`), como componente cliente (`"use client"`), incluyendo todas sus secciones: hero con eyebrow/CTAs, siluetas flotantes decorativas (`FloatingSilhouettes`), sección "¿Por qué Arcade Vault?" (`feature-grid` con 4 `FeatureIcon` SVG pixel), rail de juegos destacados (`mini-rail` con `MiniCard`, primeros 6 de `GAMES`), bloque de estadísticas (`home-stats`), "Actividad en Vivo" (ticker de últimas puntuaciones + top 5 jugadores del día, ambos con datos simulados literales tal como en el template), sección de precios ("Plan Único" gratis + FAQ), y CTA final.
- Hook `useReveal` (IntersectionObserver sobre `.reveal`) portado tal cual, como hook local del componente Home.
- La Biblioteca actual (`app/page.tsx` existente) se mueve a `app/biblioteca/page.tsx` → ruta `/biblioteca`, sin cambios de comportamiento respecto a spec 01.
- `components/Nav.tsx` actualizado:
  - Nuevo link "Inicio" apuntando a `/`.
  - Link "Biblioteca" apunta ahora a `/biblioteca` (antes `/`).
  - Lógica de estado activo (`isActive`) ajustada: "Inicio" activo solo en `/`; "Biblioteca" activo en `/biblioteca` y `/juegos/*` (mismo criterio que antes tenía `/`).
- Todos los CTA de Home navegan con `next/link`/`useRouter` a rutas reales ya existentes: "Explorar juegos" / "Ver todos los juegos" / "Insertar moneda" → `/biblioteca`; "Crear cuenta" / "Empezar gratis" → `/login`; click en `MiniCard` → `/juegos/[id]`; "Ver salón" → `/salon`.
- CSS: añadir a `app/globals.css` únicamente las reglas/selectores nuevos que usa Home y que no existen ya (portados literalmente desde `references/templates/home-about/styles.css`, reutilizando las variables ya presentes en `globals.css` — los tokens base coinciden entre ambos ficheros):
  - `.home-hero`, `.home-hero-inner`, `.hero-eyebrow`, `.home-title` (+ `.line-1/2/3`), `.home-sub`, `.home-ctas`, `.hero-scroll` (+ `.arrow`)
  - `.home-silos` (+ `.silo`, `.s1`–`.s8`)
  - `.home-section`, `.section-head`, `.section-title`, `.section-rule`
  - `.feature-grid`, `.feature-card` (+ `.cyan/.magenta/.yellow/.green`, `.ft-icon`, `.ft-title`, `.ft-desc`)
  - `.mini-rail`, `.mini-card`, `.mini-cover`, `.mini-meta`, `.mini-title`, `.mini-cat`
  - `.home-stats` (+ `::before`), `.stat-block`, `.stat-n`, `.stat-u`, `.stat-s`
  - `.home-final` (+ `::before/::after`), `.final-title`, `.final-cta`, `.final-tag`
  - `.reveal`, `.reveal.in`
  - `.activity-grid`, `.activity-card`, `.ac-head`, `.ac-title`, `.lb-link`, `.ticker`, `.tick-row` (+ `.tk-p`, `.tk-mid`, `.tk-s`, `.tk-t`)
  - `.top-list`, `.top-row` (+ `.top1/.top2/.top3`, `.tp-rk`, `.tp-bar`, `.tp-fill`, `.tp-p`, `.tp-s`)
  - `.pricing-grid`, `.price-card` (+ `::before`, `.pc-label`, `.pc-name`, `.pc-amount` + `-n`/`-u`, `.pc-tag`, `.pc-list`, `.pc-foot`, `.pc-stamp`), `.pricing-faq`, `.faq-item`, `.faq-q`, `.faq-a`
  - `@keyframes float`, `@keyframes bounce`
  - (`.fade-in`, `@keyframes fadeIn` y las clases `.cover-*` ya existen en `globals.css`; no se duplican).

**Out of scope (for future specs):**

- `about.jsx` (pantalla "Acerca de") y su link de navegación correspondiente — no se toca `nav.jsx` del template más allá de añadir "Inicio". El link "Acerca de" se añade en una spec futura junto con la implementación de esa pantalla.
- Datos reales para el ticker de "Actividad en Vivo" y el "Top Jugadores · Hoy" — se portan como arrays literales estáticos, igual que en el template (no se conectan a `lib/data.ts` ni a `av_scores` de `localStorage`).
- Cualquier redirect de `/` a `/biblioteca` para compatibilidad con enlaces antiguos (proyecto sin usuarios en producción todavía).
- Sistema de precios/pagos real — la sección "Precios" sigue siendo puramente visual (plan gratuito único, sin backend).
- Formulario de contacto (pertenece a `about.jsx`, fuera de esta spec).

## Data model

No se introduce ningún modelo de datos nuevo. Home reutiliza `GAMES` de `lib/data.ts` (ya tipado, spec 01) para el `mini-rail`. Los arrays de ticker/top-jugadores del template se declaran como constantes locales dentro del componente Home (mismo formato que en `home.jsx`), sin persistirlos ni tipar en `lib/types.ts`.

## Implementation plan

1. Mover `app/page.tsx` (Biblioteca actual) a `app/biblioteca/page.tsx`, sin modificar su contenido.
2. Crear el nuevo `app/page.tsx` portando `home.jsx`: `Home`, `FloatingSilhouettes`, `MiniCard`, `FeatureIcon` como funciones dentro del mismo archivo (o en `components/` solo si se detecta reutilización real), reemplazando `navigate({name, id})` por `next/link`/`useRouter().push()` hacia las rutas reales listadas en Scope.
3. Portar el hook `useReveal` como hook local en `app/page.tsx`, ejecutándose en un `useEffect` sobre `document.querySelectorAll(".reveal")`.
4. Añadir a `app/globals.css` los selectores y `@keyframes` listados en Scope, copiados literalmente desde `references/templates/home-about/styles.css`, sin modificar variables ni el resto del archivo.
5. Actualizar `components/Nav.tsx`: añadir link "Inicio" (`/`) antes de "Biblioteca"; cambiar el `href` de "Biblioteca" a `/biblioteca`; ajustar `isActive("biblioteca")` para que compruebe `pathname.startsWith("/biblioteca") || pathname.startsWith("/juegos")` y añadir `isActive("home")` para `pathname === "/"`. Replicar el cambio también en el panel móvil.
6. Revisar cualquier enlace interno existente que apunte a `/` esperando la Biblioteca (por ejemplo el logo de `Nav`, que debe seguir yendo a `/` porque ahora `/` es Home — no requiere cambio) y actualizar los que en realidad deban ir a `/biblioteca`.
7. Verificación manual con `npm run dev`: recorrer `/` (Home) y `/biblioteca`, comprobar navegación del Nav (Inicio/Biblioteca/Salón), todos los CTAs de Home, el efecto reveal al hacer scroll, y que no hay errores en consola ni clases CSS sin estilo.

## Acceptance criteria

- [x] `npm run dev` arranca sin errores y `/` muestra la nueva Home (hero, siluetas flotantes, features, rail de juegos, stats, actividad en vivo, precios, CTA final).
- [x] `/biblioteca` muestra exactamente la pantalla que antes estaba en `/` (buscador, chips, grid de `GAMES`), sin regresiones.
- [x] El Nav muestra "Inicio" y "Biblioteca" como enlaces separados; "Inicio" queda activo en `/` y "Biblioteca" en `/biblioteca` y en `/juegos/*`.
- [x] En Home, "Explorar Juegos", "Ver Todos los Juegos →" e "Insertar Moneda →" navegan a `/biblioteca`.
- [x] En Home, "Crear Cuenta" y "Empezar Gratis →" navegan a `/login`.
- [x] Click en cualquier `MiniCard` del rail de juegos navega a `/juegos/[id]` con el id correcto.
- [x] "Ver Salón →" navega a `/salon`.
- [x] Las secciones marcadas con `.reveal` aparecen con la animación de entrada al hacer scroll (usando `IntersectionObserver`, igual que el template).
- [x] El look visual de Home (hero, siluetas de neón, tarjetas, ticker, precios) coincide con `references/templates/home-about/arcade-vault-standalone.html` abierto en el navegador.
- [x] No aparece ningún link "Acerca de" en el Nav todavía.
- [x] No hay errores de consola ni clases CSS sin estilos aplicados en ninguna de las dos rutas.

## Decisions

- **Sí:** Home pasa a ser `/` y la Biblioteca se mueve a `/biblioteca`. Coincide con la estructura de `nav.jsx` del template (Inicio/Biblioteca/Salón/Acerca de como rutas independientes) y es el patrón estándar para un sitio con landing page.
- **No:** mantener la Biblioteca en `/` y poner Home en otra ruta (ej. `/inicio`). Descartado por no ser el patrón del template ni el habitual en sitios con landing.
- **Sí:** añadir a `globals.css` solo los selectores nuevos que usa Home, en vez de reemplazar el archivo completo por el `styles.css` de 1744 líneas de `home-about`. Los tokens base (`--bg`, `--cyan`, etc.) coinciden entre ambos ficheros, así que no hay necesidad de reemplazo completo, y este enfoque evita alterar el CSS de las pantallas ya implementadas en spec 01.
- **No:** añadir ya el link "Acerca de" al Nav. Se pospone a la spec que implemente `about.jsx`, para no dejar un enlace roto (404).
- **Sí:** portar el ticker de "Actividad en Vivo" y el "Top Jugadores · Hoy" como arrays estáticos literales (igual que el template), sin conectarlos a `lib/data.ts` ni a `localStorage`. Es contenido decorativo del MVP visual, consistente con el criterio ya usado en spec 01 para el simulador del reproductor.
- **Sí:** mantener `MiniCard`, `FeatureIcon` y `FloatingSilhouettes` como funciones locales dentro de `app/page.tsx` en vez de extraerlas a `components/`, ya que no se reutilizan en ninguna otra pantalla (igual que el criterio de spec 01 para subcomponentes específicos de una pantalla).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Selectores CSS del `home-about/styles.css` (más nuevo) podrían chocar por nombre con clases ya existentes en `globals.css` de otras pantallas | Antes de copiar, verificar que ninguno de los nombres de clase listados en Scope ya existe en `globals.css`; si hay colisión de nombre con significado distinto, resolver renombrando o namespacing en el paso 4. |
| Mover `app/page.tsx` a `app/biblioteca/page.tsx` puede dejar imports rotos o referencias a `/` que asumían la Biblioteca | Revisar explícitamente el paso 6 del plan de implementación antes de dar la spec por completada. |
| El `IntersectionObserver` de `useReveal` no es compatible con SSR (usa `document`) | El componente Home es `"use client"` y el hook se ejecuta dentro de `useEffect`, que solo corre en cliente — mismo patrón ya usado en otras pantallas portadas en spec 01. |

## What is **not** in this spec

- Implementación de `about.jsx` y su enlace de navegación.
- Datos reales para el ticker de actividad y el ranking de la landing.
- Redirects de compatibilidad para `/`.
- Backend de pagos/precios.
- Formulario de contacto.

Cada uno de estos, si se aborda, va en su propia spec.
