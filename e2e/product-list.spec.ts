import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from './pages/product-catalog.page';
import { mockProducts } from './fixtures/products';

test.describe('Product catalog', () => {
  let catalog: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    // Mock the FakeStore products API so tests are deterministic and fast.
    await page.route('**/products', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProducts)
      });
    });

    catalog = new ProductCatalogPage(page);
    await catalog.open();
  });

  test('shows a product list', async () => {
    await expect(catalog.productCards).toHaveCount(mockProducts.length);
  });

  test('filters by search term', async () => {
    await catalog.search('shoe');

    await expect(catalog.productCards).toHaveCount(1);
    await expect(catalog.productCards.first()).toContainText('Running Shoe');
  });

  test('shows an empty result when search term does not match any product', async () => {
    await catalog.search('nonexistent-product-xyz');

    await expect(catalog.productCards).toHaveCount(0);
  });
});
