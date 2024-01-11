export const obstaclePositions = new Array();
const allPositions = new Array();

const calculateFreePositions = (occupiedPositions) => {
  return allPositions.filter(position => !occupiedPositions.some(occupied => (occupied.x === position.x && occupied.y === position.y)));
}

const add = (occupiedPositions) => {
  const freePositions = calculateFreePositions(occupiedPositions);
  if (freePositions.length <= 0) return;

  const newObstacleIndex = Math.floor(Math.random() * freePositions.length);
  const newPosition = freePositions[newObstacleIndex];
  obstaclePositions.push(newPosition);
}

export const initialize = (occupiedPositions) => {
  for(let x = 0; x < 21; x++) {
    for (let y = 0; y < 21; y++) {
      allPositions.push({x: x, y: y});
    }
  }

  const obstacleAmount = gamemodeInfo.obstacle_amount;

  for (let i = 0; i < obstacleAmount; i++) {
    add([...occupiedPositions, ...obstaclePositions]);
  }
}