import * as THREE from 'three';
import { generateMaze, canMove } from './maze.js';

const MAZE_ROWS = 15;
const MAZE_COLS = 15;
const CELL_SIZE = 1;
const WALL_HEIGHT = 1.8;
const EYE_HEIGHT = 0.9;
const TURN_SPEED = 0.08;
const MOVE_COOLDOWN_MS = 220;

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
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0xd07860,
  roughness: 0.8,
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

// Player state: grid cell and camera angle (radians). 0 = north (-Z), PI/2 = east (+X)
let playerRow = 0;
let playerCol = 0;
let cameraAngle = 0;

// Face an open passage at start: look at the center of the adjacent open cell so we never face a wall.
function setInitialCameraFacing() {
  const dirs = [
    { d: 'n', nextRow: -1, nextCol: 0 },
    { d: 'e', nextRow: 0, nextCol: 1 },
    { d: 's', nextRow: 1, nextCol: 0 },
    { d: 'w', nextRow: 0, nextCol: -1 },
  ];
  for (const { d, nextRow, nextCol } of dirs) {
    if (canMove(maze, playerRow, playerCol, d)) {
      const target = cellToWorld(playerRow + nextRow, playerCol + nextCol);
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

camera.position.set(cellToWorld(0, 0).x, EYE_HEIGHT, cellToWorld(0, 0).z);
camera.rotation.order = 'YXZ';
setInitialCameraFacing();

const keys = { forward: false, backward: false, left: false, right: false };
let lastForward = 0;
let lastBackward = 0;

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
        row += cellRow === playerRow && cellCol === playerCol ? '@' : ' ';
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

function tryMoveForward() {
  const dir = getFacingDirection();
  if (!canMove(maze, playerRow, playerCol, dir)) return;
  if (dir === 'n') playerRow -= 1;
  else if (dir === 's') playerRow += 1;
  else if (dir === 'e') playerCol += 1;
  else playerCol -= 1;
}

function tryMoveBackward() {
  const dir = getBackDirection();
  if (!canMove(maze, playerRow, playerCol, dir)) return;
  if (dir === 'n') playerRow -= 1;
  else if (dir === 's') playerRow += 1;
  else if (dir === 'e') playerCol += 1;
  else playerCol -= 1;
}

function clampCell() {
  playerRow = Math.max(0, Math.min(maze.rows - 1, playerRow));
  playerCol = Math.max(0, Math.min(maze.cols - 1, playerCol));
}

function update(dt) {
  if (keys.left) cameraAngle += TURN_SPEED;
  if (keys.right) cameraAngle -= TURN_SPEED;
  // Apply rotation before movement so getFacingDirection() (camera.getWorldDirection) matches what the player sees
  camera.rotation.y = cameraAngle;

  const t = performance.now();
  if (keys.forward && t - lastForward >= MOVE_COOLDOWN_MS) {
    tryMoveForward();
    lastForward = t;
  }
  if (keys.backward && t - lastBackward >= MOVE_COOLDOWN_MS) {
    tryMoveBackward();
    lastBackward = t;
  }
  clampCell();

  const { x, z } = cellToWorld(playerRow, playerCol);
  camera.position.x = x;
  camera.position.y = EYE_HEIGHT;
  camera.position.z = z;
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
