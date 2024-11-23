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
  const bullet = add([
    rect(4, 12), // Bullet shape
    pos(x, y),
    color(255, 255, 0), // Yellow bullets
    area(),
    move(UP, BULLET_SPEED),
    "bullet",
  ]);

  // Destroy bullet when it goes off screen
  bullet.onUpdate(() => {
    if (bullet.pos.y < -50) {
      destroy(bullet);
    }
  });
}

// Enemy spawning
function spawnEnemy() {
  const enemy = add([
    rect(40, 40),
    pos(rand(0, width() - 40), -40), // Random x position, start above screen
    area(),
    color(255, 0, 0), // Red enemies
    move(DOWN, ENEMY_SPEED),
    "enemy",
  ]);

  // Destroy enemy when it goes off screen
  enemy.onUpdate(() => {
    if (enemy.pos.y > height() + 50) {
      destroy(enemy);
    }
  });

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
    const particle = add([
      rect(4, 4),
      pos(enemy.pos),
      color(255, 255, 0),
      move(rand() < 0.5 ? UP : DOWN, rand(60, 120)),
    ]);
    
    // Destroy particle after 0.5 seconds
    wait(0.5, () => {
      destroy(particle);
    });
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
  
  // Stop spawning enemies
  player.paused = true;
  
  // Restart game on space
  onKeyPress("space", () => {
    location.reload(); // Simple way to restart
  });
});

// Instructions
add([
  text("A/D to move, SPACE to shoot", { size: 16 }),
  pos(10, height() - 30),
  color(255, 255, 255),
]);
