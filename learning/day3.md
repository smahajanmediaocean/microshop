# 🎓 Day 3 — DI Deep Dive, Angular Routing & Forms
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

> **Guide alignment:**
> - Guide Day 3 → DI Injector Tree + Angular Routing
> - Guide Day 4 → Angular Forms (Template-Driven + Reactive)
> - Guide Day 6 → HTTP Interceptors (preview — we already have HTTP wired from Day 2)
>
> MicroShop is ahead of the guide's pace because Day 2 covered Services, DI basics, HttpClient, and RxJS together. Day 3 fills in the deeper patterns from those guide days.

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | DI Injector Tree — Scopes, Providers, InjectionToken | ~2 hrs |
| Session 2 | Angular Routing — Params, Guards, Resolvers, Lazy Loading | ~2 hrs |
| Session 3 | Angular Forms — Template-Driven & Reactive | ~2 hrs |
| Hands-On | Product Catalog + Checkout Form + AuthGuard + Interceptors | ~2 hrs |

---

## 🔷 What We're Building Today

Day 2 gave us a working product listing, cart, and product detail page. Today we go deeper on DI scoping, add production-grade routing patterns, and build a full checkout form with validation.

```
Day 2 (done)                      Day 3 (today)
─────────────────────────         ─────────────────────────────────────────
ProductService — providedIn:root  DI Tree — root vs module vs component scope
CartService — BehaviorSubject     InjectionToken — for non-class dependencies
HomeComponent — async pipe        Routing: snapshot vs Observable params
ProductDetailComponent — switchMap    PreloadAllModules, scrollPositionRestoration
CartComponent — /cart             Route Guards — AuthGuard for /checkout
                                  Route Resolver — preload before render

                                  CheckoutComponent → /checkout
                                    Template-driven login form
                                    Reactive checkout form
                                    markAllAsTouched(), patchValue(), setValue()
                                    Form-level password match validator

                                  HTTP Interceptors
                                    AuthInterceptor — attach JWT to every request
                                    ErrorInterceptor — global 401/500 handling
                                    LoadingInterceptor — global spinner
```

---

## 🔷 SESSION 1 — DI Deep Dive: The Injector Tree

---

### 1️⃣ Quick Recap: How Angular DI Works

On Day 2 we used `@Injectable({ providedIn: 'root' })` for all services. That's the right default. Today we understand **why**, and when you'd use something different.

```
React approach:
  1. Create a context: const CartContext = createContext()
  2. Wrap component tree: <CartContext.Provider value={cartService}>
  3. Consume: const cartService = useContext(CartContext)
  — You manage the singleton yourself

Angular approach:
  1. Decorate: @Injectable({ providedIn: 'root' })
  2. Declare: constructor(private cartService: CartService)
  — Angular's injector creates, caches, and injects it automatically
```

---

### 2️⃣ The Injector Tree — Three Scopes

**The real-world mental model:**
> Angular has a tree of injectors, one at each level. When a component asks for a service, Angular walks **up** the tree until it finds a provider.

```
Root Injector  (AppModule / providedIn: 'root')
│  ONE instance shared across the ENTIRE app
│  CartService lives here — HeaderComponent and CartComponent get the SAME cart
│
├── Module Injector  (ProductsModule)
│     ONE instance shared across ProductsModule only
│     If ProductsModule is lazy-loaded, this injector is created on demand
│     Services here are NOT shared with other modules
│
└── Component Injector  (ProductCardComponent)
      A BRAND NEW instance per component
      Useful when each instance needs its own isolated state
      Like a per-card "WishlistState" that resets when the card is destroyed
```

**Providing at each level:**

```typescript
// ── Root scope (default — use this for most services) ─────────────────────
@Injectable({ providedIn: 'root' })       // singleton for entire app
export class CartService { ... }

// ── Module scope (use for feature-specific services) ──────────────────────
@NgModule({
  providers: [ProductFilterService]        // singleton within this module only
})
export class ProductsModule { }

// ── Component scope (use for isolated per-component state) ────────────────
@Component({
  selector: 'app-product-card',
  providers: [WishlistStateService]        // new instance per ProductCardComponent
})
export class ProductCardComponent { ... }
```

**MicroShop decision table:**

| Service | Scope | Why |
|---|---|---|
| `CartService` | `root` | Header, Cart page, Home all share the same cart |
| `ProductService` | `root` | Singleton cache — one HTTP call for all consumers |
| `AuthService` | `root` | Auth state is global |
| `ProductFilterService` | Module | Only used within the Products feature module |
| `ToastNotificationService` | `root` | Any component can trigger a toast |

---

### 3️⃣ InjectionToken — Providing Non-Class Values

**The real-world mental model:**
> `InjectionToken` lets you inject plain values (strings, objects, config) through DI — not just classes. Like React's `createContext` but for primitive values.

**MicroShop use case — inject the API base URL:**

```typescript
// tokens/api-url.token.ts
import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL');

// app.module.ts — register the value
@NgModule({
  providers: [
    { provide: API_URL, useValue: environment.apiUrl }
    // { provide: API_URL, useValue: 'https://fakestoreapi.com' }
  ]
})
export class AppModule { }

// product.service.ts — inject by token
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string  // ← inject the string value
  ) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }
}
```

**Why this is better than reading `environment.apiUrl` directly:**
- The service doesn't depend on the `environment` object — easier to test (inject any URL you want)
- Swap the URL in tests: `{ provide: API_URL, useValue: 'http://localhost:3000' }`

---

### 4️⃣ `useClass`, `useValue`, `useFactory`, `useExisting`

```typescript
// app.module.ts providers array
providers: [

  // useClass — provide a different implementation of a class
  // Useful for swapping a real service for a mock in tests or dev mode
  { provide: ProductService, useClass: MockProductService },

  // useValue — provide a literal value (string, object, config)
  { provide: API_URL, useValue: environment.apiUrl },

  // useFactory — provide a value from a factory function
  // Use when the value depends on other injected services
  {
    provide: LoggerService,
    useFactory: (authService: AuthService) => {
      return environment.production
        ? new ProductionLogger(authService)
        : new DevLogger();
    },
    deps: [AuthService]   // ← declare what the factory needs injected
  },

  // useExisting — alias one token to another (two tokens, same instance)
  { provide: AbstractCartService, useExisting: CartService },
]
```

---

## 🔷 SESSION 2 — Angular Routing

---

### 1️⃣ Angular Router vs React Router — Side-by-Side

| React Router | Angular Router | Notes |
|---|---|---|
| `<BrowserRouter>` | `RouterModule.forRoot(routes)` | Root router setup in `AppModule` |
| `<Route path="/products">` | `{ path: 'products', component: ... }` | Route definition |
| `<Link to="/products">` | `<a routerLink="/products">` | Navigation link — no full page reload |
| `<NavLink>` | `routerLinkActive="active"` | Adds CSS class when route matches |
| `useNavigate()` | `Router.navigate(['/products'])` | Programmatic navigation |
| `useParams()` | `ActivatedRoute.paramMap` | Route params as Observable |
| `useSearchParams()` | `ActivatedRoute.queryParams` | Query params as Observable |
| `<Outlet />` | `<router-outlet>` | Where child/lazy routes render |
| `loader` | `Resolve` guard | Pre-fetch data before navigation |
| React lazy() | `loadChildren: () => import(...)` | Lazy-loaded module |

---

### 2️⃣ The MicroShop Route Table

```typescript
// app-routing.module.ts
const routes: Routes = [
  { path: '',         redirectTo: '/home', pathMatch: 'full' },
  { path: 'home',     component: HomeComponent },

  // Eagerly loaded — part of the main bundle
  { path: 'cart',     component: CartComponent },

  // Route with param + resolver — preloads product before rendering
  {
    path: 'products/:id',
    component: ProductDetailComponent,
    resolve: { product: ProductResolver }
  },

  // Lazy loaded + guarded — only downloads CheckoutModule when user visits
  {
    path: 'checkout',
    loadChildren: () =>
      import('./pages/checkout/checkout.module').then(m => m.CheckoutModule),
    canActivate: [AuthGuard],
  },

  { path: '**', redirectTo: '/home' },   // wildcard / 404
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',      // scroll to top on every navigation
    preloadingStrategy: PreloadAllModules, // background-download lazy modules after app loads
  })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
```

> 💡 **`PreloadAllModules`** — After the app loads, Angular silently downloads all lazy modules in the background. So when the user navigates to `/checkout`, the module is already cached — feels instant.

---

### 3️⃣ Route Parameters — Snapshot vs Observable

There are two ways to read route params. Knowing when to use each is important.

```typescript
// Route: { path: 'products/:id', component: ProductDetailComponent }

export class ProductDetailComponent implements OnInit {
  product?: Product;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {

    // ── Method 1: snapshot ─────────────────────────────────────────────────
    // Reads params ONCE at the time the component is created.
    // Use when you know the user will NEVER navigate from /products/1 → /products/2
    // while staying on the SAME component instance.
    const id = this.route.snapshot.paramMap.get('id');
    this.productService.getById(Number(id)).subscribe(p => this.product = p);

    // ── Method 2: Observable paramMap (RECOMMENDED) ────────────────────────
    // Re-fires every time the :id param changes, even if Angular reuses
    // the same component instance (which it does for same-route navigations).
    this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      switchMap(id => this.productService.getById(id))  // cancels in-flight request on new id
    ).subscribe(product => this.product = product);
  }

  goBack(): void {
    this.router.navigate(['/home']);
    // With query params:
    // this.router.navigate(['/home'], { queryParams: { category: 'electronics' } });
    // → navigates to /home?category=electronics
  }
}
```

**When does the difference matter?**

```
User on /products/1 — clicks "Next Product" button → navigates to /products/2
  ├── snapshot: component re-created → snapshot works fine (but wasteful)
  └── If Angular reuses the component instance → snapshot reads old id=1 ← BUG

  Observable paramMap: fires again with id=2 → fetches product 2 ✅
```

---

### 4️⃣ Route Guards — Protecting Routes

**`CanActivate` — block entry:**

```typescript
// ng g guard guards/auth

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    // Not logged in → redirect to /login, remember where they wanted to go
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}
```

**`CanDeactivate` — warn before leaving:**

```typescript
// Use on checkout form — warn user if they leave with unsaved data

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

@Injectable({ providedIn: 'root' })
export class UnsavedChangesGuard implements CanDeactivate<CanComponentDeactivate> {
  canDeactivate(component: CanComponentDeactivate): boolean | Observable<boolean> {
    return component.canDeactivate ? component.canDeactivate() : true;
  }
}

// checkout.component.ts — implement the interface
export class CheckoutComponent implements CanComponentDeactivate {
  checkoutForm!: FormGroup;

  canDeactivate(): boolean {
    if (this.checkoutForm.dirty) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  }
}

// app-routing.module.ts
{
  path: 'checkout',
  component: CheckoutComponent,
  canActivate: [AuthGuard],
  canDeactivate: [UnsavedChangesGuard]
}
```

**Guard types at a glance:**

| Guard | When it runs | MicroShop use |
|---|---|---|
| `CanActivate` | Before entering a route | Block `/checkout` for guests |
| `CanDeactivate` | Before leaving a route | "Unsaved changes — leave?" on checkout |
| `CanLoad` | Before lazy-loading a module | Don't download `/admin` bundle for non-admins |
| `Resolve` | Before entering, fetches data | Preload product before `/products/:id` renders |

---

### 5️⃣ Route Resolver — Eliminate Page Flicker

**Problem without resolver:**
```
User navigates to /products/5
  → Component renders immediately (blank/skeleton visible)
  → ngOnInit fires HTTP GET
  → 300ms later... data arrives, page re-renders
```

**With resolver — data arrives BEFORE the component renders:**

```typescript
// ng g resolver resolvers/product

@Injectable({ providedIn: 'root' })
export class ProductResolver implements Resolve<Product> {
  constructor(private productService: ProductService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Product> {
    const id = Number(route.paramMap.get('id'));
    return this.productService.getById(id);
    // Router waits for this Observable to complete, THEN activates the route
  }
}
```

```typescript
// app-routing.module.ts
{
  path: 'products/:id',
  component: ProductDetailComponent,
  resolve: { product: ProductResolver }  // key 'product' holds resolved value
}
```

```typescript
// product-detail.component.ts — no HTTP call needed here
ngOnInit(): void {
  this.product = this.route.snapshot.data['product'];  // already available ✅
}
```

---

### 6️⃣ Lazy Loading — Chunk Your App

**The real-world mental model:**
> Without lazy loading, every module downloads on first load. With lazy loading, only the modules for the current route download — the rest are fetched on demand.

```typescript
// Checkout feature is only loaded when user navigates to /checkout
{
  path: 'checkout',
  loadChildren: () =>
    import('./pages/checkout/checkout.module').then(m => m.CheckoutModule),
  canActivate: [AuthGuard],
}
```

```typescript
// checkout/checkout.module.ts — the lazy-loaded feature module
@NgModule({
  declarations: [CheckoutComponent, OrderSummaryComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CheckoutRoutingModule
  ]
})
export class CheckoutModule { }
```

```typescript
// checkout/checkout-routing.module.ts — child routes inside the lazy module
const routes: Routes = [
  { path: '',        component: CheckoutComponent },
  { path: 'success', component: OrderSuccessComponent },
];
// Maps to: /checkout and /checkout/success
```

---

## 🔷 SESSION 3 — Angular Forms

---

### 1️⃣ Template-Driven vs Reactive — When to Use Each

| | Template-Driven | Reactive |
|---|---|---|
| Form logic lives in | HTML template | TypeScript class |
| Driven by | `ngModel` directives | `FormGroup` / `FormControl` |
| Validation | HTML attributes (`required`, `email`) | `Validators` array in TS |
| Good for | Simple 1–3 field forms | Complex forms, nested groups, dynamic fields |
| Unit testable | Hard | Easy — plain TS objects |
| React comparison | Uncontrolled inputs + `ref` | `react-hook-form` / `Formik` |

**In MicroShop:**

| Form | Type | Why |
|---|---|---|
| Login (2 fields) | Template-driven | Simple, minimal validation |
| Search box | Template-driven | `[(ngModel)]` is all we need |
| Registration | Reactive | Password confirm cross-field validator |
| Checkout | Reactive | Nested address group, multiple validators |

---

### 2️⃣ Template-Driven Forms — Login

```typescript
// login.component.ts
@Component({ selector: 'app-login', ... })
export class LoginComponent {
  // Data model — two-way bound to the template
  user = { email: '', password: '' };

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(form: NgForm): void {
    if (form.valid) {
      this.authService.login(this.user.email, this.user.password).subscribe({
        next: () => this.router.navigate(['/home']),
        error: () => form.setErrors({ loginFailed: true })
      });
    }
  }
}
```

```html
<!-- login.component.html — FormsModule must be imported in the module -->
<form #loginForm="ngForm" (ngSubmit)="onSubmit(loginForm)">

  <div class="field">
    <label>Email</label>
    <input
      id="email"
      name="email"
      type="email"
      [(ngModel)]="user.email"
      required
      email
      #emailInput="ngModel"
    />
    <!-- Show errors only after field is touched -->
    <div *ngIf="emailInput.invalid && emailInput.touched" class="error">
      <span *ngIf="emailInput.errors?.['required']">Email is required</span>
      <span *ngIf="emailInput.errors?.['email']">Enter a valid email</span>
    </div>
  </div>

  <div class="field">
    <label>Password</label>
    <input
      name="password"
      type="password"
      [(ngModel)]="user.password"
      required
      minlength="8"
      #passwordInput="ngModel"
    />
    <div *ngIf="passwordInput.invalid && passwordInput.touched" class="error">
      <span *ngIf="passwordInput.errors?.['required']">Password is required</span>
      <span *ngIf="passwordInput.errors?.['minlength']">Minimum 8 characters</span>
    </div>
  </div>

  <div *ngIf="loginForm.errors?.['loginFailed']" class="error">
    Invalid email or password
  </div>

  <button type="submit" [disabled]="loginForm.invalid">Login</button>
</form>
```

> 💡 `#loginForm="ngForm"` — creates a template reference to Angular's NgForm directive. `#emailInput="ngModel"` — creates a reference to the field's NgModel directive so you can read `.invalid`, `.touched`, `.errors`.

---

### 3️⃣ Reactive Forms — Checkout

```typescript
// checkout.component.ts
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

@Component({ selector: 'app-checkout', ... })
export class CheckoutComponent implements OnInit, CanComponentDeactivate {
  checkoutForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkoutForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      phone:     ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],

      // Nested group for shipping address
      address: this.fb.group({
        street:  ['', Validators.required],
        city:    ['', Validators.required],
        state:   ['', Validators.required],
        pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      }),

      paymentMethod: ['COD', Validators.required],  // 'COD' | 'UPI' | 'CARD'
    });
  }

  // ── Getter shortcuts — cleaner than calling .get() every time in template ──
  get email()   { return this.checkoutForm.get('email'); }
  get phone()   { return this.checkoutForm.get('phone'); }
  get pincode() { return this.checkoutForm.get('address.pincode'); }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      // Show ALL validation errors at once (user clicked submit without touching fields)
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.orderService.placeOrder({
      items: this.cartService.getItems(),
      ...this.checkoutForm.value
    }).subscribe({
      next: (order) => {
        this.cartService.clearCart();
        this.router.navigate(['/checkout/success'], { queryParams: { orderId: order.id } });
      },
      error: () => {
        this.checkoutForm.setErrors({ submitFailed: true });
      }
    });
  }

  // Pre-fill form for returning user (partial update — only fills specified fields)
  prefillFromProfile(profile: UserProfile): void {
    this.checkoutForm.patchValue({        // ← patchValue: updates ONLY the fields you provide
      firstName: profile.firstName,
      lastName:  profile.lastName,
      email:     profile.email,
      address: {
        city:  profile.city,
        state: profile.state,
      }
      // phone and pincode remain untouched
    });
    // vs setValue() — would require ALL fields to be provided, throws if any are missing
  }

  canDeactivate(): boolean {
    return !this.checkoutForm.dirty || confirm('Leave checkout? Your details will be lost.');
  }
}
```

---

### 4️⃣ Reactive Forms — Template

```html
<!-- checkout.component.html — ReactiveFormsModule must be imported -->
<form [formGroup]="checkoutForm" (ngSubmit)="onSubmit()">

  <!-- firstName -->
  <div class="field">
    <label>First Name</label>
    <input formControlName="firstName" />
    <div *ngIf="checkoutForm.get('firstName')?.invalid
                && checkoutForm.get('firstName')?.touched" class="error">
      <span *ngIf="checkoutForm.get('firstName')?.errors?.['required']">Required</span>
      <span *ngIf="checkoutForm.get('firstName')?.errors?.['minlength']">Min 2 characters</span>
    </div>
  </div>

  <!-- email — uses getter shorthand -->
  <div class="field">
    <label>Email</label>
    <input formControlName="email" type="email" />
    <div *ngIf="email?.invalid && email?.touched" class="error">
      <span *ngIf="email?.errors?.['required']">Email is required</span>
      <span *ngIf="email?.errors?.['email']">Enter a valid email</span>
    </div>
  </div>

  <!-- phone — uses getter shorthand -->
  <div class="field">
    <label>Phone</label>
    <input formControlName="phone" type="tel" placeholder="9876543210" />
    <div *ngIf="phone?.invalid && phone?.touched" class="error">
      <span *ngIf="phone?.errors?.['pattern']">Enter a valid 10-digit Indian mobile number</span>
    </div>
  </div>

  <!-- nested address group -->
  <div formGroupName="address">
    <h3>Shipping Address</h3>

    <div class="field">
      <label>Street</label>
      <input formControlName="street" />
    </div>

    <div class="field-row">
      <div class="field">
        <label>City</label>
        <input formControlName="city" />
      </div>

      <div class="field">
        <label>State</label>
        <input formControlName="state" />
      </div>
    </div>

    <div class="field">
      <label>Pincode</label>
      <input formControlName="pincode" placeholder="560001" />
      <div *ngIf="pincode?.invalid && pincode?.touched" class="error">
        <span *ngIf="pincode?.errors?.['pattern']">Enter a valid 6-digit pincode</span>
      </div>
    </div>
  </div>

  <!-- payment method -->
  <div class="field">
    <label>Payment Method</label>
    <label><input type="radio" formControlName="paymentMethod" value="COD" /> Cash on Delivery</label>
    <label><input type="radio" formControlName="paymentMethod" value="UPI" /> UPI</label>
    <label><input type="radio" formControlName="paymentMethod" value="CARD" /> Credit / Debit Card</label>
  </div>

  <!-- form-level error (e.g. submit failed) -->
  <div *ngIf="checkoutForm.errors?.['submitFailed']" class="error">
    Order failed. Please try again.
  </div>

  <button type="submit" [disabled]="checkoutForm.invalid">
    Place Order
  </button>

</form>
```

---

### 5️⃣ Custom Validators — Built-in vs Custom vs Form-Level

**Built-in validators:**
```typescript
Validators.required           // field must not be empty
Validators.email              // must be valid email format
Validators.minLength(3)       // minimum character count
Validators.maxLength(100)     // maximum character count
Validators.pattern(/^\d{6}$/) // must match regex
Validators.min(1)             // numeric minimum
Validators.max(10)            // numeric maximum
```

**Custom field-level validator — no PO Box addresses:**
```typescript
// validators/no-pobox.validator.ts
import { AbstractControl, ValidationErrors } from '@angular/forms';

export function noPoBoxValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string)?.toLowerCase() ?? '';
  if (value.includes('po box') || value.includes('p.o. box')) {
    return { noPoBox: true };
  }
  return null;   // null = valid ✅
}

// Apply:
street: ['', [Validators.required, noPoBoxValidator]],

// Template:
<span *ngIf="checkoutForm.get('address.street')?.errors?.['noPoBox']">
  PO Box addresses are not accepted
</span>
```

**Form-level validator — passwords must match (Registration form):**
```typescript
// Applied to the whole FormGroup, not a single control
this.registerForm = this.fb.group({
  password:        ['', [Validators.required, Validators.minLength(8)]],
  confirmPassword: ['', Validators.required],
}, {
  validators: this.passwordMatchValidator   // ← form-level validator
});

// The validator:
passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
  const password = control.get('password')?.value;
  const confirm  = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

// Template — error shown at form level, not field level:
<div *ngIf="registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched"
     class="error">
  Passwords do not match
</div>
```

---

### 6️⃣ `patchValue()` vs `setValue()` — Key Difference

```typescript
this.fb.group({
  name:  [''],
  email: [''],
  phone: [''],
});

// setValue() — you MUST supply ALL fields. Throws if any are missing.
this.checkoutForm.setValue({
  name:  'Rahul',
  email: 'rahul@example.com',
  phone: '9876543210',   // must include this too
});

// patchValue() — only update what you provide. Other fields stay unchanged.
this.checkoutForm.patchValue({
  name: 'Rahul',
  // email and phone untouched ✅
});
```

**When to use each in MicroShop:**
- `setValue()` — resetting the form to a fully known state (e.g. loading a saved draft)
- `patchValue()` — pre-filling only the parts you have (e.g. auto-fill name/email from user profile, let them fill phone themselves)

---

### 7️⃣ Form State — The Status Lifecycle

Every `FormControl` and `FormGroup` tracks state automatically:

```
Field created
  pristine=true, untouched=true

User clicks into field, types nothing, clicks away
  untouched=false → touched=true   ← show errors now

User types something
  pristine=false → dirty=true

User clears the required field
  valid=false → invalid=true, errors = { required: true }

onSubmit() with untouched invalid fields
  form.markAllAsTouched()   ← forces all fields to show their errors at once
```

| Property | Meaning | MicroShop use |
|---|---|---|
| `.valid` / `.invalid` | All validators pass | Disable/enable submit button |
| `.touched` / `.untouched` | User has focused then blurred the field | Gate error message visibility |
| `.dirty` / `.pristine` | Value has been changed from initial | Warn "unsaved changes" on leave |
| `.errors` | Object of failing validators | Show specific per-error messages |
| `.value` | Current value | Read on submit |

---

## 🔷 SESSION 4 (BONUS) — HTTP Interceptors

> This maps to **Guide Day 6**. We preview it here since we already have HttpClient wired from Day 2.

---

### 1️⃣ What is an Interceptor?

**The real-world mental model:**
> An interceptor is **middleware for Angular's HTTP layer** — like Express `app.use()` but for outgoing requests and incoming responses.

```
Without interceptor:
  Component → HttpClient → API
  Component ← HttpClient ← API

With interceptors (chain):
  Component → AuthInterceptor → ErrorInterceptor → LoadingInterceptor → API
  Component ← AuthInterceptor ← ErrorInterceptor ← LoadingInterceptor ← API
```

---

### 2️⃣ Auth Interceptor — Attach JWT to Every Request

```typescript
// ng g interceptor interceptors/auth

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    if (token) {
      // Requests are IMMUTABLE — clone before modifying
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
```

---

### 3️⃣ Error Interceptor — Handle 401 / 500 Globally

```typescript
// ng g interceptor interceptors/error

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router, private toastService: ToastService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        switch (error.status) {
          case 401:
            // Token expired — send to login, remember return URL
            this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
            break;
          case 403:
            this.toastService.show('You don\'t have permission to do that.', 'error');
            break;
          case 500:
          default:
            this.toastService.show('Something went wrong. Please try again.', 'error');
            break;
        }
        return throwError(() => error);  // re-throw so components can still catch if needed
      })
    );
  }
}
```

---

### 4️⃣ Loading Interceptor — Global Spinner

```typescript
// loading.service.ts
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private activeRequests = 0;
  isLoading$ = new BehaviorSubject<boolean>(false);

  start(): void {
    if (++this.activeRequests === 1) this.isLoading$.next(true);
  }

  stop(): void {
    if (--this.activeRequests === 0) this.isLoading$.next(false);
  }
}

// loading.interceptor.ts
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.loadingService.start();
    return next.handle(req).pipe(
      finalize(() => this.loadingService.stop())  // fires on success AND error
    );
  }
}
```

---

### 5️⃣ Registering Interceptors — Order Matters

```typescript
// app.module.ts — outgoing order: Auth → Error → Loading
providers: [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,    multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor,   multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
  // ALWAYS multi: true — lets Angular chain multiple interceptors
]
```

```html
<!-- app.component.html — global spinner driven by any HTTP call -->
<div class="global-spinner" *ngIf="loadingService.isLoading$ | async">
  <div class="spinner"></div>
</div>
<router-outlet></router-outlet>
```

> 💡 Interceptors run in **registration order** for outgoing requests and **reverse order** for incoming responses — just like Express middleware.

---

## 🏗️ Day 3 Hands-On — Step by Step Build Plan

---

### Step 1: Add DI Scope Awareness to Existing Services

Review `product.service.ts` and `cart.service.ts`:
- Both already use `providedIn: 'root'` — confirm this is correct (global singletons ✅)
- Add `InjectionToken` for the API base URL:
  - Create `src/app/tokens/api-url.token.ts`
  - Register `{ provide: API_URL, useValue: environment.apiUrl }` in `AppModule`
  - Inject `@Inject(API_URL) private apiUrl: string` in `ProductService`

---

### Step 2: Improve ProductDetailComponent Routing

```bash
ng g resolver resolvers/product
```

- Implement `ProductResolver` using `route.paramMap.get('id')` + `productService.getById()`
- Update route in `app-routing.module.ts` to use `resolve: { product: ProductResolver }`
- Update `ProductDetailComponent` to read `this.route.snapshot.data['product']`
- Add `scrollPositionRestoration: 'top'` to `RouterModule.forRoot()` options

---

### Step 3: Add AuthGuard + AuthService

```bash
ng g guard guards/auth
ng g service services/auth
```

**`auth.service.ts`**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn(): boolean { return !!localStorage.getItem('token'); }
  getToken(): string | null { return localStorage.getItem('token'); }
  logout(): void { localStorage.removeItem('token'); }
}
```

- Implement `AuthGuard.canActivate()` — check `isLoggedIn()`, redirect to `/login?returnUrl=...` if not
- Wire the `/checkout` route with `canActivate: [AuthGuard]`

---

### Step 4: Build CheckoutComponent with Reactive Form

```bash
ng g component pages/checkout
```

**`app.module.ts`** — import `ReactiveFormsModule`

**`checkout.component.ts`**
- `FormBuilder` with nested `address` group
- Fields: `firstName`, `lastName`, `email`, `phone`, `address.street`, `address.city`, `address.state`, `address.pincode`, `paymentMethod`
- Getters for `email`, `phone`, `pincode`
- `onSubmit()` calls `markAllAsTouched()` first if invalid
- `prefillFromProfile()` uses `patchValue()`
- Implement `CanComponentDeactivate` — warn on dirty form leave

**`checkout.component.html`**
- `[formGroup]` + `formControlName` + `formGroupName="address"`
- Per-field errors gated on `.invalid && .touched`
- Submit button `[disabled]="checkoutForm.invalid"`

---

### Step 5: Register HTTP Interceptors

```bash
ng g interceptor interceptors/auth
ng g interceptor interceptors/error
ng g interceptor interceptors/loading
ng g service services/loading
```

- `AuthInterceptor` — `req.clone({ headers: req.headers.set('Authorization', 'Bearer ...') })`
- `ErrorInterceptor` — `catchError` for 401 → `/login`, 500 → toast
- `LoadingInterceptor` — `loadingService.start()` + `finalize(() => stop())`
- Register all three in `AppModule` with `multi: true`
- Add spinner to `app.component.html` driven by `loadingService.isLoading$ | async`

---

## 🔄 Day 3 Application Flow

```
User visits /checkout (not logged in)
        │
        ▼
Router runs AuthGuard.canActivate()
        │  localStorage has no token → false
        ▼
Redirect → /login?returnUrl=/checkout

User fills login form (template-driven)
        │  loginForm.valid = true → onSubmit()
        ▼
AuthService.login() → token stored in localStorage
        │
        ▼
Router navigates to returnUrl → /checkout
        │  AuthGuard re-checks → true ✅
        ▼
CheckoutComponent renders (lazy-loaded module downloads first)
        │
        ▼
User fills form (reactive)
        │  validators fire on each keystroke
        │  errors show per-field on .touched
        ▼
User clicks submit with empty fields
        │  markAllAsTouched() → all errors visible at once
        ▼
User fixes errors → form.valid = true → button enables
        │
        ▼
onSubmit() → orderService.placeOrder(form.value)
        │
        ▼
AuthInterceptor adds Bearer token → LoadingInterceptor shows spinner
        │
        ▼
API responds
        │
        ▼
LoadingInterceptor hides spinner
cartService.clearCart()
router.navigate(['/checkout/success'])
```

---

## ✅ End-of-Day Checklist

- [ ] Can explain the DI Injector Tree — root vs module vs component scope and when to use each
- [ ] `InjectionToken` created for `API_URL` and injected into `ProductService`
- [ ] `ProductResolver` preloads product data — `ProductDetailComponent` reads from `route.snapshot.data`
- [ ] `AuthGuard` blocks `/checkout` — redirects to `/login?returnUrl=/checkout`
- [ ] `UnsavedChangesGuard` warns when leaving checkout with a dirty form (`canDeactivate`)
- [ ] Router configured with `scrollPositionRestoration: 'top'` and `PreloadAllModules`
- [ ] `ProductDetailComponent` uses Observable `paramMap` (not snapshot) for param reading
- [ ] Login form built with **template-driven** approach (`NgForm`, `ngModel`, `#ref="ngModel"`)
- [ ] Checkout form built with **reactive** approach (`FormGroup`, `FormBuilder`, nested `address` group)
- [ ] `markAllAsTouched()` called on submit when form is invalid — all errors surface at once
- [ ] `patchValue()` used to prefill checkout from user profile (not `setValue()`)
- [ ] Getter shortcuts defined for frequently-accessed controls (`get email()`, etc.)
- [ ] `AuthInterceptor` attaches `Authorization: Bearer <token>` header via `req.clone()`
- [ ] `ErrorInterceptor` handles 401 → redirect and 500 → toast globally
- [ ] `LoadingInterceptor` drives a global spinner via `LoadingService.isLoading$`
- [ ] Can explain: `patchValue` vs `setValue`, snapshot vs Observable params, why interceptors must `clone()` the request
