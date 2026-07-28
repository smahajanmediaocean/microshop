# 🎓 Day 12 — Angular Micro-Frontends with Module Federation
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Micro-frontend architecture and Nx setup | ~2 hrs |
| Session 2 | Shell/remote configuration and routing | ~2 hrs |
| Session 3 | Shared state, communication, and deployment | ~2 hrs |
| Hands-On | Split MicroShop into shell + products/header remotes | ~2 hrs |

---

## 🔷 What We're Building Today

Today MicroShop becomes a micro-frontend architecture: a shell hosts independently built remotes for product and header experiences using Webpack Module Federation.

```text
Browser
  ↓
Shell app [host]
  ├── loads Header remote
  └── loads Products remote

Shared singletons
  Angular core
  RxJS
  Auth/session utilities
        
```

---

## 🔷 SESSION 1 — Micro-Frontend Architecture

---

### 1️⃣ Why micro-frontends

**The real-world mental model:**
> A mall host coordinates multiple independently run shops instead of one team owning every shelf in one giant superstore.

**Why it matters in MicroShop:** MicroShop could split product, header, admin, or checkout work across teams and release cadences.

Micro-frontends help when teams need independent deployment, technology evolution, or bounded ownership.
They also introduce real complexity, so they should solve an actual organisational problem.
                        

```typescript
export const mfeReasons = [
  'Independent team ownership',
  'Independent deployment pipelines',
  'Bounded feature complexity',
  'Shared shell experience with separate remotes'
];
                        
```

| Good reason | Weak reason |
|---|---|
| Separate teams and release cycles | Using MFEs just because it sounds modern |
| Need independent deployability | Small app with one team |
| Different feature ownership boundaries | Avoiding normal refactoring |

**MicroShop decision notes:**
- Micro-frontends are architecture for organisations as much as for code.
- Do not choose them if a clean modular monolith already solves the problem.
- Nx makes the setup more approachable for Angular teams.

---

### 2️⃣ Nx Module Federation generators

**The real-world mental model:**
> Nx can pre-wire the host mall and remote shops so you do not handcraft every electrical connection.

**Why it matters in MicroShop:** MicroShop can use Nx generators to bootstrap shell and remotes correctly.

Nx wraps Module Federation setup with Angular-friendly defaults.
Use generators before manual editing.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/angular:setup-mf shell --mfType=host
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/angular:setup-mf products-mfe --mfType=remote --port=4201
PS C:\\workspace\\Angular-app\\microshop-nx> nx g @nx/angular:setup-mf header-mfe --mfType=remote --port=4202
                        
```

| Project | Role |
|---|---|
| Shell | Host application |
| Products MFE | Remote feature app |
| Header MFE | Remote shared experience |

**MicroShop decision notes:**
- Keep port conventions written down for local development.
- Generated config is educational—read it after scaffolding.
- The host/remote distinction is easier once you see routing in action.

---

### 3️⃣ Shell + remote mental model

**The real-world mental model:**
> The shell is the mall entrance and layout; remotes are shops that can be renovated and redeployed separately.

**Why it matters in MicroShop:** MicroShop should know which concerns stay in shell versus remote apps.

Shell usually owns top-level routing, navigation chrome, and cross-cutting concerns.
Remotes own feature-specific screens and assets.
                        

```typescript
export const ownershipExample = {
  shell: ['root routing', 'global auth bootstrapping', 'layout shell'],
  productsRemote: ['catalog routes', 'product detail page', 'product-specific state'],
  headerRemote: ['header UI', 'search bar', 'cart badge UI']
};
                        
```

| Belongs in shell | Belongs in remote |
|---|---|
| Global route entry points | Feature pages |
| Shared auth/session bootstrap | Feature-specific widgets |
| App-wide layout | Remote-local assets |

**MicroShop decision notes:**
- Keep the shell thin; otherwise it becomes the new monolith.
- Shared libraries should carry reusable code, not every business decision.
- Ownership clarity is more important than fancy demos.

---

### 4️⃣ When not to use MFEs

**The real-world mental model:**
> Do not split one small neighborhood into three governments if one good town council is enough.

**Why it matters in MicroShop:** MicroShop teams should understand MFE cost before committing.

MFEs add deployment, shared-dependency, runtime-integration, and testing complexity.
Use them when the organisation benefits outweigh that cost.
                        

```typescript
export const mfeCautionFlags = [
  'One small team with one release cadence',
  'No need for independent deployment',
  'No clear feature ownership boundaries',
  'Shared runtime state too tangled to separate'
];
                        
```

| Signal | Interpretation |
|---|---|
| Tiny app | Probably stay modular monolith |
| Frequent cross-feature coupling | Remote boundaries may be painful |
| Team independence required | MFE may help |

**MicroShop decision notes:**
- Architecture choices should match organisational reality.
- MFEs are powerful, not free.
- The best answer for many apps is still a well-structured Nx monorepo without runtime federation.

---

## 🔷 SESSION 2 — Shell & Remote Configuration

---

### 1️⃣ Host and remote federation config files

**The real-world mental model:**
> Federation config is the shipping manifest telling the host which remote shops exist and what they expose.

**Why it matters in MicroShop:** MicroShop shell must know where to load the products remote from and which module entry point to consume.

Each project gets a `module-federation.config.ts`.
The remote exposes modules; the host lists remotes.
                        

```typescript
// apps/products-mfe/module-federation.config.ts
import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'products-mfe',
  exposes: {
    './Module': 'apps/products-mfe/src/app/remote-entry/entry.module.ts'
  }
};

export default config;
                        
```

| Config piece | Meaning |
|---|---|
| `name` | Remote application identity |
| `exposes` | Public modules available to host |
| Host `remotes` | Known remote names/locations |

**MicroShop decision notes:**
- Read generated files carefully; they teach runtime wiring.
- Expose the smallest stable surface you can.
- Treat remote entry contracts like public APIs.

---

### 2️⃣ Shell routing with `loadRemoteModule`

**The real-world mental model:**
> The shell router is the mall concierge that sends shoppers into the correct remote shop at runtime.

**Why it matters in MicroShop:** MicroShop host routes need to load remote pages lazily and only when requested.

The shell route record can call `loadRemoteModule` and then resolve the exposed Angular module or standalone route config.
                        

```typescript
const routes: Routes = [
  {
    path: 'products',
    loadChildren: [] =>
      loadRemoteModule['products-mfe', './Module'].then[[m] => m.RemoteEntryModule]
  }
];
                        
```

| Route action | Runtime result |
|---|---|
| User visits `/products` | Shell downloads remote entry if needed |
| Remote module resolves | Angular activates product routes |

**MicroShop decision notes:**
- This feels like route lazy loading, but the code comes from a different app build.
- Keep error handling in mind for unavailable remotes.
- Routing contracts between shell and remote should be documented.

---

### 3️⃣ Shared singleton dependencies

**The real-world mental model:**
> If each shop brings its own electricity standard, the mall catches fire. Shared singletons keep one compatible foundation.

**Why it matters in MicroShop:** MicroShop shell and remotes should not load multiple Angular runtimes or mismatched RxJS copies.

Module Federation commonly shares Angular packages and RxJS as singletons.
Version compatibility becomes an explicit concern.
                        

```typescript
// Conceptual shared dependencies
export const shared = {
  '@angular/core': { singleton: true, strictVersion: true },
  '@angular/common': { singleton: true, strictVersion: true },
  '@angular/router': { singleton: true, strictVersion: true },
  rxjs: { singleton: true, strictVersion: true }
};
                        
```

| Dependency | Why share as singleton |
|---|---|
| Angular core | One framework runtime |
| Angular router | Consistent navigation context |
| RxJS | Avoid duplicate reactive runtime copies |

**MicroShop decision notes:**
- Shared version drift is one of the key operational challenges in MFEs.
- Independent deployment still needs compatibility discipline.
- This is where platform teams add lots of value.

---

### 4️⃣ Dynamic remote loading from config

**The real-world mental model:**
> Instead of hardcoding shop addresses, the shell can read a mall directory board at startup.

**Why it matters in MicroShop:** MicroShop may eventually want environment-driven remote URLs.

Runtime configuration can decide which remote URL to load.
That supports different environments and safer rollout strategies.
                        

```typescript
export interface RemoteDefinition {
  name: string;
  entry: string;
}

@Injectable[{ providedIn: 'root' }]
export class RemoteConfigService {
  getRemotes[]: RemoteDefinition[] {
    return [
      { name: 'products-mfe', entry: 'http://localhost:4201/remoteEntry.js' },
      { name: 'header-mfe', entry: 'http://localhost:4202/remoteEntry.js' }
    ];
  }
}
                        
```

| Approach | Trade-off |
|---|---|
| Static config | Simple but less flexible |
| Dynamic config service | More flexible, slightly more moving parts |

**MicroShop decision notes:**
- Runtime config is useful when environments differ significantly.
- Treat remote URLs as operational config, not random literals scattered in code.
- This also helps staged rollouts.

---

## 🔷 SESSION 3 — Shared State & Communication

---

### 1️⃣ Sharing NgRx state across MFEs

**The real-world mental model:**
> The host mall can maintain a shared loyalty ledger while each shop reads or updates the relevant parts.

**Why it matters in MicroShop:** Cart count, auth state, and maybe wishlist need a consistent user experience across MicroShop remotes.

One common strategy is to keep shared business state in the shell and expose facades or shared singleton libraries.
Remotes should not each invent their own cart truth.
                        

```typescript
export const sharedStateCandidates = [
  'auth session',
  'cart summary',
  'current user preferences'
];

export const remoteLocalStateCandidates = [
  'product filter panel UI',
  'catalog pagination within remote'
];
                        
```

| State type | Best home |
|---|---|
| Global cross-remote state | Shell/shared singleton |
| Feature-local transient state | Remote-local state |

**MicroShop decision notes:**
- Shared state should be minimal and intentional.
- Too much shared runtime state makes remote independence fake.
- Facades are helpful boundaries here.

---

### 2️⃣ Event bus communication

**The real-world mental model:**
> An event bus is the mall announcement system: shops can announce events without directly calling each other.

**Why it matters in MicroShop:** MicroShop header remote may need to react when products remote adds an item to cart.

Use a shared singleton service with an RxJS `Subject` for simple cross-remote events.
Keep the contract tiny and documented.
                        

```typescript
@Injectable[{ providedIn: 'root' }]
export class MfeEventBusService {
  private readonly eventsSubject = new Subject<{ type: string; payload?: unknown }>[];
  readonly events$ = this.eventsSubject.asObservable[];

  emit[type: string, payload?: unknown]: void {
    this.eventsSubject.next[{ type, payload }];
  }
}
                        
```

| Event example | Consumer |
|---|---|
| `cart:itemAdded` | Header badge remote |
| `auth:loggedOut` | All remotes clear sensitive UI |

**MicroShop decision notes:**
- Do not let the event bus become a dumping ground for every interaction.
- Prefer shared state or explicit APIs where possible; use events for decoupled notifications.
- Document event names like public contracts.

---

### 3️⃣ Auth, versioning, and deployment compatibility

**The real-world mental model:**
> All shops should recognise the same staff badge and safety standards before opening.

**Why it matters in MicroShop:** MicroShop MFEs need consistent JWT handling and compatible shared dependency versions.

A simple shared auth rule is to read the same token source, often `localStorage` or a shell-owned auth facade.
Compatibility strategy matters because remotes may deploy independently.
                        

```typescript
export class AuthTokenService {
  getToken[]: string | null {
    return localStorage.getItem['microshop-token'];
  }
}

export interface RemoteCompatibility {
  angularVersion: string;
  apiContractVersion: string;
}
                        
```

| Concern | Rule of thumb |
|---|---|
| JWT storage | One shared convention |
| Shared Angular version | Keep aligned for singleton safety |
| API contract version | Version or test carefully |

**MicroShop decision notes:**
- Independent deployment does not remove the need for compatibility governance.
- Platform documentation matters a lot in MFE ecosystems.
- Auth should be boring and shared, not reinvented per remote.

---

### 4️⃣ Testing and deployment shape

**The real-world mental model:**
> Each shop must pass its own inspection, and the mall must also pass a combined opening inspection.

**Why it matters in MicroShop:** MicroShop MFEs need both isolated and integrated test strategies plus separate hosting/runtime configs.

Test remotes in isolation for speed and in host integration for confidence.
Deployment often means separate static hosts or Nginx configs per app.
                        

```typescript
export const mfeTestingStrategy = {
  isolated: ['remote unit tests', 'remote visual tests'],
  integrated: ['host route loads remote', 'cross-remote cart badge updates'],
  deployment: ['separate build artifacts', 'separate web server configs']
};
                        
```

| Layer | Example |
|---|---|
| Remote-only | Products remote route renders |
| Host integration | Shell loads remote module |
| End-to-end | User adds item and sees header update across remotes |

**MicroShop decision notes:**
- MFEs expand your testing matrix, so keep contracts tight.
- Deployment automation quality becomes crucial.
- Start simple before pursuing highly dynamic remote orchestration.

---

## 🏗️ Day 12 Hands-On

- Use Nx generators to set up `shell`, `products-mfe`, and `header-mfe` for Module Federation.
- Inspect generated `module-federation.config.ts` files.
- Expose a product remote entry module and load it from shell routing.
- Create a shared UI/data library for product cards and models.
- Choose which state stays in shell versus inside remotes.
- Build a small shared event bus example for cart badge updates.
- Write down remote URLs/ports and a simple compatibility policy.
