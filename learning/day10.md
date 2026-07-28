# 🎓 Day 10 — End-to-End Testing with Playwright
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Playwright setup and page objects | ~2 hrs |
| Session 2 | Writing MicroShop E2E tests | ~2 hrs |
| Session 3 | CI, tracing, screenshots, and API mocks | ~2 hrs |
| Hands-On | Automate product, cart, and checkout journeys | ~2 hrs |

---

## 🔷 What We're Building Today

Unit tests prove isolated behavior; E2E tests prove the whole MicroShop shopping journey works in a real browser. Today we set up Playwright and automate the most important customer flows.

```text
Browser launches
  ↓
Open MicroShop
  ↓
Interact with search / filters / cart / checkout
  ↓
Assert visible UI and network-driven behavior
  ↓
Collect trace, screenshots, and HTML reports on failure
        
```

---

## 🔷 SESSION 1 — Playwright Setup

---

### 1️⃣ Why Playwright for Angular apps

**The real-world mental model:**
> Playwright is a professional QA shopper that can visit the store in multiple browsers and produce a report if something breaks.

**Why it matters in MicroShop:** MicroShop needs reliable cross-browser verification for catalog, cart, and checkout flows.

Playwright is fast, supports Chromium/Firefox/WebKit, and avoids the iframe limitations many teams disliked elsewhere.
It fits Angular SPAs very well.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> npm install -D @playwright/test
PS C:\\workspace\\Angular-app\\microshop> npx playwright install
PS C:\\workspace\\Angular-app\\microshop> npx playwright test
                        
```

| Playwright strength | Why it helps MicroShop |
|---|---|
| Multi-browser | Validate real customer environments |
| Fast parallel runs | Quicker CI feedback |
| Trace viewer | Excellent failure debugging |
| Network mocking | Stable tests without live API dependency |

**MicroShop decision notes:**
- Compared with Cypress, Playwright feels closer to a general browser automation platform.
- You can still keep Cypress if a team already uses it, but Playwright is a strong modern default.
- E2E coverage should focus on valuable journeys, not every tiny branch.

---

### 2️⃣ Configuring `playwright.config.ts`

**The real-world mental model:**
> The config file is the QA runbook: which store URL to visit, which browsers to use, and what evidence to collect.

**Why it matters in MicroShop:** MicroShop needs stable defaults for local runs and CI.

Set a base URL, enable retries in CI, and turn on screenshots/traces for failures.
These defaults save hours when the first flaky test appears.
                        

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig[{
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4200',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } }
  ]
}];
                        
```

| Config option | Purpose |
|---|---|
| `baseURL` | Shorter `page.goto[]` calls |
| `screenshot` | Capture failure evidence |
| `trace` | Replay failed test timeline |
| `projects` | Run multiple browser targets |

**MicroShop decision notes:**
- Keep local defaults simple, then add CI-specific retries only when needed.
- A stable base URL matters when your Angular dev server runs on a known port.
- Trace collection is one of Playwright's biggest quality-of-life features.

---

### 3️⃣ Page Object Model for MicroShop

**The real-world mental model:**
> A page object is a reusable shopping assistant who knows where buttons and fields live.

**Why it matters in MicroShop:** MicroShop tests stay readable when product-catalog selectors are defined once instead of repeated in every spec.

Page objects are especially useful when a page has many common interactions like search, filter, add to cart, and cart badge reads.
                        

```typescript
import { Locator, Page } from '@playwright/test';

export class ProductCatalogPage {
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly productCards: Locator;
  readonly cartBadge: Locator;

  constructor[private page: Page] {
    this.searchInput = page.getByPlaceholder['Search products'];
    this.categoryFilter = page.getByTestId['category-filter'];
    this.productCards = page.locator['[data-testid="product-card"]'];
    this.cartBadge = page.locator['[data-testid="cart-badge"]'];
  }

  async open[]: Promise<void> {
    await this.page.goto['/products'];
  }

  async search[term: string]: Promise<void> {
    await this.searchInput.fill[term];
  }
}
                        
```

| Page object win | Example |
|---|---|
| Selector reuse | One place for `product-card` locator |
| Readable tests | `catalog.search['shoe']` |
| Easier maintenance | Update locator once if markup changes |

**MicroShop decision notes:**
- Do not over-abstract tiny one-off pages; page objects should earn their keep.
- Use `data-testid` for stable selectors when visual text may change.
- This is similar to React or Selenium page-object patterns.

---

### 4️⃣ Starting the app for E2E runs

**The real-world mental model:**
> Your test shopper needs the store to be open before entering.

**Why it matters in MicroShop:** Playwright tests fail noisily if MicroShop is not running or seeded predictably.

In CI, use Playwright's `webServer` option or start the Angular app before tests.
Locally, developers often run `ng serve` in one terminal and Playwright in another.
                        

```typescript
export default defineConfig[{
  webServer: {
    command: 'npm run start',
    port: 4200,
    reuseExistingServer: true,
    timeout: 120_000
  }
}];
                        
```

| Approach | When to use |
|---|---|
| Manual `ng serve` | Local quick iteration |
| `webServer` in config | CI or stable local automation |
| Preview/prod server | Full release verification |

**MicroShop decision notes:**
- A predictable test environment reduces flakiness more than clever retries.
- If API calls are unstable, add mocks rather than blaming Playwright.
- This setup becomes useful again in Day 14 CI pipelines.

---

## 🔷 SESSION 2 — Writing E2E Tests

---

### 1️⃣ Product listing and search tests

**The real-world mental model:**
> First verify that the storefront opens with stocked shelves and that search works like a real customer expects.

**Why it matters in MicroShop:** Catalog browse and search are core MicroShop flows; if they fail, the store is effectively broken.

Use `beforeEach` to navigate to the catalog, then verify product count and search results.
Keep assertions visible and meaningful.
                        

```typescript
import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from './pages/product-catalog.page';

test.describe['Product catalog', [] => {
  let catalog: ProductCatalogPage;

  test.beforeEach[async [{ page }] => {
    catalog = new ProductCatalogPage[page];
    await catalog.open[];
  }];

  test['shows a product list', async [] => {
    await expect[catalog.productCards].toHaveCount[12];
  }];

  test['filters by search term', async [] => {
    await catalog.search['shoe'];
    await expect[catalog.productCards.first[]].toContainText['shoe'];
  }];
}];
                        
```

| Test | Customer value |
|---|---|
| Catalog loads | Users can browse inventory |
| Search works | Users can find products quickly |
| Empty-state handling | Users get clear feedback |

**MicroShop decision notes:**
- If live data changes too much, mock the product list.
- Use case-insensitive or regex expectations where appropriate.
- Search flows often become flaky when debounce timing is ignored.

---

### 2️⃣ Category filters and add-to-cart

**The real-world mental model:**
> A shopper narrows to one aisle, then places an item in the trolley and expects the trolley count to change immediately.

**Why it matters in MicroShop:** MicroShop's filter and cart interactions prove cross-component state wiring in a real browser.

These tests validate both interaction and visible state update.
That is exactly the kind of cross-component behavior unit tests do not cover end to end.
                        

```typescript
test['filters by category', async [{ page }] => {
  await page.getByTestId['category-filter'].selectOption['electronics'];
  await expect[page.locator['[data-testid="product-card"]']].toHaveCount[4];
}];

test['adds a product to cart', async [{ page }] => {
  await page.locator['[data-testid="add-to-cart"]'].first[].click[];
  await expect[page.locator['[data-testid="cart-badge"]']].toHaveText['1'];
}];
                        
```

| Interaction | Assertion |
|---|---|
| Select category | Product count/text changes |
| Click add-to-cart | Cart badge increments |
| Open cart | Chosen product appears |

**MicroShop decision notes:**
- Stable data-test IDs make E2E tests far less brittle than deep CSS selectors.
- Prefer verifying user-visible outcomes over hidden implementation details.
- One good cart flow test is worth many repetitive click scripts.

---

### 3️⃣ Checkout flow test

**The real-world mental model:**
> This is the cash register rehearsal from product shelf to successful receipt.

**Why it matters in MicroShop:** Checkout is the most business-critical MicroShop path and deserves a realistic browser-level test.

Chain add-to-cart, cart navigation, form fill, and submission.
Make the assertions tell the story of a successful purchase.
                        

```typescript
test['completes checkout flow', async [{ page }] => {
  await page.goto['/products'];
  await page.locator['[data-testid="add-to-cart"]'].first[].click[];
  await page.goto['/cart'];
  await page.getByRole['button', { name: 'Checkout' }].click[];

  await page.getByLabel['Full name'].fill['Asha Sharma'];
  await page.getByLabel['Email'].fill['asha@example.com'];
  await page.getByLabel['Address'].fill['42 Market Road, Pune'];
  await page.getByRole['button', { name: 'Place Order' }].click[];

  await expect[page.getByText['Order placed successfully']].toBeVisible[];
}];
                        
```

| Checkout phase | What to assert |
|---|---|
| Cart created | Badge/cart page updated |
| Form filled | Inputs accept values and validation passes |
| Submit | Success confirmation visible |

**MicroShop decision notes:**
- Checkout tests often benefit from mocked API responses to stay deterministic.
- Avoid giant 50-step scripts; keep the user journey clear.
- If auth is required, seed it deliberately rather than clicking login every time.

---

### 4️⃣ Test organization with hooks and fixtures

**The real-world mental model:**
> Shared test setup is like opening the store and stocking shelves before each inspector starts work.

**Why it matters in MicroShop:** MicroShop test suites stay maintainable when navigation and common setup are centralized.

Use `beforeEach`, helper functions, and page objects.
Keep each test independent so failures are easier to diagnose.
                        

```typescript
test.beforeEach[async [{ page }] => {
  await page.goto['/products'];
}];

async function addFirstProductToCart[page: Page]: Promise<void> {
  await page.locator['[data-testid="add-to-cart"]'].first[].click[];
}
                        
```

| Good organisation habit | Benefit |
|---|---|
| `beforeEach` navigation | Less repeated boilerplate |
| Helper/page object methods | Readable test intent |
| Independent tests | Easier debugging |

**MicroShop decision notes:**
- Avoid hidden magic that makes test setup hard to understand.
- Readable test code matters as much as readable app code.
- Keep helpers small and domain-specific.

---

## 🔷 SESSION 3 — CI Integration & Visual Testing

---

### 1️⃣ HTML reports, traces, and failure debugging

**The real-world mental model:**
> When a store inspection fails, you want CCTV footage, screenshots, and a written report—not just 'something went wrong'.

**Why it matters in MicroShop:** MicroShop teams need actionable failure evidence in CI.

Playwright can produce an HTML report and rich traces.
Use them before adding random sleeps or retry hacks.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> npx playwright test --reporter=html
PS C:\\workspace\\Angular-app\\microshop> npx playwright show-report
PS C:\\workspace\\Angular-app\\microshop> npx playwright show-trace .\\test-results\\trace.zip
                        
```

| Artifact | Use |
|---|---|
| HTML report | Overview of passing/failing specs |
| Trace | Replay every step and network event |
| Screenshot | See final visual state on failure |

**MicroShop decision notes:**
- Trace-first debugging beats adding sleeps blindly.
- Keep reports as CI artifacts for failed pipelines.
- Visual evidence shortens bug triage time dramatically.

---

### 2️⃣ Mocking APIs with `page.route[]`

**The real-world mental model:**
> API mocking is rehearsing with a controlled inventory list so the test inspector sees the same products every time.

**Why it matters in MicroShop:** MicroShop E2E tests should not fail because a dev API is slow or data changed unexpectedly.

Intercept network calls and return fixed JSON.
That makes critical flows deterministic and fast.
                        

```typescript
test['shows mocked products', async [{ page }] => {
  await page.route['**/api/products', async [route] => {
    await route.fulfill[{
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify[[
        { id: 1, title: 'Mock Shoe', price: 1999, imageUrl: 'x' }
      ]]
    }];
  }];

  await page.goto['/products'];
  await expect[page.getByText['Mock Shoe']].toBeVisible[];
}];
                        
```

| Mock strategy | Best for |
|---|---|
| Route fulfill | Stable catalog/checkout tests |
| Live API | Smoke tests against real backend |
| Mixed approach | Pragmatic CI coverage |

**MicroShop decision notes:**
- Mock business-critical E2E paths if backend instability is high.
- Keep a few live smoke tests if environment confidence matters.
- Make mocks realistic enough to catch UI assumptions.

---

### 3️⃣ Visual testing and auth setup

**The real-world mental model:**
> Screenshot comparison is like comparing storefront photos day over day to spot unexpected layout damage.

**Why it matters in MicroShop:** MicroShop product grids and checkout steps benefit from layout regression checks.

Playwright can compare screenshots and seed auth/session state.
That keeps visual and protected-page tests practical.
                        

```typescript
test['catalog layout matches baseline', async [{ page }] => {
  await page.goto['/products'];
  await expect[page].toHaveScreenshot['product-catalog.png'];
}];

test.beforeEach[async [{ page }] => {
  await page.addInitScript[[] => {
    localStorage.setItem['token', 'fake-jwt-token'];
  }];
}];
                        
```

| Technique | Use |
|---|---|
| `toHaveScreenshot[]` | Layout regression detection |
| `addInitScript[]` | Seed auth/localStorage |
| Saved storage state | Reuse logged-in sessions |

**MicroShop decision notes:**
- Keep screenshot baselines reviewed like code—they can hide accidental changes if updated blindly.
- Auth seeding is usually cleaner than UI login in every test.
- Use visual testing selectively for stable pages.

---

### 4️⃣ CI execution strategy

**The real-world mental model:**
> The automated night inspector should open the store, run the checklists, archive evidence, and report back.

**Why it matters in MicroShop:** MicroShop needs E2E tests to run reliably in pipelines, not only on developer laptops.

Run Playwright after build/test, collect reports, and fail the pipeline on critical user journey regressions.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> npx playwright test --reporter=html

// CI checklist
// 1. Install browsers
// 2. Start app or preview server
// 3. Run Playwright
// 4. Upload report and trace artifacts
                        
```

| CI concern | Recommendation |
|---|---|
| Browser install | `npx playwright install --with-deps` in CI image when needed |
| Artifacts | Upload HTML report + trace zip |
| Flakiness | Fix root cause before increasing retries |

**MicroShop decision notes:**
- Playwright becomes much more valuable when every failure leaves useful evidence.
- Keep E2E scope focused on the top user journeys to maintain pipeline speed.
- This will pair well with Day 14's GitHub Actions pipeline.

---

## 🏗️ Day 10 Hands-On

- Install Playwright in `C:\workspace\Angular-app\microshop` and create `playwright.config.ts`.
- Create a `ProductCatalogPage` page object with locators for search, cards, and cart badge.
- Write E2E tests for product list display and search.
- Write E2E tests for category filter and add-to-cart flow.
- Write one checkout happy-path test.
- Add screenshot-on-failure and trace retention to config.
- Mock the product API in at least one test with `page.route[]`.
- Generate and inspect the HTML report locally.
