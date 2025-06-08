import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinearRoutingModule } from './linear-routing.module';
import { LinearComponent } from './linear.component'; // standalone组件

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    LinearRoutingModule,
    LinearComponent  // ⭐ 这里直接 import 组件，不要写到 declarations
  ]
})
export class LinearModule { }
