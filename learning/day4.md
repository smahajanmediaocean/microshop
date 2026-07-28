# 🎓 Day 4 — NgModules Architecture, Pipes & Custom Directives
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | NgModules Deep Dive — Core, Shared, Feature Modules | ~2 hrs |
| Session 2 | Pipes — Built-in + Custom Pipes | ~2 hrs |
| Session 3 | Custom Directives — Attribute + Structural | ~2 hrs |
| Hands-On | Modularise MicroShop product UI | ~2 hrs |

---

## 🔷 What We're Building Today

We are turning the Day 1–3 app into a cleaner Angular codebase: shared UI moves into `SharedModule`, singleton logic moves into `CoreModule`, product pages get their own `ProductsModule`, and the catalog becomes richer with pipes and directives.

```text
Day 3 [everything in AppModule]            Day 4 [modular architecture]
─────────────────────────────────          ─────────────────────────────────────────
AppModule                                   AppModule
  HeaderComponent                             ├── CoreModule
  ProductCardComponent                        │     AuthService
  HomeComponent                               │     LoggerService
  CartComponent                               │     HTTP interceptors
                                             │
                                             ├── SharedModule
                                             │     ProductCardComponent
                                             │     TruncatePipe
                                             │     HighlightDirective
                                             │
                                             └── ProductsModule
                                                   ProductListComponent
                                                   ProductDetailComponent
        
```

---

## 🔷 SESSION 1 — NgModules Deep Dive

---

### 1️⃣ AppModule as the root composition layer

**The real-world mental model:**
> Your root module is the airport terminal map; it does not operate every shop itself, it wires terminals, shared services, and routes together.

**Why it matters in MicroShop:** As MicroShop grows, dumping every component into `AppModule` makes declarations noisy and lazy loading impossible.

Think of `AppModule` as the place where application-wide infrastructure is assembled.
It imports browser support, routing, singleton providers through `CoreModule`, and reusable building blocks through `SharedModule`.
Feature areas like products or checkout should come in as dedicated modules instead of as random declarations.
                        

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { ProductsModule } from './features/products/products.module';

@NgModule[{
  declarations: [AppComponent, HeaderComponent, FooterComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    ProductsModule
  ],
  bootstrap: [AppComponent]
}]
export class AppModule {}
                        
```

| Module | Owns | Should declare |
|---|---|---|
| AppModule | Bootstrapping and global wiring | Only root shell components |
| CoreModule | Singleton services | Usually none or tiny infrastructure pieces |
| SharedModule | Reusable UI + imports/exports | Pipes, directives, shared components |
| ProductsModule | Product feature screens | Feature pages and feature routing |

**MicroShop decision notes:**
- If a component is reused in many features, it belongs in `SharedModule`, not `AppModule`.
- If a service must exist exactly once, provide it in root or `CoreModule`.
- React developers can compare `AppModule` to a root `AppProviders` composition file.

---

### 2️⃣ CoreModule for singleton services only

**The real-world mental model:**
> CoreModule is the building security desk: it should be installed once at the entrance, never duplicated on every floor.

**Why it matters in MicroShop:** MicroShop auth, logging, and interceptors must remain singletons or your app ends up with duplicated global state.

The classic Angular pattern is simple: put app-wide services and infrastructure in `CoreModule`, import it once in `AppModule`, and guard against accidental re-import.
That makes your architecture readable for any future team member joining the project.
                        

```typescript
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

@NgModule[{
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ]
}]
export class CoreModule {
  constructor[@Optional[] @SkipSelf[] parentModule?: CoreModule] {
    if [parentModule] {
      throw new Error['CoreModule should only be imported in AppModule.'];
    }
  }
}
                        
```

| Put in CoreModule | Keep out of CoreModule |
|---|---|
| Interceptors | Feature pages |
| AuthService / LoggerService | Reusable dumb components |
| Global configuration tokens | Feature-specific forms |

**MicroShop decision notes:**
- `@Optional[]` allows Angular to inject `undefined` instead of crashing if there is no parent module.
- `@SkipSelf[]` tells Angular to look one injector up so the guard can detect duplicate imports.
- AngularJS teams often had global modules everywhere; modern Angular should keep this explicit and disciplined.

---

### 3️⃣ SharedModule for reusable UI building blocks

**The real-world mental model:**
> SharedModule is the component warehouse: common crates live here so every feature can pick them up instead of rebuilding them.

**Why it matters in MicroShop:** MicroShop's `ProductCardComponent`, common form imports, and custom pipes should be reusable from product, wishlist, and checkout flows.

`SharedModule` usually re-exports Angular modules you want everywhere and declares reusable UI.
That saves you from importing `CommonModule`, `ReactiveFormsModule`, and every shared component in every feature module by hand.
                        

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { TruncatePipe } from './pipes/truncate.pipe';
import { HighlightDirective } from './directives/highlight.directive';

@NgModule[{
  declarations: [ProductCardComponent, TruncatePipe, HighlightDirective],
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ProductCardComponent,
    TruncatePipe,
    HighlightDirective
  ]
}]
export class SharedModule {}
                        
```

| Export from SharedModule | Reason |
|---|---|
| CommonModule | Feature templates need `*ngIf`, `*ngFor`, `date`, `currency` |
| ReactiveFormsModule | Filters, checkout forms, search forms |
| ProductCardComponent | Reusable product tile across pages |
| TruncatePipe | Consistent text shortening rules |

**MicroShop decision notes:**
- Avoid putting singleton services in `SharedModule`; lazy-loaded modules can create multiple instances.
- React teams often create a `ui/` folder plus shared hooks; `SharedModule` is Angular's packaging mechanism for that idea.
- Keep shared components presentational so they remain safe to import everywhere.

---

### 4️⃣ ProductsModule as a feature boundary

**The real-world mental model:**
> A feature module is a shop floor with its own shelves, routing, and staff, but it still uses the mall's shared utilities.

**Why it matters in MicroShop:** The products area in MicroShop has its own list page, detail page, filters, and routes, so it deserves a clean boundary.

Feature modules make lazy loading straightforward and make code ownership clear.
When the products team changes only product screens, their declarations stay inside `ProductsModule`.
                        

```text
AppModule
  └── ProductsModule
        ├── ProductsRoutingModule
        ├── ProductListComponent
        ├── ProductDetailComponent
        └── ProductFiltersComponent
                        
```

```typescript
import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ProductsRoutingModule } from './products-routing.module';
import { ProductListComponent } from './pages/product-list/product-list.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { ProductFiltersComponent } from './components/product-filters/product-filters.component';

@NgModule[{
  declarations: [
    ProductListComponent,
    ProductDetailComponent,
    ProductFiltersComponent
  ],
  imports: [SharedModule, ProductsRoutingModule]
}]
export class ProductsModule {}
                        
```

| CLI command | Why you run it |
|---|---|
| `PS C:\workspace\Angular-app\microshop> ng g module features/products --routing` | Create feature module with routing |
| `PS C:\workspace\Angular-app\microshop> ng g c features/products/pages/product-list` | Create feature page |
| `PS C:\workspace\Angular-app\microshop> ng g c shared/components/product-card` | Move reusable card into shared area |

**MicroShop decision notes:**
- Feature modules can stay eager-loaded today and become lazy-loaded later with almost no refactor.
- Avoid importing feature modules into each other; share through `SharedModule` or services/facades.
- This is cleaner than the old AngularJS pattern of one giant module with everything registered globally.

---

## 🔷 SESSION 2 — Pipes

---

### 1️⃣ Built-in pipes you will use every week

**The real-world mental model:**
> A pipe is a tiny formatting machine attached to the template pipeline.

**Why it matters in MicroShop:** MicroShop constantly formats dates, money, names, product metadata, and observable values.

Angular pipes keep templates readable.
Instead of pre-formatting every field in the component class, you let the template express presentation rules near the UI.
That is especially useful for catalog prices, order timestamps, and quick debugging.
                        

```typescript
@Component[{
  selector: 'app-product-meta',
  template: `
    <p>Added on: {{ product.createdAt | date:'mediumDate' }}</p>
    <p>Price: {{ product.price | currency:'INR':'symbol':'1.0-0' }}</p>
    <p>Seller: {{ product.sellerName | uppercase }}</p>
    <pre>{{ product | json }}</pre>
    <ul>
      <li *ngFor="let entry of product.specs | keyvalue">
        {{ entry.key }}: {{ entry.value }}
      </li>
    </ul>
    <p>Preview tags: {{ product.tags | slice:0:3 | json }}</p>
  `
}]
export class ProductMetaComponent {
  @Input[{ required: true }] product!: Product;
}
                        
```

| Pipe | MicroShop example |
|---|---|
| `date` | Order placed at `28 Jul 2026` |
| `currency` | ₹4,999 product card price |
| `async` | Cart item count from store or RxJS stream |
| `slice` | Show only first 3 tags |

**MicroShop decision notes:**
- React usually handles this with helper functions or `Intl` formatting inside JSX.
- Avoid stacking too many heavy custom pipes in giant lists if the transformation is expensive.
- Pipes are for presentation, not for side effects.

---

### 2️⃣ Building a reusable TruncatePipe

**The real-world mental model:**
> TruncatePipe is the storefront sign cutter: it shortens long descriptions so every product tile stays aligned.

**Why it matters in MicroShop:** Real e-commerce descriptions vary wildly; without truncation, one tall card breaks the entire grid rhythm.

Custom pipes are plain classes decorated with `@Pipe`.
Keep them pure unless you intentionally need impure behavior, because pure pipes run only when their inputs change.
                        

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe[{
  name: 'truncate',
  standalone: false
}]
export class TruncatePipe implements PipeTransform {
  transform[value: string | null | undefined, limit: number = 80, suffix: string = '...']: string {
    if [!value] {
      return '';
    }

    if [value.length <= limit] {
      return value;
    }

    return value.slice[0, limit].trimEnd[] + suffix;
  }
}
                        
```

| Input | Template usage | Output |
|---|---|---|
| Long product description | `{{ product.description | truncate:60 }}` | First 60 chars + `...` |
| Short title | `{{ title | truncate:60 }}` | Original title |
| Null value | `{{ note | truncate }}` | Empty string |

**MicroShop decision notes:**
- This pipe belongs in `SharedModule` because multiple features will use it.
- If React developers are used to `description.slice[0, 60]`, the Angular pipe keeps that concern out of the template noise.
- Always handle `null` and `undefined` defensively in shared utilities.

---

### 3️⃣ Building a TimeAgoPipe for order activity

**The real-world mental model:**
> A time-ago pipe is the delivery tracker voice that says '2 hours ago' instead of dumping a raw timestamp.

**Why it matters in MicroShop:** Wishlist updates, reviews, order history, and admin dashboards all feel more human with relative time.

This example uses a pure transformation based on `Date.now[]`.
In a real app you may refresh the screen periodically, or switch to an impure pipe only when the UX truly needs live ticking.
                        

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe[{ name: 'timeAgo' }]
export class TimeAgoPipe implements PipeTransform {
  transform[value: string | Date]: string {
    const date = new Date[value];
    const seconds = Math.floor[[Date.now[] - date.getTime[]] / 1000];

    if [seconds < 60] return 'just now';
    if [seconds < 3600] return `${Math.floor[seconds / 60]} minutes ago`;
    if [seconds < 86400] return `${Math.floor[seconds / 3600]} hours ago`;
    if [seconds < 604800] return `${Math.floor[seconds / 86400]} days ago`;

    return date.toLocaleDateString['en-IN'];
  }
}
                        
```

| Seconds elapsed | Output |
|---|---|
| 45 | `just now` |
| 3,600 | `1 hours ago` |
| 172,800 | `2 days ago` |
| > 1 week | Fallback formatted date |

**MicroShop decision notes:**
- If you need perfect grammar, add singular/plural branching.
- For SSR later, prefer logic that does not assume browser globals.
- This is a good example of presentation logic that should not live inside a component method.

---

### 4️⃣ Pipe chaining and async data

**The real-world mental model:**
> Pipe chaining is like an assembly line: each pipe makes the output a little more ready for display.

**Why it matters in MicroShop:** MicroShop often combines async store data with formatting, especially for cart totals, usernames, and review timestamps.

Angular evaluates the chain from left to right.
The `async` pipe is special because it subscribes and unsubscribes for you, which is the Angular equivalent of React's render + effect cleanup combined.
                        

```typescript
@Component[{
  selector: 'app-header-cart-summary',
  template: `
    <span class="cart-count">
      {{ cartCount$ | async }}
    </span>

    <span class="cart-total">
      {{ cartTotal$ | async | currency:'INR':'symbol':'1.0-0' }}
    </span>

    <small>
      Last updated {{ lastCartChange | timeAgo | uppercase }}
    </small>
  `
}]
export class HeaderCartSummaryComponent {
  cartCount$ = this.store.select[selectCartItemCount];
  cartTotal$ = this.store.select[selectCartTotal];
  lastCartChange = new Date[].toISOString[];

  constructor[private store: Store] {}
}
                        
```

| Pattern | Prefer | Avoid |
|---|---|---|
| Observable display | `items$ | async` | Manual `.subscribe[]` for simple template reads |
| Formatting after async | `total$ | async | currency` | Formatting inside component just for display |
| Multiple transforms | Readable chain of tiny pipes | Huge component methods called from template |

**MicroShop decision notes:**
- When the chain starts looking clever, move logic into selectors or dedicated pipes.
- The `async` pipe is one of the biggest Angular productivity wins versus hand-managed subscriptions.
- Use pipe chaining to improve readability, not to hide business rules.

---

## 🔷 SESSION 3 — Custom Directives

---

### 1️⃣ Attribute directives with host listeners

**The real-world mental model:**
> An attribute directive is a behavior sticker you attach to an element so many components can share the same UI behavior.

**Why it matters in MicroShop:** MicroShop product cards, sale badges, and call-to-action buttons can all reuse the same hover highlight logic.

When the behavior is about DOM appearance or interaction, a directive is usually cleaner than copying the same event handlers into many components.
It is Angular's version of packaging UI behavior without wrapping everything in a new component.
                        

```typescript
import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive[{
  selector: '[appHighlight]'
}]
export class HighlightDirective {
  @Input[] highlightColor: string = '#fff3cd';

  constructor[private elementRef: ElementRef, private renderer: Renderer2] {}

  @HostListener['mouseenter']
  onMouseEnter[]: void {
    this.renderer.setStyle[this.elementRef.nativeElement, 'backgroundColor', this.highlightColor];
    this.renderer.setStyle[this.elementRef.nativeElement, 'transition', 'background-color 150ms ease'];
  }

  @HostListener['mouseleave']
  onMouseLeave[]: void {
    this.renderer.removeStyle[this.elementRef.nativeElement, 'backgroundColor'];
  }
}
                        
```

| Decorator | Role |
|---|---|
| `@Directive` | Registers reusable behavior |
| `@Input[]` | Lets parent template configure color |
| `@HostListener[]` | Reacts to host DOM events |
| `Renderer2` | Safe DOM style updates |

**MicroShop decision notes:**
- Direct DOM mutation through `nativeElement.style` works in demos, but `Renderer2` is the safer Angular abstraction.
- React teams often solve this with shared props plus event handlers; a directive keeps behavior reusable without prop drilling.
- Name selectors consistently: `appHighlight` is clearer than a generic `[highlight]` in large codebases.

---

### 2️⃣ Using HighlightDirective inside ProductCardComponent

**The real-world mental model:**
> This is like installing the same hover effect on every shelf label by clipping on one reusable attachment.

**Why it matters in MicroShop:** Your product catalog stays consistent without duplicating hover CSS or component logic everywhere.

Because the directive is exported from `SharedModule`, any feature module can apply it.
That is a good example of why shared behavior belongs in shared packaging instead of in one specific feature module.
                        

```typescript
@Component[{
  selector: 'app-product-card',
  template: `
    <article class="product-card"
             appHighlight
             [highlightColor]="product.stock < 5 ? '#ffe5e5' : '#eef7ff'">
      <img [src]="product.imageUrl" [alt]="product.name" />
      <h3>{{ product.name }}</h3>
      <p>{{ product.description | truncate:90 }}</p>
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

| UI case | Color choice | Meaning |
|---|---|---|
| Low stock | `#ffe5e5` | Gentle urgency |
| Healthy stock | `#eef7ff` | Neutral hover state |
| Featured item | `#fff8db` | Editorial emphasis |

**MicroShop decision notes:**
- Use directives for behavior; use inputs/outputs for data flow.
- Keep the directive generic so it works for cards, buttons, or list rows.
- This is a better fit than creating multiple CSS utility classes when the behavior depends on runtime data.

---

### 3️⃣ Structural directives with TemplateRef and ViewContainerRef

**The real-world mental model:**
> A structural directive is a gatekeeper that decides whether a block of template should exist in the DOM at all.

**Why it matters in MicroShop:** MicroShop often needs 'show this unless condition is true' logic for guest-only banners, empty states, or admin-only controls.

Angular's structural directives work by adding or removing embedded views.
`*ngIf` is just a directive behind the scenes; `UnlessDirective` shows the opposite pattern and teaches how Angular template syntax really works.
                        

```typescript
import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

@Directive[{
  selector: '[appUnless]'
}]
export class UnlessDirective {
  private hasView = false;

  constructor[
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef
  ] {}

  @Input[] set appUnless[condition: boolean] {
    if [!condition && !this.hasView] {
      this.viewContainer.createEmbeddedView[this.templateRef];
      this.hasView = true;
    } else if [condition && this.hasView] {
      this.viewContainer.clear[];
      this.hasView = false;
    }
  }
}
                        
```

| Concept | Meaning |
|---|---|
| `TemplateRef` | The blueprint of the hidden template block |
| `ViewContainerRef` | The anchor where Angular inserts/removes the view |
| `*appUnless="isLoggedIn"` | Render block only when `isLoggedIn` is false |

**MicroShop decision notes:**
- Custom structural directives must control rendering carefully to avoid duplicate embedded views.
- This is conceptually similar to a React component returning `null` conditionally, but Angular packages it as reusable template syntax.
- Prefix structural directive selectors with `app` or a library namespace to avoid collisions.

---

### 4️⃣ Real template usage and architecture checklist

**The real-world mental model:**
> Once modules, pipes, and directives are organised, the UI becomes a system instead of a pile of one-off tricks.

**Why it matters in MicroShop:** Day 4 is where MicroShop starts looking like a maintainable Angular application instead of a tutorial sandbox.

The final step is putting the pieces together.
Your templates stay small, your module boundaries stay obvious, and your reusable behaviors become easy to test.
                        

```typescript
@Component[{
  selector: 'app-product-list',
  template: `
    <section *appUnless="isLoading; else loadingBlock" class="product-grid">
      <app-product-card
        *ngFor="let product of products"
        [product]="product"
        [add]="onAddToCart[$event]">
      </app-product-card>
    </section>

    <ng-template #loadingBlock>
      <p>Loading products from MicroShop API...</p>
    </ng-template>
  `
}]
export class ProductListComponent {
  products: Product[] = [];
  isLoading = false;

  onAddToCart[product: Product]: void {
    console.log['Add to cart', product.id];
  }
}
                        
```

| Question | Best home |
|---|---|
| Reusable formatting? | Pipe |
| Reusable DOM behavior? | Directive |
| Reusable UI fragment? | Shared component |
| Feature-specific screen? | Feature module |

**MicroShop decision notes:**
- This architecture sets up Day 5 nicely because NgRx feature state maps well to feature modules.
- Review imports after every refactor; Angular module errors are usually declarations/exports/imports mistakes.
- The more reusable a piece becomes, the more important its API naming becomes.

---

## 🏗️ Day 4 Hands-On

- Create `CoreModule`, `SharedModule`, and `ProductsModule` under `C:\workspace\Angular-app\microshop\src\app`.
- Move `ProductCardComponent` into `SharedModule` and export it.
- Export `CommonModule`, `ReactiveFormsModule`, and `RouterModule` from `SharedModule`.
- Add the `CoreModule` guard with `@Optional[]` and `@SkipSelf[]`.
- Build `TruncatePipe` and apply it to long product descriptions on the grid.
- Build `TimeAgoPipe` and use it on a fake `lastUpdatedAt` field.
- Build `HighlightDirective` and use different colors for low-stock vs normal products.
- Build `UnlessDirective` and replace one `*ngIf` case with it.
- Create `ProductsRoutingModule` and place list/detail routes there.
- Verify the app still compiles and that shared declarations are no longer duplicated in `AppModule`.
