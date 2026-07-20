import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cart-item';

@Component({
  selector: 'app-cart',
  standalone: false,
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {

  cartItems$: Observable<CartItem[]>;

  constructor(public cartService: CartService) {
    this.cartItems$ = this.cartService.cartItems$;
  }

  updateQty(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cartService.updateQuantity(productId, +input.value);
  }

  remove(productId: number): void {
    this.cartService.removeItem(productId);
  }
}
