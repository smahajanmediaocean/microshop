import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { CartComponent } from './pages/cart/cart.component';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';


const routes: Routes = [
  { path: '',       redirectTo: '/home', pathMatch: 'full' },  // "/" → "/home"
  { path: 'home',   component: HomeComponent },                // "/home" → shows HomeComponent
  // { path: 'products/:id',  component: ProductDetailComponent , resolve: { product: productResolver }},
  {
    path: 'products',
    loadChildren: () =>
      import('./features/products/products.module').then(m => m.ProductsModule)
  },
  { path: 'cart',          component: CartComponent },
  {
       path: 'checkout',
       loadChildren: () =>
         import('./pages/checkout/checkout.module').then(m => m.CheckoutModule),
       canActivate: [authGuard]   // ← guard runs BEFORE the route activates
  },
  { path: 'login', component: LoginComponent },
  { path: '**',     redirectTo: '/home' },                     // any unknown URL → "/home"
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',
    // preloadingStrategy: PreloadAllModules
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
