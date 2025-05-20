export interface Node {
  id: string;
  x?: number;
  y?: number;
  color?: string;
  weight?: number;
  visited?: boolean;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  color?: string;
  visited?: boolean;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export interface AlgorithmStep {
  description: string;
  nodes: { id: string; color: string; x?: number; y?: number; }[];
  edges: { source: string; target: string; color: string; }[];
}
