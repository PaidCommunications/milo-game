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
    
    // Add player
    const player = add([
        rect(50, 50),            
        pos(400, 500),           
        color(0, 0, 255),        
        area(),
        {
            powerUpTime: 0,
            isInvincible: false,
            rapidFire: false
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

        // Flash player when invincible
        if (player.isInvincible) {
            player.color = rgb(
                rand(0, 255),
                rand(0, 255),
                rand(0, 255)
            );
        } else {
            player.color = rgb(0, 0, 255);
        }

        // Update power-up timer
        if (player.powerUpTime > 0) {
            player.powerUpTime -= dt();
            if (player.powerUpTime <= 0) {
                player.isInvincible = false;
                player.rapidFire = false;
            }
        }
    });

    // Visual effects function
    function createExplosion(p, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (2 * Math.PI * i) / 12;
            const speed = rand(60, 120);
            add([
                rect(4, 4),
                pos(p),
                color,
                move(angle, speed),
                lifespan(0.5),
                "particle"
            ]);
        }
    }

    // Power-up types
    const powerUpTypes = [
        { color: [0, 255, 0], type: "shield", duration: 5 },    // Green shield
        { color: [255, 255, 0], type: "rapidFire", duration: 5 } // Yellow rapid fire
    ];

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

    // Spawn power-up every 10 seconds
    loop(10, spawnPowerUp);

    // Shooting with rapid fire check
    let canShoot = true;
    onKeyDown("space", () => {
        if (gameOver) {
            go("game");
            return;
        }
        
        if (canShoot) {
            const cooldown = player.rapidFire ? 0.1 : 0.5;
            
            add([
                rect(6, 15),         
                pos(player.pos.x + 22, player.pos.y), 
                color(255, 255, 0),  
                move(UP, 400),       
                area(),              
                "bullet"             
            ]);

            canShoot = false;
            wait(cooldown, () => {
                canShoot = true;
            });
        }
    });

    // Display UI
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

    function spawnEnemy() {
        if (!gameOver) {
            const typeIndex = Math.floor(rand(0, Math.min(enemyTypes.length, difficulty)));
            const enemyType = enemyTypes[typeIndex];
            
            add([
                rect(enemyType.width, enemyType.height),
                pos(rand(0, width() - enemyType.width), 0),
                color(enemyType.color[0], enemyType.color[1], enemyType.color[2]),          
                move(DOWN, enemyType.speed * (1 + difficulty * 0.1)),           
                area(),
                "enemy",
                { points: enemyType.points }
            ]);
        }
    }

    loop(1 / (1 + difficulty * 0.1), spawnEnemy);

    // Collisions
    onCollide("bullet", "enemy", (bullet, enemy) => {
        if (!gameOver) {
            destroy(bullet);
            destroy(enemy);
            scoreText.value += enemy.points;
            scoreText.text = "Score: " + scoreText.value;
            createExplosion(enemy.pos, rgb(enemy.color.r, enemy.color.g, enemy.color.b));
        }
    });

    onCollide("player", "powerUp", (p, powerUp) => {
        destroy(powerUp);
        const type = powerUp.powerUpType;
        player.powerUpTime = type.duration;
        
        if (type.type === "shield") {
            player.isInvincible = true;
        } else if (type.type === "rapidFire") {
            player.rapidFire = true;
        }
        
        createExplosion(player.pos, rgb(type.color[0], type.color[1], type.color[2]));
    });

    onCollide("enemy", "player", (enemy, player) => {
        if (!gameOver && !player.isInvincible) {
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;
            createExplosion(player.pos, rgb(255, 0, 0));

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

    // Increase difficulty
    onUpdate(() => {
        if (!gameOver) {
            const newDifficulty = 1 + Math.floor(scoreText.value / 100);
            if (newDifficulty !== difficulty) {
                difficulty = newDifficulty;
                levelText.text = "Level: " + difficulty;
            }
        }
    });
});

// Start the game
go("game");
