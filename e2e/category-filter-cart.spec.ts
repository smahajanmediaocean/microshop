import { test, expect } from '@playwright/test';
import { ProductCatalogPage } from './pages/product-catalog.page';
import { mockProducts } from './fixtures/products';

test.describe('Category filter and add-to-cart', () => {
  let catalog: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
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

  test('filters products by category', async () => {
    await catalog.selectCategory('Electronics');

    await expect(catalog.productCards).toHaveCount(1);
    await expect(catalog.productCards.first()).toContainText('Wireless Headphones');
  });

  test('resets to all products when "All" is selected again', async () => {
    await catalog.selectCategory('Electronics');
    await expect(catalog.productCards).toHaveCount(1);

    await catalog.selectCategory('All');
    await expect(catalog.productCards).toHaveCount(mockProducts.length);
  });

  test('adds a product to the cart and updates the cart badge', async () => {
    await catalog.addFirstProductToCart();

    await expect(catalog.cartBadge).toHaveText('1');
  });

  test('increments the cart badge when adding multiple products', async () => {
    await catalog.addProductToCartByTitle('Running Shoe');
    await catalog.addProductToCartByTitle('Wireless Headphones');

    await expect(catalog.cartBadge).toHaveText('2');
  });
});
