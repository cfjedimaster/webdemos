import * as THREE from 'three';
import { generateMaze, canMove } from './maze.js';

const MAZE_ROWS = 15;
const MAZE_COLS = 15;
const CELL_SIZE = 1;
const WALL_HEIGHT = 1.8;
const EYE_HEIGHT = 0.9;
const TURN_SPEED = 0.08;
const MOVE_SPEED = 4; // world units per second (smooth, like turning)
const WALL_MARGIN = 0.22; // keep this far from walls so camera never clips through

const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2a38);
scene.fog = new THREE.Fog(0x2a2a38, 14, 35);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Lighting – bright so the maze is easy to see
const ambient = new THREE.AmbientLight(0xb0c0e0, 1.4);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
dirLight.position.set(MAZE_COLS / 2, 18, MAZE_ROWS / 2);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
dirLight.shadow.camera.left = dirLight.shadow.camera.bottom = -20;
dirLight.shadow.camera.right = dirLight.shadow.camera.top = 20;
scene.add(dirLight);

const maze = generateMaze(MAZE_ROWS, MAZE_COLS);

// Procedural rocky texture: color variation + bump for depth
function makeRockyTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const bumpData = new Uint8Array(size * size);
  const seed = Math.random() * 1000;
  function noise(x, y) {
    const n = Math.sin(x * 2.7 + seed) * Math.cos(y * 1.3) + Math.sin((x + y) * 1.1) * 0.5;
    return (n + 1) * 0.5;
  }
  function smoothNoise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const a = noise(ix, iy), b = noise(ix + 1, iy), c = noise(ix, iy + 1), d = noise(ix + 1, iy + 1);
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 4, ny = (y / size) * 4;
      const n = smoothNoise(nx, ny) * 0.7 + smoothNoise(nx * 2, ny * 2) * 0.25 + smoothNoise(nx * 4, ny * 4) * 0.05;
      const crack = Math.pow(smoothNoise(nx * 1.5 + 10, ny * 1.5), 2);
      const dark = 0.4 + 0.5 * n;
      const r = Math.floor(120 * dark + 30 * (1 - crack));
      const g = Math.floor(70 * dark + 20 * (1 - crack));
      const b = Math.floor(55 * dark + 15 * (1 - crack));
      const i = (y * size + x) * 4;
      data[i] = Math.min(255, r);
      data[i + 1] = Math.min(255, g);
      data[i + 2] = Math.min(255, b);
      data[i + 3] = 255;
      bumpData[y * size + x] = Math.floor(128 + 80 * (n - 0.5));
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');
  const bumpImageData = bctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    bumpImageData.data[i * 4] = bumpData[i];
    bumpImageData.data[i * 4 + 1] = bumpData[i];
    bumpImageData.data[i * 4 + 2] = bumpData[i];
    bumpImageData.data[i * 4 + 3] = 255;
  }
  bctx.putImageData(bumpImageData, 0, 0);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);
  return { map, bumpMap };
}

const { map: rockyMap, bumpMap: rockyBump } = makeRockyTexture(256);
const wallMaterial = new THREE.MeshStandardMaterial({
  map: rockyMap,
  bumpMap: rockyBump,
  bumpScale: 0.35,
  color: 0xffffff,
  roughness: 0.85,
  metalness: 0.02,
});
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x383848,
  roughness: 0.8,
  metalness: 0,
});

// Floor
const floorGeom = new THREE.PlaneGeometry(MAZE_COLS * CELL_SIZE, MAZE_ROWS * CELL_SIZE);
const floor = new THREE.Mesh(floorGeom, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.set((MAZE_COLS * CELL_SIZE) / 2, 0, (MAZE_ROWS * CELL_SIZE) / 2);
floor.receiveShadow = true;
scene.add(floor);

// Walls: draw north and west per cell; then south row and east column
const wallGeom = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, 0.08);
const wallGeomW = new THREE.BoxGeometry(0.08, WALL_HEIGHT, CELL_SIZE);

for (let r = 0; r < maze.rows; r++) {
  for (let c = 0; c < maze.cols; c++) {
    const idx = r * maze.cols + c;
    const w = maze.walls[idx];

    if (w.n) {
      const wall = new THREE.Mesh(wallGeom, wallMaterial);
      wall.position.set(c * CELL_SIZE + CELL_SIZE / 2, WALL_HEIGHT / 2, r * CELL_SIZE);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    }
    if (w.w) {
      const wall = new THREE.Mesh(wallGeomW, wallMaterial);
      wall.position.set(c * CELL_SIZE, WALL_HEIGHT / 2, r * CELL_SIZE + CELL_SIZE / 2);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    }
  }
}
// South boundary
for (let c = 0; c < maze.cols; c++) {
  const idx = (maze.rows - 1) * maze.cols + c;
  if (maze.walls[idx].s) {
    const wall = new THREE.Mesh(wallGeom, wallMaterial);
    wall.position.set(c * CELL_SIZE + CELL_SIZE / 2, WALL_HEIGHT / 2, maze.rows * CELL_SIZE);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  }
}
// East boundary
for (let r = 0; r < maze.rows; r++) {
  const idx = r * maze.cols + (maze.cols - 1);
  if (maze.walls[idx].e) {
    const wall = new THREE.Mesh(wallGeomW, wallMaterial);
    wall.position.set(maze.cols * CELL_SIZE, WALL_HEIGHT / 2, r * CELL_SIZE + CELL_SIZE / 2);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  }
}

// Player state: continuous position (world units) and camera angle
let playerX = 0.5;
let playerZ = 0.5;
let cameraAngle = 0;

function getPlayerCell() {
  return { row: Math.floor(playerZ), col: Math.floor(playerX) };
}

// Face an open passage at start: look at the center of the adjacent open cell so we never face a wall.
function setInitialCameraFacing() {
  const { row, col } = getPlayerCell();
  const dirs = [
    { d: 'n', nextRow: -1, nextCol: 0 },
    { d: 'e', nextRow: 0, nextCol: 1 },
    { d: 's', nextRow: 1, nextCol: 0 },
    { d: 'w', nextRow: 0, nextCol: -1 },
  ];
  for (const { d, nextRow, nextCol } of dirs) {
    if (canMove(maze, row, col, d)) {
      const target = cellToWorld(row + nextRow, col + nextCol);
      camera.lookAt(target.x, EYE_HEIGHT, target.z);
      cameraAngle = camera.rotation.y;
      return;
    }
  }
}

function worldToCell(x, z) {
  const c = Math.floor(x / CELL_SIZE);
  const r = Math.floor(z / CELL_SIZE);
  return { row: r, col: c };
}

function cellToWorld(r, c) {
  return {
    x: c * CELL_SIZE + CELL_SIZE / 2,
    z: r * CELL_SIZE + CELL_SIZE / 2,
  };
}

camera.position.set(playerX, EYE_HEIGHT, playerZ);
camera.rotation.order = 'YXZ';
setInitialCameraFacing();

const keys = { forward: false, backward: false, left: false, right: false };

// Use e.code (physical key) so Up/Down are never confused with e.key (can vary by layout).
// ArrowUp = forward only, ArrowDown = backward only.
function clearAllKeys() {
  keys.forward = false;
  keys.backward = false;
  keys.left = false;
  keys.right = false;
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  switch (e.code) {
    case 'ArrowUp':
      keys.forward = true;
      keys.backward = false;
      e.preventDefault();
      break;
    case 'ArrowDown':
      keys.backward = true;
      keys.forward = false;
      e.preventDefault();
      break;
    case 'ArrowLeft':
      keys.left = true;
      e.preventDefault();
      break;
    case 'ArrowRight':
      keys.right = true;
      e.preventDefault();
      break;
  }
});
window.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'ArrowUp': keys.forward = false; break;
    case 'ArrowDown': keys.backward = false; break;
    case 'ArrowLeft': keys.left = false; break;
    case 'ArrowRight': keys.right = false; break;
  }
});
// Clear keys when window loses focus so no stuck state when returning
window.addEventListener('blur', clearAllKeys);

// Cheat: C key prints ASCII maze to console with @ at player position
function printMazeToConsole() {
  const R = maze.rows;
  const C = maze.cols;
  const lines = [];
  for (let i = 0; i <= 2 * R; i++) {
    let row = '';
    for (let j = 0; j <= 2 * C; j++) {
      if (i % 2 === 0 && j % 2 === 0) {
        row += '+';
      } else if (i % 2 === 0 && j % 2 === 1) {
        const cellRow = i / 2;
        const cellCol = (j - 1) / 2;
        if (cellRow === 0) row += maze.walls[cellCol].n ? '-' : ' ';
        else if (cellRow === R) row += maze.walls[(R - 1) * C + cellCol].s ? '-' : ' ';
        else row += maze.walls[cellRow * C + cellCol].n ? '-' : ' ';
      } else if (i % 2 === 1 && j % 2 === 0) {
        const cellRow = (i - 1) / 2;
        const cellCol = j / 2;
        if (cellCol === 0) row += maze.walls[cellRow * C].w ? '|' : ' ';
        else if (cellCol === C) row += maze.walls[cellRow * C + (C - 1)].e ? '|' : ' ';
        else row += maze.walls[cellRow * C + cellCol].w ? '|' : ' ';
      } else {
        const cellRow = (i - 1) / 2;
        const cellCol = (j - 1) / 2;
        const { row: pr, col: pc } = getPlayerCell();
        row += cellRow === pr && cellCol === pc ? '@' : ' ';
      }
    }
    lines.push(row);
  }
  console.log('\n' + lines.join('\n') + '\n');
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'c' || e.key === 'C') {
    printMazeToConsole();
    e.preventDefault();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Derive direction from the camera's actual look vector so turning never flips n/e/s/w.
const _forward = new THREE.Vector3();
function getFacingDirection() {
  camera.getWorldDirection(_forward);
  const x = _forward.x;
  const z = _forward.z;
  if (Math.abs(z) >= Math.abs(x)) return z <= 0 ? 'n' : 's';
  return x >= 0 ? 'e' : 'w';
}

function getBackDirection() {
  const d = getFacingDirection();
  if (d === 'n') return 's';
  if (d === 's') return 'n';
  if (d === 'e') return 'w';
  return 'e';
}

const m = WALL_MARGIN;

// Build list of solid wall segments (x1,z1, x2,z2) in world space - same as drawn geometry
function buildWallSegments() {
  const segs = [];
  const R = maze.rows;
  const C = maze.cols;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const idx = r * C + c;
      const w = maze.walls[idx];
      if (w.n) segs.push({ x1: c, z1: r, x2: c + 1, z2: r });
      if (w.s) segs.push({ x1: c, z1: r + 1, x2: c + 1, z2: r + 1 });
      if (w.w) segs.push({ x1: c, z1: r, x2: c, z2: r + 1 });
      if (w.e) segs.push({ x1: c + 1, z1: r, x2: c + 1, z2: r + 1 });
    }
  }
  return segs;
}
const wallSegments = buildWallSegments();

// Segment (ax1,az1)-(ax2,az2) vs (bx1,bz1)-(bx2,bz2). Returns t in [0,1] where hit, or >1 if no hit.
function segmentIntersect(ax1, az1, ax2, az2, bx1, bz1, bx2, bz2) {
  const adx = ax2 - ax1, adz = az2 - az1;
  const bdx = bx2 - bx1, bdz = bz2 - bz1;
  const denom = adx * bdz - adz * bdx;
  if (Math.abs(denom) < 1e-8) return 2;
  const t = ((bx1 - ax1) * bdz - (bz1 - az1) * bdx) / denom;
  const s = ((bx1 - ax1) * adz - (bz1 - az1) * adx) / denom;
  if (t >= 0 && t <= 1 && s >= 0 && s <= 1) return t;
  return 2;
}

// Move from (oldX,oldZ) by (dx,dz). Stop at first wall hit; keep player m away from walls.
function moveWithWallCollision(oldX, oldZ, dx, dz) {
  let endX = oldX + dx;
  let endZ = oldZ + dz;
  let minT = 1;
  const ax1 = oldX, az1 = oldZ, ax2 = endX, az2 = endZ;
  for (const w of wallSegments) {
    const t = segmentIntersect(ax1, az1, ax2, az2, w.x1, w.z1, w.x2, w.z2);
    if (t < minT && t > 0) minT = t;
  }
  if (minT < 1) {
    const dist = Math.sqrt(dx * dx + dz * dz) || 0.001;
    minT = Math.max(0, minT - m / dist);
    endX = oldX + minT * dx;
    endZ = oldZ + minT * dz;
  }
  playerX = Math.max(m, Math.min(maze.cols - m, endX));
  playerZ = Math.max(m, Math.min(maze.rows - m, endZ));
  // Tight clamp: keep at least m from current cell's walls
  const row = Math.floor(playerZ);
  const col = Math.floor(playerX);
  if (!canMove(maze, row, col, 'n')) playerZ = Math.max(playerZ, row + m);
  if (!canMove(maze, row, col, 's')) playerZ = Math.min(playerZ, row + 1 - m);
  if (!canMove(maze, row, col, 'w')) playerX = Math.max(playerX, col + m);
  if (!canMove(maze, row, col, 'e')) playerX = Math.min(playerX, col + 1 - m);
}

function update(dt) {
  if (keys.left) cameraAngle += TURN_SPEED;
  if (keys.right) cameraAngle -= TURN_SPEED;
  camera.rotation.y = cameraAngle;

  const dtSec = dt / 60;
  const oldX = playerX;
  const oldZ = playerZ;
  if (keys.forward || keys.backward) {
    camera.getWorldDirection(_forward);
    const sign = keys.forward ? 1 : -1;
    const dx = _forward.x * MOVE_SPEED * dtSec * sign;
    const dz = _forward.z * MOVE_SPEED * dtSec * sign;
    moveWithWallCollision(oldX, oldZ, dx, dz);
  } else {
    playerX = Math.max(m, Math.min(maze.cols - m, playerX));
    playerZ = Math.max(m, Math.min(maze.rows - m, playerZ));
  }

  camera.position.x = playerX;
  camera.position.y = EYE_HEIGHT;
  camera.position.z = playerZ;
}

let last = performance.now();
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt = Math.min((now - last) / 16.67, 3);
  last = now;
  update(dt);
  renderer.render(scene, camera);
}
loop();
