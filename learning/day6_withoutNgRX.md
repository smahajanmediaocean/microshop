# 📘 Day 6 (Supplement) — Smart/Dumb Components, OnPush & Advanced Architecture Without NgRx
### Project: **MicroShop** — How the app is structured using Services + RxJS + @Input/@Output

---

## 🧭 Why This Document?

Day 6 covers Smart/Dumb components, OnPush, and advanced patterns assuming NgRx is in place. But **MicroShop's actual codebase does NOT use NgRx**. Instead, it achieves the same goals using Angular fundamentals:

| Topic | How MicroShop does it (without NgRx) |
|---|---|
| **Smart vs Dumb Components** | Pages = smart, reusable presentational = dumb |
| **Shared state** | Singleton Services + `BehaviorSubject` |
| **Parent ↔ Child data flow** | `@Input()` / `@Output()` |
| **Reactive UI** | `Observable` + `async` pipe |
| **Performance** | `ChangeDetectionStrategy.OnPush` on dumb components |
| **Advanced Architecture** | Facade & Repository patterns via plain services |

This document explains how the app currently works, using **real file examples** from the codebase.

---

## 🗺️ Component Tree & Data Flow Map

```text
AppComponent
  ├── app-header  [cartCount]="cartCount$ | async"      ← Input from AppComponent
  ├── router-outlet
  │     ├── HomeComponent  (smart page)
  │     │     └── app-product-card  [product]  (addToCart)  ← Input + Output
  │     ├── CartComponent  (smart page)
  │     └── ProductDetailComponent
  └── app-footer
```

**Shared state flows like this:**

```text
CartService (singleton)
  │
  ├── cartItems$  (BehaviorSubject) ──→ CartComponent subscribes
  ├── cartCount$  (derived stream)  ──→ AppComponent ──→ HeaderComponent via @Input
  │
  └── addItem() / removeItem() / updateQuantity()
        ↑ called by HomeComponent and CartComponent
```

---

## 🔷 SESSION 1 — Smart vs Dumb Component Pattern

### 1️⃣ What makes a component smart?

> A smart component is the **floor manager** — it knows where data comes from, coordinates children, handles routing, and delegates side effects to services.

Smart components in MicroShop:
- Inject services (`ProductService`, `CartService`, `Router`)
- Subscribe to Observables and pass plain values down via `@Input`
- Handle `@Output` events from children and call service methods
- Usually live at **page level** (inside `src/app/pages/`)

---

### 2️⃣ What makes a component dumb?

> A dumb component is a **product display shelf** — it shows what you place on it, and tells you when a shopper interacted. It does not know or care where the data came from.

Dumb components in MicroShop:
- Only use `@Input()` (receive data) and `@Output()` (emit events)
- Do **not** inject services (or only inject presentation-only services like `Router` for `[routerLink]`)
- Are reusable — can be dropped onto any page that provides the right inputs
- Usually live in `src/app/components/`

---

### 3️⃣ MicroShop component classification

| Component | Type | Why |
|---|---|---|
| `HomeComponent` | **Smart** | Injects `ProductService` + `CartService`, builds `filteredProducts$`, handles search/filter logic |
| `CartComponent` | **Smart** | Injects `CartService`, calls `updateQuantity()` and `removeItem()` |
| `ProductDetailComponent` | **Smart** | Injects `ActivatedRoute` + `CartService`, reads resolver data |
| `AppComponent` | **Smart** | Injects `CartService` + `LoadingService`, bridges cart count to header |
| `ProductCardComponent` | **Dumb** | Only `@Input() product` and `@Output() addToCart` — no service injection |
| `HeaderComponent` | **Dumb** | Only `@Input() cartCount` — purely displays what it receives |
| `FooterComponent` | **Dumb** | Static — no inputs, no outputs, no services |

---

### 4️⃣ One-way data flow in MicroShop

```text
Services / BehaviorSubject (state source)
        ↓
HomeComponent  [smart page]
        ↓  @Input: product
ProductCardComponent  [dumb]
        ↑  @Output: addToCart
HomeComponent  [smart page]
        ↓  calls cartService.addItem()
CartService (updates BehaviorSubject)
        ↓  cartCount$ emits
AppComponent
        ↓  @Input: cartCount
HeaderComponent  [dumb]
```

> **Rule:** Data flows **down** via `@Input`. Events flow **up** via `@Output`. Side effects (service calls) happen at the smart layer.

---

### 5️⃣ When to break a component apart

Use these symptoms as your checklist:

| Symptom | Fix |
|---|---|
| A component injects 3+ services | Extract smart wrapper, push service logic up |
| Repeated card/row markup inside a page | Extract a dumb presentational component |
| A reusable widget directly calls a service or navigates | Lift logic into the parent smart component |
| Hard to test — every test needs `HttpClient` mocks | Push HTTP/data concerns into a service |
| Template is growing beyond ~80 lines | Split into smart page + dumb sub-components |

**Real example in MicroShop:** `HomeComponent` handles data fetching, filtering, and rendering. A natural next split would be extracting a `ProductGridComponent` (dumb) that receives `products` as `@Input` — keeping `HomeComponent` as the smart coordinator.

---

## 🔷 PART 1 — Singleton Service as a Shared State Store

### The problem it solves

When two sibling or distant components need the same data (e.g. cart count in the header, and cart items in the cart page), passing data via `@Input` up and down the whole tree is painful.

**Solution:** put state in an injectable `@Injectable({ providedIn: 'root' })` service — Angular creates **one instance for the whole app**.

---

### 📁 `src/app/services/cart.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class CartService {

  // BehaviorSubject is the "state holder" — it remembers the latest value
  // and replays it to any new subscriber
  private items$ = new BehaviorSubject<CartItem[]>([]);

  // Public read-only stream — components subscribe to this, not the BehaviorSubject directly
  cartItems$ = this.items$.asObservable();

  // Derived stream — automatically recalculates when items$ changes
  cartCount$ = this.items$.pipe(
    map(items => items.reduce((sum, i) => sum + i.quantity, 0))
  );

  addItem(product: Product): void {
    const current = this.items$.getValue();         // read current state
    const existing = current.find(i => i.product.id === product.id);

    if (existing) {
      // Immutably update: map() returns a new array
      const updated = current.map(i =>
        i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1 }     // spread = new object
          : i
      );
      this.items$.next(updated);                    // push new state to all subscribers
    } else {
      this.items$.next([...current, { product, quantity: 1 }]);
    }
  }

  removeItem(productId: number): void {
    const updated = this.items$.getValue().filter(i => i.product.id !== productId);
    this.items$.next(updated);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) { this.removeItem(productId); return; }
    const updated = this.items$.getValue().map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    this.items$.next(updated);
  }

  clearCart(): void { this.items$.next([]); }
}
```

#### 🔑 Key concepts here

| Concept | What it is | Why used |
|---|---|---|
| `BehaviorSubject<T>` | An Observable that always holds the last value | Acts as the "store"; new subscribers immediately get the current state |
| `.asObservable()` | Strips the `.next()` method from the exposed stream | Prevents components from pushing data directly — they can only read |
| `items$.getValue()` | Reads the current value synchronously | Needed inside service methods to compute updates |
| `items$.next(newValue)` | Pushes a new state to all subscribers | Every subscribing component re-renders automatically |
| Immutable updates (`...spread`) | Never mutate the existing array/object | Required for `OnPush` change detection to work correctly |

---

## 🔷 PART 2 — @Input / @Output Between Parent and Child

### The problem it solves

Child components (like `ProductCardComponent`) are dumb/presentational — they just display data. They receive data from their parent via `@Input`, and report events back via `@Output`.

---

### 📁 `src/app/components/product-card/product-card.component.ts`

```typescript
@Component({ selector: 'app-product-card', ... })
export class ProductCardComponent {

  @Input() product!: Product;                     // ← DATA flows IN from parent
  @Output() addToCart = new EventEmitter<Product>(); // ← EVENT flows OUT to parent

  onAddToCart(): void {
    this.addToCart.emit(this.product);            // tell parent: "user clicked Add"
  }
}
```

---

### 📁 `src/app/pages/home/home.component.html` — parent binding

```html
<app-product-card
  *ngFor="let product of products"
  [product]="product"                    <!-- @Input: pass product object IN -->
  (addToCart)="onAddToCart($event)">     <!-- @Output: receive event from child -->
</app-product-card>
```

```
HomeComponent
    │
    │  [product]="product"   → passes Product object DOWN into child
    │
    └──▶ ProductCardComponent
              │
              │  (addToCart)="onAddToCart($event)"  → event bubbles UP to parent
              ↑
```

---

### 📁 `src/app/pages/home/home.component.ts` — parent handles the event

```typescript
export class HomeComponent {

  constructor(
    private productService: ProductService,
    private cartService: CartService          // inject the shared service
  ) { ... }

  onAddToCart(product: Product): void {
    this.cartService.addItem(product);        // delegate to the service (shared state)
  }
}
```

> **Pattern:** Child emits an event → Parent receives it → Parent calls the shared service.  
> Children never talk to services directly in this pattern.

---

## 🔷 PART 3 — Cross-Component Communication via Shared Service

### The problem it solves

`HeaderComponent` and `CartComponent` are **not parent/child** — they live in completely separate branches of the component tree. `@Input`/`@Output` alone can't connect them. The `CartService` singleton bridges the gap.

---

### Data flow: "Add to cart" → header count updates

```text
User clicks "Add to Cart" on ProductCardComponent
    ↓  (addToCart) @Output event emitted
HomeComponent.onAddToCart(product) called
    ↓  cartService.addItem(product)
CartService.items$ (BehaviorSubject) emits new array
    ↓  cartCount$ (derived observable) recalculates
AppComponent.cartCount$ receives new count
    ↓  [cartCount]="(cartCount$ | async) || 0"
HeaderComponent renders the new badge number
```

---

### 📁 `src/app/app.component.ts` — bridges service → header

```typescript
@Component({ selector: 'app-root', ... })
export class AppComponent {
  cartCount$: Observable<number>;

  constructor(cartService: CartService) {
    // Subscribe to the shared service stream
    this.cartCount$ = cartService.cartCount$;
  }
}
```

### 📁 `src/app/app.component.html` — passes count to header

```html
<app-header [cartCount]="(cartCount$ | async) || 0"></app-header>
```

### 📁 `src/app/components/header/header.component.ts` — receives it

```typescript
export class HeaderComponent {
  @Input() cartCount: number = 0;    // purely presentational — just displays the number
}
```

---

### 📁 `src/app/pages/cart/cart.component.ts` — subscribes independently

```typescript
export class CartComponent {
  cartItems$: Observable<CartItem[]>;

  constructor(public cartService: CartService) {
    this.cartItems$ = this.cartService.cartItems$;   // same source, different subscriber
  }

  updateQty(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cartService.updateQuantity(productId, +input.value);
  }

  remove(productId: number): void {
    this.cartService.removeItem(productId);
  }
}
```

> Both `AppComponent` and `CartComponent` subscribe to the **same** `CartService` BehaviorSubject. When one component causes a change, both automatically reflect it.

---

## 🔷 PART 4 — Reactive Filtering in HomeComponent (combineLatest)

HomeComponent demonstrates a more advanced pattern: **combining multiple streams** to derive a filtered result.

### 📁 `src/app/pages/home/home.component.ts`

```typescript
export class HomeComponent {
  filteredProducts$: Observable<Product[]>;

  searchTerm$ = new BehaviorSubject<string>('');           // tracks search input
  selectedCategory$ = new BehaviorSubject<string>('All'); // tracks active filter chip

  constructor(private productService: ProductService, private cartService: CartService) {

    const products$ = this.productService.getAll();  // HTTP call (Observable)

    // combineLatest: emits a new value whenever ANY of the three streams changes
    this.filteredProducts$ = combineLatest([
      products$,
      this.searchTerm$,
      this.selectedCategory$
    ]).pipe(
      map(([products, term, category]) => {
        const search = term.toLowerCase().trim();
        const byCategory = category !== 'All'
          ? products.filter(p => p.category === category)
          : products;
        return search
          ? byCategory.filter(p => p.title.toLowerCase().includes(search))
          : byCategory;
      })
    );
  }

  onInputChange(event: Event) {
    this.searchTerm$.next((event.target as HTMLInputElement).value); // push new value
  }

  onCategorySelect(category: string) {
    this.selectedCategory$.next(category); // push new value
  }
}
```

#### How it behaves

```text
User types "shirt" in search box
  → onInputChange() fires
  → searchTerm$.next("shirt")
  → combineLatest re-emits [products, "shirt", "All"]
  → map() runs the filter
  → filteredProducts$ emits the filtered array
  → async pipe in template updates the DOM automatically
```

---

## 🔷 PART 5 — ProductService (HTTP-based, stateless)

`ProductService` does **not** hold state — it just makes HTTP requests and returns Observables.

```typescript
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient, @Inject(API_URL) private apiUrl: string) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }
}
```

Components call `getAll()` and subscribe (via `async` pipe). Each subscription triggers a fresh HTTP request — there is **no caching layer** in the current implementation.

> 💡 This is the main difference vs NgRx: with NgRx, fetched data lives in the store and is not re-fetched on every navigation. Without NgRx, each component/page re-requests data independently.

---

## 🔷 PART 6 — OnPush Change Detection

### What problem does it solve?

By default, Angular checks **every component** in the whole tree every time any event fires (click, keypress, HTTP response, timer). In MicroShop, the product grid renders 20+ `ProductCardComponent` instances. Without `OnPush`, Angular re-checks all 20 cards even if only the cart count changed.

`OnPush` tells Angular:
> *"Only check this component if one of its @Inputs changed reference, or an event fired inside it, or an Observable emitted via async pipe."*

---

### 📁 Applying OnPush to `ProductCardComponent`

`ProductCardComponent` is the **perfect candidate** for `OnPush` because:
- It receives data only via `@Input() product`
- It emits events only via `@Output() addToCart`
- It never talks to a service or holds mutable state of its own

**Current code** (no OnPush):
```typescript
// src/app/components/product-card/product-card.component.ts
@Component({
  selector: 'app-product-card',
  standalone: false,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }
}
```

**With OnPush applied:**
```typescript
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '../../models/product';

@Component({
  selector: 'app-product-card',
  standalone: false,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush   // ← add this one line
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }
}
```

That's literally **one line added**. Angular now skips this component during change detection unless:
1. The `product` input reference changes (new object from `*ngFor`)
2. The user clicks "Add to Cart" (event inside this component)

---

### 📁 Applying OnPush to `HeaderComponent`

`HeaderComponent` is also a perfect candidate — it only receives `cartCount` via `@Input` and never has internal state.

```typescript
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush   // ← add this
})
export class HeaderComponent {
  @Input() cartCount: number = 0;
}
```

`AppComponent` passes it via `async` pipe:
```html
<app-header [cartCount]="(cartCount$ | async) || 0"></app-header>
```

When `cartCount$` emits a new value, the `async` pipe sets a new primitive on the `@Input`. Angular detects the changed value → re-checks `HeaderComponent`. All other events in the app skip it entirely.

---

### Why OnPush works perfectly with this app's patterns

| Pattern in MicroShop | OnPush compatible? | Why |
|---|---|---|
| `@Input()` with a new object/primitive | ✅ Yes | New reference triggers the check |
| `async` pipe in template | ✅ Yes | `async` pipe marks the component dirty when the Observable emits |
| `(click)` / `(addToCart)` output | ✅ Yes | DOM events inside the component still trigger a check |
| Mutating an existing object directly | ❌ No | Same reference → OnPush won't notice |

---

### ⚠️ The One Rule: Never Mutate, Always Replace

Because `CartService` uses **immutable updates** (spread operator), `OnPush` works safely:

```typescript
// ✅ CartService does this — creates a NEW array
this.items$.next([...current, { product, quantity: 1 }]);

// ✅ And this — creates NEW objects inside the array
const updated = current.map(i =>
  i.product.id === product.id
    ? { ...i, quantity: i.quantity + 1 }   // new object — OnPush will see this
    : i
);
this.items$.next(updated);

// ❌ Never do this with OnPush — same array reference, Angular won't re-render
current.push({ product, quantity: 1 });
this.items$.next(current);
```

---

### Visual: Change Detection with vs without OnPush

```text
Default (no OnPush) — user clicks "Add to Cart":
  AppComponent          ← checked ✓
  ├── HeaderComponent   ← checked ✓ (even though nothing changed here)
  ├── HomeComponent     ← checked ✓
  │   ├── ProductCard 1 ← checked ✓
  │   ├── ProductCard 2 ← checked ✓
  │   ├── ...           ← checked ✓ (all 20 cards!)
  │   └── ProductCard 20← checked ✓
  └── FooterComponent   ← checked ✓


OnPush on ProductCard + Header — same click:
  AppComponent          ← checked ✓ (root always runs)
  ├── HeaderComponent   ← checked ✓ (cartCount$ async pipe emitted new value)
  ├── HomeComponent     ← checked ✓ (event originated here)
  │   ├── ProductCard 1 ← SKIPPED ⚡ (input didn't change)
  │   ├── ProductCard 2 ← SKIPPED ⚡
  │   ├── ...           ← SKIPPED ⚡ (19 cards skipped!)
  │   └── ProductCard 20← SKIPPED ⚡
  └── FooterComponent   ← SKIPPED ⚡
```

With 20 product cards, `OnPush` eliminates ~19 unnecessary component checks on every user interaction.

### 🎯 OnPush priority list for MicroShop

| Component | Apply OnPush? | Reason |
|---|---|---|
| `ProductCardComponent` | ✅ First priority | Repeated in a list, only `@Input` + `@Output`, no services |
| `HeaderComponent` | ✅ First priority | Only `@Input() cartCount`, purely presentational |
| `FooterComponent` | ✅ Easy win | Static, no inputs at all |
| `HomeComponent` | ⚠️ Later | Smart — manages BehaviorSubjects, would need `markForCheck()` care |
| `CartComponent` | ⚠️ Later | Smart — calls service methods, has event handlers |
| `ProductDetailComponent` | ⚠️ Later | Smart — uses resolver data + route state |

> **Rule of thumb:** apply `OnPush` to dumb/presentational components first. Smart page components can stay on Default until all their state is observable-driven.

---

## 🔷 SESSION 3 — Advanced Architecture Patterns (Without NgRx)

---

### 1️⃣ Facade Pattern — `CartService` already is a Facade

In the NgRx world, a Facade wraps `store.dispatch()` and `store.select()` behind a clean service API. **Without NgRx, `CartService` already plays this exact role.**

> A Facade is the **customer service desk** in front of the warehouse: components talk to one clean interface instead of every internal detail.

**What `CartService` hides from components:**

```typescript
// ✅ What HomeComponent sees (clean facade API):
this.cartService.addItem(product);
this.cartService.cartCount$;

// 🙈 What HomeComponent never needs to know:
//   - there's a BehaviorSubject<CartItem[]> internally
//   - the immutable update logic (map + spread)
//   - how cartCount$ is derived
//   - that CartComponent uses the same source
```

**The Facade contract in MicroShop:**

| Facade method / stream | Consumer | What it hides |
|---|---|---|
| `cartService.addItem(product)` | `HomeComponent`, `ProductDetailComponent` | BehaviorSubject mutation logic |
| `cartService.removeItem(id)` | `CartComponent` | Filter + `next()` call |
| `cartService.updateQuantity(id, qty)` | `CartComponent` | Guard + map + `next()` call |
| `cartService.cartItems$` | `CartComponent` | Internal `items$.asObservable()` |
| `cartService.cartCount$` | `AppComponent` | `pipe(map(reduce(...)))` derivation |

**If you were to add NgRx later**, you would only change `CartService` internals — every component using it stays untouched. That is the Facade payoff.

---

### 2️⃣ Repository Pattern — `ProductService` is a Repository

A Repository isolates **how you fetch data** from the rest of the app. Components ask for products; they do not know or care that it's a REST API call to `/products`.

> A Repository is the **buying office** — the shop floor only sees a clean catalog API. The buying office may switch suppliers tomorrow without disrupting the store.

**`ProductService` as a Repository:**

```typescript
// src/app/services/product.service.ts

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient, @Inject(API_URL) private apiUrl: string) {}

  // Repository method — returns data, hides transport details
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/category/${category}`);
  }
}
```

| Layer | Knows about HTTP? | Knows about BehaviorSubject state? |
|---|---|---|
| `ProductService` (Repository) | ✅ Yes | ❌ No |
| `CartService` (Facade + State) | ❌ No | ✅ Yes |
| `HomeComponent` (Smart) | ❌ No | ❌ No — just calls methods |
| `ProductCardComponent` (Dumb) | ❌ No | ❌ No — just renders inputs |

**The Repository boundary** means if you ever switch from the Fake Store API to a real backend, you only update `ProductService`. `HomeComponent` and `ProductDetailComponent` are untouched.

---

### 3️⃣ `trackBy` — the free performance companion to OnPush

When Angular renders a `*ngFor` list without `trackBy`, it **re-creates every DOM element** whenever the array reference changes. With `trackBy`, Angular identifies which items actually changed and only patches those.

This pairs perfectly with `OnPush` — `trackBy` reduces DOM work, `OnPush` reduces change detection work.

**Without trackBy (current in HomeComponent):**
```html
<!-- Every time filteredProducts$ emits, all card DOM nodes are destroyed + recreated -->
<app-product-card
  *ngFor="let product of products"
  [product]="product"
  (addToCart)="onAddToCart($event)">
</app-product-card>
```

**With trackBy (improvement to add):**
```html
<app-product-card
  *ngFor="let product of products; trackBy: trackByProductId"
  [product]="product"
  (addToCart)="onAddToCart($event)">
</app-product-card>
```

```typescript
// Add this method to HomeComponent
trackByProductId(index: number, product: Product): number {
  return product.id;   // Angular uses product.id to identify items, not array position
}
```

**Effect:** When the search filter changes and returns the same 15 products in a different order, Angular **moves** DOM nodes instead of destroying/recreating them. No flash, faster render, no input re-binding on unchanged cards.

---

### 4️⃣ LoadingService — another Facade example

`LoadingService` is a second Facade in the app. It owns the global loading spinner state, hides the `BehaviorSubject`, and exposes only what consumers need:

```typescript
// src/app/services/loading.service.ts
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = new BehaviorSubject<boolean>(false);
  isLoading$ = this._loading.asObservable();   // read-only stream for template

  show(): void { this._loading.next(true); }   // called by interceptor
  hide(): void { this._loading.next(false); }  // called by interceptor
}
```

```typescript
// AppComponent consumes it — never touches the BehaviorSubject directly
export class AppComponent {
  constructor(public loadingService: LoadingService) {}
}
```

```html
<!-- app.component.html -->
<div *ngIf="loadingService.isLoading$ | async" class="global-spinner">
  <div class="spinner"></div>
</div>
```

**Pattern reuse:** `LoadingService` = same Facade pattern as `CartService`. State is private, interface is clean, consumer components are simple.

---

## 🔷 Summary: The Six Patterns Used in MicroShop

```text
┌─────────────────────────────────────────────────────────────────┐
│  Pattern 1: Smart vs Dumb Components                            │
│                                                                  │
│  Smart (pages): HomeComponent, CartComponent,                   │
│                 ProductDetailComponent, AppComponent            │
│  Dumb (shared): ProductCardComponent, HeaderComponent,          │
│                 FooterComponent                                 │
│                                                                  │
│  Best for: keeping reusable components simple and testable      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 2: Service + BehaviorSubject (Facade + shared state)   │
│                                                                  │
│  CartService.items$ ──▶ CartComponent                           │
│                    ──▶ AppComponent ──▶ HeaderComponent         │
│                                                                  │
│  Best for: state shared across many unrelated components        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 3: @Input / @Output (parent ↔ child)                   │
│                                                                  │
│  HomeComponent ──[product]──▶ ProductCardComponent              │
│               ◀──(addToCart)── ProductCardComponent             │
│                                                                  │
│  Best for: presentational/dumb child components                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 4: combineLatest (derived reactive state)              │
│                                                                  │
│  products$ + searchTerm$ + selectedCategory$                    │
│    ──▶ filteredProducts$                                        │
│                                                                  │
│  Best for: computed/filtered views from multiple sources        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 5: OnPush Change Detection (performance)               │
│                                                                  │
│  ProductCardComponent  ChangeDetectionStrategy.OnPush           │
│  HeaderComponent       ChangeDetectionStrategy.OnPush           │
│                                                                  │
│  Rule: always use immutable updates (spread, not mutate)        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Pattern 6: Repository (ProductService) + trackBy               │
│                                                                  │
│  ProductService hides HTTP transport from components            │
│  trackBy: trackByProductId stops unnecessary DOM re-creation    │
│                                                                  │
│  Best for: clean data access layer + performant lists           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔷 Without NgRx vs With NgRx — Quick Comparison

| Concern | Without NgRx (current) | With NgRx |
|---|---|---|
| Where state lives | `BehaviorSubject` inside service | NgRx Store (Redux pattern) |
| How to update state | Call service method (`.next()`) | Dispatch an `Action` |
| How to read state | Subscribe to service Observable | Use a `Selector` |
| Side effects (HTTP) | Inside service or component | NgRx `Effects` |
| Facade | Plain service wrapping BehaviorSubject | Service wrapping `store.dispatch/select` |
| Repository | Plain service wrapping `HttpClient` | Same — repository sits below effects |
| Dev tools support | No time-travel debugging | Full Redux DevTools support |
| Boilerplate | Low — simpler to set up | Higher — actions, reducers, selectors, effects |
| Best for | Small–medium apps | Large apps with complex shared state |

---

## ✅ What This Codebase Does Well (Without NgRx)

1. **Smart/Dumb separation** — pages own logic; `ProductCardComponent` and `HeaderComponent` are purely presentational
2. **Facade pattern** — `CartService` and `LoadingService` hide internal `BehaviorSubject` state behind a clean API
3. **Repository pattern** — `ProductService` isolates HTTP transport; swapping backends requires no component changes
4. **Encapsulates mutation** — only `CartService` can modify cart state; components only read or call methods
5. **Immutable updates** — spread operator (`...`) creates new arrays/objects on every change, making OnPush safe
6. **Reactive templates** — `async` pipe handles subscribe/unsubscribe automatically, preventing memory leaks
7. **Derived streams** — `cartCount$` and `filteredProducts$` are computed from source streams, not stored separately

---

*Reference: actual source files in `src/app/services/`, `src/app/pages/`, and `src/app/components/`*
