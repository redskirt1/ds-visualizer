import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueensService } from './queens.service';
import { BacktrackStep, Position } from './queens.model';

@Component({
  standalone: true,
  selector: 'app-queens-board',
  template: `
    <div class="board-container" [style.--size]="boardSize()">
      <div class="board">
        <div *ngFor="let row of rows(); let i = index" class="row">
          <div
            *ngFor="let col of cols(); let j = index"
            class="cell"
            [class.dark]="(i + j) % 2 === 1"
            [class.current]="isCurrentPosition(i, j)"
            [class.conflict]="isConflict(i, j)"
            [class.queen]="hasQueen(i, j)"
            (click)="cellClick(i, j)"
          >
            <div class="queen-icon" *ngIf="hasQueen(i, j)">♕</div>
          </div>
        </div>
      </div>

      <div class="column-labels">
        <div *ngFor="let col of cols(); let j = index" class="label">
          {{ j + 1 }}
        </div>
      </div>

      <div class="row-labels">
        <div *ngFor="let row of rows(); let i = index" class="label">
          {{ i + 1 }}
        </div>
      </div>
    </div>

    <div class="solutions-container" *ngIf="solutions().length > 0">
      <h3>找到的解 ({{ solutions().length }})</h3>
      <div class="solutions">
        <div
          *ngFor="let solution of solutions(); let i = index"
          class="solution-card"
          [class.active]="i === activeSolution()"
          (click)="showSolution(i)"
        >
          <div class="solution-icon">♕</div>
          <div class="solution-content">
            <span class="solution-label">解 #{{ solution.id }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .board-container {
        position: relative;
        --size: 8;
        --cell-size: min(calc((100vw - 40px) / var(--size) / 1.5), 60px);
        padding-left: 30px;
        padding-top: 30px;
        margin-bottom: 2rem;
      }
      .board {
        display: grid;
        grid-template-rows: repeat(var(--size), var(--cell-size));
        grid-template-columns: repeat(var(--size), var(--cell-size));
        border: 3px solid #333;
        border-radius: 4px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        width: fit-content;
      }
      .row {
        display: contents;
      }
      .cell {
        display: flex;
        justify-content: center;
        align-items: center;
        width: var(--cell-size);
        height: var(--cell-size);
        background: #f5f3e6;
        transition: all 0.3s ease;
        position: relative;
        cursor: pointer;
      }
      .cell.dark {
        background: #b58863;
      }
      .cell.current {
        background: rgba(255, 193, 7, 0.7);
        animation: pulse 1.5s infinite;
      }
      .cell.queen.dark {
        background: #6e8046;
      }
      .cell.queen:not(.dark) {
        background: #c9e2a5;
      }
      .cell.conflict {
        background: rgba(244, 67, 54, 0.7);
      }
      .cell:hover:not(.queen):not(.current):not(.conflict) {
        background-color: rgba(33, 150, 243, 0.3);
      }
      .queen-icon {
        font-size: calc(var(--cell-size) * 0.7);
        color: #333;
        animation: fadeIn 0.5s ease;
      }
      .column-labels,
      .row-labels {
        display: flex;
        position: absolute;
      }
      .column-labels {
        top: 0;
        left: 30px;
        right: 0;
      }
      .row-labels {
        top: 30px;
        left: 0;
        bottom: 0;
        flex-direction: column;
      }
      .label {
        width: var(--cell-size);
        height: var(--cell-size);
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        color: #555;
      }
      @keyframes pulse {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
        100% {
          transform: scale(1);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.8) translateY(10px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      .solutions-container {
        margin-top: 2rem;
        background: white;
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }
      h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        color: #333;
      }
      .solutions {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .solution-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: #f5f5f5;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .solution-card:hover {
        background: #e3f2fd;
        transform: translateY(-2px);
      }
      .solution-card.active {
        background: #2196f3;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(33, 150, 243, 0.2);
      }
      .solution-icon {
        font-size: 1.5rem;
      }
      .solution-content {
        display: flex;
        flex-direction: column;
      }
      .solution-label {
        font-weight: 500;
      }
    `,
  ],
  imports: [CommonModule],
})
export class QueensBoardComponent {
  currentStep = signal<BacktrackStep | null>(null);
  solutions = signal<{ id: number; board: number[] }[]>([]);
  activeSolution = signal(-1);

  boardSize = computed(() => {
    const step = this.currentStep();
    return step ? step.board.length : 8;
  });

  rows = computed(() => {
    return Array.from({ length: this.boardSize() }, (_, i) => i);
  });

  cols = computed(() => {
    return Array.from({ length: this.boardSize() }, (_, i) => i);
  });

  constructor(private queensService: QueensService) {
    this.queensService.current$.subscribe((step) => {
      this.currentStep.set(step);
      this.activeSolution.set(-1); // 重置激活的解
    });

    this.queensService.solutions$.subscribe((solutions) => {
      this.solutions.set(solutions);
    });
  }

  hasQueen(row: number, col: number): boolean {
    const step = this.currentStep();
    if (!step) return false;
    return step.board[row] === col;
  }

  isCurrentPosition(row: number, col: number): boolean {
    const step = this.currentStep();
    if (!step) return false;
    return step.row === row && step.col === col;
  }

  isConflict(row: number, col: number): boolean {
    const step = this.currentStep();
    if (!step || !step.conflicts) return false;
    return step.conflicts.some((pos) => pos.row === row && pos.col === col);
  }

  cellClick(row: number, col: number) {
    const step = this.currentStep();
    if (!step) return;

    // 如果已经有皇后，移除它
    if (step.board[row] === col) {
      this.queensService.clearQueen(row);
    } else {
      // 否则尝试放置皇后
      this.queensService.placeQueen(row, col);
    }
  }

  showSolution(index: number) {
    if (index < 0 || index >= this.solutions().length) return;

    this.activeSolution.set(index);

    // 创建一个新步骤来显示解
    const solution = this.solutions()[index];
    const step: BacktrackStep = {
      row: -1,
      col: -1,
      action: 'SOLUTION',
      board: [...solution.board],
      isSolution: true,
    };

    // 添加步骤到服务中
    this.queensService.current$.next(step);
  }
}
