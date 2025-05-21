import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DpService } from './dp.service';

@Component({
  selector: 'app-dp-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="control-panel">
      <h3>控制面板</h3>

      <div class="controls">
        <div class="buttons">
          <button
            class="btn reset"
            (click)="reset()"
            [disabled]="dpService.currentIndex < 0"
          >
            重置
          </button>
          <button
            class="btn prev"
            (click)="prev()"
            [disabled]="dpService.currentIndex <= 0"
          >
            上一步
          </button>
          <button
            class="btn play"
            (click)="togglePlay()"
            [disabled]="dpService.isComplete"
          >
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
          <button
            class="btn next"
            (click)="next()"
            [disabled]="dpService.isComplete"
          >
            下一步
          </button>
        </div>

        <div class="slider-container">
          <label for="speed-slider">速度：</label>
          <input
            type="range"
            id="speed-slider"
            [disabled]="!isPlaying"
            min="0"
            max="3"
            step="1"
            [(ngModel)]="speedIndex"
            (ngModelChange)="onSpeedIndexChange()"
          />
          <span class="speed-value">{{ getSpeedMultiplier() }}x</span>
        </div>

        <div class="slider-container history-control">
          <label for="history-slider">历史：</label>
          <input
            type="range"
            id="history-slider"
            [min]="0"
            [max]="dpService.stepCount - 1"
            [step]="1"
            [disabled]="dpService.stepCount === 0 || isPlaying"
            [(ngModel)]="historyIndex"
            (ngModelChange)="onHistoryChange()"
          />
          <span class="step-count">
            {{ historyIndex + 1 || 0 }} / {{ dpService.stepCount || 0 }}
          </span>
        </div>

        <div class="progress">
          <span>进度：</span>
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="getProgressPercentage()"
            ></div>
          </div>
          <span class="step-count">
            {{ dpService.currentIndex + 1 }} / {{ dpService.stepCount }}
          </span>
        </div>
      </div>

      <div class="explanation" *ngIf="dpService.currentStep">
        <p>{{ dpService.currentExplanation$.value }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .control-panel {
        background-color: #f5f5f5;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #333;
      }

      .controls {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .buttons {
        display: flex;
        gap: 0.5rem;
      }

      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.2s;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .reset {
        background-color: #f8d7da;
        color: #721c24;
      }
      .prev {
        background-color: #d1ecf1;
        color: #0c5460;
      }
      .play {
        background-color: #d4edda;
        color: #155724;
      }
      .next {
        background-color: #cce5ff;
        color: #004085;
      }

      .reset:hover:not(:disabled) {
        background-color: #f5c6cb;
      }
      .prev:hover:not(:disabled) {
        background-color: #bee5eb;
      }
      .play:hover:not(:disabled) {
        background-color: #c3e6cb;
      }
      .next:hover:not(:disabled) {
        background-color: #b8daff;
      }

      .slider-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .history-control {
        margin-top: 0.5rem;
      }

      input[type='range'] {
        flex: 1;
        max-width: 200px;
      }

      .speed-value {
        min-width: 2rem;
        text-align: center;
      }

      .progress {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .progress-bar {
        flex: 1;
        height: 8px;
        background-color: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background-color: #007bff;
        transition: width 0.3s ease;
      }

      .step-count {
        min-width: 4rem;
        text-align: right;
      }

      .explanation {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #fff;
        border-radius: 4px;
        border-left: 4px solid #007bff;
      }

      .explanation p {
        margin: 0;
        line-height: 1.5;
      }
    `,
  ],
})
export class DpControlComponent implements OnInit {
  isPlaying = false;
  speedIndex = 1; // 默认1x (索引1)
  historyIndex = 0;

  // 速度倍率选项
  private readonly speedOptions = [0.5, 1, 2, 4];

  constructor(public dpService: DpService) {}

  ngOnInit() {
    // 监听当前步骤变化，更新历史滑动条
    this.dpService.current$.subscribe((step) => {
      if (step) {
        this.historyIndex = this.dpService.currentIndex;
      }
    });
  }

  // 重置动画
  reset(): void {
    this.isPlaying = false;
    this.historyIndex = 0;
    this.dpService.reset();
  }

  // 上一步
  prev(): void {
    this.isPlaying = false;
    this.dpService.stopAutoRun();
    this.dpService.prev();
  }

  // 下一步
  next(): void {
    this.isPlaying = false;
    this.dpService.stopAutoRun();
    this.dpService.next();
  }

  // 切换播放/暂停
  togglePlay(): void {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.dpService.startAutoRun(this.getSpeedMultiplier());
    } else {
      this.dpService.stopAutoRun();
    }
  }

  // 获取当前速度倍率
  getSpeedMultiplier(): number {
    return this.speedOptions[this.speedIndex];
  }

  // 速度索引变化处理
  onSpeedIndexChange(): void {
    const speed = this.getSpeedMultiplier();
    this.dpService.setSpeed(speed);
  }

  // 历史滑动条变化处理
  onHistoryChange(): void {
    if (this.isPlaying) {
      this.dpService.stopAutoRun();
      this.isPlaying = false;
    }

    // 跳转到指定步骤
    const targetIndex = this.historyIndex;
    const currentIndex = this.dpService.currentIndex;

    if (targetIndex !== currentIndex) {
      if (targetIndex < currentIndex) {
        // 需要先重置，然后逐步前进到目标步骤
        this.dpService.reset();
        this.stepToIndex(targetIndex);
      } else {
        // 可以直接前进到目标步骤
        this.stepToIndex(targetIndex);
      }
    }
  }

  // 逐步执行到指定索引
  private stepToIndex(targetIndex: number): void {
    let current = this.dpService.currentIndex;
    while (current < targetIndex) {
      this.dpService.next();
      current = this.dpService.currentIndex;
    }
  }

  // 计算进度百分比
  getProgressPercentage(): number {
    if (this.dpService.stepCount === 0) return 0;
    return ((this.dpService.currentIndex + 1) / this.dpService.stepCount) * 100;
  }
}
