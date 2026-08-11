# 🎓 Day 7 — Performance Optimization — Lazy Loading, TrackBy & Virtual Scrolling
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Lazy loading, preloading, bundle analysis | ~2 hrs |
| Session 2 | TrackBy, DOM efficiency, template performance | ~2 hrs |
| Session 3 | Virtual scrolling with Angular CDK | ~2 hrs |
| Hands-On | Profile and optimise the product catalog | ~2 hrs |

---

## 🔷 What We're Building Today

Today is about making MicroShop feel fast. We will split route bundles, stop wasteful DOM recreation, and render very large product lists efficiently.

```text
Before
  main.js contains almost everything
  *ngFor re-renders too much
  1000 products = sluggish scroll

After
  /products chunk lazy-loads on demand
  trackBy preserves DOM nodes
  CDK virtual scroll renders only visible rows
        
```

---

## 🔷 SESSION 1 — Lazy Loading & Preloading

---

### 1️⃣ Why lazy loading matters

**The real-world mental model:**
> Lazy loading is like opening only the mall wing a customer walks into instead of lighting the entire building at 9 AM.

**Why it matters in MicroShop:** Users landing on MicroShop home should not download checkout, admin, and product-detail code immediately.

Route-level lazy loading creates separate build chunks.
That shrinks the initial bundle and improves first paint and time-to-interactive.
                        

```typescript
const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'products',
    loadChildren: [] =>
      import['./features/products/products.module'].then[[m] => m.ProductsModule]
  },
  {
    path: 'checkout',
    loadChildren: [] =>
      import['./features/checkout/checkout.module'].then[[m] => m.CheckoutModule]
  }
];
                        
```

| Route | Bundle timing |
|---|---|
| Home | Initial bundle |
| Products | Downloaded on first visit to `/products` |
| Checkout | Downloaded only when needed |
| Admin | Can stay separate for staff only |

**MicroShop decision notes:**
- Feature modules from Day 4 make lazy loading almost trivial.
- React's closest equivalent is route-based code splitting with `React.lazy`.
- Do not lazy-load tiny shared utilities; lazy-load meaningful feature areas.

---

### 2️⃣ Preload strategies

**The real-world mental model:**
> Preloading is opening the next likely shop wing quietly after the shopper has already entered the mall.

**Why it matters in MicroShop:** After the home page is stable, MicroShop can preload likely next routes such as products or cart.

Lazy loading splits bundles, but creates a small delay on the *first visit* to each route.
Preloading eliminates that delay by downloading chunks silently in the background once the app is idle.

```text
Without preloading:  User clicks → Network request → Chunk downloads → Page renders  (noticeable lag)
With preloading:     Chunk already downloaded → User clicks → Page renders instantly
```

---

#### Strategy 1 — No Preloading (Default)

```typescript
RouterModule.forRoot(routes)
// equivalent to:
RouterModule.forRoot(routes, { preloadingStrategy: NoPreloading })
```

Angular downloads each lazy chunk **only when that route is visited**.

| Use when |
|---|
| Routes are rarely navigated to |
| Users are on mobile or metered connections |
| The lazy chunk is very large and rarely needed |

---

#### Strategy 2 — `PreloadAllModules`

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, PreloadAllModules, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
  },
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.module').then(m => m.CartModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

**How it works:**
1. App bootstraps and renders the initial route
2. Angular waits for the app to become idle
3. It then fetches **every** lazy route chunk in the background, one by one

| Use when |
|---|
| Small-to-medium number of lazy routes |
| Chunks are reasonably sized (< 500 KB each) |
| Users are likely to visit most routes in a session |

**Drawback:** Downloads everything even if the user never visits those routes — wasteful on slow connections.

---

#### Strategy 3 — Custom Selective Preloading

Only preload routes you explicitly flag with `data: { preload: true }`.

```typescript
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    return route.data?.['preload'] ? load() : of(null);
  }
}
```

```typescript
const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule),
    data: { preload: true }   // ✅ will be preloaded in background
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
    // no flag — downloaded only when the admin actually navigates here
  }
];

RouterModule.forRoot(routes, { preloadingStrategy: SelectivePreloadStrategy })
```

| Use when |
|---|
| You know which routes are visited most often |
| Some routes (admin, reports) should stay on-demand only |
| You want fine-grained control without a third-party library |

---

#### Strategy 4 — Quicklink-style (Intent-aware)

Preloads chunks for routes whose **links are currently visible in the viewport** — the smartest bandwidth-friendly approach.

```bash
npm install ngx-quicklink
```

```typescript
import { QuicklinkModule, QuicklinkStrategy } from 'ngx-quicklink';

@NgModule({
  imports: [
    QuicklinkModule,
    RouterModule.forRoot(routes, { preloadingStrategy: QuicklinkStrategy })
  ]
})
export class AppRoutingModule {}
```

**How it works under the hood:**
- Uses the browser's `IntersectionObserver` API
- Watches `<a routerLink="...">` elements on the page
- When a link scrolls into view → preloads that route's chunk
- Links scrolled out of view are deprioritised

| Use when |
|---|
| Content-heavy pages with many visible nav links |
| You want intent-driven preloading without manual flags |
| Bandwidth conservation matters (mobile users) |

---

#### Strategy 5 — Network-aware Preloading (Advanced)

Check the user's connection quality before deciding to preload at all.

```typescript
import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkAwarePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const conn = (navigator as any).connection;

    // Skip preloading on slow or data-saver connections
    if (conn && (conn.saveData || conn.effectiveType === '2g')) {
      return of(null);
    }

    return route.data?.['preload'] ? load() : of(null);
  }
}
```

| Use when |
|---|
| Your users are primarily on mobile or variable connections |
| You want to respect the OS-level Data Saver setting |
| Combining with selective flagging for best control |

---

#### Strategy Comparison

| Strategy | Downloads | Triggered | Best For |
|---|---|---|---|
| `NoPreloading` | On demand only | User navigates | Rarely-visited routes |
| `PreloadAllModules` | Everything | After app idle | Small apps, fast connections |
| Custom selective | Flagged routes only | After app idle | Medium apps, controlled preloading |
| Quicklink | Visible links only | On scroll/render | Content-heavy apps |
| Network-aware | Conditionally | After idle | Mobile / data-conscious apps |

---

**MicroShop recommended approach:**

```typescript
// Preload products & cart (common paths), skip admin & reports
const routes: Routes = [
  { path: 'products', loadChildren: ..., data: { preload: true } },
  { path: 'cart',     loadChildren: ..., data: { preload: true } },
  { path: 'admin',    loadChildren: ... },  // staff only — skip preload
];

RouterModule.forRoot(routes, { preloadingStrategy: SelectivePreloadStrategy })
```

**MicroShop decision notes:**
- Preloading improves second-page navigation, not first paint.
- Measure on realistic network conditions (Chrome DevTools → Network → Slow 4G) before enabling.
- Start with `SelectivePreloadStrategy` and flag only the top 2–3 routes users hit most.
- Quicklink is a drop-in upgrade if you later want fully intent-driven behaviour.
- This is a pragmatic optimisation after route splitting already exists.

---

### 3️⃣ Bundle analysis and chunk reading

**The real-world mental model:**
> Bundle analysis is reading your shipping invoice to see which boxes became absurdly heavy.

**Why it matters in MicroShop:** MicroShop should know whether images, libraries, or one feature accidentally bloated the production build.

The `dist` folder tells a story: initial bundles, lazy chunks, and asset sizes.
You do not need to guess where bytes went.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> ng build --configuration=production --stats-json
PS C:\\workspace\\Angular-app\\microshop> npx webpack-bundle-analyzer .\\dist\\microshop\\stats.json

// Example files you might see in dist
// main.abc123.js
// polyfills.def456.js
// styles.ghi789.css
// features-products-products-module.jkl012.js
// features-checkout-checkout-module.mno345.js
                        
```

| Artifact | What it means |
|---|---|
| `main.*.js` | Initial application code |
| Feature chunk | Lazy-loaded route code |
| `styles.*.css` | Global CSS bundle |
| `stats.json` | Input for bundle analyzer |

**MicroShop decision notes:**
- If a lazy chunk is huge, inspect imports inside that feature module.
- Large icon packs and chart libraries are common hidden offenders.
- Keep screenshots of bundle analysis when comparing optimisation work.

---

### 4️⃣ Tree shaking and import discipline

**The real-world mental model:**
> Tree shaking is the shipping team removing unused catalog boxes before the truck leaves.

**Why it matters in MicroShop:** Bad import habits can make MicroShop ship far more code than the UI actually uses.

Tree shaking works best when dependencies are imported precisely and side effects are minimal.
Deep imports and giant utility libraries should be reviewed carefully.
                        

```typescript
// ✅ Prefer specific Angular and RxJS imports
import { map, switchMap } from 'rxjs';
import { CurrencyPipe } from '@angular/common';

// ❌ Avoid importing giant utility surfaces if you only need one helper
// import _ from 'lodash';

// ✅ Prefer one focused helper or native array APIs
const visibleProducts = products
  .filter[[product] => product.category === selectedCategory]
  .map[[product] => [{ ...product, displayPrice: `₹${product.price}` }]];
                        
```

| Practice | Performance impact |
|---|---|
| Focused imports | Smaller bundles |
| Lazy feature boundaries | Smaller initial load |
| Avoid dead dependencies | Less parse/execution cost |
| Native APIs where enough | Often smaller than utility libraries |

**MicroShop decision notes:**
- Angular production builds already do a lot, but they cannot fix architecture mistakes alone.
- Bundle size is a product decision too, not just a tooling detail.
- Optimise with evidence, not superstition.

---

## 🔷 SESSION 2 — TrackBy & DOM Optimization

---

### 1️⃣ Why `*ngFor` needs `trackBy`

**The real-world mental model:**
> Without `trackBy`, Angular treats every shelf item as suspiciously new when the list changes.

**Why it matters in MicroShop:** MicroShop product lists, cart rows, and review lists should keep DOM nodes stable during filters and refreshes.

When Angular cannot identify items, it may recreate DOM nodes unnecessarily.
`trackBy` tells Angular which identity to preserve.
                        

```typescript
@Component[{
  selector: 'app-product-grid',
  template: `
    <app-product-card
      *ngFor="let product of products; trackBy: trackByProductId"
      [product]="product">
    </app-product-card>
  `
}]
export class ProductGridComponent {
  @Input[] products: Product[] = [];

  trackByProductId[index: number, product: Product]: number {
    return product.id;
  }
}
                        
```

| List scenario | Best `trackBy` |
|---|---|
| Products | `product.id` |
| Cart rows | `item.productId` |
| Reviews | `review.id` |
| Static 3-item menu | Often optional |

**MicroShop decision notes:**
- Never use `index` as trackBy when items can reorder or filter.
- TrackBy helps preserve focus, scroll position, and component state.
- Pair `trackBy` with immutable updates and OnPush for best results.

---

### 2️⃣ Multiple `trackBy` patterns

**The real-world mental model:**
> Identity rules differ by shelf; product IDs, category keys, or cart row IDs can each be the barcode.

**Why it matters in MicroShop:** MicroShop has many repeating structures, and each one should use a stable identity source.

Not every list is products.
Make `trackBy` a deliberate habit for any dynamic repeated UI.
                        

```typescript
trackByCategory[index: number, category: Category]: string {
  return category.slug;
}

trackByCartItem[index: number, item: CartItem]: number {
  return item.productId;
}

trackByCoupon[index: number, coupon: Coupon]: string {
  return coupon.code;
}
                        
```

| Bad identity choice | Why it hurts |
|---|---|
| `index` | Breaks on reordering |
| Random value | Forces full re-render |
| Whole object stringification | Slow and unstable |
| Stable ID field | Correct choice |

**MicroShop decision notes:**
- Make the function tiny and pure.
- If your backend lacks IDs, create stable keys near data ingestion time.
- The best trackBy is boring and predictable.

---

### 3️⃣ Pure pipes vs template methods

**The real-world mental model:**
> A template method is like calling the warehouse office every time someone glances at a shelf; a pure pipe is a cached label printer.

**Why it matters in MicroShop:** MicroShop templates should not repeatedly recompute expensive values during every change-detection cycle.

Methods in templates run often.
Prefer selectors, precomputed view models, or pure pipes when the logic is not trivial.
                        

```typescript
// ❌ Template
// <span>{{ getDiscountLabel[product] }}</span>

// ✅ Pure pipe
@Pipe[{ name: 'discountLabel', pure: true }]
export class DiscountLabelPipe implements PipeTransform {
  transform[product: Product]: string {
    if [!product.originalPrice || product.originalPrice <= product.price] {
      return 'No discount';
    }

    const discount = Math.round[[[product.originalPrice - product.price] / product.originalPrice] * 100];
    return `${discount}% OFF`;
  }
}
                        
```

| Template pattern | Prefer |
|---|---|
| Expensive method call | Pure pipe or selector |
| Inline `reduce[]` | Selector or component precompute |
| Complex conditional formatting | Dedicated pipe |
| Tiny field read | Plain binding is fine |

**MicroShop decision notes:**
- A method that just forwards to another method is still noise in a hot template.
- Measure before optimising everything; some simple methods are harmless.
- The goal is predictable, cheap template evaluation.

---

### 4️⃣ Template expression best practices

**The real-world mental model:**
> Templates should be price tags, not accounting departments.

**Why it matters in MicroShop:** Readable templates make MicroShop faster to maintain and usually faster to run.

Keep templates declarative.
Move looping logic, filtering, aggregation, and network orchestration out of the HTML layer.
                        

```typescript
// ✅ View-model-first approach
export interface ProductCardVm {
  id: number;
  title: string;
  priceLabel: string;
  isLowStock: boolean;
}

const vm: ProductCardVm = {
  id: product.id,
  title: product.title,
  priceLabel: new Intl.NumberFormat['en-IN', { style: 'currency', currency: 'INR' }].format[product.price],
  isLowStock: product.stock < 5
};
                        
```

| Good template habit | Avoid |
|---|---|
| Bind fields | Heavy calculations in interpolation |
| Use `async` pipe | Manual subscriptions just for display |
| Use `trackBy` | Anonymous repeated DOM churn |
| Use pipes/selectors | Duplicated formatting logic |

**MicroShop decision notes:**
- Templates are easier to test when they mostly bind ready-made values.
- If a line is hard to read in HTML, it is a good candidate for extraction.
- Performance and readability often improve together here.

---

## 🔷 SESSION 3 — Virtual Scrolling & CDK

---

### 1️⃣ When virtual scroll is worth it

**The real-world mental model:**
> Virtual scrolling is showing only the store aisles currently in front of the shopper instead of building the entire warehouse on screen.

**Why it matters in MicroShop:** If MicroShop renders 1000+ products, normal `*ngFor` becomes wasteful even with OnPush and trackBy.

Virtual scroll renders only visible items plus a small buffer.
That dramatically reduces DOM size and scrolling cost.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> ng add @angular/cdk

import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule[{
  imports: [SharedModule, ScrollingModule]
}]
export class ProductsModule {}
                        
```

| List size | Recommendation |
|---|---|
| < 50 | Normal list is usually fine |
| 50–300 | Use trackBy and measure first |
| 300–1000 | Consider pagination or virtual scroll |
| 1000+ | Virtual scroll is often worth it |

**MicroShop decision notes:**
- Virtual scroll works best when rows have consistent or manageable heights.
- Sometimes pagination is the simpler UX answer.
- Do not optimise huge invisible data sets if the API can page server-side.

---

### 2️⃣ Using `<cdk-virtual-scroll-viewport>`

**The real-world mental model:**
> The viewport is the window frame; Angular only paints what fits in the window plus a small safety margin.

**Why it matters in MicroShop:** MicroShop category browsing should remain smooth even with large imported catalogs.

Replace `*ngFor` with `*cdkVirtualFor` inside the viewport.
You still use `trackBy` for stable identity.
                        

```typescript
@Component[{
  selector: 'app-product-virtual-list',
  template: `
    <cdk-virtual-scroll-viewport itemSize="280" class="product-viewport">
      <app-product-card
        *cdkVirtualFor="let product of products; trackBy: trackByProductId"
        [product]="product"
        [add]="add.emit[product]">
      </app-product-card>
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .product-viewport {
      height: 80vh;
      width: 100%;
    }
  `]
}]
export class ProductVirtualListComponent {
  @Input[] products: Product[] = [];
  @Output[] add = new EventEmitter<Product>[];

  trackByProductId[index: number, product: Product]: number {
    return product.id;
  }
}
                        
```

| Config | Meaning |
|---|---|
| `itemSize` | Approximate row height in pixels |
| Viewport height | How much screen space is scrollable |
| `*cdkVirtualFor` | Virtualised repeater |

**MicroShop decision notes:**
- Measure item height realistically; wrong estimates can cause odd scroll behaviour.
- Cards of wildly different heights may need a different UX approach.
- This is an Angular CDK feature, not a third-party hack.

---

### 3️⃣ Profiling renders in Angular DevTools

**The real-world mental model:**
> Profiling is CCTV for your render pipeline.

**Why it matters in MicroShop:** MicroShop should confirm improvements instead of assuming them.

Angular DevTools can show change detection and component activity.
Use it before and after each optimisation to verify impact.
                        

```typescript
export class ProfilingChecklist {
  readonly steps = [
    'Record before adding trackBy',
    'Apply OnPush + trackBy',
    'Record again',
    'Check component render counts',
    'Switch to virtual scroll for very large lists',
    'Compare frame smoothness'
  ];
}
                        
```

| Signal of waste | Likely cause |
|---|---|
| Many repeated card renders on filter toggle | Missing trackBy or mutable updates |
| Huge DOM node count | No virtualisation or pagination |
| Large initial JS parse time | Overweight initial bundle |
| Slow route change | Missing lazy loading |

**MicroShop decision notes:**
- Keep a short benchmark script so teammates can reproduce the profile.
- Look for the biggest wins first: bundle split, render count, DOM size.
- Performance work is easier when it is observable.

---

### 4️⃣ Bundle-size and render audit checklist

**The real-world mental model:**
> A performance checklist is the store opening checklist: boring, repeatable, and lifesaving.

**Why it matters in MicroShop:** MicroShop should have a repeatable way to check performance before release.

Create a simple team checklist so performance is not a one-day exercise.
Most regressions happen gradually.
                        

```typescript
export const performanceChecklist = [
  'Lazy-loaded feature routes verified',
  'trackBy used on dynamic *ngFor lists',
  'OnPush applied to dumb list-heavy components',
  'No expensive template methods',
  'Virtual scroll or pagination for large datasets',
  'Production bundle analyzed after major dependency changes'
];
                        
```

| Area | Check |
|---|---|
| Routing | Lazy chunk created |
| Templates | No heavy expressions |
| Lists | trackBy present |
| Large datasets | Virtual scroll/pagination strategy chosen |

**MicroShop decision notes:**
- Performance discipline beats one-off heroics.
- Add this checklist to PR reviews for product-heavy screens.
- The app that stays fast is the one with guardrails.

---

## 🏗️ Day 7 Hands-On

- Convert products and checkout routes to lazy-loaded modules.
- Try `PreloadAllModules` first, then replace it with `SelectivePreloadStrategy` — flag only `/products` and `/cart`.
- (Stretch) Install `ngx-quicklink` and swap to `QuicklinkStrategy`; observe which routes get preloaded based on visible links.
- Run `ng build --configuration=production --stats-json` and inspect bundle sizes.
- Add `trackBy` to every meaningful `*ngFor` in catalog, cart, and review templates.
- Replace at least one repeated template method with a pure pipe or selector.
- Install `@angular/cdk` and build a virtual-scroll version of the product list.
- Profile render counts in Angular DevTools before and after optimisation.
- Write down a short performance checklist for future MicroShop releases.
