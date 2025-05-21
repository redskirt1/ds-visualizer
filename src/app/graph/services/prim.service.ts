import { Injectable } from '@angular/core';
import { Node, Edge, AlgorithmStep } from '../models/graph.model';
import { color } from 'd3';

@Injectable({
  providedIn: 'root'
})
export class PrimService {
  runPrim(nodes: Node[], edges: Edge[], startNode: string): {
    steps: AlgorithmStep[],
    executionTime: number
  } {
    console.log(`Running Prim from ${startNode}`);
    const startTime = performance.now();
    const steps: AlgorithmStep[] = [];

    // 创建图的邻接表表示
    const graph = new Map<string, { neighbor: string, weight: number }[]>();
    nodes.forEach(node => {
      graph.set(node.id, []);
    });

    edges.forEach(edge => {
      // 确保 source 和 target 是字符串
      const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;

      console.log(`Processing edge: ${source} - ${target} (${edge.weight})`);
      const sourceNeighbors = graph.get(source) || [];
      sourceNeighbors.push({ neighbor: target, weight: edge.weight });
      graph.set(source, sourceNeighbors);

      // 无向图
      const targetNeighbors = graph.get(target) || [];
      targetNeighbors.push({ neighbor: source, weight: edge.weight });
      graph.set(target, targetNeighbors);
    });

    // 初始化
    const visited = new Set<string>([startNode]);
    const visitedEdge = new Set<string>([]);
    const mst: { source: string, target: string, weight: number }[] = [];

    // 记录初始状态
    steps.push({
      description: `初始化: 从节点 ${startNode} 开始构建最小生成树`,
      nodes: nodes.map(node => ({
        id: node.id,
        color: node.id === startNode ? '#ff7f0e' : '#69b3a2',
        x: node.x,
        y: node.y
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        color: '#999'
      }))
    });

    // Prim算法主循环
    while (visited.size < nodes.length) {
      let minEdge: {id:string; source: string, target: string, weight: number } | null = null;

      // 查找连接已访问和未访问节点的最小权重边
      visited.forEach(node => {
        const neighbors = graph.get(node) || [];
        neighbors.forEach(({ neighbor, weight }) => {
          if (!visited.has(neighbor)) {
            console.log(`  Candidate edge: ${node} - ${neighbor} (${weight})`);
            if (!minEdge || weight < minEdge.weight) {
              minEdge = {
                id: `${node}-${neighbor}`,
                source: node,
                target: neighbor,
                weight: weight
              };
              console.log(`  New min edge: ${node} - ${neighbor} (${weight})`);
            }
          }
        });
      });

      if (!minEdge) {
        console.log('No more edges to add, graph may not be connected');
        break; // 图不连通
      }

      // 添加边到MST
      mst.push(minEdge);
      const edge = minEdge as { source: string, target: string, weight: number };
      visited.add(edge.target);
      visitedEdge.add(edge.source + '-' + edge.target);
      visitedEdge.add(edge.target + '-' + edge.source);

      // 记录这一步
      const nodeColors = nodes.map(node => ({
        id: node.id,
        color: visited.has(node.id) ?
          (node.id === minEdge?.target ? '#d62728' : '#ff7f0e') :
          '#69b3a2',
        x: node.x,
        y: node.y
      }));
      const edgeColors = edges.map(e => {
        // 找到对应的边ID
        const sourceId = typeof e.source === 'object' ? (e.source as any).id : e.source;
        const targetId = typeof e.target === 'object' ? (e.target as any).id : e.target;
        const edgeId = `${sourceId}-${targetId}`;
        const reverseEdgeId = `${targetId}-${sourceId}`;
        console.log('Edge ID121313:', e.id === edgeId);

        // 判断当前边是否在 MST 中
        const isInMST = mst.some(mstEdge =>
          (mstEdge.source === sourceId && mstEdge.target === targetId) ||
          (mstEdge.source === targetId && mstEdge.target === sourceId)
        );

        // 根据当前边是否在 MST 中来设置颜色
        const color = isInMST ? ((minEdge?.id === edgeId || reverseEdgeId === minEdge?.id) ? '#d62728' : '#ff7f0e') : '#999';

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          color: color
        };
      });


      // 在这里，我们已经确认 minEdge 不为 null，所以可以安全地访问其属性
      const safeMinEdge = minEdge as { source: string, target: string, weight: number };

      steps.push({
        description: `添加边 ${safeMinEdge.source} - ${safeMinEdge.target} (权重: ${safeMinEdge.weight}) 到最小生成树`,
        nodes: nodeColors,
        edges: edgeColors
      });
    }

    // 记录最终结果
    const totalWeight = mst.reduce((sum, edge) => sum + edge.weight, 0);

    const finalNodeColors = nodes.map(node => ({
      id: node.id,
      color: visited.has(node.id) ? '#ff7f0e' : '#69b3a2',
      x: node.x,
      y: node.y
    }));

    const finalEdgeColors = edges.map(edge => {
      // 确保 source 和 target 是字符串
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;

      // 检查边是否在 MST 中
      const isInMST = mst.some(mstEdge =>
        (mstEdge.source === sourceId && mstEdge.target === targetId) ||
        (mstEdge.source === targetId && mstEdge.target === sourceId)
      );

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        color: isInMST ? '#ff7f0e' : '#999' // MST 中的边为橙色，其他为灰色
      };
    });

    steps.push({
      description: `算法完成! 最小生成树总权重: ${totalWeight}`,
      nodes: finalNodeColors,
      edges: finalEdgeColors
    });

    const endTime = performance.now();
    console.log(`Algorithm completed with ${steps.length} steps in ${Math.round(endTime - startTime)}ms`);

    return {
      steps,
      executionTime: Math.round(endTime - startTime)
    };
  }
}
