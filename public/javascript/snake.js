import { direction } from './movement2.js'
import { endGame } from './game.js';

export const snakePositions = new Array();

export const update = () => {
  if (!direction) return;
  // move all segments to the segment before it
  for (let i = snakePositions.length - 1; i > 0; i--) {
    snakePositions[i] = {...snakePositions[i - 1]};
  }
  // move head segment in right direction
  snakePositions[0].x += direction.x;
  snakePositions[0].y += direction.y;
  
  if (gamemodeInfo.walls === 1) {
    // check if head through wall
    const head = snakePositions[0];
    if (
      head.x > 20 || head.x < 0 ||
      head.y > 20 || head.y < 0
    ) {
      endGame('The wall is not edible!');
      return;
    }
  }

  // teleport sections through walls
  snakePositions.forEach((position, index) => {
    if (position.x < 0) snakePositions[index].x = 21 + position.x;
    if (position.x > 20) snakePositions[index].x = 21 - position.x;
    if (position.y < 0) snakePositions[index].y = 21 + position.y;
    if (position.y > 20) snakePositions[index].y = 21 - position.y;
  })
}

export const increment = () => {
  snakePositions.push(snakePositions[snakePositions.length - 1]);
}

export const initialize = () => {
  snakePositions.push({x: 10, y: 10});
  snakePositions.push({x: 10, y: 9});
  snakePositions.push({x: 10, y: 8});
}

[
  {x: 1, y: 2},
  {x: 6, y: 17},
  {x: 4, y: 1},
  {x: 3, y: 1}
]

[
  {x: 7, y: 3},
  {x: 6, y: 7},
  {x: 24, y: 1},
  {x:12, y: 16}
]