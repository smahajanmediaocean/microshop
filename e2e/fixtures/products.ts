/**
 * Deterministic product fixture used to mock the FakeStore `/products` API in E2E tests,
 * so catalog/search/filter/cart tests don't depend on the live API's data or availability.
 *
 * Images are inline data URIs (not external URLs) so page loads never depend on network
 * access to a third-party image host — this keeps navigation/`load` events fast and reliable.
 */
const placeholderImage =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#ddd"/></svg>'
  ).toString('base64');

export const mockProducts = [
  {
    id: 1,
    title: 'Running Shoe',
    price: 1999,
    description: 'Lightweight running shoe for daily training.',
    category: 'footwear',
    image: placeholderImage,
    rating: { rate: 4.5, count: 120 }
  },
  {
    id: 2,
    title: 'Wireless Headphones',
    price: 2999,
    description: 'Over-ear wireless headphones with noise cancellation.',
    category: 'electronics',
    image: placeholderImage,
    rating: { rate: 4.2, count: 85 }
  },
  {
    id: 3,
    title: 'Cotton T-Shirt',
    price: 499,
    description: 'Breathable cotton t-shirt, everyday wear.',
    category: 'clothing',
    image: placeholderImage,
    rating: { rate: 4.0, count: 40 }
  }
];
