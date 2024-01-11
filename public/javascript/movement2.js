import { gameRunning } from "./game.js";

export let direction = undefined;
let currentUserInput = undefined;
let previousDirection = 'up';

const directionsToObjects = {
  up: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: -1 },
  right: { x: 1, y: 0 }
};

export const changeDirection = () => {
  if (currentUserInput === 'left' && previousDirection !== 'right') {
    direction = directionsToObjects.left;
    previousDirection = 'left';
  } else if (currentUserInput === 'right' && previousDirection !== 'left') {
    direction = directionsToObjects.right;
    previousDirection = 'right';
  } else if (currentUserInput === 'up' && previousDirection !== 'down') {
    direction = directionsToObjects.up;
    previousDirection = 'up';
  } else if (currentUserInput === 'down' && previousDirection !== 'up') {
    direction = directionsToObjects.down;
    previousDirection = 'down';
  }
}

window.addEventListener('keydown', (e) => {
  if (!gameRunning) return;

  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'arrowup') {
    currentUserInput = 'up';
  } else if (key === 'a' || key === 'arrowleft') {
    currentUserInput = 'left';
  } else if (key === 's' || key === 'arrowdown') {
    currentUserInput = 'down';
  } else if (key === 'd' || key === 'arrowright') {
    currentUserInput = 'right';
  }
})

let touchStartX = undefined;
let touchStartY = undefined;

window.addEventListener('touchstart', (e) => {
  document.getElementById('test').innerText = '1'
  if (!gameRunning) return;
  document.getElementById('test').innerText = '2'

  console.log('touchstart')

  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
})

window.addEventListener('touchmove', (e) => {
  if (!gameRunning) return;
  if (touchStartX !== undefined || touchStartY !== undefined) return;

  console.log('edit')

  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
})

window.addEventListener('touchend', (e) => {
  if (!gameRunning) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const dX = touchEndX - touchStartX;
  const dY = touchEndY - touchStartY;

  if (dX === 0 && dY === 0) return;

  if (Math.abs(dX) > Math.abs(dY)) {
    currentUserInput = dX > 0 ? 'right' : 'left';
    console.log('swipe horizontal')
    // horizontal
  } else {
    // vertical
    currentUserInput = dY > 0 ? 'down' : 'up';
    console.log('swipe vertical')
  }

  touchStartX = undefined;
  touchStartY = undefined;
})

























// // Variables to track touch events
// let touchStartX;
// let touchStartY;

// window.addEventListener('keydown', handleKeyDown);

// window.addEventListener('touchstart', handleTouchStart);
// window.addEventListener('touchmove', handleTouchMove);

// export const getDirection = () => {
//   if (!currentDirectionKey) return;

//   direction = keymaps[currentDirectionKey];

//   previousDirectionKey = currentDirectionKey;
//   currentDirectionKey = undefined;
  
// };

// function handleKeyDown(e) {
//   const pressedKey = e.key.toLowerCase();
//   if (keymaps[pressedKey] === undefined) return;
//   if (
//     pressedKey === 'w' && previousDirectionKey === 's' ||
//     pressedKey === 'a' && previousDirectionKey === 'd' ||
//     pressedKey === 's' && previousDirectionKey === 'w' ||
//     pressedKey === 'd' && previousDirectionKey === 'a' ||
//     !gameRunning
//   ) return;
//   currentDirectionKey = pressedKey;
// }

// function handleTouchStart(event) {
//   touchStartX = event.touches[0].clientX;
//   touchStartY = event.touches[0].clientY;
// }

// function handleTouchMove(event) {
//   if (!gameRunning || !touchStartX || !touchStartY) return;

//   const touchEndX = event.touches[0].clientX;
//   const touchEndY = event.touches[0].clientY;

//   const deltaX = touchEndX - touchStartX;
//   const deltaY = touchEndY - touchStartY;

//   // Determine the predominant direction of the swipe
//   let newDirectionKey;
//   if (Math.abs(deltaX) > Math.abs(deltaY)) {
//     // Horizontal swipe
//     newDirectionKey = deltaX > 0 ? 'd' : 'a';
//   } else {
//     // Vertical swipe
//     newDirectionKey = deltaY > 0 ? 's' : 'w';
//   }

//   // Check if the new direction is not opposite to the previous direction
//   if (
//     (newDirectionKey === 'w' && previousDirectionKey === 's') ||
//     (newDirectionKey === 'a' && previousDirectionKey === 'd') ||
//     (newDirectionKey === 's' && previousDirectionKey === 'w') ||
//     (newDirectionKey === 'd' && previousDirectionKey === 'a')
//   ) {
//     newDirectionKey = undefined; // Reset the new direction if it's invalid
//   }

//   // Update the current direction key
//   currentDirectionKey = newDirectionKey;
//   document.getElementById('test').innerText = currentDirectionKey;

//   touchStartX = undefined;
//   touchStartY = undefined;
// }