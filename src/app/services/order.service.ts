import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../tokens/api-url.token';
import { Order, OrderPayload } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(
    private http: HttpClient,
    @Inject(API_URL) private apiUrl: string
  ) {}

  placeOrder(payload: OrderPayload): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, payload);
  }
}
