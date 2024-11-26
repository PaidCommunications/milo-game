// Kaboom.js initialization
kaboom({
    width: window.innerWidth,
    height: window.innerHeight,
    background: [40, 40, 40], // Match the background color to objects
    canvas: document.querySelector("canvas"),
    stretch: true,
    letterbox: true
});

// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get, query, orderByChild, limitToLast } from "firebase/database";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOxG55SjBKMYpEIslXlb6ASYHo",
    authDomain: "miloinvasion-database.firebaseapp.com",
    projectId: "miloinvasion-database",
    storageBucket: "miloinvasion-database.firebaseapp.com",
    messagingSenderId: "802510030136",
    appId: "1:802510030136:web:ec8b2d86707d7a90b32dcd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Submit high score to the database
function submitScore(screenName, score, level) {
    const scoresRef = ref(db, "highscores/");
    push(scoresRef, {
        screenName,
        score,
        level,
        timestamp: Date.now()
    }).catch((error) => console.error("Error submitting score:", error));
}

// Retrieve high scores
function getHighScores(callback) {
    const scoresRef = query(ref(db, "highscores/"), orderByChild("score"), limitToLast(10));
    get(scoresRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                const scores = [];
                snapshot.forEach((childSnapshot) => {
                    scores.push(childSnapshot.val());
                });
                callback(scores.reverse());
            } else {
                callback([]);
            }
        })
        .catch((error) => console.error("Error retrieving scores:", error));
}

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
scene("game", ({ screenName }) => {
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

    // Shooting logic
    function shoot() {
        if (player.isInvisible) return;
        const bulletPos = vec2(player.pos.x + player.width / 2 - 3, player.pos.y);
        play("shoot");

        add([
            rect(6, 15),
            pos(bulletPos),
            move(UP, 400),
            color(255, 255, 0),
            area(),
            "bullet"
        ]);
    }

    // Game over logic (submitting score)
    onCollide("player", "enemy", (player, enemy) => {
        if (player.forcefield) {
            destroy(enemy);
            score += enemy.points;
            scoreText.text = "Score: " + score;
        } else {
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;

            if (lives <= 0) {
                gameOver = true;

                // Submit score to Firebase
                submitScore(screenName, score, difficulty);

                // Game over screen
                go("gameOver", { screenName, score, difficulty, enemiesKilled });
            }
        }
    });
});

// Start screen with leaderboard and screen name input
scene("start", () => {
    let screenName = "";

    add([
        text(
            "MiloInvasion V4\n\n" +
                "Instructions:\n" +
                "- Arrow keys or WASD to move\n" +
                "- Spacebar to shoot\n" +
                "Power-Ups:\n" +
                "Green: Forcefield\n" +
                "Light Purple: Rapid Fire (automatic)\n" +
                "White: Extra Life\n" +
                "Blue: Spread Shot\n" +
                "Dark Purple: Bomb\n\n" +
                "Enter your screen name below:\n",
            { size: 24 }
        ),
        pos(50, 50)
    ]);

    const inputBox = add([
        rect(300, 50),
        pos(50, 400),
        outline(2),
        area()
    ]);

    const inputText = add([
        text("", { size: 24 }),
        pos(55, 410),
        { screenName: "" }
    ]);

    onKeyPress((key) => {
        if (key === "enter" && screenName.trim() !== "") {
            go("game", { screenName });
        } else if (key === "backspace") {
            screenName = screenName.slice(0, -1);
        } else if (key.length === 1) {
            screenName += key;
        }
        inputText.text = screenName;
    });

    getHighScores((scores) => {
        const leaderboardText = scores
            .map((s, i) => `${i + 1}. ${s.screenName}: ${s.score} (Level ${s.level})`)
            .join("\n");
        add([
            text("Leaderboard:\n" + leaderboardText, { size: 18 }),
            pos(50, 500)
        ]);
    });
});

go("start");
