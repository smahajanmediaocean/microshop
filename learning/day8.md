# 🎓 Day 8 — Standalone Components, New Bootstrap & Angular Signals
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Standalone components, directives, and pipes | ~2 hrs |
| Session 2 | bootstrapApplication and provider-based setup | ~2 hrs |
| Session 3 | Signals, computed, effect, and RxJS bridges | ~2 hrs |
| Hands-On | Convert ProductCard and try signal-based cart count | ~2 hrs |

---

## 🔷 What We're Building Today

Angular has evolved beyond mandatory NgModules. Today we explore standalone components and the new provider-first bootstrap model, then compare signals with RxJS for local and app state.

```text
Old style
  AppModule → declarations/imports/providers/bootstrap

New style
  main.ts → bootstrapApplication[AppComponent, {
    providers: [provideRouter[...], provideHttpClient[...]]
  }]

State options
  RxJS streams ↔ signals ↔ NgRx store
        
```

---

## 🔷 SESSION 1 — Standalone Components

---

### 1️⃣ What standalone means

**The real-world mental model:**
> A standalone component is a self-sufficient shop kiosk that carries its own permits instead of depending on a central module registry.

**Why it matters in MicroShop:** MicroShop can adopt new Angular features incrementally without deleting all existing modules at once.

Standalone components declare `standalone: true` and list their own imports.
They can coexist with NgModule-based code during migration.
                        

```typescript
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component[{
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <article class="product-card">
      <img [src]="product.imageUrl" [alt]="product.title" />
      <h3>{{ product.title }}</h3>
      <strong>{{ product.price | currency:'INR' }}</strong>
      <button type="button" [click]="add.emit[product]">Add to cart</button>
    </article>
  `
}]
export class ProductCardComponent {
  @Input[{ required: true }] product!: Product;
  @Output[] add = new EventEmitter<Product>[];
}
                        
```

| Standalone benefit | Why it helps |
|---|---|
| Local imports | Component dependencies stay explicit |
| Less NgModule ceremony | Fewer indirection layers |
| Easy lazy loading | Route APIs become simpler |
| Incremental adoption | Works with old modules too |

**MicroShop decision notes:**
- Standalone is not anti-architecture; it simply moves configuration closer to usage.
- Large teams still need folder conventions and boundaries.
- You can migrate one component at a time.

---

### 2️⃣ Converting a module-based component

**The real-world mental model:**
> Migration is moving a shop out of the shared terminal into its own modular kiosk without shutting the mall down.

**Why it matters in MicroShop:** MicroShop can trial standalone on reusable pieces like `ProductCardComponent` before touching root bootstrap.

The mechanical conversion is simple: mark standalone, move template dependencies into `imports`, and update the parent that consumes it.
                        

```typescript
// Before
@NgModule[{
  declarations: [ProductCardComponent],
  imports: [CommonModule],
  exports: [ProductCardComponent]
}]
export class SharedModule {}

// After: ProductCardComponent becomes standalone
@Component[{
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <app-product-card
      *ngFor="let product of products"
      [product]="product"
      [add]="addToCart.emit[$event]">
    </app-product-card>
  `
}]
export class ProductGridComponent {
  @Input[] products: Product[] = [];
  @Output[] addToCart = new EventEmitter<Product>[];
}
                        
```

| Migration step | Checklist |
|---|---|
| Mark standalone | Add `standalone: true` |
| Move imports | Bring in `CommonModule`, pipes, child components |
| Update consumers | Import component where used |
| Remove obsolete declarations | Avoid double declaration errors |

**MicroShop decision notes:**
- A standalone component cannot also stay declared in an NgModule.
- Use small leaf components first to keep migration low-risk.
- This is a clean stepping stone toward standalone routing and bootstrap.

---

### 3️⃣ Standalone directives and pipes

**The real-world mental model:**
> Standalone is not only for components; your reusable behavior and formatting kiosks can also be independent.

**Why it matters in MicroShop:** MicroShop's `HighlightDirective` and `TruncatePipe` can be imported directly without a shared module wrapper.

This removes a lot of packaging ceremony for small reusable pieces.
It also makes local dependencies very visible inside standalone components.
                        

```typescript
@Pipe[{
  name: 'truncate',
  standalone: true
}]
export class TruncatePipe implements PipeTransform {
  transform[value: string, limit = 60]: string {
    return value.length > limit ? `${value.slice[0, limit]}...` : value;
  }
}

@Directive[{
  selector: '[appHighlight]',
  standalone: true
}]
export class HighlightDirective {}
                        
```

| Artifact | Imported directly into |
|---|---|
| Standalone pipe | Standalone component `imports` |
| Standalone directive | Standalone component `imports` |
| Standalone component | Router or parent component |

**MicroShop decision notes:**
- This makes tree-shakable local dependencies more obvious.
- Shared modules are still allowed; standalone just gives you another option.
- For teams, choose one pattern and document it.

---

### 4️⃣ Mixing standalone and NgModule apps safely

**The real-world mental model:**
> Old terminals and new kiosks can coexist in the same mall while the renovation happens.

**Why it matters in MicroShop:** Real MicroShop codebases rarely rewrite everything in one sprint.

You can import standalone components into NgModules, and routes can lazy-load standalone components directly.
That makes hybrid architecture a normal migration path.
                        

```typescript
@NgModule[{
  imports: [CommonModule, ProductCardComponent],
  declarations: [ProductListComponent]
}]
export class ProductsModule {}

const routes: Routes = [
  {
    path: 'wishlist',
    loadComponent: [] =>
      import['./features/wishlist/wishlist-page.component'].then[[m] => m.WishlistPageComponent]
  }
];
                        
```

| Scenario | Valid? |
|---|---|
| NgModule imports standalone component | Yes |
| Standalone component imports NgModule | Yes |
| Component declared in NgModule and standalone at same time | No |
| Route lazy-loads standalone component | Yes |

**MicroShop decision notes:**
- Hybrid migration is the practical path in enterprise Angular apps.
- Avoid mixing patterns randomly within one small feature unless the migration goal is clear.
- Document which features are already standalone-enabled.

---

## 🔷 SESSION 2 — New Application Bootstrap

---

### 1️⃣ From AppModule to `bootstrapApplication[]`

**The real-world mental model:**
> Instead of filing one giant opening permit, the new bootstrap model registers services directly at the entrance desk.

**Why it matters in MicroShop:** Modern MicroShop projects can reduce root-module ceremony and align more naturally with standalone architecture.

`bootstrapApplication[]` replaces `platformBrowserDynamic[].bootstrapModule[AppModule]` for standalone-first apps.
Providers are listed directly in `main.ts` or related config files.
                        

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

bootstrapApplication[AppComponent, {
  providers: [
    provideRouter[routes],
    provideHttpClient[withInterceptors[[authInterceptor]]]
  ]
}].catch[[err] => console.error[err]];
                        
```

| Old root setup | New root setup |
|---|---|
| `AppModule` imports/providers/bootstrap | `bootstrapApplication[]` providers |
| `RouterModule.forRoot` | `provideRouter[]` |
| `HttpClientModule` | `provideHttpClient[]` |

**MicroShop decision notes:**
- The new bootstrap style is especially clean for fresh Angular 17+ projects.
- You can keep modules if your app benefits from them; this is not a forced rewrite.
- Provider functions make root configuration more composable.

---

### 2️⃣ Provider-first router, HTTP, and NgRx setup

**The real-world mental model:**
> The new bootstrap API is like building your mall utilities from provider Lego bricks.

**Why it matters in MicroShop:** MicroShop still needs routing, HTTP, and store even if AppModule disappears.

Most major Angular subsystems now offer provider APIs.
That makes root configuration flatter and easier to read.
                        

```typescript
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

bootstrapApplication[AppComponent, {
  providers: [
    provideRouter[routes],
    provideHttpClient[],
    provideStore[{ cart: cartReducer, wishlist: wishlistReducer }],
    provideEffects[[CartEffects, WishlistEffects]],
    provideStoreDevtools[{ maxAge: 25 }]
  ]
}];
                        
```

| Provider API | Replaces |
|---|---|
| `provideRouter[]` | `RouterModule.forRoot[]` |
| `provideHttpClient[]` | `HttpClientModule` |
| `provideStore[]` | `StoreModule.forRoot[]` |
| `provideEffects[]` | `EffectsModule.forRoot[]` |

**MicroShop decision notes:**
- This is the mental bridge between old modules and new provider APIs.
- Provider composition is especially nice for testing and environment-specific setup.
- Keep root setup in a small number of obvious files.

---

### 3️⃣ Environment injectors and route-level providers

**The real-world mental model:**
> Environment injectors are local service desks you can attach to specific route areas.

**Why it matters in MicroShop:** MicroShop may want route-level providers for admin tools or experimental features without polluting the whole app injector.

Standalone routing allows providers directly on route records.
That gives you feature-local DI boundaries without needing module providers.
                        

```typescript
export const routes: Routes = [
  {
    path: 'admin',
    providers: [AdminAuditService],
    loadComponent: [] =>
      import['./features/admin/admin-page.component'].then[[m] => m.AdminPageComponent]
  },
  {
    path: 'products',
    loadChildren: [] =>
      import['./features/products/products.routes'].then[[m] => m.PRODUCTS_ROUTES]
  }
];
                        
```

| Provider scope | Use case |
|---|---|
| Root | Auth, global config, store |
| Route | Feature-local services |
| Component | Per-instance isolated state |

**MicroShop decision notes:**
- This is the standalone-era equivalent of many module provider use cases.
- Prefer the smallest provider scope that matches the requirement.
- Do not route-scope truly global services.

---

### 4️⃣ Old vs new bootstrap decision guide

**The real-world mental model:**
> Both roads lead to a working store; choose the road that fits your renovation stage.

**Why it matters in MicroShop:** MicroShop teams need a pragmatic rule for when to keep modules and when to embrace standalone bootstrap.

Module-based apps are still valid.
Standalone-first bootstrap shines most in new apps and in codebases already migrating components to standalone.
                        

```typescript
export const bootstrapDecisionGuide = {
  keepAppModule: [
    'Large legacy app with many module conventions',
    'Team already productive with existing module boundaries'
  ],
  preferStandaloneBootstrap: [
    'New Angular 17+ project',
    'Incremental migration toward standalone routes/components',
    'Desire for flatter root configuration'
  ]
};
                        
```

| Question | Lean toward |
|---|---|
| Starting fresh? | Standalone bootstrap |
| Huge legacy app with stable modules? | Keep modules for now |
| Already using standalone routes/components? | Standalone bootstrap |
| Need minimal migration risk? | Hybrid / gradual approach |

**MicroShop decision notes:**
- Architectural consistency matters more than blindly following trends.
- Angular is intentionally supporting both styles during the ecosystem transition.
- Pick a documented path and stick to it feature by feature.

---

## 🔷 SESSION 3 — Signals

---

### 1️⃣ Signal basics: `signal[]`, `computed[]`, `effect[]`

**The real-world mental model:**
> Signals are reactive cells; when one cell changes, dependent cells and effects know exactly what to refresh.

**Why it matters in MicroShop:** MicroShop can use signals for local UI state like cart badge experiments, filter panels, or mini dashboards.

Signals are synchronous, pull-friendly reactive primitives built into Angular.
They are especially ergonomic for local state.
                        

```typescript
import { Component, computed, effect, signal } from '@angular/core';

@Component[{
  selector: 'app-signal-counter',
  template: `
    <p>Count: {{ count[] }}</p>
    <p>Doubled: {{ doubled[] }}</p>
    <button type="button" [click]="increment[]">Increment</button>
  `
}]
export class SignalCounterComponent {
  count = signal[0];
  doubled = computed[[] => this.count[] * 2];

  constructor[] {
    effect[[] => console.log['Count changed:', this.count[]]];
  }

  increment[]: void {
    this.count.update[[value] => value + 1];
  }
}
                        
```

| API | Closest React concept |
|---|---|
| `signal[]` | `useState` |
| `computed[]` | `useMemo` |
| `effect[]` | `useEffect` |

**MicroShop decision notes:**
- Signals are read by calling them like functions: `count[]`.
- They are synchronous and do not replace every RxJS use case.
- For local component state, they can be simpler than subjects.

---

### 2️⃣ Converting `BehaviorSubject` style local state to signals

**The real-world mental model:**
> This is swapping a tiny local broadcast radio for a direct reactive control panel.

**Why it matters in MicroShop:** MicroShop's local cart drawer open state or product filter panel state does not need full NgRx overhead.

Signals are great when state is local or tightly scoped.
You do not need an observable stream just to toggle a panel.
                        

```typescript
@Injectable[{ providedIn: 'root' }]
export class CartDrawerUiService {
  readonly isOpen = signal[false];

  open[]: void {
    this.isOpen.set[true];
  }

  close[]: void {
    this.isOpen.set[false];
  }

  toggle[]: void {
    this.isOpen.update[[value] => !value];
  }
}
                        
```

| Use signals for | Use RxJS/NgRx for |
|---|---|
| Local UI toggles | Complex async workflows |
| Synchronous derived state | Streams from WebSocket/HTTP |
| Simple shared UI state | Global audited business state |

**MicroShop decision notes:**
- Signals are not a religion; use the simplest tool that fits.
- NgRx still shines for event history, effects, and large shared business state.
- A signal-based service can coexist with NgRx perfectly well.

---

### 3️⃣ Bridging signals and observables

**The real-world mental model:**
> The bridge lets trains from the RxJS city and cars from the signals city cross safely.

**Why it matters in MicroShop:** MicroShop already has selectors and HTTP observables, so migration needs interop instead of a rewrite.

Angular provides helpers like `toSignal[]` and `toObservable[]`.
That makes hybrid reactive architecture practical.
                        

```typescript
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

export class ProductSearchComponent {
  searchTerm = signal[''];
  searchTerm$ = toObservable[this.searchTerm];

  products$ = this.productFacade.products$;
  products = toSignal[this.products$, { initialValue: [] as Product[] }];

  constructor[private productFacade: ProductFacadeService] {}
}
                        
```

| Bridge helper | Direction |
|---|---|
| `toSignal[observable$]` | Observable → Signal |
| `toObservable[signal]` | Signal → Observable |

**MicroShop decision notes:**
- Interop is the realistic enterprise path.
- Use initial values thoughtfully when converting asynchronous streams to signals.
- Do not convert back and forth excessively without a reason.

---

### 4️⃣ Signals vs RxJS decision table

**The real-world mental model:**
> Pick the vehicle that matches the road: scooter for local errands, freight train for logistics.

**Why it matters in MicroShop:** MicroShop will likely use both signals and RxJS, so developers need a clear selection heuristic.

Signals are excellent for local synchronous reactive state.
RxJS remains stronger for async streams, cancellation, multicasting, and rich operator pipelines.
                        

```typescript
export const reactiveChoiceGuide = {
  signals: ['component-local UI state', 'simple derived values', 'small shared UI services'],
  rxjs: ['HTTP streams', 'WebSocket streams', 'debounced search', 'effects and cancellation'],
  ngrx: ['global business state', 'auditable state transitions', 'time-travel debugging']
};
                        
```

| Need | Prefer |
|---|---|
| Local toggle/count/filter | Signal |
| Debounced search with cancellation | RxJS |
| Global cart/wishlist/order state | NgRx |
| Bridge between global stream and local component | Interop helpers |

**MicroShop decision notes:**
- Angular's modern story is additive, not replacement-only.
- Choose clarity over novelty.
- The best architecture often combines these tools deliberately.

---

## 🏗️ Day 8 Hands-On

- Convert `ProductCardComponent` into a standalone component.
- Optionally convert `ProductGridComponent` and `TruncatePipe` to standalone too.
- Import standalone components into your existing NgModule-based feature.
- Create a small `CartDrawerUiService` that uses a signal instead of a `BehaviorSubject`.
- Build a tiny demo component that uses `signal`, `computed`, and `effect`.
- Use `toSignal[]` on one selector or HTTP observable and render it in a component.
- Sketch whether MicroShop should stay hybrid or move toward standalone bootstrap later.
