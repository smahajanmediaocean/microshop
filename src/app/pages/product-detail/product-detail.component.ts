import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
// import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {

  product$!: Observable<Product>;
  cartCount$!: Observable<number>;

  constructor(
    private route: ActivatedRoute,
    // private productService: ProductService,
    public cartService: CartService
  ) {}

  ngOnInit(): void {
    this.cartCount$ = this.cartService.cartCount$;
    // this.product$ = this.route.paramMap.pipe(
    //   map(params => Number(params.get('id'))),        // extract :id from URL
    //   switchMap(id => this.productService.getById(id)) // cancel old, fetch new
    // );
    const product = this.route.snapshot.data['product'] as Product;
    this.product$ = of(product);
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
  }
}
