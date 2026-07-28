# 🎓 Day 5 — NgRx State Management — Redux for Angular
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | NgRx Mental Model, CLI setup, Redux comparison | ~2 hrs |
| Session 2 | Complete Cart State — actions, reducer, selectors, effects | ~2 hrs |
| Session 3 | Component Integration, feature setup, DevTools | ~2 hrs |
| Hands-On | Migrate cart + add wishlist state | ~2 hrs |

---

## 🔷 What We're Building Today

Today we replace `CartService`'s `BehaviorSubject` with a scalable NgRx store. The cart becomes predictable, debuggable, and ready for wishlist, checkout, and persistence workflows.

```text
Click "Add to cart"
      ↓
dispatch[addToCart[{ product }]]
      ↓
Reducer updates immutable CartState
      ↓
Selectors derive items / count / total
      ↓
Header, Cart page, Checkout summary re-render
      ↓
Effect talks to API when async work is needed
        
```

---

## 🔷 SESSION 1 — NgRx Mental Model

---

### 1️⃣ Action → Reducer → Store → Selector → Component → Effect cycle

**The real-world mental model:**
> Imagine a warehouse ledger: workers never scribble directly on stock shelves; they submit official forms, the ledger updates, reports are regenerated, and side teams handle external calls.

**Why it matters in MicroShop:** Cart totals, badge counts, and wishlist state should all agree in MicroShop, even when many components touch them.

NgRx enforces one-way data flow.
Components dispatch actions, reducers calculate the next state immutably, selectors read slices of state, and effects handle async work like HTTP or local storage synchronization.
                        

```text
Component event
  → Action
    → Reducer
      → Store
        → Selector
          → Template
    ↘ Effect [async API / persistence]
                        
```

```typescript
import { createAction, props } from '@ngrx/store';
import { Product } from '../../models/product.model';

export const addToCart = createAction[
  '[Product List] Add To Cart',
  props<{ product: Product }>[]
];

export const removeFromCart = createAction[
  '[Cart Page] Remove From Cart',
  props<{ productId: number }>[]
];

export const loadCart = createAction['[Cart API] Load Cart'];
                        
```

| NgRx piece | Job | React/Redux Toolkit equivalent |
|---|---|---|
| Action | Describes what happened | `dispatch[{ type }]` / action creator |
| Reducer | Calculates next immutable state | `createSlice[].reducer` |
| Selector | Reads derived state | `useSelector` selector |
| Effect | Handles async work | `createAsyncThunk` or middleware |

**MicroShop decision notes:**
- Reducers must stay pure: no HTTP, no random IDs, no `Date.now[]` unless passed in.
- Selectors keep components skinny because formatting/aggregation can move out of the template.
- NgRx is the right fit when many parts of the app depend on the same state graph.

---

### 2️⃣ Installing the NgRx packages and schematics

**The real-world mental model:**
> This is like installing the store room, barcode scanner, and audit dashboard before the warehouse opens.

**Why it matters in MicroShop:** MicroShop needs store, effects, and devtools together; using only one part usually leads to half-adopted architecture.

Angular CLI plus NgRx schematics can scaffold the boring pieces fast.
Use the workspace root so files land in the correct app, and keep feature naming consistent from day one.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> ng add @ngrx/store
PS C:\\workspace\\Angular-app\\microshop> ng add @ngrx/effects
PS C:\\workspace\\Angular-app\\microshop> ng add @ngrx/store-devtools
PS C:\\workspace\\Angular-app\\microshop> ng g @ngrx/schematics:action store/cart/cart --creators
PS C:\\workspace\\Angular-app\\microshop> ng g @ngrx/schematics:reducer store/cart/cart --reducers=index.ts
PS C:\\workspace\\Angular-app\\microshop> ng g @ngrx/schematics:effect store/cart/cart --root=false --module=app.module.ts
PS C:\\workspace\\Angular-app\\microshop> ng g @ngrx/schematics:selector store/cart/cart --group
                        
```

| Package | Why MicroShop needs it |
|---|---|
| `@ngrx/store` | Global state container |
| `@ngrx/effects` | Async cart and wishlist workflows |
| `@ngrx/store-devtools` | Time-travel debugging |
| `@ngrx/entity` | Normalized collections later |

**MicroShop decision notes:**
- Keep generated files under `src\app\store` or `src\app\features\...\state` consistently.
- If your team uses Nx later, the same concepts map into library-based state folders.
- React developers can think of schematics as opinionated codemods plus folder scaffolding.

---

### 3️⃣ Redux Toolkit vs NgRx vocabulary

**The real-world mental model:**
> The laws of state management stay the same, but the street names change from one framework city to another.

**Why it matters in MicroShop:** Many teams already know Redux Toolkit, so mapping ideas reduces the learning curve for MicroShop contributors.

NgRx is more Angular-native: DI-friendly effects, typed selectors, and first-class module integration.
Redux Toolkit is terser, but the mental model is close enough that experience transfers well.
                        

```typescript
// Redux Toolkit mental map
// createSlice      -> createReducer + createAction
// useSelector      -> store.select[selector] or async pipe
// useDispatch      -> store.dispatch[action]
// createAsyncThunk -> Effect + success/failure actions
// Provider         -> StoreModule.forRoot[...]

// Angular component usage
export class HeaderComponent {
  cartItemCount$ = this.store.select[selectCartItemCount];

  constructor[private store: Store] {}

  clear[]: void {
    this.store.dispatch[clearCart[]];
  }
}
                        
```

| Redux Toolkit | NgRx |
|---|---|
| `createAction` inside slice | Standalone `createAction` |
| `createSlice` | `createReducer` + selectors + effects split by concern |
| Thunk | Effect |
| Hooks API | DI + `store.select` + `dispatch` |

**MicroShop decision notes:**
- NgRx's explicitness feels verbose at first, but teams often like the clarity in enterprise apps.
- Angular templates pair naturally with selectors and `async` pipe, reducing manual subscription code.
- Avoid mixing ad-hoc service state and NgRx state for the same concern unless you have a clear boundary.

---

### 4️⃣ State design before code

**The real-world mental model:**
> A bad warehouse map creates chaos even if your clerks are fast; state shape matters before reducers do.

**Why it matters in MicroShop:** The right cart state shape prevents awkward selector logic and makes future persistence or coupons easy.

Design the state around UI questions: cart items, loading, error, and timestamps are all directly useful.
That usually produces a cleaner store than blindly mirroring the API response shape.
                        

```typescript
export interface CartItem {
  productId: number;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
}

export interface AppState {
  cart: CartState;
}
                        
```

| Question from UI | State field |
|---|---|
| What products are in cart? | `items` |
| Should spinner show? | `loading` |
| Did persistence fail? | `error` |
| When did sync happen? | `lastSyncedAt` |

**MicroShop decision notes:**
- Do not store values you can easily derive, such as total price, if selectors can compute them.
- Keep state serializable so devtools and persistence remain easy.
- This explicit interface is also easier to test than mutable service fields.

---

## 🔷 SESSION 2 — Complete Cart State

---

### 1️⃣ Actions for cart workflows

**The real-world mental model:**
> Actions are stamped business events, not function calls.

**Why it matters in MicroShop:** MicroShop needs events that explain intent clearly: load, add, remove, clear, success, failure.

Good action naming answers two questions: who triggered it, and what happened.
That becomes extremely helpful when you inspect Redux DevTools during a checkout bug.
                        

```typescript
import { createAction, props } from '@ngrx/store';
import { CartItem } from './cart.state';
import { Product } from '../../models/product.model';

export const loadCart = createAction['[Cart API] Load Cart'];
export const loadCartSuccess = createAction['[Cart API] Load Cart Success', props<{ items: CartItem[] }>[]];
export const loadCartFailure = createAction['[Cart API] Load Cart Failure', props<{ error: string }>[]];
export const addToCart = createAction['[Product List] Add To Cart', props<{ product: Product }>[]];
export const removeFromCart = createAction['[Cart Page] Remove From Cart', props<{ productId: number }>[]];
export const clearCart = createAction['[Checkout Page] Clear Cart'];
                        
```

| Action kind | Should change state directly? |
|---|---|
| User intent [`addToCart`] | Yes, reducer can handle immediately |
| Async start [`loadCart`] | Yes, set loading true |
| Async success [`loadCartSuccess`] | Yes, replace items |
| Async failure [`loadCartFailure`] | Yes, store error |

**MicroShop decision notes:**
- Keep payloads minimal but useful; avoid passing an entire component instance or event object.
- Action names in square brackets usually indicate the source area.
- When debugging, descriptive actions are worth the extra characters.

---

### 2️⃣ Reducer with immutable updates

**The real-world mental model:**
> The reducer is the accountant: it reads the event and writes a new ledger page instead of scribbling on the old one.

**Why it matters in MicroShop:** OnPush components and memoized selectors in MicroShop depend on reference changes, so mutation bugs are costly.

Angular plus NgRx rewards immutable patterns.
If you mutate `items.push[...]`, you break change detection expectations and debugging clarity.
                        

```typescript
import { createReducer, on } from '@ngrx/store';
import * as CartActions from './cart.actions';
import { CartState } from './cart.state';

export const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  lastSyncedAt: null
};

export const cartReducer = createReducer[
  initialState,
  on[CartActions.loadCart, [state] => [{ ...state, loading: true, error: null }]],
  on[CartActions.loadCartSuccess, [state, { items }] => [{
    ...state,
    items,
    loading: false,
    lastSyncedAt: new Date[].toISOString[]
  }]],
  on[CartActions.loadCartFailure, [state, { error }] => [{ ...state, loading: false, error }]],
  on[CartActions.addToCart, [state, { product }] => {
    const existing = state.items.find[[item] => item.productId === product.id];

    if [existing] {
      return {
        ...state,
        items: state.items.map[[item] =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ]
      };
    }

    return {
      ...state,
      items: [
        ...state.items,
        { productId: product.id, title: product.title, price: product.price, imageUrl: product.imageUrl, quantity: 1 }
      ]
    };
  }],
  on[CartActions.removeFromCart, [state, { productId }] => [{
    ...state,
    items: state.items.filter[[item] => item.productId !== productId]
  }]],
  on[CartActions.clearCart, [state] => [{ ...state, items: [] }]]
];
                        
```

| Update type | Immutable pattern |
|---|---|
| Append item | `[...state.items, newItem]` |
| Update one item | `map[]` |
| Remove item | `filter[]` |
| Toggle loading | `{ ...state, loading: true }` |

**MicroShop decision notes:**
- Reducers are the easiest Angular code to unit test because they are pure functions.
- If quantity rules become more complex, extract pure helper functions outside the reducer.
- Never call services from the reducer.

---

### 3️⃣ Selectors for derived read models

**The real-world mental model:**
> Selectors are the BI dashboards of your store: they turn raw ledger rows into useful answers.

**Why it matters in MicroShop:** MicroShop's header wants count, cart page wants rows, checkout wants total, and all of them should stay in sync without duplicate logic.

Selectors centralize derivation.
Instead of letting three components each compute cart totals differently, you define the rule once and share it.
                        

```typescript
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CartState } from './cart.state';

export const selectCartState = createFeatureSelector<CartState>['cart'];

export const selectCartItems = createSelector[
  selectCartState,
  [state] => state.items
];

export const selectCartItemCount = createSelector[
  selectCartItems,
  [items] => items.reduce[[sum, item] => sum + item.quantity, 0]
];

export const selectCartTotal = createSelector[
  selectCartItems,
  [items] => items.reduce[[sum, item] => sum + item.price * item.quantity, 0]
];

export const selectCartLoading = createSelector[
  selectCartState,
  [state] => state.loading
];
                        
```

| Selector | Returns |
|---|---|
| `selectCartItems` | Array of cart rows |
| `selectCartItemCount` | Total quantity badge |
| `selectCartTotal` | Grand total amount |
| `selectCartLoading` | Boolean spinner flag |

**MicroShop decision notes:**
- Selectors are memoized, so repeated reads are cheap when inputs do not change.
- React developers can compare this to `reselect` or memoized derived state.
- Prefer selector composition over giant components with inline `reduce[]` calls.

---

### 4️⃣ Effects for async cart loading

**The real-world mental model:**
> Effects are the warehouse runners who leave the office, talk to outside systems, then return with official results.

**Why it matters in MicroShop:** MicroShop may load saved cart data from an API or local storage, but reducers must stay pure.

Effects listen to actions, call services, and emit follow-up actions.
They are Angular services under the hood, so DI and testing remain first-class.
                        

```typescript
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import * as CartActions from './cart.actions';
import { CartApiService } from '../../services/cart-api.service';

@Injectable[]
export class CartEffects {
  loadCart$ = createEffect[[] =>
    this.actions$.pipe[
      ofType[CartActions.loadCart],
      switchMap[[] =>
        this.cartApiService.getCart[].pipe[
          map[[items] => CartActions.loadCartSuccess[{ items }]],
          catchError[[] => of[CartActions.loadCartFailure[{ error: 'Unable to load cart.' }]]]
        ]
      ]
    ]
  ];

  constructor[private actions$: Actions, private cartApiService: CartApiService] {}
}
                        
```

| Operator | Why it is used here |
|---|---|
| `ofType` | Filter only cart actions |
| `switchMap` | Cancel older load requests if a new one starts |
| `map` | Transform API response into success action |
| `catchError` | Emit failure action instead of crashing the stream |

**MicroShop decision notes:**
- Effects are the NgRx answer to `createAsyncThunk` or custom middleware.
- Keep effects thin: orchestration in the effect, business rules in pure helpers or services.
- Returning a failure action keeps the state machine observable and testable.

---

## 🔷 SESSION 3 — Component Integration

---

### 1️⃣ Store setup with forRoot and forFeature

**The real-world mental model:**
> The root store is the mall's central database; feature stores are departments registering their own tables.

**Why it matters in MicroShop:** MicroShop needs a predictable way to grow cart today and wishlist, orders, and auth tomorrow.

At the app root you configure the store, effects, and devtools.
Feature modules can then register their own slices with `StoreModule.forFeature[]`.
                        

```typescript
import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { cartReducer } from './store/cart/cart.reducer';
import { CartEffects } from './store/cart/cart.effects';

@NgModule[{
  imports: [
    StoreModule.forRoot[{ cart: cartReducer }],
    EffectsModule.forRoot[[CartEffects]],
    StoreDevtoolsModule.instrument[{
      maxAge: 25,
      logOnly: environment.production
    }]
  ]
}]
export class AppStoreModule {}
                        
```

| API | Use when |
|---|---|
| `StoreModule.forRoot` | Register app-wide root reducers |
| `EffectsModule.forRoot` | Register app-wide effects |
| `StoreModule.forFeature` | Add feature reducer inside feature module |
| `EffectsModule.forFeature` | Add feature-specific effects |

**MicroShop decision notes:**
- In a small app `forRoot` is enough initially, but think in feature slices early.
- Day 11's Nx library architecture maps beautifully to feature store files.
- Do not create multiple root stores.

---

### 2️⃣ CartComponent and HeaderComponent consuming selectors

**The real-world mental model:**
> Selectors are read-only store reports; components read them and stay dumb about storage details.

**Why it matters in MicroShop:** Both the cart page and header badge must update from one source of truth in MicroShop.

The component code becomes smaller because no manual total calculation or subscription cleanup is needed.
This is where NgRx starts paying back its setup cost.
                        

```typescript
@Component[{
  selector: 'app-cart',
  template: `
    <section *ngIf="items$ | async as items">
      <article *ngFor="let item of items">
        <h4>{{ item.title }}</h4>
        <p>{{ item.price | currency:'INR' }} × {{ item.quantity }}</p>
        <button type="button" [click]="remove[item.productId]">Remove</button>
      </article>

      <strong>Total: {{ total$ | async | currency:'INR' }}</strong>
    </section>
  `
}]
export class CartComponent {
  items$ = this.store.select[selectCartItems];
  total$ = this.store.select[selectCartTotal];

  constructor[private store: Store] {}

  remove[productId: number]: void {
    this.store.dispatch[removeFromCart[{ productId }]];
  }
}
                        
```

| Component need | Selector / action |
|---|---|
| Header badge | `selectCartItemCount` |
| Cart rows | `selectCartItems` |
| Cart total | `selectCartTotal` |
| Remove row | `removeFromCart` |

**MicroShop decision notes:**
- The header no longer needs direct knowledge of `CartService` internals.
- `async` pipe handles subscription lifecycle automatically.
- This pattern fits perfectly with later `OnPush` change detection.

---

### 3️⃣ Dispatching from ProductListComponent and adding wishlist state

**The real-world mental model:**
> Presentational events become store events; the component simply says what happened.

**Why it matters in MicroShop:** MicroShop product tiles should dispatch `addToCart` and `toggleWishlist` instead of owning duplicated local arrays.

Once the event model is stable, adding another state slice like wishlist becomes formulaic.
That is the real enterprise value of NgRx: repeatable patterns.
                        

```typescript
@Component[{
  selector: 'app-product-list',
  template: `
    <app-product-card
      *ngFor="let product of products$ | async"
      [product]="product"
      [add]="addToCart[$event]"
      [toggleWishlist]="toggleWishlist[$event]">
    </app-product-card>
  `
}]
export class ProductListComponent {
  products$ = this.productFacade.products$;

  constructor[private store: Store, private productFacade: ProductFacadeService] {}

  addToCart[product: Product]: void {
    this.store.dispatch[addToCart[{ product }]];
  }

  toggleWishlist[product: Product]: void {
    this.store.dispatch[toggleWishlist[{ product }]];
  }
}
                        
```

| Concern | State home |
|---|---|
| Cart | NgRx feature state |
| Wishlist | NgRx feature state |
| Temporary input field value | Reactive form / local component state |
| Single modal open flag | Usually local component state |

**MicroShop decision notes:**
- Not every boolean belongs in NgRx; shared business state does.
- A wishlist reducer will look very similar to cart and is a great refactoring exercise.
- React users can compare this to deciding between local state and Redux state.

---

### 4️⃣ Angular DevTools and Redux DevTools workflow

**The real-world mental model:**
> Devtools are flight recorders: they let you replay state history instead of guessing.

**Why it matters in MicroShop:** MicroShop checkout bugs become much easier to diagnose when you can inspect every cart action in order.

Use Angular DevTools to inspect component trees and change detection, and Redux DevTools to inspect action history and state diffs.
Together they explain both render behavior and state behavior.
                        

```typescript
// Typical debugging workflow
// 1. Open Redux DevTools
// 2. Click "Add to cart" twice
// 3. Inspect action list:
//    [Product List] Add To Cart
//    [Product List] Add To Cart
// 4. Compare state diff after each action
// 5. Time-travel back to confirm the reducer logic

export class DebugTipsComponent {
  readonly tips = [
    'Check action payload first',
    'Check reducer state diff second',
    'Check selector output third',
    'Check template binding last'
  ];
}
                        
```

| Tool | Question it answers |
|---|---|
| Redux DevTools | Did the state change correctly? |
| Angular DevTools | Which components re-rendered? |
| Console logs | Quick local probes |
| Unit tests | Can this behavior be reproduced safely? |

**MicroShop decision notes:**
- If an action fires but UI stays stale, suspect selectors or change detection.
- If UI updates but the wrong state appears in DevTools, suspect reducer or action payload.
- This debugging discipline is far more reliable than ad-hoc console logging alone.

---

## 🏗️ Day 5 Hands-On

- Install `@ngrx/store`, `@ngrx/effects`, and `@ngrx/store-devtools` in `C:\workspace\Angular-app\microshop`.
- Create `cart.actions.ts`, `cart.reducer.ts`, `cart.selectors.ts`, `cart.effects.ts`, and `cart.state.ts`.
- Replace `CartService` `BehaviorSubject` reads with store selectors in `HeaderComponent` and `CartComponent`.
- Dispatch `addToCart`, `removeFromCart`, and `clearCart` from components.
- Create a tiny `CartApiService` or local persistence effect and wire `loadCart` on app startup.
- Add a new wishlist slice using the same NgRx pattern.
- Install and open Redux DevTools, then verify state history during cart actions.
- Write down which state should remain local component state versus global NgRx state.
