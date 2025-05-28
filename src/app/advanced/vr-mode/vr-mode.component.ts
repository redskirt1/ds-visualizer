import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as THREE from 'three';
import { BPlusTreeService, BPlusTreeNode } from './bplus-tree.service';

@Component({
  selector: 'app-vr-mode',
  templateUrl: './vr-mode.component.html',
  styleUrls: ['./vr-mode.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class VrModeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('vrContainer', { static: true }) vrContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationId!: number;

  // B+ 树相关
  private treeObjects: THREE.Group[] = [];
  private nodeGeometry!: THREE.BoxGeometry;
  private keyGeometry!: THREE.PlaneGeometry;
  private lineMaterial!: THREE.LineBasicMaterial;
  private highlightedNodes: Set<string> = new Set();

  // 控制面板状态
  public isVRMode = false;

  // 键盘控制
  private keys: { [key: string]: boolean } = {};
  private moveSpeed = 0.5;

  // 示例数据
  public insertValues = '';
  public searchValue = '';
  public deleteValue = '';
  public searchResult = '';

  constructor(private bPlusTreeService: BPlusTreeService) {}

  ngOnInit(): void {
    // B+ 树由服务初始化
  }

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.createBPlusTreeVisualization();
    this.animate();
    this.addKeyboardControls();
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    // 移除键盘事件监听器
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
  }

  private initThreeJS(): void {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.vrContainer.nativeElement.clientWidth /
        this.vrContainer.nativeElement.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 20);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.vrContainer.nativeElement.clientWidth,
      this.vrContainer.nativeElement.clientHeight
    );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 添加到DOM
    this.vrContainer.nativeElement.appendChild(this.renderer.domElement);

    // 添加光源
    this.addLights();

    // 初始化几何体和材质
    this.initGeometries();

    // 添加鼠标控制
    this.addMouseControls();

    // 监听窗口大小变化
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private addLights(): void {
    // 环境光 - 增强亮度
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // 点光源用于增强效果
    const pointLight = new THREE.PointLight(0x4444ff, 0.3, 100);
    pointLight.position.set(-10, 10, -10);
    this.scene.add(pointLight);

    // 添加辅助光源
    const pointLight2 = new THREE.PointLight(0xff4444, 0.2, 100);
    pointLight2.position.set(10, -5, 10);
    this.scene.add(pointLight2);
  }

  private initGeometries(): void {
    // 节点几何体 - 增大尺寸
    this.nodeGeometry = new THREE.BoxGeometry(3, 0.8, 1.5);

    // 键值显示几何体
    this.keyGeometry = new THREE.PlaneGeometry(0.5, 0.5);

    // 连接线材质
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2,
    });
  }

  private addMouseControls(): void {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let cameraDistance = 20; // 相机距离单独管理

    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (event) => {
      if (!this.isVRMode) return; // 只有VR模式下才允许拖拽
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
      if (!isMouseDown || !this.isVRMode) return; // 只有VR模式下才允许拖拽

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      targetRotationY += deltaX * 0.01;
      targetRotationX += deltaY * 0.01;

      mouseX = event.clientX;
      mouseY = event.clientY;

      // 更新相机位置（只改变角度，不改变距离）
      this.updateCameraPositionWithDistance(
        targetRotationX,
        targetRotationY,
        cameraDistance
      );
    });

    canvas.addEventListener('mouseup', () => {
      isMouseDown = false;
    });

    canvas.addEventListener('wheel', (event) => {
      if (!this.isVRMode) return; // 只有VR模式下才允许缩放
      cameraDistance += event.deltaY * 0.01;
      cameraDistance = Math.max(5, Math.min(50, cameraDistance));
      this.updateCameraPositionWithDistance(
        targetRotationX,
        targetRotationY,
        cameraDistance
      );
    });
  }

  private updateCameraPositionWithDistance(
    rotX: number,
    rotY: number,
    distance: number
  ): void {
    const x = distance * Math.sin(rotY) * Math.cos(rotX);
    const y = distance * Math.sin(rotX);
    const z = distance * Math.cos(rotY) * Math.cos(rotX);

    this.camera.position.set(x, y + 5, z);
    this.camera.lookAt(0, 0, 0);
  }

  private createBPlusTreeVisualization(): void {
    this.clearTree();
    const root = this.bPlusTreeService.getRoot();
    if (!root) return;

    this.createTreeNode(root);
  }

  private createTreeNode(node: BPlusTreeNode): THREE.Group {
    const nodeGroup = new THREE.Group();
    nodeGroup.name = node.id;

    const position = node.position || { x: 0, y: 0, z: 0 };

    // 创建节点容器
    const isHighlighted = this.highlightedNodes.has(node.id);
    const nodeMaterial = new THREE.MeshLambertMaterial({
      color: isHighlighted ? 0xffff00 : node.isLeaf ? 0x00aa00 : 0x0066cc,
      transparent: true,
      opacity: 0.8,
    });

    const nodeWidth = Math.max(4, node.keys.length * 2.5);
    const nodeGeometry = new THREE.BoxGeometry(nodeWidth, 0.8, 1.5);
    const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
    nodeMesh.position.set(position.x, position.y, position.z);
    nodeMesh.castShadow = true;
    nodeMesh.receiveShadow = true;
    nodeGroup.add(nodeMesh);

    // 添加键值文本
    this.addKeysToNode(
      nodeGroup,
      node.keys,
      position.x,
      position.y + 0.6,
      position.z
    );

    // 添加节点边框
    const edgesGeometry = new THREE.EdgesGeometry(nodeGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: isHighlighted ? 0xffffff : 0x444444,
      linewidth: 2,
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edges.position.copy(nodeMesh.position);
    nodeGroup.add(edges);

    // 如果有子节点，递归创建
    if (node.children && !node.isLeaf) {
      node.children.forEach((child) => {
        const childGroup = this.createTreeNode(child);
        nodeGroup.add(childGroup);

        // 添加连接线
        if (child.position) {
          this.addConnectionLine(
            nodeGroup,
            position.x,
            position.y - 0.25,
            position.z,
            child.position.x,
            child.position.y + 0.25,
            child.position.z
          );
        }
      });
    }

    // 添加叶子节点之间的链接
    if (node.isLeaf && node.next && node.next.position) {
      const linkGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(position.x + nodeWidth / 2, position.y, position.z),
        new THREE.Vector3(
          node.next.position.x - nodeWidth / 2,
          node.next.position.y,
          node.next.position.z
        ),
      ]);
      const linkLine = new THREE.Line(
        linkGeometry,
        new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 3 })
      );
      nodeGroup.add(linkLine);
    }

    this.scene.add(nodeGroup);
    this.treeObjects.push(nodeGroup);

    return nodeGroup;
  }

  private addKeysToNode(
    parent: THREE.Group,
    keys: number[],
    x: number,
    y: number,
    z: number
  ): void {
    keys.forEach((key, index) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 128;

      // 添加白色背景
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // 添加边框
      context.strokeStyle = '#333333';
      context.lineWidth = 4;
      context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

      // 绘制文字
      context.fillStyle = '#000000';
      context.font = 'bold 64px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(key.toString(), 128, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const geometry = new THREE.PlaneGeometry(1.8, 0.9);
      const textMesh = new THREE.Mesh(geometry, material);

      const keyX = x - ((keys.length - 1) * 2.2) / 2 + index * 2.2;
      textMesh.position.set(keyX, y, z + 0.1);
      parent.add(textMesh);
    });
  }

  private addConnectionLine(
    parent: THREE.Group,
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number
  ): void {
    const points = [
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3(x2, y2, z2),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, this.lineMaterial);
    parent.add(line);
  }

  private clearTree(): void {
    this.treeObjects.forEach((obj) => {
      this.scene.remove(obj);
    });
    this.treeObjects = [];
    this.highlightedNodes.clear();
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    // 键盘控制（只有VR模式下才生效）
    if (this.isVRMode) {
      this.handleKeyboardMovement();
    }

    this.renderer.render(this.scene, this.camera);
  }

  private handleKeyboardMovement(): void {
    const moveVector = new THREE.Vector3(0, 0, 0);

    // 获取相机的前进方向（水平面上的投影）
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0; // 只在水平面移动
    forward.normalize();

    // 获取相机的右方向（水平面上的投影）
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
    right.normalize();

    if (this.keys['w'] || this.keys['W']) {
      moveVector.add(forward.clone().multiplyScalar(this.moveSpeed));
    }
    if (this.keys['s'] || this.keys['S']) {
      moveVector.add(forward.clone().multiplyScalar(-this.moveSpeed));
    }
    if (this.keys['a'] || this.keys['A']) {
      moveVector.add(right.clone().multiplyScalar(-this.moveSpeed));
    }
    if (this.keys['d'] || this.keys['D']) {
      moveVector.add(right.clone().multiplyScalar(this.moveSpeed));
    }

    // 应用移动（相机和lookAt目标同时移动，保持相对距离）
    if (moveVector.length() > 0) {
      this.camera.position.add(moveVector);
      // 更新lookAt目标，保持相对关系
      const lookAtTarget = new THREE.Vector3();
      this.camera.getWorldDirection(lookAtTarget);
    }
  }

  private onWindowResize(): void {
    this.camera.aspect =
      this.vrContainer.nativeElement.clientWidth /
      this.vrContainer.nativeElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      this.vrContainer.nativeElement.clientWidth,
      this.vrContainer.nativeElement.clientHeight
    );
  }

  // 公共方法
  public toggleVRMode(): void {
    this.isVRMode = !this.isVRMode;
    if (this.isVRMode) {
      this.enterVRMode();
    } else {
      this.exitVRMode();
    }
  }

  public resetView(): void {
    this.camera.position.set(0, 10, 20);
    this.camera.lookAt(0, 0, 0);
  }

  public insertKey(): void {
    const values = this.insertValues
      .split(',')
      .map((v) => parseInt(v.trim()))
      .filter((v) => !isNaN(v));
    if (values.length > 0) {
      values.forEach((value) => {
        this.bPlusTreeService.insert(value);
      });
      this.createBPlusTreeVisualization();
      this.insertValues = '';
      this.searchResult = `已插入值: ${values.join(', ')}`;
    }
  }

  public searchKey(): void {
    const value = parseInt(this.searchValue);
    if (!isNaN(value)) {
      const result = this.bPlusTreeService.search(value);
      this.highlightSearchPath(result.path);
      this.searchValue = '';
      this.searchResult = result.found
        ? `找到值 ${value}，搜索路径已高亮显示`
        : `未找到值 ${value}，显示搜索路径`;
    }
  }

  public deleteKey(): void {
    const value = parseInt(this.deleteValue);
    if (!isNaN(value)) {
      const success = this.bPlusTreeService.delete(value);
      this.createBPlusTreeVisualization();
      this.deleteValue = '';
      this.searchResult = success
        ? `成功删除值 ${value}`
        : `值 ${value} 不存在，无法删除`;
    }
  }

  public resetTree(): void {
    this.bPlusTreeService.reset();
    this.createBPlusTreeVisualization();
    this.searchResult = '已重置为默认 B+ 树';
  }

  private enterVRMode(): void {
    this.camera.position.set(0, 15, 25);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.searchResult = 'VR 模式已启用 - 使用鼠标拖拽和滚轮探索三维空间';
  }

  private exitVRMode(): void {
    this.resetView();
    this.searchResult = '已退出 VR 模式';
  }

  private highlightSearchPath(path: BPlusTreeNode[]): void {
    // 清除之前的高亮
    this.highlightedNodes.clear();

    // 高亮搜索路径中的节点
    path.forEach((node) => {
      this.highlightedNodes.add(node.id);
    });

    // 重新创建可视化以显示高亮
    this.createBPlusTreeVisualization();

    // 动画高亮效果
    path.forEach((node, index) => {
      setTimeout(() => {
        const nodeObject = this.scene.getObjectByName(node.id);
        if (nodeObject) {
          const mesh = nodeObject.children.find(
            (child) => child instanceof THREE.Mesh
          ) as THREE.Mesh;
          if (mesh) {
            const material = mesh.material as THREE.MeshLambertMaterial;
            material.emissive.setHex(0x444400);
            setTimeout(() => {
              material.emissive.setHex(0x000000);
            }, 1000);
          }
        }
      }, index * 300);
    });
  }

  private addKeyboardControls(): void {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.keys[event.key] = true;
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys[event.key] = false;
  }
}
