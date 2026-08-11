import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ProductListComponent} from './pages/product-list/product-list.component';
import {ProductDetailComponent} from '../../pages/product-detail/product-detail.component';
import {productResolver} from '../../resolvers/product.resolver';

const routes: Routes = [
  { path: '',  component: ProductListComponent },
  { path: ':id',  component: ProductDetailComponent , resolve: { product: productResolver }},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
