import {CheckoutComponent} from './checkout.component';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {CheckoutRoutingModule} from './checkout-routing.module';
import {OrderSuccessComponent} from './order-success/order-success.component';

@NgModule({
  declarations: [CheckoutComponent, OrderSuccessComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CheckoutRoutingModule
  ]
})
export class CheckoutModule { }
