import { Injectable } from '@angular/core';
import { ArrayElement, SortingStep } from '../models/array.model';

@Injectable({
    providedIn: 'root'
})
export class SortingService {
    // 冒泡排序
    bubbleSort(array: number[]): { steps: SortingStep[], executionTime: number } {
        const elements: ArrayElement[] = array.map(value => ({ value, color: 'lightblue' }));
        const steps: SortingStep[] = [];

        let comparisons = 0;
        let swaps = 0;
        const n = elements.length;

        const startTime = performance.now();

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - 1 - i; j++) {
                comparisons++;

                // 1. 比较当前元素，生成快照
                steps.push({
                    description: `比较元素 ${elements[j].value} 和 ${elements[j + 1].value}`,
                    arrayState: elements.map((el, idx) => ({
                        value: el.value,
                        color: (idx === j || idx === j + 1) ? 'red' : (idx > n - 1 - i ? 'green' : 'lightblue')
                    })),
                    comparisons,
                    swaps
                });

                if (elements[j].value > elements[j + 1].value) {
                    swaps++;

                    // 2. 交换元素
                    [elements[j], elements[j + 1]] = [elements[j + 1], elements[j]];

                    // 3. 交换后，再生成快照
                    steps.push({
                        description: `交换元素 ${elements[j].value} 和 ${elements[j + 1].value}`,
                        arrayState: elements.map((el, idx) => ({
                            value: el.value,
                            color: (idx === j || idx === j + 1) ? 'red' : (idx > n - 1 - i ? 'green' : 'lightblue')
                        })),
                        comparisons,
                        swaps
                    });
                }
            }
        }

        // 全部排序完成，最后一帧
        steps.push({
            description: `排序完成！`,
            arrayState: elements.map(el => ({
                value: el.value,
                color: 'green'
            })),
            comparisons,
            swaps
        });

        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);

        return { steps, executionTime };
    }

    // 快速排序
    quickSort(array: number[]): { steps: SortingStep[], executionTime: number } {
        const elements: ArrayElement[] = array.map(value => ({
            value,
            color: '#3498db' // 默认浅蓝色
        }));
        const steps: SortingStep[] = [];

        let comparisons = 0;
        let swaps = 0;

        const startTime = performance.now();

        const quickSortRecursive = (arr: ArrayElement[], left: number, right: number) => {
            if (left >= right) {
                if (left === right) {
                    arr[left].color = '#2ecc71'; // 已排好，绿色
                    steps.push(this.createStep(arr, `元素 ${arr[left].value} 已归位`, comparisons, swaps));
                }
                return;
            }

            const pivotIndex = right;
            arr[pivotIndex].color = '#8e44ad'; // pivot 紫色

            let i = left;

            for (let j = left; j < right; j++) {
                comparisons++;
                steps.push(this.createStep(arr, `比较 ${arr[j].value} 和 pivot ${arr[pivotIndex].value}`, comparisons, swaps, j, pivotIndex));

                if (arr[j].value < arr[pivotIndex].value) {
                    swaps++;
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    steps.push(this.createStep(arr, `交换 ${arr[i].value} 和 ${arr[j].value}`, comparisons, swaps, i, j, pivotIndex));
                    i++;
                }
            }

            swaps++;
            [arr[i], arr[pivotIndex]] = [arr[pivotIndex], arr[i]];
            arr[i].color = '#2ecc71'; // 归位的元素绿色
            steps.push(this.createStep(arr, `pivot ${arr[i].value} 归位`, comparisons, swaps));

            quickSortRecursive(arr, left, i - 1);
            quickSortRecursive(arr, i + 1, right);
        };

        quickSortRecursive(elements, 0, elements.length - 1);
        steps.push({
            description: '排序完成！',
            comparisons,
            swaps,
            arrayState: elements.map(el => ({
                value: el.value,
                color: '#2ecc71' // 全部绿色
            }))
        });


        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);

        return { steps, executionTime };
    }

    mergeSort(array: number[]): { steps: SortingStep[], executionTime: number } {
        const elements: ArrayElement[] = array.map(value => ({
            value,
            color: '#bdc3c7' // 灰色，未处理
        }));
        const steps: SortingStep[] = [];

        let comparisons = 0;

        const startTime = performance.now();

        const mergeSortRecursive = (arr: ArrayElement[], left: number, right: number) => {
            if (left >= right) {
                return;
            }

            const mid = Math.floor((left + right) / 2);

            mergeSortRecursive(arr, left, mid);
            mergeSortRecursive(arr, mid + 1, right);

            // 归并
            const temp: ArrayElement[] = [];
            let i = left, j = mid + 1;

            // 标记左右归并序列
            for (let k = left; k <= mid; k++) arr[k].color = '#3498db'; // 左子序列 蓝色
            for (let k = mid + 1; k <= right; k++) arr[k].color = '#8e44ad'; // 右子序列 紫色

            steps.push(this.createMergeStep(arr, `标记左右子序列`, comparisons));

            while (i <= mid && j <= right) {
                comparisons++;

                // 标记正在比较的元素
                arr[i].color = '#e74c3c'; // 红色
                arr[j].color = '#e74c3c'; // 红色

                steps.push(this.createMergeStep(arr, `比较 ${arr[i].value} 和 ${arr[j].value}`, comparisons));

                if (arr[i].value <= arr[j].value) {
                    temp.push({ ...arr[i] });
                    arr[i].color = '#2ecc71'; // 合并完成 绿色
                    i++;
                } else {
                    temp.push({ ...arr[j] });
                    arr[j].color = '#2ecc71'; // 合并完成 绿色
                    j++;
                }

                steps.push(this.createMergeStep(arr, `合并元素`, comparisons));
            }

            while (i <= mid) {
                temp.push({ ...arr[i] });
                arr[i].color = '#2ecc71'; // 合并完成 绿色
                i++;
                steps.push(this.createMergeStep(arr, `合并左边剩余元素`, comparisons));
            }

            while (j <= right) {
                temp.push({ ...arr[j] });
                arr[j].color = '#2ecc71'; // 合并完成 绿色
                j++;
                steps.push(this.createMergeStep(arr, `合并右边剩余元素`, comparisons));
            }

            // 把 temp 数组拷贝回 arr
            for (let k = 0; k < temp.length; k++) {
                arr[left + k] = temp[k];
            }

            steps.push(this.createMergeStep(arr, `归并完成`, comparisons));
        };

        mergeSortRecursive(elements, 0, elements.length - 1);

        // 全部排序完成
        steps.push({
            description: `排序完成！`,
            comparisons,
            swaps: 0,
            arrayState: elements.map(el => ({
                value: el.value,
                color: '#2ecc71' // 全部绿色
            }))
        });

        const endTime = performance.now();
        const executionTime = Math.round(endTime - startTime);

        return { steps, executionTime };
    }

    private createMergeStep(
        arr: ArrayElement[],
        description: string,
        comparisons: number
    ): SortingStep {
        return {
            description,
            comparisons,
            swaps: 0, // 归并排序没有交换
            arrayState: arr.map(el => ({
                value: el.value,
                color: el.color
            }))
        };
    }


    private createStep(
        arr: ArrayElement[],
        description: string,
        comparisons: number,
        swaps: number,
        comparingIdx1?: number,
        comparingIdx2?: number,
        pivotIdx?: number
    ): SortingStep {
        return {
            description,
            comparisons,
            swaps,
            arrayState: arr.map((el, idx) => ({
                value: el.value,
                color:
                    idx === pivotIdx ? '#8e44ad' : // pivot 紫色
                        idx === comparingIdx1 || idx === comparingIdx2 ? '#ff4d4f' : // 比较的红色
                            el.color === '#2ecc71' ? '#2ecc71' : '#3498db' // 已归位绿色，否则蓝色
            }))
        };
    }
}
