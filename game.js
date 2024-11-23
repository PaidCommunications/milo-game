// game.js
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";

// Initialize game context
kaboom({
  width: 800,
  height: 600,
  background: [ 135, 206, 235 ],
});

// Load sprites
loadBean();

// Game constants
const PLAYER_SPEED = 200;
const JUMP_FORCE = 550;

// Player component
const player = add([
  sprite("bean"),  // Using built-in bean sprite for now
  pos(100, 500),   // Starting position
  area(),          // For collisions
  body(),          // Add physics
  scale(0.7),      // Make the sprite smaller
  color(0, 0, 255) // Blue tint
]);

// Add wooden-looking platforms
const makePlatform = (x, y, width) => {
  const platform = add([
    rect(width, 20),
    pos(x, y),
    area(),
    body({ isStatic: true }),
    color(139, 69, 19),
    "platform"
  ]);

  // Add wood grain lines
  for (let i = 0; i < width; i += 20) {
    add([
      rect(2, 20),
      pos(x + i, y),
      color(101, 67, 33),
      "grain"
    ]);
  }

  return platform;
};

// Create platforms
const platformPositions = [
  [100, 400, 200],  // [x, y, width]
  [400, 300, 200],
  [200, 200, 200],
];

platformPositions.forEach(([x, y, w]) => makePlatform(x, y, w));

// Controls - Added multiple options for jumping
onKeyDown("a", () => {
  player.move(-PLAYER_SPEED, 0);
});

onKeyDown("d", () => {
  player.move(PLAYER_SPEED, 0);
});

// Multiple jump controls
onKeyPress(["w", "space", "up"], () => {
  if (player.isGrounded()) {
    player.jump(JUMP_FORCE);
  }
});

// Add touch controls for mobile
onClick(() => {
  if (player.isGrounded()) {
    player.jump(JUMP_FORCE);
  }
});

// Add ground
const GROUND_HEIGHT = 50;
add([
  rect(width(), GROUND_HEIGHT),
  pos(0, height() - GROUND_HEIGHT),
  area(),
  body({ isStatic: true }),
  color(139, 69, 19),
  "ground"
]);

// Keep player in bounds
player.onUpdate(() => {
  // Left boundary
  if (player.pos.x < 0) {
    player.pos.x = 0;
  }
  // Right boundary
  if (player.pos.x > width() - 20) {
    player.pos.x = width() - 20;
  }
  // Bottom boundary (fall detection)
  if (player.pos.y > height()) {
    player.pos = vec2(100, height() - 100);
  }
});

// Updated instructions to show all controls
add([
  text("Use W/SPACE/UP to jump, A/D to move", { size: 16 }),
  pos(10, 10),
  fixed(),
  color(0, 0, 0)
]);

// Add mobile instructions
add([
  text("Tap screen to jump on mobile", { size: 16 }),
  pos(10, 30),
  fixed(),
  color(0, 0, 0)
]);
