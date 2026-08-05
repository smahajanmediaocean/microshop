import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {

  product$!: Observable<Product>;

  constructor(
    private route: ActivatedRoute,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    const product = this.route.snapshot.data['product'] as Product;
    this.product$ = of(product);
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
  }
}
