import {CheckoutComponent} from './checkout.component';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [CheckoutComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class CheckoutModule { }
