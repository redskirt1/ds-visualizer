import { Component, ViewChild } from '@angular/core';
import { TreeService } from './services/tree.service';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { TreeVisualizerComponent } from './components/tree-visualizer/tree-visualizer.component';
import { MetricsDisplayComponent } from './components/metrics-display/metrics-display.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlgorithmService } from './services/algorithm.service';
import { TreeOperation } from './models/enum';

@Component({
  selector: 'app-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ControlPanelComponent,
    TreeVisualizerComponent,
    MetricsDisplayComponent,
  ],
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.scss'],
})
export class TreeComponent {
  @ViewChild(TreeVisualizerComponent) visualizer!: TreeVisualizerComponent;

  constructor(
    private treeService: TreeService,
    private algoService: AlgorithmService
  ) {}
  get metrics() {
    return this.treeService.getMetrics();
  }

  onInsert(value: number): void {
    this.treeService.insert(value);
    // 重新加载节点数据或刷新可视化组件
    this.visualizer.refreshLayout(); // 你需要在 TreeVisualizerComponent 中提供该方法
  }

  onPlay(): void {
    this.visualizer.playOperations();
  }

  onPause(): void {
    this.visualizer.pause();
  }

  onSpeedChange(newSpeed: number): void {
    this.visualizer.setSpeed(newSpeed);
  }

  onSearch(algorithm: string): void {
    const root = this.treeService.getRoot();
    let ops: TreeOperation[] = [];

    if (algorithm === 'dfs') {
      ops = this.algoService.dfs(root);
    } else if (algorithm === 'bfs') {
      ops = this.algoService.bfs(root);
    }

    // 设置操作序列并播放
    this.treeService.setOperations(ops);

    this.treeService.setVisitedCount(ops.length);
    this.treeService.setLastSearchType(
      algorithm.toUpperCase() as 'DFS' | 'BFS'
    );

    this.visualizer.refreshLayout();
    this.visualizer.playOperations();
  }

  onClear(): void {
    this.treeService.clearTree();
    this.visualizer.clearLayout();
  }
}
