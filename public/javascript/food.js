export let foodPositions = new Array();

const allPositions = new Array();



export const remove = (positionToRemove) => {
  foodPositions = foodPositions.filter(position => !(position.x === positionToRemove.x && position.y === positionToRemove.y));
}

const calculateFreePositions = (occupiedPositions) => {
  return allPositions.filter(position => !occupiedPositions.some(occupied => (occupied.x === position.x && occupied.y === position.y)));
}

export const add = (occupiedPositions) => {
  const freePositions = calculateFreePositions(occupiedPositions);
  if (freePositions.length <= 0) return;

  const newFoodIndex = Math.floor(Math.random() * freePositions.length);
  const newPosition = freePositions[newFoodIndex];
  foodPositions.push(newPosition);
}

export const initialize = (occupiedPositions) => {
  for(let x = 0; x < 21; x++) {
    for (let y = 0; y < 21; y++) {
      allPositions.push({x: x, y: y});
    }
  }

  const foodAmount = gamemodeInfo.food_amount;

  for (let i = 0; i < foodAmount; i++) {
    add([...occupiedPositions, ...foodPositions]);
  }
}