import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DpService } from './dp.service';
import { DpStep } from './dp.model';

@Component({
  selector: 'app-dp-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dp-table-container">
      <h3>动态规划表格可视化</h3>

      <div class="dp-table-wrapper" *ngIf="dpService.currentStep">
        <table class="dp-table">
          <thead>
            <tr>
              <th class="header">物品 / 重量</th>
              <ng-container *ngFor="let w of weightArray">
                <th class="header">{{ w }}</th>
              </ng-container>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of tableData; let i = index">
              <td class="item-cell">
                <div *ngIf="i > 0" class="item-info">
                  <div class="item-name">{{ getItemName(i - 1) }}</div>
                  <div class="item-details">
                    重量: {{ getItemWeight(i - 1) }}, 价值:
                    {{ getItemValue(i - 1) }}
                  </div>
                </div>
                <div *ngIf="i === 0" class="base-case">基础情况</div>
              </td>
              <ng-container *ngFor="let cell of row; let j = index">
                <td
                  [class.cell]="true"
                  [class.highlight]="isCurrentCell(i, j)"
                  [class.optimal-path]="isInOptimalPath(i, j)"
                >
                  {{ cell }}
                </td>
              </ng-container>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="legend" *ngIf="dpService.currentStep">
        <div class="legend-item">
          <div class="legend-color highlight"></div>
          <div class="legend-text">当前计算的单元格</div>
        </div>
        <div class="legend-item">
          <div class="legend-color optimal-path"></div>
          <div class="legend-text">最优解路径</div>
        </div>
      </div>

      <div class="info-panel" *ngIf="dpService.isComplete">
        <h4>最优解信息</h4>
        <p>
          最大价值: <strong>{{ dpService.bestValue }}</strong>
        </p>
        <p>选择的物品:</p>
        <ul>
          <li *ngFor="let item of dpService.optimalItems">
            {{ item.name }} (重量: {{ item.weight }}, 价值: {{ item.value }})
          </li>
        </ul>
      </div>

      <div class="empty-state" *ngIf="!dpService.currentStep">
        <p>点击"应用配置"和"播放"开始运行算法。</p>
      </div>
    </div>
  `,
  styles: [
    `
      .dp-table-container {
        background-color: #fff;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h3,
      h4 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #333;
      }

      .dp-table-wrapper {
        overflow-x: auto;
        margin-bottom: 1.5rem;
      }

      .dp-table {
        border-collapse: collapse;
        width: 100%;
        min-width: 500px;
      }

      .header {
        background-color: #f0f0f0;
        padding: 0.75rem;
        text-align: center;
        font-weight: bold;
        border: 1px solid #ddd;
      }

      .item-cell {
        background-color: #f0f0f0;
        padding: 0.75rem;
        font-weight: bold;
        border: 1px solid #ddd;
        min-width: 150px;
      }

      .item-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .item-name {
        font-weight: bold;
      }

      .item-details {
        font-size: 0.8rem;
        font-weight: normal;
        color: #666;
      }

      .base-case {
        font-style: italic;
        color: #666;
      }

      .cell {
        padding: 0.75rem;
        text-align: center;
        border: 1px solid #ddd;
        min-width: 3rem;
      }

      .highlight {
        background-color: #fff3cd;
        animation: pulse 1.5s infinite;
      }

      .optimal-path {
        background-color: #d4edda;
      }

      .highlight.optimal-path {
        background-color: #ffeeba;
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0% {
          background-color: rgba(255, 243, 205, 0.5);
        }
        50% {
          background-color: rgba(255, 243, 205, 1);
        }
        100% {
          background-color: rgba(255, 243, 205, 0.5);
        }
      }

      .legend {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .legend-color {
        width: 1rem;
        height: 1rem;
        border: 1px solid #ddd;
      }

      .legend-text {
        font-size: 0.875rem;
      }

      .info-panel {
        background-color: #f8f9fa;
        border-radius: 4px;
        padding: 1rem;
        margin-top: 1.5rem;
      }

      .info-panel p {
        margin: 0.5rem 0;
      }

      .info-panel h4 {
        margin-top: 0;
        margin-bottom: 0.5rem;
      }

      .info-panel ul {
        margin-top: 0.5rem;
        padding-left: 1.5rem;
      }

      .empty-state {
        padding: 2rem;
        text-align: center;
        color: #6c757d;
        border: 1px dashed #dee2e6;
        border-radius: 4px;
      }
    `,
  ],
})
export class DpTableComponent implements OnChanges {
  tableData: number[][] = [];
  weightArray: number[] = [];
  optimalPath: [number, number][] = [];

  constructor(public dpService: DpService) {
    // 订阅当前步骤变化
    this.dpService.current$.subscribe((step) => {
      if (step) {
        this.tableData = step.table;
        this.updateWeightArray();
      }
    });

    // 订阅最优路径变化
    this.dpService.optimalPath$.subscribe((path) => {
      this.optimalPath = path;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.dpService.currentStep) {
      this.tableData = this.dpService.currentStep.table;
      this.updateWeightArray();
    }
  }

  // 更新重量数组
  private updateWeightArray(): void {
    if (this.tableData && this.tableData.length > 0) {
      this.weightArray = Array.from(
        { length: this.tableData[0].length },
        (_, i) => i
      );
    }
  }

  // 获取物品名称
  getItemName(index: number): string {
    const state = this.dpService.state$.value;
    if (
      state &&
      state.config &&
      state.config.items &&
      state.config.items[index]
    ) {
      return state.config.items[index].name;
    }
    return `物品${index + 1}`;
  }

  // 获取物品重量
  getItemWeight(index: number): number {
    const state = this.dpService.state$.value;
    if (
      state &&
      state.config &&
      state.config.items &&
      state.config.items[index]
    ) {
      return state.config.items[index].weight;
    }
    return 0;
  }

  // 获取物品价值
  getItemValue(index: number): number {
    const state = this.dpService.state$.value;
    if (
      state &&
      state.config &&
      state.config.items &&
      state.config.items[index]
    ) {
      return state.config.items[index].value;
    }
    return 0;
  }

  // 判断是否是当前单元格
  isCurrentCell(i: number, j: number): boolean {
    const step = this.dpService.currentStep;
    if (!step) return false;

    return i === step.itemIndex && j === step.weightIndex;
  }

  // 判断是否在最优路径中
  isInOptimalPath(i: number, j: number): boolean {
    return this.optimalPath.some(([row, col]) => row === i && col === j);
  }
}
