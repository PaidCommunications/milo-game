// Kaboom initialization
kaboom({
    width: window.innerWidth,
    height: window.innerHeight,
    background: [0, 0, 30],
    canvas: document.querySelector("canvas"),
    stretch: true,
    letterbox: true
});

// Load assets
loadSound("background", "assets/sounds/background.mp3");
loadSound("shoot", "assets/sounds/shoot.wav");
loadSound("collision", "assets/sounds/collision.wav");
loadSound("explosion", "assets/sounds/explosion.wav");
loadSprite("player", "assets/images/player.png");
loadSprite("enemy", "assets/images/enemy.png");
loadSprite("bullet", "assets/images/bullet.png");
loadSprite("powerUp", "assets/images/powerUp.png");

// High scores
const HIGH_SCORES_KEY = "highScores";
let highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];

scene("game", () => {
    let gameOver = false;
    let difficulty = 1;
    let lives = 3;
    let spawnTime = 0;
    const MIN_SPAWN_RATE = 0.3;
    const PLAYER_SPEED = 400;

    // Background music
    play("background", { loop: true });

    // Player
    const player = add([
        sprite("player"),
        pos(width() / 2, height() / 2),
        area(),
        {
            powerUpTime: 0,
            speedMultiplier: 1,
            isInvincible: false,
            autoShoot: false,
            spreadShot: false,
            hasBomb: false
        },
        "player"
    ]);

    // Movement
    const movePlayer = (x, y) => {
        if (!gameOver) {
            player.move(x * PLAYER_SPEED * player.speedMultiplier, y * PLAYER_SPEED * player.speedMultiplier);
        }
    };
    onKeyDown("left", () => movePlayer(-1, 0));
    onKeyDown("right", () => movePlayer(1, 0));
    onKeyDown("up", () => movePlayer(0, -1));
    onKeyDown("down", () => movePlayer(0, 1));

    // Shooting
    function shoot() {
        play("shoot");
        if (player.hasBomb) {
            add([
                sprite("bullet"),
                pos(player.pos.x, player.pos.y),
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
            [-15, 0, 15].forEach(offset => {
                add([
                    sprite("bullet"),
                    pos(player.pos.x + offset, player.pos.y),
                    move(UP, 400),
                    area(),
                    "bullet"
                ]);
            });
        } else {
            add([
                sprite("bullet"),
                pos(player.pos.x, player.pos.y),
                move(UP, 400),
                area(),
                "bullet"
            ]);
        }
    }
    onKeyPress("space", () => {
        if (!gameOver) {
            shoot();
        } else {
            go("game");
        }
    });

    // Enemy spawn
    const enemyTypes = [
        { width: 40, height: 40, speed: 100, points: 10 },
        { width: 30, height: 30, speed: 200, points: 20 },
        { width: 60, height: 60, speed: 50, points: 30 }
    ];
    function spawnEnemy() {
        const type = choose(enemyTypes);
        add([
            sprite("enemy"),
            pos(rand(0, width() - type.width), 0),
            move(DOWN, type.speed + difficulty * 10),
            area(),
            "enemy",
            { points: type.points }
        ]);
    }

    // Explosion
    function createExplosion(pos) {
        play("explosion");
        add([
            rect(width(), height()),
            pos(0, 0),
            color(255, 255, 255),
            opacity(0.5),
            lifespan(0.2)
        ]);
        for (let i = 0; i < 32; i++) {
            add([
                rect(8, 8),
                pos(pos.x, pos.y),
                color(255, 200, 0),
                move(rand(0, 360), rand(100, 200)),
                lifespan(0.5)
            ]);
        }
    }

    // Power-ups
    const powerUpTypes = [
        { type: "shield", duration: 5 },
        { type: "autoShoot", duration: 8 },
        { type: "spreadShot", duration: 6 },
        { type: "extraLife", duration: 1 },
        { type: "bomb", duration: 5 },
        { type: "speedBoost", duration: 5 },
        { type: "healthRegen", duration: 1 }
    ];
    function spawnPowerUp() {
        const type = choose(powerUpTypes);
        add([
            sprite("powerUp"),
            pos(rand(0, width() - 30), 0),
            move(DOWN, 50),
            area(),
            "powerUp",
            { powerUpType: type }
        ]);
    }

    // Score and lives display
    let score = 0;
    const scoreText = add([
        text("Score: 0"),
        pos(20, 20),
        { value: 0 }
    ]);
    const livesText = add([
        text("Lives: 3"),
        pos(20, 50)
    ]);

    // Collisions
    onCollide("bullet", "enemy", (bullet, enemy) => {
        destroy(bullet);
        destroy(enemy);
        score += enemy.points;
        scoreText.text = "Score: " + score;
    });

    onCollide("player", "powerUp", (p, powerUp) => {
        const { type, duration } = powerUp.powerUpType;
        destroy(powerUp);
        if (type === "extraLife") {
            lives++;
            livesText.text = "Lives: " + lives;
        } else if (type === "healthRegen") {
            lives = Math.min(lives + 1, 3);
            livesText.text = "Lives: " + lives;
        } else if (type === "speedBoost") {
            player.speedMultiplier = 2;
            player.powerUpTime = duration;
        } else {
            player.isInvincible = type === "shield";
            player.autoShoot = type === "autoShoot";
            player.spreadShot = type === "spreadShot";
            player.hasBomb = type === "bomb";
            player.powerUpTime = duration;
        }
    });

    // Game over
    onCollide("enemy", "player", (enemy, player) => {
        if (!player.isInvincible) {
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;
            if (lives <= 0) {
                gameOver = true;
                highScores.push(score);
                highScores.sort((a, b) => b - a);
                highScores = highScores.slice(0, 5);
                localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
                go("gameOver", score);
            }
        }
    });

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

scene("gameOver", (score) => {
    add([
        text("Game Over!\nYour Score: " + score, { size: 32 }),
        pos(width() / 2 - 100, height() / 2 - 100)
    ]);
    highScores.forEach((s, i) => {
        add([text(`${i + 1}: ${s}`, { size: 24 }), pos(20, 300 + i * 30)]);
    });
    onKeyPress("space", () => go("game"));
});

// Start game
go("game");
