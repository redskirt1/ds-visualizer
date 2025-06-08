// 单个数组元素
export interface ArrayElement {
    value: number;   // 数值
    color?: string;  // 用于可视化时的颜色标记
}

// 排序步骤记录
export interface SortingStep {
    description: string;         // 当前步骤的描述（如 "比较元素 5 和 7"）
    arrayState: ArrayElement[];  // 当前数组状态快照
    comparisons: number;         // 累计比较次数
    swaps: number;               // 累计交换次数
}
