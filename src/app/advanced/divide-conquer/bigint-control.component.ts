import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BigIntMultiplyService } from './bigint-multiply.service';
import { DivideConquerStats, DivideConquerStep } from './bigint-multiply.model';
import { computed, signal } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-bigint-control',
  template: `
    <div class="control-panel">
      <h3>控制面板</h3>

      <div class="controls">
        <div class="buttons">
          <button
            class="btn reset"
            (click)="reset()"
            [disabled]="currentStep() === 0"
          >
            重置
          </button>
          <button
            class="btn prev"
            (click)="prevStep()"
            [disabled]="currentStep() <= 0"
          >
            上一步
          </button>
          <button
            class="btn play"
            (click)="togglePlay()"
            [disabled]="isAtEnd()"
          >
            {{ playing() ? '暂停' : '播放' }}
          </button>
          <button class="btn next" (click)="step()" [disabled]="isAtEnd()">
            下一步
          </button>
        </div>

        <div class="slider-container">
          <label for="speed-slider">速度：</label>
          <input
            type="range"
            id="speed-slider"
            [disabled]="!playing()"
            min="0"
            max="3"
            step="1"
            [value]="speedIndex()"
            (input)="updateSpeed($event)"
          />
          <span class="speed-value">{{ speedMultiplier() }}x</span>
        </div>

        <div class="slider-container history-control">
          <label for="history-slider">历史：</label>
          <input
            type="range"
            id="history-slider"
            [min]="0"
            [max]="bigIntService.stepCount - 1"
            [step]="1"
            [disabled]="bigIntService.stepCount === 0 || playing()"
            [value]="currentStep()"
            (input)="seek($event)"
          />
          <span class="step-count">
            {{ currentStep() + 1 }} / {{ bigIntService.stepCount }}
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
            {{ currentStep() + 1 }} / {{ bigIntService.stepCount }}
          </span>
        </div>
      </div>
    </div>

    <div class="stats-panel">
      <div class="stat-card" [class.highlight]="stats().depth > 0">
        <div class="stat-icon">🔍</div>
        <div class="stat-content">
          <span class="label">当前递归深度</span>
          <span class="value">{{ stats().depth }}</span>
          <span class="sublabel">最大深度: {{ stats().maxDepth }}</span>
        </div>
      </div>

      <div class="stat-card" [class.highlight]="stats().divideCount > 0">
        <div class="stat-icon">✂️</div>
        <div class="stat-content">
          <span class="label">分割次数</span>
          <span class="value">{{ stats().divideCount }}</span>
        </div>
      </div>

      <div class="stat-card" [class.highlight]="stats().combineCount > 0">
        <div class="stat-icon">🔄</div>
        <div class="stat-content">
          <span class="label">合并次数</span>
          <span class="value">{{ stats().combineCount }}</span>
        </div>
      </div>

      <div class="stat-card" [class.highlight]="stats().baseCaseCount > 0">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <span class="label">基本情况</span>
          <span class="value">{{ stats().baseCaseCount }}</span>
        </div>
      </div>
    </div>

    <div class="explanation" *ngIf="bigIntService.current$.value?.explanation">
      <p>{{ bigIntService.current$.value?.explanation }}</p>
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

      .stats-panel {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .stat-card {
        flex: 1;
        min-width: 200px;
        background: white;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }

      .stat-card.highlight {
        background: #e3f2fd;
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(33, 150, 243, 0.15);
      }

      .stat-icon {
        font-size: 1.5rem;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f5f5;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .label {
        color: #666;
        font-size: 0.9em;
      }

      .value {
        font-weight: bold;
        color: #007bff;
        font-size: 1.2em;
      }

      .sublabel {
        color: #888;
        font-size: 0.8em;
      }

      .explanation {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #fff;
        border-radius: 4px;
        border-left: 4px solid #007bff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .explanation p {
        margin: 0;
        line-height: 1.5;
        white-space: pre-line;
      }
    `,
  ],
  imports: [CommonModule, FormsModule],
})
export class BigIntControlComponent implements OnInit {
  playing = signal(false);
  currentStep = signal(0);
  maxSteps = signal(0);
  speedIndex = signal(1); // 默认1x
  stats = signal<DivideConquerStats>({
    depth: 0,
    maxDepth: 0,
    divideCount: 0,
    combineCount: 0,
    baseCaseCount: 0,
    stepIndex: 0,
    totalSteps: 0,
  });

  speedMultiplier = computed(() => {
    const speeds = [0.5, 1, 2, 4];
    return speeds[this.speedIndex()];
  });

  constructor(public bigIntService: BigIntMultiplyService) {}

  ngOnInit() {
    // 初始化和订阅服务的状态变化
    this.maxSteps.set(this.bigIntService.stepCount - 1);

    this.bigIntService.current$.subscribe(() => {
      this.currentStep.set(this.bigIntService.currentIndex);
      this.maxSteps.set(this.bigIntService.stepCount - 1);
    });

    this.bigIntService.stats$.subscribe((stats) => {
      this.stats.set(stats);
    });
  }

  step() {
    this.bigIntService.step();
  }

  prevStep() {
    if (this.currentStep() > 0) {
      this.bigIntService.goto(this.currentStep() - 1);
    }
  }

  togglePlay() {
    if (this.playing()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.playing.set(true);
    // 更新服务速度然后播放
    this.bigIntService.speed$.next(800 / this.speedMultiplier());
    this.bigIntService.play();
  }

  pause() {
    this.playing.set(false);
    this.bigIntService.pause();
  }

  reset() {
    this.playing.set(false);
    this.bigIntService.pause();
    this.bigIntService.goto(0);
  }

  updateSpeed(ev: Event) {
    const val = +(ev.target as HTMLInputElement).value;
    this.speedIndex.set(val);

    // 更新服务速度
    this.bigIntService.speed$.next(800 / this.speedMultiplier());

    if (this.playing()) {
      this.bigIntService.pause();
      this.bigIntService.play();
    }
  }

  seek(ev: Event) {
    const val = +(ev.target as HTMLInputElement).value;
    this.bigIntService.goto(val);
  }

  isAtEnd() {
    return this.currentStep() >= this.maxSteps();
  }

  getProgressPercentage(): number {
    if (this.bigIntService.stepCount === 0) return 0;
    return ((this.currentStep() + 1) / this.bigIntService.stepCount) * 100;
  }
}
 