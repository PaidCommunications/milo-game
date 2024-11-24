// Kaboom.js initialization
kaboom({
    width: window.innerWidth,
    height: window.innerHeight,
    background: [0, 0, 30],
    canvas: document.querySelector("canvas"),
    stretch: true,
    letterbox: true
});

// Load assets
loadSprite("player", "assets/player.png");
loadSprite("forcefield", "assets/forcefield.png"); // Forcefield sprite
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
        forcefield: 30, // Every 30 seconds
        rapidFire: 20,  // Every 20 seconds
        extraLife: 60,  // Every 60 seconds
        spreadShot: 15, // Every 15 seconds
        bomb: 45,       // Every 45 seconds
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
            powerUpTime: 0
        },
        "player"
    ]);

    // Restrict player to the game window
    player.onUpdate(() => {
        player.pos.x = clamp(player.pos.x, 0, width() - player.width);
        player.pos.y = clamp(player.pos.y, 0, height() - player.height);

        // Rapid fire shooting
        if (player.rapidFire && time() - lastShotTime > 0.1) {
            shoot();
            lastShotTime = time();
        }
    });

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

    // Movement controls
    onKeyDown("left", () => player.move(-PLAYER_SPEED, 0));
    onKeyDown("right", () => player.move(PLAYER_SPEED, 0));
    onKeyDown("up", () => player.move(0, -PLAYER_SPEED));
    onKeyDown("down", () => player.move(0, PLAYER_SPEED));

    // Shooting logic
    function shoot() {
        play("shoot");
        const bulletPos = vec2(player.pos.x + player.width / 2 - 3, player.pos.y);

        // Bomb logic
        if (player.hasBomb) {
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
                                if ("pos" in enemy) {
                                    displayPoints(enemy.pos, enemy.points || 0);
                                    destroy(enemy);
                                }
                            });
                            createExplosion(this.pos);
                            destroy(this);
                            player.hasBomb = false; // Revert to normal bullets
                        }
                    }
                }
            ]);
        } else if (player.spreadShot) {
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
    onKeyPress("space", () => {
        if (!player.rapidFire) {
            shoot();
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

    // Power-Up Logic
    onCollide("player", "powerUp", (player, powerUp) => {
        const type = powerUp.powerUpType;
        destroy(powerUp);

        if (type === "forcefield") {
            player.forcefield = true;
            player.use(sprite("forcefield", { width: 50, height: 50 })); // Switch to forcefield sprite
            wait(10, () => {
                player.forcefield = false;
                player.use(sprite("player", { width: 50, height: 50 })); // Revert to normal sprite
            });
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

    // Spawn power-ups based on timers
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
                    move(DOWN, 50),
                    area(),
                    "powerUp",
                    { powerUpType: type }
                ]);
            }
        }
    }

    // Collisions
    onCollide("bullet", "enemy", (bullet, enemy) => {
        destroy(bullet);
        displayPoints(enemy.pos, enemy.points);
        destroy(enemy);
        score += enemy.points;
        scoreText.text = "Score: " + score;

        if (score >= difficulty * 1000) {
            difficulty += 1;
            levelText.text = "Level: " + difficulty;
            enemyTypes.forEach(e => e.speed *= 1.1); // Increase speed by 10%
        }
    });

    // Update loop
    onUpdate(() => {
        if (!gameOver) {
            spawnTime += dt();
            if (spawnTime > 1 / difficulty) {
                spawnEnemy();
                spawnTime = 0;
            }
            spawnPowerUps();
        }
    });
});

// Start screen
scene("start", () => {
    add([
        text(
            "MiloInvasion V1.4\n\n" +
                "Instructions:\n" +
                "- Arrow keys to move\n" +
                "- Spacebar to shoot (hold for rapid fire with power-up)\n" +
                "Power-Ups:\n" +
                "Green: Forcefield (changes player sprite)\n" +
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
