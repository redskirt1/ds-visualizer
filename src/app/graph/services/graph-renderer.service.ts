import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { Node, Edge } from '../models/graph.model';

@Injectable({
  providedIn: 'root'
})
export class GraphRendererService {
  initializeGraph(container: HTMLElement, width: number, height: number): any {
    // 清除之前的SVG
    d3.select(container).select('svg').remove();

    // 创建新的SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    return svg;
  }
  
  renderGraph(svg: any, nodes: Node[], edges: Edge[], simulation: any): void {
    // 清除之前的图形
    svg.selectAll('.links').remove();
    svg.selectAll('.nodes').remove();
    svg.selectAll('.node-labels').remove();
    svg.selectAll('.edge-weights').remove();

    // 创建边 - 确保使用边的颜色属性
    const links = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', (d: Edge) => '#999')  // 确保使用边的颜色
      .attr('stroke-width', 2);
    // 创建节点
    const nodeElements = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 15)
      .attr('fill', (d: Node) => d.color || '#69b3a2')
      .call(d3.drag()
        .on('start', (event: any) => this.dragstarted(event, simulation))
        .on('drag', (event: any) => this.dragged(event))
        .on('end', (event: any) => this.dragended(event, simulation)));

    // 添加节点标签
    const nodeLabels = svg.append('g')
      .attr('class', 'node-labels')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d: Node) => d.id)
      .attr('font-size', '12px')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em');

    // 添加边权重标签
    const edgeWeights = svg.append('g')
      .attr('class', 'edge-weights')
      .selectAll('text')
      .data(edges)
      .enter()
      .append('text')
      .text((d: Edge) => d.weight)
      .attr('font-size', '10px')
      .attr('fill', '#333');

    // 更新位置
    this.updatePositions(links, nodeElements, nodeLabels, edgeWeights);
  }
  
  updatePositions(links: any, nodes: any, nodeLabels: any, edgeWeights: any): void {
    links
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    nodes
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);

    nodeLabels
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y);

    edgeWeights
      .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
      .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
  }
  
  createForceLayout(nodes: Node[], edges: Edge[], width: number, height: number): any {
    // 添加边界约束，防止节点移出视图
    const boundaryForce = () => {
      for (let node of nodes) {
        node.x = Math.max(30, Math.min(width - 30, node.x || width / 2));
        node.y = Math.max(30, Math.min(height - 30, node.y || height / 2));
      }
    };

    // 创建力导向布局
    const simulation = d3.forceSimulation(nodes)
          .force('link', d3.forceLink()
            .id((d: any) => d.id)
            .links(edges)
            .distance(100))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide().radius(30))
          .force('boundary', boundaryForce);
    return simulation;
  }
  
  // 拖拽相关函数
  dragstarted(event: any, simulation: any): void {
    if (simulation && !event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  dragged(event: any): void {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  dragended(event: any, simulation: any): void {
    if (simulation && !event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
}
