// game.js
import kaboom from "https://unpkg.com/kaboom@0.5.1/dist/kaboom.mjs";

// Initialize context with all needed functions
const k = kaboom({
  width: 800,
  height: 600,
  background: [0, 0, 30],
  global: true,
});

// Game state
let gameOver = false;
let SCORE = 0;

// Game constants
const PLAYER_SPEED = 300;
const BULLET_SPEED = 600;
const ENEMY_SPEED = 100;

// Scene setup
scene("game", () => {
  // Reset game state
  gameOver = false;
  SCORE = 0;

  // Player
  const player = add([
    rect(40, 40),
    pos(width() / 2, height() - 100),
    area(),
    color(0, 0, 255),
    "player",
  ]);

  // Score display
  const scoreLabel = add([
    text("Score: 0"),
    pos(10, 10),
    fixed(),
    {
      value: 0,
      update() {
        this.text = `Score: ${SCORE}`;
      },
    },
  ]);

  // Movement controls
  onKeyDown("a", () => {
    if (gameOver) return;
    player.moveBy(-PLAYER_SPEED * dt(), 0);
  });

  onKeyDown("d", () => {
    if (gameOver) return;
    player.moveBy(PLAYER_SPEED * dt(), 0);
  });

  // Keep player in bounds
  player.onUpdate(() => {
    if (player.pos.x < 0) {
      player.pos.x = 0;
    }
    if (player.pos.x > width() - 40) {
      player.pos.x = width() - 40;
    }
  });

  // Shooting
  onKeyPress("space", () => {
    if (gameOver) {
      go("game"); // Restart game
      return;
    }
    
    spawnBullet(player.pos.x + 18, player.pos.y);
  });

  function spawnBullet(x, y) {
    add([
      rect(4, 12),
      pos(x, y),
      color(255, 255, 0),
      area(),
      "bullet",
      {
        update() {
          this.moveBy(0, -BULLET_SPEED * dt());
          if (this.pos.y < -50) {
            destroy(this);
          }
        },
      },
    ]);
  }

  // Enemy spawning using loop
  let spawnTime = 0;
  onUpdate(() => {
    if (gameOver) return;
    
    spawnTime += dt();
    if (spawnTime >= randi(1, 3)) {
      spawnEnemy();
      spawnTime = 0;
    }
  });

  function spawnEnemy() {
    add([
      rect(40, 40),
      pos(randi(0, width() - 40), -40),
      area(),
      color(255, 0, 0),
      "enemy",
      {
        update() {
          this.moveBy(0, ENEMY_SPEED * dt());
          if (this.pos.y > height() + 50) {
            destroy(this);
          }
        },
      },
    ]);
  }

  // Collisions
  onCollide("bullet", "enemy", (bullet, enemy) => {
    destroy(bullet);
    destroy(enemy);
    SCORE += 10;
    addExplodingParticles(enemy.pos);
  });

  onCollide("enemy", "player", (enemy) => {
    if (gameOver) return;
    
    destroy(enemy);
    gameOver = true;
    addGameOverScreen();
  });

  function addExplodingParticles(p) {
    for (let i = 0; i < 8; i++) {
      add([
        rect(4, 4),
        pos(p),
        color(255, 255, 0),
        "particle",
        {
          vel: Vec2.fromAngle(rand(0, 360)).scale(rand(50, 100)),
          update() {
            this.moveBy(this.vel.scale(dt()));
          },
          lifespan: 0.5,
          timer: 0,
          update() {
            this.timer += dt();
            if (this.timer >= this.lifespan) {
              destroy(this);
            }
          },
        },
      ]);
    }
  }

  function addGameOverScreen() {
    add([
      text("Game Over!\nScore: " + SCORE + "\nPress SPACE to restart", 
        { size: 32 }),
      pos(width() / 2, height() / 2),
      origin("center"),
      fixed(),
    ]);
  }

  // Instructions
  add([
    text("A/D to move, SPACE to shoot", 
      { size: 16 }),
    pos(10, height() - 30),
    color(255, 255, 255),
  ]);
});

// Start the game
go("game");
