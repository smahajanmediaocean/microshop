# 🎓 Day 1 — TypeScript Deep Dive + Angular Architecture
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | TypeScript Essentials for Angular | ~2 hrs |
| Session 2 | Angular Architecture Mental Model | ~2 hrs |
| Session 3 | Components In Depth | ~2 hrs |
| Hands-On | Build the MicroShop Homepage | ~2 hrs |

---

## 🔷 SESSION 1 — TypeScript Essentials

---

### 1️⃣ Interfaces vs Types

**The real-world mental model:**
> An **interface** is a *contract* — it says "any object claiming to be a `Product` MUST have these fields."

**Why it matters in MicroShop:**
Every product on an e-commerce site has a consistent shape — id, name, price, image. You define that contract once so your entire app agrees on what a "product" looks like.

```typescript
// ─── MicroShop Data Models ─────────────────────────────────────────────────

// Think of this as your database row shape for the products table
interface Product {
  id: number;
  name: string;           // "Nike Air Max 270"
  price: number;          // 8999
  originalPrice?: number; // 12000 (optional — only when on sale)
  imageUrl: string;
  category: string;       // "footwear"
  rating: number;         // 4.5
  stock: number;          // 23 units left
  tags: string[];         // ["sale", "trending", "new"]
}

// Use 'type' for things that are NOT object shapes:
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
// ↑ This is a UNION — "an order can only ever be one of these 5 strings"
// You can't do this with interface. Use 'type' here.

type ApiResponse<T> = {
  data: T;
  error: string | null;
  loading: boolean;
};
// ApiResponse<Product[]>  — when fetching all products
// ApiResponse<Order>      — when placing an order
```

**The rule of thumb:**
- `interface` → describes an **object** shape (Product, User, Order, CartItem)
- `type` → describes a **union**, **alias**, or **computed type** (OrderStatus, ApiResponse\<T\>)

---

### 2️⃣ Classes — Angular uses them for EVERYTHING

**The real-world mental model:**
> In React you write functions. In Angular, you write **classes** — for components, services, guards, pipes. All of them.

**Why this matters in MicroShop:**
The logic that talks to the API, manages the cart, handles auth — all live in **service classes**.

```typescript
// In React you might write:
// const useCart = () => { const [items, setItems] = useState([]); ... }

// In Angular, the same thing is a CLASS:
class CartService {
  private items: CartItem[] = [];        // private: ONLY this class can touch it
  readonly maxItems: number = 50;        // readonly: set once, never changed
  public cartCount: number = 0;          // public: anyone can read it (default)

  // Constructor injection — Angular automatically passes HttpClient in
  constructor(private http: HttpClient) {}

  addItem(product: Product): void {
    const existing = this.items.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity++;               // product already in cart → increment
    } else {
      this.items.push({ product, quantity: 1 });
    }
    this.cartCount = this.items.length;
  }

  getTotal(): number {
    return this.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  removeItem(productId: number): void {
    this.items = this.items.filter(i => i.product.id !== productId);
  }
}
```

**Access modifier cheat sheet for MicroShop:**

| Modifier | MicroShop Example | Who can access it |
|---|---|---|
| `public` | `cartCount` — header badge reads it | Anyone |
| `private` | `items` array — cart internals | Only CartService |
| `readonly` | `maxItems = 50` — business rule | Set once at creation |
| `constructor(private http)` | Shorthand declare + assign | Declared AND assigned in one line |

---

### 3️⃣ Decorators — Angular's Magic Labels

**The real-world mental model:**
> A decorator is like a **job title badge**. `@Component` tells Angular "this class is a UI component". `@Injectable` tells Angular "this class can be injected as a dependency". Angular reads these badges at startup and wires everything together.

**MicroShop example — what each decorator does:**

```typescript
// ── @Component ────────────────────────────────────────────────────────────
// Tells Angular: "This class is a visual UI block — give it a selector and template"
@Component({
  selector: 'app-product-card',          // Use as <app-product-card /> in HTML
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss'],
})
export class ProductCardComponent { ... }

// ── @Injectable ───────────────────────────────────────────────────────────
// Tells Angular: "This class provides a service — make it injectable everywhere"
@Injectable({ providedIn: 'root' })      // 'root' = one singleton for entire app
export class ProductService { ... }

// ── @Input ────────────────────────────────────────────────────────────────
// Tells Angular: "This property receives data FROM a parent component"
// Equivalent to React props
export class ProductCardComponent {
  @Input() product!: Product;            // Parent passes: <app-product-card [product]="p" />
  @Input() showBadge: boolean = true;    // Optional with default
}

// ── @Output ───────────────────────────────────────────────────────────────
// Tells Angular: "This property SENDS events UP to the parent component"
// Equivalent to React callback props
export class ProductCardComponent {
  @Output() addToCart = new EventEmitter<Product>();
  @Output() wishlist  = new EventEmitter<number>();  // emits product id

  onAddToCart(): void {
    this.addToCart.emit(this.product);   // fires the event upward
  }
}
```

**MicroShop data flow visualised:**

```
HomeComponent (parent)
│
│  passes product down ──────────────────────────────────────────────►
│  [product]="item"                         ProductCardComponent
│                                           @Input() product
│                                           @Output() addToCart
│  ◄─────────────────────────────────────── fires event upward
│  (addToCart)="onAddToCart($event)"
│
▼
CartService.addItem(product)
```

---

### 4️⃣ Generics — Write Once, Work With Any Type

**The real-world mental model:**
> A **generic** is a placeholder for a type. Like a template that says "I'll work with whatever type you give me — just tell me what it is."

**MicroShop example:**

```typescript
// Without generics — you'd write this 5 times for each model:
function handleProductResponse(response: { data: Product[]; error: string | null }) { ... }
function handleOrderResponse(response: { data: Order; error: string | null }) { ... }
// Terrible duplication ☝

// WITH generics — write once, use for everything:
interface ApiResponse<T> {
  data: T;
  error: string | null;
  loading: boolean;
}

// Now use it for any model:
const productsResponse: ApiResponse<Product[]> = { data: [], error: null, loading: false };
const orderResponse:    ApiResponse<Order>      = { data: order, error: null, loading: false };
const userResponse:     ApiResponse<User>       = { data: user, error: null, loading: false };

// Angular's HttpClient uses generics the same way:
// When you say http.get<Product[]>('/api/products')
// Angular says: "I'll make a GET request, and the response will be typed as Product[]"
this.http.get<Product[]>('/api/products')      // TS knows: response is Product[]
this.http.get<User>('/api/users/me')            // TS knows: response is User
this.http.post<Order>('/api/orders', body)      // TS knows: response is Order
```

---

### 5️⃣ Enums — Named Constants for Fixed Sets of Values

**The real-world mental model:**
> An enum is like a **dropdown with fixed options**. An order can only be in a known set of states. A user can only have a known set of roles. Don't use magic strings.

**MicroShop example:**

```typescript
// ── Order lifecycle ────────────────────────────────────────────────────────
enum OrderStatus {
  Pending   = 'PENDING',      // just placed, not yet confirmed
  Confirmed = 'CONFIRMED',    // payment successful
  Packed    = 'PACKED',       // warehouse packed it
  Shipped   = 'SHIPPED',      // out for delivery
  Delivered = 'DELIVERED',    // customer received
  Cancelled = 'CANCELLED',    // cancelled by user or system
}

// ── User roles ────────────────────────────────────────────────────────────
enum UserRole {
  Customer = 'CUSTOMER',      // regular shopper
  Seller   = 'SELLER',        // merchant listing products
  Admin    = 'ADMIN',         // platform admin
}

// Usage in components:
class OrderCardComponent {
  @Input() order!: Order;

  get statusLabel(): string {
    switch (this.order.status) {
      case OrderStatus.Shipped:   return '🚚 On the way';
      case OrderStatus.Delivered: return '✅ Delivered';
      case OrderStatus.Cancelled: return '❌ Cancelled';
      default:                    return '⏳ Processing';
    }
  }
}
```

**Why not just use strings?**
With enums, if you type `OrderStatus.Shiped` (typo) → TypeScript **catches it at compile time**.
With plain strings `"SHIPED"` → silent bug that reaches production. 😬

---

## 🔷 SESSION 2 — Angular Architecture Mental Model

---

### Angular vs React — The Big Picture

**The real-world mental model:**

> Think of **React** like buying individual IKEA parts — you pick your routing library, state manager, HTTP client, form library. Flexible but you assemble it all yourself.
> Think of **Angular** like buying a **fully furnished apartment** — routing, HTTP, forms, DI are already built in and follow one opinionated pattern. Less choice, much faster to get production-ready.

```
Your MicroShop in React:              Your MicroShop in Angular:
──────────────────────────            ──────────────────────────────────────
React (UI)                            Angular (Full Framework)
+ React Router (routing)              ✅ Angular Router    — built in
+ Redux Toolkit (state)               ✅ NgRx / Signals    — built in ecosystem
+ Axios (HTTP)                        ✅ HttpClient        — built in
+ React Hook Form (forms)             ✅ Reactive Forms    — built in
+ Context API (DI)                    ✅ Dependency Injection — built in
You wire them all together            Angular wires them for you
```

---

### The 6 Building Blocks of MicroShop in Angular

```
MicroShop Angular App
│
├── 📦 NgModule (AppModule)
│     "The registration office — every component/pipe/directive
│      must be declared here before Angular can use it"
│
├── 🧩 Components       → ProductCardComponent, HeaderComponent, CartComponent
│     "Visual building blocks — like React function components"
│
├── ⚙️  Services         → ProductService, CartService, AuthService
│     "Business logic & data layer — like React custom hooks but as classes"
│
├── 🔀 Router           → /home, /products, /products/:id, /cart, /checkout
│     "Built-in — no react-router needed"
│
├── 💉 DI Injector      → Automatically provides CartService to any component
│     "Like React Context but automatic — just ask in the constructor"
│
└── 🌊 RxJS             → Streams of products, cart updates, search results
      "Angular's async engine — replaces Promises + useEffect"
```

---

### Angular's Building Blocks — React & AngularJS Comparison

| Concept | React Equivalent | AngularJS Equivalent |
|---------|-----------------|----------------------|
| **Component** | Function component | Directive + Controller + Template |
| **Service** | Custom hook / Context | Service / Factory |
| **Module (NgModule)** | No direct equivalent | Module (`angular.module`) |
| **Dependency Injection** | `useContext` (manual) | DI (automatic, like Angular 2+) |
| **Template** | JSX | HTML template with `ng-*` directives |
| **Decorator `@Input`** | Props | `@` scope binding in AngularJS |
| **Decorator `@Output`** | Callback props | `&` scope binding in AngularJS |
| **RxJS Observable** | Promise / useEffect | `$http` promises / `$watch` |
| **Pipe** | No direct equivalent | `filter` / `currency` in AngularJS |
| **Guard** | React Router `loader` / HOC | `resolve` in AngularJS router |

---

### The MicroShop File Structure Explained

```
microshop/
├── src/app/
│   │
│   ├── app.module.ts          ← The registration list (declares ALL components)
│   ├── app.component.ts       ← Root shell (like your React <App /> — renders <router-outlet>)
│   ├── app-routing.module.ts  ← Route table (/home → HomeComponent, etc.)
│   │
│   ├── pages/                 ← Full-page components (loaded by router)
│   │   ├── home/              ← / → Homepage with product grid
│   │   ├── product-detail/    ← /products/:id
│   │   ├── cart/              ← /cart
│   │   └── checkout/          ← /checkout
│   │
│   ├── components/            ← Reusable UI pieces (used inside pages)
│   │   ├── header/            ← Logo + nav + cart badge
│   │   ├── footer/            ← Links + copyright
│   │   ├── product-card/      ← The product tile on the grid
│   │   └── product-search/    ← Search box with live results
│   │
│   ├── services/              ← Business logic
│   │   ├── product.service.ts ← Fetch products from API
│   │   ├── cart.service.ts    ← Add/remove/calculate cart
│   │   └── auth.service.ts    ← Login/logout/token
│   │
│   └── models/                ← TypeScript interfaces
│       ├── product.ts         ← Product, Category interfaces
│       ├── order.ts           ← Order, OrderItem interfaces
│       └── user.ts            ← User, Address interfaces
```

---

### `app.module.ts` — The Registration Office

```typescript
// Every component you create MUST be declared here.
// Angular won't recognise <app-product-card> in any template
// unless ProductCardComponent is declared in a module.

@NgModule({
  declarations: [
    AppComponent,
    // ↓ As you build MicroShop, these get added:
    HeaderComponent,
    FooterComponent,
    ProductCardComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,          // Needed for *ngIf, *ngFor in browser
    AppRoutingModule,       // Our route table
    FormsModule,            // Needed for [(ngModel)] two-way binding
    HttpClientModule,       // Needed for making HTTP calls
  ],
  providers: [],            // Services are self-registered via @Injectable({providedIn:'root'})
  bootstrap: [AppComponent] // The first component Angular renders
})
export class AppModule {}
```

> 💡 **`ng g c components/header`** — running this CLI command **automatically** adds `HeaderComponent` to the declarations array. You don't have to do it manually.

---

### Scaffolding the App

```bash
cd C:\workspace\Angular-app

# Create the main learning project
ng new microshop --routing --style=scss --standalone=false
cd microshop

ng serve
# Open: http://localhost:4200
```

---

## 🔷 SESSION 3 — Components In Depth

---

### Lifecycle Hooks — The Component's Birth → Death

**The real-world mental model for MicroShop:**

```
User visits /products
      │
      ▼
ProductListComponent is CREATED
      │
      ├── constructor()         → DI injects ProductService (don't fetch data here)
      │
      ├── ngOnChanges()         → If any @Input arrived from parent (runs first if @Inputs exist)
      │
      ├── ngOnInit()            → ✅ FETCH PRODUCTS FROM API HERE
      │                            like useEffect(() => { fetchProducts() }, [])
      │
      ├── ngAfterViewInit()     → DOM is fully ready (use for charts, focus, 3rd party libs)
      │
      │   ... user interacts, @Inputs change → ngOnChanges() fires again ...
      │
User leaves /products (navigates to /cart)
      │
      └── ngOnDestroy()         → ✅ CANCEL SUBSCRIPTIONS / CLEANUP HERE
                                   like useEffect(() => () => cleanup, [])
```

**React Hooks vs Angular Lifecycle — Quick Map:**

```
React Hooks                          Angular Lifecycle Hooks
─────────────────────────────        ───────────────────────────────────────
Component renders (first)      ←→   ngOnInit()         — after first render
useEffect(() => {}, [x])       ←→   ngOnChanges()      — when @Input changes
useEffect(() => {}, [])        ←→   ngOnInit()
useEffect(() => () => {}, [])  ←→   ngOnDestroy()      — cleanup
(no equivalent)                ←→   ngAfterViewInit()  — after DOM is ready
```

**MicroShop concrete examples:**

```typescript
// ── ProductListComponent — fetches data on page load ──────────────────────
@Component({ selector: 'app-product-list', templateUrl: './product-list.html' })
export class ProductListComponent implements OnInit, OnDestroy {

  products: Product[] = [];
  private subscription!: Subscription;

  constructor(private productService: ProductService) {
    // ❌ DON'T fetch here — DI isn't fully ready yet
  }

  ngOnInit(): void {
    // ✅ Fetch products when the page loads
    // Real-world: GET https://fakestoreapi.com/products
    this.subscription = this.productService.getAll()
      .subscribe(products => this.products = products);
  }

  ngOnDestroy(): void {
    // ✅ When user leaves the page, cancel the HTTP subscription
    // Prevents memory leaks — just like cleaning up useEffect in React
    this.subscription.unsubscribe();
  }
}

// ── ProductCardComponent — reacts to @Input changes ───────────────────────
@Component({ selector: 'app-product-card', templateUrl: './product-card.html' })
export class ProductCardComponent implements OnChanges {

  @Input() product!: Product;
  discount: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    // Fires every time the parent passes a new product object
    // Real-world: user changes sort order → parent passes new product objects
    if (changes['product'] && this.product.originalPrice) {
      this.discount = Math.round(
        ((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100
      );
      // → "33% OFF" badge on the product card
    }
  }
}
```

---

### Template Syntax — The 6 Bindings

Every piece of template syntax maps to something you already know from React:

---

#### 1. Interpolation `{{ }}` → React's `{expression}`

```html
<!-- MicroShop product card template -->
<h3>{{ product.name }}</h3>                    <!-- "Nike Air Max 270" -->
<span>₹{{ product.price }}</span>              <!-- "₹8999" -->
<span *ngIf="product.stock < 5">
  Only {{ product.stock }} left!               <!-- "Only 3 left!" -->
</span>
```

---

#### 2. Property Binding `[prop]="value"` → React's `prop={value}`

```html
<!-- Passes data INTO an element or child component -->
<img [src]="product.imageUrl" [alt]="product.name" />

<!-- Passes product object INTO child component (like React props) -->
<app-product-card [product]="item" [showBadge]="isOnSale" />

<!-- Disables the button when cart is full -->
<button [disabled]="cartService.isFull()">Add to Cart</button>
```

---

#### 3. Event Binding `(event)="handler()"` → React's `onClick={handler}`

```html
<!-- User clicks "Add to Cart" button -->
<button (click)="onAddToCart()">Add to Cart</button>

<!-- User types in search box → live search fires -->
<input (input)="onSearch($event)" placeholder="Search products..." />

<!-- User presses Enter in search box -->
<input (keyup.enter)="onSearchSubmit()" />

<!-- Hover over product image → show zoom preview -->
<img (mouseenter)="showPreview = true" (mouseleave)="showPreview = false" />
```

---

#### 4. Two-way Binding `[(ngModel)]` → React has NO equivalent (one-way only)

```html
<!-- Quantity selector on cart page — changing input updates component AND vice versa -->
<input [(ngModel)]="item.quantity" type="number" min="1" max="10" />

<!-- Search input that auto-clears when user clicks X button -->
<input [(ngModel)]="searchTerm" placeholder="Search..." />
<button (click)="searchTerm = ''">✕ Clear</button>

<!-- [(ngModel)] is shorthand for: -->
<input [value]="searchTerm" (input)="searchTerm = $event.target.value" />
```

---

#### 5. Structural Directives `*ngIf` / `*ngFor` / `*ngSwitch`

```html
<!-- *ngIf → like {condition && <Component />} in React -->

<!-- Show sale badge only if discount exists -->
<div class="badge" *ngIf="product.originalPrice">SALE</div>

<!-- Show out-of-stock overlay OR add-to-cart button -->
<div *ngIf="product.stock === 0; else inStock" class="out-of-stock">
  Out of Stock
</div>
<ng-template #inStock>
  <button (click)="onAddToCart()">Add to Cart</button>
</ng-template>

<!-- *ngFor → like products.map(p => <ProductCard key={p.id} />) -->
<app-product-card
  *ngFor="let product of products; trackBy: trackById"
  [product]="product"
  (addToCart)="onAddToCart($event)">
</app-product-card>

<!-- *ngSwitch → order status badge with different colours -->
<div [ngSwitch]="order.status">
  <span *ngSwitchCase="'SHIPPED'"   class="badge blue">🚚 Shipped</span>
  <span *ngSwitchCase="'DELIVERED'" class="badge green">✅ Delivered</span>
  <span *ngSwitchCase="'CANCELLED'" class="badge red">❌ Cancelled</span>
  <span *ngSwitchDefault            class="badge grey">⏳ Processing</span>
</div>
```

---

#### 6. Class & Style Binding

```html
<!-- Toggle "active" class on selected category filter button -->
<button
  *ngFor="let cat of categories"
  [class.active]="selectedCategory === cat"
  (click)="selectedCategory = cat">
  {{ cat }}
</button>

<!-- Product card — multiple conditional classes -->
<div [ngClass]="{
  'product-card': true,
  'out-of-stock': product.stock === 0,
  'on-sale':      product.originalPrice > product.price,
  'trending':     product.tags.includes('trending')
}">
```

---

### Content Projection `<ng-content>` → React's `children`

**Real-world MicroShop use case:** A reusable `CardComponent` wrapper used for product cards, order summary cards, and user profile cards — all sharing the same card shell (border, shadow, padding) but with different inner content.

```typescript
// A generic card shell — reused across MicroShop
@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <!-- Named slot: header area (title, badge, image etc.) -->
      <div class="card-header">
        <ng-content select="[card-header]"></ng-content>
      </div>

      <!-- Default slot: main content goes here -->
      <div class="card-body">
        <ng-content></ng-content>
      </div>

      <!-- Named slot: action buttons (Add to Cart, View Details, etc.) -->
      <div class="card-footer">
        <ng-content select="[card-footer]"></ng-content>
      </div>
    </div>
  `
})
export class CardComponent {}
```

```html
<!-- Product Card uses the shell: -->
<app-card>
  <div card-header>
    <span class="badge" *ngIf="product.originalPrice">33% OFF</span>
    <img [src]="product.imageUrl" [alt]="product.name" />
  </div>

  <!-- default slot content: -->
  <h3>{{ product.name }}</h3>
  <p class="price">₹{{ product.price }}</p>
  <p class="rating">⭐ {{ product.rating }}</p>

  <div card-footer>
    <button (click)="onAddToCart()">Add to Cart</button>
    <button (click)="onWishlist()">♡</button>
  </div>
</app-card>

<!-- Order Summary Card reuses the SAME shell: -->
<app-card>
  <div card-header>Order #12345 — Placed 14 Jul 2026</div>

  <app-order-item *ngFor="let item of order.items" [item]="item" />

  <div card-footer>
    <strong>Total: ₹{{ order.total }}</strong>
    <button>Track Order</button>
  </div>
</app-card>
```

---

## 🏗️ How Everything Connects in MicroShop

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MicroShop App                                │
│                                                                     │
│  AppModule (registers all components + imports)                     │
│       │                                                             │
│       ├── AppComponent (root shell, has <router-outlet>)            │
│       │       │                                                     │
│       │       ├── HeaderComponent                                   │
│       │       │     • @Input() cartCount: number                    │
│       │       │     • shows badge with cart item count              │
│       │       │                                                     │
│       │       ├── <router-outlet>  ← Router puts pages here         │
│       │       │       │                                             │
│       │       │       └── HomeComponent (page)                      │
│       │       │               │                                     │
│       │       │               │  products: Product[]  (interface)   │
│       │       │               │                                     │
│       │       │               └── ProductCardComponent  ×N          │
│       │       │                     @Input()  product: Product       │
│       │       │                     @Output() addToCart              │
│       │       │                     ngOnChanges() → calc discount   │
│       │       │                     template: {{ }}, *ngIf, *ngFor  │
│       │       │                                                     │
│       │       └── FooterComponent                                   │
│       │                                                             │
│       └── Services (injected via DI — no manual wiring)             │
│               ├── ProductService  @Injectable({providedIn:'root'})  │
│               └── CartService     @Injectable({providedIn:'root'})  │
│                                                                     │
│  TypeScript models living in /models:                               │
│    interface Product   ← interfaces                                 │
│    interface CartItem  ← interfaces                                 │
│    enum OrderStatus    ← enums                                      │
│    type ApiResponse<T> ← generics                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Day 1 Hands-On — Step by Step Build Plan

### Step 1: TypeScript Playground (Session 1)

```bash
mkdir C:\workspace\Angular-app\ts-playground
cd C:\workspace\Angular-app\ts-playground
npm init -y
npm install typescript ts-node --save-dev
npx tsc --init
```

Create `src/models.ts` and define:
- `interface Product` with all fields
- `interface CartItem` with `product` + `quantity`
- `interface Cart` with `items` + `get total()` getter
- `interface User` with `id`, `email`, `role`, `createdAt`
- `enum OrderStatus` with all lifecycle values
- `enum UserRole` with Customer, Seller, Admin
- `type ApiResponse<T>` generic

Run with: `npx ts-node src/models.ts`

---

### Step 2: Scaffold the Angular App (Session 2)

```bash
cd C:\workspace\Angular-app
ng new microshop --routing --style=scss --standalone=false
cd microshop
ng serve
# Open http://localhost:4200
```

---

### Step 3: Generate All Components (Session 2 + 3)

```bash
# Models
ng g interface models/product
ng g interface models/cart-item

# Pages (loaded by router — full-screen views)
ng g c pages/home

# Components (reusable UI pieces)
ng g c components/header
ng g c components/footer
ng g c components/product-card
ng g c components/card
```

---

### Step 4: Build It Out

**`product.model.ts`** — copy your TypeScript playground interfaces here

**`header.component.ts`**
- Logo text "MicroShop"
- Nav links: Home, Products, Orders
- Cart icon with `@Input() cartCount: number` badge

**`product-card.component.ts`**
- `@Input() product: Product`
- `@Output() addToCart = new EventEmitter<Product>()`
- `ngOnChanges()` → calculate discount % if `originalPrice` exists
- Template: image, name, price, rating stars, Add to Cart button

**`home.component.ts`**
- Hardcoded `products: Product[]` array (6 items)
- `onAddToCart(product: Product)` handler
- Template: `*ngFor` loop rendering `<app-product-card>`

**`app-routing.module.ts`**
```typescript
const routes: Routes = [
  { path: '',        redirectTo: '/home', pathMatch: 'full' },
  { path: 'home',    component: HomeComponent },
  { path: '**',      redirectTo: '/home' },
];
```

---

## 🔄 Application Flow — Boot to Render

### Step-by-step: what happens when browser hits `localhost:4200`

```
Browser requests localhost:4200
        │
        ▼
Angular boots up — reads main.ts → bootstrapModule(AppModule)
        │
        ▼
AppModule (app.module.ts)
  declarations: [AppComponent, HomeComponent, HeaderComponent, ProductCardComponent, ...]
  imports:      [BrowserModule, AppRoutingModule]
  bootstrap:    [AppComponent]   ← Angular renders this first
        │
        ▼
AppComponent renders — template is just:
  <router-outlet />              ← empty slot, nothing visible yet
        │
        ▼
AppRoutingModule sees URL = "/"
  { path: '',   redirectTo: '/home', pathMatch: 'full' }  ← URL becomes "/home"
  { path: 'home', component: HomeComponent }              ← HomeComponent injected
        │
        ▼
HomeComponent renders inside <router-outlet />:
  ├── <app-header [cartCount]="cartCount">
  │     └── logo + nav links + 🛒 badge
  └── <div class="product-grid">
        └── *ngFor × 6 → <app-product-card [product]="p">
                            image, name, price, rating, button
```

---

### How `<router-outlet />` works

`<router-outlet />` is an **empty slot** — a marker in the DOM. Angular's Router watches the URL and **dynamically injects** the matching component right after it.

```
BEFORE route match:          AFTER route match (/home):

<app-root>                   <app-root>
  <router-outlet />            <router-outlet />
</app-root>                    <!-- HomeComponent injected HERE as sibling -->
                               <app-home>
                                 <app-header>...</app-header>
                                 <div class="product-grid">...</div>
                               </app-home>
                             </app-root>
```

> `<router-outlet />` itself **never disappears**. The component appears **after** it as a sibling in the DOM, not inside it.

---

### Routing rules — Angular reads top to bottom, first match wins

```typescript
const routes: Routes = [
  { path: '',      redirectTo: '/home', pathMatch: 'full' }, // "/" → redirect to "/home"
  { path: 'home',  component: HomeComponent },               // "/home" → render HomeComponent
  { path: '**',    redirectTo: '/home' },                    // anything else → fallback to "/home"
];
```

---

### "Add to Cart" event chain

```
User clicks "Add to Cart" button in ProductCardComponent
        │
        ▼
(click)="onAddToCart()" fires inside ProductCardComponent
        │
        ▼
this.addToCart.emit(this.product)     ← @Output fires event UP to parent
        │
        ▼
HomeComponent catches: (addToCart)="onAddToCart($event)"
        │
        ▼
onAddToCart(product) { this.cartCount++ }
        │
        ▼
Angular detects cartCount changed → re-evaluates [cartCount]="cartCount"
        │
        ▼
HeaderComponent receives new value via @Input → badge updates: 🛒 1
```

**Key rule: data flows DOWN via `@Input`, events flow UP via `@Output`**

---

### Full component tree at runtime

```
AppComponent  ← always alive, never destroyed (permanent shell)
│
└── <router-outlet />  ← the "screen" — shows different page per URL
        │
        ├── URL: /home      → HomeComponent
        │       ├── HeaderComponent        (@Input cartCount)
        │       └── ProductCardComponent ×6 (@Input product, @Output addToCart)
        │
        ├── URL: /products  → ProductListComponent   (Day 2)
        ├── URL: /cart      → CartComponent           (Day 2)
        └── URL: /checkout  → CheckoutComponent       (Day 2)
```

> **SPA key insight:** `AppComponent` never reloads. Only what's inside `<router-outlet />` swaps out on navigation — no full page refresh.

---

## ✅ End-of-Day Checklist

- [ ] TypeScript playground running — all interfaces, enums, and generics written
- [ ] `microshop` app scaffolded and serving on `localhost:4200`
- [ ] `HeaderComponent` renders with logo and nav links
- [ ] `ProductCardComponent` accepts `@Input() product` and emits `@Output() addToCart`
- [ ] `HomeComponent` renders 6 product cards using `*ngFor`
- [ ] Clicking "Add to Cart" triggers the event chain up to `HomeComponent`
- [ ] Route `/home` loads `HomeComponent` correctly
- [ ] Can explain decorators, `@Input`/`@Output`, and `*ngFor` in your own words

---

## 🔮 Tomorrow — Day 2 Preview

> **Day 2: NgModules, Pipes, and Custom Directives**
> - Move `ProductCardComponent` into a `SharedModule`
> - Use `| currency` and `| date` built-in pipes for price/date formatting
> - Build a custom `TruncatePipe` for product descriptions
> - Build a `HighlightDirective` that highlights product cards on hover
> - Create a `TimeAgoPipe` ("Added 2 hours ago")

---

*Day 1 of 15 — Angular Learning Journey Intensive Bootcamp*
