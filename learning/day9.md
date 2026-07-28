# 🎓 Day 9 — Unit & Integration Testing — Jasmine, Karma & Angular Testing Library
### Project: **MicroShop** — An e-commerce platform (think Amazon/Flipkart mini)

---

## 📋 Sessions Overview

| Session | Topic | Duration |
|---------|-------|----------|
| Session 1 | Testing setup, TestBed, and test philosophy | ~2 hrs |
| Session 2 | Component testing patterns | ~2 hrs |
| Session 3 | Service, HTTP, and NgRx testing | ~2 hrs |
| Hands-On | Test ProductCard, ProductService, CartService, and reducer | ~2 hrs |

---

## 🔷 What We're Building Today

MicroShop is feature-rich enough now that manual clicking is not enough. Today we write fast tests around components, services, HTTP calls, and reducers.

```text
Testing pyramid for MicroShop
  E2E tests        → few, expensive
  Integration tests→ medium count
  Unit tests       → many, fast

Goal today
  Component tests + service tests + reducer tests
        
```

---

## 🔷 SESSION 1 — Testing Setup & Philosophy

---

### 1️⃣ Angular testing stack basics

**The real-world mental model:**
> Think of Jasmine as the courtroom language, Karma as the hearing room, and TestBed as the fake mall you assemble for each test.

**Why it matters in MicroShop:** MicroShop needs a consistent mental model before writing dozens of tests.

Angular's traditional stack is Jasmine for assertions/spies, Karma for running tests in a browser, and TestBed for creating Angular components and injectors.
Later you may swap runners, but the testing ideas stay similar.
                        

```typescript
PS C:\\workspace\\Angular-app\\microshop> ng test
PS C:\\workspace\\Angular-app\\microshop> ng test --code-coverage

describe['Smoke test', [] => {
  it['should make a basic expectation', [] => {
    expect[true].toBeTrue[];
  }];
}];
                        
```

| Tool | Role |
|---|---|
| Jasmine | Assertions and spies |
| Karma | Browser test runner |
| TestBed | Angular test module/environment |
| Coverage report | Shows untested branches/files |

**MicroShop decision notes:**
- Fast unit tests catch regressions long before E2E tests do.
- Testing is architecture feedback: hard-to-test code is often over-coupled code.
- The first goal is confidence, not perfect percentages.

---

### 2️⃣ TestBed and fixture lifecycle

**The real-world mental model:**
> TestBed is a tiny training mall you build just large enough for the component under test.

**Why it matters in MicroShop:** MicroShop components often need child components, inputs, pipes, or service doubles in tests.

`TestBed.configureTestingModule[]` defines the testing environment.
`fixture.detectChanges[]` runs the first Angular change detection cycle, which creates DOM and runs lifecycle hooks.
                        

```typescript
beforeEach[async [] => {
  await TestBed.configureTestingModule[{
    declarations: [ProductCardComponent],
    imports: [CommonModule]
  }].compileComponents[];

  fixture = TestBed.createComponent[ProductCardComponent];
  component = fixture.componentInstance;
  component.product = mockProduct;
  fixture.detectChanges[];
}];
                        
```

| API | What it does |
|---|---|
| `configureTestingModule` | Creates a temporary Angular module |
| `createComponent` | Instantiates component + fixture |
| `detectChanges` | Runs bindings/lifecycle and updates DOM |
| `fixture.nativeElement` | Lets you inspect rendered HTML |

**MicroShop decision notes:**
- If bindings are missing in the DOM, check whether you forgot `detectChanges[]`.
- Standalone components can go in `imports` rather than `declarations`.
- A minimal TestBed is usually better than importing the whole app module.

---

### 3️⃣ Querying the DOM and testing behavior

**The real-world mental model:**
> A good component test behaves like a shopper using the page, not like a code archaeologist poking private properties.

**Why it matters in MicroShop:** MicroShop UI tests should verify text, buttons, classes, and emitted events the user actually depends on.

Use DOM queries to check visible output.
This keeps tests closer to real behavior and more resilient than testing internals.
                        

```typescript
const titleElement = fixture.debugElement.query[By.css['h3']].nativeElement as HTMLHeadingElement;
const addButton = fixture.debugElement.query[By.css['button']].nativeElement as HTMLButtonElement;

expect[titleElement.textContent?.trim[]].toBe['Nike Air Max 270'];
expect[addButton.textContent?.trim[]].toContain['Add'];
                        
```

| Prefer asserting | Avoid asserting |
|---|---|
| Rendered text | Private helper variables |
| Disabled state/class | Implementation detail noise |
| Event emission | Internal method call unless necessary |

**MicroShop decision notes:**
- A user never sees your private fields; they see the DOM.
- Tests written at the right level survive refactors better.
- Query helpers like `By.css[]` are enough for many Angular tests.

---

### 4️⃣ Unit vs integration test decision

**The real-world mental model:**
> Some checks inspect one shelf; others walk a full aisle. Use the cheapest test that proves the behavior.

**Why it matters in MicroShop:** MicroShop should not overuse heavy integration tests for logic that a reducer or pipe unit test can verify faster.

Unit tests isolate a single function/class/component.
Integration tests wire a few real collaborators together, such as component + child component + service double.
                        

```typescript
export const testingHeuristics = {
  unit: ['pipe transforms', 'reducers', 'pure services', 'small presentational components'],
  integration: ['form + validation + child controls', 'component + store mock', 'component + router testing'],
  e2e: ['checkout flow', 'login flow', 'cross-page user journeys']
};
                        
```

| Behavior | Best test level |
|---|---|
| Cart total math | Reducer/service unit test |
| Button emits event | Component unit test |
| HTTP request mapping | Service integration-ish test with HttpTestingController |
| Add to cart updates header and cart page | E2E or higher-level integration |

**MicroShop decision notes:**
- Use many cheap tests and a few expensive tests.
- Testing pyramid discipline keeps feedback fast.
- When in doubt, start lower and move higher only if needed.

---

## 🔷 SESSION 2 — Component Testing

---

### 1️⃣ Testing `ProductCardComponent` inputs and DOM

**The real-world mental model:**
> You stock the shelf with a known product and inspect what the shopper sees.

**Why it matters in MicroShop:** MicroShop product cards are reused widely, so one good test pays off everywhere.

Give the component a realistic `@Input[]` object, run change detection, and assert on rendered title, price, and description.
                        

```typescript
describe['ProductCardComponent', [] => {
  let fixture: ComponentFixture<ProductCardComponent>;
  let component: ProductCardComponent;

  const mockProduct: Product = {
    id: 1,
    title: 'Nike Air Max 270',
    price: 4999,
    imageUrl: 'https://example.com/shoe.png',
    description: 'Comfortable running shoe'
  } as Product;

  beforeEach[async [] => {
    await TestBed.configureTestingModule[{
      declarations: [ProductCardComponent]
    }].compileComponents[];

    fixture = TestBed.createComponent[ProductCardComponent];
    component = fixture.componentInstance;
    component.product = mockProduct;
    fixture.detectChanges[];
  }];

  it['renders the product title and price', [] => {
    const text = fixture.nativeElement.textContent;
    expect[text].toContain['Nike Air Max 270'];
    expect[text].toContain['4,999'];
  }];
}];
                        
```

| Test focus | Example |
|---|---|
| Input rendering | Title/price appear |
| Conditional UI | Sale badge appears only when relevant |
| Output event | Add button emits product |

**MicroShop decision notes:**
- Use realistic fixtures to catch formatting issues.
- Keep test names user-focused and readable.
- Presentational components are the sweetest spot for fast unit tests.

---

### 2️⃣ Testing `@Output[]` and click events

**The real-world mental model:**
> You press the Add to cart button and verify the cashier signals the parent correctly.

**Why it matters in MicroShop:** MicroShop's smart page depends on output events from dumb children.

Spy on the emitter or subscribe to it directly.
Then trigger the DOM event and confirm the payload.
                        

```typescript
it['emits add event when button is clicked', [] => {
  spyOn[component.add, 'emit'];

  const button = fixture.debugElement.query[By.css['button']];
  button.triggerEventHandler['click'];

  expect[component.add.emit].toHaveBeenCalledWith[mockProduct];
}];
                        
```

| Event test pattern | Why |
|---|---|
| Spy on emitter | Quick and direct |
| Trigger real button click | Closer to user behavior |
| Assert payload | Ensures parent gets useful data |

**MicroShop decision notes:**
- If the component emits IDs instead of whole objects, assert the exact intended contract.
- Do not call `component.add.emit[...]` manually in the test; click the button.
- This keeps tests aligned with the template.

---

### 3️⃣ Testing `ngIf`, classes, and async pipe UI

**The real-world mental model:**
> A store shelf sometimes shows 'Sale' or 'Out of stock' signage depending on inventory.

**Why it matters in MicroShop:** MicroShop cards and lists contain lots of conditional visual states.

Toggle inputs and call `detectChanges[]` again.
Then assert whether elements exist and classes are applied.
                        

```typescript
it['shows out-of-stock class when stock is zero', [] => {
  component.product = { ...mockProduct, stock: 0 } as Product;
  fixture.detectChanges[];

  const article = fixture.debugElement.query[By.css['.product-card']].nativeElement as HTMLElement;
  expect[article.classList.contains['out-of-stock']].toBeTrue[];
}];
                        
```

| Conditional case | Assertion style |
|---|---|
| Element exists/does not exist | `query[By.css[...]]` truthy/falsy |
| CSS class binding | `classList.contains[...]` |
| Async stream text | Use `async` helpers then assert text |

**MicroShop decision notes:**
- Re-run `detectChanges[]` after input changes.
- Keep one behavior focus per test.
- Condition-heavy UIs deserve explicit tests because visual regressions are common.

---

### 4️⃣ Shallow testing and service spies

**The real-world mental model:**
> Sometimes you only care that the shelf asked the back office for data, not about the whole warehouse internals.

**Why it matters in MicroShop:** MicroShop container components can be tested with mocked facades/services instead of full store setup.

Create spy objects for services and provide them in TestBed.
This keeps the test focused on component behavior.
                        

```typescript
const facadeSpy = jasmine.createSpyObj<ProductFacadeService>['ProductFacadeService', ['loadProducts'], {
  products$: of[[]],
  loading$: of[false]
}];

await TestBed.configureTestingModule[{
  declarations: [ProductListPageComponent],
  providers: [{ provide: ProductFacadeService, useValue: facadeSpy }]
}].compileComponents[];
                        
```

| Strategy | Use when |
|---|---|
| Spy object | You only need call/return behavior |
| Mock class | You need more control or stateful fake behavior |
| Real dependency | You want integration coverage |

**MicroShop decision notes:**
- Keep the fake surface small.
- Spies are perfect for verifying container components call a facade on init.
- You do not need the whole store to test every page shell.

---

## 🔷 SESSION 3 — Service Testing

---

### 1️⃣ Testing `ProductService` with `HttpTestingController`

**The real-world mental model:**
> The testing controller is a fake courier dock where you verify which package request went out and what response came back.

**Why it matters in MicroShop:** MicroShop product fetching logic should be tested without hitting the real internet.

`HttpClientTestingModule` provides a mock HTTP backend.
You assert the request and flush a fake response.
                        

```typescript
describe['ProductService', [] => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach[[] => {
    TestBed.configureTestingModule[{
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    }];

    service = TestBed.inject[ProductService];
    httpMock = TestBed.inject[HttpTestingController];
  }];

  afterEach[[] => httpMock.verify[]];

  it['fetches products', [] => {
    service.getAll[].subscribe[[products] => {
      expect[products.length].toBe[1];
      expect[products[0].title].toBe['Nike Air Max 270'];
    }];

    const req = httpMock.expectOne['https://api.microshop.dev/products'];
    expect[req.request.method].toBe['GET'];
    req.flush[[{ id: 1, title: 'Nike Air Max 270' }]];
  }];
}];
                        
```

| API | Use |
|---|---|
| `expectOne[]` | Assert exact request |
| `flush[]` | Send mock response |
| `verify[]` | Ensure no unexpected requests remain |

**MicroShop decision notes:**
- Always call `verify[]` in `afterEach[]` to catch leaked requests.
- Test the URL and method, not just the returned data.
- This is much faster and safer than live API tests.

---

### 2️⃣ Testing POST requests and cart logic

**The real-world mental model:**
> You verify both the outbound order form and the returned acknowledgement slip.

**Why it matters in MicroShop:** MicroShop checkout and cart persistence both rely on request payload correctness.

POST tests are similar: call the service, inspect the outgoing body, then flush a fake response.
Pure cart logic can often be tested even more simply without Angular TestBed at all.
                        

```typescript
it['posts checkout payload', [] => {
  const payload = { items: [{ productId: 1, quantity: 2 }], total: 9998 };

  service.checkout[payload].subscribe[[response] => {
    expect[response.orderId].toBe['ORD-1001'];
  }];

  const req = httpMock.expectOne['https://api.microshop.dev/orders'];
  expect[req.request.method].toBe['POST'];
  expect[req.request.body].toEqual[payload];
  req.flush[{ orderId: 'ORD-1001' }];
}];
                        
```

| Logic type | Best test style |
|---|---|
| HTTP mapping | HttpTestingController |
| Pure math/business logic | Plain unit test |
| Facade/store interaction | Mock store or spy |

**MicroShop decision notes:**
- Keep service tests focused on transport and mapping responsibilities.
- If your service mostly delegates to store, test the store slice instead.
- Test payload shape carefully for backend contracts.

---

### 3️⃣ Testing NgRx with `provideMockStore` and reducers

**The real-world mental model:**
> A mock store is a training database; reducers are the ledger rules you can test directly.

**Why it matters in MicroShop:** MicroShop headers and cart pages often depend on selectors, while reducers hold critical pricing logic.

Reducers are pure and should have direct unit tests.
Container components can use `provideMockStore` to receive controlled selector values.
                        

```typescript
describe['cartReducer', [] => {
  it['adds a new product to the cart', [] => {
    const state = cartReducer[initialState, addToCart[{
      product: { id: 1, title: 'Nike Air Max 270', price: 4999, imageUrl: 'x' } as Product
    }]];

    expect[state.items.length].toBe[1];
    expect[state.items[0].quantity].toBe[1];
  }];
}];

providers: [
  provideMockStore[{
    selectors: [{ selector: selectCartItemCount, value: 3 }]
  }]
]
                        
```

| NgRx piece | Test style |
|---|---|
| Reducer | Direct pure function test |
| Selector | Direct selector projector or integration via state |
| Facade-connected component | MockStore or facade spy |

**MicroShop decision notes:**
- Reducers give huge confidence for very little testing cost.
- Mock selectors keep component tests stable and focused.
- You do not need DevTools open to trust reducer behavior if tests cover it.

---

### 4️⃣ Testing checklist for MicroShop

**The real-world mental model:**
> A good checklist prevents blind spots when release pressure rises.

**Why it matters in MicroShop:** MicroShop has enough moving parts that a repeatable testing baseline matters.

Create a small default testing standard per feature.
That is more sustainable than random heroic testing right before release.
                        

```typescript
export const microshopTestingChecklist = [
  'Presentational components render key states',
  'Important outputs emit expected payloads',
  'HTTP services assert URL, method, and body',
  'Reducers test critical transitions',
  'At least one integration test per major page flow'
];
                        
```

| Feature area | Minimum useful coverage |
|---|---|
| Catalog | Card/list component tests + product service tests |
| Cart | Reducer + selector + page shell tests |
| Checkout | Form validation + API submission tests |
| Shared utilities | Pipe/directive unit tests |

**MicroShop decision notes:**
- Coverage reports guide conversations; they are not the goal by themselves.
- Test the risky paths first: money, totals, validation, permissions.
- A calm test suite speeds up future refactors.

---

## 🏗️ Day 9 Hands-On

- Run `ng test` and confirm the existing test setup works.
- Write a `ProductCardComponent` test that checks title, price, and Add button emission.
- Write a conditional UI test for out-of-stock or sale state.
- Write a `ProductService` GET test with `HttpTestingController`.
- Write one POST/checkout request test.
- Write a direct unit test for `cartReducer` `addToCart` and `clearCart` transitions.
- Use `provideMockStore` or a facade spy in one container component test.
- Generate a code coverage report and note the biggest gaps.
