import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdvancedComponent } from './advanced.component';

import { DynamicProgrammingComponent } from './dynamic-programming/dynamic-programming.component';
import { BacktrackingComponent }     from './backtracking/backtracking.component';
import { DivideConquerComponent }    from './divide-conquer/divide-conquer.component';

const routes: Routes = [
  {
    path: '',
    component: AdvancedComponent,
    children: [
      { path: 'dp',          component: DynamicProgrammingComponent },
      { path: 'backtracking', component: BacktrackingComponent },
      { path: 'divide',       component: DivideConquerComponent },
      { path: '', pathMatch: 'full', redirectTo: 'dp' },   // 可选：默认跳 dp
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdvancedRoutingModule {}
