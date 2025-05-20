import { Injectable } from '@angular/core';
import { Node, Edge, AlgorithmStep } from '../models/graph.model';

@Injectable({
  providedIn: 'root'
})
export class DijkstraService {
  runDijkstra(nodes: Node[], edges: Edge[], startNode: string, endNode: string): {
    steps: AlgorithmStep[],
    executionTime: number
  } {
    console.log(`Running Dijkstra from ${startNode} to ${endNode}`);
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
      
      console.log(`Processing edge: ${source} -> ${target} (${edge.weight})`);
      
      // 只添加从源到目标的边（有向图）
      const sourceNeighbors = graph.get(source) || [];
      sourceNeighbors.push({ neighbor: target, weight: edge.weight });
      graph.set(source, sourceNeighbors);

      // 如果是无向图，则添加反向边
      const targetNeighbors = graph.get(target) || [];
      targetNeighbors.push({ neighbor: source, weight: edge.weight });
      graph.set(target, targetNeighbors);
    });

    // 初始化距离和前驱节点
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    nodes.forEach(node => {
      distances.set(node.id, node.id === startNode ? 0 : Infinity);
      previous.set(node.id, null);
    });

    // 记录初始状态
    steps.push({
      description: '初始化: 起点距离为0，其他节点距离为∞',
      nodes: nodes.map(node => ({
        id: node.id,
        color: node.id === startNode ? '#ff7f0e' : '#69b3a2',
        x: node.x,
        y: node.y
      })),
      edges: edges.map(edge => ({
        source: edge.source,
        target: edge.target,
        color: '#999'
      }))
    });

    // Dijkstra算法主循环
    while (visited.size < nodes.length) {
      // 找到当前距离最小的未访问节点
      let minDistance = Infinity;
      let current: string | null = null;

      distances.forEach((distance, node) => {
        if (!visited.has(node) && distance < minDistance) {
          minDistance = distance;
          current = node;
        }
      });

      console.log(`Current node: ${current}, distance: ${minDistance}`);
      
      if (current === null || distances.get(current) === Infinity) {
        console.log('No reachable nodes left, breaking');
        break; // 所有可达节点都已处理
      }

      // 如果找到终点，立即结束算法
      if (current === endNode) {
        console.log(`Found end node ${endNode}, breaking`);
        visited.add(current); // 标记终点为已访问
        
        // 记录访问终点的步骤
        const nodeColors = nodes.map(node => ({
          id: node.id,
          color: node.id === current ? '#ff7f0e' :
                 visited.has(node.id) ? '#1f77b4' : '#69b3a2',
          x: node.x,
          y: node.y
        }));

        // 构建最短路径
        const path: string[] = [];
        let curr = current as string;
        while (curr) {
          path.unshift(curr);
          const prev = previous.get(curr);
        if (prev !== null && prev !== undefined) {
            curr = prev;
        } else {
          break;
        }
      }

        const edgeColors = edges.map(edge => {
        let color = '#999';
        // 确保 source 和 target 是字符串
        const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
        const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
        
          // 检查边是否在路径上
        for (let i = 0; i < path.length - 1; i++) {
          if ((source === path[i] && target === path[i + 1]) ||
              (target === path[i] && source === path[i + 1])) {
              color = '#1f77b4'; // 当前最短路径
            break;
          }
        }
    return {
          source: edge.source,
          target: edge.target,
          color: color
    };
      });

      steps.push({
          description: `访问终点 ${current}，距离为 ${distances.get(current)}`,
          nodes: nodeColors,
          edges: edgeColors
      });
        
        break; // 找到终点后立即退出循环
  }

      visited.add(current);

      // 记录访问节点的步骤
      const nodeColors = nodes.map(node => ({
        id: node.id,
        color: node.id === current ? '#ff7f0e' :
          visited.has(node.id) ? '#1f77b4' : '#69b3a2',
        x: node.x,
        y: node.y
      }));

      // 构建当前已知的最短路径
      const currentPath: string[] = [];
      let curr = current as string;
      while (curr) {
        currentPath.unshift(curr);
        const prev = previous.get(curr);
        if (prev !== null && prev !== undefined) {
          curr = prev;
        } else {
          break;
        }
      }

      const edgeColors = edges.map(edge => {
        let color = '#999';
        // 确保 source 和 target 是字符串
        const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
        const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
        
        // 检查边是否在当前路径上
        for (let i = 0; i < currentPath.length - 1; i++) {
          if ((source === currentPath[i] && target === currentPath[i + 1]) ||
              (target === currentPath[i] && source === currentPath[i + 1])) {
            color = '#1f77b4'; // 当前最短路径
            break;
          }
        }
    return {
          source: edge.source,
          target: edge.target,
          color: color
    };
      });

      steps.push({
        description: `访问节点 ${current}，当前距离为 ${distances.get(current)}`,
        nodes: nodeColors,
        edges: edgeColors
      });

      // 更新邻居节点的距离
      const neighbors = graph.get(current) || [];
      console.log(`Neighbors of ${current}: ${neighbors.map(n => n.neighbor).join(', ')}`);
      
      neighbors.forEach(({ neighbor, weight }) => {
        if (!visited.has(neighbor)) {
          const currentDistance = distances.get(current!) || 0;
          const alt = currentDistance + weight;
          const neighborDistance = distances.get(neighbor) || Infinity;

          console.log(`Checking neighbor ${neighbor}: current distance = ${neighborDistance}, new distance = ${alt}`);

          if (alt < neighborDistance) {
            console.log(`Updating distance of ${neighbor} to ${alt}`);
            distances.set(neighbor, alt);
            previous.set(neighbor, current!);
            
            // 记录更新距离的步骤
            const updateNodeColors = nodes.map(node => ({
              id: node.id,
              color: node.id === current ? '#ff7f0e' :
                visited.has(node.id) ? '#1f77b4' :
                  node.id === neighbor ? '#d62728' : '#69b3a2',
              x: node.x,
              y: node.y
            }));

            const updateEdgeColors = edges.map(edge => {
              let color = '#999';
              // 确保 source 和 target 是字符串
              const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
              const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
              
              if ((source === current && target === neighbor) ||
                  (target === current && source === neighbor)) {
                color = '#d62728'; // 当前考虑的边
              } else {
                // 构建已知最短路径
                let path: string[] = [];
                let c = neighbor;
                while (c) {
                  const prev = previous.get(c);
                  if (prev) {
                    path.unshift(c);
                    path.unshift(prev);
                    c = prev;
                  } else {
                    break;
}
}

                // 检查边是否在路径上
                for (let i = 0; i < path.length - 1; i++) {
                  if ((source === path[i] && target === path[i + 1]) ||
                      (target === path[i] && source === path[i + 1])) {
                    color = '#1f77b4'; // 当前最短路径
                    break;
                  }
                }
              }
              return {
                source: edge.source,
                target: edge.target,
                color: color
              };
            });

            steps.push({
              description: `更新节点 ${neighbor} 的距离为 ${alt}，前驱为 ${current}`,
              nodes: updateNodeColors,
              edges: updateEdgeColors
            });
          }
        }
      });
    }

    // 打印最终距离表
    console.log('Final distances:');
    distances.forEach((distance, node) => {
      console.log(`${node}: ${distance}`);
    });

    // 构建最终路径
    const path: string[] = [];
    let current = endNode;
    const endNodeDistance = distances.get(endNode);
    
    // 检查终点是否可达
    if (endNodeDistance === Infinity) {
      console.log(`End node ${endNode} is not reachable from ${startNode}`);
      
      // 记录终点不可达的结果
      steps.push({
        description: `算法完成! 从 ${startNode} 无法到达 ${endNode}`,
        nodes: nodes.map(node => ({
          id: node.id,
          color: node.id === startNode ? '#ff7f0e' : 
                 visited.has(node.id) ? '#1f77b4' : '#69b3a2',
          x: node.x,
          y: node.y
        })),
        edges: edges.map(edge => ({
          source: edge.source,
          target: edge.target,
          color: '#999'
        }))
      });
    } else {
      // 终点可达，构建路径
      while (current) {
        path.unshift(current);
        const prev = previous.get(current);
        if (prev !== null && prev !== undefined) {
          current = prev;
        } else {
          break;
        }
      }

      console.log(`Path from ${startNode} to ${endNode}: ${path.join(' -> ')}`);

      // 记录最终结果
      const finalNodeColors = nodes.map(node => ({
        id: node.id,
        color: path.includes(node.id) ? '#ff7f0e' : 
               visited.has(node.id) ? '#1f77b4' : '#69b3a2',
        x: node.x,
        y: node.y
      }));

      const finalEdgeColors = edges.map(edge => {
        let color = '#999';
        // 确保 source 和 target 是字符串
        const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
        const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
        
        for (let i = 0; i < path.length - 1; i++) {
          if ((source === path[i] && target === path[i + 1]) ||
              (target === path[i] && source === path[i + 1])) {
            color = '#ff7f0e'; // 最终路径
            break;
          }
        }
        return {
          source: edge.source,
          target: edge.target,
          color: color
        };
      });

      steps.push({
        description: `算法完成! 从 ${startNode} 到 ${endNode} 的最短路径: ${path.join(' -> ')}，距离: ${endNodeDistance}`,
        nodes: finalNodeColors,
        edges: finalEdgeColors
      });
    }

    const endTime = performance.now();
    console.log(`Algorithm completed with ${steps.length} steps in ${Math.round(endTime - startTime)}ms`);
    
    return {
      steps,
      executionTime: Math.round(endTime - startTime)
    };
  }
}