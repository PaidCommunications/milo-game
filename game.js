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

// High scores
const HIGH_SCORES_KEY = "highScores";
let highScores = JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];

// Game scene
scene("game", () => {
    let gameOver = false;
    let difficulty = 1;
    let lives = 3;
    let spawnTime = 0;
    const PLAYER_SPEED = 400;

    // Background music
    play("background", { loop: true });

    // Player setup
    const player = add([
        sprite("player"),
        pos(width() / 2, height() - 100),
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

    // Movement controls
    onKeyDown("left", () => player.move(-PLAYER_SPEED, 0));
    onKeyDown("right", () => player.move(PLAYER_SPEED, 0));
    onKeyDown("up", () => player.move(0, -PLAYER_SPEED));
    onKeyDown("down", () => player.move(0, PLAYER_SPEED));

    // Shooting
    function shoot() {
        play("shoot");
        add([
            rect(6, 15), // Default bullet
            pos(player.pos.x + 22, player.pos.y),
            move(UP, 400),
            area(),
            color(255, 255, 0),
            "bullet"
        ]);
    }
    onKeyPress("space", shoot);

    // Enemy spawning
    const enemyTypes = [
        { sprite: "enemy1", speed: 100, points: 10 },
        { sprite: "enemy2", speed: 150, points: 20 },
        { sprite: "enemy3", speed: 75, points: 30 }
    ];
    function spawnEnemy() {
        const enemy = choose(enemyTypes);
        add([
            sprite(enemy.sprite),
            pos(rand(0, width() - 40), 0),
            move(DOWN, enemy.speed + difficulty * 10),
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

    onCollide("enemy", "player", (enemy, player) => {
        if (!player.isInvincible) {
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;
            if (lives <= 0) {
                gameOver = true;
                add([text("Game Over!", { size: 32 }), pos(width() / 2 - 100, height() / 2)]);
                add([text("Final Score: " + score, { size: 32 }), pos(width() / 2 - 100, height() / 2 + 50)]);
            }
        }
    });

    // Enemy spawning loop
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

// Start the game
go("game");
