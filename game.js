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

        // Rapid fire shooting
        if (player.rapidFire && !player.isInvisible && time() - lastShotTime > 0.1) {
            shoot();
            lastShotTime = time();
        }
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

    // Spawn enemies
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
            "MiloInvasion V1.2\n\n" +
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
