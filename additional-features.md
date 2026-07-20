# MicroShop — Additional Feature Assignments

These are standalone assignments to build **extra features** not covered in any day's
learning plan. Each one is independent — you can tackle them in any order.

---

## Feature 1 — Wishlist

### Goal
Let users save products they like but aren't ready to buy.

### What to Build

#### `WishlistService` (`src/app/services/wishlist.service.ts`)
| Member | Type | Purpose |
|---|---|---|
| `wishlistItems$` | `BehaviorSubject<Product[]>` | Stores wishlisted products |
| `wishlistCount$` | derived `Observable<number>` | Emits total count (like `cartCount$`) |
| `addToWishlist(product)` | `void` | Adds product if not already present |
| `removeFromWishlist(productId)` | `void` | Removes by id |
| `isInWishlist(productId)` | `boolean` | Returns true if product exists |

#### Wishlist Page (`src/app/pages/wishlist/`)
- List all wishlisted products
- Each item: **Remove** button + **Add to Cart** button
- Empty state: friendly message + link back to Home

#### Update `ProductCardComponent`
- Add a ❤️ heart icon button (toggle)
- Filled heart = already in wishlist; outline = not in wishlist
- Emit an `(toggleWishlist)` `@Output()` event to parent

#### Update `HeaderComponent`
- Add Wishlist nav link with a count badge (just like cart)

#### Routing
- Register `/wishlist` route in `app-routing.module.ts`

### Angular Concepts Practiced
`BehaviorSubject` · derived streams · `@Input`/`@Output` · `*ngIf`/`*ngFor` · routing · service injection

### Bonus (Optional)
- Persist wishlist in `localStorage` so it survives page refresh
- Show a brief "Added to wishlist!" snackbar/toast notification

---

## Feature 2 — Product Search

### Goal
Let users search products by name in real time from the Home page.

### What to Build

#### Search Bar Component (`src/app/components/search-bar/`)
- A simple `<input>` with a 🔍 icon
- Emits `(searchChange)` event with the current query string on every keystroke
- Accepts `[placeholder]` as `@Input()`

#### Update `HomeComponent`
- Add `<app-search-bar>` above the product grid
- Maintain a `searchQuery` string in the component
- Filter `products$` client-side using `combineLatest` + `map`:
  ```
  filteredProducts$ = combineLatest([products$, searchQuery$]).pipe(
    map(([products, query]) =>
      products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    )
  );
  ```
- Show a "No products found for '...'" message when results are empty
- Show the count of filtered results (e.g., "5 of 20 items")

#### Create a `SearchPipe` (`src/app/pipes/search.pipe.ts`) *(alternative approach)*
- `transform(products: Product[], query: string): Product[]`
- Use it in the template as `products | search: searchQuery`
- This is a simpler alternative to the `combineLatest` approach — pick one

### Angular Concepts Practiced
`@Input`/`@Output` · custom Pipe · `combineLatest` · reactive filtering · `*ngIf` for empty state

### Bonus (Optional)
- Debounce the search input by 300 ms using RxJS `debounceTime`
- Highlight the matched text inside each product name in the search results

---

## Feature 3 — Category Filter

### Goal
Let users filter products by category using a tab/chip bar on the Home page.

### What to Build

#### Category Filter Component (`src/app/components/category-filter/`)
- Accepts `[categories]` (`string[]`) as `@Input()`
- Accepts `[selected]` (`string`) as `@Input()` — currently active category
- Emits `(categoryChange)` with the clicked category string as `@Output()`
- Renders one button/chip per category + an **"All"** button at the start
- Active category button gets a highlighted style (add/remove a CSS class)

#### Update `ProductService`
- Add `getCategories(): Observable<string[]>` — calls `/products/categories` endpoint
  (FakeStore API already supports this)

#### Update `HomeComponent`
- Load categories on init: `categories$ = this.productService.getCategories()`
- Track `selectedCategory = 'all'`
- When a category is selected, call `productService.getByCategory(category)` (already
  exists) or filter the already-loaded product list client-side — your choice
- Pass both `[categories]` and `[selected]` into `<app-category-filter>`
- Handle the `(categoryChange)` event to update the displayed product list

### Angular Concepts Practiced
`@Input`/`@Output` · component communication · conditional CSS classes (`[class.active]`) ·
`switchMap` for reactive data switching · combining multiple Observables

### Bonus (Optional)
- Combine **Search + Category Filter** together so both work simultaneously
- Add a smooth CSS transition when the product grid re-renders after filtering
- Store the selected category in the URL as a query param (`?category=electronics`)
  using Angular Router's `queryParams`

---

## Summary

| Feature | Difficulty | Key Concepts |
|---|---|---|
| Wishlist | ⭐⭐ Beginner–Intermediate | BehaviorSubject, @Input/@Output, routing |
| Product Search | ⭐⭐ Beginner–Intermediate | Pipes, combineLatest, reactive filtering |
| Category Filter | ⭐⭐⭐ Intermediate | Component communication, switchMap, query params |

> **Tip:** Try building each feature **without looking at existing code first**.
> Refer back only when you're stuck. The goal is muscle memory, not copy-paste.
