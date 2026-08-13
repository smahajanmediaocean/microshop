import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { API_URL } from '../tokens/api-url.token';
import { Product } from '../models/product';

import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: API_URL, useValue: apiUrl }]
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET all products from the API', () => {
    const mockProducts: Product[] = [
      {
        id: 1,
        title: 'Test Product',
        price: 10,
        description: 'Test description',
        category: 'test',
        image: 'test.jpg',
        rating: { rate: 4.5, count: 10 }
      }
    ];

    service.getAll().subscribe(products => {
      expect(products).toEqual(mockProducts);
      expect(products.length).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/products`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);
  });

  it('should GET a single product by id from the API', () => {
    const mockProduct: Product = {
      id: 1,
      title: 'Test Product',
      price: 10,
      description: 'Test description',
      category: 'test',
      image: 'test.jpg',
      rating: { rate: 4.5, count: 10 }
    };

    service.getById(1).subscribe(product => {
      expect(product).toEqual(mockProduct);
    });

    const req = httpMock.expectOne(`${apiUrl}/products/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProduct);
  });
});
