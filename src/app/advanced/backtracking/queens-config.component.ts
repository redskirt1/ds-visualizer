import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QueensService } from './queens.service';

@Component({
  standalone: true,
  selector: 'app-queens-config',
  template: `
    <div class="config-panel">
      <h3>配置</h3>
      <div class="settings">
        <div class="form-group">
          <label for="boardSize">棋盘大小 (N):</label>
          <div class="input-with-buttons">
            <button (click)="decreaseSize()" [disabled]="size <= 4">-</button>
            <input
              type="number"
              id="boardSize"
              [(ngModel)]="size"
              min="4"
              max="12"
            />
            <button (click)="increaseSize()" [disabled]="size >= 12">+</button>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" (click)="startEmpty()">空棋盘开始</button>
          <button class="btn" (click)="generateRandom()">随机局面</button>
        </div>

        <div class="form-group">
          <label>标准测试用例:</label>
          <div class="test-cases">
            <button
              *ngFor="let testCase of queensService.standardTestCases"
              class="btn small"
              (click)="loadTestCase(testCase.config)"
            >
              {{ testCase.name }}
            </button>
          </div>
        </div>
      </div>

      <div class="json-config">
        <div class="form-group">
          <label for="jsonConfig">JSON配置:</label>
          <textarea
            id="jsonConfig"
            [(ngModel)]="jsonConfig"
            rows="3"
            placeholder='{"size": 8, "initialBoard": [-1,-1,-1,-1,-1,-1,-1,-1]}'
          ></textarea>
        </div>
        <div class="json-actions">
          <button class="btn small" (click)="exportConfig()">导出当前</button>
          <button class="btn small primary" (click)="importConfig()">
            导入配置
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .config-panel {
        background: white;
        border-radius: 10px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }
      h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #333;
        font-weight: 600;
      }
      .settings {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      label {
        font-weight: 500;
        color: #555;
      }
      .input-with-buttons {
        display: flex;
        align-items: center;
      }
      input[type='number'] {
        width: 60px;
        text-align: center;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }
      .input-with-buttons button {
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
      }
      .input-with-buttons button:hover {
        background: #e0e0e0;
      }
      .input-with-buttons button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-self: flex-end;
      }
      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background: #f0f0f0;
        color: #333;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 120px;
        text-align: center;
      }
      .btn.primary {
        background: #2196f3;
        color: white;
      }
      .btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
      .btn.small {
        padding: 0.3rem 0.75rem;
        font-size: 0.9rem;
        min-width: auto;
      }
      .test-cases {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .json-config {
        padding-top: 1rem;
        border-top: 1px solid #eee;
      }
      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9rem;
      }
      .json-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
    `,
  ],
  imports: [CommonModule, FormsModule],
})
export class QueensConfigComponent implements OnInit {
  size = 8;
  jsonConfig = '';

  constructor(public queensService: QueensService) {}

  ngOnInit() {
    // 默认显示空棋盘JSON
    this.updateJsonConfig(Array(this.size).fill(-1));
  }

  startEmpty() {
    this.queensService.init({
      size: this.size,
      initialBoard: Array(this.size).fill(-1),
    });
  }

  generateRandom() {
    // 随机生成初始局面，最多放置 N/2 个皇后
    const queensCount = Math.floor(Math.random() * (this.size / 2)) + 1;
    const board = this.queensService.generateRandomBoard(
      this.size,
      queensCount
    );
    this.updateJsonConfig(board);
    this.queensService.init({
      size: this.size,
      initialBoard: board,
    });
  }

  loadTestCase(config: { size: number; initialBoard?: number[] }) {
    this.size = config.size;
    this.updateJsonConfig(config.initialBoard || Array(config.size).fill(-1));
    this.queensService.init(config);
  }

  exportConfig() {
    const step = this.queensService.current$.value;
    if (step) {
      this.updateJsonConfig(step.board);
    }
  }

  importConfig() {
    const config = this.queensService.parseJsonConfig(this.jsonConfig);
    if (config) {
      this.size = config.size;
      this.queensService.init(config);
    } else {
      alert('JSON格式无效，请检查配置');
    }
  }

  updateJsonConfig(board: number[]) {
    this.jsonConfig = this.queensService.exportToJson(board);
  }

  increaseSize() {
    if (this.size < 12) {
      this.size++;
      this.updateJsonConfig(Array(this.size).fill(-1));
    }
  }

  decreaseSize() {
    if (this.size > 4) {
      this.size--;
      this.updateJsonConfig(Array(this.size).fill(-1));
    }
  }
}
