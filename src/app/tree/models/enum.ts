// src/app/tree/models/enum.ts

export enum OperationType {
  INSERT = 'INSERT',
  DELETE = 'DELETE',
  ROTATE_LEFT = 'ROTATE_LEFT',
  ROTATE_RIGHT = 'ROTATE_RIGHT',
  ROTATE_LR = 'ROTATE_LR',
  ROTATE_RL = 'ROTATE_RL',
  HIGHLIGHT = 'HIGHLIGHT'
}

export interface TreeOperation {
  type: OperationType;
  nodes: number[]; // 被操作节点的值，比如 [5, 7] 代表某次旋转涉及的节点
}
