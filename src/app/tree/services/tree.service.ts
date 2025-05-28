// src/app/tree/services/tree.service.ts

import { Injectable } from '@angular/core';
import { TreeNode } from '../models/tree-node.model';
import { OperationType, TreeOperation } from '../models/enum';
import { TreeMetrics } from '../models/metrics.model';

@Injectable({
  providedIn: 'root',
})
export class TreeService {
  private root: TreeNode | null = null;
  private operations: TreeOperation[] = [];
  private metrics: TreeMetrics = {
    nodeCount: 0,
    height: 0,
    insertCount: 0,
    rotateCount: 0,
    visitedCount: 0,
  };
  getRoot(): TreeNode | null {
    return this.root;
  }

  getOperations(): TreeOperation[] {
    return this.operations;
  }

  setOperations(ops: TreeOperation[]) {
    this.operations = ops;
  }
  getMetrics(): TreeMetrics {
    return this.metrics;
  }
  insert(value: number): void {
    this.root = this._insert(this.root, value);
  }
  private countNodes(node: TreeNode | null): number {
    if (!node) return 0;
    return 1 + this.countNodes(node.left) + this.countNodes(node.right);
  }

  private _insert(node: TreeNode | null, value: number): TreeNode {
    if (!node) {
      this.operations.push({ type: OperationType.INSERT, nodes: [value] });
      this.metrics.insertCount++;
      return new TreeNode(value);
    }

    if (value < node.value) {
      node.left = this._insert(node.left, value);
    } else if (value > node.value) {
      node.right = this._insert(node.right, value);
    } else {
      return node; // 忽略重复值
    }

    node.height =
      1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));
    this.metrics.height = Math.max(this.metrics.height, node.height);
    this.metrics.nodeCount = this.countNodes(this.root);
    return this.balance(node, value);
  }

  private getHeight(node: TreeNode | null): number {
    return node ? node.height : 0;
  }

  private getBalance(node: TreeNode | null): number {
    return node ? this.getHeight(node.left) - this.getHeight(node.right) : 0;
  }

  private balance(node: TreeNode, value: number): TreeNode {
    const balance = this.getBalance(node);

    // 左左
    if (balance > 1 && value < (node.left?.value ?? 0)) {
      this.operations.push({
        type: OperationType.ROTATE_RIGHT,
        nodes: [node.value],
      });
      return this.rotateRight(node);
    }

    // 右右
    if (balance < -1 && value > (node.right?.value ?? 0)) {
      this.operations.push({
        type: OperationType.ROTATE_LEFT,
        nodes: [node.value],
      });
      return this.rotateLeft(node);
    }

    // 左右
    if (balance > 1 && value > (node.left?.value ?? 0)) {
      this.operations.push({
        type: OperationType.ROTATE_LR,
        nodes: [node.value],
      });
      node.left = this.rotateLeft(node.left!);
      return this.rotateRight(node);
    }

    // 右左
    if (balance < -1 && value < (node.right?.value ?? 0)) {
      this.operations.push({
        type: OperationType.ROTATE_RL,
        nodes: [node.value],
      });
      node.right = this.rotateRight(node.right!);
      return this.rotateLeft(node);
    }

    return node;
  }

  private rotateLeft(z: TreeNode): TreeNode {
    this.metrics.rotateCount++;
    const y = z.right!;
    const T2 = y.left;

    y.left = z;
    z.right = T2;

    z.height = 1 + Math.max(this.getHeight(z.left), this.getHeight(z.right));
    y.height = 1 + Math.max(this.getHeight(y.left), this.getHeight(y.right));

    return y;
  }

  private rotateRight(z: TreeNode): TreeNode {
    this.metrics.rotateCount++;
    const y = z.left!;
    const T3 = y.right;

    y.right = z;
    z.left = T3;

    z.height = 1 + Math.max(this.getHeight(z.left), this.getHeight(z.right));
    y.height = 1 + Math.max(this.getHeight(y.left), this.getHeight(y.right));

    return y;
  }

  setVisitedCount(count: number): void {
    this.metrics.visitedCount = count;
  }

  setLastSearchType(type: 'DFS' | 'BFS'): void {
    this.metrics.lastSearchType = type;
  }
  clearTree(): void {
    this.root = null;
    this.operations = [];

    this.metrics = {
      nodeCount: 0,
      height: 0,
      insertCount: 0,
      rotateCount: 0,
      visitedCount: 0,
    };
  }
  delete(value: number): void {
    this.root = this._delete(this.root, value);
  }

  modify(oldVal: number, newVal: number): void {
    this.delete(oldVal);
    this.insert(newVal);
  }

  private _delete(node: TreeNode | null, value: number): TreeNode | null {
    if (!node) return null;

    // Step 1: 标准 BST 删除
    if (value < node.value) {
      node.left = this._delete(node.left, value);
    } else if (value > node.value) {
      node.right = this._delete(node.right, value);
    } else {
      // 找到要删除的节点
      if (!node.left || !node.right) {
        const child = node.left || node.right;
        return child;
      } else {
        // 有两个子节点，用右子树中的最小值替代
        const minNode = this.getMinNode(node.right);
        node.value = minNode.value;
        node.right = this._delete(node.right, minNode.value);
      }
    }

    // Step 2: 更新高度
    node.height =
      1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));

    // Step 3: 获取平衡因子
    const balance = this.getBalance(node);

    // Step 4: 执行旋转保持平衡
    // Left Left
    if (balance > 1 && this.getBalance(node.left) >= 0) {
      this.operations.push({
        type: OperationType.ROTATE_RIGHT,
        nodes: [node.value],
      });
      return this.rotateRight(node);
    }

    // Left Right
    if (balance > 1 && this.getBalance(node.left) < 0) {
      this.operations.push({
        type: OperationType.ROTATE_LEFT,
        nodes: [node.left!.value],
      });
      node.left = this.rotateLeft(node.left!);
      this.operations.push({
        type: OperationType.ROTATE_RIGHT,
        nodes: [node.value],
      });
      return this.rotateRight(node);
    }

    // Right Right
    if (balance < -1 && this.getBalance(node.right) <= 0) {
      this.operations.push({
        type: OperationType.ROTATE_LEFT,
        nodes: [node.value],
      });
      return this.rotateLeft(node);
    }

    // Right Left
    if (balance < -1 && this.getBalance(node.right) > 0) {
      this.operations.push({
        type: OperationType.ROTATE_RIGHT,
        nodes: [node.right!.value],
      });
      node.right = this.rotateRight(node.right!);
      this.operations.push({
        type: OperationType.ROTATE_LEFT,
        nodes: [node.value],
      });
      return this.rotateLeft(node);
    }

    return node;
  }

  private getMinNode(node: TreeNode): TreeNode {
    let current = node;
    while (current.left) {
      current = current.left;
    }
    return current;
  }

  exportToJson(): string {
    return JSON.stringify(this.root, null, 2);
  }

  importFromJson(json: string): void {
    this.root = JSON.parse(json);
  }
}
