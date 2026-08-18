# SPEC 04 — Juego Asteroids en canvas real

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-08-18
> **Objective:** Integrar el juego Asteroids (`references/started-games/02-asteroids/`) en la plataforma como un nuevo juego con `id: "asteroids"`, accesible en `/juegos/asteroids/jugar`, con un canvas real jugable en lugar del simulador ficticio de `GamePlayer`.

## Scope

**In:**

- Nueva entrada en `lib/data.ts` → array `GAMES` con `id: "asteroids"`, categoría `"SHOOTER"`, color `"yellow"` y los textos descriptivos del juego.
- Nuevo componente `components/AsteroidsGame.tsx` (`"use client"`) que:
  - Renderiza un `<canvas ref={canvasRef} width={800} height={600}>` centrado sobre fondo negro que cubre toda la pantalla (`100dvh`), sin Nav visible.
  - Ejecuta toda la lógica de `game.js` (clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` y el game loop `requestAnimationFrame`) dentro de un `useEffect`, con cleanup al desmontar: `cancelAnimationFrame` + `removeEventListener` en `window`.
  - Dibuja el HUD sobre el canvas igual que el original: `SCORE`, `NIVEL`, iconos de vidas, indicador `3x` de triple disparo.
  - Muestra un botón `← VOLVER` absolutamente posicionado arriba a la izquierda, por encima del canvas, que lleva a `/juegos/asteroids` usando `next/link`.
- Nueva ruta estática `app/juegos/asteroids/jugar/page.tsx` que renderiza `<AsteroidsGame />`. Next.js prefiere rutas estáticas sobre dinámicas, por lo que esta ruta sobreescribe `/juegos/[id]/jugar` únicamente para `asteroids`, sin modificar el resto de juegos.
- El canvas mantiene exactamente 800×600 px fijo (mismo que el original). En viewports estrechos aparece centrado con scroll horizontal si es necesario.
- Las teclas de control son las mismas del original: `ArrowLeft`/`ArrowRight` para rotar, `ArrowUp` para empujar, `Space` para disparar / reiniciar tras Game Over.
- Game Over muestra el overlay del canvas original (`GAME OVER`, puntaje, `ESPACIO PARA REINICIAR`) sin ningún modal de React encima.

**Out of scope (para specs futuras):**

- Controles táctiles / mobile.
- Canvas responsive (escala al viewport).
- Guardar puntuación en localStorage o Supabase al terminar la partida — la persistencia de scores va en una spec del sistema de high scores.
- Modificar `GamePlayer.tsx` o cualquier otra ruta de juego distinta de `asteroids`.
- Sonido.
- Nuevas mecánicas de juego más allá de las ya presentes en `game.js`.

## Data model

Se añade una entrada a `GAMES` en `lib/data.ts`:

```ts
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "Pulveriza rocas espaciales en gravedad cero.",
  long: "Tu nave triangular flota en el vacío absoluto. Dispara, rota y divide rocas en fragmentos cada vez más pequeños. Recoge el powerup triple disparo y sobrevive oleada tras oleada.",
  cat: "SHOOTER",
  cover: "cover-rocas",
  color: "yellow",
  best: 41200,
  plays: "15.6K",
},
```

El resto de la lógica del juego (clases, variables de estado, game loop) vive exclusivamente como variables locales dentro del `useEffect` de `AsteroidsGame.tsx`. No se exporta estado de juego a React ni se añade nada a `lib/types.ts`.

## Implementation plan

1. Añadir la entrada `asteroids` al array `GAMES` en `lib/data.ts` (ver Data model arriba).

2. Crear `app/juegos/asteroids/jugar/page.tsx`:

   ```tsx
   import AsteroidsGame from "@/components/AsteroidsGame";
   export default function AsteroidsPlayPage() {
     return <AsteroidsGame />;
   }
   ```

   Sin layout especial: el componente se responsabiliza de cubrir la pantalla.

3. Crear `components/AsteroidsGame.tsx`:
   - `"use client"`.
   - `useRef<HTMLCanvasElement>(null)` para el canvas.
   - `useEffect` que:
     a. Obtiene `canvas` y `ctx` del ref; aborta si son `null`.
     b. Declara todas las variables y clases de `game.js` (`keys`, `justPressed`, `pressed`, `wrap`, `dist`, `rand`, `randInt`, clases `Bullet`/`Asteroid`/`PowerUp`/`Ship`/`Particle`, constantes de juego, funciones `spawnAsteroids`/`initGame`/`nextLevel`/`explode`/`killShip`/`update`/`draw`/`drawHUD`/`drawOverlay`/`drawLifeIcon`/`loop`) dentro del scope del efecto, sustituyendo las referencias al canvas global (`document.getElementById`) por las variables locales `canvas` y `ctx`.
     c. Registra `keydown` y `keyup` en `window`.
     d. Llama a `initGame()` y arranca el loop con `let rafId = requestAnimationFrame(loop)`.
     e. Retorna cleanup: `cancelAnimationFrame(rafId)`, `window.removeEventListener` x2.
   - JSX: `<div>` contenedor con `position: fixed; inset: 0; background: #000; display: flex; align-items: center; justify-content: center; z-index: 10` para cubrir pantalla completa y centrar el canvas.
   - Botón de retorno absolutamente posicionado (`position: absolute; top: 16px; left: 16px`) dentro del contenedor, usando `<Link href="/juegos/asteroids" className="btn ghost">← VOLVER</Link>` (la clase `btn ghost` ya existe en `globals.css`).

4. Verificación manual con `npm run dev`:
   - Navegar a `/juegos/asteroids` → hacer clic en "INSERTAR MONEDA" → llega a `/juegos/asteroids/jugar`.
   - El canvas del juego aparece centrado sobre fondo negro, sin Nav.
   - Las teclas `ArrowLeft/Right/Up` y `Space` funcionan correctamente.
   - Al perder todas las vidas, aparece el overlay `GAME OVER` en el canvas; `Space` reinicia.
   - El botón `← VOLVER` navega a `/juegos/asteroids`.
   - `/juegos/bloque-buster/jugar` sigue mostrando el `GamePlayer` simulado sin regresión.
   - No hay errores de consola.

## Acceptance criteria

- [ ] La entrada `asteroids` aparece en la Biblioteca (`/biblioteca`) y en la página de detalle `/juegos/asteroids`.
- [ ] `/juegos/asteroids/jugar` carga el canvas real de 800×600 con el juego funcionando.
- [ ] Las teclas de control responden: rotar, empujar, disparar.
- [ ] El powerup triple disparo aparece tras matar 5 asteroides (garantizado) o con 15 % de probabilidad por asteroide destruido, y se recoge tocándolo.
- [ ] Al perder todas las vidas, el overlay de Game Over aparece sobre el canvas; `Space` reinicia la partida.
- [ ] El botón `← VOLVER` visible sobre el canvas lleva a `/juegos/asteroids`.
- [ ] El canvas no captura el foco para scroll (el juego usa listeners en `window`, no en el canvas).
- [ ] Al desmontar el componente (navegar fuera), el game loop se detiene sin memory leaks.
- [ ] La ruta dinámica `/juegos/[id]/jugar` sigue funcionando para todos los demás juegos — sin regresión.
- [ ] No hay errores de TypeScript (`npm run build` limpio) ni errores de consola.

## Decisions

- **Sí:** nuevo juego `id: "asteroids"`, independiente de `id: "rocas"` (que permanece como placeholder de otro juego futuro). El juego de referencia es Asteroids, no una reimplementación de "Rocas". Mantener los dos como entradas separadas evita ambigüedad en la plataforma.
- **Sí:** ruta estática `app/juegos/asteroids/jugar/page.tsx` sobre la dinámica `[id]`. Permite aislar la implementación del canvas real sin tocar `GamePlayer.tsx` ni el resto de juegos, y sigue la preferencia de Next.js App Router por rutas estáticas.
- **No:** modificar `GamePlayer.tsx` para detectar `game.id === "asteroids"`. Mezclaría responsabilidades en un componente que actualmente es el simulador genérico de todos los demás juegos.
- **Sí:** toda la lógica del juego dentro del `useEffect`, como closure autocontenido. Equivale al módulo JS original pero sin contaminar el scope global de React. Alternativa descartada: importar `game.js` directamente — requeriría refactorizarlo para exportar sus funciones o usar un `ref` externo al módulo.
- **Sí:** nombres de componentes, funciones y variables en inglés (`AsteroidsGame`, `AsteroidsPlayPage`, `canvasRef`, `rafId`, etc.), siguiendo la instrucción del proyecto para el código nuevo.
- **Sí:** pantalla completa sin Nav durante el juego (experiencia arcade clásica), con botón `← VOLVER` superpuesto. El Nav distrae durante el juego y sus atajos de teclado podrían interferir con los controles.
- **No:** guardar score al Game Over en este spec. La persistencia de puntuaciones requiere diseño de la tabla de high scores que merece su propia spec.
- **Sí:** canvas fijo 800×600 sin escala responsive. Cero cambios a la lógica de colisión y wrapping del original, que asume `W=800`/`H=600`. La responsividad puede abordarse en el futuro con `transform: scale()` sobre el contenedor.

## Risks

| Riesgo                                                                                            | Mitigación                                                                                                                               |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| El `useEffect` se ejecuta dos veces en Strict Mode (desarrollo), arrancando dos loops en paralelo | La función de cleanup cancela el RAF y elimina los listeners; el segundo mount limpia el primero correctamente.                          |
| El canvas puede perder el foco y no recibir eventos si hay otros elementos enfocados              | Los listeners se registran en `window`, no en el canvas, igual que el original — inmune a este problema.                                 |
| Navegar fuera sin que el cleanup cancele el RAF causaría llamadas a `ctx` en un canvas desmontado | El cleanup cancela el RAF con `cancelAnimationFrame(rafId)`; `rafId` se almacena como `let` dentro del efecto antes de arrancar el loop. |
