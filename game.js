// game.js
import kaboom from "https://unpkg.com/kaboom@0.5.1/dist/kaboom.mjs";

// Initialize context with all needed functions
const k = kaboom({
  width: 800,
  height: 600,
  debug: true,
  global: true,
});

// Game state
let gameOver = false;
let canRestart = false;
let isPaused = false;
let SCORE = 0;

// Game constants
const PLAYER_SPEED = 300;
const BULLET_SPEED = 600;
const BASE_ENEMY_SPEED = 100;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const MAX_PARTICLES = 50;

// Scene setup
scene("game", () => {
  // Reset game state
  gameOver = false;
  canRestart = false;
  isPaused = false;
  SCORE = 0;
  
  // Player lives system
  let lives = 3;

  // Create starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push(add([
      rect(2, 2),
      pos(rand(0, width()), rand(0, height())),
      color(255, 255, 255),
      "star",
      {
        speed: rand(20, 50),
        update() {
          this.moveBy(0, this.speed * dt());
          if (this.pos.y > height()) {
            this.pos.y = 0;
            this.pos.x = rand(0, width());
          }
        }
      }
    ]));
  }

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

  // Lives display
  const livesLabel = add([
    text("Lives: " + lives),
    pos(10, 40),
    fixed(),
    {
      update() {
        this.text = `Lives: ${lives}`;
      }
    }
  ]);

  // Score display
  const scoreLabel = add([
    text("Score: 0"),
    pos(10, 10),
    fixed(),
    {
      update() {
        this.text = `Score: ${SCORE}`;
      }
    }
  ]);

  // Smooth movement with acceleration
  let playerVel = 0;
  const ACCEL = 1600;
  const DECEL = 2400;
  const MAX_SPEED = PLAYER_SPEED;

  onUpdate(() => {
    if (gameOver || isPaused) return;

    // Movement with acceleration
    if (isKeyDown("a")) {
      playerVel = Math.max(playerVel - ACCEL * dt(), -MAX_SPEED);
    } else if (isKeyDown("d")) {
      playerVel = Math.min(playerVel + ACCEL * dt(), MAX_SPEED);
    } else {
      // Decelerate
      if (playerVel > 0) {
        playerVel = Math.max(0, playerVel - DECEL * dt());
      } else if (playerVel < 0) {
        playerVel = Math.min(0, playerVel + DECEL * dt());
      }
    }

    // Apply velocity with boundary checking
    const newX = player.pos.x + playerVel * dt();
    if (newX >= 0 && newX <= width() - PLAYER_WIDTH) {
      player.pos.x = newX;
    } else {
      playerVel = 0;
      player.pos.x = Math.max(0, Math.min(width() - PLAYER_WIDTH, newX));
    }
  });

  // Shooting system with cooldown
  let canShoot = true;
  const SHOOT_COOLDOWN = 0.25;

  onKeyPress("space", () => {
    if (gameOver) {
      if (canRestart) go("game");
      return;
    }
    if (isPaused) return;
    
    if (canShoot) {
      spawnBullet(player.pos.x + PLAYER_WIDTH / 2 - 2, player.pos.y);
      canShoot = false;
      wait(SHOOT_COOLDOWN, () => {
        canShoot = true;
      });
    }
  });

  // Pause functionality
  onKeyPress("p", () => {
    if (!gameOver) {
      isPaused = !isPaused;
      add([
        text(isPaused ? "PAUSED" : "", { size: 32 }),
        pos(width() / 2, height() / 2),
        origin("center"),
        "pauseText",
      ]);
    }
  });

  // Enemy types with dynamic difficulty
  const SPAWN_TYPES = [
    { width: 40, height: 40, speed: BASE_ENEMY_SPEED, points: 10, color: rgb(255, 0, 0), 
      pattern: "straight" },
    { width: 30, height: 30, speed: BASE_ENEMY_SPEED * 1.5, points: 20, color: rgb(255, 100, 0),
      pattern: "zigzag" },
    { width: 50, height: 50, speed: BASE_ENEMY_SPEED * 0.7, points: 30, color: rgb(200, 0, 0),
      pattern: "sine" },
  ];

  function spawnBullet(x, y) {
    add([
      rect(4, 12),
      pos(x, y),
      area(),
      color(255, 255, 0),
      "bullet",
      {
        update() {
          if (isPaused) return;
          this.moveBy(0, -BULLET_SPEED * dt());
          if (this.pos.y < -50) destroy(this);
        }
      }
    ]);
  }

  // Enemy spawning with patterns
  let spawnTime = 0;
  let difficultyMultiplier = 1;

  onUpdate(() => {
    if (gameOver || isPaused) return;
    
    // Increase difficulty every 100 points
    difficultyMultiplier = 1 + Math.floor(SCORE / 100) * 0.1;
    
    spawnTime += dt();
    if (spawnTime >= randi(1, 3)) {
      const type = choose(SPAWN_TYPES);
      spawnEnemy(type);
      spawnTime = 0;
    }

    // Performance monitoring
    debug.log(`Objects: ${get("enemy").length + get("bullet").length + get("particle").length}`);
  });

  function spawnEnemy(type) {
    let xOffset = 0;
    const startX = randi(0, width() - type.width);
    
    add([
      rect(type.width, type.height),
      pos(startX, -type.height),
      area(),
      color(type.color),
      {
        speed: type.speed * difficultyMultiplier,
        points: type.points,
        time: 0,
        pattern: type.pattern,
      },
      "enemy",
      {
        update() {
          if (isPaused) return;
          
          this.time += dt();
          
          // Movement patterns
          switch (this.pattern) {
            case "zigzag":
              xOffset = Math.sin(this.time * 5) * 100;
              this.pos.x = startX + xOffset;
              break;
            case "sine":
              xOffset = Math.sin(this.time * 3) * 50;
              this.pos.x = startX + xOffset;
              break;
          }
          
          this.moveBy(0, this.speed * dt());
          
          if (this.pos.y > height() + 50) {
            destroy(this);
          }
        }
      }
    ]);
  }

  // Collision handling with lives system
  onCollide("bullet", "enemy", (bullet, enemy) => {
    if (isPaused) return;
    
    destroy(bullet);
    destroy(enemy);
    SCORE += enemy.points;
    addExplodingParticles(enemy.pos, enemy.color);
  });

  onCollide("enemy", "player", (enemy) => {
    if (gameOver || isPaused) return;
    
    destroy(enemy);
    lives--;
    addExplodingParticles(player.pos, rgb(0, 0, 255));
    
    if (lives <= 0) {
      gameOver = true;
      addGameOverScreen();
    }
  });

  // Optimized particle system
  function addExplodingParticles(p, color) {
    const particleCount = get("particle").length;
    const numParticles = Math.min(12, MAX_PARTICLES - particleCount);
    
    for (let i = 0; i < numParticles; i++) {
      const angle = (360 / numParticles) * i;
      const speed = rand(50, 150);
      add([
        rect(4, 4),
        pos(p),
        color,
        "particle",
        {
          vel: Vec2.fromAngle(angle).scale(speed),
          update() {
            if (isPaused) return;
            this.moveBy(this.vel.scale(dt()));
            this.vel = this.vel.scale(0.95);
          },
          lifespan: 0.8,
          timer: 0,
          update() {
            if (isPaused) return;
            this.timer += dt();
            if (this.timer >= this.lifespan) {
              destroy(this);
            }
          }
        }
      ]);
    }
  }

  function addGameOverScreen() {
    add([
      text(`Game Over!\nScore: ${SCORE}\nPress SPACE to restart`, { size: 32 }),
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
    text("A/D to move, SPACE to shoot, P to pause", { size: 16 }),
    pos(10, height() - 30),
    fixed(),
    color(255, 255, 255),
  ]);
});

// Start the game
go("game");
