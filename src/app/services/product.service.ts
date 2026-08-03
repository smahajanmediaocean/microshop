import {Inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';
import { API_URL } from '../tokens/api-url.token';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, @Inject(API_URL) private apiUrl: string) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/category/${category}`);
  }
}
