# Angular 19 — Hands-On Coding Assignments

> **Goal:** Build practical Angular 19 skills across four key areas.  
> **Rules:** Write the code yourself. Hints are there to guide you, not give away the answer.  
> **Order:** Easy → Intermediate → Hard within each section.

---

## Table of Contents

1. [Observables (RxJS)](#1-observables-rxjs)
2. [ng-openapi-gen (API Integration)](#2-ng-openapi-gen-api-integration)
3. [Micro Frontend (MFE) with Module Federation](#3-micro-frontend-mfe-with-module-federation)
4. [Playwright (E2E Testing)](#4-playwright-e2e-testing)

---

## 1. Observables (RxJS)

### 🟢 Easy — Assignment 1.1: Basic Observable Stream

**Problem:**  
Create an Angular service `CounterService` that exposes an Observable emitting numbers 1 to 10 with a 500ms delay between each emission.  
In a component, subscribe to this stream and display the current count on the screen. When the stream completes, display "Done!".

**Requirements:**
- Use `interval` or `timer` from RxJS
- Unsubscribe properly when the component is destroyed (no memory leaks!)
- Display loading state before first emission

**Hints:**
<details>
<summary>💡 Hint 1</summary>
Look into `interval(500)` combined with `take(10)` to limit emissions.
</details>
<details>
<summary>💡 Hint 2</summary>
Use `takeUntilDestroyed()` (Angular 16+) or implement `OnDestroy` with a `Subject` + `takeUntil` to avoid memory leaks.
</details>
<details>
<summary>💡 Hint 3</summary>
Track completion state with a boolean flag toggled inside the `complete` callback of your `subscribe()`.
</details>

---

### 🟢 Easy — Assignment 1.2: Subject as Event Bus

**Problem:**  
Build two sibling components: `SenderComponent` and `ReceiverComponent`.  
- `SenderComponent` has an input field and a "Send" button.  
- When "Send" is clicked, `ReceiverComponent` should display the message without using `@Input`/`@Output`.

Use a shared `MessageBusService` backed by a `Subject`.

**Requirements:**
- Use `Subject<string>` in the service
- Both components must be siblings (not parent-child)
- Messages should accumulate in a list on the receiver side

**Hints:**
<details>
<summary>💡 Hint 1</summary>
`Subject` acts as both an Observable and an Observer — you can call `.next()` on it and subscribe to it.
</details>
<details>
<summary>💡 Hint 2</summary>
Consider using `BehaviorSubject` instead if you want the receiver to get the last value when it subscribes late.
</details>

---

### 🟡 Intermediate — Assignment 1.3: Search with Debounce

**Problem:**  
Build a product search bar that calls a mock API (you can use `https://dummyjson.com/products/search?q=<term>`) as the user types.

**Requirements:**
- Debounce requests by 400ms
- Cancel the previous in-flight HTTP request if a new one is triggered (no race conditions!)
- Show a spinner while loading
- Handle errors gracefully (display error message, do NOT crash)
- Use `async` pipe instead of manual subscription

**Hints:**
<details>
<summary>💡 Hint 1</summary>
Chain `debounceTime(400)`, `distinctUntilChanged()`, and `switchMap()` on a `FormControl`'s `valueChanges`.
</details>
<details>
<summary>💡 Hint 2</summary>
`switchMap` automatically cancels the previous Observable — that's what prevents race conditions.
</details>
<details>
<summary>💡 Hint 3</summary>
Use `catchError` inside the `switchMap` (not outside!) so a single error doesn't kill the outer stream.
</details>

---

### 🟡 Intermediate — Assignment 1.4: Combine Multiple Streams

**Problem:**  
You have two API calls:
1. `GET /users/:id` — returns user details
2. `GET /users/:id/orders` — returns that user's orders

Display both pieces of data on the same page. The two API calls must run **in parallel**, not sequentially.

**Requirements:**
- Both calls should fire simultaneously
- The page renders only when **both** have resolved
- If either call fails, show a meaningful error

**Hints:**
<details>
<summary>💡 Hint 1</summary>
`forkJoin([obs1, obs2])` fires both Observables simultaneously and emits once when both complete.
</details>
<details>
<summary>💡 Hint 2</summary>
For sequential dependent calls (e.g., fetch user first, then use userId for orders), use `switchMap` or `concatMap` instead.
</details>

---

### 🔴 Hard — Assignment 1.5: Custom RxJS Operator

**Problem:**  
Create a custom pipeable RxJS operator called `retryWithBackoff(maxRetries: number, initialDelay: number)`.  
It should retry a failed Observable with exponentially increasing delays:  
- Retry 1: wait `initialDelay`ms  
- Retry 2: wait `initialDelay * 2`ms  
- Retry 3: wait `initialDelay * 4`ms  
- After `maxRetries` exhausted: throw the error

Test it on an HTTP call that randomly fails.

**Hints:**
<details>
<summary>💡 Hint 1</summary>
A custom pipeable operator is just a function that returns `(source: Observable<T>) => Observable<T>`.
</details>
<details>
<summary>💡 Hint 2</summary>
Look into `retryWhen` (deprecated) or the newer `retry({ count, delay })` operator signature in RxJS 7+.
</details>
<details>
<summary>💡 Hint 3</summary>
For manual retry logic, use `catchError` + `timer(delay)` + `mergeMap(() => throwError(...))` pattern.
</details>

---

## 2. ng-openapi-gen (API Integration)

> **Setup:** Install with `npm install ng-openapi-gen --save-dev`  
> Use the free public API spec: `https://petstore3.swagger.io/api/v3/openapi.json`

### 🟢 Easy — Assignment 2.1: Generate and Explore Services

**Problem:**  
1. Download the PetStore OpenAPI spec (`openapi.json`) locally.
2. Create an `ng-openapi-gen.json` config file in the project root.
3. Run the generator to produce Angular services and models under `src/app/api/`.
4. Create a `PetListComponent` that injects the generated `PetService` and lists all available pets.

**Requirements:**
- Generated code must NOT be manually edited
- Display pet name, status (available/pending/sold), and a photo if available

**Hints:**
<details>
<summary>💡 Hint 1</summary>

Minimal `ng-openapi-gen.json`:
```json
{
  "$schema": "node_modules/ng-openapi-gen/ng-openapi-gen-schema.json",
  "input": "openapi.json",
  "output": "src/app/api"
}
```
</details>
<details>
<summary>💡 Hint 2</summary>
Run: `npx ng-openapi-gen --config ng-openapi-gen.json`  
Then re-run whenever the spec changes — never hand-edit generated files.
</details>
<details>
<summary>💡 Hint 3</summary>
Generated services return Observables. Provide `ApiModule.forRoot({ rootUrl: 'https://petstore3.swagger.io/api/v3' })` in your `AppModule` or `app.config.ts`.
</details>

---

### 🟡 Intermediate — Assignment 2.2: CRUD with Generated Services

**Problem:**  
Using the generated PetStore services, build a small pet management UI:
- **List** all pets filtered by status
- **Add** a new pet via a reactive form
- **Update** an existing pet's name
- **Delete** a pet with a confirmation dialog

**Requirements:**
- Use only the generated `PetService` methods — no raw `HttpClient` calls
- Forms must use `ReactiveFormsModule` with proper validation
- Show success/error snackbar/toast after each operation

**Hints:**
<details>
<summary>💡 Hint 1</summary>
The generator creates strictly typed request/response models. Explore `src/app/api/models/` to understand what shape `addPet` expects.
</details>
<details>
<summary>💡 Hint 2</summary>
For confirmation dialogs in Angular Material use `MatDialog`. For a standalone approach, a simple boolean flag + conditional template works too.
</details>

---

### 🔴 Hard — Assignment 2.3: Multi-Spec Generation + Interceptor

**Problem:**  
Your app now consumes **two** different APIs:
1. The PetStore API (above)
2. A second mock API: `https://jsonplaceholder.typicode.com` (create a hand-crafted `openapi.json` for `/posts` and `/users` endpoints)

Generate separate service sets for each API (`src/app/api/petstore` and `src/app/api/placeholder`).

Additionally, implement an `AuthInterceptor` that:
- Attaches a Bearer token to PetStore requests
- Does **not** attach it to JSONPlaceholder requests

**Hints:**
<details>
<summary>💡 Hint 1</summary>
Use the `module` and `prefix` options in `ng-openapi-gen.json` to namespace each generated module separately.
</details>
<details>
<summary>💡 Hint 2</summary>
In Angular 19, use functional `HttpInterceptorFn`. Check `req.url` to decide whether to attach the auth header.
</details>
<details>
<summary>💡 Hint 3</summary>
Write a custom OpenAPI 3.0 JSON for JSONPlaceholder — define at minimum the `paths` and `components.schemas` sections for `/posts` and `/users`.
</details>

---

## 3. Micro Frontend (MFE) with Module Federation

> **Setup:** Use `@angular-architects/module-federation` plugin.  
> `ng add @angular-architects/module-federation --project <name> --port <port> --type remote`

### 🟢 Easy — Assignment 3.1: Shell + One Remote

**Problem:**  
Create two Angular 19 applications:
1. **Shell** (`shell-app`) running on port `4200`
2. **Remote** (`products-mfe`) running on port `4201`

The shell should lazy-load the `ProductsModule` from the remote at runtime via Module Federation.

**Requirements:**
- Route `/products` in the shell loads the remote module
- The remote app must also work as a **standalone** application (run it directly on port 4201 and verify)
- No direct npm dependency between the two apps

**Hints:**
<details>
<summary>💡 Hint 1</summary>

In the remote's `webpack.config.js`, expose the module:
```js
exposes: {
  './ProductsModule': './src/app/products/products.module.ts'
}
```
</details>
<details>
<summary>💡 Hint 2</summary>

In the shell's routing:
```ts
{
  path: 'products',
  loadChildren: () => loadRemoteModule({
    type: 'module',
    remoteEntry: 'http://localhost:4201/remoteEntry.js',
    exposedModule: './ProductsModule'
  }).then(m => m.ProductsModule)
}
```
</details>
<details>
<summary>💡 Hint 3</summary>
Mark shared libraries (like `@angular/core`, `@angular/common`) as `singleton: true` in both webpack configs to avoid version conflicts.
</details>

---

### 🟡 Intermediate — Assignment 3.2: Shared State Between MFEs

**Problem:**  
Extend the setup from 3.1. Add a **Cart MFE** (`cart-mfe`) on port `4202`.

When a user clicks "Add to Cart" in the Products MFE, the cart count in the Shell header should update in real time.

**Requirements:**
- The state must live in a **shared singleton service** (not duplicated per MFE)
- Use a `BehaviorSubject` for the cart count
- The shared service must be provided at the **shell level** only

**Hints:**
<details>
<summary>💡 Hint 1</summary>
Mark `@angular/core` and your shared library as `singleton: true` and `eager: true` in Module Federation config to guarantee a single instance.
</details>
<details>
<summary>💡 Hint 2</summary>
Create a separate workspace library (`nx generate @nx/angular:lib shared-state`) or a plain shared npm package. Both MFEs import from the same source, but because of singleton config there's only one runtime instance.
</details>
<details>
<summary>💡 Hint 3</summary>
If the count still doesn't sync, check whether multiple instances of Angular are being bootstrapped (open DevTools → Application → check for duplicate `NgZone` instances).
</details>

---

### 🟡 Intermediate — Assignment 3.3: Dynamic Remote Discovery

**Problem:**  
Instead of hard-coding remote URLs in the shell's routing, load the remote manifest at runtime from a config file `assets/mf.manifest.json`:

```json
{
  "products": "http://localhost:4201/remoteEntry.js",
  "cart":     "http://localhost:4202/remoteEntry.js"
}
```

The shell reads this file at startup and registers remotes dynamically.

**Requirements:**
- No remote URL should be hard-coded anywhere in TypeScript
- Changing a URL in the JSON file should be sufficient to point to a different remote

**Hints:**
<details>
<summary>💡 Hint 1</summary>
Use `initFederation('assets/mf.manifest.json')` from `@angular-architects/module-federation` in `main.ts` before bootstrapping the app.
</details>
<details>
<summary>💡 Hint 2</summary>
Switch `loadRemoteModule` call to use `{ remoteName: 'products', exposedModule: './ProductsModule' }` (name-based) instead of a URL.
</details>

---

### 🔴 Hard — Assignment 3.4: MFE with Independent Deployments + Version Negotiation

**Problem:**  
Simulate a real-world scenario:
- Shell uses Angular **19.0**
- Products MFE uses Angular **19.1** (different patch version)

Your task:
1. Configure Module Federation to share Angular libraries without breaking either app.
2. Add a version-check mechanism: if the remote's Angular version is incompatible, show a graceful error boundary instead of crashing.
3. Implement a fallback UI component in the shell that renders when a remote fails to load.

**Hints:**
<details>
<summary>💡 Hint 1</summary>
Use `requiredVersion: 'auto'` and `strictVersion: false` in the `shared` config to allow compatible minor/patch mismatches.
</details>
<details>
<summary>💡 Hint 2</summary>
Wrap `loadRemoteModule(...)` in a try/catch and render a fallback component on error. Angular's `@defer` with `@error` block (Angular 17+) is perfect for this.
</details>
<details>
<summary>💡 Hint 3</summary>
Use a custom error handler (`ErrorHandler`) globally in the shell to catch and log federation errors without crashing the whole app.
</details>

---

## 4. Playwright (E2E Testing)

> **Setup:** `npm init playwright@latest` inside your Angular project root.  
> Configure `baseURL: 'http://localhost:4200'` in `playwright.config.ts`.

### 🟢 Easy — Assignment 4.1: First Page Test

**Problem:**  
Write a Playwright test that:
1. Navigates to the home page (`/`)
2. Asserts the page title is correct
3. Checks that the main navigation links are visible
4. Clicks a nav link and verifies the URL changes

**Requirements:**
- Use `page.goto`, `expect(page).toHaveTitle`, `page.locator`, `page.click`
- Test must pass in **Chromium** and **Firefox**

**Hints:**
<details>
<summary>💡 Hint 1</summary>

```ts
import { test, expect } from '@playwright/test';
test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/MyApp/);
});
```
</details>
<details>
<summary>💡 Hint 2</summary>
Prefer `data-testid` attributes in your HTML over CSS class selectors for stable locators. Use `page.getByTestId('nav-home')`.
</details>

---

### 🟢 Easy — Assignment 4.2: Form Interaction Test

**Problem:**  
Write a test for the product search feature (from Observables Assignment 1.3):
1. Type a search term into the search input
2. Wait for the results to appear (handle async!)
3. Assert at least one result card is visible
4. Clear the input and assert results disappear

**Requirements:**
- Use `page.fill`, `page.waitForResponse` or `page.waitForSelector`
- Must not use hard-coded `waitForTimeout` (flaky!)

**Hints:**
<details>
<summary>💡 Hint 1</summary>
`page.waitForResponse('**/products/search**')` waits for the specific API call — much more reliable than `waitForTimeout`.
</details>
<details>
<summary>💡 Hint 2</summary>
Use Playwright's auto-waiting: `expect(page.locator('.result-card')).toBeVisible()` automatically retries until the element appears or times out.
</details>

---

### 🟡 Intermediate — Assignment 4.3: Page Object Model (POM)

**Problem:**  
Refactor your existing tests to use the **Page Object Model** pattern.

Create:
- `ProductListPage` — locators and actions for the product list
- `ProductDetailPage` — locators and actions for a single product detail

Write a test flow:
1. Navigate to products list
2. Click the first product
3. Verify the detail page shows the correct product name

**Requirements:**
- All locator logic must live in the Page Object class
- Tests must contain zero raw `page.locator(...)` calls

**Hints:**
<details>
<summary>💡 Hint 1</summary>

```ts
export class ProductListPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/products'); }
  getFirstProduct() { return this.page.getByTestId('product-card').first(); }
}
```
</details>
<details>
<summary>💡 Hint 2</summary>
Page objects can return other page objects. `ProductListPage.clickProduct()` can return a `new ProductDetailPage(this.page)`.
</details>

---

### 🟡 Intermediate — Assignment 4.4: API Mocking with Playwright

**Problem:**  
Write a test for the pet management CRUD UI (Assignment 2.2), but **mock the API** — don't hit the real PetStore server.

Test scenarios:
1. Mock `GET /pet/findByStatus` to return 2 pets → assert 2 cards render
2. Mock `DELETE /pet/:id` to return 200 → click delete → assert card disappears
3. Mock `DELETE /pet/:id` to return 500 → click delete → assert error message shows

**Hints:**
<details>
<summary>💡 Hint 1</summary>
Use `page.route('**/pet/findByStatus**', route => route.fulfill({ json: [...mockPets] }))` to intercept and mock responses.
</details>
<details>
<summary>💡 Hint 2</summary>
For the 500 error mock: `route.fulfill({ status: 500, body: 'Internal Server Error' })`.
</details>
<details>
<summary>💡 Hint 3</summary>
Place `page.route(...)` calls **before** `page.goto(...)` so intercepts are registered before the page makes requests.
</details>

---

### 🔴 Hard — Assignment 4.5: MFE E2E Test with Multi-App Setup

**Problem:**  
Write a full E2E test for the MFE scenario (Assignments 3.1 and 3.2):

1. Start the shell app AND both remotes before the test run
2. Navigate to `/products` in the shell — verify the Products MFE content loads
3. Click "Add to Cart" — verify the cart count in the **shell header** increments
4. Navigate to `/cart` — verify the correct item appears

**Additionally:**
- Write a test for the **remote offline** scenario: stop the Products MFE process and verify the shell's error boundary renders gracefully

**Hints:**
<details>
<summary>💡 Hint 1</summary>

Use `webServer` in `playwright.config.ts` to start multiple servers:
```ts
webServer: [
  { command: 'npm run start:shell', port: 4200 },
  { command: 'npm run start:products', port: 4201 },
  { command: 'npm run start:cart', port: 4202 },
]
```
</details>
<details>
<summary>💡 Hint 2</summary>
For the offline scenario, use `page.route('**/remoteEntry.js', route => route.abort())` to simulate a network failure for the remote.
</details>
<details>
<summary>💡 Hint 3</summary>
Use Playwright's `test.describe` and `test.beforeEach` to organise the happy-path and failure-path scenarios cleanly.
</details>

---

### 🔴 Hard — Assignment 4.6: Visual Regression Testing

**Problem:**  
Add visual snapshot testing to your product list page:
1. Capture a baseline screenshot of the product list
2. Mock the API response to be deterministic (same data every run)
3. Assert that a future run produces no visual diff
4. Intentionally break the layout (e.g., remove a CSS class) and confirm the test fails with a diff

**Requirements:**
- Use `expect(page).toHaveScreenshot()`
- Screenshots must be committed to the repo as baseline artifacts
- Tolerate a maximum pixel diff of 0.1%

**Hints:**
<details>
<summary>💡 Hint 1</summary>
Run `npx playwright test --update-snapshots` to generate/update baselines. Never commit snapshots generated from a failing state.
</details>
<details>
<summary>💡 Hint 2</summary>
`toHaveScreenshot({ maxDiffPixelRatio: 0.001 })` sets the tolerance. Mask dynamic content (timestamps, avatars) with `mask: [page.locator('.timestamp')]`.
</details>
<details>
<summary>💡 Hint 3</summary>
Snapshots are OS/browser specific. Run them inside a Docker container (Playwright provides `mcr.microsoft.com/playwright`) for CI consistency.
</details>

---

## Suggested Learning Order

| Step | Assignment | Difficulty | Estimated Time |
|------|-----------|------------|----------------|
| 1 | Observables 1.1 & 1.2 | 🟢 Easy | 1–2 hrs |
| 2 | Observables 1.3 & 1.4 | 🟡 Intermediate | 2–3 hrs |
| 3 | ng-openapi 2.1 | 🟢 Easy | 1–2 hrs |
| 4 | Playwright 4.1 & 4.2 | 🟢 Easy | 1–2 hrs |
| 5 | ng-openapi 2.2 | 🟡 Intermediate | 2–3 hrs |
| 6 | Playwright 4.3 & 4.4 | 🟡 Intermediate | 2–3 hrs |
| 7 | MFE 3.1 & 3.2 | 🟡 Intermediate | 3–4 hrs |
| 8 | Observables 1.5 | 🔴 Hard | 2–3 hrs |
| 9 | MFE 3.3 & 3.4 | 🔴 Hard | 4–6 hrs |
| 10 | ng-openapi 2.3 | 🔴 Hard | 3–4 hrs |
| 11 | Playwright 4.5 & 4.6 | 🔴 Hard | 4–5 hrs |

---

## Useful Resources

- 📘 [Angular 19 Official Docs](https://angular.dev)
- 📘 [RxJS Operator Decision Tree](https://rxjs.dev/operator-decision-tree)
- 📘 [ng-openapi-gen GitHub](https://github.com/cyclosproject/ng-openapi-gen)
- 📘 [Module Federation with Angular](https://www.angulararchitects.io/blog/the-microfrontend-revolution-part-2-module-federation-with-angular/)
- 📘 [Playwright Docs](https://playwright.dev/docs/intro)
- 📘 [PetStore OpenAPI Spec](https://petstore3.swagger.io)
