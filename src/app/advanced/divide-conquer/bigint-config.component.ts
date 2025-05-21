import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BigIntMultiplyService } from './bigint-multiply.service';

@Component({
  standalone: true,
  selector: 'app-bigint-config',
  template: `
    <div class="config-panel">
      <h3>配置</h3>
      <div class="settings">
        <div class="input-groups">
          <div class="form-group">
            <label for="num1">第一个大整数</label>
            <input
              type="text"
              id="num1"
              [(ngModel)]="num1"
              placeholder="输入非负整数"
              pattern="[0-9]+"
            />
          </div>

          <div class="form-group">
            <label for="num2">第二个大整数</label>
            <input
              type="text"
              id="num2"
              [(ngModel)]="num2"
              placeholder="输入非负整数"
              pattern="[0-9]+"
            />
          </div>

          <div class="form-group slider">
            <label for="threshold">
              分割阈值 (小于此位数不再分割): {{ threshold }}
            </label>
            <div class="range-with-value">
              <input
                type="range"
                id="threshold"
                [(ngModel)]="threshold"
                min="1"
                max="10"
                step="1"
              />
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn primary" (click)="startCalculation()">
            开始计算
          </button>
          <button class="btn" (click)="generateRandom()">随机整数</button>
        </div>

        <div class="test-cases">
          <label>标准测试用例:</label>
          <div class="case-buttons">
            <button
              *ngFor="let testCase of bigIntService.standardTestCases"
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
            rows="5"
            placeholder='{"num1": "123", "num2": "456", "threshold": 2}'
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
        margin-bottom: 1.5rem;
      }
      .input-groups {
        flex: 2;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .actions {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-self: flex-start;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .form-group.slider {
        margin-top: 0.5rem;
      }
      label {
        font-weight: 500;
        color: #555;
      }
      input[type='text'] {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
        width: 100%;
      }
      .range-with-value {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      input[type='range'] {
        flex: 1;
      }
      .btn {
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 6px;
        background: #f0f0f0;
        color: #333;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
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
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
      }
      .test-cases {
        flex-basis: 100%;
        margin-top: 1rem;
      }
      .case-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .json-config {
        border-top: 1px solid #eee;
        padding-top: 1.5rem;
      }
      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 6px;
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
export class BigIntConfigComponent implements OnInit {
  num1 = '123';
  num2 = '456';
  threshold = 2;
  jsonConfig = '';

  constructor(public bigIntService: BigIntMultiplyService) {}

  ngOnInit() {
    this.updateJsonConfig();
  }

  startCalculation() {
    if (!this.validateInputs()) {
      alert('请输入有效的非负整数!');
      return;
    }

    this.bigIntService.init({
      num1: this.num1,
      num2: this.num2,
      threshold: this.threshold,
    });
  }

  generateRandom() {
    // 随机生成两个大整数，位数在4~10之间
    const digits1 = Math.floor(Math.random() * 7) + 4;
    const digits2 = Math.floor(Math.random() * 7) + 4;

    this.num1 = this.bigIntService.generateRandomBigInt(digits1);
    this.num2 = this.bigIntService.generateRandomBigInt(digits2);
    this.updateJsonConfig();
  }

  loadTestCase(config: { num1: string; num2: string; threshold: number }) {
    this.num1 = config.num1;
    this.num2 = config.num2;
    this.threshold = config.threshold;
    this.updateJsonConfig();
    this.startCalculation();
  }

  exportConfig() {
    this.updateJsonConfig();
  }

  importConfig() {
    const config = this.bigIntService.parseJsonConfig(this.jsonConfig);
    if (config) {
      this.num1 = config.num1;
      this.num2 = config.num2;
      this.threshold = config.threshold;
      this.startCalculation();
    } else {
      alert('JSON格式无效，请检查配置');
    }
  }

  private updateJsonConfig() {
    this.jsonConfig = this.bigIntService.exportToJson({
      num1: this.num1,
      num2: this.num2,
      threshold: this.threshold,
    });
  }

  private validateInputs(): boolean {
    const numRegex = /^\d+$/;
    return (
      numRegex.test(this.num1) &&
      numRegex.test(this.num2) &&
      this.num1 !== '0' &&
      this.num2 !== '0' &&
      this.threshold >= 1
    );
  }
}
