import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import {
  BigIntConfig,
  DivideConquerStats,
  DivideConquerStep,
  DivideConquerStepType,
  TreeNode,
} from './bigint-multiply.model';

@Injectable({ providedIn: 'root' })
export class BigIntMultiplyService {
  private cfg!: BigIntConfig;
  private steps: DivideConquerStep[] = [];
  private pointer = 0;
  private nodeCounter = 0;

  // 速度（ms / 步），默认 800 ms
  speed$ = new BehaviorSubject<number>(800);

  // 当前步骤
  current$ = new BehaviorSubject<DivideConquerStep | null>(null);

  // 统计信息
  stats$ = new BehaviorSubject<DivideConquerStats>({
    depth: 0,
    maxDepth: 0,
    divideCount: 0,
    combineCount: 0,
    baseCaseCount: 0,
    stepIndex: 0,
    totalSteps: 0,
  });

  private timer?: Subscription;

  /** 初始化（生成所有步骤，重置指针） */
  init(cfg: BigIntConfig) {
    // 清除之前的状态
    this.cfg = cfg;
    this.steps = [];
    this.pointer = 0;
    this.nodeCounter = 0;

    // 验证输入是否合法
    if (!this.isValidInput(cfg.num1) || !this.isValidInput(cfg.num2)) {
      throw new Error('输入必须是非负整数');
    }

    // 创建初始递归树
    const rootNode: TreeNode = {
      id: this.generateNodeId(),
      parentId: null,
      depth: 0,
      problem: {
        a: cfg.num1,
        b: cfg.num2,
      },
      children: [],
      completed: false,
    };

    // 添加初始步骤
    this.steps.push({
      type: 'INIT',
      nodeId: rootNode.id,
      tree: rootNode,
      currentProblem: {
        a: cfg.num1,
        b: cfg.num2,
      },
      explanation: `初始化：计算 ${cfg.num1} × ${cfg.num2}`,
    });

    // 开始分治计算
    this.karatsuba(rootNode, cfg.num1, cfg.num2, cfg.threshold);

    // 更新统计信息
    this.updateStats();

    // 设置当前步骤
    this.current$.next(this.steps[0] || null);
  }

  /** 单步前进；返回 false 代表已到末尾 */
  step(): boolean {
    if (this.pointer >= this.steps.length - 1) return false;
    this.pointer++;
    this.current$.next(this.steps[this.pointer]);
    this.updateStats();
    return true;
  }

  /** 回溯到指定 idx */
  goto(idx: number) {
    if (idx < 0 || idx >= this.steps.length) return;
    this.pointer = idx;
    this.current$.next(this.steps[idx]);
    this.updateStats();
  }

  play() {
    if (this.timer) return;
    this.timer = interval(this.speed$.value).subscribe(() => {
      if (!this.step()) this.pause();
    });
  }

  pause() {
    this.timer?.unsubscribe();
    this.timer = undefined;
  }

  /** 更新统计信息 */
  private updateStats() {
    const currentStep = this.steps[this.pointer];
    if (!currentStep) return;

    // 计算各种统计值
    let divideCount = 0;
    let combineCount = 0;
    let baseCaseCount = 0;
    let maxDepth = 0;

    for (let i = 0; i <= this.pointer; i++) {
      const step = this.steps[i];
      switch (step.type) {
        case 'DIVIDE':
          divideCount++;
          break;
        case 'COMBINE':
          combineCount++;
          break;
        case 'BASE_CASE':
          baseCaseCount++;
          break;
      }

      // 找出访问过的所有节点中的最大深度
      const nodeDepth = this.findNodeDepth(step.tree, step.nodeId);
      maxDepth = Math.max(maxDepth, nodeDepth);
    }

    // 获取当前节点深度
    const currentNodeDepth = this.findNodeDepth(
      currentStep.tree,
      currentStep.nodeId
    );

    this.stats$.next({
      depth: currentNodeDepth,
      maxDepth,
      divideCount,
      combineCount,
      baseCaseCount,
      stepIndex: this.pointer,
      totalSteps: this.steps.length - 1, // 减去初始步骤
    });
  }

  /** 找出指定节点的深度 */
  private findNodeDepth(tree: TreeNode, nodeId: string): number {
    if (tree.id === nodeId) {
      return tree.depth;
    }

    for (const child of tree.children) {
      const depth = this.findNodeDepth(child, nodeId);
      if (depth !== -1) return depth;
    }

    return -1;
  }

  /** 递归查找节点 */
  private findNode(tree: TreeNode, nodeId: string): TreeNode | null {
    if (tree.id === nodeId) {
      return tree;
    }

    for (const child of tree.children) {
      const node = this.findNode(child, nodeId);
      if (node) return node;
    }

    return null;
  }

  /** 更新节点数据 */
  private updateNode(
    tree: TreeNode,
    nodeId: string,
    updater: (node: TreeNode) => void
  ): TreeNode {
    // 创建树的克隆，防止修改原树
    const newTree = this.cloneTreeNode(tree);

    // 找到并更新指定节点
    const node = this.findNode(newTree, nodeId);
    if (node) {
      updater(node);
    }

    return newTree;
  }

  /** 克隆树节点 */
  private cloneTreeNode(node: TreeNode): TreeNode {
    return {
      ...node,
      problem: { ...node.problem },
      children: node.children.map((child) => this.cloneTreeNode(child)),
    };
  }

  /** 卡拉楚巴算法实现 */
  private karatsuba(
    currentNode: TreeNode,
    a: string,
    b: string,
    threshold: number
  ): string {
    // 删除前导零
    a = a.replace(/^0+/, '') || '0';
    b = b.replace(/^0+/, '') || '0';

    // 基本情况：如果数字长度小于阈值，直接使用标准乘法
    if (a.length <= threshold || b.length <= threshold) {
      const result = this.standardMultiply(a, b);

      // 添加基本情况步骤
      const newTree = this.updateNode(
        this.steps[this.steps.length - 1].tree,
        currentNode.id,
        (node) => {
          node.result = result;
          node.completed = true;
        }
      );

      this.steps.push({
        type: 'BASE_CASE',
        nodeId: currentNode.id,
        tree: newTree,
        currentProblem: { a, b },
        result,
        explanation: `基本情况：${a} × ${b} = ${result}（数字长度小于阈值 ${threshold}，直接计算）`,
      });

      return result;
    }

    // 找出a和b中最长的长度
    const n = Math.max(a.length, b.length);

    // 计算分割点（约为位数的一半）
    const m = Math.floor(n / 2);

    // 确保a和b的长度足够，前面用0填充
    const paddedA = a.padStart(n, '0');
    const paddedB = b.padStart(n, '0');

    // 分割为高位和低位
    const a1 = paddedA.slice(0, paddedA.length - m) || '0';
    const a0 = paddedA.slice(paddedA.length - m) || '0';
    const b1 = paddedB.slice(0, paddedB.length - m) || '0';
    const b0 = paddedB.slice(paddedB.length - m) || '0';

    // 添加分割步骤
    const treeAfterDivide = this.updateNode(
      this.steps[this.steps.length - 1].tree,
      currentNode.id,
      (node) => {
        // 预先创建三个子节点
        const z2Node: TreeNode = {
          id: this.generateNodeId(),
          parentId: node.id,
          depth: node.depth + 1,
          problem: { a: a1, b: b1 },
          children: [],
          completed: false,
        };

        const z1Node: TreeNode = {
          id: this.generateNodeId(),
          parentId: node.id,
          depth: node.depth + 1,
          problem: {
            a: this.addStrings(a1, a0),
            b: this.addStrings(b1, b0),
          },
          children: [],
          completed: false,
        };

        const z0Node: TreeNode = {
          id: this.generateNodeId(),
          parentId: node.id,
          depth: node.depth + 1,
          problem: { a: a0, b: b0 },
          children: [],
          completed: false,
        };

        node.children = [z2Node, z1Node, z0Node];
      }
    );

    this.steps.push({
      type: 'DIVIDE',
      nodeId: currentNode.id,
      tree: treeAfterDivide,
      currentProblem: { a, b },
      subProblems: { a1, a0, b1, b0 },
      explanation: `分割：
      ${a} = ${a1} × 10^${m} + ${a0}
      ${b} = ${b1} × 10^${m} + ${b0}
      创建三个子问题：
      z2 = ${a1} × ${b1}
      z1 = (${a1} + ${a0}) × (${b1} + ${b0})
      z0 = ${a0} × ${b0}`,
    });

    const children =
      this.findNode(treeAfterDivide, currentNode.id)?.children || [];
    if (children.length !== 3) {
      throw new Error('子节点数量错误');
    }

    // 递归计算三个子问题
    // z2 = a1 * b1
    const z2NodeId = children[0].id;
    this.steps.push({
      type: 'CONQUER',
      nodeId: z2NodeId,
      tree: treeAfterDivide,
      currentProblem: { a: a1, b: b1 },
      explanation: `计算子问题1：z2 = ${a1} × ${b1}`,
    });

    const z2 = this.karatsuba(children[0], a1, b1, threshold);

    // z0 = a0 * b0
    const z0NodeId = children[2].id;
    this.steps.push({
      type: 'CONQUER',
      nodeId: z0NodeId,
      tree: this.steps[this.steps.length - 1].tree,
      currentProblem: { a: a0, b: b0 },
      explanation: `计算子问题3：z0 = ${a0} × ${b0}`,
    });

    const z0 = this.karatsuba(children[2], a0, b0, threshold);

    // z1 = (a1 + a0) * (b1 + b0) - z2 - z0
    const sumA = this.addStrings(a1, a0);
    const sumB = this.addStrings(b1, b0);

    const z1NodeId = children[1].id;
    this.steps.push({
      type: 'CONQUER',
      nodeId: z1NodeId,
      tree: this.steps[this.steps.length - 1].tree,
      currentProblem: { a: sumA, b: sumB },
      explanation: `计算子问题2：z1 = (${a1} + ${a0}) × (${b1} + ${b0}) = ${sumA} × ${sumB}`,
    });

    const z1Raw = this.karatsuba(children[1], sumA, sumB, threshold);
    const z1 = this.subtractStrings(this.subtractStrings(z1Raw, z2), z0);

    // 更新z1节点的实际结果
    const treeBeforeCombine = this.updateNode(
      this.steps[this.steps.length - 1].tree,
      z1NodeId,
      (node) => {
        node.result = z1;
      }
    );

    // 合并结果: a*b = z2 * 10^(2*m) + z1 * 10^m + z0
    // 首先计算 z2 * 10^(2*m)
    const z2Shifted = z2 + '0'.repeat(2 * m);

    // 然后计算 z1 * 10^m
    const z1Shifted = z1 + '0'.repeat(m);

    // 最后将三部分相加得到最终结果
    const result = this.addStrings(this.addStrings(z2Shifted, z1Shifted), z0);

    // 添加合并步骤
    const treeAfterCombine = this.updateNode(
      treeBeforeCombine,
      currentNode.id,
      (node) => {
        node.result = result;
        node.completed = true;
      }
    );

    this.steps.push({
      type: 'COMBINE',
      nodeId: currentNode.id,
      tree: treeAfterCombine,
      subResults: { z2, z1, z0 },
      result,
      explanation: `合并结果：
      z2 = ${z2}
      z1 = ${z1}
      z0 = ${z0}
      结果 = z2 × 10^${2 * m} + z1 × 10^${m} + z0
      = ${z2} × 10^${2 * m} + ${z1} × 10^${m} + ${z0}
      = ${result}`,
    });

    // 如果是根节点，添加最终结果步骤
    if (currentNode.parentId === null) {
      this.steps.push({
        type: 'RESULT',
        nodeId: currentNode.id,
        tree: treeAfterCombine,
        result,
        explanation: `最终结果：${this.cfg.num1} × ${this.cfg.num2} = ${result}`,
      });
    }

    return result;
  }

  /** 标准大整数乘法（长乘法） */
  private standardMultiply(a: string, b: string): string {
    // 特殊情况处理
    if (a === '0' || b === '0') return '0';

    // 初始化结果数组，长度为 a.length + b.length
    const result = new Array(a.length + b.length).fill(0);

    // 从右到左逐位相乘
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        // 当前位的乘积
        const product = parseInt(a[i]) * parseInt(b[j]);
        // 结果的位置
        const pos1 = i + j;
        const pos2 = i + j + 1;
        // 累加到结果数组
        const sum = product + result[pos2];
        result[pos1] += Math.floor(sum / 10);
        result[pos2] = sum % 10;
      }
    }

    // 转换为字符串，去除前导零
    return result.join('').replace(/^0+/, '') || '0';
  }

  /** 大整数加法 */
  private addStrings(num1: string, num2: string): string {
    let i = num1.length - 1;
    let j = num2.length - 1;
    let carry = 0;
    let result = '';

    while (i >= 0 || j >= 0 || carry > 0) {
      const x = i >= 0 ? parseInt(num1[i--]) : 0;
      const y = j >= 0 ? parseInt(num2[j--]) : 0;
      const sum = x + y + carry;
      result = (sum % 10) + result;
      carry = Math.floor(sum / 10);
    }

    return result;
  }

  /** 大整数减法 */
  private subtractStrings(num1: string, num2: string): string {
    // 确保 num1 >= num2
    if (this.compareStrings(num1, num2) < 0) {
      return '-' + this.subtractStrings(num2, num1);
    }

    let i = num1.length - 1;
    let j = num2.length - 1;
    let borrow = 0;
    let result = '';

    while (i >= 0) {
      let diff = parseInt(num1[i--]) - borrow;
      if (j >= 0) diff -= parseInt(num2[j--]);

      if (diff < 0) {
        diff += 10;
        borrow = 1;
      } else {
        borrow = 0;
      }

      result = diff + result;
    }

    // 去除前导零
    return result.replace(/^0+/, '') || '0';
  }

  /** 比较两个大整数字符串 */
  private compareStrings(num1: string, num2: string): number {
    // 去除前导零
    num1 = num1.replace(/^0+/, '') || '0';
    num2 = num2.replace(/^0+/, '') || '0';

    // 首先比较长度
    if (num1.length > num2.length) return 1;
    if (num1.length < num2.length) return -1;

    // 长度相同，逐位比较
    for (let i = 0; i < num1.length; i++) {
      if (parseInt(num1[i]) > parseInt(num2[i])) return 1;
      if (parseInt(num1[i]) < parseInt(num2[i])) return -1;
    }

    // 相等
    return 0;
  }

  /** 生成唯一的节点ID */
  private generateNodeId(): string {
    return `node-${++this.nodeCounter}`;
  }

  /** 检查输入是否为有效的非负整数 */
  private isValidInput(input: string): boolean {
    return /^\d+$/.test(input);
  }

  /** 标准测试用例 */
  get standardTestCases(): { name: string; config: BigIntConfig }[] {
    return [
      {
        name: '简单乘法',
        config: {
          num1: '123',
          num2: '456',
          threshold: 2,
        },
      },
      {
        name: '中等乘法',
        config: {
          num1: '123456789',
          num2: '987654321',
          threshold: 4,
        },
      },
      {
        name: '大数乘法',
        config: {
          num1: '9876543210987654321',
          num2: '1234567890123456789',
          threshold: 6,
        },
      },
    ];
  }

  /** 随机生成指定位数的大整数 */
  generateRandomBigInt(digits: number): string {
    let result = '';

    // 首位不为0
    result += Math.floor(Math.random() * 9) + 1;

    // 生成剩余位数
    for (let i = 1; i < digits; i++) {
      result += Math.floor(Math.random() * 10);
    }

    return result;
  }

  /** 将配置导出为JSON */
  exportToJson(config: BigIntConfig): string {
    return JSON.stringify(config, null, 2);
  }

  /** 解析JSON配置 */
  parseJsonConfig(json: string): BigIntConfig | null {
    try {
      const config = JSON.parse(json) as BigIntConfig;

      if (
        !config.num1 ||
        !config.num2 ||
        !this.isValidInput(config.num1) ||
        !this.isValidInput(config.num2)
      ) {
        return null;
      }

      if (typeof config.threshold !== 'number' || config.threshold < 1) {
        return null;
      }

      return config;
    } catch (e) {
      return null;
    }
  }

  get stepCount() {
    return this.steps.length;
  }

  get currentIndex() {
    return this.pointer;
  }
}
