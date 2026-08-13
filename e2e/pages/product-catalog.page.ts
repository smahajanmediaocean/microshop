import { Locator, Page } from '@playwright/test';

/**
 * Page Object for the MicroShop product catalog (Home) page.
 * Centralizes locators/actions so specs stay readable and easy to maintain.
 */
export class ProductCatalogPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly categoryChips: Locator;
  readonly productCards: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('search-input');
    this.categoryFilter = page.getByTestId('category-filter');
    this.categoryChips = page.getByTestId('category-chip');
    this.productCards = page.getByTestId('product-card');
    this.cartBadge = page.getByTestId('cart-badge');
    this.cartLink = page.getByTestId('cart-link');
  }

  async open(): Promise<void> {
    await this.page.goto('/home');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  async selectCategory(category: string): Promise<void> {
    await this.categoryChips.filter({ hasText: category }).click();
  }

  productCardByTitle(title: string): Locator {
    return this.productCards.filter({ hasText: title });
  }

  async addFirstProductToCart(): Promise<void> {
    await this.productCards.first().getByTestId('add-to-cart').click();
  }

  async addProductToCartByTitle(title: string): Promise<void> {
    await this.productCardByTitle(title).getByTestId('add-to-cart').click();
  }
}
