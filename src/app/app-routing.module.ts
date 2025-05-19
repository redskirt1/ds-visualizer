import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'linear',
    loadChildren: () =>
      import('./linear/linear.module').then((m) => m.LinearModule),
  },
  {
    path: 'tree',
    loadChildren: () =>
      import('./tree/tree.module').then((m) => m.TreeModule),
  },
  {
    path: 'graph',
    loadChildren: () =>
      import('./graph/graph.module').then((m) => m.GraphModule),
  },
  {
    path: 'advanced',
    loadChildren: () =>
      import('./advanced/advanced.module').then((m) => m.AdvancedModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
