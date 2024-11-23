// game.js
import kaboom from "https://unpkg.com/kaboom@0.5.1/dist/kaboom.mjs";

// Initialize with explicit background color
kaboom({
  width: 800,
  height: 600,
  background: [0, 0, 30], // Dark blue space background
  debug: true
});

// Basic scene setup
scene("game", () => {
  // Add player - using simple shapes first to verify rendering
  const player = add([
    rect(40, 40),             // Simple rectangle for now
    pos(width() / 2, 500),    // Position near bottom
    area(),                   // For collisions
    color(0, 0, 255),         // Blue color
    "player"
  ]);

  // Basic movement
  onKeyDown("a", () => {
    player.moveBy(-200 * dt(), 0);
  });

  onKeyDown("d", () => {
    player.moveBy(200 * dt(), 0);
  });

  // Simple shooting
  onKeyPress("space", () => {
    add([
      rect(4, 10),           // Bullet shape
      pos(player.pos.x + 18, player.pos.y),
      color(255, 255, 0),    // Yellow bullet
      area(),
      move(UP, 400),
      "bullet"
    ]);
  });

  // Add a single test enemy
  add([
    rect(40, 40),
    pos(width() / 2, 100),
    color(255, 0, 0),
    area(),
    "enemy"
  ]);

  // Basic collision
  onCollide("bullet", "enemy", (bullet, enemy) => {
    destroy(bullet);
    destroy(enemy);
  });

  // Debug text to verify rendering
  add([
    text("Test Game Running", { size: 16 }),
    pos(10, 10),
    color(255, 255, 255)
  ]);
});

// Start game
go("game");
