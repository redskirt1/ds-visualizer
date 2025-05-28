import { Injectable } from '@angular/core';

export interface BPlusTreeNode {
  keys: number[];
  isLeaf: boolean;
  children?: BPlusTreeNode[];
  next?: BPlusTreeNode; // 用于叶子节点链表
  parent?: BPlusTreeNode | null;
  id: string;
  level: number;
  position?: { x: number; y: number; z: number };
}

@Injectable({
  providedIn: 'root',
})
export class BPlusTreeService {
  private root: BPlusTreeNode | null = null;
  private order = 3; // B+ 树的阶数
  private nodeIdCounter = 0;

  constructor() {
    this.initializeDefaultTree();
  }

  private initializeDefaultTree(): void {
    // 创建一个示例 B+ 树
    this.root = {
      keys: [10, 20],
      isLeaf: false,
      id: this.generateNodeId(),
      level: 0,
      children: [
        {
          keys: [5, 8],
          isLeaf: true,
          id: this.generateNodeId(),
          level: 1,
        },
        {
          keys: [12, 15],
          isLeaf: true,
          id: this.generateNodeId(),
          level: 1,
        },
        {
          keys: [25, 30, 35],
          isLeaf: true,
          id: this.generateNodeId(),
          level: 1,
        },
      ],
    };

    // 设置父子关系
    if (this.root && this.root.children) {
      this.root.children.forEach((child) => {
        child.parent = this.root;
      });

      // 设置叶子节点链表
      for (let i = 0; i < this.root.children.length - 1; i++) {
        this.root.children[i].next = this.root.children[i + 1];
      }
    }

    this.calculatePositions();
  }

  private generateNodeId(): string {
    return `node_${this.nodeIdCounter++}`;
  }

  getRoot(): BPlusTreeNode | null {
    return this.root;
  }

  search(value: number): { found: boolean; path: BPlusTreeNode[] } {
    const path: BPlusTreeNode[] = [];
    let current = this.root;

    while (current) {
      path.push(current);

      if (current.isLeaf) {
        const found = current.keys.includes(value);
        return { found, path };
      }

      // 找到合适的子节点
      let childIndex = 0;
      for (let i = 0; i < current.keys.length; i++) {
        if (value <= current.keys[i]) {
          childIndex = i;
          break;
        } else {
          childIndex = i + 1;
        }
      }

      current = current.children?.[childIndex] || null;
    }

    return { found: false, path };
  }

  insert(value: number): boolean {
    if (!this.root) return false;

    const result = this.insertIntoNode(this.root, value);
    if (result.newRoot) {
      this.root = result.newRoot;
    }

    this.calculatePositions();
    return true;
  }

  private insertIntoNode(
    node: BPlusTreeNode,
    value: number
  ): { newRoot?: BPlusTreeNode; middleKey?: number } {
    if (node.isLeaf) {
      // 插入到叶子节点
      this.insertIntoSortedArray(node.keys, value);

      // 检查是否需要分裂
      if (node.keys.length > this.order) {
        return this.splitLeafNode(node);
      }
    } else {
      // 找到合适的子节点
      let childIndex = 0;
      for (let i = 0; i < node.keys.length; i++) {
        if (value <= node.keys[i]) {
          childIndex = i;
          break;
        } else {
          childIndex = i + 1;
        }
      }

      const childResult = this.insertIntoNode(
        node.children![childIndex],
        value
      );

      if (childResult.middleKey !== undefined) {
        // 子节点发生了分裂，需要将中间键提升
        this.insertIntoSortedArray(node.keys, childResult.middleKey);

        // 检查是否需要分裂当前节点
        if (node.keys.length > this.order) {
          return this.splitInternalNode(node);
        }
      }
    }

    return {};
  }

  private splitLeafNode(node: BPlusTreeNode): {
    newRoot?: BPlusTreeNode;
    middleKey: number;
  } {
    const middleIndex = Math.floor(node.keys.length / 2);
    const middleKey = node.keys[middleIndex];

    const newNode: BPlusTreeNode = {
      keys: node.keys.slice(middleIndex),
      isLeaf: true,
      id: this.generateNodeId(),
      level: node.level,
      parent: node.parent,
      next: node.next,
    };

    node.keys = node.keys.slice(0, middleIndex);
    node.next = newNode;

    if (!node.parent) {
      // 创建新的根节点
      const newRoot: BPlusTreeNode = {
        keys: [middleKey],
        isLeaf: false,
        id: this.generateNodeId(),
        level: 0,
        children: [node, newNode],
      };

      node.parent = newRoot;
      newNode.parent = newRoot;

      return { newRoot, middleKey };
    }

    return { middleKey };
  }

  private splitInternalNode(node: BPlusTreeNode): {
    newRoot?: BPlusTreeNode;
    middleKey: number;
  } {
    const middleIndex = Math.floor(node.keys.length / 2);
    const middleKey = node.keys[middleIndex];

    const newNode: BPlusTreeNode = {
      keys: node.keys.slice(middleIndex + 1),
      isLeaf: false,
      id: this.generateNodeId(),
      level: node.level,
      parent: node.parent,
      children: node.children!.slice(middleIndex + 1),
    };

    node.keys = node.keys.slice(0, middleIndex);
    node.children = node.children!.slice(0, middleIndex + 1);

    // 更新子节点的父指针
    if (newNode.children) {
      newNode.children.forEach((child) => {
        child.parent = newNode;
      });
    }

    if (!node.parent) {
      // 创建新的根节点
      const newRoot: BPlusTreeNode = {
        keys: [middleKey],
        isLeaf: false,
        id: this.generateNodeId(),
        level: 0,
        children: [node, newNode],
      };

      node.parent = newRoot;
      newNode.parent = newRoot;

      return { newRoot, middleKey };
    }

    return { middleKey };
  }

  delete(value: number): boolean {
    if (!this.root) return false;

    const deleted = this.deleteFromNode(this.root, value);

    // 如果根节点为空且有子节点，提升子节点为新根
    if (
      this.root.keys.length === 0 &&
      this.root.children &&
      this.root.children.length === 1
    ) {
      this.root = this.root.children[0];
      this.root.parent = null;
    }

    this.calculatePositions();
    return deleted;
  }

  private deleteFromNode(node: BPlusTreeNode, value: number): boolean {
    if (node.isLeaf) {
      const index = node.keys.indexOf(value);
      if (index !== -1) {
        node.keys.splice(index, 1);
        return true;
      }
      return false;
    } else {
      // 找到包含该值的子节点
      let childIndex = 0;
      for (let i = 0; i < node.keys.length; i++) {
        if (value <= node.keys[i]) {
          childIndex = i;
          break;
        } else {
          childIndex = i + 1;
        }
      }

      return this.deleteFromNode(node.children![childIndex], value);
    }
  }

  private insertIntoSortedArray(array: number[], value: number): void {
    let insertIndex = 0;
    for (let i = 0; i < array.length; i++) {
      if (value <= array[i]) {
        insertIndex = i;
        break;
      } else {
        insertIndex = i + 1;
      }
    }
    array.splice(insertIndex, 0, value);
  }

  private calculatePositions(): void {
    if (!this.root) return;

    const levelNodes: BPlusTreeNode[][] = [];

    // 收集每一层的节点
    const collectNodes = (node: BPlusTreeNode, level: number) => {
      if (!levelNodes[level]) {
        levelNodes[level] = [];
      }
      levelNodes[level].push(node);

      if (node.children) {
        node.children.forEach((child) => {
          child.level = level + 1;
          collectNodes(child, level + 1);
        });
      }
    };

    this.root.level = 0;
    collectNodes(this.root, 0);

    // 为每一层的节点计算位置
    levelNodes.forEach((nodes, level) => {
      const nodeSpacing = 10;
      const startX = (-(nodes.length - 1) * nodeSpacing) / 2;

      nodes.forEach((node, index) => {
        node.position = {
          x: startX + index * nodeSpacing,
          y: -level * 6,
          z: 0,
        };
      });
    });
  }

  getAllNodes(): BPlusTreeNode[] {
    const nodes: BPlusTreeNode[] = [];

    const traverse = (node: BPlusTreeNode) => {
      nodes.push(node);
      if (node.children) {
        node.children.forEach((child) => traverse(child));
      }
    };

    if (this.root) {
      traverse(this.root);
    }

    return nodes;
  }

  clear(): void {
    this.root = null;
    this.nodeIdCounter = 0;
  }

  reset(): void {
    this.clear();
    this.initializeDefaultTree();
  }
}
