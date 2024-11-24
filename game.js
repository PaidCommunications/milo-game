// In your existing code, replace only the player creation part:

    // Player base - triangle instead of rectangle
    const player = add([
        polygon(3, 40),  // triangle with radius 40      
        pos(400, 500),           
        color(0, 0, 255),        
        area(),
        rotate(0), // Point triangle upward
        anchor("center"),
        {
            powerUpTime: 0,
            isInvincible: false,
            autoShoot: false,
            spreadShot: false
        },
        "player"                 
    ]);

    // Face elements adjusted for triangle
    const eyes = add([
        "eyes",
        pos(0, 0),
        {
            draw() {
                drawRect({
                    width: 8,
                    height: 8,
                    pos: vec2(player.pos.x - 15, player.pos.y),
                    color: rgb(255, 255, 255),
                });
                drawRect({
                    width: 8,
                    height: 8,
                    pos: vec2(player.pos.x + 7, player.pos.y),
                    color: rgb(255, 255, 255),
                });
            },
        },
    ]);

    const mouth = add([
        "mouth",
        pos(0, 0),
        {
            draw() {
                drawRect({
                    width: 20,
                    height: 5,
                    pos: vec2(player.pos.x - 10, player.pos.y + 15),
                    color: rgb(255, 255, 255),
                });
            },
        },
    ]);

    // Also update the shooting positions
    function shoot() {
        if (player.spreadShot) {
            // Adjust bullet positions for triangle shape
            const bulletPositions = [
                {x: -25, y: 0},
                {x: -15, y: 0},
                {x: -5, y: 0},
                {x: 0, y: -10}, // Center bullet slightly higher
                {x: 5, y: 0},
                {x: 15, y: 0},
                {x: 25, y: 0}
            ];
            
            bulletPositions.forEach(pos => {
                add([
                    rect(6, 15),
                    pos(player.pos.x + pos.x, player.pos.y + pos.y),
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
                pos(player.pos.x - 3, player.pos.y - 20),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
        }
    }
