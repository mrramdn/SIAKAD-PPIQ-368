# Career Path RIASEC App Agent Rules

## Project Context

This project is a monolithic Next.js application for a RIASEC-based career path recommendation system. The target users are santri, students, and prospective university students. The app supports user assessment, career recommendations, major/faculty/campus recommendations, and an admin dashboard for managing master data and monitoring results.

Primary stack:

- Next.js App Router
- React
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- PostgreSQL
- Auth.js / NextAuth-style auth
- Zod
- UUID
- Vercel

## Next.js Version Rule

This is NOT the Next.js you know.

This project uses a newer Next.js version with breaking changes. APIs, conventions, and file structure may differ from older examples or training data. Before writing or refactoring Next.js-specific code, check the locally installed Next.js package and prefer the current project conventions.

Heed deprecation notices and avoid relying on outdated Next.js patterns.

## Development Principles

- Use `pnpm` for all package and script commands.
- Do not use `npm`, `yarn`, `package-lock.json`, or `yarn.lock`.
- Keep the app as a Next.js monolith.
- Prefer backend-first implementation: schema, migration, seed, service/API, then frontend.
- Keep changes small, direct, and aligned with the documented roadmap.
- Use Prisma as the official database access layer.
- Do not query PostgreSQL manually unless there is a documented reason.
- Use Zod for input validation.
- Protect admin functionality on the server side, not only in the UI.
- Store passwords only as hashes.
- Do not commit `.env`, `.env.local`, `.env.production`, or `.env.staging`.

## Recommended Structure

Prefer the documented structure:

```text
src/
  app/
  components/
  features/
  lib/
  types/
  middleware.ts
prisma/
  schema.prisma
  seed.ts
```

Use feature/domain separation for larger backend and frontend work:

- `features/auth`
- `features/users`
- `features/riasec`
- `features/assessments`
- `features/recommendations`
- `features/careers`
- `features/campuses`
- `features/admin`

## Vercel React Best Practices

Apply these guidelines when writing React components, Next.js pages, server actions, route handlers, and data fetching code.

Priority order:

| Priority | Category | Impact | Prefix |
|---|---|---|---|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

### 1. Eliminating Waterfalls

- `async-cheap-condition-before-await`: Check cheap synchronous conditions before awaiting remote values.
- `async-defer-await`: Move `await` into the branch where the value is actually needed.
- `async-parallel`: Use `Promise.all()` for independent async operations.
- `async-dependencies`: Model partial dependencies explicitly instead of serializing unrelated work.
- `async-api-routes`: Start promises early and await late in API routes or route handlers.
- `async-suspense-boundaries`: Use Suspense boundaries where streaming improves perceived performance.

### 2. Bundle Size Optimization

- `bundle-barrel-imports`: Import directly from modules and avoid broad barrel imports.
- `bundle-analyzable-paths`: Prefer statically analyzable imports and filesystem paths.
- `bundle-dynamic-imports`: Use `next/dynamic` for heavy client-only components when useful.
- `bundle-defer-third-party`: Load analytics and logging after hydration unless critical.
- `bundle-conditional`: Load optional modules only when a feature is activated.
- `bundle-preload`: Preload likely-needed code on hover or focus when it improves perceived speed.

### 3. Server-Side Performance

- `server-auth-actions`: Authenticate server actions and route handlers like API endpoints.
- `server-cache-react`: Use React `cache()` for per-request deduplication when applicable.
- `server-cache-lru`: Use an LRU cache for safe cross-request caching when data allows it.
- `server-dedup-props`: Avoid duplicate serialization in React Server Component props.
- `server-hoist-static-io`: Hoist static I/O to module scope where safe.
- `server-no-shared-module-state`: Avoid mutable request state at module level in RSC/SSR.
- `server-serialization`: Minimize data passed from server components to client components.
- `server-parallel-fetching`: Parallelize independent server fetches.
- `server-parallel-nested-fetching`: Use `Promise.all()` for per-item nested fetches when independent.
- `server-after-nonblocking`: Use non-blocking follow-up work where supported and appropriate.

### 4. Client-Side Data Fetching

- `client-swr-dedup`: Use a client fetching layer with request deduplication when client fetching is needed.
- `client-event-listeners`: Deduplicate global event listeners.
- `client-passive-event-listeners`: Use passive listeners for scroll and touch events where safe.
- `client-localstorage-schema`: Version and minimize persisted browser storage data.

### 5. Re-render Optimization

- `rerender-defer-reads`: Do not subscribe to state only used inside callbacks.
- `rerender-memo`: Extract expensive work into memoized components only when there is measurable value.
- `rerender-memo-with-default-value`: Hoist default non-primitive props.
- `rerender-dependencies`: Prefer primitive dependencies in effects.
- `rerender-derived-state`: Subscribe to derived booleans instead of broad raw state.
- `rerender-derived-state-no-effect`: Derive state during render instead of effects when possible.
- `rerender-functional-setstate`: Use functional state updates for stable callbacks.
- `rerender-lazy-state-init`: Pass a function to `useState` for expensive initial values.
- `rerender-simple-expression-in-memo`: Do not memoize simple primitive expressions.
- `rerender-split-combined-hooks`: Split hooks with independent dependencies.
- `rerender-move-effect-to-event`: Put interaction logic in event handlers instead of effects.
- `rerender-transitions`: Use `startTransition` for non-urgent state updates.
- `rerender-use-deferred-value`: Use `useDeferredValue` for expensive renders driven by fast input.
- `rerender-use-ref-transient-values`: Use refs for transient high-frequency values.
- `rerender-no-inline-components`: Do not define components inside components.

### 6. Rendering Performance

- `rendering-animate-svg-wrapper`: Animate a wrapper instead of complex SVG content.
- `rendering-content-visibility`: Use `content-visibility` for long offscreen sections where useful.
- `rendering-hoist-jsx`: Extract static JSX outside components when it reduces work.
- `rendering-svg-precision`: Reduce unnecessary SVG coordinate precision.
- `rendering-hydration-no-flicker`: Avoid hydration flicker for client-only data.
- `rendering-hydration-suppress-warning`: Suppress expected mismatches only when intentional.
- `rendering-activity`: Use show/hide primitives appropriately when available.
- `rendering-conditional-render`: Prefer explicit ternaries over `&&` for conditional rendering.
- `rendering-usetransition-loading`: Prefer `useTransition` for pending UI from non-urgent updates.
- `rendering-resource-hints`: Use resource hints when they have clear benefit.
- `rendering-script-defer-async`: Use deferred or async scripts for non-blocking loading.

### 7. JavaScript Performance

- `js-batch-dom-css`: Group DOM/CSS changes through classes or `cssText`.
- `js-index-maps`: Build `Map` indexes for repeated lookups.
- `js-cache-property-access`: Cache repeated object property access in hot loops.
- `js-cache-function-results`: Cache expensive function results when safe.
- `js-cache-storage`: Cache repeated localStorage/sessionStorage reads.
- `js-combine-iterations`: Combine multiple `filter`/`map` passes when worthwhile.
- `js-length-check-first`: Check array length before expensive comparisons.
- `js-early-exit`: Return early from functions.
- `js-hoist-regexp`: Hoist RegExp creation outside loops.
- `js-min-max-loop`: Use a loop for min/max instead of sorting.
- `js-set-map-lookups`: Use `Set` or `Map` for repeated O(1) lookups.
- `js-tosorted-immutable`: Use `toSorted()` for immutable sorting where supported.
- `js-flatmap-filter`: Use `flatMap` to map and filter in one pass when clear.
- `js-request-idle-callback`: Defer non-critical browser work to idle time when appropriate.

### 8. Advanced Patterns

- `advanced-effect-event-deps`: Do not put `useEffectEvent` results in effect dependencies.
- `advanced-event-handler-refs`: Store event handlers in refs only when the pattern is needed.
- `advanced-init-once`: Initialize app-wide resources once per app load.
- `advanced-use-latest`: Use a latest-ref pattern for stable callback refs when necessary.

## React Implementation Rules

- Prefer server components by default.
- Add `"use client"` only for interactive components that need browser APIs, state, effects, or event handlers.
- Do not pass large serialized objects into client components.
- Avoid unnecessary `useMemo` and `useCallback`; only use them when they solve a real render or identity issue.
- Prefer direct, readable code over premature abstraction.
- For independent async work, start promises together and await them with `Promise.all()`.
- For non-urgent UI updates, consider `startTransition`.
- For expensive UI driven by fast-changing input, consider `useDeferredValue`.

## API And Server Rules

- Validate input with Zod before writing to the database.
- Check authentication and authorization inside every protected server action or route handler.
- Return clear JSON responses for route handlers.
- Keep API response shape consistent with the project docs:

```json
{
  "success": true,
  "message": "Data berhasil diproses",
  "data": {}
}
```

For errors:

```json
{
  "success": false,
  "message": "Terjadi kesalahan",
  "errors": []
}
```

## Database Rules

- Use UUID primary keys.
- Use `createdAt` and `updatedAt` for persisted models.
- Use `isActive` and `deletedAt` for master data where soft-delete or deactivation is needed.
- Seed placeholder data early so features can be tested from the start.
- Admin accounts should come from seed/manual database setup, not public registration.

## UI Rules

- Keep the UI simple, responsive, and easy for santri/students to understand.
- Use Tailwind CSS and shadcn/ui components when available.
- Preserve accessibility basics: semantic elements, labels, focus states, and sufficient contrast.
- Admin screens should favor tables, filters, forms, and summary cards.
- Assessment UI should be straightforward, preferably step-based or a clear question list.
- Use `PRODUCT.md` and `DESIGN.md` before frontend edits.
- Use `public/logo.png` as the brand anchor on auth and shell surfaces.
- Match the logo's pesantren green as the primary UI color.
- Use OKLCH semantic tokens for new UI colors.
- Do not use gradient text, emoji icons, side-stripe accents, decorative glassmorphism, or identical icon-card grids.
- Keep touch targets at least 44px tall where possible.
- Use visible labels, inline errors, and loading states for forms.
- Use `active:scale-[0.96]` and specific transition properties for buttons.
- Use tabular numbers for scores, counts, percentages, and dashboard metrics.
- Use `text-wrap: balance` on headings and `text-wrap: pretty` on body copy.

## Prose Rules: Stop Slop

Use these rules for UI copy, README text, documentation, commit messages, PR descriptions, and user-facing explanations.

### Core Rules

1. Cut filler phrases. Remove throat-clearing openers, emphasis crutches, and adverbs.
2. Break formulaic structures. Avoid binary contrasts, negative listings, dramatic fragments, rhetorical setups, and false agency.
3. Use active voice. Give each sentence a human subject doing the action.
4. Be specific. Name the feature, user, route, model, error, or behavior instead of using vague claims.
5. Put the reader in the room. Use `you` when writing guidance for a user.
6. Vary rhythm. Mix short and medium sentences. Do not use em dashes.
7. Trust readers. State facts directly. Skip softening and hand-holding.
8. Cut quotables. Rewrite any sentence that sounds like a slogan.

### Quick Checks

- Remove adverbs.
- Replace passive voice with an actor and action.
- Do not let inanimate nouns perform human actions.
- Avoid sentences that start with `what`, `why`, `how`, or `here` as a rhetorical setup.
- Replace `not X, but Y` with a direct statement of Y.
- Break repeated sentence lengths.
- Remove em dashes.
- Replace vague claims with named details.
- Delete meta-joiners such as `the rest of this document`.

### Scoring

Before delivering polished prose, rate it from 1 to 10 on each dimension:

| Dimension | Question |
|---|---|
| Directness | Does the prose state facts instead of announcing them? |
| Rhythm | Does sentence length vary? |
| Trust | Does it respect the reader? |
| Authenticity | Does it sound human? |
| Density | Can you cut anything? |

Revise prose that scores below 35 out of 50.

## Verification

Before considering code complete, run the relevant checks when possible:

```bash
pnpm lint
pnpm build
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
```

Only run database migration or seed commands when `DATABASE_URL` is configured and the user expects database changes.
