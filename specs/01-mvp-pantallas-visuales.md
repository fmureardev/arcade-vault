# SPEC 01 — MVP visual de Arcade Vault (pantallas de references/templates)

> **Status:** Implementado
> **Depends on:** —
> **Date:** 2026-08-10
> **Objective:** Portar las 5 pantallas del prototipo estático (`references/templates/`) a rutas reales de Next.js 16 App Router, con el mismo diseño retro-neón y datos simulados, sin implementar lógica de juego real.

## Scope

**In:**

- 5 pantallas migradas desde `references/templates/*.jsx` a componentes de App Router:
  - Biblioteca (`biblioteca.jsx`) → `/`
  - Detalle de juego (`detalle.jsx`) → `/juegos/[id]`
  - Reproductor (`reproductor.jsx`) → `/juegos/[id]/jugar`
  - Login/registro (`auth.jsx`) → `/login`
  - Salón de la Fama (`salon.jsx`) → `/salon`
- Navegación global (`nav.jsx`) como componente cliente compartido en `app/layout.tsx`, con menú móvil, estado activo por ruta y botón de sesión.
- Footer estático igual al de `app.jsx` (copyright + versión).
- Datos simulados portados de `data.jsx` (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) a `lib/data.ts`, tipados en TypeScript.
- Sesión simulada: login/invitado guardado en `localStorage` (`av_user`), leído por `Nav` y por el resto de pantallas para condicionar la UI (ej. nombre precargado en el reproductor, fila "tu mejor marca" en el salón).
- Guardado de puntuación simulado: al terminar una partida en el reproductor, se añade una entrada a `localStorage` (`av_scores`), igual que el template. No se lee de vuelta en ninguna otra pantalla (el template tampoco lo hace).
- Reproductor como réplica visual fiel del simulador del template: HUD con jugador/puntuación/vidas/nivel, incremento automático de puntuación por `setInterval`, pausa, botón "FIN", modal de fin de partida con formulario de iniciales y guardado en `localStorage`. Es un placeholder animado, no un juego real ni un motor reutilizable.
- Estilos: `references/templates/styles.css` portado a `app/globals.css` (o módulo equivalente) adaptado mínimamente a Tailwind v4 (`@import "tailwindcss"` + las variables/clases del template conviven con él). Mismo look CRT/neón, scanlines, tipografías pixel/mono.
- Fuentes (`Press Start 2P`, `Courier Prime`, `JetBrains Mono`) cargadas vía `next/font/google` en `app/layout.tsx`, sustituyendo los `<link>` a Google Fonts del template.
- Contador de créditos en `Nav` como valor estático `"CRÉDITOS · 03"`, sin lógica real.

**Out of scope (for future specs):**

- Cualquier lógica de juego real (colisiones, inputs de teclado/táctiles, reglas por juego). El "arena" del reproductor sigue siendo decorativo (enemigos/nave estáticos vía CSS), igual que en el template.
- Autenticación real (backend, validación de credenciales, OAuth de Google/GitHub — esos botones quedan como placeholders no funcionales, igual que en el template).
- Persistencia real de puntuaciones (API, base de datos). Solo `localStorage` del navegador.
- Sistema de créditos real.
- Internacionalización (todo el contenido queda en español, igual que el template).
- Tests automatizados de UI.

## Data model

```ts
// lib/types.ts
type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string; // clase CSS de fondo, ej. "cover-bricks"
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string; // ej. "12.4K"
}

interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/AAAA"
}

interface StoredUser {
  name: string;
}

interface StoredScoreEntry {
  game: string; // Game.id
  score: number;
  name: string;
  at: number; // Date.now()
}
```

Claves de `localStorage` (idénticas al template):

- `av_user`: `StoredUser | null` serializado en JSON.
- `av_scores`: array de `StoredScoreEntry` serializado en JSON.

`GAMES`, `CATS` y la función `seededScores(seed, count)` se portan tal cual desde `data.jsx` a `lib/data.ts`, con tipos.

## Implementation plan

1. Crear `lib/types.ts` con las interfaces anteriores.
2. Crear `lib/data.ts` portando `GAMES`, `CATS`, `PLAYERS` y `seededScores` desde `references/templates/data.jsx`, tipado y sin `window.*`.
3. Crear `lib/user.ts` con helpers cliente `getStoredUser()`, `setStoredUser(user)`, `clearStoredUser()` y `saveScore(entry)` sobre `localStorage`, con manejo de parse-error igual que el template (try/catch silencioso).
4. Actualizar `app/layout.tsx`: cargar las 3 fuentes con `next/font/google`, incluir `av-bg`/`av-noise` (los overlays decorativos del `body` del template) y montar `<Nav>` + `<main className="av-main">{children}</main>` + footer estático.
5. Portar `references/templates/styles.css` a `app/globals.css`, conservando `@import "tailwindcss";` al inicio. Verificar que la app arranca (`npm run dev`) y que las clases del template (`.av-nav`, `.card`, `.crt`, etc.) están disponibles.
6. Crear `components/Nav.tsx` (`"use client"`) portando `nav.jsx`: usa `usePathname()` de `next/navigation` para el estado activo en vez de `route.name`, `next/link` para navegar, y `lib/user.ts` para leer/limpiar la sesión.
7. Crear `app/page.tsx` (Biblioteca): portar `biblioteca.jsx` (`Library` + `GameCard`) como componente cliente, filtro de búsqueda/categoría en estado local, navegando a `/juegos/[id]` con `next/link` o `useRouter`.
8. Crear `app/juegos/[id]/page.tsx` (Detalle): portar `detalle.jsx`, resolviendo `game` por `params.id` con `GAMES.find`; si no existe, `notFound()`. Botón "JUGAR AHORA" enlaza a `/juegos/[id]/jugar`.
9. Crear `app/juegos/[id]/jugar/page.tsx` (Reproductor): portar `reproductor.jsx` como componente cliente, con el simulador de puntuación por `setInterval`, pausa, fin de partida, modal y `saveScore()` de `lib/user.ts`. "SALIR" vuelve a `/juegos/[id]`, "VOLVER AL VAULT" a `/`.
10. Crear `app/login/page.tsx` (Auth): portar `auth.jsx`, usando `setStoredUser()` en submit/invitado y redirigiendo a `/` con `useRouter().push`.
11. Crear `app/salon/page.tsx` (Salón de la Fama): portar `salon.jsx`, con tabs por juego en estado local y lectura de `getStoredUser()` para la fila "tu mejor marca".
12. Revisar `app/page.tsx` y `app/layout.tsx` originales del scaffold (`create-next-app`) y eliminar el contenido de bienvenida por defecto que ya no aplica.
13. Verificación manual con `npm run dev`: recorrer las 5 rutas, comprobar que el diseño coincide visualmente con `references/templates/Arcade Vault.html` y que no hay errores en consola.

## Acceptance criteria

- [ ] `npm run dev` arranca sin errores y `/` muestra la Biblioteca con buscador, chips de categoría y grid de tarjetas de `GAMES`.
- [ ] Filtrar por texto o por categoría en `/` actualiza el grid sin recargar la página.
- [ ] Click en una tarjeta o en "JUGAR" navega a `/juegos/[id]` con la info correcta del juego (portada, descripción, tags, estadísticas, leaderboard).
- [ ] `/juegos/id-inexistente` responde con la página 404 de Next.js.
- [ ] "JUGAR AHORA" en el detalle navega a `/juegos/[id]/jugar`, donde el HUD muestra jugador, puntuación, vidas y nivel, y la puntuación sube sola cada ~220ms.
- [ ] El botón "PAUSA" detiene el incremento de puntuación y muestra el overlay "EN PAUSA"; "REANUDAR" lo reactiva.
- [ ] El botón "FIN" abre el modal de fin de partida con la puntuación final; guardar la puntuación escribe una entrada en `localStorage['av_scores']` y muestra el toast "PUNTUACIÓN GUARDADA_".
- [ ] "JUGAR DE NUEVO" reinicia score/vidas/nivel sin salir de la pantalla; "VOLVER AL VAULT" navega a `/`.
- [ ] `/login` muestra el formulario con tabs "INICIAR SESIÓN"/"CREAR CUENTA"; enviar el formulario o pulsar "JUGAR COMO INVITADO" guarda `localStorage['av_user']` (o lo deja `null` para invitado) y redirige a `/`.
- [ ] Tras iniciar sesión, `Nav` muestra el nombre de usuario en vez de "Iniciar Sesión", y cerrar sesión limpia `localStorage['av_user']` y vuelve a mostrar el botón de login.
- [ ] `/salon` muestra tabs por juego, podio (oro/plata/bronce) y tabla de puntuaciones para el juego seleccionado; si hay usuario logueado, aparece la fila "TU MEJOR MARCA".
- [ ] El menú móvil (`hamburger`) de `Nav` abre/cierra el panel lateral con los mismos enlaces que el nav de escritorio.
- [ ] El look visual (colores neón, fuentes pixel/mono, scanlines del CRT) coincide con `references/templates/Arcade Vault.html` abierto directamente en el navegador.
- [ ] Ninguna pantalla implementa lógica de juego real (inputs, colisiones, reglas) más allá del simulador decorativo ya descrito.

## Decisions

- **Sí:** rutas reales de App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/login`, `/salon`) en vez de mantener el hash-routing SPA del template. Es lo idiomático en Next.js 16 y evita reimplementar un router propio.
- **No:** SPA de una sola página con estado de ruta en memoria. Descartado por no aprovechar App Router y complicar SEO/navegación nativa (atrás/adelante del navegador).
- **Sí:** portar el simulador de partida del reproductor tal cual (puntuación automática, pausa, modal de fin). Es un placeholder visual explícitamente pedido para mostrar el diseño completo de la pantalla, no un juego real.
- **Sí:** mantener `localStorage` para sesión (`av_user`) y puntuaciones (`av_scores`), igual que el template. Es suficiente para un MVP visual sin backend y no requiere infraestructura nueva.
- **No:** backend/API real para auth o puntuaciones. Fuera del alcance de "solo la parte visual".
- **Sí:** portar `styles.css` casi literal a `globals.css` en vez de rediseñar con Tailwind. El template ya tiene un diseño validado; rehacerlo duplicaría trabajo sin aportar valor en este MVP.
- **Sí:** `next/font/google` para las 3 fuentes en vez de `<link>` a Google Fonts. Es la práctica recomendada en Next.js 16 (autohospedado, sin layout shift) y no cambia el resultado visual.
- **Sí:** contador de créditos estático `"03"`. Es decorativo en el template y no hay pedido de lógica real para este MVP.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El CSS del template usa selectores globales (`.card`, `.btn`, etc.) que podrían chocar con clases utilitarias de Tailwind v4 | Cargar `styles.css` después de `@import "tailwindcss"` en `globals.css`; si aparecen colisiones de nombres, se resuelven prefijando o revisando en el paso 5 antes de continuar. |
| `localStorage` no disponible (SSR o modo privado estricto) | Todas las lecturas/escrituras ya están en componentes `"use client"` y envueltas en try/catch, igual que el template; si falla, la app sigue funcionando sin persistencia. |
| Tipar `GAMES`/`seededScores` en TS puede exponer inconsistencias no visibles en el `.jsx` original | Revisar tipos contra el uso real en cada pantalla portada durante los pasos 7–11. |

## What is **not** in this spec

- Lógica de juego real para cualquiera de los 8 juegos del catálogo.
- Autenticación y backend real (usuarios, contraseñas, OAuth funcional).
- Persistencia de puntuaciones fuera de `localStorage`.
- Sistema de créditos funcional.
- Tests automatizados.

Cada uno de estos, si se aborda, va en su propia spec.
