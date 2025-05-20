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
        source: edge.source,
        target: edge.target,
        color: edge.color || '#999'
      }))
    });

    // Prim算法主循环
    while (visited.size < nodes.length) {
      let minEdge: { source: string, target: string, weight: number } | null = null;

      // 查找连接已访问和未访问节点的最小权重边
      visited.forEach(node => {
        const neighbors = graph.get(node) || [];
        neighbors.forEach(({ neighbor, weight }) => {
          if (!visited.has(neighbor)) {
            console.log(`  Candidate edge: ${node} - ${neighbor} (${weight})`);
            if (!minEdge || weight < minEdge.weight) {
              minEdge = {
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

      // 记录这一步
      const nodeColors = nodes.map(node => ({
        id: node.id,
        color: visited.has(node.id) ?
          (node.id === minEdge?.target ? '#d62728' : '#ff7f0e') :
          '#69b3a2',
        x: node.x,
        y: node.y
      }));

      const edgeColors = edges.map(edge => {
        // 确保 source 和 target 是字符串
        const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
        const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;

        return {
          source: edge.source,
          target: edge.target,
          color: '#999'
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
      const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
      
      return {
        source: edge.source,
        target: edge.target,
        color: '#999'
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
