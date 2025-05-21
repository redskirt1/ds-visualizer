/**
 * 大整数乘法配置
 */
export interface BigIntConfig {
  /** 第一个大整数 */
  num1: string;
  /** 第二个大整数 */
  num2: string;
  /** 分割阈值（小于此值不再分割） */
  threshold: number;
}

/**
 * 分治算法步骤类型
 */
export type DivideConquerStepType =
  | 'INIT' // 初始化
  | 'DIVIDE' // 分割
  | 'CONQUER' // 子问题递归调用
  | 'COMBINE' // 合并结果
  | 'RESULT' // 最终结果
  | 'BASE_CASE'; // 基本情况（小于阈值直接计算）

/**
 * 递归树节点
 */
export interface TreeNode {
  /** 节点ID */
  id: string;
  /** 父节点ID */
  parentId: string | null;
  /** 节点深度 */
  depth: number;
  /** 节点对应的问题（两个数相乘） */
  problem: {
    a: string;
    b: string;
  };
  /** 节点计算的结果 */
  result?: string;
  /** 子问题 */
  children: TreeNode[];
  /** 子问题是否完成 */
  completed: boolean;
}

/**
 * 分治算法步骤
 */
export interface DivideConquerStep {
  /** 步骤类型 */
  type: DivideConquerStepType;
  /** 当前操作的节点ID */
  nodeId: string;
  /** 完整的递归树 */
  tree: TreeNode;
  /** 当前子问题 */
  currentProblem?: {
    a: string;
    b: string;
  };
  /** 分割后的子问题 */
  subProblems?: {
    a1: string;
    a0: string;
    b1: string;
    b0: string;
  };
  /** 子问题的结果 */
  subResults?: {
    z2?: string;
    z1?: string;
    z0?: string;
  };
  /** 合并的结果 */
  result?: string;
  /** 步骤解释 */
  explanation?: string;
}

/**
 * 分治算法统计数据
 */
export interface DivideConquerStats {
  /** 递归深度（当前） */
  depth: number;
  /** 最大递归深度 */
  maxDepth: number;
  /** 分割次数 */
  divideCount: number;
  /** 合并次数 */
  combineCount: number;
  /** 基本情况次数 */
  baseCaseCount: number;
  /** 当前步骤编号 */
  stepIndex: number;
  /** 总步骤数 */
  totalSteps: number;
}
