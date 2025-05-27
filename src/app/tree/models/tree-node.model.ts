// src/app/tree/models/tree-node.model.ts
export class TreeNode {
  value: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  height: number = 1;

  constructor(value: number) {
    this.value = value;
  }
}
