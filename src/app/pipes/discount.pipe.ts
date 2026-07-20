import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'discount', standalone: false })
export class DiscountPipe implements PipeTransform {
  transform(originalPrice: number, currentPrice: number): string {
    if (!originalPrice || originalPrice <= currentPrice) return '';
    const pct = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    return `${pct}% OFF`;
  }
}
