# Fridge Chef

List what's in your fridge and get a recipe you can actually cook from: tick off steps, scale servings, and swap ingredients. The AI returns structured JSON; the app validates it, repairs what it can, and renders interactive UI. It is not a chatbot.

Stack: React 19 + Vite (JavaScript), Zod, Google Gemini (free tier) via plain `fetch`, Express for local dev, Vercel serverless function in production.

## Setup

Requires Node 20.19+.

```bash
cp .env.example .env        # then paste your key: https://aistudio.google.com/apikey
npm install
npm start                   # web on http://localhost:5173, API on :3001
```

`npm start` runs the Vite dev server and the local API together (`concurrently`). Vite proxies `/api` to the API, so the browser only ever talks to its own origin.

**No API key yet?** Open http://localhost:5173/?debug=1 and pick *Sample recipe* in the Test mode box.

Other scripts: `npm test` (unit tests, Node's built-in runner), `npm run build`.

### Deploy (Vercel)

1. Import the repo in Vercel (framework preset: Vite).
2. Add `GEMINI_API_KEY` in Project → Settings → Environment Variables. Optionally `ENABLE_FAULTS=true` to allow `?debug=1` test modes in production.
3. Deploy. `api/recipe.js` becomes the serverless function at `/api/recipe`.

## Usage

1. Type your ingredients (commas or new lines), choose servings and any dietary preferences, press **Make a recipe** (or Ctrl/Cmd + Enter).
2. In the recipe:
   - **Serves** dial rescales every amount (shown as kitchen fractions: ½, ⅓, ¾). "To taste" items don't scale.
   - **Swap** shows alternatives for an ingredient; pick one, undo any time. Step chips update to the swapped name.
   - Tap a step to tick it off; the progress bar fills. **Start over** clears the ticks.
3. Every recipe (with its ticks, servings and swaps) is saved on this device and listed under *Your recipes*.

## How it works

```
Browser                                   Server (Vercel function / Express locally)
───────                                   ──────────────────────────────────────────
IngredientForm ─▶ useRecipeRequest.run()  POST /api/recipe
                  · aborts previous req    · validate input (length, servings, diet)
                  · request id guard       · prompt Gemini (JSON mode)
                  · 45s timeout            · parseModelJson → validateRecipe
fetchRecipe() ◀── JSON ──────────────────  · unusable? retry ONCE with the problems
  · validateRecipe again (never trust       · still unusable → 502 BAD_OUTPUT
    the network)                           · errors → { error: { code, message } }
  · map failures → error codes
useSessions ─▶ RecipeView (servings, swaps, ticks) ─▶ localStorage
```

| Folder | What's there |
|---|---|
| `shared/` | Used by **both** server and client: `parseJson.js` (repair), `amount.js` ("1 1/2 cups" → 1.5 + "cups"), `validateRecipe.js` (normalize + Zod), `recipeSchema.js` |
| `server/` | `handler.js` (HTTP), `generateRecipe.js` (model call + retry), `gemini.js` (REST call), `prompt.js`, `faults.js` (test modes), `dev.js` (local Express) |
| `api/recipe.js` | One-line Vercel entry that re-exports `server/handler.js` |
| `src/hooks/` | `useRecipeRequest` (request state machine + stale guard), `useSessions` (recipe + user progress, persisted) |
| `src/lib/` | Pure helpers: amount formatting/scaling/swaps, error copy, storage |
| `src/components/` | UI. Each component gets data that has already passed validation |

**The API key never reaches the browser.** It's read from `process.env` on the server only; the client calls `/api/recipe`.

## Handling bad AI output

The model is treated as an unreliable source. Output goes through three layers:

1. **Repair** (`shared/parseJson.js`): strips ```` ``` ```` fences, extracts the `{…}` from surrounding chatter, removes trailing commas.
2. **Normalize** (`shared/validateRecipe.js`): coerces what's fixable, and records a user-visible note for each fix.
   - string amounts like `"1/2"`, `"2-3"`, `"200g"`, `"½"` become numbers
   - missing or duplicate ids are generated
   - plain-string ingredients and steps are accepted
   - unknown ingredient references are dropped
   - nameless items are skipped
   - missing servings default to 2
3. **Validate** (`shared/recipeSchema.js`): a strict Zod schema. Anything that passes is safe to render without defensive checks in components.

| Failure | What happens |
|---|---|
| Malformed JSON | Repaired if possible; otherwise retried once with the error fed back to the model; then *"The recipe came back garbled"* + **Try again** |
| Wrong shape | Normalized; if still invalid, retried once with the Zod issues; then error + retry |
| Partly broken | Valid parts are kept; a collapsible *"N notes about this recipe"* explains what was fixed |
| Empty | *"The AI came back empty-handed"* (empty state, not an error) |
| Not food ("hello", "my car") | Model is told to answer `{"error":"NOT_FOOD"}` → empty state with **Edit ingredients** |
| Slow | Rotating, honest loading messages + elapsed time; **Stop** / Esc; 20s per model attempt on the server, 45s on the client |
| Rate limited (429) | Specific message: wait ~10s, retry |
| Network / server error | Message + retry. A previous recipe stays visible (dimmed) under the error |
| Stale response | Each request aborts the previous one **and** carries an increasing id; a result is applied only if its id is still the latest |
| Corrupt localStorage | Saved recipes are re-validated on load; bad entries are dropped; storage errors are ignored |
| Render bug | `ErrorBoundary` shows a reload / clear-data screen instead of a blank page |

### Test modes (fault injection)

Open the app with `?debug=1`. A *Test mode* select makes the server return a canned or broken response instead of calling the model:

`sample`, `partial` (messy but salvageable), `race` (random 0.5–3.5s delay: submit several times fast; only the last one wins), `malformed`, `wrongshape`, `empty`, `notfood`, `slow` (client timeout shortened to 8s), `ratelimit`, `error500`.

You can also hit it directly: `curl -X POST localhost:3001/api/recipe?simulate=malformed -H 'Content-Type: application/json' -d '{"ingredients":"eggs"}'`.

### Tests

`npm test` covers:
- JSON repair
- amount parsing
- normalization and validation (good, wrapped, empty, not-food, wrong shape, messy, duplicate ids)
- the server retry loop against a fake Gemini (retry-then-succeed, fail twice, NOT_FOOD not retried, 429, missing key)
- formatting, scaling and swaps

## AI usage

<!-- Be specific and honest here — the brief says this counts in your favour. Edit this section to reflect what you actually did. -->

- The initial implementation of this project was generated with Claude (Anthropic) from my plan: the architecture, the validation pipeline, the components, the CSS and the tests.
- TODO (me): list what I reviewed line by line, what I changed or rewrote myself, and any bugs I found and fixed.
- The prompt in `server/prompt.js` is used at runtime with Gemini to produce the recipe JSON.

## Known limitations

- Step text is not rewritten after a swap (step 3 may still say "spinach" after swapping to kale). The ingredient chips under each step do update. A refinement call to the model could rewrite the steps.
- Unit conversion isn't supported. Scaling multiplies numbers but never changes "1000 g" into "1 kg".
- Amount ranges like "2-3" are averaged.
- Gemini's free tier has low rate limits. 429s are handled, but there's no client-side queue or backoff.
- `/api/recipe` has no rate limiting or abuse protection of its own; anyone with the URL can spend the key's quota.
- No streaming: the recipe appears all at once, because partial JSON can't be validated until it's complete.
- Saved recipes live in this browser's localStorage only, with no sync across devices. The 8 most recent are kept.
- The prompt asks the model to ignore instructions inside the ingredient text, but prompt injection can't be fully prevented. The schema validation limits what injected output can do to the UI.

## What I'd do next

- A refinement loop ("make it vegetarian", "no oven") that sends the current recipe plus the instruction and returns a patched recipe.
- Streaming with partial rendering: show the title and ingredients as soon as they validate.
- Per-IP rate limiting on the API, and retry with backoff on 429.
- Component tests (React Testing Library) for the request hook's race handling.

## Time spent

TODO: fill in honestly (target ~8h).
