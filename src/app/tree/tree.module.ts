import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TreeRoutingModule } from './tree-routing.module';
import { TreeComponent } from './tree.component';
import { TreeVisualizerComponent } from './components/tree-visualizer/tree-visualizer.component';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { MetricsDisplayComponent } from './components/metrics-display/metrics-display.component';

@NgModule({
  declarations: [
    
  ],
  imports: [
    TreeComponent,
    TreeVisualizerComponent,
    ControlPanelComponent,
    MetricsDisplayComponent,
    CommonModule,
    FormsModule,
    TreeRoutingModule
  ]
})
export class TreeModule { }
