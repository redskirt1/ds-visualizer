import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueensConfigComponent } from './queens-config.component';
import { QueensControlComponent } from './queens-control.component';
import { QueensBoardComponent } from './queens-board.component';
import { QueensService } from './queens.service';

@Component({
  selector: 'app-backtracking',
  template: `
    <div class="container">
      <h2>回溯算法 - N皇后问题</h2>
      <p class="intro">
        回溯算法是一种通过穷举所有可能情况来找到所有解的算法，如果发现不能通向有效的解，就回溯到上一步，并尝试其他路径。
        N皇后问题是一个经典的回溯算法示例，它要求在N×N的棋盘上放置N个皇后，使得她们互不攻击。
      </p>

      <app-queens-config></app-queens-config>
      <app-queens-control></app-queens-control>
      <app-queens-board></app-queens-board>
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
    QueensConfigComponent,
    QueensControlComponent,
    QueensBoardComponent,
  ],
})
export class BacktrackingComponent implements OnInit {
  constructor(private queensService: QueensService) {}

  ngOnInit() {
    // 初始化八皇后问题（默认8x8棋盘）
    this.queensService.init({
      size: 8,
      initialBoard: Array(8).fill(-1),
    });
  }
}
