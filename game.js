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
        rect(50, 50),            
        pos(400, 500),           
        color(0, 0, 255),        
        area(),                  
        "player"                 
    ]);

    // Player movement
    onKeyDown("a", () => {
        player.move(-200, 0);    
    });

    onKeyDown("d", () => {
        player.move(200, 0);     
    });

    // Keep player in bounds
    player.onUpdate(() => {
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > width() - 50) player.pos.x = width() - 50;
    });

    // Shooting
    onKeyPress("space", () => {
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

    // Add enemy every second
    loop(1, () => {
        add([
            rect(40, 40),
            pos(rand(0, width() - 40), 0),  // Prevent spawning partially off-screen
            color(255, 0, 0),          
            move(DOWN, 100),           
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
        go("gameOver", score);
    });
});

// Game over scene
scene("gameOver", (score) => {
    // Calculate center position
    const centerX = width() / 2;
    const centerY = height() / 2;
    
    // Game Over text
    add([
        text("Game Over!", { size: 32 }),
        pos(centerX, centerY - 50),
        color(255, 255, 255),
    ]).text = "Game Over!";
    
    // Score text
    add([
        text("Score: " + score, { size: 32 }),
        pos(centerX, centerY),
        color(255, 255, 255),
    ]).text = "Score: " + score;
    
    // Restart instruction
    add([
        text("Press SPACE to restart", { size: 24 }),
        pos(centerX, centerY + 50),
        color(255, 255, 255),
    ]).text = "Press SPACE to restart";

    // Center align all text
    every(text(), (t) => {
        t.pos.x -= t.width / 2;
    });

    // Restart handler
    onKeyPress("space", () => {
        go("game");
    });
});

// Start the game
go("game");
