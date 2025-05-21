import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BigIntConfigComponent } from './bigint-config.component';
import { BigIntControlComponent } from './bigint-control.component';
import { RecursiveTreeComponent } from './recursive-tree.component';
import { BigIntMultiplyService } from './bigint-multiply.service';

@Component({
  selector: 'app-divide-conquer',
  template: `
    <div class="container">
      <h2>分治算法 - 大整数乘法</h2>
      <p class="intro">
        分治算法的核心思想是将一个复杂问题分解为若干个规模较小但结构与原问题相似的子问题，
        递归地求解这些子问题，然后将子问题的解组合得到原问题的解。
        大整数乘法是分治算法的典型应用之一，采用Karatsuba算法可以将时间复杂度从O(n²)降低到O(n^log₂3)。
      </p>

      <app-bigint-config></app-bigint-config>
      <app-bigint-control></app-bigint-control>
      <app-recursive-tree></app-recursive-tree>
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
    BigIntConfigComponent,
    BigIntControlComponent,
    RecursiveTreeComponent,
  ],
})
export class DivideConquerComponent implements OnInit {
  constructor(private bigIntService: BigIntMultiplyService) {}

  ngOnInit() {
    // 初始化为简单示例
    this.bigIntService.init({
      num1: '123',
      num2: '456',
      threshold: 2,
    });
  }
}
