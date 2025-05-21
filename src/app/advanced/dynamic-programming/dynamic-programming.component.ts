import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DpConfigComponent } from './dp-config.component';
import { DpControlComponent } from './dp-control.component';
import { DpTableComponent } from './dp-table.component';
import { DpService } from './dp.service';

@Component({
  selector: 'app-dynamic-programming',
  template: `
    <div class="container">
      <h2>动态规划 - 0/1背包问题</h2>
      <p class="intro">
        动态规划是一种通过将复杂问题分解为更简单的子问题来解决问题的方法。
        0/1背包问题是动态规划的经典应用，它要求在给定容量的背包中，选择物品使得总价值最大。
      </p>

      <app-dp-config></app-dp-config>
      <app-dp-control></app-dp-control>
      <app-dp-table></app-dp-table>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
      h2 {
        color: #333;
        margin-bottom: 1rem;
      }
      .intro {
        margin-bottom: 2rem;
        line-height: 1.6;
        color: #555;
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    DpConfigComponent,
    DpControlComponent,
    DpTableComponent,
  ],
})
export class DynamicProgrammingComponent implements OnInit {
  constructor(private dpService: DpService) {}

  ngOnInit() {
    // 初始化背包问题
    this.dpService.init({
      capacity: 10,
      items: [
        { name: '物品1', weight: 2, value: 6 },
        { name: '物品2', weight: 3, value: 8 },
        { name: '物品3', weight: 4, value: 12 },
        { name: '物品4', weight: 5, value: 15 },
      ],
    });
  }
}
