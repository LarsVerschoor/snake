USE snake;

-- Classic

INSERT INTO gamemodes (
  name,
  speed,
  food_amount,
  obstacle_amount,
  walls
) VALUES (
  'Classic',
  10,
  1,
  0,
  1
);

-- No walls

INSERT INTO gamemodes (
  name,
  speed,
  food_amount,
  obstacle_amount,
  walls
) VALUES (
  'No walls',
  10,
  1,
  0,
  0
);

-- Obstacles

INSERT INTO gamemodes (
  name,
  speed,
  food_amount,
  obstacle_amount,
  walls
) VALUES (
  'Obstacles',
  8,
  2,
  20,
  0
);

-- Speed

INSERT INTO gamemodes (
  name,
  speed,
  food_amount,
  obstacle_amount,
  walls
) VALUES (
  'Speed',
  18,
  2,
  0,
  0
);

-- Skill-issue

INSERT INTO gamemodes (
  name,
  speed,
  food_amount,
  obstacle_amount,
  walls
) VALUES (
  'Skill-issue',
  5,
  2,
  1,
  0
);

-- Food

INSERT INTO gamemodes (
  name,
  speed,
  food_amount,
  obstacle_amount,
  walls
) VALUES (
  'Food',
  10,
  4,
  0,
  0
);