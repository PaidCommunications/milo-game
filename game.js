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
    let score = 0;
    let spawnTime = 0;
    const PLAYER_SPEED = 400;

    // Background music
    play("background", { loop: true });

    // Player setup
    const player = add([
        sprite("player"),
        pos(width() / 2, height() - 100),
        area(),
        "player"
    ]);

    // Display score, lives, and level
    const scoreText = add([
        text("Score: 0", { size: 24 }),
        pos(20, 20),
        { value: 0 }
    ]);

    const levelText = add([
        text("Level: 1", { size: 24 }),
        pos(20, 50)
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
            rect(6, 15),
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
        { sprite: "enemy1", width: 100, height: 100, speed: 100, points: 10 },
        { sprite: "enemy2", width: 70, height: 70, speed: 150, points: 25 },
        { sprite: "enemy3", width: 45, height: 45, speed: 200, points: 50 }
    ];

    function spawnEnemy() {
        const enemy = choose(enemyTypes);

        add([
            sprite(enemy.sprite, { width: enemy.width, height: enemy.height }), // Adjusted size for each enemy type
            pos(rand(0, width() - enemy.width), 0),                           // Ensure spawn within bounds
            move(DOWN, enemy.speed * difficulty),                             // Adjust speed based on difficulty
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

    // Collisions
    onCollide("bullet", "enemy", (bullet, enemy) => {
        destroy(bullet);
        destroy(enemy);
        score += enemy.points;
        scoreText.value = score;
        scoreText.text = "Score: " + score;

        // Check for level-up
        if (score >= difficulty * 1000) {
            difficulty += 1;
            levelText.text = "Level: " + difficulty;

            // Speed up enemies
            enemyTypes.forEach((e) => {
                e.speed *= 1.5; // Increase speed by 50%
            });
        }
    });

    onCollide("enemy", "player", (enemy, player) => {
        destroy(enemy);
        gameOver = true;

        add([
            text("Game Over!", { size: 32 }),
            pos(width() / 2 - 100, height() / 2 - 50)
        ]);

        add([
            text("Final Score: " + score, { size: 32 }),
            pos(width() / 2 - 100, height() / 2)
        ]);

        add([
            text("Press SPACE to restart", { size: 24 }),
            pos(width() / 2 - 100, height() / 2 + 50)
        ]);

        onKeyPress("space", () => go("game"));
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

// Start the game
go("game");
