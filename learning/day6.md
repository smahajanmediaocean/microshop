# 🎓 Day 6 — Smart/Dumb Components, OnPush & Advanced Architecture
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Smart vs Dumb component pattern | ~2 hrs |
| Session 2 | OnPush change detection | ~2 hrs |
| Session 3 | Facade, repository, feature state, entity patterns | ~2 hrs |
| Hands-On | Split ProductListPage and add ProductFacade | ~2 hrs |

---

## 🔷 What We're Building Today

Now that NgRx exists, we can separate orchestration from presentation. MicroShop will get container components, pure reusable components, and faster rendering with `OnPush`.

```text
Before
  ProductListComponent
    fetches data
    talks to store
    formats state
    renders cards

After
  ProductListPageComponent [smart]
      ↓ inputs
  ProductGridComponent [dumb]
      ↓ inputs
  ProductCardComponent [dumb]
      ↑ outputs
  ProductListPageComponent dispatches actions
        
```

---

## 🔷 SESSION 1 — Smart vs Dumb Component Pattern

---

### 1️⃣ What makes a component smart?

**The real-world mental model:**
> A smart component is the floor manager: it knows where data comes from, which actions to dispatch, and how screens coordinate.

**Why it matters in MicroShop:** MicroShop pages like product listing, cart, and checkout coordinate route params, filters, and store state.

Smart components usually live at page level.
They inject services or store, subscribe through selectors, and pass plain inputs down to presentational children.
                        

```typescript
@Component[{
  selector: 'app-product-list-page',
  template: `
    <app-product-grid
      [products]="products$ | async"
      [loading]="loading$ | async"
      [addToCart]="addToCart[$event]"
      [selectProduct]="openProduct[$event]">
    </app-product-grid>
  `
}]
export class ProductListPageComponent {
  products$ = this.productFacade.products$;
  loading$ = this.productFacade.loading$;

  constructor[private productFacade: ProductFacadeService, private router: Router] {}

  addToCart[product: Product]: void {
    this.productFacade.addToCart[product];
  }

  openProduct[productId: number]: void {
    this.router.navigate[['/products', productId]];
  }
}
                        
```

| Smart component responsibility | Example in MicroShop |
|---|---|
| Connect to store/service | `ProductListPageComponent` selects products |
| Dispatch actions | Add to cart / filter change |
| Handle routing | Navigate to detail page |
| Coordinate child components | Pass inputs to grid and filters |

**MicroShop decision notes:**
- Smart components are usually fewer and closer to routes.
- They are allowed to be a bit fatter because they keep dumb components simple.
- React teams often call these container components or page components.

---

### 2️⃣ What makes a component dumb?

**The real-world mental model:**
> A dumb component is a product display shelf: it shows what you place on it and tells you when a shopper interacted.

**Why it matters in MicroShop:** MicroShop cards and grids should be reusable in search results, home page promos, and category pages.

Presentational components only care about `@Input[]` and `@Output[]`.
They should not know whether data came from NgRx, a signal, or a REST API.
                        

```typescript
@Component[{
  selector: 'app-product-grid',
  template: `
    <div *ngIf="loading" class="loading-state">Loading products...</div>

    <div *ngIf="!loading" class="product-grid">
      <app-product-card
        *ngFor="let product of products; trackBy: trackByProductId"
        [product]="product"
        [add]="addToCart.emit[product]"
        [view]="selectProduct.emit[product.id]">
      </app-product-card>
    </div>
  `
}]
export class ProductGridComponent {
  @Input[] products: Product[] | null = [];
  @Input[] loading: boolean | null = false;
  @Output[] addToCart = new EventEmitter<Product>[];
  @Output[] selectProduct = new EventEmitter<number>[];

  trackByProductId[index: number, product: Product]: number {
    return product.id;
  }
}
                        
```

| Dumb component rule | Reason |
|---|---|
| No service injection when avoidable | Keeps reuse high |
| Inputs are plain values | Predictable render contract |
| Outputs are event intents | Parent decides side effects |
| No route navigation logic | Keep concerns separated |

**MicroShop decision notes:**
- A dumb component can still contain tiny UI-only helper methods like `trackBy`.
- If you can move the same component into Storybook without mocking five services, it is probably dumb enough.
- This pattern makes unit testing dramatically easier.

---

### 3️⃣ ASCII data-flow map for MicroShop

**The real-world mental model:**
> Good architecture makes data flow visible, not magical.

**Why it matters in MicroShop:** When MicroShop adds more teams, the data path must be obvious from page container to leaf card.

One-way data flow becomes much easier to reason about when smart and dumb components are explicit.
The diagram below is worth memorising because it also prepares you for `OnPush`.
                        

```text
Store / Facade / Router
        ↓
ProductListPageComponent
        ↓ @Input[]
ProductGridComponent
        ↓ @Input[]
ProductCardComponent
        ↑ @Output[]
ProductGridComponent
        ↑ @Output[]
ProductListPageComponent
        ↓ dispatch / navigate
Store / Router
                        
```

```typescript
export interface ProductGridViewModel {
  products: Product[];
  loading: boolean;
  categoryLabel: string;
  canLoadMore: boolean;
}

export class ProductListPageComponent {
  vm$ = combineLatest[[
    this.productFacade.products$,
    this.productFacade.loading$,
    this.productFacade.categoryLabel$,
    this.productFacade.canLoadMore$
  ]].pipe[
    map[[[products, loading, categoryLabel, canLoadMore]] => [{
      products,
      loading,
      categoryLabel,
      canLoadMore
    }]]
  ];
}
                        
```

| Layer | Primary concern |
|---|---|
| Facade / store | State orchestration |
| Smart page | Screen coordination |
| Dumb list/grid | Layout |
| Dumb card | Single item rendering |

**MicroShop decision notes:**
- View-model streams are a neat way to reduce many async bindings in the parent template.
- Angular's explicit input/output flow is a strength when teams lean into it.
- Avoid child components secretly reloading the same data themselves.

---

### 4️⃣ When to break a component apart

**The real-world mental model:**
> If one person is cashier, warehouse operator, marketer, and accountant at the same time, your store design is off.

**Why it matters in MicroShop:** MicroShop screens should split when a component grows multiple reasons to change.

Use the split when the page both fetches/orchestrates data and owns reusable view chunks.
Do not over-split tiny components, but do refactor when file size and responsibility explode.
                        

```typescript
// Smell checklist
// - Injects Router + ActivatedRoute + Store + 3 services
// - Has 500-line template
// - Reused in many pages but also navigates directly
// - Hard to test because every test needs HttpClient mocks

export class ArchitectureChecklist {
  readonly refactorTriggers = [
    'More than one async data source',
    'Mixed view logic and navigation logic',
    'Repeated markup sections',
    'Difficult isolated tests'
  ];
}
                        
```

| Symptom | Likely fix |
|---|---|
| Huge page with repeated card markup | Extract dumb card/grid |
| Shared widget knows routing/store | Introduce smart wrapper |
| Same formatting logic everywhere | Selector or pipe |
| Tests require many service mocks | Push orchestration upward |

**MicroShop decision notes:**
- Architecture is about reducing accidental coupling, not chasing arbitrary file counts.
- The best splits are the ones that make future change easier.
- Use feature folders so the split stays discoverable.

---

## 🔷 SESSION 2 — OnPush Change Detection

---

### 1️⃣ Default vs OnPush strategy

**The real-world mental model:**
> Default change detection patrols every room frequently; OnPush checks a room only when someone reports a meaningful change.

**Why it matters in MicroShop:** Large MicroShop catalogs with many product cards should not re-check everything on every tiny event.

`OnPush` tells Angular to skip unnecessary checks unless an input reference changes, an observable emits through `async`, or an event happens inside the component.
This can substantially reduce work in list-heavy screens.
                        

```typescript
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component[{
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

| Trigger | Does OnPush check run? |
|---|---|
| New `@Input[]` reference | Yes |
| Observable emits via `async` pipe | Yes |
| Button click inside component | Yes |
| Unrelated parent timer tick | Usually no |

**MicroShop decision notes:**
- OnPush is easiest when your data is already immutable, which NgRx encourages.
- Think of it as opting into more explicit rendering rules.
- The bigger the repeated list, the more valuable this becomes.

---

### 2️⃣ Mutation pitfalls and reference changes

**The real-world mental model:**
> OnPush cares about a new parcel arriving, not about someone secretly changing items inside the old box.

**Why it matters in MicroShop:** If MicroShop mutates `product.stock--` in place, child components may never notice.

This is the classic `OnPush` trap.
You must replace arrays and objects with new references when state changes.
                        

```typescript
// ❌ Wrong: same array reference, mutated item
this.products[0].stock = this.products[0].stock - 1;

// ✅ Better: new array and new product object
this.products = this.products.map[[product] =>
  product.id === updatedProduct.id
    ? { ...product, stock: product.stock - 1 }
    : product
];

// ✅ NgRx reducer pattern naturally gives new references
on[updateStockSuccess, [state, { productId }] => [{
  ...state,
  products: state.products.map[[product] =>
    product.id === productId ? { ...product, stock: product.stock - 1 } : product
  ]
}]]
                        
```

| Pattern | OnPush-friendly? |
|---|---|
| `array.push[]` | No |
| `map[]` to new array | Yes |
| `object.property = ...` on shared object | No |
| Spread operator to new object | Yes |

**MicroShop decision notes:**
- This is one reason NgRx reducers and immutable helper libraries fit well with OnPush.
- React users already know this rule from state updates; Angular's OnPush brings the same discipline.
- If a child is stale, inspect reference identity first.

---

### 3️⃣ Async pipe, observable emissions, and manual checks

**The real-world mental model:**
> Observable emissions are like official radio calls telling OnPush rooms they need attention.

**Why it matters in MicroShop:** MicroShop facade streams and store selectors are the easiest way to keep OnPush components reactive.

The `async` pipe automatically marks the component for check when a new value arrives.
For edge cases like callbacks from third-party libraries, `ChangeDetectorRef.markForCheck[]` is the emergency bell.
                        

```typescript
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';

@Component[{
  selector: 'app-order-status-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Latest update: {{ lastStatusMessage }}</p>`
}]
export class OrderStatusBannerComponent {
  lastStatusMessage = 'Waiting for shipment update...';

  constructor[private cdr: ChangeDetectorRef] {}

  attachWebSocket[socket: WebSocket]: void {
    socket.addEventListener['message', [event] => {
      this.lastStatusMessage = event.data;
      this.cdr.markForCheck[];
    }];
  }
}
                        
```

| Case | Preferred approach |
|---|---|
| Store/facade observable | `async` pipe |
| Promise converted once | Assign + maybe `markForCheck[]` if outside Angular zone |
| Third-party callback | `ChangeDetectorRef.markForCheck[]` |
| Synchronous input event | Usually automatic |

**MicroShop decision notes:**
- Use manual change detection sparingly; it is a tool, not the default plan.
- If you are writing lots of `markForCheck[]`, step back and improve data flow.
- Async pipe plus selectors is the happiest path.

---

### 4️⃣ Where to apply OnPush first

**The real-world mental model:**
> Start by upgrading the reusable shelves, not the whole mall at once.

**Why it matters in MicroShop:** MicroShop gets the biggest win by marking dumb list-heavy components first.

Container components can remain default temporarily if they do complex orchestration.
Apply `OnPush` first to `ProductCardComponent`, `ProductGridComponent`, and summary widgets that mostly render inputs.
                        

```typescript
export const onPushPriorityList = [
  'ProductCardComponent',
  'ProductGridComponent',
  'HeaderCartSummaryComponent',
  'WishlistButtonComponent'
];

export const defaultTemporarily = [
  'ProductListPageComponent',
  'CheckoutPageComponent'
];
                        
```

| Good first candidates | Why |
|---|---|
| Dumb reusable components | Stable inputs, easy tests |
| Large repeated list items | High render frequency |
| Selector-driven summary widgets | Observable inputs fit perfectly |
| Pure modal content components | Mostly input-driven |

**MicroShop decision notes:**
- Rolling out OnPush incrementally is a professional strategy.
- Pair it with `trackBy` on lists for the biggest payoff.
- Measure with DevTools instead of assuming every component needs it.

---

## 🔷 SESSION 3 — Advanced Patterns

---

### 1️⃣ Facade pattern over NgRx

**The real-world mental model:**
> A facade is the customer service desk in front of the warehouse: components talk to one clean interface instead of every storage detail.

**Why it matters in MicroShop:** MicroShop pages should not know selector names, action creators, and service fallback logic all at once.

Facade services wrap `store.select[]` and `store.dispatch[]`.
That reduces NgRx knowledge in components and makes future refactors easier.
                        

```typescript
@Injectable[{ providedIn: 'root' }]
export class ProductFacadeService {
  products$ = this.store.select[selectVisibleProducts];
  loading$ = this.store.select[selectProductsLoading];
  categoryLabel$ = this.store.select[selectCurrentCategoryLabel];

  constructor[private store: Store] {}

  loadProducts[]: void {
    this.store.dispatch[loadProducts[]];
  }

  addToCart[product: Product]: void {
    this.store.dispatch[addToCart[{ product }]];
  }

  changeCategory[category: string]: void {
    this.store.dispatch[changeCategory[{ category }]];
  }
}
                        
```

| Without facade | With facade |
|---|---|
| Component imports 6 selectors/actions | Component imports one service |
| NgRx leaks into every page | NgRx stays behind boundary |
| Harder swap to signals/store wrapper later | Refactor happens in one place |

**MicroShop decision notes:**
- Facades are especially helpful in large apps and Nx monorepos.
- Do not bury all business logic blindly; keep selectors and reducers clean too.
- This also makes unit testing components easier because you can mock the facade.

---

### 2️⃣ Repository pattern for data access

**The real-world mental model:**
> A repository is the buying office that knows which supplier to call, but the shop floor only sees a clean catalog API.

**Why it matters in MicroShop:** MicroShop may fetch products from REST today and GraphQL tomorrow without rewriting every feature component.

Repositories sit below facades or services and isolate transport details.
This is most useful when data access complexity grows or multiple backends exist.
                        

```typescript
@Injectable[{ providedIn: 'root' }]
export class ProductRepository {
  constructor[private http: HttpClient] {}

  getAll[] {
    return this.http.get<ProductDto[]>[`${environment.apiUrl}/products`];
  }

  getById[id: number] {
    return this.http.get<ProductDto>[`${environment.apiUrl}/products/${id}`];
  }

  search[term: string] {
    return this.http.get<ProductDto[]>[`${environment.apiUrl}/products`, {
      params: { q: term }
    }];
  }
}
                        
```

| Layer | Knows about HTTP? |
|---|---|
| Repository | Yes |
| Facade | Usually no, it orchestrates state |
| Dumb component | No |
| Smart page | Preferably no |

**MicroShop decision notes:**
- Keep repositories focused on transport and mapping, not on UI orchestration.
- Angular DI makes it easy to mock repositories in tests.
- This pattern is optional in tiny apps but valuable in serious ones.

---

### 3️⃣ Memoized selectors and feature state

**The real-world mental model:**
> Memoized selectors are cached reports that only recalculate when the relevant ledger pages change.

**Why it matters in MicroShop:** MicroShop category filters and totals should not recompute expensively on every unrelated state update.

Compose selectors from smaller selectors.
This keeps feature state scalable and makes expensive projections safer.
                        

```typescript
export interface ProductsState {
  products: Product[];
  selectedCategory: string;
  searchTerm: string;
}

export const selectProductsState = createFeatureSelector<ProductsState>['products'];
export const selectAllProducts = createSelector[selectProductsState, [state] => state.products];
export const selectCategory = createSelector[selectProductsState, [state] => state.selectedCategory];
export const selectSearchTerm = createSelector[selectProductsState, [state] => state.searchTerm];

export const selectVisibleProducts = createSelector[
  selectAllProducts,
  selectCategory,
  selectSearchTerm,
  [products, category, searchTerm] =>
    products.filter[[product] =>
      [category === 'all' || product.category === category] &&
      product.title.toLowerCase[].includes[searchTerm.toLowerCase[]]
    ]
];
                        
```

| Selector design rule | Benefit |
|---|---|
| Compose small selectors | Readable and reusable |
| Keep projection pure | Memoization stays valid |
| Read from feature slice | Loose coupling to root shape |
| Return UI-ready data | Skinny components |

**MicroShop decision notes:**
- Memoization matters more when projections are expensive or reused widely.
- Put feature selectors near the feature reducer.
- Selector composition is one of the most underrated Angular architecture tools.

---

### 4️⃣ EntityAdapter for normalized collections

**The real-world mental model:**
> Normalized state is like storing products in indexed bins plus an ID list instead of scattering full copies everywhere.

**Why it matters in MicroShop:** When MicroShop product collections grow large, updates by ID become easier and less repetitive.

`@ngrx/entity` reduces boilerplate for CRUD-heavy lists.
You get helper reducers and selectors based on a normalized `{ ids, entities }` structure.
                        

```typescript
import { EntityState, createEntityAdapter } from '@ngrx/entity';

export interface ProductEntityState extends EntityState<Product> {
  loading: boolean;
}

export const productAdapter = createEntityAdapter<Product>[{
  selectId: [product] => product.id
}];

export const initialProductEntityState: ProductEntityState = productAdapter.getInitialState[{
  loading: false
}];

export const {
  selectAll: selectAllProductEntities,
  selectEntities: selectProductEntityMap
} = productAdapter.getSelectors[];
                        
```

| Good fit for EntityAdapter | Maybe overkill |
|---|---|
| Large CRUD collections | Tiny one-off state objects |
| Frequent update-by-id | Simple form wizard |
| Normalized relation handling | Static settings flags |

**MicroShop decision notes:**
- Do not force entity state everywhere, but know it exists when collections grow.
- This becomes especially handy in admin/catalog management screens.
- EntityAdapter plays well with facades and OnPush.

---

## 🏗️ Day 6 Hands-On

- Create `ProductListPageComponent` as the smart container for catalog data.
- Extract `ProductGridComponent` as a dumb component with only `@Input[]` and `@Output[]` APIs.
- Ensure `ProductCardComponent` remains dumb and reusable.
- Add `ChangeDetectionStrategy.OnPush` to all dumb components.
- Refactor any mutable array/object updates to immutable patterns.
- Introduce `ProductFacadeService` to hide store selectors and dispatch calls.
- Optionally add a `ProductRepository` class under `src\app\core` or `src\app\data-access`.
- Create at least one memoized selector that combines filters and search term into visible products.
- Profile the catalog in Angular DevTools before and after the split.
