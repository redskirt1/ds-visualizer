import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Node, Edge, AlgorithmStep } from './models/graph.model';
import { DijkstraService } from './services/dijkstra.service';
import { PrimService } from './services/prim.service';
import { KruskalService } from './services/kruskal.service';
import { GraphRendererService } from './services/graph-renderer.service';

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class GraphComponent implements OnInit {
  @ViewChild('graphContainer', { static: false }) graphContainer!: ElementRef;

  // 图数据
  nodes: Node[] = [];
  edges: Edge[] = [];

  // 控制参数
  nodeCount: number = 10;
  edgeDensity: number = 0.3;
  startNode: string = '';
  endNode: string = '';
  animationSpeed: number = 500;
  // 算法相关
  currentAlgorithm: string = '';
  algorithmSteps: AlgorithmStep[] = [];
  currentStep: number = 0;
  executionTime: number = 0;
  isPlaying: boolean = false;
  animationInterval: any;

  // D3相关
  svg: any;
  width: number = 800;
  height: number = 500;
  simulation: any;

  constructor(
    private dijkstraService: DijkstraService,
    private primService: PrimService,
    private kruskalService: KruskalService,
    private graphRenderer: GraphRendererService
  ) { }

  ngOnInit(): void {
    console.log('Graph component initialized');
  }

  ngAfterViewInit(): void {
    console.log('Graph container element:', this.graphContainer?.nativeElement);
    // 确保 DOM 元素已经渲染
    setTimeout(() => {
      if (this.graphContainer && this.graphContainer.nativeElement) {
        this.initializeGraph();
        console.log('SVG created:', this.svg);
        this.createRandomGraph();
        console.log('Random graph created:', this.nodes, this.edges);
      } else {
        console.error('Graph container element not found');
      }
    }, 0);
  }

  initializeGraph(): void {
    // 获取容器的实际尺寸
    const containerRect = this.graphContainer.nativeElement.getBoundingClientRect();
    this.width = containerRect.width || 800;
    this.height = containerRect.height || 500;

    // 使用渲染服务初始化图形
    this.svg = this.graphRenderer.initializeGraph(
      this.graphContainer.nativeElement,
      this.width,
      this.height
    );
  }

  createRandomGraph(): void {
    this.clearGraph();
    // 创建节点
    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes.push({
        id: String.fromCharCode(65 + i), // A, B, C, ...
        color: '#69b3a2'
      });
    }

    // 创建边
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        if (Math.random() < this.edgeDensity) {
          const weight = Math.floor(Math.random() * 10) + 1;
          this.edges.push({
            id: `${this.nodes[i].id}-${this.nodes[j].id}`, // 使用 "sourceId-targetId" 格式
            source: this.nodes[i].id,
            target: this.nodes[j].id,
            weight: weight,
            color: '#999'
          });
        }
      }
    }

    if (this.nodes.length > 0) {
      this.startNode = this.nodes[0].id;
      this.endNode = this.nodes[this.nodes.length - 1].id;
    }

    // 应用力导向布局
    this.applyForceLayout();
  }

  clearGraph(): void {
    this.nodes = [];
    this.edges = [];
    this.algorithmSteps = [];
    this.currentStep = 0;
    this.currentAlgorithm = '';
    this.executionTime = 0;
    this.stopAnimation();

    if (this.svg) {
      this.svg.selectAll('*').remove();
      this.initializeGraph();
    }
  }

  renderGraph(): void {
    // 使用渲染服务渲染图形
    this.graphRenderer.renderGraph(this.svg, this.nodes, this.edges, this.simulation);

    // 设置模拟的tick事件
    if (this.simulation) {
      this.simulation.on('tick', () => {
        const links = this.svg.selectAll('.links line');
        const nodes = this.svg.selectAll('.nodes circle');
        const nodeLabels = this.svg.selectAll('.node-labels text');
        const edgeWeights = this.svg.selectAll('.edge-weights text');

        this.graphRenderer.updatePositions(links, nodes, nodeLabels, edgeWeights);
      });
    }
  }

  applyForceLayout(): void {
    console.log('Applying force layout');

    if (this.simulation) {
      this.simulation.stop();
    }

    // 确保宽度和高度正确
    const containerRect = this.graphContainer.nativeElement.getBoundingClientRect();
    this.width = containerRect.width || 800;
    this.height = containerRect.height || 500;

    // 使用渲染服务应用力导向布局
    this.simulation = this.graphRenderer.createForceLayout(
      this.nodes,
      this.edges,
      this.width,
      this.height
    );

    console.log('Simulation created:', this.simulation);

    // 在应用布局后渲染图
    this.renderGraph();
  }

  // 算法调用
  runDijkstra(): void {
    if (!this.startNode || !this.endNode) return;

    this.currentAlgorithm = 'Dijkstra最短路径算法';
    const result = this.dijkstraService.runDijkstra(
      this.nodes,
      this.edges,
      this.startNode,
      this.endNode
    );

    this.algorithmSteps = result.steps;
    this.executionTime = result.executionTime;
    this.currentStep = 0;
    this.showStep(0);
  }

  runPrim(): void {
    this.currentAlgorithm = 'Prim最小生成树算法';
    const startNode = this.startNode || this.nodes[0].id;

    const result = this.primService.runPrim(
      this.nodes,
      this.edges,
      startNode
    );

    this.algorithmSteps = result.steps;
    this.executionTime = result.executionTime;
    this.currentStep = 0;
    this.showStep(0);
  }

  runKruskal(): void {
    this.currentAlgorithm = 'Kruskal最小生成树算法';

    const result = this.kruskalService.runKruskal(
      this.nodes,
      this.edges
    );

    this.algorithmSteps = result.steps;
    this.executionTime = result.executionTime;
    this.currentStep = 0;
    this.showStep(0);
  }

  // 动画控制
  showStep(stepIndex: number): void {
    if (stepIndex < 0 || stepIndex >= this.algorithmSteps.length) return;

    this.currentStep = stepIndex;
    const step = this.algorithmSteps[stepIndex];

    // 创建节点ID到步骤节点的映射
    const nodeMap = new Map();
    step.nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });

    // 更新节点颜色，但保持位置不变
    this.svg.selectAll('circle')
      .data(this.nodes)
      .attr('fill', (d: Node) => {
        const stepNode = nodeMap.get(d.id);
        return stepNode ? stepNode.color : d.color;
      });

    // 创建边的唯一标识符到步骤边的映射
    const edgeMap = new Map();
    step.edges.forEach(edge => {
      // 创建边的唯一标识符
      // 处理 source 和 target 可能是对象的情况
      const sourceId = typeof edge.source === 'object' ? (edge.source as any).id : edge.source;
      const targetId = typeof edge.target === 'object' ? (edge.target as any).id : edge.target;

      // 创建边的唯一标识符
      const edgeId = `${sourceId}-${targetId}`;
      const reverseEdgeId = `${targetId}-${sourceId}`;
      edgeMap.set(edgeId, edge);
      edgeMap.set(reverseEdgeId, edge); // 处理无向图
    });

    // 更新边颜色
    this.svg.selectAll('line')
      .data(this.edges)
      .attr('stroke', (d: Edge) => {
        // 处理 source 和 target 可能是对象的情况
        const sourceId = typeof d.source === 'object' ? (d.source as any).id : d.source;
        const targetId = typeof d.target === 'object' ? (d.target as any).id : d.target;

        const edgeId = `${sourceId}-${targetId}`;
        console.log('Edge ID:', edgeId);
        console.log('edgeMap :', edgeMap);
        const stepEdge = edgeMap.get(edgeId);
        console.log('Step Edge:', stepEdge);
        return stepEdge ? stepEdge.color : d.color;
      });
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  nextStep(): void {
    if (this.currentStep < this.algorithmSteps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }

  playAnimation(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.animationInterval = setInterval(() => {
      if (this.currentStep < this.algorithmSteps.length - 1) {
        this.showStep(this.currentStep + 1);
      } else {
        this.stopAnimation();
      }
    }, this.animationSpeed);
  }

  stopAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    this.isPlaying = false;
  }
}