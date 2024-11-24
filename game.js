// Initialize kaboom
kaboom({
    width: 800,
    height: 600,
    background: [0, 0, 30],
    canvas: document.querySelector("canvas"),
});

// Game scene
scene("game", () => {
    let gameOver = false;
    let difficulty = 1;
    let lives = 3;
    let spawnTime = 0;
    const MAX_DIFFICULTY = 10;
    const MIN_SPAWN_RATE = 0.3;
    
    // Add player
    const player = add([
        rect(50, 50),            
        pos(400, 500),           
        color(0, 0, 255),        
        area(),
        {
            powerUpTime: 0,
            isInvincible: false,
            autoShoot: false,
            spreadShot: false
        },
        "player"                 
    ]);

    // Player movement
    onKeyDown("a", () => {
        if (!gameOver) {
            player.move(-200, 0);    
        }
    });

    onKeyDown("d", () => {
        if (!gameOver) {
            player.move(200, 0);     
        }
    });

    // Keep player in bounds
    player.onUpdate(() => {
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > width() - 50) player.pos.x = width() - 50;

        // Handle auto-shoot
        if (player.autoShoot && !gameOver) {
            shoot();
        }

        // Update power-up timer
        if (player.powerUpTime > 0) {
            player.powerUpTime -= dt();
            
            // Gold color when invincible
            if (player.isInvincible) {
                player.use(color(255, 215, 0));
            }
            
            if (player.powerUpTime <= 0) {
                player.isInvincible = false;
                player.autoShoot = false;
                player.spreadShot = false;
                player.use(color(0, 0, 255));
            }
        }
    });

    // Power-up types
    const powerUpTypes = [
        { color: [0, 255, 0], type: "shield", duration: 5 },      
        { color: [255, 100, 255], type: "autoShoot", duration: 8 }, 
        { color: [0, 255, 255], type: "spreadShot", duration: 6 },  
        { color: [255, 255, 255], type: "extraLife", duration: 1 }  
    ];

    // Shooting function with 7 bullets
    function shoot() {
        if (player.spreadShot) {
            // Left side bullets
            add([
                rect(6, 15),
                pos(player.pos.x + 5, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            add([
                rect(6, 15),
                pos(player.pos.x + 15, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            add([
                rect(6, 15),
                pos(player.pos.x + 25, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            // Center bullet
            add([
                rect(6, 15),
                pos(player.pos.x + 22, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            // Right side bullets
            add([
                rect(6, 15),
                pos(player.pos.x + 35, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            add([
                rect(6, 15),
                pos(player.pos.x + 45, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            add([
                rect(6, 15),
                pos(player.pos.x + 55, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
        } else {
            // Normal single shot
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

    // Enemy spawning with controlled speed
    function spawnEnemy() {
        if (gameOver) return;
        
        const maxTypeIndex = Math.min(enemyTypes.length - 1, Math.floor((difficulty - 1) / 3));
        const typeIndex = Math.floor(rand(0, maxTypeIndex + 1));
        const enemyType = enemyTypes[typeIndex];
        
        // Cap speed increase
        const speedMultiplier = Math.min(1 + (difficulty * 0.1), 2.5);
        
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
            // Update difficulty
            const newDifficulty = 1 + Math.floor(scoreText.value / 100);
            if (newDifficulty !== difficulty) {
                difficulty = Math.min(newDifficulty, MAX_DIFFICULTY);
                levelText.text = "Level: " + difficulty;
            }

            // Spawn enemies at controlled rate
            spawnTime += dt();
            if (spawnTime >= Math.max(MIN_SPAWN_RATE, 1 / difficulty)) {
                spawnEnemy();
                spawnTime = 0;
            }

            // Check for power-up spawn
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
            // Reset all power-ups before applying new one
            player.isInvincible = false;
            player.autoShoot = false;
            player.spreadShot = false;
            
            // Apply the new power-up
            player.powerUpTime = type.duration;
            if (type.type === "shield") {
                player.isInvincible = true;
                player.use(color(255, 215, 0));
            } else if (type.type === "autoShoot") {
                player.autoShoot = true;
            } else if (type.type === "spreadShot") {
                player.spreadShot = true;
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
