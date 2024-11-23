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
let canRestart = false;
let SCORE = 0;

// Game constants
const PLAYER_SPEED = 300;
const BULLET_SPEED = 600;
const ENEMY_SPEED = 100;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;

// Scene setup
scene("game", () => {
  // Reset game state
  gameOver = false;
  canRestart = false;
  SCORE = 0;

  // Player
  const player = add([
    rect(PLAYER_WIDTH, PLAYER_HEIGHT),
    pos(width() / 2, height() - 100),
    area(),
    color(0, 0, 255),
    {
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT
    },
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

  // Movement controls with smooth acceleration
  let playerVel = 0;
  const ACCEL = 1600;
  const DECEL = 2400;
  const MAX_SPEED = PLAYER_SPEED;

  onUpdate(() => {
    if (gameOver) return;

    // Handle movement with acceleration
    if (isKeyDown("a")) {
      playerVel = Math.max(playerVel - ACCEL * dt(), -MAX_SPEED);
    } else if (isKeyDown("d")) {
      playerVel = Math.min(playerVel + ACCEL * dt(), MAX_SPEED);
    } else {
      // Decelerate when no keys are pressed
      if (playerVel > 0) {
        playerVel = Math.max(0, playerVel - DECEL * dt());
      } else if (playerVel < 0) {
        playerVel = Math.min(0, playerVel + DECEL * dt());
      }
    }

    // Apply velocity
    player.moveBy(playerVel * dt(), 0);

    // Keep player in bounds
    if (player.pos.x < 0) {
      player.pos.x = 0;
      playerVel = 0;
    }
    if (player.pos.x > width() - player.width) {
      player.pos.x = width() - player.width;
      playerVel = 0;
    }
  });

  // Shooting
  let canShoot = true;
  const SHOOT_COOLDOWN = 0.25; // 250ms between shots

  onKeyDown("space", () => {
    if (gameOver) {
      if (canRestart) {
        go("game");
      }
      return;
    }
    
    if (canShoot) {
      spawnBullet(player.pos.x + player.width / 2 - 2, player.pos.y);
      canShoot = false;
      wait(SHOOT_COOLDOWN, () => {
        canShoot = true;
      });
    }
  });

  function spawnBullet(x, y) {
    add([
      rect(4, 12),
      pos(x, y),
      area(),
      color(255, 255, 0),
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

  // Enemy spawning with different types
  let spawnTime = 0;
  const SPAWN_TYPES = [
    { width: 40, height: 40, speed: ENEMY_SPEED, points: 10, color: rgb(255, 0, 0) },
    { width: 30, height: 30, speed: ENEMY_SPEED * 1.5, points: 20, color: rgb(255, 100, 0) },
    { width: 50, height: 50, speed: ENEMY_SPEED * 0.7, points: 30, color: rgb(200, 0, 0) },
  ];

  onUpdate(() => {
    if (gameOver) return;
    
    spawnTime += dt();
    if (spawnTime >= randi(1, 3)) {
      const type = choose(SPAWN_TYPES);
      spawnEnemy(type);
      spawnTime = 0;
    }
  });

  function spawnEnemy(type) {
    add([
      rect(type.width, type.height),
      pos(randi(0, width() - type.width), -type.height),
      area(),
      color(type.color),
      {
        speed: type.speed,
        points: type.points,
      },
      "enemy",
      {
        update() {
          this.moveBy(0, this.speed * dt());
          if (this.pos.y > height() + 50) {
            destroy(this);
          }
        },
      },
    ]);
  }

  // Collisions with improved particle effects
  onCollide("bullet", "enemy", (bullet, enemy) => {
    destroy(bullet);
    destroy(enemy);
    SCORE += enemy.points;
    addExplodingParticles(enemy.pos, enemy.color);
  });

  onCollide("enemy", "player", (enemy) => {
    if (gameOver) return;
    
    destroy(enemy);
    gameOver = true;
    addGameOverScreen();
    addExplodingParticles(player.pos, rgb(0, 0, 255));
  });

  function addExplodingParticles(p, color) {
    for (let i = 0; i < 12; i++) {
      const angle = (360 / 12) * i;
      const speed = rand(50, 150);
      add([
        rect(4, 4),
        pos(p),
        color,
        "particle",
        {
          vel: Vec2.fromAngle(angle).scale(speed),
          update() {
            this.moveBy(this.vel.scale(dt()));
            this.vel = this.vel.scale(0.95); // Slow down over time
          },
          lifespan: 0.8,
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
    
    wait(1, () => {
      canRestart = true;
    });
  }

  // Instructions
  add([
    text("A/D to move, SPACE to shoot", { size: 16 }),
    pos(10, height() - 30),
    fixed(),
    color(255, 255, 255),
  ]);
});

// Start the game
go("game");
