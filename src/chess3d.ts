import * as THREE from 'three';
import { Board, Piece } from './types.js';

// Piece symbols mapping for 3D board
const pieceSymbols: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

export class Chess3DRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private squareSize: number = 1;
  private squares: THREE.Mesh[][] = [];
  private pieces: (THREE.Mesh | null)[][] = [];
  private selectedSquare: { row: number; col: number } | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onSquareClickCallback?: (row: number, col: number) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(4, 8, 10);
    this.camera.lookAt(3.5, 0, 3.5);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Add lights
    this.setupLights();

    // Create board
    this.createBoard();

    // Add event listeners
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Start animation loop
    this.animate();
  }

  private setupLights(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Spot light for dramatic effect
    const spotLight = new THREE.SpotLight(0xffffff, 0.3);
    spotLight.position.set(-5, 10, 5);
    this.scene.add(spotLight);
  }

  private createBoard(): void {
    const lightColor = 0xf0d9b5;
    const darkColor = 0xb58863;

    for (let row = 0; row < 8; row++) {
      this.squares[row] = [];
      this.pieces[row] = [];

      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        const geometry = new THREE.BoxGeometry(this.squareSize, 0.2, this.squareSize);
        const material = new THREE.MeshStandardMaterial({
          color: isLight ? lightColor : darkColor,
          roughness: 0.7,
          metalness: 0.1
        });

        const square = new THREE.Mesh(geometry, material);
        square.position.set(col * this.squareSize, 0, row * this.squareSize);
        square.receiveShadow = true;
        square.userData = { row, col, type: 'square' };

        this.scene.add(square);
        this.squares[row][col] = square;
        this.pieces[row][col] = null;
      }
    }
  }

  private createPiece(piece: Piece, row: number, col: number): THREE.Mesh {
    const pieceKey = piece.color === 'white'
      ? piece.type.toUpperCase()
      : piece.type.toLowerCase();
    const symbol = pieceSymbols[pieceKey];

    // Create a canvas texture with the chess piece symbol
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;

    // Draw piece symbol
    context.fillStyle = piece.color === 'white' ? '#ffffff' : '#333333';
    context.font = 'bold 100px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(symbol, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    // Create piece geometry (cylinder with flat top)
    const geometry = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 32);
    const material = new THREE.MeshStandardMaterial({
      color: piece.color === 'white' ? 0xf0f0f0 : 0x333333,
      roughness: 0.5,
      metalness: 0.2
    });

    const pieceMesh = new THREE.Mesh(geometry, material);
    pieceMesh.position.set(col * this.squareSize, 0.5, row * this.squareSize);
    pieceMesh.castShadow = true;
    pieceMesh.userData = { row, col, type: 'piece', piece };

    // Add symbol as a sprite on top
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.7, 0.7, 0.7);
    sprite.position.y = 0.4;
    pieceMesh.add(sprite);

    return pieceMesh;
  }

  public render(board: Board): void {
    // Clear existing pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.pieces[row][col]) {
          this.scene.remove(this.pieces[row][col]!);
          this.pieces[row][col] = null;
        }
      }
    }

    // Add new pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const pieceMesh = this.createPiece(piece, row, col);
          this.scene.add(pieceMesh);
          this.pieces[row][col] = pieceMesh;
        }
      }
    }
  }

  public highlightSquare(row: number, col: number, color: string): void {
    const square = this.squares[row][col];
    const material = square.material as THREE.MeshStandardMaterial;

    let highlightColor: number;
    switch (color) {
      case 'selected':
        highlightColor = 0x7fa650;
        break;
      case 'valid':
        highlightColor = 0x9ab87c;
        break;
      case 'check':
        highlightColor = 0xff6b6b;
        break;
      default:
        // Reset to original color
        const isLight = (row + col) % 2 === 0;
        highlightColor = isLight ? 0xf0d9b5 : 0xb58863;
    }

    material.color.setHex(highlightColor);
  }

  public clearHighlights(): void {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.squares[row][col];
        const material = square.material as THREE.MeshStandardMaterial;
        const isLight = (row + col) % 2 === 0;
        material.color.setHex(isLight ? 0xf0d9b5 : 0xb58863);
      }
    }
  }

  private onMouseClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check for intersections with squares and pieces
    const allObjects = [...this.squares.flat(), ...this.pieces.flat().filter(p => p !== null)] as THREE.Object3D[];
    const intersects = this.raycaster.intersectObjects(allObjects, true);

    if (intersects.length > 0) {
      let object = intersects[0].object;

      // If we clicked on a sprite, get its parent
      while (object.parent && !object.userData.row && object.userData.row !== 0) {
        object = object.parent;
      }

      const { row, col } = object.userData;
      if (row !== undefined && col !== undefined && this.onSquareClickCallback) {
        this.onSquareClickCallback(row, col);
      }
    }
  }

  public onSquareClick(callback: (row: number, col: number) => void): void {
    this.onSquareClickCallback = callback;
  }

  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    // Slow camera rotation for a dynamic view
    const time = Date.now() * 0.0001;
    this.camera.position.x = Math.sin(time) * 2 + 4;
    this.camera.position.z = Math.cos(time) * 2 + 10;
    this.camera.lookAt(3.5, 0, 3.5);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}
