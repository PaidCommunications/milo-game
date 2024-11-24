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
    });

    // Player movement controls
    onKeyDown("left", () => {
        if (!player.isInvisible) player.move(-PLAYER_SPEED, 0); // Move left
    });

    onKeyDown("right", () => {
        if (!player.isInvisible) player.move(PLAYER_SPEED, 0); // Move right
    });

    onKeyDown("up", () => {
        if (!player.isInvisible) player.move(0, -PLAYER_SPEED); // Move up
    });

    onKeyDown("down", () => {
        if (!player.isInvisible) player.move(0, PLAYER_SPEED); // Move down
    });

    // WASD Controls
    onKeyDown("a", () => {
        if (!player.isInvisible) player.move(-PLAYER_SPEED, 0); // Move left (A)
    });

    onKeyDown("d", () => {
        if (!player.isInvisible) player.move(PLAYER_SPEED, 0); // Move right (D)
    });

    onKeyDown("w", () => {
        if (!player.isInvisible) player.move(0, -PLAYER_SPEED); // Move up (W)
    });

    onKeyDown("s", () => {
        if (!player.isInvisible) player.move(0, PLAYER_SPEED); // Move down (S)
    });

    // Shooting logic
    function shoot() {
        if (player.isInvisible) return; // Prevent shooting while invisible
        play("shoot");
        const bulletPos = vec2(player.pos.x + player.width / 2 - 3, player.pos.y);

        add([
            rect(6, 15),
            pos(bulletPos),
            move(UP, 400),
            color(255, 255, 0),
            area(), // Required for collision
            "bullet"
        ]);
    }

    // Spacebar shooting
    onKeyPress("space", () => {
        if (!player.isInvisible) {
            shoot();
        }
    });

    // Handle collision between bullets and enemies
    onCollide("bullet", "enemy", (bullet, enemy) => {
        destroy(bullet);

        if ("pos" in enemy && enemy.points) {
            displayPoints(enemy.pos, enemy.points);
        }

        destroy(enemy);

        score += enemy.points || 0;
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
            play("explosion");
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;

            if (lives > 0) {
                player.isInvisible = true; // Hide player
                player.hidden = true; // Make player disappear
                wait(1, () => {
                    player.isInvisible = false; // Make player visible
                    player.hidden = false;
                });
            } else {
                gameOver = true;
                add([
                    text("Game Over! Press SPACE to restart.", { size: 32 }),
                    pos(width() / 2 - 200, height() / 2)
                ]);
                onKeyPress("space", () => go("game"));
            }
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
        }
    });
});

// Start screen
scene("start", () => {
    add([
        text(
            "MiloInvasion V1\n\n" +
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

// Start the game
go("start");
