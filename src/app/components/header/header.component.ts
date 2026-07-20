import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() cartCount: number = 0;  // ← passed IN from parent (AppComponent)
}
