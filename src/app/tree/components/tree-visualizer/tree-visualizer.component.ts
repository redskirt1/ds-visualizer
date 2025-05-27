// tree-visualizer.component.ts
import { Component, OnInit } from '@angular/core';
import { TreeService } from '../../services/tree.service';
import { TreeNode } from '../../models/tree-node.model';
import { OperationType, TreeOperation } from '../../models/enum';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-tree-visualizer',
  templateUrl: './tree-visualizer.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./tree-visualizer.component.scss'],
})
export class TreeVisualizerComponent implements OnInit {
  nodes: { value: number; x: number; y: number }[] = [];
  lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  operations: TreeOperation[] = [];
  highlightedValues = new Set<number>();
  playing = false;
  speed = 1; // 1x

  private nodeSize = 40;
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

  playOperations(): void {
    this.playing = true;
    let i = 0;

    const step = () => {
      if (!this.playing || i >= this.operations.length) return;

      const op = this.operations[i];
      this.highlightedValues.clear();

      if (
        op.type === OperationType.INSERT ||
        op.type === OperationType.HIGHLIGHT
      ) {
        op.nodes.forEach((v) => this.highlightedValues.add(v));
      }

      if (
        op.type === OperationType.ROTATE_LEFT ||
        op.type === OperationType.ROTATE_RIGHT ||
        op.type === OperationType.ROTATE_LR ||
        op.type === OperationType.ROTATE_RL
      ) {
        op.nodes.forEach((v) => this.highlightedValues.add(v));
        // 你可以在此加入旋转动画（例如触发类变换）
      }

      i++;
      setTimeout(step, 1000 / this.speed);
    };

    step();
  }

  pause(): void {
    this.playing = false;
  }

  setSpeed(newSpeed: number): void {
    this.speed = newSpeed;
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
}
