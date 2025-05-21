import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DpConfig, DpState, DpStep, Item } from './dp.model';

@Injectable({
  providedIn: 'root',
})
export class DpService {
  // 状态流
  public state$ = new BehaviorSubject<DpState>({
    config: { capacity: 0, items: [] },
    steps: [],
    currentStepIndex: -1,
    optimalPath: [],
    optimalItems: [],
    maxValue: 0,
    isComplete: false,
  });

  // 当前解释
  public currentExplanation$ = new BehaviorSubject<string>('');

  // 当前状态
  public current$ = new BehaviorSubject<DpStep | null>(null);

  // 最优路径
  public optimalPath$ = new BehaviorSubject<[number, number][]>([]);

  // 当前最优值
  public currentBestValue$ = new BehaviorSubject<number>(0);

  // 是否正在自动运行
  private autoRunning = false;
  private autoRunSpeed = 1000; // 毫秒
  private autoRunTimer: any = null;

  // 当前状态的getter
  get currentStep(): DpStep | null {
    return this.current$.value;
  }

  get currentIndex(): number {
    return this.state$.value.currentStepIndex;
  }

  get stepCount(): number {
    return this.state$.value.steps.length;
  }

  get bestValue(): number {
    return this.state$.value.maxValue;
  }

  get optimalItems(): Item[] {
    return this.state$.value.optimalItems;
  }

  get isComplete(): boolean {
    return this.state$.value.isComplete;
  }

  // 初始化背包问题
  init(config: DpConfig): void {
    // 检查并确保配置有效
    if (config.capacity <= 0 || config.items.length === 0) {
      console.error('无效的背包配置');
      return;
    }

    // 重置状态
    this.stopAutoRun();

    const steps: DpStep[] = [];
    const table: number[][] = Array(config.items.length + 1)
      .fill(0)
      .map(() => Array(config.capacity + 1).fill(0));

    // 执行动态规划算法并记录每一步
    for (let i = 1; i <= config.items.length; i++) {
      const item = config.items[i - 1];

      for (let w = 0; w <= config.capacity; w++) {
        if (item.weight > w) {
          // 物品重量超过当前背包容量，不能放入
          table[i][w] = table[i - 1][w];
          steps.push({
            itemIndex: i,
            weightIndex: w,
            table: this.cloneTable(table),
            includeItem: false,
            currentItem: item,
            explanation: `物品${i}（${item.name}，重量${item.weight}，价值${item.value}）的重量超过当前背包容量${w}，不能放入。当前最优值 = ${table[i][w]}。`,
          });
        } else {
          // 比较放入和不放入的价值
          const valueWithout = table[i - 1][w];
          const valueWith = table[i - 1][w - item.weight] + item.value;

          if (valueWith > valueWithout) {
            // 放入物品更优
            table[i][w] = valueWith;
            steps.push({
              itemIndex: i,
              weightIndex: w,
              table: this.cloneTable(table),
              includeItem: true,
              currentItem: item,
              explanation: `放入物品${i}（${item.name}）更优。价值 = ${
                table[i - 1][w - item.weight]
              } + ${
                item.value
              } = ${valueWith} > ${valueWithout}（不放入）。当前最优值 = ${
                table[i][w]
              }。`,
            });
          } else {
            // 不放入物品更优
            table[i][w] = valueWithout;
            steps.push({
              itemIndex: i,
              weightIndex: w,
              table: this.cloneTable(table),
              includeItem: false,
              currentItem: item,
              explanation: `不放入物品${i}（${item.name}）更优。价值 = ${valueWithout} >= ${valueWith}（放入）。当前最优值 = ${table[i][w]}。`,
            });
          }
        }
      }
    }

    // 回溯找到最优解路径
    const optimalPath: [number, number][] = [];
    const optimalItems: Item[] = [];

    let i = config.items.length;
    let w = config.capacity;

    while (i > 0 && w > 0) {
      if (table[i][w] !== table[i - 1][w]) {
        // 当前物品被包含在最优解中
        const item = config.items[i - 1];
        optimalItems.unshift(item);
        optimalPath.push([i, w]);
        w -= item.weight;
      }
      i--;
    }

    // 更新状态
    const maxValue = table[config.items.length][config.capacity];
    this.state$.next({
      config,
      steps,
      currentStepIndex: -1,
      optimalPath,
      optimalItems,
      maxValue,
      isComplete: false,
    });

    this.current$.next(null);
    this.currentExplanation$.next('点击"播放"或"下一步"开始运行算法。');
    this.optimalPath$.next([]);
    this.currentBestValue$.next(0);
  }

  // 运行到下一步
  next(): boolean {
    const state = this.state$.value;
    if (state.currentStepIndex >= state.steps.length - 1) {
      return false;
    }

    const nextIndex = state.currentStepIndex + 1;
    const nextStep = state.steps[nextIndex];

    this.state$.next({
      ...state,
      currentStepIndex: nextIndex,
      isComplete: nextIndex === state.steps.length - 1,
    });

    this.current$.next(nextStep);
    this.currentExplanation$.next(nextStep.explanation);
    this.currentBestValue$.next(
      nextStep.table[nextStep.itemIndex][nextStep.weightIndex]
    );

    // 如果是最后一步，显示最优路径
    if (nextIndex === state.steps.length - 1) {
      this.optimalPath$.next(state.optimalPath);
      this.currentExplanation$.next(
        `算法完成！最优解的价值为${
          state.maxValue
        }，选择的物品为: ${state.optimalItems
          .map((item) => item.name)
          .join('、')}。`
      );
    }

    return true;
  }

  // 回到上一步
  prev(): boolean {
    const state = this.state$.value;
    if (state.currentStepIndex <= 0) {
      return false;
    }

    const prevIndex = state.currentStepIndex - 1;
    const prevStep = state.steps[prevIndex];

    this.state$.next({
      ...state,
      currentStepIndex: prevIndex,
      isComplete: false,
    });

    this.current$.next(prevStep);
    this.currentExplanation$.next(prevStep.explanation);
    this.currentBestValue$.next(
      prevStep.table[prevStep.itemIndex][prevStep.weightIndex]
    );
    this.optimalPath$.next([]);

    return true;
  }

  // 重置到初始状态
  reset(): void {
    this.stopAutoRun();

    const state = this.state$.value;
    this.state$.next({
      ...state,
      currentStepIndex: -1,
      isComplete: false,
    });

    this.current$.next(null);
    this.currentExplanation$.next('点击"播放"或"下一步"开始运行算法。');
    this.optimalPath$.next([]);
    this.currentBestValue$.next(0);
  }

  // 开始自动运行
  startAutoRun(speedMultiplier: number = 1): void {
    if (this.autoRunning) {
      this.stopAutoRun();
    }

    this.autoRunning = true;
    this.autoRunSpeed = 1000 / speedMultiplier;

    this.runNextStep();
  }

  // 停止自动运行
  stopAutoRun(): void {
    this.autoRunning = false;
    if (this.autoRunTimer) {
      clearTimeout(this.autoRunTimer);
      this.autoRunTimer = null;
    }
  }

  // 设置速度
  setSpeed(speedMultiplier: number): void {
    this.autoRunSpeed = 1000 / speedMultiplier;
    if (this.autoRunning) {
      this.stopAutoRun();
      this.startAutoRun(speedMultiplier);
    }
  }

  // 自动运行下一步
  private runNextStep(): void {
    if (!this.autoRunning) return;

    const hasNext = this.next();
    if (hasNext) {
      this.autoRunTimer = setTimeout(
        () => this.runNextStep(),
        this.autoRunSpeed
      );
    } else {
      this.autoRunning = false;
    }
  }

  // 工具方法：深度克隆表格
  private cloneTable(table: number[][]): number[][] {
    return table.map((row) => [...row]);
  }
}
