import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from './pages/product-catalog.page';
import { mockProducts } from './fixtures/products';

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    // Seed an auth token so the `authGuard` on /checkout lets us through
    // without going through the login UI (cleaner than logging in every test).
    await page.addInitScript(() => {
      window.localStorage.setItem('token', 'fake-jwt-token');
    });

    await page.route('**/products', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProducts)
      });
    });

    // Mock the order placement call (FakeStore `/carts` endpoint) for a deterministic order id.
    await page.route('**/carts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 999,
          userId: 1,
          date: new Date().toISOString().split('T')[0],
          products: [{ productId: 1, quantity: 1 }]
        })
      });
    });
  });

  test('completes the checkout happy path', async ({ page }) => {
    const catalog = new ProductCatalogPage(page);
    await catalog.open();
    await catalog.addFirstProductToCart();

    // Navigate via the in-app cart link (not page.goto) so the SPA doesn't
    // reload and lose the in-memory CartService state.
    await catalog.cartLink.click();
    await expect(page).toHaveURL(/\/cart$/);

    await page.getByRole('button', { name: 'Proceed to Checkout' }).click();

    await expect(page).toHaveURL(/\/checkout$/);

    await page.locator('[formcontrolname="firstName"]').fill('Asha');
    await page.locator('[formcontrolname="lastName"]').fill('Sharma');
    await page.locator('[formcontrolname="email"]').fill('asha@example.com');
    await page.locator('[formcontrolname="phone"]').fill('9876543210');
    await page.locator('[formcontrolname="street"]').fill('42 Market Road');
    await page.locator('[formcontrolname="city"]').fill('Pune');
    await page.locator('[formcontrolname="state"]').fill('Maharashtra');
    await page.locator('[formcontrolname="pincode"]').fill('411001');

    await page.getByRole('button', { name: 'Place Order' }).click();

    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.getByText('Order Placed!')).toBeVisible();
    await expect(page.getByText('#999')).toBeVisible();
  });
});
