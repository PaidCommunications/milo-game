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
    let lives = 3;
    let spawnTime = 0;
    const MIN_SPAWN_RATE = 0.3;
    
    // Create triangle player
    const player = add([
        {
            draw() {
                drawTriangle({
                    p1: vec2(0, -25),       // Top point
                    p2: vec2(-25, 25),      // Bottom left
                    p3: vec2(25, 25),       // Bottom right
                    pos: this.pos,
                    color: this.color || rgb(0, 0, 255)
                });
            }
        },
        pos(400, 500),
        area({shape: new Polygon([vec2(0, -25), vec2(-25, 25), vec2(25, 25)])}),
        color(0, 0, 255),
        {
            powerUpTime: 0,
            isInvincible: false,
            autoShoot: false,
            spreadShot: false
        },
        "player"
    ]);

    // Keep the rest of your working code exactly the same,
    // but adjust the shooting function for the triangle:

    function shoot() {
        if (player.spreadShot) {
            // 7 bullet spread
            const positions = [-30, -20, -10, 0, 10, 20, 30];
            positions.forEach(xOffset => {
                add([
                    rect(6, 15),
                    pos(player.pos.x + xOffset, player.pos.y - 20),
                    color(255, 255, 0),
                    move(UP, 400),
                    area(),
                    "bullet"
                ]);
            });
        } else {
            // Single bullet from triangle tip
            add([
                rect(6, 15),
                pos(player.pos.x - 3, player.pos.y - 25),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
        }
    }

    // Rest of your working game code stays exactly the same...
