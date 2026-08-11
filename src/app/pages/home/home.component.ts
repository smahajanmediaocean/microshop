import { Component } from '@angular/core';
import {Observable, combineLatest, BehaviorSubject, map, shareReplay} from 'rxjs';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

const ALL_CATEGORIES = 'All';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  filteredProducts$: Observable<Product[]>;
  productCategory$: Observable<string[]>;
  products$: Observable<Product[]>;
  searchTerm$ = new BehaviorSubject<string>('');
  selectedCategory$ = new BehaviorSubject<string>(ALL_CATEGORIES);
  selectedCategory = ALL_CATEGORIES;

constructor(
    private productService: ProductService,
    private cartService: CartService
  ) {
    this.products$ = this.productService.getAll().pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.productCategory$ = this.products$.pipe(map(products => [...new Set(products.map(p => p.category))]));
    this.filteredProducts$ = combineLatest([
      this.products$,
      this.searchTerm$,
      this.selectedCategory$
    ]).pipe(
      map(([products, term, selectedCategory]) => {
        const search = term.toLowerCase().trim();
        const productList = selectedCategory !== ALL_CATEGORIES ? products.filter(p => p.category === selectedCategory) : products;
        return search
          ? productList.filter(p => p.title.toLowerCase().includes(search) || (p.category && p.category.toLowerCase().includes(search)))
          : productList;
      })
    );
  }

  onInputChange(event: Event) {
     const value = (event.target as HTMLInputElement).value;
     this.searchTerm$.next(value);
  }
  onCategorySelect(category: string) {
    this.selectedCategory = category;
    this.selectedCategory$.next(category);
  }

  onAddToCart(product: Product): void {
    this.cartService.addItem(product);
  }
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
