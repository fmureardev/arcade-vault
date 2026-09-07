# SPEC 05 — Tablas Supabase: games y scores (leaderboard)

> **Status:** Approved
> **Depends on:** SPEC 04 (Supabase base)
> **Date:** 2026-08-18
> **Objective:** Crear las tablas `games` y `scores` en Supabase con sus políticas RLS y regenerar `lib/database.types.ts`, sin modificar ningún componente ni página existente.

## Scope

**In:**

- Migración SQL con la tabla `games`: catálogo de referencia estático, sembrado con los juegos actuales de `lib/data.ts`.
- Migración SQL con la tabla `scores`: registro de puntuaciones por usuario y juego.
- Políticas RLS en ambas tablas:
  - `games` → SELECT público (anon + authenticated). Sin INSERT/UPDATE/DELETE vía cliente.
  - `scores` → SELECT público; INSERT solo para usuarios autenticados con `user_id = auth.uid()`.
- Regeneración de `lib/database.types.ts` para que las nuevas tablas sean accesibles con tipos correctos en el resto del proyecto.
- Verificación: `npm run build` limpio y tipos exportados correctamente.

**Out of scope:**

- Modificar `lib/data.ts` o cualquier componente que lo use — sigue como fuente de verdad en UI.
- Lógica de guardado de score al terminar una partida (eso va en la spec que integre el Game Over con Supabase).
- Pantalla de leaderboard en UI (`/salon` o similar).
- Autenticación de usuario (flujo de login funcional va en spec propia).
- UPDATE o DELETE de scores desde el cliente.
- Tabla de perfiles de usuario.
- Supabase local con Docker.

## Data model

### Tabla `games`

Catálogo de referencia; una fila por juego. Coexiste con `lib/data.ts` — `id` es la clave compartida.

```sql
CREATE TABLE public.games (
  id       TEXT PRIMARY KEY,       -- ej: "asteroids", "rocas", "bloque-buster"
  title    TEXT NOT NULL,
  cat      TEXT NOT NULL,          -- ej: "SHOOTER", "PUZZLE"
  color    TEXT NOT NULL           -- ej: "yellow", "blue"
);
```

Seed inicial con los juegos actuales del array `GAMES` en `lib/data.ts` (los que tengan `id` definido):

| id            | title         | cat     | color  |
| ------------- | ------------- | ------- | ------ |
| asteroids     | ASTEROIDS     | SHOOTER | yellow |
| rocas         | ROCAS         | SHOOTER | orange |
| bloque-buster | BLOQUE BUSTER | PUZZLE  | blue   |

> Campos como `short`, `long`, `cover`, `best`, `plays` se omiten: son datos de presentación que viven en `lib/data.ts` y no son necesarios para las relaciones de Supabase.

### Tabla `scores`

```sql
CREATE TABLE public.scores (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id    TEXT        NOT NULL REFERENCES public.games(id),
  score      INTEGER     NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Índices útiles para el leaderboard futuro (se crean ahora para no migrar después):

```sql
CREATE INDEX scores_game_id_score_idx ON public.scores (game_id, score DESC);
CREATE INDEX scores_user_id_idx       ON public.scores (user_id);
```

## Implementation plan

1. **Aplicar migración `games`** vía `mcp__supabase__apply_migration`:
   - Crear tabla `games` con los campos del Data model.
   - Habilitar RLS: `ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;`
   - Política SELECT pública:
     ```sql
     CREATE POLICY "games_select_public"
       ON public.games FOR SELECT
       USING (true);
     ```
   - Insertar las tres filas del seed (asteroids, rocas, bloque-buster).

2. **Aplicar migración `scores`** vía `mcp__supabase__apply_migration`:
   - Crear tabla `scores` con los campos del Data model.
   - Crear los dos índices.
   - Habilitar RLS: `ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;`
   - Política SELECT pública:
     ```sql
     CREATE POLICY "scores_select_public"
       ON public.scores FOR SELECT
       USING (true);
     ```
   - Política INSERT solo para el propio usuario:
     ```sql
     CREATE POLICY "scores_insert_own"
       ON public.scores FOR INSERT
       WITH CHECK (auth.uid() = user_id);
     ```

3. **Regenerar `lib/database.types.ts`** vía `mcp__supabase__generate_typescript_types` (o `npx supabase gen types typescript --project-id <id> --schema public`). Committear el archivo actualizado.

4. **Verificación**:
   - `npm run build` sin errores de TypeScript.
   - Las tablas `games` y `scores` aparecen en el dashboard de Supabase con RLS activo.
   - `lib/database.types.ts` exporta `Database['public']['Tables']['games']` y `Database['public']['Tables']['scores']` con los campos correctos.
   - Ninguna pantalla existente (Home, Biblioteca, Salón, About, Login, `/juegos/asteroids`) muestra regresiones.

## Acceptance criteria

- [ ] La tabla `games` existe en Supabase con RLS habilitado y la política SELECT pública activa.
- [ ] La tabla `games` contiene al menos las tres filas del seed (asteroids, rocas, bloque-buster).
- [ ] La tabla `scores` existe con los campos `id`, `user_id`, `game_id`, `score`, `created_at` y RLS habilitado.
- [ ] La FK `scores.game_id → games.id` está activa.
- [ ] La FK `scores.user_id → auth.users.id` ON DELETE CASCADE está activa.
- [ ] Los dos índices (`scores_game_id_score_idx`, `scores_user_id_idx`) existen.
- [ ] SELECT sobre `scores` es accesible sin autenticación (anon key).
- [ ] INSERT sobre `scores` con un `user_id` distinto al del token activo es rechazado por RLS.
- [ ] `lib/database.types.ts` exporta los tipos `games` y `scores` bajo `Database['public']['Tables']`.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna pantalla existente muestra regresiones visuales ni errores en consola.

## Decisions

- **Sí:** `lib/data.ts` permanece como fuente de verdad para la UI. La tabla `games` es solo referencia para relaciones en BD — evita romper todos los componentes que consumen `GAMES` en este spec.
- **Sí:** seed de las tres filas actuales en la migración de `games`. Si no se siembran, cualquier INSERT en `scores` con un `game_id` real fallaría la FK.
- **Sí:** RLS con SELECT público en ambas tablas. El leaderboard es por naturaleza público; no hay datos sensibles en `games`.
- **Sí:** RLS con INSERT restringido a `auth.uid() = user_id` en `scores`. Impide que un cliente guarde puntuaciones en nombre de otro usuario.
- **No:** SELECT restringido en `scores`. Las puntuaciones son públicas — ese es el punto del leaderboard.
- **No:** escritura de scores vía Service Role en este spec. Se considera cuando haya anticheat; para el MVP la validación de `auth.uid()` es suficiente.
- **No:** campos `short`, `long`, `cover`, `best`, `plays` en la tabla `games`. Son datos de presentación que ya viven en `lib/data.ts`; duplicarlos sin sincronización automática sería deuda técnica inmediata.
- **No:** campo `nivel_alcanzado` ni `duracion_segundos` en `scores`. Se pueden añadir en un ALTER TABLE cuando haya spec de integración Game Over; no hay lógica que los pueble todavía.
- **Dos migraciones separadas** (games primero, scores después): la FK de `scores.game_id` exige que `games` exista antes.

## Risks

| Riesgo                                                                                         | Mitigación                                                                                                                                               |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El seed de `games` se desincroniza de `lib/data.ts` al añadir nuevos juegos                    | Documentar en la spec de cada nuevo juego que debe añadirse también un INSERT en `games`; es un paso explícito en el plan de implementación de esa spec. |
| Un cliente malicioso puede insertar un `score` con `user_id` de otro usuario si obtiene su JWT | La política RLS `auth.uid() = user_id` lo previene: el JWT firma el `user_id` y Supabase lo valida en servidor.                                          |
| `lib/database.types.ts` desactualizado puede causar errores de TypeScript en specs futuras     | Se regenera explícitamente al final de este spec y en cualquier spec que modifique el esquema.                                                           |
