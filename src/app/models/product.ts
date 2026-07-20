export interface ProductRating {
  rate: number;   // e.g. 3.9
  count: number;  // e.g. 120
}

export interface Product {
  title: any;
  id: number;
  price: number;          // current price
  originalPrice?: number; // only present when item is on sale
  description?: string;   // product description from API
  image: string;          // maps to API's "image" URL
  category: string;       // e.g. "footwear"
  rating: ProductRating;  // e.g. { rate: 3.9, count: 120 }
  stock?: number;          // units available (not provided by fakestoreapi)
  tags?: string[];         // e.g. ["sale", "trending", "new"]
}
