// Only need to modify the shooting function in your code:

    // Modified shooting function with 7 bullets
    function shoot() {
        if (player.spreadShot) {
            // Seven bullet spread
            const bulletPositions = [
                { x: -18, y: 0 },  // Far left
                { x: -12, y: 0 },  // Mid left
                { x: -6, y: 0 },   // Near left
                { x: 0, y: 0 },    // Center
                { x: 6, y: 0 },    // Near right
                { x: 12, y: 0 },   // Mid right
                { x: 18, y: 0 }    // Far right
            ];
            
            bulletPositions.forEach((pos) => {
                add([
                    rect(6, 15),
                    pos(player.pos.x + 22 + pos.x, player.pos.y),
                    color(255, 255, 0),
                    move(UP, 400),
                    area(),
                    "bullet"
                ]);
            });
        } else {
            // Normal single shot
            add([
                rect(6, 15),
                pos(player.pos.x + 22, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
        }
    }
