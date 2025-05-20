import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { GraphComponent } from './graph.component';

// 子路由配置
const routes: Routes = [
  { path: '', component: GraphComponent } // 默认路由到 GraphComponent
];

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes), // 注册子路由

    GraphComponent
  ]
})
export class GraphModule { }
