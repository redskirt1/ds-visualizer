import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BigIntMultiplyService } from './bigint-multiply.service';
import { TreeNode } from './bigint-multiply.model';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-node-container">
      <div
        class="tree-node"
        [class.active]="node.id === activeNodeId"
        [class.completed]="node.completed"
      >
        <div class="node-content">
          <div class="node-header">
            <span class="node-depth">深度: {{ node.depth }}</span>
            <span class="node-id">{{ node.id }}</span>
          </div>
          <div class="node-problem">
            {{ formatProblem(node.problem) }}
          </div>
          <div class="node-result" *ngIf="node.result">
            结果: {{ truncateResult(node.result) }}
          </div>
        </div>
      </div>
    </div>

    <div class="tree-children" *ngIf="node.children.length > 0">
      <div
        *ngFor="let child of node.children"
        class="tree-branch"
        [style.width.%]="100 / node.children.length"
      >
        <div class="branch-line"></div>
        <app-tree-node
          [node]="child"
          [activeNodeId]="activeNodeId"
        ></app-tree-node>
      </div>
    </div>
  `,
  styles: [
    `
      .tree-node-container {
        display: flex;
        justify-content: center;
        width: 100%;
        margin-bottom: 1rem;
      }

      .tree-node {
        border: 2px solid #ddd;
        border-radius: 8px;
        padding: 0.75rem;
        background: #f9f9f9;
        min-width: 200px;
        transition: all 0.3s ease;
      }

      .tree-node.active {
        border-color: #2196f3;
        background: #e3f2fd;
        box-shadow: 0 0 15px rgba(33, 150, 243, 0.3);
        transform: scale(1.05);
      }

      .tree-node.completed {
        border-color: #4caf50;
        background: #e8f5e9;
      }

      .node-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .node-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.8em;
        color: #888;
      }

      .node-problem {
        font-weight: 500;
        color: #333;
        word-break: break-all;
      }

      .node-result {
        font-weight: 600;
        color: #2196f3;
        word-break: break-all;
      }

      .tree-children {
        display: flex;
        width: 100%;
      }

      .tree-branch {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .branch-line {
        width: 2px;
        height: 30px;
        background: #ddd;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class TreeNodeComponent {
  @Input() node!: TreeNode;
  @Input() activeNodeId!: string;

  formatProblem(problem: { a: string; b: string }): string {
    return `${this.truncate(problem.a)} × ${this.truncate(problem.b)}`;
  }

  truncate(str: string, maxLength: number = 12): string {
    if (str.length <= maxLength) return str;
    const halfLength = Math.floor(maxLength / 2);
    return `${str.substring(0, halfLength)}...${str.substring(
      str.length - halfLength
    )}`;
  }

  truncateResult(result: string): string {
    return this.truncate(result, 20);
  }
}

@Component({
  standalone: true,
  selector: 'app-recursive-tree',
  template: `
    <div class="tree-container">
      <h3>递归调用树</h3>
      <div class="tree-wrapper" *ngIf="currentTree()">
        <div class="recursive-tree">
          <div class="tree-node-container">
            <div
              class="tree-node"
              [class.active]="isActiveNode(currentTree()!)"
              [class.completed]="currentTree()!.completed"
            >
              <div class="node-content">
                <div class="node-header">
                  <span class="node-depth"
                    >深度: {{ currentTree()!.depth }}</span
                  >
                  <span class="node-id">{{ currentTree()!.id }}</span>
                </div>
                <div class="node-problem">
                  {{ formatProblem(currentTree()!.problem) }}
                </div>
                <div class="node-result" *ngIf="currentTree()!.result">
                  结果: {{ truncateResult(currentTree()!.result!) }}
                </div>
              </div>
            </div>
          </div>

          <div class="tree-children" *ngIf="currentTree()!.children.length > 0">
            <div
              *ngFor="let child of currentTree()!.children"
              class="tree-branch"
              [style.width.%]="100 / currentTree()!.children.length"
            >
              <div class="branch-line"></div>
              <app-tree-node
                [node]="child"
                [activeNodeId]="activeNodeId()"
              ></app-tree-node>
            </div>
          </div>
        </div>
      </div>

      <div class="result-panel" *ngIf="showResult()">
        <h3>最终结果</h3>
        <div class="result-content">
          <div class="problem">
            <div class="number">{{ num1() }}</div>
            <div class="operator">×</div>
            <div class="number">{{ num2() }}</div>
            <div class="equals">=</div>
          </div>
          <div class="final-result">{{ result() }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .tree-container {
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

      .tree-wrapper {
        overflow-x: auto;
        overflow-y: hidden;
        padding: 1rem 0;
      }

      .recursive-tree {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 800px;
      }

      .tree-node-container {
        display: flex;
        justify-content: center;
        width: 100%;
        margin-bottom: 1rem;
      }

      .tree-node {
        border: 2px solid #ddd;
        border-radius: 8px;
        padding: 0.75rem;
        background: #f9f9f9;
        min-width: 200px;
        transition: all 0.3s ease;
      }

      .tree-node.active {
        border-color: #2196f3;
        background: #e3f2fd;
        box-shadow: 0 0 15px rgba(33, 150, 243, 0.3);
        transform: scale(1.05);
      }

      .tree-node.completed {
        border-color: #4caf50;
        background: #e8f5e9;
      }

      .node-content {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .node-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.8em;
        color: #888;
      }

      .node-problem {
        font-weight: 500;
        color: #333;
        word-break: break-all;
      }

      .node-result {
        font-weight: 600;
        color: #2196f3;
        word-break: break-all;
      }

      .tree-children {
        display: flex;
        width: 100%;
      }

      .tree-branch {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .branch-line {
        width: 2px;
        height: 30px;
        background: #ddd;
        margin-bottom: 1rem;
      }

      .result-panel {
        margin-top: 2rem;
        border-top: 1px solid #eee;
        padding-top: 1.5rem;
      }

      .result-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }

      .problem {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 1.2rem;
        color: #333;
      }

      .number {
        font-family: monospace;
        background: #f0f0f0;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .operator,
      .equals {
        font-weight: bold;
        color: #555;
      }

      .final-result {
        font-family: monospace;
        font-size: 1.2rem;
        font-weight: 600;
        color: #2196f3;
        background: #e3f2fd;
        padding: 1rem;
        border-radius: 8px;
        max-width: 100%;
        overflow-wrap: break-word;
        box-shadow: 0 4px 15px rgba(33, 150, 243, 0.1);
        max-height: 200px;
        overflow-y: auto;
      }
    `,
  ],
  imports: [CommonModule, TreeNodeComponent],
})
export class RecursiveTreeComponent {
  currentTree = signal<TreeNode | null>(null);
  activeNodeId = signal<string>('');
  showResult = signal(false);
  num1 = signal('');
  num2 = signal('');
  result = signal('');

  constructor(private bigIntService: BigIntMultiplyService) {
    this.bigIntService.current$.subscribe((step) => {
      if (step) {
        this.currentTree.set(step.tree);
        this.activeNodeId.set(step.nodeId);
        this.showResult.set(step.type === 'RESULT');

        if (step.type === 'RESULT') {
          this.result.set(step.result || '');
          // 使用类型断言避免直接访问私有属性的问题
          const cfg = (this.bigIntService as any).cfg;
          this.num1.set(cfg.num1);
          this.num2.set(cfg.num2);
        }
      }
    });
  }

  isActiveNode(node: TreeNode): boolean {
    return node.id === this.activeNodeId();
  }

  formatProblem(problem: { a: string; b: string }): string {
    return `${this.truncate(problem.a)} × ${this.truncate(problem.b)}`;
  }

  truncate(str: string, maxLength: number = 12): string {
    if (str.length <= maxLength) return str;
    const halfLength = Math.floor(maxLength / 2);
    return `${str.substring(0, halfLength)}...${str.substring(
      str.length - halfLength
    )}`;
  }

  truncateResult(result: string): string {
    return this.truncate(result, 20);
  }
}
