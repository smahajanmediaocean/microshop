import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Product } from '../models/product';
import { ProductService } from '../services/product.service';

export const productResolver: ResolveFn<Product> = (route, state) => {
  const id = Number(route.paramMap.get('id'));  // reads :id from the URL                                                                    ┃
  return inject(ProductService).getById(id);    // returns an Observable<Product>                                                            ┃
  // Angular Router waits for this Observable to complete BEFORE activating the route
};
