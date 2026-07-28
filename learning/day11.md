# 🎓 Day 11 — Nx Monorepo — Organising Enterprise Angular Projects
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Why Nx and workspace creation | ~2 hrs |
| Session 2 | Library architecture and boundaries | ~2 hrs |
| Session 3 | Nx commands, caching, and tooling | ~2 hrs |
| Hands-On | Plan MicroShop migration into apps and libs | ~2 hrs |

---

## 🔷 What We're Building Today

As MicroShop grows, one Angular app folder becomes hard to scale. Nx introduces multiple apps, shared libraries, dependency boundaries, and faster affected builds.

```text
Single app today
  microshop/
    src/app/everything

Nx target shape
  apps/
    shell/
    products-mfe/
  libs/
    shared/ui-components/
    shared/data-models/
    shared/services/
        
```

---

## 🔷 SESSION 1 — Why Nx

---

### 1️⃣ Scaling problems of one Angular app

**The real-world mental model:**
> A single stockroom works for one shop, but becomes chaotic when several departments and teams share it without boundaries.

**Why it matters in MicroShop:** MicroShop is heading toward products, checkout, header, maybe admin, and eventually MFEs—so structure matters.

As apps grow, build times, ownership confusion, and accidental imports increase.
Nx gives you workspace structure and graph-aware tooling to manage that complexity.
                        

```typescript
export const singleAppPainPoints = [
  'Everything under one src/app tree',
  'Reusable code copied instead of shared',
  'Slow builds and tests after small changes',
  'Unclear boundaries between features and utilities'
];
                        
```

| Problem | Nx answer |
|---|---|
| One giant project | Multiple apps and libs |
| Hard reuse | Shared libraries |
| Slow whole-workspace tasks | Affected commands + caching |
| Import spaghetti | Module boundary rules |

**MicroShop decision notes:**
- Nx is more about scalable workspace architecture than just speed.
- Even teams that never build MFEs benefit from clean libs.
- The mental shift is from app-first to workspace-first.

---

### 2️⃣ Creating an Nx workspace

**The real-world mental model:**
> This is rebuilding the mall with separate store units and a central operations dashboard.

**Why it matters in MicroShop:** MicroShop can evolve into shell + remotes + shared libraries more safely inside an Nx workspace.

Nx can scaffold the workspace and Angular apps quickly.
The graph and generated conventions save a lot of setup time later.
                        

```typescript
PS C:\\workspace\\Angular-app> npx create-nx-workspace@latest microshop-nx
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/angular:app shell
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/angular:app products-mfe
PS C:\\workspace\\Angular-app\\microshop-nx> nx graph
                        
```

| Command | Purpose |
|---|---|
| `create-nx-workspace` | Create the monorepo shell |
| `nx g @nx/angular:app shell` | Host application |
| `nx g @nx/angular:app products-mfe` | Remote or separate product app |
| `nx graph` | Visualise dependencies |

**MicroShop decision notes:**
- Keep the original MicroShop app as a reference during migration.
- Nx generators provide strong defaults; use them before handcrafting folders.
- The project graph is one of the best teaching tools for architecture reviews.

---

### 3️⃣ Understanding the project graph

**The real-world mental model:**
> The project graph is the mall electrical blueprint showing which shops depend on which utilities.

**Why it matters in MicroShop:** MicroShop teams should be able to spot forbidden coupling or unnecessary dependency chains quickly.

Nx graph reveals imports and project relationships visually.
This makes architecture review more concrete than folder names alone.
                        

```typescript
// Example intended dependency flow
// shell app -> feature libs -> data-access libs -> util libs
// shell app -> shared ui libs
// products-mfe -> shared ui libs + data-access libs

export const nxDependencyRules = [
  'Apps can depend on libs',
  'Feature libs can depend on ui/data-access/util libs',
  'UI libs should not depend on feature libs'
];
                        
```

| Dependency smell | Why it is risky |
|---|---|
| UI lib imports app code | Reusability breaks |
| Shared util imports feature state | Wrong layering |
| Circular lib dependencies | Build and maintenance pain |

**MicroShop decision notes:**
- The graph is architecture documentation generated from reality.
- Review it after major workspace changes.
- Good dependency direction is more important than pretty folder names.

---

### 4️⃣ Planning MicroShop workspace apps

**The real-world mental model:**
> Before moving shelves, decide which store units exist and which stock belongs to each one.

**Why it matters in MicroShop:** A clean migration plan prevents random library creation in MicroShop Nx.

Start by identifying apps versus libraries.
Apps are deployable entry points; libraries contain reusable code or feature slices.
                        

```typescript
export const microshopNxPlan = {
  apps: ['shell', 'products-mfe', 'header-mfe'],
  libs: [
    'shared/ui-components',
    'shared/data-models',
    'shared/services',
    'products/feature-catalog',
    'products/data-access'
  ]
};
                        
```

| Project type | MicroShop example |
|---|---|
| App | Shell storefront |
| Feature lib | Catalog smart components |
| UI lib | Product card, buttons, badges |
| Data-access lib | Product API + store |
| Util/data-models lib | Interfaces and pure helpers |

**MicroShop decision notes:**
- Name libraries by responsibility, not by random team nicknames.
- A little planning here saves lots of reshuffling later.
- This structure sets up Day 12 micro-frontends cleanly.

---

## 🔷 SESSION 2 — Library Architecture

---

### 1️⃣ Creating shared libraries

**The real-world mental model:**
> Libraries are standardized warehouse shelves shared across multiple shops.

**Why it matters in MicroShop:** MicroShop UI pieces, models, and services should not be copied between shell and product apps.

Nx libraries create explicit packaging and import paths.
This improves discoverability and long-term maintenance.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/angular:lib shared/ui-components
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/angular:lib shared/data-models
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/angular:lib shared/services
                        
```

| Library | Typical contents |
|---|---|
| `shared/ui-components` | Buttons, cards, badges, layout components |
| `shared/data-models` | Product, cart, order interfaces |
| `shared/services` | Cross-app utilities/facades if truly shared |

**MicroShop decision notes:**
- Prefer many clear small libs over one giant `shared` junk drawer.
- Still keep boundaries meaningful; too many micro-libs can also hurt ergonomics.
- UI libs should remain presentational.

---

### 2️⃣ Feature, UI, data-access, and util library types

**The real-world mental model:**
> Different warehouse shelves serve different jobs: display shelves, supplier desks, and bookkeeping cabinets.

**Why it matters in MicroShop:** MicroShop architecture becomes far more predictable when every library category has a clear purpose.

This classification is one of the most useful Nx habits.
It helps reviewers instantly spot mis-layered code.
                        

```typescript
export const libraryTypes = {
  feature: 'Smart components, routes, orchestration',
  ui: 'Dumb presentational components',
  dataAccess: 'Repositories, store, API calls',
  util: 'Pure helpers and shared functions'
};
                        
```

| Type | MicroShop example |
|---|---|
| Feature | `products/feature-catalog` |
| UI | `shared/ui-components` product card |
| Data-access | `products/data-access` reducers + services |
| Util | `shared/util-formatting` money/date helpers |

**MicroShop decision notes:**
- If a UI lib imports store, it is probably no longer just UI.
- Feature libs can depend downward; util libs should stay low-level.
- This mirrors the smart/dumb and facade ideas from earlier days.

---

### 3️⃣ Import paths and tsconfig aliases

**The real-world mental model:**
> Workspace aliases are labeled delivery lanes; nobody should drag boxes through confusing relative corridors.

**Why it matters in MicroShop:** MicroShop developers should import shared code clearly across apps and libs.

Nx configures path aliases automatically.
That makes imports cleaner and more stable during moves.
                        

```typescript
import { Product } from '@microshop-nx/shared/data-models';
import { ProductCardComponent } from '@microshop-nx/shared/ui-components';
import { ProductFacadeService } from '@microshop-nx/products/data-access';
                        
```

| Import style | Preferred? |
|---|---|
| Workspace alias | Yes |
| Long relative `../../../../` paths | Avoid when crossing projects |

**MicroShop decision notes:**
- Aliases make code reviews much easier to read.
- They also reinforce project boundaries visually.
- Avoid deep relative imports across Nx projects.

---

### 4️⃣ Enforcing boundaries with ESLint

**The real-world mental model:**
> Boundary rules are security gates preventing one store from entering another store's restricted stockroom.

**Why it matters in MicroShop:** MicroShop should prevent accidental imports from app code into shared libraries.

Nx provides the `@nx/enforce-module-boundaries` rule.
This turns architecture intentions into automated checks.
                        

```typescript
// Example constraint idea
// ui libs -> can depend on util/data-models only
// feature libs -> can depend on ui, util, data-access
// apps -> can depend on any lib, but libs cannot depend on apps

export const boundaryGoals = [
  'No app imports inside libraries',
  'No feature-to-feature circular dependency',
  'UI stays presentational'
];
                        
```

| Rule | Benefit |
|---|---|
| App code cannot leak into libs | Reuse stays possible |
| Tagged libs enforce allowed directions | Architecture scales |
| Circular imports blocked | Fewer runtime/build surprises |

**MicroShop decision notes:**
- Automated architecture checks are one of Nx's best enterprise features.
- Document tags and boundary rules so developers understand the why.
- A rule only helps if the team buys into the library taxonomy.

---

## 🔷 SESSION 3 — Nx Commands & Caching

---

### 1️⃣ Serving, testing, and building specific projects

**The real-world mental model:**
> Nx lets you operate one shop without shutting down the whole mall.

**Why it matters in MicroShop:** MicroShop teams should run only the app or library tasks they need.

Per-project commands are a huge workflow improvement.
You stop thinking of the workspace as one giant indivisible build.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop-nx> nx serve shell
PS C:\\workspace\\Angular-app\\microshop-nx> nx test products-mfe
PS C:\\workspace\\Angular-app\\microshop-nx> nx build shell --configuration=production
                        
```

| Command | Meaning |
|---|---|
| `nx serve shell` | Run only shell app |
| `nx test products-mfe` | Test only that project |
| `nx build shell` | Build one deployable app |

**MicroShop decision notes:**
- Project-scoped commands are especially useful once the workspace has multiple apps.
- Developers gain faster feedback by avoiding unrelated work.
- This sets the stage for affected commands.

---

### 2️⃣ Affected commands and computation caching

**The real-world mental model:**
> Affected commands ask which shops actually changed; caching reuses yesterday's approved inspection when nothing relevant moved.

**Why it matters in MicroShop:** MicroShop CI should avoid rerunning every test and build after every tiny doc or style change.

Nx uses project graphs and file changes to determine what needs work.
Caching can make repeated commands dramatically faster.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop-nx> nx affected:test
PS C:\\workspace\\Angular-app\\microshop-nx> nx affected:build
PS C:\\workspace\\Angular-app\\microshop-nx> nx run-many --target=test --projects=shell,products-mfe --parallel=2
                        
```

| Feature | Benefit |
|---|---|
| Affected graph | Run only impacted projects |
| Local cache | Reuse past task outputs |
| Nx Cloud | Share cache across CI and team |

**MicroShop decision notes:**
- Affected commands shine when your dependency graph is clean.
- Bad boundaries reduce the accuracy of affected calculations.
- Caching is a workflow multiplier, not just a benchmark trick.

---

### 3️⃣ Storybook and project configuration files

**The real-world mental model:**
> Each store unit can keep its own operation sheet instead of relying on one giant building manual.

**Why it matters in MicroShop:** MicroShop UI libraries benefit from isolated visual development and per-project config.

Nx often uses `project.json` files alongside generators for Storybook and other tooling.
This keeps configuration close to the project.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/storybook:configuration shared-ui-components

// Common config files
// apps/shell/project.json
// libs/shared/ui-components/project.json
// nx.json
// tsconfig.base.json
                        
```

| File | Role |
|---|---|
| `project.json` | Per-project targets/options |
| `nx.json` | Workspace-wide Nx settings |
| `tsconfig.base.json` | Path aliases/shared TS config |
| Storybook config | UI component sandbox/testing |

**MicroShop decision notes:**
- Storybook pairs especially well with dumb UI libraries.
- Project-local config improves discoverability over one giant `angular.json`.
- This style feels natural once the workspace grows.

---

### 4️⃣ MicroShop migration strategy into Nx

**The real-world mental model:**
> Do not move the whole warehouse in one night; migrate aisle by aisle with labels intact.

**Why it matters in MicroShop:** A careful plan reduces risk while introducing Nx benefits.

Start with models and presentational UI, then move data-access and feature orchestration.
Keep the old app running until the new workspace proves itself.
                        

```typescript
export const migrationOrder = [
  'shared data models',
  'shared UI components',
  'product data-access logic',
  'product feature pages',
  'shell app routing and composition'
];
                        
```

| Migration phase | Why first/last |
|---|---|
| Models/UI first | Low-risk reusable foundation |
| Data-access next | Shared logic becomes portable |
| Feature pages next | More moving parts but clearer boundaries |
| Shell composition last | Depends on everything else |

**MicroShop decision notes:**
- Incremental migration preserves delivery velocity.
- Nx should reduce chaos, not create it.
- This migration groundwork makes Module Federation much easier tomorrow.

---

## 🏗️ Day 11 Hands-On

- Sketch the target Nx workspace for MicroShop: apps, feature libs, UI libs, and data-access libs.
- Run `create-nx-workspace` in a sibling folder for experimentation.
- Generate `shell` and `products-mfe` Angular apps.
- Generate `shared/ui-components`, `shared/data-models`, and `shared/services` libraries.
- Move or copy one MicroShop component conceptually into the right library bucket.
- Inspect the Nx project graph and note any dependency rule you want to enforce.
- List which tasks would benefit most from `nx affected:*` in CI.
