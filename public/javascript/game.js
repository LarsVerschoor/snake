import {
  initialize as initializeSnake,
  update as updateSnake,
  increment as incrementSnake,
  snakePositions
} from './snake.js';

import {
  initialize as initializeObstacles,
  obstaclePositions
} from './obstacles.js';

import {
  initialize as initializeFood,
  remove as removeFood,
  add as addFood,
  foodPositions 
} from './food.js';

import { changeDirection } from './movement2.js';

export let gameRunning = false;
let gameEnd = false;
let previousRenderTimestampInMs = 0;
let grid = new Array();

const renderGame = () => {
  // remove all snake, food and obstacle elements
  grid.forEach(row => {
    row.forEach(gridItem => {
      while(gridItem.element.lastElementChild) {
        gridItem.element.removeChild(gridItem.element.lastElementChild);
      }
    })
  })
  // render snake
  snakePositions.forEach((position, index) => {
    const gridElement = grid[20 - position.y][position.x].element;
    const newElement = document.createElement('div');
    newElement.classList = 'snake';
    if (index === 0) newElement.classList.add('head');
    gridElement.appendChild(newElement);
  })
  // render food
  foodPositions.forEach(position => {
    const gridElement = grid[20 - position.y][position.x].element;
    const newElement = document.createElement('div');
    newElement.classList = 'food';
    gridElement.appendChild(newElement);
  })
  // render obstacles
  obstaclePositions.forEach(position => {
    const gridElement = grid[20 - position.y][position.x].element;
    const newElement = document.createElement('div');
    newElement.classList = 'obstacle';
    gridElement.appendChild(newElement);
  })
  // render score
  const scoreElement = document.getElementById('currentScore');
  scoreElement.innerText = `Current: ${snakePositions.length - 1}`
}

const main = (timestampInMs) => {
  if (!gameRunning || gameEnd) return;

  const deltaTimeInMs = timestampInMs - previousRenderTimestampInMs;
  if (deltaTimeInMs >= 1000 / gamemodeInfo.speed) {
    previousRenderTimestampInMs = timestampInMs;

    changeDirection();
    updateSnake();

    // if food eaten
    foodPositions.forEach((foodPosition, index) => {
      const snakeHead = snakePositions[0];
      if (snakeHead.x === foodPosition.x && snakeHead.y === foodPosition.y) {
        incrementSnake();
        removeFood(foodPosition);
        addFood([...snakePositions, ...foodPositions, ...obstaclePositions]);
      }
    })

    // if tail eaten
    snakePositions.forEach((snakePosition, index) => {
      const snakeHead = snakePositions[0];
      if (index !== 0) {
        if (snakeHead.x === snakePosition.x && snakeHead.y === snakePosition.y) endGame("Your snake tried to eat it's tail!");
      }
    })

    // if obstacle eaten
    obstaclePositions.forEach(obstaclePosition => {
      const snakeHead = snakePositions[0];
      if (snakeHead.x === obstaclePosition.x && snakeHead.y === obstaclePosition.y) endGame('Your snake tried to eat an obstacle!');
    })

    if (!gameEnd) renderGame();
  }
  
  requestAnimationFrame(main);
}

const start = () => {
  gameRunning = true;
  requestAnimationFrame(main);
}

const togglePause = () => {
  gameRunning = !gameRunning;
  if (gameRunning) requestAnimationFrame(main);
}

const initialize = () => {
  // remove all children from game grid
  const gameGridDivElement = document.getElementById('gameGrid');
  while (gameGridDivElement.lastElementChild) {
    gameGridDivElement.removeChild(gameGridDivElement.lastElementChild);
  }

  // add 21x21 grid to the game grid
  grid = new Array();

  for(let x = 0; x < 21; x++) {
    const row = new Array();
    for(let y = 0; y < 21; y++) {
      const newElement = document.createElement('div');
      newElement.classList = 'grid-element';
      gameGridDivElement.appendChild(newElement);
      row.push({yPos: y, element: newElement});
    }
    grid.push(row);
  }

  // initialize snake
  initializeSnake();
  initializeObstacles([...snakePositions]);
  initializeFood([...snakePositions, ...obstaclePositions]);
}

// export const endGame = (message) => {
//   gameEnd = true;
//   gameRunning = false;
//   alert(`Game Over\n${message}\nScore: ${snakePositions.length - 1}`);
//   location.reload();
// }

export const endGame = async (message) => {
  gameEnd = true;
  gameRunning = false;
  const gameoverData = {
    gamemode_id: gamemodeInfo.id,
    score: snakePositions.length - 1,
    death_message: message
  }
  const response = await fetch('', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ gameoverData })
  });
  const rawData = await response.json();
  const result = JSON.parse(rawData);
  if (result.succes === 'succes') {
    console.log('true')
    window.location.href = '/death';
  }
}

document.querySelector('button[data-action="togglePause"]').addEventListener('click', togglePause)

initialize();
start();