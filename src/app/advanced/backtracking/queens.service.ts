import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import {
  BacktrackStats,
  BacktrackStep,
  Position,
  QueensConfig,
  Solution,
} from './queens.model';

@Injectable({ providedIn: 'root' })
export class QueensService {
  private cfg!: QueensConfig;
  private steps: BacktrackStep[] = [];
  private pointer = 0;
  private solutions: Solution[] = [];

  // 速度（ms / 步），默认 500 ms
  speed$ = new BehaviorSubject<number>(500);

  // 当前帧
  current$ = new BehaviorSubject<BacktrackStep | null>(null);

  // 当前步骤的说明
  currentExplanation$ = new BehaviorSubject<string>('');

  // 统计信息
  stats$ = new BehaviorSubject<BacktrackStats>({
    depth: 0,
    nodesVisited: 0,
    backtracks: 0,
    solutionsFound: 0,
  });

  // 找到的所有解
  solutions$ = new BehaviorSubject<Solution[]>([]);

  private timer?: Subscription;

  /** 初始化（生成所有步骤，重置指针） */
  init(cfg: QueensConfig) {
    this.cfg = cfg;
    this.steps = [];
    this.solutions = [];
    this.buildSteps();
    this.pointer = 0;
    this.current$.next(this.steps[0] || null);
    this.updateExplanation();
    this.updateStats();
    this.solutions$.next([...this.solutions]);
  }

  /** 单步前进；返回 false 代表已到末尾 */
  step(): boolean {
    if (this.pointer >= this.steps.length - 1) return false;
    this.pointer++;
    this.current$.next(this.steps[this.pointer]);
    this.updateExplanation();
    this.updateStats();
    return true;
  }

  /** 回溯到指定 idx */
  goto(idx: number) {
    if (idx < 0 || idx >= this.steps.length) return;
    this.pointer = idx;
    this.current$.next(this.steps[idx]);
    this.updateExplanation();
    this.updateStats();
  }

  /** 更新当前步骤的说明 */
  private updateExplanation() {
    const step = this.steps[this.pointer];
    if (!step) {
      this.currentExplanation$.next('初始化棋盘');
      return;
    }

    let explanation = '';
    switch (step.action) {
      case 'PLACE':
        explanation = `在第 ${step.row + 1} 行，第 ${step.col + 1} 列放置皇后`;
        break;
      case 'REMOVE':
        explanation = `从第 ${step.row + 1} 行，第 ${
          step.col + 1
        } 列移除皇后 (回溯)`;
        break;
      case 'CHECK':
        if (step.conflicts && step.conflicts.length > 0) {
          explanation = `检查：第 ${step.row + 1} 行，第 ${
            step.col + 1
          } 列与已放置皇后冲突`;
        } else {
          explanation = `检查：第 ${step.row + 1} 行，第 ${
            step.col + 1
          } 列可以放置皇后`;
        }
        break;
      case 'SOLUTION':
        explanation = `找到一个解！所有 ${this.cfg.size} 个皇后都已放置，且互不攻击`;
        break;
    }

    this.currentExplanation$.next(explanation);
  }

  /** 更新统计信息 */
  private updateStats() {
    const step = this.steps[this.pointer];
    if (!step) {
      this.stats$.next({
        depth: 0,
        nodesVisited: 0,
        backtracks: 0,
        solutionsFound: 0,
      });
      return;
    }

    let backtracks = 0;
    let solutions = 0;

    // 计算到当前步骤的回溯次数和解的数量
    for (let i = 0; i <= this.pointer; i++) {
      const s = this.steps[i];
      if (s.action === 'REMOVE') backtracks++;
      if (s.isSolution) solutions++;
    }

    this.stats$.next({
      depth: step.row,
      nodesVisited: this.pointer,
      backtracks,
      solutionsFound: solutions,
    });
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

  /** 生成全部步骤 */
  private buildSteps() {
    const { size, initialBoard } = this.cfg;
    const board = initialBoard ? [...initialBoard] : Array(size).fill(-1);

    // 添加初始步骤
    this.steps.push({
      row: 0,
      col: -1,
      action: 'CHECK',
      board: [...board],
    });

    // 开始回溯
    this.solveNQueens(board, 0);
  }

  /** 回溯算法求解 N 皇后问题 */
  private solveNQueens(board: number[], row: number) {
    const n = board.length;

    // 找到一个解
    if (row === n) {
      const solution = {
        board: [...board],
        id: this.solutions.length + 1,
      };
      this.solutions.push(solution);
      this.steps.push({
        row,
        col: -1,
        action: 'SOLUTION',
        board: [...board],
        isSolution: true,
      });
      return;
    }

    // 尝试在当前行的每一列放置皇后
    for (let col = 0; col < n; col++) {
      // 检查位置 (row, col) 是否可以放置皇后
      const conflicts = this.getConflicts(board, row, col);

      // 添加检查步骤
      this.steps.push({
        row,
        col,
        action: 'CHECK',
        board: [...board],
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      });

      if (conflicts.length === 0) {
        // 放置皇后
        board[row] = col;
        this.steps.push({
          row,
          col,
          action: 'PLACE',
          board: [...board],
        });

        // 递归到下一行
        this.solveNQueens(board, row + 1);

        // 回溯：移除皇后
        board[row] = -1;
        this.steps.push({
          row,
          col,
          action: 'REMOVE',
          board: [...board],
        });
      }
    }
  }

  /** 检查在 (row, col) 放置皇后是否会产生冲突 */
  private getConflicts(board: number[], row: number, col: number): Position[] {
    const conflicts: Position[] = [];

    // 检查之前的行
    for (let i = 0; i < row; i++) {
      if (board[i] === -1) continue; // 没有皇后

      const prevCol = board[i];

      // 同列冲突
      if (prevCol === col) {
        conflicts.push({ row: i, col: prevCol });
      }

      // 对角线冲突
      if (Math.abs(prevCol - col) === Math.abs(i - row)) {
        conflicts.push({ row: i, col: prevCol });
      }
    }

    return conflicts;
  }

  /** 手动清除一个位置的皇后 */
  clearQueen(row: number) {
    const step = this.current$.value;
    if (!step) return;

    const newBoard = [...step.board];
    newBoard[row] = -1;

    // 创建新步骤
    const newStep: BacktrackStep = {
      row,
      col: step.board[row],
      action: 'REMOVE',
      board: newBoard,
    };

    // 插入步骤并更新
    this.steps.splice(this.pointer + 1, 0, newStep);
    this.pointer++;
    this.current$.next(newStep);
    this.updateExplanation();
    this.updateStats();
  }

  /** 手动放置皇后 */
  placeQueen(row: number, col: number) {
    const step = this.current$.value;
    if (!step) return;

    const newBoard = [...step.board];

    // 检查冲突
    const conflicts = this.getConflicts(newBoard, row, col);

    // 添加检查步骤
    const checkStep: BacktrackStep = {
      row,
      col,
      action: 'CHECK',
      board: [...newBoard],
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };

    this.steps.splice(this.pointer + 1, 0, checkStep);
    this.pointer++;
    this.current$.next(checkStep);
    this.updateExplanation();
    this.updateStats();

    // 如果没有冲突，放置皇后
    if (conflicts.length === 0) {
      newBoard[row] = col;
      const placeStep: BacktrackStep = {
        row,
        col,
        action: 'PLACE',
        board: newBoard,
      };

      this.steps.splice(this.pointer + 1, 0, placeStep);
      this.pointer++;
      this.current$.next(placeStep);
      this.updateExplanation();
      this.updateStats();

      // 检查是否找到解
      if (newBoard.every((c) => c !== -1)) {
        const solutionStep: BacktrackStep = {
          row: newBoard.length,
          col: -1,
          action: 'SOLUTION',
          board: [...newBoard],
          isSolution: true,
        };

        this.steps.splice(this.pointer + 1, 0, solutionStep);
        this.pointer++;
        this.current$.next(solutionStep);
        this.updateExplanation();
        this.updateStats();

        // 添加到解决方案列表
        const solution = {
          board: [...newBoard],
          id: this.solutions.length + 1,
        };
        this.solutions.push(solution);
        this.solutions$.next([...this.solutions]);
      }
    }
  }

  /** 随机生成初始局面 */
  generateRandomBoard(size: number, queensCount: number) {
    const board = Array(size).fill(-1);
    let placed = 0;

    // 随机放置不冲突的皇后
    while (placed < queensCount && placed < size) {
      const row = placed; // 按行放置
      const availableCols = [];

      // 找出当前行所有不冲突的列
      for (let col = 0; col < size; col++) {
        if (this.getConflicts(board, row, col).length === 0) {
          availableCols.push(col);
        }
      }

      if (availableCols.length === 0) break;

      // 随机选择一列
      const randomIndex = Math.floor(Math.random() * availableCols.length);
      board[row] = availableCols[randomIndex];
      placed++;
    }

    return board;
  }

  /** 验证当前局面是否合法（无冲突） */
  validateBoard(board: number[]): Position[] {
    const conflicts: Position[] = [];
    const n = board.length;

    for (let i = 0; i < n; i++) {
      if (board[i] === -1) continue;

      for (let j = i + 1; j < n; j++) {
        if (board[j] === -1) continue;

        // 检查同列或对角线冲突
        if (
          board[i] === board[j] || // 同列
          Math.abs(board[i] - board[j]) === Math.abs(i - j) // 对角线
        ) {
          conflicts.push({ row: i, col: board[i] });
          conflicts.push({ row: j, col: board[j] });
        }
      }
    }

    return conflicts;
  }

  /** 检查当前局面是否达成目标（所有皇后都放置且无冲突） */
  isComplete(board: number[]): boolean {
    return (
      board.every((col) => col !== -1) && // 所有皇后都放置
      this.validateBoard(board).length === 0 // 无冲突
    );
  }

  /** 将棋盘导出为JSON */
  exportToJson(board: number[]): string {
    return JSON.stringify({
      size: board.length,
      initialBoard: board,
    });
  }

  /** 解析JSON配置 */
  parseJsonConfig(json: string): QueensConfig | null {
    try {
      const config = JSON.parse(json) as QueensConfig;
      if (typeof config.size !== 'number' || config.size <= 0) {
        return null;
      }

      if (
        config.initialBoard &&
        (!Array.isArray(config.initialBoard) ||
          config.initialBoard.length !== config.size)
      ) {
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

  /** 标准测试用例 */
  get standardTestCases(): { name: string; config: QueensConfig }[] {
    return [
      {
        name: '4皇后',
        config: { size: 4, initialBoard: Array(4).fill(-1) },
      },
      {
        name: '8皇后',
        config: { size: 8, initialBoard: Array(8).fill(-1) },
      },
    ];
  }
}
