# 🎓 Day 2 — Services, HTTP, RxJS & Real Data
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Services & Dependency Injection | ~2 hrs |
| Session 2 | HttpClient — Fetching Real Data | ~2 hrs |
| Session 3 | RxJS Essentials for Angular | ~2 hrs |
| Hands-On | Wire API + Build Cart Page + Product Detail | ~2 hrs |

---

## 🔷 What We're Building Today

On Day 1 we hardcoded `products: Product[]` directly in `HomeComponent`.
Today we **replace that with real data** from a live API and build two new pages.

```
Day 1 (done)              Day 2 (today)
─────────────────         ─────────────────────────────────────
HomeComponent             ProductService → fetches from API
  hardcoded products[]      ↓
  basic header              HttpClient.get<Product[]>()
  no cart logic               ↓
                            RxJS Observable → HomeComponent subscribes
                            CartService → add/remove/total logic
                            CartComponent → /cart page
                            ProductDetailComponent → /products/:id
```

---

## 🔷 SESSION 1 — Services & Dependency Injection

---

### 1️⃣ What is a Service?

**The real-world mental model:**
> A **service** is a class that handles **logic and data** — not UI. Think of it as the "brain" behind the component's "face".
> In React you'd write a custom hook (`useProducts`, `useCart`). In Angular, the same thing is a **service class** that Angular manages for you.

**Why MicroShop needs services:**
Components are dumb UI pieces — they should only know how to display data.
Services own the business rules: fetching products, managing the cart, checking auth.

```
Without services (❌ wrong way):           With services (✅ right way):
──────────────────────────────────         ────────────────────────────────────
HomeComponent                              HomeComponent
  fetch products ← HTTP logic here           asks ProductService for products
  manage cart    ← business logic here       asks CartService to add item
  handle auth    ← auth logic here           asks AuthService to check login
  render UI      ← UI logic here             renders UI — that's ALL it does
```

---

### 2️⃣ Creating Services

```typescript
// Generate with CLI — automatically adds @Injectable and registers it:
// ng g service services/product
// ng g service services/cart

// ── ProductService ────────────────────────────────────────────────────────
// @Injectable({ providedIn: 'root' }) means:
//   → Angular creates ONE instance of this class for the entire app (singleton)
//   → Any component that asks for ProductService gets the SAME instance
//   → Like React Context but automatic — no Provider wrapper needed

@Injectable({ providedIn: 'root' })
export class ProductService {

  // Angular injects HttpClient automatically — you just declare it
  constructor(private http: HttpClient) {}

  // Returns an Observable — a stream that will emit Product[] when API responds
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>('https://fakestoreapi.com/products');
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`https://fakestoreapi.com/products/${id}`);
  }

  getByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(
      `https://fakestoreapi.com/products/category/${category}`
    );
  }
}
```

```typescript
// ── CartService ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CartService {

  // BehaviorSubject = an Observable that:
  //   1. holds the current value (starts as [])
  //   2. emits the current value to any new subscriber immediately
  //   3. emits a new value whenever you call .next()
  private items$ = new BehaviorSubject<CartItem[]>([]);

  // Public read-only stream — components subscribe to this
  // They can READ but cannot call .next() — encapsulation
  cartItems$ = this.items$.asObservable();

  // Derived stream — auto-calculates count whenever items change
  cartCount$ = this.items$.pipe(
    map(items => items.reduce((sum, i) => sum + i.quantity, 0))
  );

  addItem(product: Product): void {
    const current = this.items$.getValue();            // get current array
    const existing = current.find(i => i.product.id === product.id);

    if (existing) {
      // Product already in cart — increment quantity
      const updated = current.map(i =>
        i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1 }   // spread: create new object
          : i
      );
      this.items$.next(updated);                       // emit new array
    } else {
      // New product — add to cart
      this.items$.next([...current, { product, quantity: 1 }]);
    }
  }

  removeItem(productId: number): void {
    const updated = this.items$.getValue()
      .filter(i => i.product.id !== productId);
    this.items$.next(updated);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    const updated = this.items$.getValue().map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    this.items$.next(updated);
  }

  getTotal(): number {
    return this.items$.getValue()
      .reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  clearCart(): void {
    this.items$.next([]);
  }
}
```

---

### 3️⃣ Why BehaviorSubject in CartService but Observable in ProductService?

**The key difference: Who owns the data?**

#### `ProductService` → Observable
```typescript
getAll(): Observable<Product[]> {
  return this.http.get<Product[]>(...); // data lives on the SERVER
}
```
- Products live **on the server** — the service just fetches them
- Data flows **one way**: API → Component
- Service doesn't need to **store or modify** anything
- Each call is a fresh HTTP request → Observable is perfect

#### `CartService` → BehaviorSubject
```typescript
private items$ = new BehaviorSubject<CartItem[]>([]); // data lives HERE
```
- Cart lives **in memory** (in the service itself)
- Data is **mutated** by multiple actions: `addItem`, `removeItem`, `updateQuantity`
- **Multiple components** need the same live cart state:
  - `HeaderComponent` → shows cart count badge
  - `CartComponent` → shows cart items
  - `HomeComponent` → adds items to cart
- All three react instantly when cart changes → BehaviorSubject emits to all subscribers automatically

**Rule of Thumb:**

| Scenario | Use |
|---|---|
| Fetching data from an API (one-time) | `Observable` (HttpClient) |
| Managing shared in-memory state | `BehaviorSubject` |
| One component needs data | `Observable` |
| Multiple components share & react to same data | `BehaviorSubject` |

> 💡 **Observable** = *"Go fetch this from somewhere"*
> **BehaviorSubject** = *"I am the source of truth — subscribe and I'll keep you updated"*

---

### 4️⃣ Dependency Injection — How Angular Wires It All

**The real-world mental model:**
> DI is Angular saying: *"You asked for a `ProductService`? I've already made one. Here it is."*
> You don't `new ProductService()` — Angular manages the lifecycle and hands it to you.

```typescript
// ── Without DI (what you'd do in plain JS): ───────────────────────────────
class HomeComponent {
  productService = new ProductService(new HttpClient(...)); // ❌ you wire it manually
}

// ── With Angular DI (what you actually write): ────────────────────────────
class HomeComponent {
  constructor(private productService: ProductService) {}
  // ↑ Angular sees this, finds the ProductService singleton, passes it in
  // You don't new anything. Angular handles it.
}
```

**React vs Angular DI:**

| Concept | React | Angular |
|---|---|---|
| Share logic across components | Custom hook in each component | Service injected via constructor |
| Shared state | Context + Provider wrapping | BehaviorSubject in service |
| One instance for whole app | Context at root level | `providedIn: 'root'` singleton |
| Who manages the instance | You (useState, useContext) | Angular's injector |

**The DI flow in MicroShop:**

```
Angular Injector (the "warehouse")
│
│  holds one instance of each service:
│  ├── ProductService (with HttpClient inside it)
│  ├── CartService    (with BehaviorSubject inside it)
│  └── AuthService    (with token management inside it)
│
├── HomeComponent asks:   constructor(private ps: ProductService)
│   Angular gives it  →   the SAME ProductService instance
│
├── ProductDetailComponent asks: constructor(private ps: ProductService)
│   Angular gives it  →   the SAME ProductService instance
│
└── CartComponent asks:   constructor(private cs: CartService)
    Angular gives it  →   the SAME CartService instance
    (same cart state as what HomeComponent modified!)
```

---

## 🔷 SESSION 2 — HttpClient & Fetching Real Data

---

### 1️⃣ Setting Up HttpClient

**`app.module.ts`** — import `HttpClientModule` once, use everywhere:

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,   // ← add this — enables http.get/post/put/delete
  ],
})
export class AppModule {}
```

> 💡 You import `HttpClientModule` **once in AppModule**. Every service that injects `HttpClient` in its constructor now works — no per-component setup needed.

---

### 2️⃣ Making HTTP Calls

**The real-world mental model:**
> `http.get<T>(url)` does NOT make the request immediately.
> It returns an **Observable** — a recipe for making the request.
> The request only fires when something **subscribes** to it.
> This is different from `fetch()` / `axios.get()` which fire immediately.

```typescript
// ── GET — fetch all products ───────────────────────────────────────────────
getAll(): Observable<Product[]> {
  return this.http.get<Product[]>('https://fakestoreapi.com/products');
  // <Product[]> tells TypeScript: "the JSON response will be an array of Product"
}

// ── GET — fetch one product by id ─────────────────────────────────────────
getById(id: number): Observable<Product> {
  return this.http.get<Product>(`https://fakestoreapi.com/products/${id}`);
}

// ── POST — place an order ──────────────────────────────────────────────────
placeOrder(order: Partial<Order>): Observable<Order> {
  return this.http.post<Order>('https://fakestoreapi.com/carts', order);
}

// ── PUT — update cart quantity ─────────────────────────────────────────────
updateCart(cartId: number, data: Partial<Cart>): Observable<Cart> {
  return this.http.put<Cart>(`https://fakestoreapi.com/carts/${cartId}`, data);
}

// ── DELETE — remove item ───────────────────────────────────────────────────
deleteCart(cartId: number): Observable<Cart> {
  return this.http.delete<Cart>(`https://fakestoreapi.com/carts/${cartId}`);
}
```

---

### 3️⃣ Consuming HTTP in a Component

```typescript
// ── HomeComponent — subscribes to ProductService ──────────────────────────
@Component({ selector: 'app-home', templateUrl: './home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {

  products: Product[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  private subscription!: Subscription;

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.subscription = this.productService.getAll().subscribe({
      next: (products) => {          // called when API responds successfully
        this.products = products;
        this.isLoading = false;
      },
      error: (err) => {              // called if API fails
        this.errorMessage = 'Failed to load products. Please try again.';
        this.isLoading = false;
        console.error(err);
      },
      complete: () => {              // called when stream ends (HTTP auto-completes)
        console.log('Product fetch complete');
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();  // ✅ prevent memory leak
  }

  onAddToCart(product: Product): void {
    this.cartService.addItem(product);
  }
}
```

```html
<!-- home.component.html — handle all three states -->

<!-- Loading state -->
<div *ngIf="isLoading" class="loading">
  Loading products...
</div>

<!-- Error state -->
<div *ngIf="errorMessage" class="error">
  {{ errorMessage }}
</div>

<!-- Success state -->
<div *ngIf="!isLoading && !errorMessage" class="product-grid">
  <app-product-card
    *ngFor="let product of products"
    [product]="product"
    (addToCart)="onAddToCart($event)">
  </app-product-card>
</div>
```

---

### 4️⃣ Environment Variables — Base URL Config

**Why:** You don't want to hardcode `https://fakestoreapi.com` in every service. When you switch to production API, you'd have to change it in 10 places.

```typescript
// src/environments/environment.ts  (development)
export const environment = {
  production: false,
  apiUrl: 'https://fakestoreapi.com'
};

// src/environments/environment.prod.ts  (production)
export const environment = {
  production: true,
  apiUrl: 'https://api.microshop.in'    // your real backend someday
};
```

```typescript
// product.service.ts — use environment instead of hardcoded URL
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseUrl = environment.apiUrl;  // swaps automatically on ng build --prod

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }
}
```

---

## 🔷 SESSION 3 — RxJS Essentials for Angular

---

### 1️⃣ What is an Observable?

**The real-world mental model:**
> An **Observable** is like a **YouTube channel subscription**.
> - The channel (Observable) produces videos (values) over time.
> - You only receive them when you **subscribe**.
> - You can **unsubscribe** to stop receiving.
> - The channel doesn't know or care how many subscribers it has.

```
Promise (React world)               Observable (Angular world)
────────────────────────            ──────────────────────────────────────
Resolves ONCE (one value)           Can emit MULTIPLE values over time
Starts immediately on creation      Only starts when subscribed
Can't be cancelled                  Can be unsubscribed / cancelled
No retry built-in                   .retry(), .retryWhen() built in
No transformation pipeline          .pipe(map, filter, debounce, ...)
```

**MicroShop Observable examples:**

```typescript
// Emits ONE value then completes (HTTP response)
this.http.get<Product[]>('/api/products')    // emits once → [ {...}, {...}, ... ]

// Emits MANY values over time (cart updates)
this.cartService.cartItems$                   // emits every time cart changes

// Emits values on user input (search box)
fromEvent(searchInput, 'input')              // emits on every keystroke
```

---

### 2️⃣ The pipe() Operator — Transform Streams

**The real-world mental model:**
> `.pipe()` is like an **assembly line**. Raw data comes in one end, passes through
> a series of transformation stations, and processed data comes out the other end.

```typescript
// ── map — transform each emitted value ────────────────────────────────────
// Like Array.map() but for streams
this.productService.getAll().pipe(
  map(products => products.filter(p => p.rating >= 4.0))  // only high-rated products
)

// ── filter — only let certain values through ───────────────────────────────
this.cartService.cartItems$.pipe(
  filter(items => items.length > 0)   // only emit when cart is not empty
)

// ── tap — side effects without changing the stream ─────────────────────────
// Like console.log for streams — look but don't touch
this.productService.getAll().pipe(
  tap(products => console.log('Raw API response:', products)),  // debug
  map(products => products.slice(0, 6)),                        // take first 6
  tap(products => console.log('After slice:', products))        // debug after
)

// ── catchError — handle errors gracefully ─────────────────────────────────
this.productService.getAll().pipe(
  catchError(err => {
    console.error('API error:', err);
    return of([]);   // return empty array so the app doesn't crash
  })
)

// ── debounceTime — wait for user to stop typing ───────────────────────────
// Essential for search boxes — don't call API on every single keystroke
this.searchControl.valueChanges.pipe(
  debounceTime(400),              // wait 400ms after last keystroke
  distinctUntilChanged(),         // only emit if value actually changed
  switchMap(term =>               // cancel previous request, start new one
    this.productService.search(term)
  )
)
```

---

### 3️⃣ Key RxJS Operators Cheat Sheet for MicroShop

| Operator | What it does | MicroShop use case |
|---|---|---|
| `map` | Transform each value | Convert API product shape → internal Product model |
| `filter` | Drop values that don't match | Only show in-stock products |
| `tap` | Side effect, pass through | Console log, set loading flag |
| `catchError` | Handle errors, return fallback | Return `[]` if API fails |
| `debounceTime` | Wait N ms after last emission | Search box — don't spam API |
| `distinctUntilChanged` | Skip if same as last value | Don't re-fetch for same search term |
| `switchMap` | Cancel old, switch to new Observable | Live search — cancel stale requests |
| `combineLatest` | Combine latest from N streams | Products + filters → filtered list |
| `takeUntil` | Unsubscribe when another Observable emits | Auto-unsubscribe on component destroy |
| `of` | Create Observable from a value | Return mock data in tests |
| `forkJoin` | Wait for all Observables to complete | Load products + categories in parallel |

---

### 4️⃣ async Pipe — The Cleanest Way to Subscribe

**The real-world mental model:**
> Instead of manually calling `.subscribe()` in your TypeScript (and remembering to `.unsubscribe()`),
> you let the **template do the subscribing** with the `async` pipe.
> Angular automatically unsubscribes when the component is destroyed. Zero memory leaks.

```typescript
// ── The manual way (more boilerplate): ────────────────────────────────────
@Component({...})
export class HomeComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  private sub!: Subscription;

  ngOnInit() {
    this.sub = this.productService.getAll().subscribe(p => this.products = p);
  }
  ngOnDestroy() { this.sub.unsubscribe(); }   // easy to forget!
}
```

```typescript
// ── The async pipe way (recommended): ─────────────────────────────────────
@Component({...})
export class HomeComponent {
  // Just assign the Observable — don't subscribe yet
  products$ = this.productService.getAll();
  cartCount$ = this.cartService.cartCount$;

  constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {}
  // No ngOnInit, no ngOnDestroy, no subscription management needed ✅
}
```

```html
<!-- home.component.html — async pipe subscribes + auto-unsubscribes -->
<app-header [cartCount]="cartCount$ | async"></app-header>

<div *ngIf="products$ | async as products; else loading">
  <app-product-card
    *ngFor="let product of products"
    [product]="product"
    (addToCart)="onAddToCart($event)">
  </app-product-card>
</div>

<ng-template #loading>
  <p>Loading products...</p>
</ng-template>
```

> 💡 `products$ | async as products` — subscribes to the Observable and assigns the emitted value to local variable `products` for use in the template.

---

### 5️⃣ Pipes — Formatting Data in Templates

**The real-world mental model:**
> A **pipe** transforms a value for display only — it doesn't change the underlying data.
> `product.price` stays `8999` in your component. `{{ product.price | currency:'INR' }}` just shows `₹8,999.00`.

```html
<!-- ── Built-in Angular Pipes ─────────────────────────────────────────── -->

<!-- currency — format price -->
{{ product.price | currency:'INR':'symbol':'1.0-0' }}
<!-- → ₹8,999 -->

<!-- date — format dates -->
{{ order.createdAt | date:'dd MMM yyyy' }}
<!-- → 15 Jul 2026 -->

{{ order.createdAt | date:'shortTime' }}
<!-- → 2:30 PM -->

<!-- uppercase / lowercase / titlecase -->
{{ product.category | titlecase }}
<!-- → "Footwear" (not "footwear") -->

<!-- number — format with commas -->
{{ product.stock | number }}
<!-- → 1,234 -->

<!-- slice — show first N items -->
<app-product-card *ngFor="let p of products | slice:0:6" [product]="p">
</app-product-card>
<!-- → only first 6 products rendered -->

<!-- async — subscribe to Observable in template (covered above) -->
{{ cartCount$ | async }}
```

```typescript
// ── Custom Pipe — discount percentage ─────────────────────────────────────
// ng g pipe pipes/discount

@Pipe({ name: 'discount' })
export class DiscountPipe implements PipeTransform {
  transform(originalPrice: number, currentPrice: number): string {
    if (!originalPrice || originalPrice <= currentPrice) return '';
    const pct = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    return `${pct}% OFF`;
  }
}
```

```html
<!-- Using the custom pipe in product-card template -->
<span class="badge">
  {{ product.originalPrice | discount:product.price }}
</span>
<!-- → "25% OFF" -->
```

---

## 🏗️ Day 2 Hands-On — Step by Step Build Plan

---

### Step 1: Wire ProductService to HomeComponent

Replace the hardcoded `products[]` array with a real API call.

```bash
# Generate the service
cd C:\workspace\Angular-app\microshop
ng g service services/product
ng g service services/cart
```

**`product.service.ts`**
- Inject `HttpClient`
- `getAll()` → GET `https://fakestoreapi.com/products`
- `getById(id)` → GET `https://fakestoreapi.com/products/:id`

**`home.component.ts`**
- Inject `ProductService` and `CartService`
- Remove hardcoded `products[]`
- Add `products$ = this.productService.getAll()`
- Add `cartCount$ = this.cartService.cartCount$`

**`home.component.html`**
- Use `async` pipe: `*ngFor="let product of products$ | async"`
- Pass `cartCount$ | async` to header

---

### Step 2: Build CartService + CartComponent

```bash
ng g component pages/cart
```

**`cart.service.ts`**
- `BehaviorSubject<CartItem[]>` for items
- `addItem(product)`, `removeItem(id)`, `updateQuantity(id, qty)`, `clearCart()`
- `cartCount$` derived stream
- `cartTotal` getter

**`cart.component.ts`**
- Inject `CartService`
- `cartItems$ = this.cartService.cartItems$`

**`cart.component.html`**
```html
<div *ngFor="let item of cartItems$ | async">
  <img [src]="item.product.imageUrl" />
  <span>{{ item.product.name }}</span>
  <input type="number" [value]="item.quantity"
         (change)="updateQty(item.product.id, $event)" />
  <span>₹{{ item.product.price * item.quantity }}</span>
  <button (click)="remove(item.product.id)">Remove</button>
</div>

<div class="cart-total">
  <strong>Total: ₹{{ cartService.getTotal() }}</strong>
  <button routerLink="/checkout">Proceed to Checkout</button>
</div>
```

---

### Step 3: Build ProductDetailComponent

```bash
ng g component pages/product-detail
```

**`app-routing.module.ts`** — add route with URL parameter:
```typescript
{ path: 'products/:id', component: ProductDetailComponent }
```

**`product-detail.component.ts`**
```typescript
export class ProductDetailComponent implements OnInit {
  product$!: Observable<Product>;

  constructor(
    private route: ActivatedRoute,       // reads :id from the URL
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // ActivatedRoute gives you the URL params as an Observable
    this.product$ = this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),   // extract id from URL
      switchMap(id => this.productService.getById(id))  // fetch product
    );
    // When user navigates /products/1 → /products/2
    // switchMap cancels the first request and starts a new one automatically
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
  }
}
```

---

### Step 4: Update Routing Table

**`app-routing.module.ts`**
```typescript
const routes: Routes = [
  { path: '',              redirectTo: '/home',    pathMatch: 'full' },
  { path: 'home',          component: HomeComponent },
  { path: 'products/:id',  component: ProductDetailComponent },
  { path: 'cart',          component: CartComponent },
  { path: '**',            redirectTo: '/home' },
];
```

---

### Step 5: Update Header Navigation

**`header.component.html`** — use `routerLink` for SPA navigation (no page reload):

```html
<nav class="header">
  <a routerLink="/home" class="logo">🛒 MicroShop</a>

  <div class="nav-links">
    <a routerLink="/home"     routerLinkActive="active">Home</a>
    <a routerLink="/products" routerLinkActive="active">Products</a>
    <a routerLink="/orders"   routerLinkActive="active">Orders</a>
  </div>

  <a routerLink="/cart" class="cart-icon">
    🛒
    <span class="badge" *ngIf="cartCount > 0">{{ cartCount }}</span>
  </a>
</nav>
```

> `routerLinkActive="active"` — automatically adds the `active` CSS class when the current URL matches the link. Like NavLink in React Router.

---

## 🔄 Day 2 Application Flow

```
User visits /home
        │
        ▼
HomeComponent.ngOnInit()  (or async pipe subscribes)
        │
        ▼
ProductService.getAll()
        │ returns Observable<Product[]>
        ▼
HttpClient.get('https://fakestoreapi.com/products')
        │ HTTP request fires
        ▼
API responds with JSON array
        │ Observable emits Product[]
        ▼
async pipe / subscribe receives data
        │
        ▼
*ngFor renders ProductCardComponent × N

User clicks "Add to Cart"
        │
        ▼
ProductCardComponent @Output fires → HomeComponent.onAddToCart(product)
        │
        ▼
CartService.addItem(product)  → BehaviorSubject.next(updatedItems)
        │
        ▼
cartCount$ stream emits new count → Header badge updates

User clicks cart icon → navigates to /cart
        │
        ▼
Router swaps <router-outlet /> → CartComponent
        │
        ▼
CartComponent subscribes to cartService.cartItems$
        │ BehaviorSubject immediately emits current items
        ▼
*ngFor renders all cart items with quantities and total
```

---

## ✅ End-of-Day Checklist

- [ ] `ProductService.getAll()` fetches from `https://fakestoreapi.com/products`
- [ ] `HomeComponent` uses `async` pipe — no manual `.subscribe()` or hardcoded data
- [ ] `CartService` has `addItem`, `removeItem`, `updateQuantity`, `clearCart`
- [ ] Cart badge in header updates reactively when items are added
- [ ] `/cart` route renders `CartComponent` with live cart items and total
- [ ] `/products/:id` route renders `ProductDetailComponent` with correct product
- [ ] `ActivatedRoute` used to read the `:id` param in `ProductDetailComponent`
- [ ] `routerLink` used in header (no `<a href>` — that causes full page reload)
- [ ] `routerLinkActive` highlights the current nav link
- [ ] Can explain: Observable vs Promise, what `async` pipe does, why `switchMap` for route params
