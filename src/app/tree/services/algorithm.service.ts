import { Injectable } from '@angular/core';
import { TreeNode } from '../models/tree-node.model';
import { OperationType, TreeOperation } from '../models/enum';

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {
  dfs(root: TreeNode | null): TreeOperation[] {
    const ops: TreeOperation[] = [];
    const dfsHelper = (node: TreeNode | null) => {
      if (!node) return;
      ops.push({ type: OperationType.HIGHLIGHT, nodes: [node.value] });
      dfsHelper(node.left);
      dfsHelper(node.right);
    };
    dfsHelper(root);
    return ops;
  }

  bfs(root: TreeNode | null): TreeOperation[] {
    const ops: TreeOperation[] = [];
    const queue: (TreeNode | null)[] = [];

    if (root) queue.push(root);
    while (queue.length > 0) {
      const node = queue.shift();
      if (!node) continue;
      ops.push({ type: OperationType.HIGHLIGHT, nodes: [node.value] });
      queue.push(node.left, node.right);
    }
    return ops;
  }
}
