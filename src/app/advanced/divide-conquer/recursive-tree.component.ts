import {
  Component,
  Input,
  signal,
  effect,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
  ViewChild,
  ViewChildren,
  QueryList,
  Injector,
  runInInjectionContext,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BigIntMultiplyService } from './bigint-multiply.service';
import { TreeNode } from './bigint-multiply.model';

export interface LineCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  id: string; // For *ngFor tracking
}

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="node-container">
      <div
        #parentNodeDiv
        class="tree-node"
        [class.active]="node.id === activeNodeId"
        [class.completed]="node.completed"
        [class.has-children]="node.children && node.children.length > 0"
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

      <svg
        class="connector-svg"
        *ngIf="
          node.children && node.children.length > 0 && svgLines().length > 0
        "
      >
        <line
          *ngFor="let line of svgLines(); trackBy: trackLineById"
          [attr.x1]="line.x1"
          [attr.y1]="line.y1"
          [attr.x2]="line.x2"
          [attr.y2]="line.y2"
          stroke="#4caf50"
          stroke-width="2"
        />
      </svg>

      <div
        class="children-container"
        *ngIf="node.children && node.children.length > 0"
      >
        <div
          #childWrapperDiv
          *ngFor="
            let child of node.children;
            let i = index;
            let first = first;
            let last = last
          "
          class="child-wrapper"
          [style.flex-basis]="calculateChildWidth(node.children.length)"
          [class.is-first]="first"
          [class.is-last]="last"
        >
          <app-tree-node
            [node]="child"
            [activeNodeId]="activeNodeId"
            [forceUpdateToken]="forceUpdateToken"
          ></app-tree-node>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }

      .node-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative; /* Required for SVG positioning */
        width: 100%; /* Ensure it takes up space for children to spread */
      }

      .tree-node {
        border: 2px solid #ddd;
        border-radius: 8px;
        padding: 0.75rem;
        background: #f9f9f9;
        width: 200px;
        min-height: 80px;
        box-sizing: border-box;
        text-align: center;
        position: relative;
        z-index: 1; /* Nodes above lines */
        margin-bottom: 40px;
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
        height: 100%;
        justify-content: center;
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
        overflow-wrap: break-word;
      }

      .node-result {
        font-weight: 600;
        color: #2196f3;
        word-break: break-all;
        overflow-wrap: break-word;
      }

      /* Removed .tree-node.has-children::after */

      .children-container {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        position: relative; /* Children container can still be relative for its own layout */
        padding-top: 20px; /* Space above children, was for old connectors, might still be useful visually */
        margin-top: 0;
        width: 100%;
      }

      .child-wrapper {
        display: flex;
        justify-content: center;
        position: relative;
        padding: 0 5px;
      }

      /* Removed .child-wrapper::before */

      .connector-svg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%; /* SVG covers the entire node-container */
        pointer-events: none; /* Allows clicks to pass through to nodes */
        z-index: 0; /* SVG behind nodes */
      }
    `,
  ],
})
export class TreeNodeComponent
  implements AfterViewInit, AfterViewChecked, OnChanges
{
  @Input() node!: TreeNode;
  @Input() activeNodeId!: string;
  @Input() forceUpdateToken: any;

  svgLines = signal<LineCoordinates[]>([]);
  private lineUpdateScheduled = false;

  @ViewChild('parentNodeDiv', { static: false, read: ElementRef })
  parentNodeRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('childWrapperDiv', { read: ElementRef })
  childWrapperRefs!: QueryList<ElementRef<HTMLDivElement>>;

  constructor(private hostElRef: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forceUpdateToken']) {
      this.scheduleLineUpdate();
    }
  }

  ngAfterViewInit() {
    this.scheduleLineUpdate();
  }

  ngAfterViewChecked() {
    if (this.node && this.node.children && this.node.children.length > 0) {
      if (
        (this.childWrapperRefs &&
          this.childWrapperRefs.length === this.node.children.length &&
          this.svgLines().length !== this.node.children.length) ||
        (this.svgLines().length > 0 && this.node.children.length === 0)
      ) {
        this.scheduleLineUpdate();
      }
    } else if (this.svgLines().length > 0) {
      this.svgLines.set([]);
    }
  }

  private scheduleLineUpdate(): void {
    if (this.lineUpdateScheduled) return;
    this.lineUpdateScheduled = true;
    requestAnimationFrame(() => {
      this.updateLineCoordinates();
      this.lineUpdateScheduled = false;
    });
  }

  private updateLineCoordinates(): void {
    if (
      !this.node ||
      !this.node.children ||
      this.node.children.length === 0 ||
      !this.parentNodeRef ||
      !this.parentNodeRef.nativeElement ||
      !this.childWrapperRefs ||
      this.childWrapperRefs.length === 0
    ) {
      if (this.svgLines().length > 0) {
        this.svgLines.set([]);
      }
      return;
    }

    const nodeContainerDiv = this.hostElRef.nativeElement.querySelector(
      '.node-container'
    ) as HTMLDivElement;
    if (!nodeContainerDiv) {
      if (this.svgLines().length > 0) this.svgLines.set([]);
      return;
    }
    const nodeContainerRect = nodeContainerDiv.getBoundingClientRect();

    const parentDiv = this.parentNodeRef.nativeElement;
    const parentAttachPointX = parentDiv.offsetLeft + parentDiv.offsetWidth / 2;
    const parentAttachPointY = parentDiv.offsetTop + parentDiv.offsetHeight;

    const newLines: LineCoordinates[] = [];
    this.childWrapperRefs.forEach((childWrapperRef, index) => {
      const childNodeDiv = childWrapperRef.nativeElement.querySelector(
        '.tree-node'
      ) as HTMLDivElement;
      if (childNodeDiv) {
        const childRect = childNodeDiv.getBoundingClientRect();
        const childAttachPointX =
          childRect.left - nodeContainerRect.left + childRect.width / 2;
        const childAttachPointY = childRect.top - nodeContainerRect.top;

        newLines.push({
          id: `${this.node.id}_line_${index}`,
          x1: parentAttachPointX,
          y1: parentAttachPointY,
          x2: childAttachPointX,
          y2: childAttachPointY,
        });
      }
    });

    if (JSON.stringify(this.svgLines()) !== JSON.stringify(newLines)) {
      this.svgLines.set(newLines);
    }
  }

  trackLineById(index: number, line: LineCoordinates): string {
    return line.id;
  }

  formatProblem(problem: { a: string; b: string }): string {
    return `${this.truncate(problem.a)} × ${this.truncate(problem.b)}`;
  }

  truncate(str: string, maxLength: number = 10): string {
    if (!str) return '';
    if (str.length <= maxLength) return str;

    const halfLength = Math.floor((maxLength - 3) / 2);
    return `${str.substring(0, halfLength)}...${str.substring(
      str.length - halfLength
    )}`;
  }

  truncateResult(result: string): string {
    return this.truncate(result, 12);
  }

  calculateChildWidth(totalChildren: number): string {
    if (totalChildren === 0) return '0%';
    const minWidthPercentage = 10;
    const calculatedPercentage = 100 / totalChildren;
    return `${Math.max(calculatedPercentage, minWidthPercentage)}%`;
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
          <app-tree-node
            [node]="currentTree()!"
            [activeNodeId]="activeNodeId()"
            [forceUpdateToken]="treeUpdateToken()"
          ></app-tree-node>
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
        overflow: hidden;
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
        padding: 1rem;
        margin: 0 -1.5rem;
        width: calc(100% + 3rem);
      }

      .recursive-tree {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: max-content;
        width: 100%;
        padding: 20px 50px;
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
  treeUpdateToken = signal<number>(0);

  constructor(
    private bigIntService: BigIntMultiplyService,
    private injector: Injector
  ) {
    this.bigIntService.current$.subscribe((step) => {
      if (step) {
        this.currentTree.set(step.tree);
        this.activeNodeId.set(step.nodeId);
        this.showResult.set(step.type === 'RESULT');
        this.treeUpdateToken.update((val) => val + 1);

        if (step.type === 'RESULT') {
          this.result.set(step.result || '');
          const cfg = (this.bigIntService as any).cfg;
          this.num1.set(cfg.num1);
          this.num2.set(cfg.num2);
        }
      }
    });

    runInInjectionContext(this.injector, () => {
      effect(() => {
        const tree = this.currentTree();
        const activeNode = this.activeNodeId();
        if (tree) {
          setTimeout(() => {
            // Auto-scrolling behavior removed/commented out
          }, 0);
        }
      });
    });
  }

  isActiveNode(node: TreeNode): boolean {
    return node.id === this.activeNodeId();
  }

  formatProblem(problem: { a: string; b: string }): string {
    return `${this.truncate(problem.a)} × ${this.truncate(problem.b)}`;
  }

  truncate(str: string, maxLength: number = 10): string {
    if (!str) return '';
    if (str.length <= maxLength) return str;

    const halfLength = Math.floor((maxLength - 3) / 2);
    return `${str.substring(0, halfLength)}...${str.substring(
      str.length - halfLength
    )}`;
  }

  truncateResult(result: string): string {
    return this.truncate(result, 12);
  }

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => this.centerTreeScroll(), 100);
  }

  centerTreeScroll() {
    const wrapper = document.querySelector('.tree-wrapper');
    if (wrapper) {
      const scrollWidth = wrapper.scrollWidth;
      const clientWidth = wrapper.clientWidth;
      if (scrollWidth > clientWidth) {
        wrapper.scrollLeft = (scrollWidth - clientWidth) / 2;
      }
    }
  }
}
