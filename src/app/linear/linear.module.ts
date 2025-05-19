import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LinearRoutingModule } from './linear-routing.module';
import { LinearComponent } from './linear.component';


@NgModule({
  declarations: [
    LinearComponent
  ],
  imports: [
    CommonModule,
    LinearRoutingModule
  ]
})
export class LinearModule { }
