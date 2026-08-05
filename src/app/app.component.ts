import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingService } from './services/loading.service';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'microshop';
  cartCount$: Observable<number>;

  constructor(
    public loadingService: LoadingService,
    cartService: CartService
  ) {
    this.cartCount$ = cartService.cartCount$;
  }
}
