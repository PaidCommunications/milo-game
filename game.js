// Replace only the shoot() function in your working code:
    
    function shoot() {
        if (player.spreadShot) {
            // Left bullets
            add([
                rect(6, 15),
                pos(player.pos.x + 5, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            add([
                rect(6, 15),
                pos(player.pos.x + 15, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            add([
                rect(6, 15),
                pos(player.pos.x + 25, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            // Center bullet
            add([
                rect(6, 15),
                pos(player.pos.x + 22, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            // Right bullets
            add([
                rect(6, 15),
                pos(player.pos.x + 35, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            add([
                rect(6, 15),
                pos(player.pos.x + 45, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
            add([
                rect(6, 15),
                pos(player.pos.x + 55, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet"
            ]);
            
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
