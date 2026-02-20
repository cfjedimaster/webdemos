/**
 * Maze generation using recursive backtracker (depth-first search).
 * Grid: rows x cols. Each cell has 4 walls (N, E, S, W).
 * walls[cellIndex] = { n, e, s, w } booleans; true = wall present.
 */

const DIRECTIONS = [
  { name: 'n', dRow: -1, dCol: 0, opposite: 's' },
  { name: 's', dRow: 1, dCol: 0, opposite: 'n' },
  { name: 'e', dRow: 0, dCol: 1, opposite: 'w' },
  { name: 'w', dRow: 0, dCol: -1, opposite: 'e' },
];

/**
 * @param {number} rows
 * @param {number} cols
 * @returns {{ rows: number, cols: number, walls: Array<{n:boolean,e:boolean,s:boolean,w:boolean}> }}
 */
export function generateMaze(rows, cols) {
  const total = rows * cols;
  const walls = Array.from({ length: total }, () => ({ n: true, e: true, s: true, w: true }));

  function index(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return -1;
    return r * cols + c;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carve(r, c) {
    const order = shuffle([...DIRECTIONS]);
    for (const dir of order) {
      const nr = r + dir.dRow;
      const nc = c + dir.dCol;
      const ni = index(nr, nc);
      if (ni === -1) continue;
      const cell = walls[index(r, c)];
      const neighbor = walls[ni];
      if (neighbor.n && neighbor.e && neighbor.s && neighbor.w) {
        cell[dir.name] = false;
        neighbor[dir.opposite] = false;
        carve(nr, nc);
      }
    }
  }

  carve(0, 0);
  return { rows, cols, walls };
}

/**
 * Check if we can move from (row, col) in direction 'n'|'s'|'e'|'w'.
 * @param {{ rows: number, cols: number, walls: Array }} maze
 * @param {number} row
 * @param {number} col
 * @param {string} dir
 * @returns {boolean}
 */
export function canMove(maze, row, col, dir) {
  const idx = row * maze.cols + col;
  if (idx < 0 || idx >= maze.walls.length) return false;
  return !maze.walls[idx][dir];
}
