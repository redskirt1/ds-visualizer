export interface TreeMetrics {
  nodeCount: number;
  height: number;
  insertCount: number;
  rotateCount: number;
  visitedCount: number;
  lastSearchType?: 'DFS' | 'BFS';
}
