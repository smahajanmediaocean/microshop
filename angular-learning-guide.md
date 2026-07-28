# Angular Learning Journey — 15-Day Intensive Bootcamp

> **Designed for:** Senior React developers (8+ years) transitioning to Angular, with prior AngularJS (v1) background.  
> **Goal:** Production-ready Angular developer in 15 days — components to enterprise architecture, RxJS to NgRx, testing to deployment.  
> **Approach:** Intensive daily sessions. Each day covers one major theme end-to-end with hands-on projects, React comparisons, and AngularJS → modern Angular bridges.  
> **Pace:** ~6–8 focused hours per day. Ideal for a dedicated sprint or study leave.

---

## 📋 How to Use This Guide

- Each day has **concepts to learn**, **hands-on projects**, and **React comparisons**
- Build a **running app at the end of each phase** — not just exercises
- The overall project is a **full-featured e-commerce platform** built incrementally
- Commands and code snippets are ready to copy-paste and run
- AngularJS (v1) comparisons are included where relevant to bridge your existing knowledge

---

## Prerequisites

Before Day 1, ensure these are installed:

```bash
# Node.js (LTS — 20.x or 22.x)
node --version   # should be >= 18

# Angular CLI (globally)
npm install -g @angular/cli
ng version

# VS Code extensions to install:
# - Angular Language Service (official)
# - Angular Snippets (John Papa)
# - ESLint
# - Prettier
# - Material Icon Theme
```

---

## 🗺️ 15-Day Roadmap Overview

| Phase | Days   | Focus | Milestone Project |
|-------|--------|-------|-------------------|
| **Foundation** | 1–2 | TypeScript, Components, Templates | MicroShop Homepage |
| **Core Angular** | 3–4 | Services, DI, Routing, Forms | MicroShop Product Catalog |
| **Reactive Angular** | 5–6 | RxJS, HTTP, Interceptors | MicroShop API Integration |
| **State & Architecture** | 7–8 | NgRx, Smart/Dumb Components | MicroShop Cart & State |
| **Advanced Patterns** | 9–10 | Performance, Standalone APIs, SSR | MicroShop Optimised |
| **Testing** | 11–12 | Unit, Integration, E2E Testing | Full Test Coverage |
| **Enterprise & MFE** | 13–15 | Nx monorepo, Module Federation, CI/CD | MicroShop Production |

---

---

# PHASE 1 — Foundation

---

## Day 1 — TypeScript Deep Dive + Angular Architecture

### Why Start with TypeScript?

You've been writing JavaScript/JSX for 8 years. Angular is written entirely in TypeScript and leans into its type system heavily. AngularJS had no TypeScript — this is the biggest mindset shift. Today you'll get TypeScript fluency fast, then scaffold your first Angular app.

### Session 1 — TypeScript Essentials for Angular

#### Core TypeScript concepts you must know before Angular

**1. Interfaces vs Types**

```typescript
// React pattern (you know this):
type ButtonProps = { label: string; onClick: () => void };

// Angular pattern (interfaces preferred for object shapes):
interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;   // optional property
}

// Use 'type' for unions, intersections, or aliases:
type Status = "active" | "inactive" | "pending";
type ApiResponse<T> = { data: T; error: string | null; loading: boolean };
```

**2. Classes (Angular uses classes for EVERYTHING)**

```typescript
// In React you rarely write classes anymore.
// In Angular, every Component, Service, Guard, Pipe is a CLASS.

class ProductService {
  private baseUrl: string = "https://api.example.com";

  // Access modifiers:
  // public  — accessible anywhere (default)
  // private — only inside this class
  // protected — this class + subclasses
  // readonly — can be set in constructor only

  constructor(private http: HttpClient) {}  // shorthand: declares + assigns

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }
}
```

**3. Decorators (Angular's secret sauce)**

```typescript
// Decorators are TypeScript annotations that add metadata to classes.
// Angular reads this metadata at runtime to know how to handle each class.

@Component({          // ← decorator: "this class is an Angular component"
  selector: "app-product-card",
  template: `<h2>{{ product.name }}</h2>`,
})
export class ProductCardComponent {
  @Input() product!: Product;   // ← property decorator: marks as input
  @Output() addToCart = new EventEmitter<Product>();
}
```

**4. Generics (used heavily in RxJS and Angular HTTP)**

```typescript
// You know this from TypeScript in React:
function useState<S>(init: S): [S, Dispatch<SetStateAction<S>>];

// Angular HTTP client uses generics the same way:
this.http.get<Product[]>("/api/products")   // returns Observable<Product[]>
this.http.post<Product>("/api/products", body)
```

**5. Enums (common in Angular apps)**

```typescript
enum UserRole {
  Admin = "ADMIN",
  Editor = "EDITOR",
  Viewer = "VIEWER",
}

// Usage:
const role: UserRole = UserRole.Admin;
```

### 📝 Session 1 Hands-On

```bash
# Create a TypeScript playground (no Angular yet)
mkdir C:\workspace\Angular-app\ts-playground
cd C:\workspace\Angular-app\ts-playground
npm init -y
npm install typescript ts-node --save-dev
npx tsc --init

# Create and run TypeScript files:
# Create ts-playground/src/01-interfaces.ts
# Create ts-playground/src/02-classes.ts
# Create ts-playground/src/03-generics.ts
# Run with: npx ts-node src/01-interfaces.ts
```

**Exercise 1:** Model the following in TypeScript interfaces:
- `User` with `id`, `email`, `role` (use enum), `createdAt`
- `Product` with `id`, `name`, `price`, `stock`, `tags` (string array)
- `CartItem` with `product` (Product), `quantity`
- `Cart` with `items` (CartItem array), computed `total` as a getter

---

### Session 2 — Angular Architecture Mental Model

#### The Big Picture: Angular vs React

```
React:                              Angular:
┌────────────────────────────┐     ┌────────────────────────────────────────┐
│ Library — you wire         │     │ Framework — opinionated full platform   │
│ everything together        │     │                                        │
│                            │     │ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│ Components + Hooks         │     │ │Components│ │ Services │ │Modules │  │
│ + React Router (3rd party) │     │ ├──────────┤ ├──────────┤ ├────────┤  │
│ + Redux/Zustand (3rd party)│     │ │ Routing  │ │   DI     │ │  RxJS  │  │
│ + Axios/Fetch (3rd party)  │     │ │ (built-in│ │(built-in)│ │(built- │  │
│                            │     │ │  router) │ │          │ │   in)  │  │
└────────────────────────────┘     └──────────────────────────────────────-┘
```

#### Angular's Building Blocks

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

#### Create Your First Angular App

```bash
cd C:\workspace\Angular-app

# Create the main learning project
ng new microshop --routing --style=scss --standalone=false
cd microshop

# Explore the generated structure
# (explained section by section below)
ng serve
# Open: http://localhost:4200
```

#### What `ng new` Generated — Annotated

```
microshop/
├── src/
│   ├── app/
│   │   ├── app.component.ts        ← Root component (like your React App.tsx)
│   │   ├── app.component.html      ← Template (your JSX lives here, but separate)
│   │   ├── app.component.scss      ← Scoped styles (like CSS Modules)
│   │   ├── app.component.spec.ts   ← Unit test (Jasmine + Karma)
│   │   └── app.module.ts           ← Root NgModule (registers all components)
│   │
│   ├── assets/                     ← Static files (like React's public/)
│   ├── main.ts                     ← Entry point (like React's index.tsx)
│   ├── index.html                  ← HTML shell
│   └── styles.scss                 ← Global styles
│
├── angular.json                    ← Angular CLI config (like package.json scripts++)
├── tsconfig.json                   ← TypeScript config
└── package.json
```

#### Understanding `app.component.ts`

```typescript
import { Component } from "@angular/core";

@Component({
  selector: "app-root",         // ← The HTML tag: <app-root /> in index.html
  templateUrl: "./app.component.html",  // ← External template file
  styleUrls: ["./app.component.scss"],  // ← Scoped styles array
})
export class AppComponent {
  title = "microshop";          // ← Class property (like React state, but NOT reactive)
}
```

> **React comparison:** This is roughly equivalent to:
> ```tsx
> // App.tsx
> export default function App() {
>   return <div className={styles.root}>...</div>;
> }
> ```
> The key difference: in Angular, the **class is always separate from the template**.

#### Understanding `app.module.ts`

```typescript
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

@NgModule({
  declarations: [AppComponent],   // ← Components/Pipes/Directives belonging to this module
  imports: [BrowserModule, AppRoutingModule],  // ← Other modules to use
  providers: [],                  // ← Services registered here (or in service @Injectable)
  bootstrap: [AppComponent],      // ← Root component to render on startup
})
export class AppModule {}
```

> **AngularJS comparison:** `angular.module("myApp", ["ngRoute"])` — same concept, just with decorators.

### Session 2 Hands-On

**Exercise:** Generate and explore Angular built-in schematics:

```bash
# Generate a component
ng generate component components/header
# Shorthand:
ng g c components/header

# Examine what was generated:
# src/app/components/header/header.component.ts
# src/app/components/header/header.component.html
# src/app/components/header/header.component.scss
# src/app/components/header/header.component.spec.ts
# app.module.ts was AUTOMATICALLY updated to declare HeaderComponent
```

---

### Session 3 — Components In Depth

#### Component Lifecycle (React Comparison)

```
React Hooks                         Angular Lifecycle Hooks
─────────────────────────────       ───────────────────────────────────────
Component renders (first)     ←→   ngOnInit()        — after first render
                                    ngAfterViewInit() — after view+children ready
useEffect(() => {}, [x])      ←→   ngOnChanges(changes) — when @Input changes
useEffect(() => {}, [])       ←→   ngOnInit()
useEffect(() => () => {}, []) ←→   ngOnDestroy()     — cleanup
                                    ngOnChanges()     — like getDerivedStateFromProps
```

```typescript
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from "@angular/core";

@Component({
  selector: "app-product-card",
  templateUrl: "./product-card.component.html",
})
export class ProductCardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() product!: Product;           // required input (! = definite assignment)
  @Input() showActions: boolean = true; // optional input with default

  @Output() addToCart = new EventEmitter<Product>();
  @Output() remove = new EventEmitter<number>(); // emits product id

  ngOnChanges(changes: SimpleChanges): void {
    // Called every time an @Input changes
    // changes.product.previousValue / changes.product.currentValue
    console.log("product changed", changes["product"]);
  }

  ngOnInit(): void {
    // Called once after first render — like useEffect(() => {}, [])
    // Good place to: fetch data, set up subscriptions
    console.log("component initialized", this.product);
  }

  ngOnDestroy(): void {
    // Cleanup — like useEffect(() => () => cleanup, [])
    // Unsubscribe from Observables here
  }

  onAddToCart(): void {
    this.addToCart.emit(this.product);
  }
}
```

#### Template Syntax Crash Course

```html
<!-- Data binding — Angular template syntax vs React JSX -->

<!-- 1. Interpolation (like JSX {expression}) -->
<h2>{{ product.name }}</h2>
<p>Price: {{ product.price | currency }}</p>   <!-- | is a PIPE (like a filter) -->

<!-- 2. Property binding [property]="expression" (like prop={expression}) -->
<img [src]="product.imageUrl" [alt]="product.name" />
<button [disabled]="isLoading">Submit</button>

<!-- 3. Event binding (event)="handler()" (like onClick={handler}) -->
<button (click)="onAddToCart()">Add to Cart</button>
<input (input)="onSearch($event)" (keyup.enter)="onSubmit()" />

<!-- 4. Two-way binding [(ngModel)]="property" (no React equivalent — React is one-way) -->
<input [(ngModel)]="searchTerm" placeholder="Search..." />
<!-- Equivalent to: <input [value]="searchTerm" (input)="searchTerm = $event.target.value" /> -->

<!-- 5. Structural directives (control DOM structure) -->

<!-- *ngIf — like {condition && <Component />} -->
<div *ngIf="isLoggedIn">Welcome back!</div>
<div *ngIf="product; else noProduct">{{ product.name }}</div>
<ng-template #noProduct><p>No product found</p></ng-template>

<!-- *ngFor — like {items.map(item => <Component />)} -->
<div *ngFor="let product of products; let i = index; trackBy: trackById">
  <app-product-card [product]="product" />
</div>

<!-- *ngSwitch -->
<div [ngSwitch]="status">
  <p *ngSwitchCase="'active'">Active</p>
  <p *ngSwitchCase="'inactive'">Inactive</p>
  <p *ngSwitchDefault>Unknown</p>
</div>

<!-- 6. Class and style binding -->
<div [class.active]="isActive" [class.disabled]="isDisabled">...</div>
<div [ngClass]="{ active: isActive, error: hasError }">...</div>
<p [style.color]="textColor" [style.font-size.px]="fontSize">...</p>
<p [ngStyle]="{ color: textColor, fontSize: fontSize + 'px' }">...</p>
```

#### Content Projection (Angular's `ng-content` = React's `children`)

```typescript
// React:
function Card({ children, title }) {
  return <div className="card"><h2>{title}</h2>{children}</div>;
}

// Angular equivalent:
@Component({
  selector: "app-card",
  template: `
    <div class="card">
      <h2>{{ title }}</h2>
      <ng-content></ng-content>   <!-- ← like {children} -->

      <!-- Multiple slots (named): -->
      <ng-content select="[card-header]"></ng-content>
      <ng-content select="[card-body]"></ng-content>
    </div>
  `,
})
export class CardComponent {
  @Input() title!: string;
}

// Usage:
// <app-card title="My Card">
//   <p>This goes into ng-content</p>
//   <div card-header>I'm in the header slot</div>
// </app-card>
```

### Day 1 Hands-On: Build the MicroShop Homepage

```bash
cd C:\workspace\Angular-app\microshop

# Generate components
ng g c pages/home
ng g c components/product-card
ng g c components/header
ng g c components/footer

# Generate the Product interface
ng g interface models/product
```

**Build these components progressively:**

1. `HeaderComponent` — logo, nav links, cart icon with badge
2. `ProductCardComponent` — takes `@Input() product: Product`, emits `@Output() addToCart`
3. `HomeComponent` — hardcoded product array, renders product grid
4. Wire up routing so `/` loads `HomeComponent`

---

## Day 2 — Angular Modules, Pipes, and Directives

### Session 1 — NgModules Deep Dive

#### Module Types Pattern

```
AppModule (root)
├── CoreModule      — Singleton services, HTTP interceptors, guards
│                    (imported ONCE in AppModule)
│
├── SharedModule    — Reusable components, pipes, directives
│                    (imported in EVERY feature module)
│
├── ProductsModule  — Products feature (lazy loaded)
│   ├── ProductListComponent
│   ├── ProductDetailComponent
│   └── ProductsRoutingModule
│
├── CartModule      — Cart feature (lazy loaded)
│   ├── CartComponent
│   └── CartRoutingModule
│
└── AuthModule      — Auth feature (lazy loaded)
    ├── LoginComponent
    └── AuthRoutingModule
```

```bash
# Generate feature module with routing
ng g module features/products --routing
ng g module features/cart --routing
ng g module core
ng g module shared
```

**CoreModule pattern:**

```typescript
// core/core.module.ts
import { NgModule, Optional, SkipSelf } from "@angular/core";
import { CommonModule } from "@angular/common";

@NgModule({
  imports: [CommonModule],
  providers: [
    // Singleton services go here
  ],
})
export class CoreModule {
  // Guard against importing CoreModule more than once
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error("CoreModule is already loaded. Import only in AppModule.");
    }
  }
}
```

**SharedModule pattern:**

```typescript
// shared/shared.module.ts
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { ProductCardComponent } from "./components/product-card/product-card.component";
import { CurrencyFormatPipe } from "./pipes/currency-format.pipe";

@NgModule({
  declarations: [ProductCardComponent, CurrencyFormatPipe],
  imports: [CommonModule, ReactiveFormsModule],
  exports: [
    // Export everything that other modules need to use
    CommonModule,
    ReactiveFormsModule,
    ProductCardComponent,
    CurrencyFormatPipe,
  ],
})
export class SharedModule {}
```

### Session 2 — Pipes (Angular's Data Transformation Layer)

#### Built-in Pipes (no React equivalent — you were using utility functions)

```html
<!-- String pipes -->
{{ "hello world" | uppercase }}       <!-- HELLO WORLD -->
{{ "HELLO WORLD" | lowercase }}       <!-- hello world -->
{{ "hello world" | titlecase }}       <!-- Hello World -->
{{ longText | slice:0:100 }}          <!-- first 100 chars -->

<!-- Number & currency pipes -->
{{ 1234.5678 | number:"1.2-2" }}      <!-- 1,234.57 (min 1 int, 2-2 decimals) -->
{{ 9.99 | currency }}                 <!-- $9.99 -->
{{ 9.99 | currency:"EUR":"symbol" }}  <!-- €9.99 -->
{{ 0.75 | percent }}                  <!-- 75% -->

<!-- Date pipe -->
{{ today | date }}                    <!-- Jun 15, 2025 -->
{{ today | date:"dd/MM/yyyy" }}       <!-- 15/06/2025 -->
{{ today | date:"relative" }}         <!-- (custom pipe needed) -->

<!-- Object pipes -->
{{ user | json }}                     <!-- { "name": "Alice" } — great for debugging -->
{{ products | keyvalue }}             <!-- Iterates object key-value pairs -->

<!-- Async pipe — THE MOST IMPORTANT PIPE -->
<!-- Automatically subscribes to and unsubscribes from Observables/Promises -->
{{ user$ | async }}                   <!-- subscribes to Observable<User> -->
<div *ngIf="products$ | async as products">
  <app-product-card *ngFor="let p of products" [product]="p" />
</div>
```

#### Building a Custom Pipe

```bash
ng g pipe shared/pipes/truncate
```

```typescript
// shared/pipes/truncate.pipe.ts
import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "truncate",
})
export class TruncatePipe implements PipeTransform {
  // Usage: {{ description | truncate:100:"..." }}
  transform(value: string, limit: number = 100, ellipsis: string = "..."): string {
    if (!value || value.length <= limit) return value;
    return value.substring(0, limit) + ellipsis;
  }
}
```

> **AngularJS comparison:** This is like `angular.filter("truncate", function() { return function(value, limit) {...} })` but as a class.

### Session 3 — Custom Directives

Directives are instructions to the DOM. Two types:

#### Attribute Directive (changes appearance/behaviour)

```bash
ng g directive shared/directives/highlight
```

```typescript
// Adds a highlight effect when hovering over an element
// Usage: <div appHighlight highlightColor="yellow">Hover me</div>

@Directive({
  selector: "[appHighlight]",     // attribute selector (not element)
})
export class HighlightDirective implements OnInit {
  @Input() highlightColor: string = "yellow";
  @Input("appHighlight") defaultColor: string = "";  // input with alias

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener("mouseenter") onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, "backgroundColor", this.highlightColor);
  }

  @HostListener("mouseleave") onMouseLeave() {
    this.renderer.removeStyle(this.el.nativeElement, "backgroundColor");
  }
}
```

#### Structural Directive (changes DOM structure)

```typescript
// Custom *ngUnless — opposite of *ngIf
// Usage: <div *appUnless="isLoggedIn">Please log in</div>

@Directive({
  selector: "[appUnless]",
})
export class UnlessDirective {
  @Input() set appUnless(condition: boolean) {
    if (!condition) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}
}
```

### Day 2 Hands-On: Enhance MicroShop

- Build a `HighlightDirective` for product cards on hover
- Build a `TruncatePipe` for product descriptions
- Build a `TimeAgoPipe` that converts a date to "2 hours ago"
- Create `SharedModule` and move reusable pieces into it
- Create `ProductsModule` as a feature module

---

---

# PHASE 2 — Core Angular

---

## Day 3 — Dependency Injection and Services

### Session 1 — Understanding DI (The Most Important Angular Concept)

Dependency Injection is Angular's core mechanism. Every service, component, and most Angular internals are resolved through DI.

#### React vs Angular DI

```
React approach:
  1. Create a context: const CartContext = createContext()
  2. Wrap component tree: <CartContext.Provider value={cartService}>
  3. Consume: const cartService = useContext(CartContext)
  — You manage the singleton yourself

Angular approach:
  1. Decorate a class: @Injectable({ providedIn: "root" })
  2. Declare in constructor: constructor(private cartService: CartService)
  — Angular's injector creates, caches, and injects it automatically
```

#### The DI Tree

```
Root Injector (AppModule / providedIn: "root")
  │  — Services provided here are SINGLETONS across the app
  │
  ├── Module Injector (ProductsModule)
  │     — Services provided here are singletons WITHIN the module
  │
  └── Component Injector (ProductCardComponent)
        — Services provided here are NEW instances per component
```

#### Creating and Using Services

```bash
ng g service services/product
ng g service services/cart
ng g service services/notification
```

```typescript
// services/product.service.ts
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";

@Injectable({
  providedIn: "root",   // ← Singleton — ONE instance for the entire app
  // Alternative: providedIn: ProductsModule (scoped to module)
  // Alternative: providers: [ProductService] in @Component (new instance per component)
})
export class ProductService {
  private apiUrl = "https://fakestoreapi.com/products";
  private products: Product[] = [];   // in-memory cache

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  search(term: string): Observable<Product[]> {
    return this.getAll().pipe(
      map(products => products.filter(p =>
        p.name.toLowerCase().includes(term.toLowerCase())
      ))
    );
  }
}
```

```typescript
// Using the service in a component
@Component({ selector: "app-product-list", ... })
export class ProductListComponent implements OnInit {
  products: Product[] = [];

  // Angular injects ProductService automatically
  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe(products => {
      this.products = products;
    });
  }
}
```

### Session 2 — Angular Routing

#### Router Concepts (React Router Comparison)

| React Router | Angular Router | Notes |
|---|---|---|
| `<BrowserRouter>` | `RouterModule.forRoot(routes)` | Root router setup |
| `<Route path="/products">` | `{ path: "products", component: ... }` | Route definition |
| `<Link to="/products">` | `<a routerLink="/products">` | Navigation link |
| `useNavigate()` | `Router.navigate(["/products"])` | Programmatic navigation |
| `useParams()` | `ActivatedRoute.params` | Route params |
| `useSearchParams()` | `ActivatedRoute.queryParams` | Query params |
| `<Outlet />` | `<router-outlet>` | Where child routes render |
| `loader` | `Resolve` guard | Pre-fetch data before navigation |

#### Setting Up Routes

```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "home", component: HomeComponent },
  {
    path: "products",
    // Lazy loading — only downloads ProductsModule when user visits /products
    loadChildren: () =>
      import("./features/products/products.module").then(m => m.ProductsModule),
  },
  {
    path: "cart",
    loadChildren: () =>
      import("./features/cart/cart.module").then(m => m.CartModule),
    canActivate: [AuthGuard],    // Protected route
  },
  { path: "**", component: NotFoundComponent },  // Wildcard / 404
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: "top",       // scroll to top on navigation
    preloadingStrategy: PreloadAllModules,  // preload lazy modules in bg
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

#### Route Parameters

```typescript
// Route: { path: "products/:id", component: ProductDetailComponent }

@Component({ selector: "app-product-detail", ... })
export class ProductDetailComponent implements OnInit {
  product?: Product;

  constructor(
    private route: ActivatedRoute,    // current route info
    private router: Router,           // programmatic navigation
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    // Method 1: snapshot (doesn't update if route param changes while on same component)
    const id = this.route.snapshot.paramMap.get("id");

    // Method 2: Observable (updates on param change — RECOMMENDED)
    this.route.paramMap.pipe(
      map(params => params.get("id")),
      switchMap(id => this.productService.getById(Number(id)))
    ).subscribe(product => this.product = product);
  }

  goBack(): void {
    this.router.navigate(["/products"]);
    // With query params: this.router.navigate(["/products"], { queryParams: { category: "electronics" } });
  }
}
```

#### Route Guards

```bash
ng g guard guards/auth
```

```typescript
// Guards control access to routes
@Injectable({ providedIn: "root" })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    // Redirect to login with returnUrl
    this.router.navigate(["/login"], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
```

### Day 3 Hands-On: Build Product Catalog

```bash
# Product detail page with route params
ng g c features/products/pages/product-detail
ng g c features/products/pages/product-list
ng g c features/products/components/product-filter
ng g c features/products/components/product-search
```

Build:
1. `/products` — product list page with filter by category
2. `/products/:id` — product detail page
3. Breadcrumb navigation using `ActivatedRoute`
4. `AuthGuard` protecting the cart route

---

## Day 4 — Angular Forms

Angular has two form approaches. You need to know both.

### Session 1 — Template-Driven Forms (Quick & Simple)

```typescript
// Like AngularJS forms — driven by template directives
// Good for simple forms with minimal validation

// Component:
@Component({ selector: "app-login", ... })
export class LoginComponent {
  user = { email: "", password: "" };

  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log(form.value); // { email: "...", password: "..." }
    }
  }
}
```

```html
<!-- Template: -->
<!-- FormsModule must be imported in the module -->
<form #loginForm="ngForm" (ngSubmit)="onSubmit(loginForm)">

  <div>
    <label for="email">Email</label>
    <input
      id="email"
      name="email"
      type="email"
      [(ngModel)]="user.email"
      required
      email
      #emailInput="ngModel"
    />
    <!-- Error messages: -->
    <div *ngIf="emailInput.invalid && emailInput.touched">
      <span *ngIf="emailInput.errors?.['required']">Email is required</span>
      <span *ngIf="emailInput.errors?.['email']">Enter a valid email</span>
    </div>
  </div>

  <button type="submit" [disabled]="loginForm.invalid">Login</button>
</form>
```

### Session 2 — Reactive Forms (Recommended for Complex Forms)

```typescript
// React comparison:
// Like using react-hook-form / Formik but built into Angular
// Form structure is defined in the component class, not the template

import { FormBuilder, FormGroup, Validators, AbstractControl } from "@angular/forms";

@Component({ selector: "app-register", ... })
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName:  ["", Validators.required],
      email:     ["", [Validators.required, Validators.email]],
      password:  ["", [Validators.required, Validators.minLength(8)]],
      confirmPassword: ["", Validators.required],
      address: this.fb.group({           // Nested form group
        street: ["", Validators.required],
        city:   ["", Validators.required],
      }),
    }, {
      validators: this.passwordMatchValidator,  // Form-level validator
    });
  }

  // Custom validator
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get("password")?.value;
    const confirm = control.get("confirmPassword")?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  // Access form values
  get email() { return this.registerForm.get("email"); }

  onSubmit(): void {
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
    } else {
      this.registerForm.markAllAsTouched();  // Show all errors
    }
  }

  // Programmatically update form
  resetForm(): void {
    this.registerForm.reset();
    this.registerForm.patchValue({ firstName: "Default" }); // partial update
    // vs setValue() — must provide ALL fields
  }
}
```

```html
<!-- Template is much cleaner with Reactive Forms -->
<form [formGroup]="registerForm" (ngSubmit)="onSubmit()">

  <input formControlName="email" />
  <div *ngIf="email?.invalid && email?.touched">
    <span *ngIf="email?.errors?.['required']">Required</span>
    <span *ngIf="email?.errors?.['email']">Invalid email</span>
  </div>

  <div formGroupName="address">      <!-- Nested form group -->
    <input formControlName="street" />
    <input formControlName="city" />
  </div>

  <div *ngIf="registerForm.errors?.['passwordMismatch']">
    Passwords do not match
  </div>

  <button [disabled]="registerForm.invalid">Register</button>
</form>
```

### Day 4 Hands-On: Add Forms to MicroShop

Build:
1. Login form (template-driven)
2. Registration form (reactive, with custom validators)
3. Product search (reactive form with `debounceTime`)
4. Checkout form (complex reactive form with nested address group)

---

---

# PHASE 3 — Reactive Angular

---

## Day 5 — RxJS (The Heart of Angular)

> **This is the steepest learning curve coming from React.** React manages async with Promises and `useEffect`. Angular uses Observables (RxJS) for everything. Master this today and the rest of Angular clicks.

### Session 1 — Observable Fundamentals

#### Observable vs Promise

```typescript
// Promise (you know this):
fetch("/api/products")
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// Observable:
import { Observable, from, of, interval } from "rxjs";

// of() — emits values synchronously
of(1, 2, 3).subscribe(v => console.log(v));   // 1, 2, 3

// from() — converts Promise/Array/Iterable to Observable
from(fetch("/api/products")).subscribe(res => console.log(res));

// interval() — emits incrementing number every N milliseconds
interval(1000).subscribe(n => console.log(n));  // 0, 1, 2, 3... (every second)

// Creating your own Observable:
const obs$ = new Observable<number>(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.complete();
});

obs$.subscribe({
  next: value => console.log("Value:", value),
  error: err => console.error("Error:", err),
  complete: () => console.log("Done"),
});
```

> **Naming convention:** Observables are suffixed with `$` (e.g., `products$`, `user$`).

#### Key RxJS Operators (Learn These First)

```typescript
import { of, from, interval } from "rxjs";
import {
  map, filter, tap, take, takeUntil,
  switchMap, mergeMap, concatMap, exhaustMap,
  debounceTime, distinctUntilChanged,
  catchError, retry, retryWhen,
  combineLatest, forkJoin, zip,
  share, shareReplay,
} from "rxjs/operators";

// ── Transformation ──────────────────────────────

// map — transform each value (like Array.map)
of(1, 2, 3).pipe(map(x => x * 2)).subscribe(console.log); // 2, 4, 6

// filter — conditionally pass values (like Array.filter)
of(1, 2, 3, 4).pipe(filter(x => x % 2 === 0)).subscribe(console.log); // 2, 4

// tap — side effects without transformation (like console.log middleware)
of(1, 2, 3).pipe(tap(x => console.log("Before:", x))).subscribe();

// ── Higher-Order Mapping ─────────────────────────
// These "flatten" an Observable of Observables

// switchMap — cancels previous inner observable (use for search/autocomplete)
searchInput$.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(term => this.productService.search(term))
).subscribe(results => this.searchResults = results);

// mergeMap — concurrent inner observables (use for parallel HTTP calls)
productIds$.pipe(
  mergeMap(id => this.productService.getById(id))
).subscribe(product => this.products.push(product));

// concatMap — sequential inner observables (use when order matters)
actions$.pipe(
  concatMap(action => this.api.processAction(action))
).subscribe();

// exhaustMap — ignores new emissions while inner observable is running (use for submit buttons)
submitClicks$.pipe(
  exhaustMap(() => this.api.submitForm(this.form.value))
).subscribe();

// ── Combination ──────────────────────────────────

// combineLatest — emits when ANY source emits, with latest values of ALL
combineLatest([products$, categories$]).pipe(
  map(([products, categories]) => filterProducts(products, categories))
).subscribe(filtered => this.displayedProducts = filtered);

// forkJoin — like Promise.all — waits for ALL to complete
forkJoin([
  this.productService.getAll(),
  this.categoryService.getAll(),
]).subscribe(([products, categories]) => {
  this.products = products;
  this.categories = categories;
});

// ── Error Handling ───────────────────────────────

// catchError — handle errors, return fallback Observable
this.http.get("/api/products").pipe(
  catchError(err => {
    console.error(err);
    return of([]);   // return empty array on error
  })
).subscribe(products => this.products = products);

// retry — retry N times before giving up
this.http.get("/api/products").pipe(
  retry(3),
  catchError(err => of([]))
).subscribe();
```

### Session 2 — Managing Subscriptions (Critical for Memory Leaks)

```typescript
// PROBLEM: Subscriptions that are never unsubscribed cause memory leaks
// (equivalent to useEffect cleanup in React)

// BAD:
ngOnInit(): void {
  this.productService.getAll().subscribe(products => {
    this.products = products;
  });
  // This subscription lives forever if the component is destroyed!
}

// SOLUTION 1: takeUntil + Subject (most common pattern)
@Component({ ... })
export class ProductListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.productService.getAll().pipe(
      takeUntil(this.destroy$)   // auto-unsubscribe when destroy$ emits
    ).subscribe(products => this.products = products);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

// SOLUTION 2: async pipe (BEST — no manual subscribe/unsubscribe needed)
@Component({
  template: `
    <div *ngIf="products$ | async as products">
      <app-product-card *ngFor="let p of products" [product]="p" />
    </div>
  `
})
export class ProductListComponent {
  products$ = this.productService.getAll();  // Observable, never subscribed manually

  constructor(private productService: ProductService) {}
}

// SOLUTION 3: takeUntilDestroyed (Angular 16+ — modern approach)
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({ ... })
export class ProductListComponent {
  constructor(private productService: ProductService) {
    this.productService.getAll().pipe(
      takeUntilDestroyed()  // Angular handles cleanup automatically
    ).subscribe(products => this.products = products);
  }
}
```

### Day 5 Hands-On: Real-Time Product Search

Build:
1. Product search with `debounceTime(300)` + `distinctUntilChanged()` + `switchMap`
2. Category filter using `combineLatest`
3. Live cart total that updates reactively
4. Auto-refresh product stock every 30 seconds using `interval`

---

## Day 6 — HTTP, Interceptors & Error Handling

### Session 1 — HttpClient

```bash
# Add HttpClientModule to AppModule imports
# or HttpClientModule to CoreModule
```

```typescript
// Best practice: create a BaseApiService for common HTTP patterns
@Injectable({ providedIn: "root" })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }
}
```

### Session 2 — HTTP Interceptors (Angular's Middleware)

```typescript
// Interceptors run on every HTTP request/response — like Express middleware
// Common uses: add auth token, handle errors globally, show loading indicator

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    if (token) {
      // Clone the request and add the Authorization header
      const authReq = req.clone({
        headers: req.headers.set("Authorization", `Bearer ${token}`),
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}

// Error interceptor — global error handling
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private notificationService: NotificationService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 401:
            this.router.navigate(["/login"]);
            break;
          case 403:
            this.notificationService.error("Access denied");
            break;
          case 500:
            this.notificationService.error("Server error. Try again later.");
            break;
        }
        return throwError(() => error);
      })
    );
  }
}

// Register interceptors in CoreModule or AppModule:
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
]
```

---

---

# PHASE 4 — State & Architecture

---

## Day 7 — NgRx State Management

> **React comparison:** NgRx is Angular's Redux. If you've used Redux Toolkit, NgRx will feel familiar. If you've used Zustand, prepare for more boilerplate but also more structure.

### NgRx Core Concepts

```
Action → Reducer → Store → Selector → Component
   ↑                  ↓
   └──── Effect ───────┘
         (async: API calls)
```

| NgRx | Redux Toolkit Equivalent |
|------|--------------------------|
| `Action` | `createAction` |
| `Reducer` | `createReducer` / `createSlice` |
| `Store` | `configureStore` |
| `Selector` | `createSelector` |
| `Effect` | `createAsyncThunk` / Redux-Saga |

```bash
ng add @ngrx/store@latest
ng add @ngrx/effects@latest
ng add @ngrx/store-devtools@latest
ng add @ngrx/entity@latest

# Generate NgRx files with schematics
ng g @ngrx/schematics:action store/actions/product
ng g @ngrx/schematics:reducer store/reducers/product
ng g @ngrx/schematics:effect store/effects/product
ng g @ngrx/schematics:selector store/selectors/product
```

### Complete Cart State Example

```typescript
// ─── 1. ACTIONS ─────────────────────────────────
// store/actions/cart.actions.ts
import { createAction, props } from "@ngrx/store";

export const addToCart    = createAction("[Cart] Add Item",    props<{ product: Product }>());
export const removeFromCart = createAction("[Cart] Remove Item", props<{ productId: number }>());
export const clearCart    = createAction("[Cart] Clear");
export const loadCart     = createAction("[Cart] Load");
export const loadCartSuccess = createAction("[Cart] Load Success", props<{ items: CartItem[] }>());
export const loadCartFailure = createAction("[Cart] Load Failure", props<{ error: string }>());

// ─── 2. STATE INTERFACE ──────────────────────────
interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

// ─── 3. REDUCER ─────────────────────────────────
// store/reducers/cart.reducer.ts
export const cartReducer = createReducer(
  initialState,

  on(addToCart, (state, { product }) => {
    const existingItem = state.items.find(i => i.product.id === product.id);
    if (existingItem) {
      return {
        ...state,
        items: state.items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      };
    }
    return { ...state, items: [...state.items, { product, quantity: 1 }] };
  }),

  on(removeFromCart, (state, { productId }) => ({
    ...state,
    items: state.items.filter(i => i.product.id !== productId),
  })),

  on(clearCart, state => ({ ...state, items: [] })),

  on(loadCart, state => ({ ...state, loading: true })),
  on(loadCartSuccess, (state, { items }) => ({ ...state, items, loading: false })),
  on(loadCartFailure, (state, { error }) => ({ ...state, error, loading: false })),
);

// ─── 4. SELECTORS ────────────────────────────────
// store/selectors/cart.selectors.ts
export const selectCartState = createFeatureSelector<CartState>("cart");

export const selectCartItems    = createSelector(selectCartState, s => s.items);
export const selectCartLoading  = createSelector(selectCartState, s => s.loading);
export const selectCartItemCount = createSelector(
  selectCartItems, items => items.reduce((sum, i) => sum + i.quantity, 0)
);
export const selectCartTotal = createSelector(
  selectCartItems,
  items => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
);

// ─── 5. EFFECTS ─────────────────────────────────
// store/effects/cart.effects.ts
@Injectable()
export class CartEffects {
  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCart),
      switchMap(() =>
        this.cartService.getCart().pipe(
          map(items => loadCartSuccess({ items })),
          catchError(error => of(loadCartFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private cartService: CartService
  ) {}
}

// ─── 6. COMPONENT ────────────────────────────────
@Component({ ... })
export class CartComponent {
  items$   = this.store.select(selectCartItems);
  total$   = this.store.select(selectCartTotal);
  count$   = this.store.select(selectCartItemCount);
  loading$ = this.store.select(selectCartLoading);

  constructor(private store: Store) {}

  removeItem(productId: number): void {
    this.store.dispatch(removeFromCart({ productId }));
  }

  clearCart(): void {
    this.store.dispatch(clearCart());
  }
}
```

### Day 7 Hands-On
- Migrate cart state to NgRx
- Add product wishlist feature with NgRx
- Install Redux DevTools Chrome extension and explore time-travel debugging

---

## Day 8 — Smart/Dumb Component Pattern & Advanced Architecture

### The Pattern

```
Smart (Container) Component:
  - Connects to Store (dispatch / select)
  - Handles routing
  - Coordinates multiple dumb components
  - Has access to services
  - Has NO template logic (minimal HTML)

Dumb (Presentational) Component:
  - Only @Input / @Output
  - No Store access, no service injection
  - Pure: same inputs = same output
  - Highly reusable
  - ChangeDetectionStrategy.OnPush for performance
```

```typescript
// Smart container:
@Component({
  selector: "app-product-list-page",
  template: `
    <app-product-filter
      [categories]="categories$ | async"
      (filterChange)="onFilterChange($event)">
    </app-product-filter>

    <app-product-grid
      [products]="filteredProducts$ | async"
      [loading]="loading$ | async"
      (addToCart)="onAddToCart($event)">
    </app-product-grid>
  `,
})
export class ProductListPageComponent {
  categories$       = this.store.select(selectAllCategories);
  filteredProducts$ = this.store.select(selectFilteredProducts);
  loading$          = this.store.select(selectProductsLoading);

  constructor(private store: Store) {}

  onFilterChange(filter: ProductFilter): void {
    this.store.dispatch(setProductFilter({ filter }));
  }

  onAddToCart(product: Product): void {
    this.store.dispatch(addToCart({ product }));
  }
}

// Dumb presentational:
@Component({
  selector: "app-product-grid",
  changeDetection: ChangeDetectionStrategy.OnPush,   // ← Performance optimization
  template: `
    <div *ngIf="loading">Loading...</div>
    <div class="grid">
      <app-product-card
        *ngFor="let p of products; trackBy: trackById"
        [product]="p"
        (addToCart)="addToCart.emit($event)">
      </app-product-card>
    </div>
  `,
})
export class ProductGridComponent {
  @Input() products: Product[] | null = [];
  @Input() loading: boolean | null = false;
  @Output() addToCart = new EventEmitter<Product>();

  trackById = (_: number, product: Product) => product.id;
}
```

---

---

# PHASE 5 — Advanced Patterns

---

## Day 9 — Performance Optimization

### Change Detection Strategies

```
Default Strategy:
  Angular checks every component on every change (event, HTTP, timeout, etc.)
  └── Performance: O(n) per change — gets slow with many components

OnPush Strategy:
  Angular ONLY checks a component when:
  1. An @Input reference changes (not mutation — new object required)
  2. An event fires inside the component
  3. An Observable bound with async pipe emits
  4. ChangeDetectorRef.markForCheck() is called manually
  └── Performance: Much faster for static/data-display components
```

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,   // ← Add this to ALL dumb components
})
export class ProductCardComponent {
  @Input() product!: Product;

  // WRONG with OnPush (mutation doesn't trigger change detection):
  // this.product.price = 99.99; ← UI won't update!

  // CORRECT with OnPush (new object reference):
  // Parent dispatches new state → new product object → @Input triggers update
}
```

### Lazy Loading and Preloading

```typescript
// Lazy load modules (already covered in Month 3)
// Preloading strategy: load lazy modules after initial load

import { PreloadAllModules, QuicklinkStrategy } from "@angular/router";

RouterModule.forRoot(routes, {
  preloadingStrategy: PreloadAllModules,  // preload all lazy modules
  // or:
  preloadingStrategy: QuicklinkStrategy, // only preload modules linked in current view (from ngx-quicklink)
})
```

### TrackBy in *ngFor

```html
<!-- Without trackBy: Angular re-renders ALL items when array changes -->
<div *ngFor="let p of products">...</div>

<!-- With trackBy: only re-renders changed items -->
<div *ngFor="let p of products; trackBy: trackByProductId">...</div>
```

```typescript
trackByProductId(_index: number, product: Product): number {
  return product.id;
}
```

### Day 9 Hands-On
- Audit and add `OnPush` to all dumb components
- Add `trackBy` to all `*ngFor` loops
- Profile with Chrome DevTools Angular tab
- Implement virtual scrolling for long product lists (`@angular/cdk/scrolling`)

---

## Day 10 — Standalone Components & Modern Angular APIs

### Standalone Components (Angular 14+)

> Modern Angular is moving away from NgModules. Standalone components don't belong to any module.

```typescript
// Old approach (NgModule-based):
@NgModule({ declarations: [ProductCardComponent] })
export class ProductsModule {}

// New approach (Standalone — Angular 14+):
@Component({
  selector: "app-product-card",
  standalone: true,                         // ← no NgModule needed
  imports: [CommonModule, CurrencyPipe],    // ← import dependencies directly
  template: `...`,
})
export class ProductCardComponent {
  @Input() product!: Product;
}
```

```typescript
// Standalone bootstrap (Angular 15+) — replaces AppModule entirely
// main.ts
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideStore } from "@ngrx/store";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(reducers),
  ],
});
```

### Signals (Angular 17+) — The React Signals Pattern

```typescript
// Signals are Angular's answer to React's fine-grained reactivity
import { signal, computed, effect } from "@angular/core";

@Component({ ... })
export class CounterComponent {
  // signal() is like useState() in React
  count = signal(0);
  doubled = computed(() => this.count() * 2);   // like useMemo()

  // effect() is like useEffect()
  constructor() {
    effect(() => {
      console.log("Count changed:", this.count());
    });
  }

  increment(): void {
    this.count.update(c => c + 1);   // like setState
    // or:
    this.count.set(this.count() + 1);
  }
}
```

---

---

# PHASE 6 — Testing

---

## Day 11 — Unit & Integration Testing

### Testing Stack

```
Jasmine — test framework (like Jest)
Karma   — test runner (like Jest's runner)
Testing Library (@testing-library/angular) — component testing utilities
```

### Component Testing

```bash
# Run tests
ng test

# Run with coverage
ng test --code-coverage

# Run specific file
ng test --include="**/product-card.component.spec.ts"
```

```typescript
// product-card.component.spec.ts
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ProductCardComponent } from "./product-card.component";

describe("ProductCardComponent", () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct: Product = {
    id: 1, name: "Test Product", price: 29.99, category: "electronics",
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductCardComponent],
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = mockProduct;
    fixture.detectChanges();  // trigger ngOnInit, update DOM
  });

  it("should display product name", () => {
    const nameEl = fixture.debugElement.query(By.css("h3"));
    expect(nameEl.nativeElement.textContent).toContain("Test Product");
  });

  it("should emit addToCart event when button is clicked", () => {
    let emittedProduct: Product | undefined;
    component.addToCart.subscribe(p => (emittedProduct = p));

    const button = fixture.debugElement.query(By.css("button"));
    button.nativeElement.click();

    expect(emittedProduct).toEqual(mockProduct);
  });
});
```

### Service Testing

```typescript
// product.service.spec.ts
import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { ProductService } from "./product.service";

describe("ProductService", () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());  // ensure no outstanding requests

  it("should fetch products", () => {
    const mockProducts: Product[] = [{ id: 1, name: "Product 1", price: 10 }];

    service.getAll().subscribe(products => {
      expect(products).toEqual(mockProducts);
    });

    const req = httpMock.expectOne("https://api.example.com/products");
    expect(req.request.method).toBe("GET");
    req.flush(mockProducts);   // respond with mock data
  });
});
```

---

## Day 12 — E2E Testing with Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// e2e/product-catalog.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Product Catalog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:4200/products");
  });

  test("should display product list", async ({ page }) => {
    await expect(page.locator(".product-card")).toHaveCount(6);
  });

  test("should filter by category", async ({ page }) => {
    await page.click('button[data-category="electronics"]');
    const cards = page.locator(".product-card");
    await expect(cards).toHaveCountGreaterThan(0);
    // Verify all visible cards are electronics
  });

  test("should add product to cart", async ({ page }) => {
    await page.click(".product-card:first-child .add-to-cart-btn");
    await expect(page.locator(".cart-badge")).toHaveText("1");
  });
});
```

---

---

# PHASE 7 — Enterprise & Micro-Frontends

---

## Day 13 — Nx Monorepo

```bash
# Create an Nx workspace (preferred for enterprise)
npx create-nx-workspace@latest microshop-nx
# Choose: Angular, monorepo, application name: shell

cd microshop-nx

# Add apps
nx g @nx/angular:app header-mfe
nx g @nx/angular:app products-mfe

# Add shared libraries
nx g @nx/angular:lib shared/ui-components
nx g @nx/angular:lib shared/data-models
nx g @nx/angular:lib shared/services

# Run
nx serve shell
nx test header-mfe
nx affected:test    # only tests affected by your changes
nx graph            # visualise dependency graph
```

---

## Day 14 — Angular Micro-Frontends with Module Federation

```bash
# In an Nx workspace:
nx g @nx/angular:setup-mf shell --mfType=host
nx g @nx/angular:setup-mf products-mfe --mfType=remote --port=4201
nx g @nx/angular:setup-mf header-mfe --mfType=remote --port=4202
```

```typescript
// shell/webpack.config.ts (generated by Nx)
import { withModuleFederation } from "@nx/angular/module-federation";
import config from "./module-federation.config";

export default withModuleFederation(config);

// shell/module-federation.config.ts
import { ModuleFederationConfig } from "@nx/angular/module-federation";

const config: ModuleFederationConfig = {
  name: "shell",
  remotes: ["header-mfe", "products-mfe"],
};
export default config;
```

```typescript
// Shell routing — loading remote Angular modules
const routes: Routes = [
  {
    path: "products",
    loadChildren: () =>
      loadRemoteModule("products-mfe", "./Module").then(m => m.ProductsModule),
  },
];
```

---

## Day 15 — CI/CD, Deployment & Production Readiness

### Environment Configuration

```typescript
// environments/environment.ts (dev)
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
  featureFlags: { newCheckout: false },
};

// environments/environment.prod.ts (prod)
export const environment = {
  production: true,
  apiUrl: "https://api.microshop.com",
  featureFlags: { newCheckout: true },
};
```

### Production Build Checklist

```bash
# Production build
ng build --configuration=production

# Analyse bundle size
npx webpack-bundle-analyzer dist/microshop/stats.json

# Check for:
# ✅ Lazy loaded routes (separate chunks in dist/)
# ✅ Tree shaking (unused code removed)
# ✅ AOT compilation (faster rendering)
# ✅ Minification
# ✅ Source maps disabled (or separate)
```

### GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm ci
      - run: ng lint
      - run: ng test --watch=false --browsers=ChromeHeadless --code-coverage
      - run: ng build --configuration=production
      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

---

---

# 📚 Supplementary Learning Resources

---

## Angular vs React — Quick Mental Model Shifts

| React way | Angular way | Note |
|-----------|-------------|------|
| `useState` / `useReducer` | `signal()` / NgRx | Signals are the modern choice |
| `useEffect` | `ngOnInit` + subscriptions | Use `takeUntilDestroyed` |
| `useMemo` | `computed()` or `pure pipes` | Pipes are automatically memoized |
| `useCallback` | Methods are naturally stable | No equivalent needed |
| `useRef` | `@ViewChild` | Access DOM/child components |
| `useContext` | DI (`@Injectable`) | Much more powerful |
| `React.lazy` | Lazy-loaded routes | Angular does this at the route level |
| `<ErrorBoundary>` | `catchError` in RxJS / `ErrorHandler` | Global error handling |
| `children` prop | `<ng-content>` | Content projection |
| Render prop | Structural directive | More powerful, reusable |
| HOC | Directive or service | Different composition model |

## AngularJS (v1) → Modern Angular Migration Map

| AngularJS | Modern Angular |
|-----------|---------------|
| `angular.module("app", [])` | `@NgModule` or `bootstrapApplication` |
| `$scope` | Component class properties |
| `$rootScope` | Root-level service or NgRx store |
| `$http` | `HttpClient` |
| `$q` / Promises | `Observable` (RxJS) |
| `$watch` | `ngOnChanges` / Observables |
| `ng-controller` | `@Component` |
| `ng-model` | `[(ngModel)]` or `formControlName` |
| `filter` | `Pipe` |
| `service` / `factory` | `@Injectable` class |
| `$routeProvider` | `RouterModule.forRoot(routes)` |
| `$stateProvider` (UI-Router) | Angular Router with lazy loading |
| `$broadcast` / `$emit` | `EventEmitter` / RxJS Subject |
| `resolve` in routing | Route `Resolve` guard |
| `$compile` | Dynamic components (`ViewContainerRef`) |

---

## Day-by-Day Checklist

| Day   | Goal | Done? |
|-------|------|-------|
| Day 1 | TypeScript fluency + Angular architecture basics | ☐ |
| Day 2 | Components, templates, pipes, directives, SharedModule | ☐ |
| Day 3 | Services, DI, Routing, Guards | ☐ |
| Day 4 | Template-driven + Reactive forms | ☐ |
| Day 5 | RxJS fundamentals + subscription management | ☐ |
| Day 6 | HttpClient + Interceptors + Error handling | ☐ |
| Day 7 | NgRx — Actions, Reducers, Effects, Selectors | ☐ |
| Day 8 | Smart/Dumb pattern, OnPush change detection | ☐ |
| Day 9 | Performance (OnPush, trackBy, lazy loading) | ☐ |
| Day 10 | Standalone APIs, Signals (Angular 17+) | ☐ |
| Day 11 | Unit + Integration testing (Jasmine/Karma) | ☐ |
| Day 12 | E2E testing with Playwright | ☐ |
| Day 13 | Nx monorepo, project organisation | ☐ |
| Day 14 | Angular Module Federation (MFE) | ☐ |
| Day 15 | CI/CD, environments, production build | ☐ |

---

## Recommended Reading & Tools

- **Official Docs:** https://angular.dev (new docs — excellent)
- **RxJS Docs:** https://rxjs.dev/guide/overview
- **NgRx Docs:** https://ngrx.io/docs
- **Nx Docs:** https://nx.dev/angular
- **Angular University:** https://angular-university.io (paid, very thorough)
- **VS Code:** Angular Language Service extension (IntelliSense, template checking)
- **Chrome Extension:** Angular DevTools (component tree, change detection profiler)
- **Bundle Analyser:** `webpack-bundle-analyzer` — identify large chunks
- **Fake API for practice:** https://fakestoreapi.com, https://jsonplaceholder.typicode.com
