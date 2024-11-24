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
    const PLAYER_SPEED = 400;
    let lives = 3;

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

    // Shooting
    function shoot() {
        play("shoot");
        const bulletPos = vec2(player.pos.x + player.width / 2 - 3, player.pos.y);
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
                            every("enemy", (enemy) => {
                                displayPoints(enemy.pos, enemy.points);
                                destroy(enemy);
                            });
                            createExplosion(this.pos);
                            destroy(this);
                            player.hasBomb = false;
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
    onKeyPress("space", shoot);

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
            pos(position), // Correct usage of pos() as a component
            lifespan(1),   // Display for 1 second
            move(UP, 50)   // Float upwards slightly
        ]);
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
            enemyTypes.forEach(e => e.speed *= 1.5);
        }
    });

    onCollide("player", "enemy", (player, enemy) => {
        if (!player.forcefield) {
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;
            if (lives <= 0) {
                gameOver = true;
                add([
                    text("Game Over! Press SPACE to restart.", { size: 32 }),
                    pos(width() / 2 - 200, height() / 2)
                ]);
                onKeyPress("space", () => go("game"));
            }
        } else {
            destroy(enemy);
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
            "Instructions:\n" +
                "- Arrow keys to move\n" +
                "- Spacebar to shoot\n" +
                "Power-Ups:\n" +
                "Green: Forcefield\n" +
                "Light Purple: Rapid Fire\n" +
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
