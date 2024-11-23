// Initialize kaboom
kaboom({
    width: 800,
    height: 600,
    background: [0, 0, 30],
    canvas: document.querySelector("canvas"),
});

// Game scene
scene("game", () => {
    let gameOver = false;
    let difficulty = 1;
    
    // Add player
    const player = add([
        rect(50, 50),            
        pos(400, 500),           
        color(0, 0, 255),        
        area(),                  
        "player"                 
    ]);

    // Player movement
    onKeyDown("a", () => {
        if (!gameOver) {
            player.move(-200, 0);    
        }
    });

    onKeyDown("d", () => {
        if (!gameOver) {
            player.move(200, 0);     
        }
    });

    // Keep player in bounds
    player.onUpdate(() => {
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > width() - 50) player.pos.x = width() - 50;
    });

    // Shooting
    onKeyPress("space", () => {
        if (gameOver) {
            // Restart game
            go("game");
            return;
        }
        
        add([
            rect(6, 15),         
            pos(player.pos.x + 22, player.pos.y), 
            color(255, 255, 0),  
            move(UP, 400),       
            area(),              
            "bullet"             
        ]);
    });

    // Score display
    let score = 0;
    const scoreText = add([
        text("Score: 0", { size: 24 }),
        pos(20, 20),
        color(255, 255, 255),
    ]);

    // Level display
    const levelText = add([
        text("Level: 1", { size: 24 }),
        pos(20, 50),
        color(255, 255, 255),
    ]);

    // Different enemy types
    const enemyTypes = [
        { width: 40, height: 40, color: [255, 0, 0], speed: 100, points: 10 },    // Normal enemy
        { width: 30, height: 30, color: [255, 165, 0], speed: 200, points: 20 },  // Fast enemy
        { width: 60, height: 60, color: [128, 0, 0], speed: 50, points: 30 },     // Big enemy
    ];

    // Add enemy with increasing difficulty
    const spawnEnemy = () => {
        if (!gameOver) {
            // Randomly select enemy type, with harder enemies more common at higher levels
            const typeIndex = Math.floor(rand(0, Math.min(enemyTypes.length, difficulty)));
            const enemyType = enemyTypes[typeIndex];
            
            // Create enemy with selected properties
            add([
                rect(enemyType.width, enemyType.height),
                pos(rand(0, width() - enemyType.width), 0),
                color(enemyType.color[0], enemyType.color[1], enemyType.color[2]),          
                move(DOWN, enemyType.speed * (1 + difficulty * 0.1)),           
                area(),
                "enemy",
                { points: enemyType.points }
            ]);
        }
    };

    // Spawn enemies faster as difficulty increases
    loop(1 / (1 + difficulty * 0.1), spawnEnemy);

    // Increase difficulty every 100 points
    onUpdate(() => {
        const newDifficulty = 1 + Math.floor(score / 100);
        if (newDifficulty !== difficulty) {
            difficulty = newDifficulty;
            levelText.text = "Level: " + difficulty;
        }
    });

    // Bullet hits enemy
    onCollide("bullet", "enemy", (bullet, enemy) => {
        if (!gameOver) {
            destroy(bullet);
            destroy(enemy);
            score += enemy.points;
            scoreText.text = "Score: " + score;
        }
    });

    // Enemy hits player
    onCollide("enemy", "player", (enemy, player) => {
        if (!gameOver) {
            gameOver = true;
            
            // Game Over Text
            add([
                text("Game Over!", { size: 32 }),
                pos(width()/2 - 100, height()/2 - 50),
                color(255, 255, 255),
            ]);
            
            // Final Score
            add([
                text("Final Score: " + score, { size: 32 }),
                pos(width()/2 - 100, height()/2),
                color(255, 255, 255),
            ]);

            // Level Reached
            add([
                text("Level Reached: " + difficulty, { size: 32 }),
                pos(width()/2 - 100, height()/2 + 40),
                color(255, 255, 255),
            ]);
            
            // Restart Instructions
            add([
                text("Press SPACE to restart", { size: 32 }),
                pos(width()/2 - 150, height()/2 + 90),
                color(255, 255, 255),
            ]);
        }
    });
});

// Start the game
go("game");
