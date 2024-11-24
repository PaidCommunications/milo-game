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

// Game scene
scene("game", () => {
    let gameOver = false;
    let difficulty = 1;
    let score = 0;
    let spawnTime = 0;
    let lastShotTime = 0;
    const PLAYER_SPEED = 400;
    let lives = 3;

    // Timers for power-up spawns
    const powerUpTimers = {
        forcefield: time(),
        rapidFire: time(),
        extraLife: time(),
        spreadShot: time(),
        bomb: time(),
    };

    const powerUpIntervals = {
        forcefield: 30,
        rapidFire: 20,
        extraLife: 60,
        spreadShot: 15,
        bomb: 45,
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
            isInvisible: false // To track temporary disappearance
        },
        "player"
    ]);

    // Restrict player to the game window
    player.onUpdate(() => {
        if (!player.isInvisible) {
            player.pos.x = clamp(player.pos.x, 0, width() - player.width);
            player.pos.y = clamp(player.pos.y, 0, height() - player.height);
        }

        // Handle invincibility blinking
        if (player.forcefield) {
            player.powerUpTime -= dt();

            if (player.powerUpTime <= 2) {
                const isEven = Math.floor(time() * 10) % 2 === 0;
                if (isEven) {
                    player.use(sprite("invincible", { width: 50, height: 50 })); // Blink to invincible sprite
                } else {
                    player.use(sprite("player", { width: 50, height: 50 })); // Back to normal sprite
                }
            }

            if (player.powerUpTime <= 0) {
                player.forcefield = false;
                player.use(sprite("player", { width: 50, height: 50 })); // Reset to normal sprite
            }
        }

        // Rapid fire shooting
        if (player.rapidFire && time() - lastShotTime > 0.1) {
            shoot();
            lastShotTime = time();
        }
    });

    // Player movement controls
    onKeyDown("left", () => player.move(-PLAYER_SPEED, 0)); // Left arrow
    onKeyDown("right", () => player.move(PLAYER_SPEED, 0)); // Right arrow
    onKeyDown("up", () => player.move(0, -PLAYER_SPEED)); // Up arrow
    onKeyDown("down", () => player.move(0, PLAYER_SPEED)); // Down arrow

    onKeyDown("a", () => player.move(-PLAYER_SPEED, 0)); // A key
    onKeyDown("d", () => player.move(PLAYER_SPEED, 0)); // D key
    onKeyDown("w", () => player.move(0, -PLAYER_SPEED)); // W key
    onKeyDown("s", () => player.move(0, PLAYER_SPEED)); // S key

    // Shooting logic
    function shoot() {
        play("shoot");
        const bulletPos = vec2(player.pos.x + player.width / 2 - 3, player.pos.y);

        if (player.hasBomb) {
            // Launch a single bomb
            add([
                rect(15, 15),
                pos(bulletPos),
                move(UP, 300),
                color(128, 0, 128),
                area(),
                "bomb",
                {
                    update() {
                        if (this.pos.y < height() / 2) {
                            // Only process objects with "enemy" tag
                            get("enemy").forEach((enemy) => {
                                if ("pos" in enemy && enemy.pos) {
                                    displayPoints(enemy.pos, enemy.points || 0);
                                    destroy(enemy);
                                }
                            });
                            createExplosion(this.pos);
                            destroy(this);
                        }
                    }
                }
            ]);
            player.hasBomb = false; // Reset bomb ability immediately
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
            // Regular bullet
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

    // Spacebar shooting
    onKeyPress("space", () => {
        if (!player.rapidFire) {
            shoot();
        }
    });

    // Handle collision with bullets and enemies
    onCollide("bullet", "enemy", (bullet, enemy) => {
        destroy(bullet);
        displayPoints(enemy.pos, enemy.points);
        destroy(enemy);
        score += enemy.points;
        scoreText.text = "Score: " + score;
    });

    // Handle collision with enemies
    onCollide("player", "enemy", (player, enemy) => {
        if (player.forcefield) {
            displayPoints(enemy.pos, enemy.points);
            destroy(enemy);
            score += enemy.points;
            scoreText.text = "Score: " + score;
        } else {
            // Player loses a life
            play("explosion");
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;

            if (lives > 0) {
                player.isInvisible = true; // Hide the player
                player.hidden = true;
                wait(1, () => {
                    player.isInvisible = false; // Show the player after 1 second
                    player.hidden = false;
                });
            }

            if (lives <= 0) {
                gameOver = true;
                add([
                    text("Game Over! Press SPACE to restart.", { size: 32 }),
                    pos(width() / 2 - 200, height() / 2)
                ]);
                onKeyPress("space", () => go("game"));
            }
        }
    });

    // Power-Up Logic
    onCollide("player", "powerUp", (player, powerUp) => {
        const type = powerUp.powerUpType;
        destroy(powerUp);

        // Disable rapid fire when any power-up is picked up
        player.rapidFire = false;

        if (type === "forcefield") {
            player.forcefield = true;
            player.powerUpTime = 10; // Set invincibility duration to 10 seconds
            player.use(sprite("forcefield", { width: 50, height: 50 })); // Set initial invincible sprite
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

    // Enemy spawning
    const enemyTypes = [
        { sprite: "enemy1", width: 100, height: 100, speed: 100, points: 10 },
        { sprite: "enemy2", width: 70, height: 70, speed: 150, points: 25 },
        { sprite: "enemy3", width: 45, height: 45, speed: 200, points: 50 }
    ];

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

    // Explosion effect
    function createExplosion(pos) {
        play("explosion");
        for (let i = 0; i < 32; i++) {
            add([
                rect(8, 8),
                pos(pos),
                move(rand(0, 360), rand(100, 200)),
                lifespan(0.5),
                color(255, 200, 0)
            ]);
        }
    }

    // Display points on enemy death
    function displayPoints(position, points) {
        add([
            text(`+${points}`, { size: 20, color: rgb(255, 255, 255) }),
            pos(position),
            lifespan(1),
            move(UP, 50)
        ]);
    }

    // Update loop
    onUpdate(() => {
        if (!gameOver) {
            spawnTime += dt();
            if (spawnTime > 1 / difficulty) {
                spawnEnemy();
                spawnTime = 0;
            }
        }
    });
});

// Start screen
scene("start", () => {
    add([
        text(
            "MiloInvasion V1.8\n\n" +
                "Instructions:\n" +
                "- Arrow keys or WASD to move\n" +
                "- Spacebar to shoot (hold for rapid fire with power-up)\n" +
                "Power-Ups:\n" +
                "Green: Forcefield\n" +
                "Light Purple: Rapid Fire (hold SPACE)\n" +
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

// Start the game
go("start");
