import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private items$ = new BehaviorSubject<CartItem[]>([]);

  // Public read-only stream — components subscribe to this
  cartItems$ = this.items$.asObservable();

  // Derived stream — auto-calculates total count whenever items change
  cartCount$ = this.items$.pipe(
    map(items => items.reduce((sum, i) => sum + i.quantity, 0))
  );

  addItem(product: Product): void {
    const current = this.items$.getValue();
    const existing = current.find(i => i.product.id === product.id);

    if (existing) {
      const updated = current.map(i =>
        i.product.id === product.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
      this.items$.next(updated);
    } else {
      this.items$.next([...current, { product, quantity: 1 }]);
    }
  }

  removeItem(productId: number): void {
    const updated = this.items$.getValue()
      .filter(i => i.product.id !== productId);
    this.items$.next(updated);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    const updated = this.items$.getValue().map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    this.items$.next(updated);
  }

  getTotal(): number {
    return this.items$.getValue()
      .reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  clearCart(): void {
    this.items$.next([]);
  }

  getItems(): CartItem[] {
    return this.items$.getValue();
  }
}
