import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LinearComponent } from './linear.component';

const routes: Routes = [{ path: '', component: LinearComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LinearRoutingModule { }
