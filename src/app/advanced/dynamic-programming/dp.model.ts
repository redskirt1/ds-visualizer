export interface Item {
  name: string;
  weight: number;
  value: number;
}

export interface DpConfig {
  capacity: number;
  items: Item[];
}

export interface DpStep {
  itemIndex: number;
  weightIndex: number;
  table: number[][];
  includeItem: boolean;
  currentItem?: Item;
  explanation: string;
}

export interface DpState {
  config: DpConfig;
  steps: DpStep[];
  currentStepIndex: number;
  optimalPath: [number, number][];
  optimalItems: Item[];
  maxValue: number;
  isComplete: boolean;
}

export type DpRecord = Record<
  string,
  number | boolean | Item | string | Array<any>
>;
