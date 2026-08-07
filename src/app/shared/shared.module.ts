import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { TruncatePipe } from './pipes/truncate.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { HighlightDirective } from './directives/highlight.directive';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { DiscountPipe } from '../pipes/discount.pipe';

@NgModule({
  declarations: [
    TruncatePipe,
    TimeAgoPipe,
    HighlightDirective,
    ProductCardComponent,
    DiscountPipe
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    // Angular modules re-exported for convenience in feature modules
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    // Shared UI building blocks
    ProductCardComponent,
    TruncatePipe,
    TimeAgoPipe,
    HighlightDirective,
    DiscountPipe
  ]
})
export class SharedModule { }
