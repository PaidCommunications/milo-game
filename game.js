// Initialize kaboom
kaboom({
    width: 800,
    height: 600,
    background: [0, 0, 30],
    canvas: document.querySelector("canvas"),
});

// Game scene
scene("game", () => {
    // Add player
    const player = add([
        rect(50, 50),            // Simple blue square for player
        pos(400, 500),           // Starting position
        color(0, 0, 255),        // Blue color
        area(),                  // For collisions
        "player"                 // Tag for identification
    ]);

    // Player movement
    onKeyDown("a", () => {
        player.move(-200, 0);    // Move left
    });

    onKeyDown("d", () => {
        player.move(200, 0);     // Move right
    });

    // Shooting
    onKeyPress("space", () => {
        add([
            rect(6, 15),         // Bullet shape
            pos(player.pos.x + 22, player.pos.y), // Start at player position
            color(255, 255, 0),  // Yellow bullet
            move(UP, 400),       // Move upward
            area(),              // For collisions
            "bullet"             // Tag for identification
        ]);
    });

    // Score display
    let score = 0;
    const scoreText = add([
        text("Score: 0", { size: 24 }),
        pos(20, 20),
        color(255, 255, 255),
    ]);

    // Add enemy every second
    loop(1, () => {
        add([
            rect(40, 40),
            pos(rand(0, width()), 0),  // Random position at top
            color(255, 0, 0),          // Red color
            move(DOWN, 100),           // Move down
            area(),
            "enemy"
        ]);
    });

    // Bullet hits enemy
    onCollide("bullet", "enemy", (bullet, enemy) => {
        destroy(bullet);
        destroy(enemy);
        score += 10;
        scoreText.text = "Score: " + score;
    });

    // Enemy hits player
    onCollide("enemy", "player", (enemy, player) => {
        // Game over
        go("gameOver", score);
    });
});

// Game over scene
scene("gameOver", (score) => {
    add([
        text(`Game Over!\nScore: ${score}\n\nPress Space to restart`, { size: 32 }),
        pos(width()/2, height()/2),
        origin("center"),
        color(255, 255, 255)
    ]);

    onKeyPress("space", () => {
        go("game");
    });
});

// Start the game
go("game");
