// src/app/advanced/advanced.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdvancedRoutingModule } from './advanced-routing.module';

@NgModule({
  imports: [CommonModule, RouterModule, AdvancedRoutingModule],
})
export class AdvancedModule {}
