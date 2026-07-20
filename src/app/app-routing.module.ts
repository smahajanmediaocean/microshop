import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';

const routes: Routes = [
  { path: '',       redirectTo: '/home', pathMatch: 'full' },  // "/" → "/home"
  { path: 'home',   component: HomeComponent },                // "/home" → shows HomeComponent
  { path: 'products/:id',  component: ProductDetailComponent },
  { path: 'cart',          component: CartComponent },
  { path: '**',     redirectTo: '/home' },                     // any unknown URL → "/home"
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
