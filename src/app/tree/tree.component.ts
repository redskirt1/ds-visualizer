import { Component, ViewChild } from '@angular/core';
import { TreeService } from './services/tree.service';
import { ControlPanelComponent } from './components/control-panel/control-panel.component';
import { TreeVisualizerComponent } from './components/tree-visualizer/tree-visualizer.component';
import { MetricsDisplayComponent } from './components/metrics-display/metrics-display.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlgorithmService } from './services/algorithm.service';
import { OperationType, TreeOperation } from './models/enum';

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

    const allOps = this.treeService.getOperations();

    const rotationOps = allOps.filter(
      (op) =>
        op.type === OperationType.ROTATE_LEFT ||
        op.type === OperationType.ROTATE_RIGHT ||
        op.type === OperationType.ROTATE_LR ||
        op.type === OperationType.ROTATE_RL
    );

    this.treeService.setOperations(rotationOps);
    this.visualizer.refreshLayout();
    this.visualizer.playOperations();

    this.treeService.setOperations(allOps);
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

  onExportJson(): void {
    const data = this.treeService.exportToJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tree.json';
    a.click();
  }

  onImportJson(file: File): void {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const json = reader.result as string;

        // 1️⃣ 导入数据到 treeService
        this.treeService.importFromJson(json);

        // 2️⃣ 清空动画操作列表
        this.treeService.setOperations([]);

        // 3️⃣ 重新生成可视化布局
        this.visualizer.refreshLayout();

        // 4️⃣ 清空轨迹动画（可选）
        this.visualizer.clearBezier?.();

        console.log('✅ JSON 导入成功：', this.treeService.getRoot());
      } catch (err) {
        console.error('❌ 导入失败：JSON格式错误', err);
        alert('导入失败，请检查 JSON 格式是否正确');
      }
    };

    reader.readAsText(file);
  }

  onStep(): void {
    this.visualizer.step();
  }

  onExport(): void {
    const data = this.treeService.exportToJson(); // 应该返回字符串
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'tree-structure.json';
    a.click();

    URL.revokeObjectURL(url); // 清理内存
  }
}
