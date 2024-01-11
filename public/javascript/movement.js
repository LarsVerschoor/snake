import { gameRunning } from "./game.js";
export let direction = undefined
let currentDirectionKey = undefined;
let previousDirectionKey = 'w';

const keymaps = {
  w: {x: 0, y: 1},
  a: {x: -1, y: 0},
  s: {x: 0, y: -1},
  d: {x: 1, y: 0}
}

window.addEventListener('keydown', (e) => {
  const pressedKey = e.key.toLowerCase();
  if (keymaps[pressedKey] === undefined) return;
  if (
    pressedKey === 'w' && previousDirectionKey === 's' ||
    pressedKey === 'a' && previousDirectionKey === 'd' ||
    pressedKey === 's' && previousDirectionKey === 'w' ||
    pressedKey === 'd' && previousDirectionKey === 'a' ||
    !gameRunning
  ) return;
  currentDirectionKey = pressedKey;
})

export const getDirection = () => {
  if (!currentDirectionKey) return;
  
  direction = keymaps[currentDirectionKey];

  previousDirectionKey = currentDirectionKey;
  currentDirectionKey = undefined;
}