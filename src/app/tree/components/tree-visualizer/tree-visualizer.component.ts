// tree-visualizer.component.ts
import { Component, OnInit } from '@angular/core';
import { TreeService } from '../../services/tree.service';
import { TreeNode } from '../../models/tree-node.model';
import { OperationType, TreeOperation } from '../../models/enum';
import { CommonModule } from '@angular/common';

// 动画相关接口
interface NodePosition {
  value: number;
  x: number;
  y: number;
}

interface AnimationPath {
  nodeValue: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  pathD: string;
  progress: number; // 0-1
  duration: number; // 毫秒
}

interface RotationAnimation {
  type: 'LEFT' | 'RIGHT' | 'LR' | 'RL';
  centerNode: number;
  affectedNodes: number[];
  paths: AnimationPath[];
  isPlaying: boolean;
  startTime: number;
}

@Component({
  selector: 'app-tree-visualizer',
  templateUrl: './tree-visualizer.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./tree-visualizer.component.scss'],
})
export class TreeVisualizerComponent implements OnInit {
  nodes: NodePosition[] = [];
  lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  beziers: { d: string }[] = [];
  operations: TreeOperation[] = [];
  highlightedValues = new Set<number>();
  playing = false;
  speed = 1; // 1x

  // 新的动画系统
  currentAnimation: RotationAnimation | null = null;
  animationQueue: RotationAnimation[] = [];
  beforeRotationPositions: Map<number, NodePosition> = new Map();
  afterRotationPositions: Map<number, NodePosition> = new Map();

  nodeSize = 50; // 改为public
  private verticalGap = 80;
  private horizontalGap = 50;

  constructor(private treeService: TreeService) {}

  ngOnInit(): void {
    const root = this.treeService.getRoot();
    if (root) {
      this.operations = this.treeService.getOperations();
      let x = 500;
      this.buildLayout(root, x, 40, null);
    }
  }
  findNode(value: number): { x: number; y: number } | null {
    const node = this.nodes.find((n) => n.value === value);
    return node ? { x: node.x, y: node.y } : null;
  }

  assignPositions(
    node: TreeNode | null,
    depth: number,
    colRef: number
  ): number {
    if (!node) return colRef;

    // 递归排左子树
    colRef = this.assignPositions(node.left, depth + 1, colRef);

    // 当前节点坐标
    (node as any)._x = colRef * 60 + 50; // 每列宽度 60，起始偏移 50
    (node as any)._y = depth * 80 + 40; // 每层高度 80，起始偏移 40
    colRef++;

    // 排右子树
    colRef = this.assignPositions(node.right, depth + 1, colRef);

    return colRef;
  }
  buildRenderData(node: TreeNode | null, parent: TreeNode | null): void {
    if (!node) return;

    this.nodes.push({
      value: node.value,
      x: (node as any)._x,
      y: (node as any)._y,
    });

    if (parent) {
      this.lines.push({
        x1: (parent as any)._x + 20,
        y1: (parent as any)._y + 20,
        x2: (node as any)._x + 20,
        y2: (node as any)._y + 20,
      });
    }

    this.buildRenderData(node.left, node);
    this.buildRenderData(node.right, node);
  }

  refreshLayout(): void {
    this.nodes = [];
    this.lines = [];
    this.operations = this.treeService.getOperations();

    const root = this.treeService.getRoot();
    if (root) {
      let col = 0; // 当前水平列
      this.assignPositions(root, 0, col);
      this.buildRenderData(root, null);
    }
  }
  generateBezier(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): string {
    const cx1 = fromX + (toX - fromX) / 2;
    const cy1 = fromY;
    const cx2 = toX - (toX - fromX) / 2;
    const cy2 = toY;
    return `M ${fromX + 20} ${fromY + 20} C ${cx1 + 20} ${cy1 + 20}, ${
      cx2 + 20
    } ${cy2 + 20}, ${toX + 20} ${toY + 20}`;
  }

  playOperations(): void {
    this.stepIndex = 0;
    this.playing = true;
    this.beziers = [];
    this.animationQueue = [];

    this.processOperations();
  }

  private processOperations(): void {
    if (!this.playing || this.stepIndex >= this.operations.length) {
      this.playing = false;
      return;
    }

    const op = this.operations[this.stepIndex];

    if (op.type.startsWith('ROTATE')) {
      // 旋转操作不清空高亮，因为动画过程中需要保持高亮
      this.handleRotationOperation(op);
    } else {
      // 处理其他操作类型时才清空高亮
      this.highlightedValues.clear();
      op.nodes.forEach((v) => this.highlightedValues.add(v));
      this.stepIndex++;
      setTimeout(() => this.processOperations(), 1000 / this.speed);
    }
  }

  private handleRotationOperation(op: TreeOperation): void {
    console.log('🎬 开始处理旋转操作:', op);

    // 获取当前（旋转后）的位置
    const afterPositions = new Map<number, NodePosition>();
    this.nodes.forEach((node) => {
      afterPositions.set(node.value, { ...node });
    });
    console.log('📍 旋转后位置:', Array.from(afterPositions.entries()));

    // 创建旋转动画
    const animation = this.createRotationAnimationWithSimulation(
      op,
      afterPositions
    );

    if (animation && animation.paths.length > 0) {
      console.log('✅ 创建动画成功，路径数量:', animation.paths.length);
      this.currentAnimation = animation;
      this.startRotationAnimation(animation);
    } else {
      console.log('❌ 无法创建动画，直接跳转到下一步');
      // 如果无法创建动画，直接进行下一步
      this.stepIndex++;
      setTimeout(() => this.processOperations(), 500);
    }
  }

  private createRotationAnimationWithSimulation(
    op: TreeOperation,
    afterPositions: Map<number, NodePosition>
  ): RotationAnimation | null {
    const rotationType = this.getRotationType(op.type);
    if (!rotationType) return null;

    const centerNode = op.nodes[0];
    console.log('🎯 旋转中心节点:', centerNode, '旋转类型:', rotationType);

    // 模拟旋转前的位置
    const beforePositions = this.simulateBeforeRotation(op, afterPositions);
    console.log('🔄 模拟的旋转前位置:', Array.from(beforePositions.entries()));

    // 获取受影响的节点
    const affectedNodes = this.getAffectedNodes(centerNode, rotationType);
    console.log('🎯 受影响的节点:', affectedNodes);

    const paths: AnimationPath[] = [];

    affectedNodes.forEach((nodeValue) => {
      const beforePos = beforePositions.get(nodeValue);
      const afterPos = afterPositions.get(nodeValue);

      console.log(`节点 ${nodeValue}:`, {
        before: beforePos,
        after: afterPos,
        moved:
          beforePos &&
          afterPos &&
          (beforePos.x !== afterPos.x || beforePos.y !== afterPos.y),
      });

      if (
        beforePos &&
        afterPos &&
        (beforePos.x !== afterPos.x || beforePos.y !== afterPos.y)
      ) {
        const path = this.createBezierPath(beforePos, afterPos, rotationType);
        paths.push({
          nodeValue,
          fromX: beforePos.x,
          fromY: beforePos.y,
          toX: afterPos.x,
          toY: afterPos.y,
          pathD: path,
          progress: 0,
          duration: 1500, // 1.5秒动画
        });

        console.log(`📍 为节点 ${nodeValue} 创建路径:`, {
          from: `(${beforePos.x}, ${beforePos.y})`,
          to: `(${afterPos.x}, ${afterPos.y})`,
          path: path.substring(0, 50) + '...',
        });
      }
    });

    return {
      type: rotationType,
      centerNode,
      affectedNodes,
      paths,
      isPlaying: false,
      startTime: 0,
    };
  }

  private simulateBeforeRotation(
    op: TreeOperation,
    afterPositions: Map<number, NodePosition>
  ): Map<number, NodePosition> {
    const beforePositions = new Map<number, NodePosition>();

    // 根据旋转类型和中心节点，计算旋转前的位置
    const centerNode = op.nodes[0];
    const rotationType = this.getRotationType(op.type);

    if (!rotationType) {
      return beforePositions;
    }

    // 为了简化，我们基于旋转类型来估算旋转前的位置
    afterPositions.forEach((pos, nodeValue) => {
      if (nodeValue === centerNode) {
        // 中心节点位置通常不变或变化较小
        beforePositions.set(nodeValue, { ...pos });
      } else {
        // 根据旋转类型估算其他节点的旋转前位置
        const estimatedPos = this.estimateBeforePosition(
          pos,
          centerNode,
          rotationType,
          afterPositions
        );
        beforePositions.set(nodeValue, estimatedPos);
      }
    });

    return beforePositions;
  }

  private estimateBeforePosition(
    currentPos: NodePosition,
    centerNode: number,
    rotationType: 'LEFT' | 'RIGHT' | 'LR' | 'RL',
    allPositions: Map<number, NodePosition>
  ): NodePosition {
    const centerPos = allPositions.get(centerNode);
    if (!centerPos) {
      return { ...currentPos };
    }

    // 更激进的位置估算，确保产生明显的位置变化
    let estimatedX = currentPos.x;
    let estimatedY = currentPos.y;

    // 根据节点与中心节点的关系和旋转类型，估算旋转前位置
    const isCenter = currentPos.value === centerNode;
    const deltaX = currentPos.x - centerPos.x;
    const deltaY = currentPos.y - centerPos.y;

    switch (rotationType) {
      case 'RIGHT':
        if (isCenter) {
          // 中心节点在右旋中通常会向右下移动
          estimatedX = currentPos.x + 60;
          estimatedY = currentPos.y - 80;
        } else if (deltaX < 0) {
          // 左侧节点可能会向上移动
          estimatedX = currentPos.x - 30;
          estimatedY = currentPos.y + 80;
        } else {
          // 右侧节点位置变化较小
          estimatedX = currentPos.x + 30;
          estimatedY = currentPos.y - 40;
        }
        break;

      case 'LEFT':
        if (isCenter) {
          // 中心节点在左旋中通常会向左下移动
          estimatedX = currentPos.x - 60;
          estimatedY = currentPos.y - 80;
        } else if (deltaX > 0) {
          // 右侧节点可能会向上移动
          estimatedX = currentPos.x + 30;
          estimatedY = currentPos.y + 80;
        } else {
          // 左侧节点位置变化较小
          estimatedX = currentPos.x - 30;
          estimatedY = currentPos.y - 40;
        }
        break;

      case 'LR':
        // 左右旋转：更复杂的S形移动
        if (isCenter) {
          estimatedX = currentPos.x - 90;
          estimatedY = currentPos.y + 80;
        } else {
          estimatedX = currentPos.x + (deltaX > 0 ? -120 : 120);
          estimatedY = currentPos.y + (deltaY > 0 ? -80 : 80);
        }
        break;

      case 'RL':
        // 右左旋转：反S形移动
        if (isCenter) {
          estimatedX = currentPos.x + 90;
          estimatedY = currentPos.y + 80;
        } else {
          estimatedX = currentPos.x + (deltaX > 0 ? 120 : -120);
          estimatedY = currentPos.y + (deltaY > 0 ? -80 : 80);
        }
        break;
    }

    console.log(`🔄 节点 ${currentPos.value} 位置估算:`, {
      current: `(${currentPos.x}, ${currentPos.y})`,
      estimated: `(${estimatedX}, ${estimatedY})`,
      change: `(${estimatedX - currentPos.x}, ${estimatedY - currentPos.y})`,
    });

    return {
      value: currentPos.value,
      x: estimatedX,
      y: estimatedY,
    };
  }

  private saveCurrentPositions(): void {
    this.beforeRotationPositions.clear();
    this.nodes.forEach((node) => {
      this.beforeRotationPositions.set(node.value, { ...node });
    });
  }

  private getRotationType(
    opType: OperationType
  ): 'LEFT' | 'RIGHT' | 'LR' | 'RL' | null {
    switch (opType) {
      case OperationType.ROTATE_LEFT:
        return 'LEFT';
      case OperationType.ROTATE_RIGHT:
        return 'RIGHT';
      case OperationType.ROTATE_LR:
        return 'LR';
      case OperationType.ROTATE_RL:
        return 'RL';
      default:
        return null;
    }
  }

  private getAffectedNodes(
    centerNode: number,
    rotationType: 'LEFT' | 'RIGHT' | 'LR' | 'RL'
  ): number[] {
    // 对于AVL旋转，我们需要获取所有可能移动的节点
    // 不仅仅是中心节点的子树，还包括其父节点和兄弟节点

    const root = this.treeService.getRoot();
    if (!root) return [];

    // 获取所有节点，因为旋转可能影响树的整体结构
    const allNodes: number[] = [];
    this.collectAllNodes(root, allNodes);

    console.log('🌳 树中所有节点:', allNodes);

    // 对于简化实现，我们假设旋转会影响所有节点的位置
    // 这样可以确保动画能够正确显示
    return allNodes;
  }

  private collectAllNodes(node: TreeNode | null, result: number[]): void {
    if (!node) return;

    result.push(node.value);
    this.collectAllNodes(node.left, result);
    this.collectAllNodes(node.right, result);
  }

  private findTreeNode(node: TreeNode | null, value: number): TreeNode | null {
    if (!node) return null;
    if (node.value === value) return node;

    const leftResult = this.findTreeNode(node.left, value);
    if (leftResult) return leftResult;

    return this.findTreeNode(node.right, value);
  }

  private createBezierPath(
    from: NodePosition,
    to: NodePosition,
    rotationType: 'LEFT' | 'RIGHT' | 'LR' | 'RL'
  ): string {
    const fromCenterX = from.x + this.nodeSize / 2;
    const fromCenterY = from.y + this.nodeSize / 2;
    const toCenterX = to.x + this.nodeSize / 2;
    const toCenterY = to.y + this.nodeSize / 2;

    // 根据旋转类型创建不同的贝塞尔曲线
    let cp1x, cp1y, cp2x, cp2y;

    const midX = (fromCenterX + toCenterX) / 2;
    const midY = (fromCenterY + toCenterY) / 2;
    const distance = Math.sqrt(
      Math.pow(toCenterX - fromCenterX, 2) +
        Math.pow(toCenterY - fromCenterY, 2)
    );
    const curvature = Math.min(distance * 0.5, 100); // 控制曲线弯曲程度

    switch (rotationType) {
      case 'LEFT':
        // 左旋：顺时针弧线
        cp1x = fromCenterX + curvature;
        cp1y = fromCenterY - curvature * 0.5;
        cp2x = toCenterX + curvature;
        cp2y = toCenterY - curvature * 0.5;
        break;
      case 'RIGHT':
        // 右旋：逆时针弧线
        cp1x = fromCenterX - curvature;
        cp1y = fromCenterY - curvature * 0.5;
        cp2x = toCenterX - curvature;
        cp2y = toCenterY - curvature * 0.5;
        break;
      case 'LR':
        // 左右旋：S形曲线
        cp1x = fromCenterX - curvature * 0.7;
        cp1y = midY;
        cp2x = toCenterX + curvature * 0.7;
        cp2y = midY;
        break;
      case 'RL':
        // 右左旋：反S形曲线
        cp1x = fromCenterX + curvature * 0.7;
        cp1y = midY;
        cp2x = toCenterX - curvature * 0.7;
        cp2y = midY;
        break;
      default:
        // 默认直线
        cp1x = fromCenterX;
        cp1y = fromCenterY;
        cp2x = toCenterX;
        cp2y = toCenterY;
    }

    return `M ${fromCenterX} ${fromCenterY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${toCenterX} ${toCenterY}`;
  }

  private startRotationAnimation(animation: RotationAnimation): void {
    console.log('🚀 开始旋转动画:', animation);

    animation.isPlaying = true;
    animation.startTime = Date.now();

    // 将节点位置设置为起始位置
    animation.paths.forEach((path) => {
      const node = this.nodes.find((n) => n.value === path.nodeValue);
      if (node) {
        console.log(
          `📍 设置节点 ${path.nodeValue} 起始位置: (${path.fromX}, ${path.fromY})`
        );
        node.x = path.fromX;
        node.y = path.fromY;
      }
    });

    // 重新构建连线
    this.rebuildLines();

    // 高亮受影响的节点
    animation.affectedNodes.forEach((nodeValue) => {
      this.highlightedValues.add(nodeValue);
    });

    // 将路径添加到beziers数组以显示
    this.beziers = animation.paths.map((path) => ({ d: path.pathD }));
    console.log('🎨 添加贝塞尔路径:', this.beziers.length, '条');

    this.animateRotation(animation);
  }

  private animateRotation(animation: RotationAnimation): void {
    if (!animation.isPlaying || !this.playing) {
      this.finishRotationAnimation();
      return;
    }

    const elapsed = Date.now() - animation.startTime;
    const maxDuration = Math.max(...animation.paths.map((p) => p.duration));
    const progress = Math.min(elapsed / maxDuration, 1);

    // 使用缓动函数
    const easedProgress = this.easeInOutCubic(progress);

    // 更新节点位置
    animation.paths.forEach((path) => {
      const node = this.nodes.find((n) => n.value === path.nodeValue);
      if (node) {
        node.x = path.fromX + (path.toX - path.fromX) * easedProgress;
        node.y = path.fromY + (path.toY - path.fromY) * easedProgress;
      }
    });

    // 重新构建连线以跟随节点移动
    this.rebuildLines();

    if (progress >= 1) {
      this.finishRotationAnimation();
    } else {
      requestAnimationFrame(() => this.animateRotation(animation));
    }
  }

  public rebuildLines(): void {
    this.lines = [];
    const root = this.treeService.getRoot();
    if (root) {
      this.buildLinesFromTree(root, null);
    }
  }

  private buildLinesFromTree(
    node: TreeNode | null,
    parent: TreeNode | null
  ): void {
    if (!node) return;

    if (parent) {
      const parentPos = this.nodes.find((n) => n.value === parent.value);
      const nodePos = this.nodes.find((n) => n.value === node.value);

      if (parentPos && nodePos) {
        this.lines.push({
          x1: parentPos.x + this.nodeSize / 2,
          y1: parentPos.y + this.nodeSize / 2,
          x2: nodePos.x + this.nodeSize / 2,
          y2: nodePos.y + this.nodeSize / 2,
        });
      }
    }

    this.buildLinesFromTree(node.left, node);
    this.buildLinesFromTree(node.right, node);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private finishRotationAnimation(): void {
    if (this.currentAnimation) {
      // 确保所有节点都到达最终位置
      this.currentAnimation.paths.forEach((path) => {
        const node = this.nodes.find((n) => n.value === path.nodeValue);
        if (node) {
          node.x = path.toX;
          node.y = path.toY;
        }
      });

      this.currentAnimation.isPlaying = false;
      this.currentAnimation = null;
    }

    // 清除贝塞尔曲线
    this.beziers = [];

    // 继续下一个操作
    this.stepIndex++;
    setTimeout(() => this.processOperations(), 500 / this.speed);
  }

  pause(): void {
    this.playing = false;

    // 停止当前旋转动画
    if (this.currentAnimation) {
      this.currentAnimation.isPlaying = false;
    }
  }

  reset(): void {
    this.playing = false;
    this.stepIndex = 0;
    this.highlightedValues.clear();
    this.beziers = [];

    // 重置动画状态
    if (this.currentAnimation) {
      this.currentAnimation.isPlaying = false;
      this.currentAnimation = null;
    }
    this.animationQueue = [];
    this.beforeRotationPositions.clear();
    this.afterRotationPositions.clear();

    // 重新布局
    this.refreshLayout();
  }

  setSpeed(newSpeed: number): void {
    this.speed = newSpeed;

    // 如果有正在进行的动画，调整其速度
    if (this.currentAnimation && this.currentAnimation.isPlaying) {
      // 重新计算动画持续时间
      this.currentAnimation.paths.forEach((path) => {
        path.duration = path.duration / newSpeed;
      });
    }
  }

  // 单步执行旋转动画
  stepRotation(): void {
    if (this.stepIndex < this.operations.length) {
      const op = this.operations[this.stepIndex];

      if (op.type.startsWith('ROTATE')) {
        this.playing = false; // 确保不是自动播放模式
        this.handleRotationOperation(op);
      } else {
        this.step(); // 使用原有的step方法
      }
    }
  }

  private buildLayout(
    node: TreeNode,
    x: number,
    y: number,
    parentCoords: { x: number; y: number } | null
  ): void {
    // 存储当前节点位置
    this.nodes.push({ value: node.value, x, y });

    // 如果有父节点，记录一条连线
    if (parentCoords) {
      this.lines.push({
        x1: parentCoords.x + this.nodeSize / 2,
        y1: parentCoords.y + this.nodeSize / 2,
        x2: x + this.nodeSize / 2,
        y2: y + this.nodeSize / 2,
      });
    }

    // 递归布局子节点
    if (node.left) {
      this.buildLayout(
        node.left,
        x - this.horizontalGap * 2,
        y + this.verticalGap,
        { x, y }
      );
    }

    if (node.right) {
      this.buildLayout(
        node.right,
        x + this.horizontalGap * 2,
        y + this.verticalGap,
        { x, y }
      );
    }
  }
  clearLayout(): void {
    this.nodes = [];
    this.lines = [];
    this.highlightedValues.clear();
  }
  onDragStart(event: DragEvent): void {
    event.dataTransfer?.setData('text/plain', 'new-node');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // 允许 drop
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();

    const data = event.dataTransfer?.getData('text/plain');
    if (data === 'new-node') {
      const canvas = (event.target as HTMLElement).getBoundingClientRect();
      const x = event.clientX - canvas.left;
      const y = event.clientY - canvas.top;

      const valueStr = prompt('请输入节点值');
      if (valueStr !== null) {
        const value = parseInt(valueStr);

        this.treeService.insert(value);
        const allOps = this.treeService.getOperations();

        const rotateOps = allOps.filter((op) => op.type.startsWith('ROTATE'));

        this.treeService.setOperations(rotateOps);
        this.refreshLayout();
        this.playOperations(); // 播放轨迹动画

        this.treeService.setOperations(allOps);
      }
    }
  }

  onCanvasClick(event: MouseEvent): void {
    // 如果点击的不是节点，则隐藏右键菜单
    const target = event.target as HTMLElement;
    if (!target.closest('.tree-node') && !target.closest('.context-menu')) {
      this.contextMenu.visible = false;
    }
  }

  contextMenu = {
    visible: false,
    x: 0,
    y: 0,
    targetValue: 0,
  };

  onRightClick(event: MouseEvent, value: number): void {
    event.preventDefault();

    // 获取画布容器的边界矩形
    const canvas = document.querySelector('.tree-canvas') as HTMLElement;
    const canvasRect = canvas.getBoundingClientRect();

    // 计算相对于画布容器的坐标
    let relativeX = event.clientX - canvasRect.left;
    let relativeY = event.clientY - canvasRect.top;

    // 菜单大小估计 (宽度140px, 高度大约80px)
    const menuWidth = 140;
    const menuHeight = 80;

    // 防止菜单超出画布右边界
    if (relativeX + menuWidth > canvasRect.width) {
      relativeX = relativeX - menuWidth - 10; // 向左偏移并留出间距
    } else {
      relativeX = relativeX + 10; // 向右偏移一点避免遮挡鼠标
    }

    // 防止菜单超出画布下边界
    if (relativeY + menuHeight > canvasRect.height) {
      relativeY = relativeY - menuHeight - 10; // 向上偏移并留出间距
    } else {
      relativeY = relativeY + 10; // 向下偏移一点
    }

    // 确保菜单不会超出左上边界
    relativeX = Math.max(10, relativeX);
    relativeY = Math.max(10, relativeY);

    this.contextMenu.visible = true;
    this.contextMenu.x = relativeX;
    this.contextMenu.y = relativeY;
    this.contextMenu.targetValue = value;

    // 添加点击事件监听器来隐藏菜单
    setTimeout(() => {
      const hideMenu = () => {
        this.contextMenu.visible = false;
        document.removeEventListener('click', hideMenu);
      };
      document.addEventListener('click', hideMenu);
    }, 0);
  }

  modifyNode(): void {
    const newVal = prompt('请输入新值');
    if (newVal !== null) {
      this.treeService.modify(this.contextMenu.targetValue, parseInt(newVal));
      this.refreshLayout();
    }
    this.contextMenu.visible = false;
  }

  deleteNode(): void {
    this.treeService.delete(this.contextMenu.targetValue);

    this.refreshLayout();
    this.playOperations();

    this.contextMenu.visible = false;
  }

  stepIndex = 0;

  step(): void {
    this.playing = false;

    if (!this.operations || this.operations.length === 0) return;
    if (this.stepIndex >= this.operations.length) return;

    const op = this.operations[this.stepIndex];
    this.stepIndex++;

    this.highlightedValues.clear();
    op.nodes.forEach((v) => this.highlightedValues.add(v));
  }

  clearBezier(): void {
    this.beziers = [];
  }
}
