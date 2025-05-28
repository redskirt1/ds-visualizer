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
    console.log('🔄 开始插入节点:', value);

    // 1. 保存插入前的树状态和布局
    const beforeInsertRoot = this.treeService.exportToJson();

    console.log('💾 保存插入前状态');

    // 2. 清空操作记录
    this.treeService.setOperations([]);

    // 3. 执行插入操作，获取旋转操作记录和最终状态
    this.treeService.insert(value);

    // 4. 获取插入后的操作记录和最终状态
    const allOps = this.treeService.getOperations();
    const finalTreeState = this.treeService.exportToJson();
    const rotationOps = allOps.filter(
      (op) =>
        op.type === OperationType.ROTATE_LEFT ||
        op.type === OperationType.ROTATE_RIGHT ||
        op.type === OperationType.ROTATE_LR ||
        op.type === OperationType.ROTATE_RL
    );

    console.log('📝 插入操作完成，旋转操作数量:', rotationOps.length);

    if (rotationOps.length > 0) {
      console.log('🎬 准备播放旋转动画');

      // 5. 创建包含新节点的旋转前状态
      const beforeRotationState = this.createBeforeRotationState(
        beforeInsertRoot,
        value
      );

      // 6. 设置旋转前状态（包含新插入的节点，但未旋转）
      this.treeService.importFromJson(beforeRotationState);
      this.visualizer.refreshLayout();
      const beforeRotationLayout = this.visualizer.nodes.map((node) => ({
        ...node,
      }));

      // 7. 获取最终状态的布局
      this.treeService.importFromJson(finalTreeState);
      this.visualizer.refreshLayout();
      const afterRotationLayout = this.visualizer.nodes.map((node) => ({
        ...node,
      }));

      // 8. 恢复到旋转前状态显示（包含新节点）
      this.treeService.importFromJson(beforeRotationState);
      this.visualizer.refreshLayout();

      // 9. 创建动画数据
      const animationData = this.createAnimationData(
        beforeRotationLayout,
        afterRotationLayout,
        rotationOps[0]
      );

      if (animationData) {
        // 10. 播放动画，动画完成后更新到最终状态
        this.playRotationAnimationWithFinalUpdate(
          animationData,
          afterRotationLayout,
          finalTreeState
        );
      } else {
        console.log('❌ 无法创建动画数据');
        // 如果无法创建动画，直接更新到最终状态
        this.treeService.importFromJson(finalTreeState);
        this.visualizer.refreshLayout();
      }
    } else {
      // 没有旋转操作，直接更新显示
      this.visualizer.refreshLayout();
    }
  }

  private createBeforeRotationState(
    beforeInsertRoot: string,
    newValue: number
  ): string {
    // 解析原始树状态
    const originalTree = JSON.parse(beforeInsertRoot);

    // 创建一个简单的BST插入（不进行AVL平衡）
    const insertNodeSimple = (node: any, value: number): any => {
      if (!node) {
        return {
          value: value,
          left: null,
          right: null,
          height: 1,
        };
      }

      if (value < node.value) {
        node.left = insertNodeSimple(node.left, value);
      } else if (value > node.value) {
        node.right = insertNodeSimple(node.right, value);
      }

      return node;
    };

    // 在原始树中插入新节点（不平衡）
    const beforeRotationTree = originalTree
      ? insertNodeSimple(JSON.parse(JSON.stringify(originalTree)), newValue)
      : {
          value: newValue,
          left: null,
          right: null,
          height: 1,
        };

    console.log('🌳 创建旋转前状态（包含新节点）:', beforeRotationTree);

    return JSON.stringify(beforeRotationTree);
  }

  private createAnimationData(
    beforeLayout: any[],
    afterLayout: any[],
    rotationOp: any
  ): any {
    const paths: any[] = [];

    beforeLayout.forEach((beforeNode) => {
      const afterNode = afterLayout.find((n) => n.value === beforeNode.value);
      if (
        afterNode &&
        (beforeNode.x !== afterNode.x || beforeNode.y !== afterNode.y)
      ) {
        paths.push({
          nodeValue: beforeNode.value,
          fromX: beforeNode.x,
          fromY: beforeNode.y,
          toX: afterNode.x,
          toY: afterNode.y,
          pathD: this.createBezierPath(beforeNode, afterNode),
          progress: 0,
          duration: 1500,
        });

        console.log(`📍 节点 ${beforeNode.value} 动画路径:`, {
          from: `(${beforeNode.x}, ${beforeNode.y})`,
          to: `(${afterNode.x}, ${afterNode.y})`,
        });
      }
    });

    if (paths.length === 0) {
      return null;
    }

    return {
      type: rotationOp.type,
      centerNode: rotationOp.nodes[0],
      paths,
      isPlaying: false,
      startTime: 0,
    };
  }

  private createBezierPath(from: any, to: any): string {
    const fromCenterX = from.x + 25;
    const fromCenterY = from.y + 25;
    const toCenterX = to.x + 25;
    const toCenterY = to.y + 25;

    const cp1x = fromCenterX + (toCenterX - fromCenterX) * 0.3;
    const cp1y = fromCenterY - 50;
    const cp2x = toCenterX - (toCenterX - fromCenterX) * 0.3;
    const cp2y = toCenterY - 50;

    return `M ${fromCenterX} ${fromCenterY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toCenterX} ${toCenterY}`;
  }

  private playRotationAnimationWithFinalUpdate(
    animationData: any,
    finalLayout: any[],
    finalTreeState: string
  ): void {
    console.log('🚀 开始播放旋转动画');

    // 高亮参与动画的节点
    this.visualizer.highlightedValues.clear();
    animationData.paths.forEach((path: any) => {
      this.visualizer.highlightedValues.add(path.nodeValue);
    });

    // 显示贝塞尔路径
    this.visualizer.beziers = animationData.paths.map((path: any) => ({
      d: path.pathD,
    }));

    const startTime = Date.now();
    const duration = 1200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeInOutCubic(progress);

      // 平滑更新节点位置
      animationData.paths.forEach((path: any) => {
        const node = this.visualizer.nodes.find(
          (n) => n.value === path.nodeValue
        );
        if (node) {
          node.x = path.fromX + (path.toX - path.fromX) * easedProgress;
          node.y = path.fromY + (path.toY - path.fromY) * easedProgress;
        }
      });

      // 平滑更新连线
      this.updateLinesSmooth();

      if (progress >= 1) {
        // 动画完成 - 更新树结构并完成动画
        this.finishAnimationWithTreeUpdate(finalLayout, finalTreeState);
      } else {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private updateLinesSmooth(): void {
    // 获取当前树结构
    const root = this.treeService.getRoot();
    if (!root) return;

    // 清空现有连线
    this.visualizer.lines.length = 0;

    // 重新构建连线，但使用当前动画中的节点位置
    this.buildLinesFromCurrentNodes(root, null);
  }

  private buildLinesFromCurrentNodes(node: any, parent: any): void {
    if (!node) return;

    if (parent) {
      const parentPos = this.visualizer.nodes.find(
        (n) => n.value === parent.value
      );
      const nodePos = this.visualizer.nodes.find((n) => n.value === node.value);

      if (parentPos && nodePos) {
        this.visualizer.lines.push({
          x1: parentPos.x + 25, // nodeSize / 2
          y1: parentPos.y + 25,
          x2: nodePos.x + 25,
          y2: nodePos.y + 25,
        });
      }
    }

    this.buildLinesFromCurrentNodes(node.left, node);
    this.buildLinesFromCurrentNodes(node.right, node);
  }

  private finishAnimationWithTreeUpdate(
    finalLayout: any[],
    finalTreeState: string
  ): void {
    console.log('✅ 旋转动画完成，更新树结构');

    // 1. 更新树结构到最终状态
    this.treeService.importFromJson(finalTreeState);

    // 2. 平滑更新到最终位置
    finalLayout.forEach((finalNode) => {
      const currentNode = this.visualizer.nodes.find(
        (n) => n.value === finalNode.value
      );
      if (currentNode) {
        currentNode.x = finalNode.x;
        currentNode.y = finalNode.y;
      }
    });

    // 3. 最终更新连线
    this.updateLinesSmooth();

    // 4. 清理动画状态
    this.visualizer.beziers = [];

    // 5. 立即清除高亮状态，避免节点一直高亮
    this.visualizer.highlightedValues.clear();

    // 6. 确保动画状态完全重置
    this.visualizer.playing = false;
    this.visualizer.currentAnimation = null;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

  onTestRotation(): void {
    console.log('🧪 开始旋转测试');

    // 清空现有树
    this.treeService.clearTree();
    this.visualizer.clearLayout();

    // 先插入两个节点建立基础结构
    console.log('建立基础结构: 插入 10, 5');
    this.treeService.insert(10);
    this.treeService.insert(5);
    this.visualizer.refreshLayout();

    // 等待一秒后插入会触发旋转的节点
    setTimeout(() => {
      console.log('插入触发旋转的节点: 1');
      this.onInsert(1); // 使用新的插入方法
    }, 1000);
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

  onDelete(value: number): void {
    console.log('🗑️ 开始删除节点:', value);

    // 1. 保存删除前的树状态和布局
    const beforeDeleteRoot = this.treeService.exportToJson();

    console.log('💾 保存删除前状态');

    // 2. 清空操作记录
    this.treeService.setOperations([]);

    // 3. 执行删除操作，获取旋转操作记录和最终状态
    this.treeService.delete(value);

    // 4. 获取删除后的操作记录和最终状态
    const allOps = this.treeService.getOperations();
    const finalTreeState = this.treeService.exportToJson();
    const rotationOps = allOps.filter(
      (op) =>
        op.type === OperationType.ROTATE_LEFT ||
        op.type === OperationType.ROTATE_RIGHT ||
        op.type === OperationType.ROTATE_LR ||
        op.type === OperationType.ROTATE_RL
    );

    console.log('📝 删除操作完成，旋转操作数量:', rotationOps.length);

    if (rotationOps.length > 0) {
      console.log('🎬 准备播放删除旋转动画');

      // 5. 创建删除节点后但未旋转的中间状态
      const beforeRotationState = this.createBeforeRotationStateForDelete(
        beforeDeleteRoot,
        value
      );

      // 6. 设置旋转前状态（已删除节点，但未旋转）
      this.treeService.importFromJson(beforeRotationState);
      this.visualizer.refreshLayout();
      const beforeRotationLayout = this.visualizer.nodes.map((node) => ({
        ...node,
      }));

      // 7. 获取最终状态的布局
      this.treeService.importFromJson(finalTreeState);
      this.visualizer.refreshLayout();
      const afterRotationLayout = this.visualizer.nodes.map((node) => ({
        ...node,
      }));

      // 8. 恢复到旋转前状态显示（已删除节点）
      this.treeService.importFromJson(beforeRotationState);
      this.visualizer.refreshLayout();

      // 9. 创建动画数据
      const animationData = this.createAnimationData(
        beforeRotationLayout,
        afterRotationLayout,
        rotationOps[0]
      );

      if (animationData) {
        // 10. 播放动画，动画完成后更新到最终状态
        this.playRotationAnimationWithFinalUpdate(
          animationData,
          afterRotationLayout,
          finalTreeState
        );
      } else {
        console.log('❌ 无法创建删除动画数据');
        // 如果无法创建动画，直接更新到最终状态
        this.treeService.importFromJson(finalTreeState);
        this.visualizer.refreshLayout();
      }
    } else {
      // 没有旋转操作，直接更新显示
      this.visualizer.refreshLayout();
    }
  }

  private createBeforeRotationStateForDelete(
    beforeDeleteRoot: string,
    deleteValue: number
  ): string {
    // 解析原始树状态
    const originalTree = JSON.parse(beforeDeleteRoot);

    // 创建一个简单的BST删除（不进行AVL平衡）
    const deleteNodeSimple = (node: any, value: number): any => {
      if (!node) return null;

      if (value < node.value) {
        node.left = deleteNodeSimple(node.left, value);
      } else if (value > node.value) {
        node.right = deleteNodeSimple(node.right, value);
      } else {
        // 找到要删除的节点
        if (!node.left || !node.right) {
          return node.left || node.right;
        } else {
          // 有两个子节点，用右子树中的最小值替代
          const minNode = this.findMinNode(node.right);
          node.value = minNode.value;
          node.right = deleteNodeSimple(node.right, minNode.value);
        }
      }
      return node;
    };

    // 在原始树中删除节点（不平衡）
    const beforeRotationTree = originalTree
      ? deleteNodeSimple(JSON.parse(JSON.stringify(originalTree)), deleteValue)
      : null;

    console.log('🌳 创建删除后旋转前状态:', beforeRotationTree);

    return JSON.stringify(beforeRotationTree);
  }

  private findMinNode(node: any): any {
    while (node.left) {
      node = node.left;
    }
    return node;
  }
}
