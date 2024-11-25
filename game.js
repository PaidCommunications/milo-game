// Kaboom.js initialization
kaboom({
    width: window.innerWidth,
    height: window.innerHeight,
    background: [40, 40, 40], // Match the background color to objects
    canvas: document.querySelector("canvas"),
    stretch: true,
    letterbox: true
});

// Load assets
loadSprite("player", "assets/player.png");
loadSprite("forcefield", "assets/forcefield.png");
loadSprite("invincible", "assets/invincible.png");
loadSprite("enemy1", "assets/enemy1.png");
loadSprite("enemy2", "assets/enemy2.png");
loadSprite("enemy3", "assets/enemy3.png");
loadSound("background", "assets/background.mp3");
loadSound("shoot", "assets/shoot.wav");
loadSound("explosion", "assets/explosion.wav");
loadSound("powerUp", "assets/Power Up.wav");

// Game scene
scene("game", () => {
    let gameOver = false;
    let difficulty = 1;
    let score = 0;
    let spawnTime = 0;
    let lastShotTime = 0;
    let powerUpSpeed = 75; // Base power-up speed
    let playerSpeed = 400; // Base player speed
    let lives = 3;
    let enemiesKilled = 0; // Track total enemies killed

    // Display score, lives, and level
    const scoreText = add([
        text("Score: 0", { size: 24 }),
        pos(20, 20),
        { value: 0 }
    ]);

    const livesText = add([
        text("Lives: 3", { size: 24 }),
        pos(20, 50)
    ]);

    const levelText = add([
        text("Level: 1", { size: 24 }),
        pos(20, 80)
    ]);

    // Enemy types
    const enemyTypes = [
        { sprite: "enemy1", width: 100, height: 100, speed: 100, points: 10 },
        { sprite: "enemy2", width: 70, height: 70, speed: 150, points: 25 },
        { sprite: "enemy3", width: 45, height: 45, speed: 200, points: 50 }
    ];

    // Power-Up Timers and Intervals
    const powerUpTimers = {
        forcefield: time(),
        rapidFire: time(),
        extraLife: time(),
        spreadShot: time(),
        bomb: time(),
    };

    const powerUpIntervals = {
        forcefield: 35,
        rapidFire: 25,
        extraLife: 60,
        spreadShot: 20,
        bomb: 50,
    };

    // Background music
    play("background", { loop: true });

    // Player setup
    const player = add([
        sprite("player", { width: 50, height: 50 }),
        pos(width() / 2, height() - 100),
        area(),
        {
            forcefield: false,
            rapidFire: false,
            spreadShot: false,
            hasBomb: false,
            powerUpTime: 0,
            isInvisible: false
        },
        "player"
    ]);

    // Restrict player to the game window
    player.onUpdate(() => {
        if (!player.isInvisible) {
            player.pos.x = clamp(player.pos.x, 0, width() - player.width);
            player.pos.y = clamp(player.pos.y, 0, height() - player.height);
        }

        // Handle forcefield blinking
        if (player.forcefield) {
            player.powerUpTime -= dt();

            if (player.powerUpTime <= 2) {
                const isEven = Math.floor(time() * 10) % 2 === 0;
                player.use(isEven ? sprite("invincible", { width: 50, height: 50 }) : sprite("player", { width: 50, height: 50 }));
            }

            if (player.powerUpTime <= 0) {
                player.forcefield = false;
                player.use(sprite("player", { width: 50, height: 50 })); // Reset to player sprite
            }
        }

        // Rapid fire shooting
        if (player.rapidFire && !player.isInvisible && time() - lastShotTime > 0.1) {
            shoot();
            lastShotTime = time();
        }
    });

    // Player movement controls
    onKeyDown("left", () => {
        if (!player.isInvisible) player.move(-playerSpeed, 0);
    });

    onKeyDown("right", () => {
        if (!player.isInvisible) player.move(playerSpeed, 0);
    });

    onKeyDown("up", () => {
        if (!player.isInvisible) player.move(0, -playerSpeed);
    });

    onKeyDown("down", () => {
        if (!player.isInvisible) player.move(0, playerSpeed);
    });

    onKeyDown("a", () => {
        if (!player.isInvisible) player.move(-playerSpeed, 0);
    });

    onKeyDown("d", () => {
        if (!player.isInvisible) player.move(playerSpeed, 0);
    });

    onKeyDown("w", () => {
        if (!player.isInvisible) player.move(0, -playerSpeed);
    });

    onKeyDown("s", () => {
        if (!player.isInvisible) player.move(0, playerSpeed);
    });

    // Shooting with space bar
    onKeyPress("space", () => {
        if (!player.isInvisible) {
            shoot();
        }
    });

    // Shooting logic
    function shoot() {
        if (player.isInvisible) return; // Prevent shooting while invisible
        const bulletPos = vec2(player.pos.x + player.width / 2 - 3, player.pos.y);

        if (player.hasBomb) {
            // Fire a single bomb
            const bomb = add([
                rect(30, 30), // Bomb size
                pos(bulletPos),
                move(UP, 300),
                color(128, 0, 128),
                area(),
                "bomb"
            ]);

            // Bomb collision with enemy
            bomb.onCollide("enemy", (enemy) => {
                // Destroy all current enemies
                get("enemy").forEach((enemy) => {
                    if (enemy && enemy.pos) { // Validate enemy
                        displayPoints(enemy.pos, enemy.points || 0);
                        destroy(enemy);
                        enemiesKilled++; // Track killed enemies
                    }
                });

                // Play explosion sound and flash background
                play("explosion");
                flashBackground();

                // Destroy the bomb itself
                destroy(bomb);

                // Reset the bomb power-up
                player.hasBomb = false;
            });
        } else if (player.spreadShot) {
            // Spread shot logic
            [-15, 0, 15].forEach(offset => {
                add([
                    rect(6, 15),
                    pos(bulletPos.x + offset, bulletPos.y),
                    move(UP, 300),
                    color(255, 255, 255),
                    area(),
                    "bullet"
                ]);
            });
        } else {
            // Normal bullet
            add([
                rect(6, 15),
                pos(bulletPos),
                move(UP, 400),
                color(255, 255, 0),
                area(),
                "bullet"
            ]);
        }
    }

    // Flash screen background
    function flashBackground() {
        add([
            rect(width(), height()),
            pos(0, 0),
            color(255, 255, 255),
            opacity(0.8), // Semi-transparent white flash
            lifespan(1)
        ]);
    }

    // Power-Up Collision Handling
    onCollide("player", "powerUp", (player, powerUp) => {
        const type = powerUp.powerUpType;

        // Destroy the power-up after collision
        destroy(powerUp);

        // Play the power-up sound
        play("powerUp");

        // Reset all active power-ups
        player.forcefield = false;
        player.rapidFire = false;
        player.spreadShot = false;
        player.hasBomb = false;

        // Revert to normal player sprite if invincible
        player.use(sprite("player", { width: 50, height: 50 }));

        // Apply the new power-up effect
        if (type === "forcefield") {
            player.forcefield = true;
            player.powerUpTime = 10;
            player.use(sprite("forcefield", { width: 50, height: 50 }));
        } else if (type === "rapidFire") {
            player.rapidFire = true;
            wait(10, () => (player.rapidFire = false));
        } else if (type === "extraLife") {
            lives++;
            livesText.text = "Lives: " + lives;
        } else if (type === "spreadShot") {
            player.spreadShot = true;
            wait(10, () => (player.spreadShot = false));
        } else if (type === "bomb") {
            player.hasBomb = true;
        }
    });

    onUpdate(() => {
        if (!gameOver) {
            spawnTime += dt();

            if (spawnTime > 1 / difficulty) {
                spawnEnemy();
                spawnTime = 0;
            }

            spawnPowerUps();

            const newDifficulty = 1 + Math.floor(score / 1000);
            if (newDifficulty !== difficulty) {
                difficulty = newDifficulty;
                levelText.text = "Level: " + difficulty;
                playerSpeed = 400 * Math.pow(1.05, difficulty - 1);
                powerUpSpeed = 75 * Math.pow(1.05, difficulty - 1);
            }
        }
    });

    function spawnPowerUps() {
        const now = time();

        for (const type in powerUpTimers) {
            if (now - powerUpTimers[type] >= powerUpIntervals[type]) {
                powerUpTimers[type] = now;

                const colorMap = {
                    forcefield: [0, 255, 0],
                    rapidFire: [255, 100, 255],
                    extraLife: [255, 255, 255],
                    spreadShot: [0, 0, 255],
                    bomb: [128, 0, 128]
                };

                add([
                    rect(30, 30),
                    pos(rand(0, width() - 30), 0),
                    color(colorMap[type][0], colorMap[type][1], colorMap[type][2]),
                    move(DOWN, powerUpSpeed * Math.pow(1.05, difficulty - 1)),
                    area(),
                    "powerUp",
                    { powerUpType: type }
                ]);
            }
        }
    }

    function spawnEnemy() {
        const enemy = choose(enemyTypes);

        add([
            sprite(enemy.sprite, { width: enemy.width, height: enemy.height }),
            pos(rand(0, width() - enemy.width), 0),
            move(DOWN, enemy.speed * difficulty),
            area(),
            "enemy",
            { points: enemy.points }
        ]);
    }

    function displayPoints(position, points) {
        add([
            text(`+${points}`, { size: 20, color: rgb(255, 255, 255) }),
            pos(position),
            lifespan(1),
            move(UP, 50)
        ]);
    }

    onCollide("bullet", "enemy", (bullet, enemy) => {
        destroy(bullet);
        displayPoints(enemy.pos, enemy.points);
        destroy(enemy);
        score += enemy.points || 0;
        enemiesKilled++;
        scoreText.text = "Score: " + score;
    });

    onCollide("player", "enemy", (player, enemy) => {
        if (player.forcefield) {
            displayPoints(enemy.pos, enemy.points);
            destroy(enemy);
            score += enemy.points;
            scoreText.text = "Score: " + score;
        } else {
            play("explosion");
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;

            if (lives > 0) {
                player.isInvisible = true;
                player.hidden = true;
                wait(1, () => {
                    player.isInvisible = false;
                    player.hidden = false;
                });
            } else {
                gameOver = true;

                let canRestart = false;
                wait(5, () => { canRestart = true; });

                add([
                    text("GAME OVER", { size: 48 }),
                    pos(width() / 2 - 150, height() / 2 - 100)
                ]);

                add([
                    text("Level Reached: " + difficulty, { size: 32 }),
                    pos(width() / 2 - 150, height() / 2 - 40)
                ]);

                add([
                    text("Score: " + score, { size: 32 }),
                    pos(width() / 2 - 150, height() / 2 + 20)
                ]);

                add([
                    text("Enemies Killed: " + enemiesKilled, { size: 32 }),
                    pos(width() / 2 - 150, height() / 2 + 80)
                ]);

                onKeyPress("space", () => {
                    if (canRestart) {
                        go("game");
                    }
                });
            }
        }
    });
});

scene("start", () => {
    add([
        text(
            "MiloInvasion V2\n\n" +
                "Instructions:\n" +
                "- Arrow keys or WASD to move\n" +
                "- Spacebar to shoot\n" +
                "Power-Ups:\n" +
                "Green: Forcefield\n" +
                "Light Purple: Rapid Fire (automatic)\n" +
                "White: Extra Life\n" +
                "Blue: Spread Shot\n" +
                "Dark Purple: Bomb\n\n" +
                "Press SPACE to Start!",
            { size: 24 }
        ),
        pos(50, 100)
    ]);

    onKeyPress("space", () => go("game"));
});

go("start");
