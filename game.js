// game.js
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";

// Initialize game context
kaboom({
  width: 800,
  height: 600,
  background: [0, 0, 30], // Dark blue space background
});

// Game constants
const PLAYER_SPEED = 300;
const BULLET_SPEED = 600;
const ENEMY_SPEED = 100;
let SCORE = 0;

// Player
const player = add([
  rect(40, 40), // Simple ship shape
  pos(width() / 2, height() - 100),
  area(),
  color(0, 0, 255), // Blue color for Milo
  {
    score: 0,
  },
  "player",
]);

// Score display
const scoreLabel = add([
  text("Score: 0", { size: 24 }),
  pos(10, 10),
  fixed(),
  { value: 0 },
]);

// Movement controls
onKeyDown("a", () => {
  player.move(-PLAYER_SPEED, 0);
});

onKeyDown("d", () => {
  player.move(PLAYER_SPEED, 0);
});

// Keep player in bounds
player.onUpdate(() => {
  if (player.pos.x < 0) {
    player.pos.x = 0;
  }
  if (player.pos.x > width() - player.width) {
    player.pos.x = width() - player.width;
  }
});

// Shooting mechanics
onKeyPress("space", () => {
  spawnBullet(player.pos.x + player.width / 2, player.pos.y);
});

function spawnBullet(x, y) {
  add([
    rect(4, 12), // Bullet shape
    pos(x, y),
    color(255, 255, 0), // Yellow bullets
    area(),
    move(UP, BULLET_SPEED),
    cleanup(), // Destroy when off screen
    "bullet",
  ]);
}

// Enemy spawning
function spawnEnemy() {
  const x = rand(0, width() - 40); // Random position
  add([
    rect(40, 40),
    pos(x, -40), // Start above screen
    area(),
    color(255, 0, 0), // Red enemies
    move(DOWN, ENEMY_SPEED),
    cleanup(),
    "enemy",
  ]);

  // Schedule next spawn
  wait(rand(0.5, 2), spawnEnemy);
}

// Start spawning enemies
spawnEnemy();

// Collision detection
onCollide("bullet", "enemy", (bullet, enemy) => {
  destroy(bullet);
  destroy(enemy);
  SCORE += 10;
  scoreLabel.text = `Score: ${SCORE}`;
  
  // Add explosion effect
  for (let i = 0; i < 10; i++) {
    add([
      rect(4, 4),
      pos(enemy.pos),
      color(255, 255, 0),
      move(rand(UP), rand(60, 120)),
      lifespan(0.5),
    ]);
  }
});

// Game over on player collision
onCollide("enemy", "player", (enemy) => {
  destroy(enemy);
  
  // Game over text
  add([
    text("Game Over!\nScore: " + SCORE + "\nSpace to restart", { size: 32 }),
    pos(width() / 2, height() / 2),
    anchor("center"),
  ]);
  
  // Stop the game
  player.paused = true;
  
  // Restart game on space
  onKeyPress("space", () => {
    go("game"); // Restart the current scene
  });
});

// Instructions
add([
  text("A/D to move, SPACE to shoot", { size: 16 }),
  pos(10, height() - 30),
  color(255, 255, 255),
]);
