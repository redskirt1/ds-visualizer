import { Injectable } from '@angular/core';
import { Node, Edge, AlgorithmStep } from '../models/graph.model';

@Injectable({
  providedIn: 'root'
})
export class KruskalService {

  runKruskal(nodes: Node[], edges: Edge[]): { steps: AlgorithmStep[], executionTime: number } {
    const startTime = performance.now();
    const steps: AlgorithmStep[] = [];

    // 创建边列表并按权重排序
    const edgeList = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      weight: edge.weight
    })).sort((a, b) => a.weight - b.weight);

    // 初始化并查集
    const parent = new Map<string, string>();
    const rank = new Map<string, number>();
    nodes.forEach(node => {
      parent.set(node.id, node.id);
      rank.set(node.id, 0);
    });

    // 查找函数（带路径压缩）
    const find = (x: string): string => {
      if (parent.get(x) !== x) {
        parent.set(x, find(parent.get(x)!));
      }
      return parent.get(x)!;
    };

    // 合并函数（按秩合并）
    const union = (x: string, y: string): void => {
      const rootX = find(x);
      const rootY = find(y);

      if (rootX === rootY) return;

      const rankX = rank.get(rootX) || 0;
      const rankY = rank.get(rootY) || 0;

      if (rankX < rankY) {
        parent.set(rootX, rootY);
      } else if (rankX > rankY) {
        parent.set(rootY, rootX);
      } else {
        parent.set(rootY, rootX);
        rank.set(rootX, rankX + 1);
      }
    };

    // 节点颜色管理
    const nodeColors = new Map<string, string>();
    nodes.forEach(node => {
      nodeColors.set(node.id, '#69b3a2'); // 默认颜色
    });
    // 边颜色管理
    const edgeColors = new Map<string, string>();
    edges.forEach(edge => {
      edgeColors.set(edge.id, '#999'); // 默认颜色
    });

    // 记录初始状态
    steps.push({
      description: '初始化: 按权重对所有边排序，每个节点初始为独立的集合',
      nodes: nodes.map(node => ({
        id: node.id,
        color: nodeColors.get(node.id) || '#69b3a2',
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

    // 记录排序后的边
    const edgeDescriptions = edgeList.map(e => {
      const source = typeof e.source === 'string' ? e.source : (e.source as any).id;
      const target = typeof e.target === 'string' ? e.target : (e.target as any).id;
      return `${source}-${target}(${e.weight})`;
    }).join(', ');

    steps.push({
      description: `边按权重排序: ${edgeDescriptions}`,
      nodes: nodes.map(node => ({
        id: node.id,
        color: nodeColors.get(node.id) || '#69b3a2',
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

    // Kruskal算法主循环
    const mst: { source: string, target: string, weight: number }[] = [];

    for (const edge of edgeList) {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;

      // 记录当前考虑的边
      steps.push({
        description: `考虑边 ${sourceId} - ${targetId} (权重: ${edge.weight})`,
        nodes: nodes.map(node => ({
          id: node.id,
          color: nodeColors.get(node.id) || '#69b3a2',
          x: node.x,
          y: node.y
        })),
        edges: edges.map(e => {
          const eSourceId = typeof e.source === 'string' ? e.source : (e.source as any).id;
          const eTargetId = typeof e.target === 'string' ? e.target : (e.target as any).id;

          return {
            id: e.id,
            source: e.source,
            target: e.target,
            color: (eSourceId === sourceId && eTargetId === targetId) ||
                (eTargetId === sourceId && eSourceId === targetId) ? '#d62728' :
                edgeColors.get(e.id) || '#999'
            };
        })
      });

      const rootSource = find(sourceId);
      const rootTarget = find(targetId);

      if (rootSource !== rootTarget) {
        // 添加边到MST
        mst.push({
          source: sourceId,
          target: targetId,
          weight: edge.weight
        });
        edgeColors.set(edge.id, '#ff7f0e'); // 设置边颜色为红色
        console.log('添加边到MST:', edgeColors);

        // 合并集合前记录目标根节点，因为合并后会改变
        const oldRootTarget = rootTarget;

        // 合并集合
        union(sourceId, targetId);

        // 获取合并后的根节点
        const newRoot = find(sourceId);

        // 更新节点颜色 - 对两个连通分量的所有节点进行染色
        nodes.forEach(node => {
          const nodeRoot = find(node.id);
          if (nodeRoot === newRoot) {
            const hash = Array.from(nodeRoot).reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
            const hue = Math.abs(hash) % 360;
            nodeColors.set(node.id, `hsl(${hue}, 70%, 60%)`);
          }
        });

        // 记录添加边后的状态
        steps.push({
          description: `添加边 ${sourceId} - ${targetId} 到MST，合并集合`,
          nodes: nodes.map(node => ({
            id: node.id,
            color: nodeColors.get(node.id) || '#69b3a2',
            x: node.x,
            y: node.y
          })),
          edges: edges.map(e => {
            const eSourceId = typeof e.source === 'string' ? e.source : (e.source as any).id;
            const eTargetId = typeof e.target === 'string' ? e.target : (e.target as any).id;

            return {
              id: e.id,
              source: e.source,
              target: e.target,
              color: (eSourceId === sourceId && eTargetId === targetId) ||
                (eTargetId === sourceId && eSourceId === targetId) ? '#d62728' :
                edgeColors.get(e.id) || '#999'
            };
          })
        });
      } else {
        // 记录跳过的边
        steps.push({
          description: `跳过边 ${sourceId} - ${targetId}，因为它会形成环`,
          nodes: nodes.map(node => ({
            id: node.id,
            color: nodeColors.get(node.id) || '#999',
            x: node.x,
            y: node.y
          })),
          edges: edges.map(e => {
            const eSourceId = typeof e.source === 'string' ? e.source : (e.source as any).id;
            const eTargetId = typeof e.target === 'string' ? e.target : (e.target as any).id;
            return {
              id: e.id,
              source: e.source,
              target: e.target,
              color: (eSourceId === sourceId && eTargetId === targetId) ||
                (eTargetId === sourceId && eSourceId === targetId) ? '#aaaaaa' : '#999'
            };
          })
        });
      }

      // 检查是否所有节点都已连通
      const firstRoot = find(nodes[0].id);
      const allConnected = nodes.every(node => find(node.id) === firstRoot);

      // 如果MST已经有n-1条边或所有节点都已连通，则完成
      if (mst.length === nodes.length - 1 || allConnected) {
        break;
      }
    }

    // 记录最终结果
    const totalWeight = mst.reduce((sum, edge) => sum + edge.weight, 0);

    // 检查是否所有节点都已连通
    const firstRoot = find(nodes[0].id);
    const allConnected = nodes.every(node => find(node.id) === firstRoot);

    const finalDescription = allConnected ?
      `算法完成! 最小生成树总权重: ${totalWeight}` :
      `算法完成! 图不连通，生成了最小生成森林，总权重: ${totalWeight}`;

    steps.push({
      description: finalDescription,
      nodes: nodes.map(node => ({
        id: node.id,
        color: nodeColors.get(node.id) || '#69b3a2',
        x: node.x,
        y: node.y
      })),
      edges: edges.map(edge => {
        const eSourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
        const eTargetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;

        // 检查边是否在MST中
        const inMST = mst.some(mstEdge => {
          const mstSourceId = typeof mstEdge.source === 'string' ? mstEdge.source : (mstEdge.source as any).id;
          const mstTargetId = typeof mstEdge.target === 'string' ? mstEdge.target : (mstEdge.target as any).id;

          return (eSourceId === mstSourceId && eTargetId === mstTargetId) ||
            (eTargetId === mstSourceId && eSourceId === mstTargetId);
        });

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          color: inMST ? '#ff7f0e' : '#999'
        };
      })
    });

    const endTime = performance.now();
    return {
      steps,
      executionTime: Math.round(endTime - startTime)
    };
  }
}