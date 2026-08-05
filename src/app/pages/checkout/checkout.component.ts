import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { UserProfile } from '../../models/user-profile';

interface CanComponentDeactivate {
}

@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})

export class CheckoutComponent implements OnInit, CanComponentDeactivate {
  checkoutForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.checkoutForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName:  ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      phone:     ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],

      // Nested group for shipping address
      address: this.fb.group({
        street:  ['', Validators.required],
        city:    ['', Validators.required],
        state:   ['', Validators.required],
        pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      }),

      paymentMethod: ['COD', Validators.required],  // 'COD' | 'UPI' | 'CARD'
    });
  }

  goBack(): void {
    this.location.back();
  }

  // ── Getter shortcuts — cleaner than calling .get() every time in template ──
  get email()   { return this.checkoutForm.get('email'); }
  get phone()   { return this.checkoutForm.get('phone'); }
  get pincode() { return this.checkoutForm.get('address.pincode'); }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      // Show ALL validation errors at once (user clicked submit without touching fields)
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.orderService.placeOrder({
      items: this.cartService.getItems(),
      ...this.checkoutForm.value
    }).subscribe({
      next: (order) => {
        this.cartService.clearCart();
        this.router.navigate(['/checkout/success'], { queryParams: { orderId: order.id } });
      },
      error: () => {
        this.checkoutForm.setErrors({ submitFailed: true });
      }
    });
  }

  // Pre-fill form for returning user (partial update — only fills specified fields)
  prefillFromProfile(profile: UserProfile): void {
    this.checkoutForm.patchValue({        // ← patchValue: updates ONLY the fields you provide
      firstName: profile.firstName,
      lastName:  profile.lastName,
      email:     profile.email,
      address: {
        city:  profile.city,
        state: profile.state,
      }
      // phone and pincode remain untouched
    });
    // vs setValue() — would require ALL fields to be provided, throws if any are missing
  }

  canDeactivate(): boolean {
    return !this.checkoutForm.dirty || confirm('Leave checkout? Your details will be lost.');
  }
}
