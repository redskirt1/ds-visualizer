import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DpService } from './dp.service';
import { DpConfig, Item } from './dp.model';

@Component({
  selector: 'app-dp-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-panel">
      <h3>配置</h3>

      <div class="config-section">
        <label>背包容量：</label>
        <input
          type="number"
          min="1"
          max="20"
          [(ngModel)]="capacity"
          (change)="updateCapacity()"
        />
      </div>

      <div class="config-section">
        <h4>物品列表</h4>

        <div class="items-table">
          <table>
            <thead>
              <tr>
                <th>物品名称</th>
                <th>重量</th>
                <th>价值</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items; let i = index">
                <td>
                  <input
                    type="text"
                    [(ngModel)]="item.name"
                    (change)="updateConfig()"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    [(ngModel)]="item.weight"
                    (change)="updateConfig()"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    [(ngModel)]="item.value"
                    (change)="updateConfig()"
                  />
                </td>
                <td>
                  <button class="btn-remove" (click)="removeItem(i)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="buttons">
          <button class="btn-add" (click)="addItem()">添加物品</button>
          <button class="btn-random" (click)="generateRandom()">
            随机生成
          </button>
        </div>
      </div>

      <div class="config-section">
        <button class="btn-apply" (click)="applyConfig()">应用配置</button>
      </div>
    </div>
  `,
  styles: [
    `
      .config-panel {
        background-color: #f5f5f5;
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

      h4 {
        margin-bottom: 0.5rem;
      }

      .config-section {
        margin-bottom: 1.5rem;
      }

      .config-section:last-child {
        margin-bottom: 0;
      }

      input[type='number'],
      input[type='text'] {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 5rem;
      }

      input[type='text'] {
        width: 8rem;
      }

      .items-table {
        margin-bottom: 1rem;
        max-height: 300px;
        overflow-y: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }

      th {
        background-color: #f0f0f0;
        font-weight: bold;
      }

      .buttons {
        display: flex;
        gap: 0.5rem;
      }

      button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.2s;
      }

      .btn-add {
        background-color: #d4edda;
        color: #155724;
      }

      .btn-random {
        background-color: #d1ecf1;
        color: #0c5460;
      }

      .btn-apply {
        background-color: #cce5ff;
        color: #004085;
        padding: 0.75rem 1.5rem;
      }

      .btn-remove {
        background-color: #f8d7da;
        color: #721c24;
        padding: 0.35rem 0.75rem;
      }

      .btn-add:hover {
        background-color: #c3e6cb;
      }
      .btn-random:hover {
        background-color: #bee5eb;
      }
      .btn-apply:hover {
        background-color: #b8daff;
      }
      .btn-remove:hover {
        background-color: #f5c6cb;
      }
    `,
  ],
})
export class DpConfigComponent {
  capacity: number = 10;
  items: Item[] = [
    { name: '物品1', weight: 2, value: 6 },
    { name: '物品2', weight: 3, value: 8 },
    { name: '物品3', weight: 4, value: 12 },
    { name: '物品4', weight: 5, value: 15 },
  ];

  constructor(private dpService: DpService) {}

  // 更新背包容量
  updateCapacity(): void {
    if (this.capacity < 1) {
      this.capacity = 1;
    } else if (this.capacity > 20) {
      this.capacity = 20;
    }
  }

  // 添加新物品
  addItem(): void {
    const newItemId = this.items.length + 1;
    this.items.push({
      name: `物品${newItemId}`,
      weight: Math.min(Math.floor(Math.random() * 5) + 1, this.capacity),
      value: Math.floor(Math.random() * 10) + 5,
    });
  }

  // 移除物品
  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
      this.updateConfig();
    }
  }

  // 随机生成物品
  generateRandom(): void {
    const itemCount = Math.floor(Math.random() * 5) + 3; // 3-7个物品

    this.items = [];
    for (let i = 0; i < itemCount; i++) {
      this.items.push({
        name: `物品${i + 1}`,
        weight: Math.min(Math.floor(Math.random() * 5) + 1, this.capacity),
        value: Math.floor(Math.random() * 10) + 5,
      });
    }

    this.updateConfig();
  }

  // 更新配置
  updateConfig(): void {
    // 移除无效物品
    this.items = this.items.filter((item) => item.weight > 0 && item.value > 0);

    // 确保至少有一个物品
    if (this.items.length === 0) {
      this.items.push({ name: '物品1', weight: 1, value: 5 });
    }
  }

  // 应用配置
  applyConfig(): void {
    this.updateConfig();

    const config: DpConfig = {
      capacity: this.capacity,
      items: [...this.items],
    };

    this.dpService.init(config);
  }
}
