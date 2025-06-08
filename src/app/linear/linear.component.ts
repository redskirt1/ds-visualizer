import { Component } from '@angular/core';
import { SortingService } from './services/sorting.service';
import { ArrayElement, SortingStep } from './models/array.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-linear',
  standalone: true, // ✅ standalone组件
  templateUrl: './linear.component.html',
  styleUrls: ['./linear.component.scss'],
  imports: [
    CommonModule,
    FormsModule // ✅ 必须显式声明引入
  ]
})

export class LinearComponent {
  // 数组相关
  array: ArrayElement[] = [];
  arrayLength: number = 10; // 默认数组长度，最大 15

  // 排序步骤
  sortingSteps: SortingStep[] = [];
  currentStep: number = 0;

  // 状态控制
  isPlaying: boolean = false;
  animationInterval: any;
  executionTime: number = 0;

  // 播放速度 (毫秒)
  animationSpeed: number = 1000; // 默认1秒
  speedOptions = [100, 200, 400, 1000]; // 0.1s 0.2s 0.4s 1.0s

  // 当前算法说明
  currentAlgorithmDescription: string = '';


  constructor(private sortingService: SortingService) { }

  // 生成随机数组
  generateRandomArray(): void {
    this.array = Array.from({ length: this.arrayLength }, () => ({
      value: Math.floor(Math.random() * 100),
      color: 'lightblue'
    }));
    this.sortingSteps = [];
    this.currentStep = 0;
    this.executionTime = 0;
    this.stopAnimation();
  }

  // 导出数组到 JSON 文件
  exportArray(): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.array.map(el => el.value)));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "array.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  // 冒泡排序
  runBubbleSort(): void {
    if (this.array.length === 0) return;
    this.currentAlgorithmDescription = `
    <h3>冒泡排序</h3>
    <ul>
      <li>每次比较相邻元素，较大的元素交换到后面。</li>
      <li>一轮过后，最大元素沉到末尾。</li>
      <li>重复这个过程，直到全部排序完成。</li>
    </ul>
    <p>颜色说明：</p>
  <ul>
    <li>当前比较元素：红色</li>
    <li>已排序元素：绿色</li>
    <li>未排序元素：蓝色</li>
  </ul>
  `;

    const values = this.array.map(el => el.value);
    const result = this.sortingService.bubbleSort(values);

    this.sortingSteps = result.steps;
    this.executionTime = result.executionTime;
    this.currentStep = 0;
    this.showStep(0);
  }

  // 显示某一步
  showStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= this.sortingSteps.length) return;

    this.currentStep = stepIndex;
    this.array = this.sortingSteps[stepIndex].arrayState;
  }

  // 播放动画
  playAnimation(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.animationInterval = setInterval(() => {
      if (this.currentStep < this.sortingSteps.length - 1) {
        this.showStep(this.currentStep + 1);
      } else {
        this.stopAnimation();
      }
    }, this.animationSpeed);
  }

  // 停止动画
  stopAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    this.isPlaying = false;
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  nextStep(): void {
    if (this.currentStep < this.sortingSteps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }

  changeSpeed(speed: number): void {
    this.animationSpeed = speed;
    if (this.isPlaying) {
      this.stopAnimation();
      this.playAnimation();
    }
  }

  runQuickSort(): void {
    if (this.array.length === 0) return;

    this.currentAlgorithmDescription = `
    <h3>快速排序</h3>
    <ul>
      <li>选择一个元素作为 pivot。</li>
      <li>把小于 pivot 的元素移到左边，大于的移到右边。</li>
      <li>递归对子数组进行快排。</li>
    </ul>
    <p>颜色说明：</p>
  <ul>
    <li>当前比较元素：红色</li>
    <li>Pivot元素：紫色</li>
    <li>已排序元素：绿色</li>
    <li>未排序元素：蓝色</li>
  </ul>
  `;

    const values = this.array.map(el => el.value);
    const result = this.sortingService.quickSort(values);

    this.sortingSteps = result.steps;
    this.executionTime = result.executionTime;
    this.currentStep = 0;
    this.showStep(0);
  }

  runMergeSort(): void {
    if (this.array.length === 0) return;

    this.currentAlgorithmDescription = `
    <h3>归并排序</h3>
    <ul>
      <li>递归拆分数组，直到每个子数组只包含一个元素。</li>
      <li>两两合并子数组，使之有序。</li>
      <li>最终合并成一个整体有序数组。</li>
    </ul>
    <p>颜色说明：</p>
    <ul>
      <li>当前比较元素：红色</li>
      <li>左子序列元素：蓝色</li>
      <li>右子序列元素：紫色</li>
      <li>已归并元素：绿色</li>
      <li>未处理元素：灰色</li>
    </ul>
  `;

    const values = this.array.map(el => el.value);
    const result = this.sortingService.mergeSort(values);

    this.sortingSteps = result.steps;
    this.executionTime = result.executionTime;
    this.currentStep = 0;
    this.showStep(0);
  }
  // 栈和队列数据
  stack: number[] = [1, 2, 3, 4, 5]; // 默认栈
  queue: number[] = [1, 2, 3, 4, 5]; // 默认队列
  stackInput: number = 0;
  queueInput: number = 0;
  stackOperation: string = '';
  queueOperation: string = '';

  // Stack相关操作
  pushStack(): void {
    this.stack.push(this.stackInput);
    this.stackOperation = `插入了 ${this.stackInput}`;
  }

  popStack(): void {
    const popped = this.stack.pop();
    this.stackOperation = popped !== undefined ? `弹出了 ${popped}` : '栈为空';
  }

  exportStack(): void {
    const dataStr = JSON.stringify(this.stack);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stack.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importStack(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          this.stack = JSON.parse(e.target.result);
        } catch (err) {
          console.error('Invalid JSON file');
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // 清空 file input
    }
  }

  // Queue相关操作
  enqueueQueue(): void {
    this.queue.push(this.queueInput);
    this.queueOperation = `插入了 ${this.queueInput}`;
  }

  dequeueQueue(): void {
    const dequeued = this.queue.shift();
    this.queueOperation = dequeued !== undefined ? `弹出了 ${dequeued}` : '队列为空';
  }

  exportQueue(): void {
    const dataStr = JSON.stringify(this.queue);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'queue.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importQueue(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          this.queue = JSON.parse(e.target.result);
        } catch (err) {
          console.error('Invalid JSON file');
        }
      };
      reader.readAsText(file);
      event.target.value = ''; // 清空 file input
    }
  }


}
