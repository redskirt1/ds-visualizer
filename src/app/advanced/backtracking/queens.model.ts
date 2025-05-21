/**
 * 八皇后问题配置
 */
export interface QueensConfig {
  /** 棋盘大小 */
  size: number;
  /** 初始布局（可选）*/
  initialBoard?: number[];
}

/**
 * 回溯算法步骤
 */
export interface BacktrackStep {
  /** 当前递归深度（行号）*/
  row: number;
  /** 当前尝试的列 */
  col: number;
  /** 当前操作类型 */
  action: 'PLACE' | 'REMOVE' | 'CHECK' | 'SOLUTION';
  /** 放置皇后的位置，每个元素代表该行皇后所在的列 */
  board: number[];
  /** 冲突位置 */
  conflicts?: { row: number; col: number }[];
  /** 是否找到解 */
  isSolution?: boolean;
}

/**
 * 回溯算法统计信息
 */
export interface BacktrackStats {
  /** 递归深度 */
  depth: number;
  /** 已尝试节点数 */
  nodesVisited: number;
  /** 回溯次数 */
  backtracks: number;
  /** 已找到解的数量 */
  solutionsFound: number;
}

/**
 * 位置坐标
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * 解决方案
 */
export interface Solution {
  /** 皇后位置，每个元素代表该行皇后所在的列 */
  board: number[];
  /** 解决方案编号 */
  id: number;
}
