import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [ProductCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = {
      id: 1,
      title: 'Test Product',
      price: 10,
      description: 'Test description',
      category: 'test',
      image: 'test.jpg',
      rating: { rate: 4.5, count: 10 }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the product title', () => {
    const titleEl: HTMLElement = fixture.nativeElement.querySelector('.card__title');
    expect(titleEl.textContent).toContain('Test Product');
  });

  it('should display the product price', () => {
    const priceEl: HTMLElement = fixture.nativeElement.querySelector('.card__price-current');
    expect(priceEl.textContent).toContain('10');
  });

  it('should emit addToCart with the product when the Add to Cart button is clicked', () => {
    spyOn(component.addToCart, 'emit');

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.card__btn');
    button.click();

    expect(component.addToCart.emit).toHaveBeenCalledWith(component.product);
  });
});
