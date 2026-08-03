import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import { Order, OrderPayload } from '../models/order';

// Shape expected by POST https://fakestoreapi.com/carts
interface FakeStoreCartPayload {
  userId: number;
  date: string;
  products: { productId: number; quantity: number }[];
}

// Shape returned by the FakeStore carts API
interface FakeStoreCartResponse {
  id: number;
  userId: number;
  date: string;
  products: { productId: number; quantity: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  placeOrder(payload: OrderPayload): Observable<Order> {
    const cartPayload: FakeStoreCartPayload = {
      userId: 1,   // FakeStore mock — any valid userId works
      date: new Date().toISOString().split('T')[0],
      products: payload.items.map(i => ({
        productId: i.product.id,
        quantity:  i.quantity
      }))
    };

    return this.http
      .post<FakeStoreCartResponse>(`${this.apiUrl}/carts`, cartPayload)
      .pipe(
        // Map FakeStore response back to our Order shape
        map(res => ({
          id:            String(res.id),
          items:         payload.items,
          firstName:     payload.firstName,
          lastName:      payload.lastName,
          email:         payload.email,
          phone:         payload.phone,
          address:       payload.address,
          paymentMethod: payload.paymentMethod as Order['paymentMethod'],
          createdAt:     res.date
        }))
      );
  }
}
