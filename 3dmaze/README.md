# 3D Maze Crawler

A first-person maze game: a random maze is generated, then rendered in 3D. Use the arrow keys to move and turn.

## How to run

ES modules require a local server. From the project folder:

```bash
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:3000` (or `http://localhost:8000`) in your browser.

## Controls

- **↑** — move forward  
- **↓** — move backward  
- **←** — turn left  
- **→** — turn right  

## Customization

In `js/game.js` you can change:

- `MAZE_ROWS` / `MAZE_COLS` — maze size (default 15×15)
- `WALL_HEIGHT` — height of walls
- `MOVE_COOLDOWN_MS` — delay between steps when holding a key (lower = faster movement)
