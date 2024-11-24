// Initialize kaboom with full screen
kaboom({
    width: window.innerWidth,
    height: window.innerHeight,
    background: [0, 0, 30],
    canvas: document.querySelector("canvas"),
    stretch: true,
    letterbox: true
});

// Add window resize handling
window.addEventListener('resize', () => {
    const canvas = document.querySelector('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Game scene
scene("game", () => {
    let gameOver = false;
    let difficulty = 1;
    let lives = 3;
    let spawnTime = 0;
    const MIN_SPAWN_RATE = 0.3;
    const PLAYER_SIZE = 50;
    const PLAYER_SPEED = 400;

    // Player base - starting position
    const player = add([
        rect(PLAYER_SIZE, PLAYER_SIZE),            
        pos(width() / 2, height() / 2),
        color(0, 0, 255),        
        area(),
        {
            powerUpTime: 0,
            isInvincible: false,
            autoShoot: false,
            spreadShot: false,
            hasBomb: false
        },
        "player"                 
    ]);

    // Face elements
    const eyes = add([
        "eyes",
        pos(0, 0),
        {
            draw() {
                drawRect({
                    width: 10,
                    height: 10,
                    pos: vec2(player.pos.x + 10, player.pos.y + 15),
                    color: rgb(255, 255, 255),
                });
                drawRect({
                    width: 10,
                    height: 10,
                    pos: vec2(player.pos.x + 32, player.pos.y + 15),
                    color: rgb(255, 255, 255),
                });
            },
        },
    ]);

    const mouth = add([
        "mouth",
        pos(0, 0),
        {
            draw() {
                drawRect({
                    width: 25,
                    height: 6,
                    pos: vec2(player.pos.x + 15, player.pos.y + 35),
                    color: rgb(255, 255, 255),
                });
            },
        },
    ]);

    // Arrow key movement
    onKeyDown("left", () => {
        if (!gameOver) {
            player.move(-PLAYER_SPEED, 0);    
        }
    });

    onKeyDown("right", () => {
        if (!gameOver) {
            player.move(PLAYER_SPEED, 0);    
        }
    });

    onKeyDown("up", () => {
        if (!gameOver) {
            player.move(0, -PLAYER_SPEED);    
        }
    });

    onKeyDown("down", () => {
        if (!gameOver) {
            player.move(0, PLAYER_SPEED);    
        }
    });

    // WASD as alternate controls
    onKeyDown("a", () => {
        if (!gameOver) {
            player.move(-PLAYER_SPEED, 0);    
        }
    });

    onKeyDown("d", () => {
        if (!gameOver) {
            player.move(PLAYER_SPEED, 0);    
        }
    });

    onKeyDown("w", () => {
        if (!gameOver) {
            player.move(0, -PLAYER_SPEED);    
        }
    });

    onKeyDown("s", () => {
        if (!gameOver) {
            player.move(0, PLAYER_SPEED);    
        }
    });

    // Keep player in bounds
    player.onUpdate(() => {
        // Screen boundaries
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > width() - PLAYER_SIZE) player.pos.x = width() - PLAYER_SIZE;
        if (player.pos.y < 0) player.pos.y = 0;
        if (player.pos.y > height() - PLAYER_SIZE) player.pos.y = height() - PLAYER_SIZE;

        // Handle auto-shoot
        if (player.autoShoot && !gameOver) {
            shoot();
        }

        // Update power-up timer
        if (player.powerUpTime > 0) {
            player.powerUpTime -= dt();
            
            // Gold color when invincible
            if (player.isInvincible) {
                if (player.powerUpTime <= 2) {
                    if (Math.floor(time() * 10) % 2 === 0) {
                        player.use(color(255, 215, 0));
                    } else {
                        player.use(color(0, 0, 255));
                    }
                } else {
                    player.use(color(255, 215, 0));
                }
            }
            
            if (player.powerUpTime <= 0) {
                player.isInvincible = false;
                player.autoShoot = false;
                player.spreadShot = false;
                player.hasBomb = false;
                player.use(color(0, 0, 255));
            }
        }
    });

    // Create explosion effect
    function createExplosion(p) {
        // Screen flash
        add([
            rect(width(), height()),
            pos(0, 0),
            color(255, 255, 255),
            opacity(0.5),
            lifespan(0.2)
        ]);

        // Particle explosion
        for (let i = 0; i < 32; i++) {
            const angle = (2 * Math.PI * i) / 32;
            const speed = rand(100, 200);
            add([
                rect(8, 8),
                pos(p.x, p.y),
                color(255, 200, 0),
                move(angle, speed),
                lifespan(0.5)
            ]);
        }
    }

    // Power-up types including bomb
    const powerUpTypes = [
        { color: [0, 255, 0], type: "shield", duration: 5 },      
        { color: [255, 100, 255], type: "autoShoot", duration: 8 }, 
        { color: [0, 255, 255], type: "spreadShot", duration: 6 },  
        { color: [255, 255, 255], type: "extraLife", duration: 1 },
        { color: [128, 0, 128], type: "bomb", duration: 5 }
    ];

    // Shooting function with bomb
    function shoot() {
        if (player.hasBomb) {
            // Bomb shot
            add([
                rect(12, 30), // Large bullet
                pos(player.pos.x + 19, player.pos.y),
                color(255, 255, 0),
                area(),
                "bomb",
                {
                    update() {
                        this.moveBy(0, -400 * dt());
                        if (this.pos.y <= height() / 2) {
                            createExplosion(this.pos);
                            every("enemy", destroy);
                            destroy(this);
                            player.hasBomb = false;
                        }
                    }
                }
            ]);
        } else if (player.spreadShot) {
            // Spread shot bullets
            const positions = [5, 15, 25, 22, 35, 45, 55];
            positions.forEach(xOffset => {
                add([
                    rect(6, 15),
                    pos(player.pos.x + xOffset, player.pos.y),
                    color(255, 255, 0),
                    move(UP, 400),
                    area(),
                    "bullet"
                ]);
            });
        } else {
            // Normal shot
            add([
                rect(6, 15),
                pos(player.pos.x + 22, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
        }
    }

    // Manual shooting
    onKeyPress("space", () => {
        if (gameOver) {
            go("game");
            return;
        }
        
        if (!player.autoShoot) {
            shoot();
        }
    });

    // Spawn power-up
    function spawnPowerUp() {
        if (gameOver) return;
        
        const type = choose(powerUpTypes);
        add([
            rect(30, 30),
            pos(rand(0, width() - 30), 0),
            color(type.color[0], type.color[1], type.color[2]),
            move(DOWN, 50),
            area(),
            "powerUp",
            { powerUpType: type }
        ]);
    }

    // Power-up timing
    let lastPowerUpTime = 0;
    const POWER_UP_COOLDOWN = 10;
    const POWER_UP_CHANCE = 0.03;

    // Score display
    let score = 0;
    const scoreText = add([
        text("Score: 0", { size: 24 }),
        pos(20, 20),
        { value: 0 }
    ]);

    const livesText = add([
        text("Lives: " + lives, { size: 24 }),
        pos(20, 50)
    ]);

    const levelText = add([
        text("Level: 1", { size: 24 }),
        pos(20, 80)
    ]);

    // Enemy types
    const enemyTypes = [
        { width: 40, height: 40, color: [255, 0, 0], speed: 100, points: 10 },
        { width: 30, height: 30, color: [255, 165, 0], speed: 200, points: 20 },
        { width: 60, height: 60, color: [128, 0, 0], speed: 50, points: 30 }
    ];

    // Enemy spawning
    function spawnEnemy() {
        if (gameOver) return;
        
        const typeIndex = Math.floor(rand(0, enemyTypes.length));
        const enemyType = enemyTypes[typeIndex];
        
        const speedMultiplier = 1 + (difficulty * 0.1);
        
        add([
            rect(enemyType.width, enemyType.height),
            pos(rand(0, width() - enemyType.width), 0),
            color(enemyType.color[0], enemyType.color[1], enemyType.color[2]),          
            move(DOWN, enemyType.speed * speedMultiplier),           
            area(),
            "enemy",
            { points: enemyType.points }
        ]);
    }

    // Game update loop
    onUpdate(() => {
        if (!gameOver) {
            const newDifficulty = 1 + Math.floor(scoreText.value / 100);
            if (newDifficulty !== difficulty) {
                difficulty = newDifficulty;
                levelText.text = "Level: " + difficulty;
            }

            spawnTime += dt();
            if (spawnTime >= Math.max(MIN_SPAWN_RATE, 1 / difficulty)) {
                spawnEnemy();
                spawnTime = 0;
            }

            const timeSinceLastPowerUp = time() - lastPowerUpTime;
            if (timeSinceLastPowerUp > POWER_UP_COOLDOWN && rand(0, 1) < POWER_UP_CHANCE * dt()) {
                spawnPowerUp();
                lastPowerUpTime = time();
            }
        }
    });

    // Collisions
    onCollide("bullet", "enemy", (bullet, enemy) => {
        if (!gameOver) {
            destroy(bullet);
            destroy(enemy);
            scoreText.value += enemy.points;
            scoreText.text = "Score: " + scoreText.value;
        }
    });

    onCollide("player", "powerUp", (p, powerUp) => {
        const type = powerUp.powerUpType;
        destroy(powerUp);

        if (type.type === "extraLife") {
            lives++;
            livesText.text = "Lives: " + lives;
        } else {
            player.isInvincible = false;
            player.autoShoot = false;
            player.spreadShot = false;
            player.hasBomb = false;
            
            player.powerUpTime = type.duration;
            if (type.type === "shield") {
                player.isInvincible = true;
                player.use(color(255, 215, 0));
            } else if (type.type === "autoShoot") {
                player.autoShoot = true;
            } else if (type.type === "spreadShot") {
                player.spreadShot = true;
            } else if (type.type === "bomb") {
                player.hasBomb = true;
            }
        }
    });

    onCollide("enemy", "player", (enemy, player) => {
        if (!gameOver && !player.isInvincible) {
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;

            if (lives <= 0) {
                gameOver = true;
                destroy(eyes);
                destroy(mouth);
                
                add([
                    text("Game Over!", { size: 32 }),
                    pos(width()/2 - 100, height()/2 - 50)
                ]);
                
                add([
                    text("Final Score: " + scoreText.value, { size: 32 }),
                    pos(width()/2 - 100, height()/2)
                ]);

                add([
                    text("Level Reached: " + difficulty, { size: 32 }),
                    pos(width()/2 - 100, height()/2 + 40)
                ]);
                
                add([
                    text("Press SPACE to restart", { size: 32 }),
                    pos(width()/2 - 150, height()/2 + 90)
                ]);
            }
        }
    });
});

// Start the game
go("game");
