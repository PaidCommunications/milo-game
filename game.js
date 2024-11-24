// Replace only the player creation part:
    
    // Add player
    const player = add([
        rect(50, 50),            
        pos(400, 500),           
        color(0, 0, 255),        
        area(),
        {
            powerUpTime: 0,
            isInvincible: false,
            autoShoot: false,
            spreadShot: false
        },
        "player"                 
    ]);

    // Add face features (eyes and smile)
    const leftEye = add([
        rect(8, 8),
        color(255, 255, 255),
        pos(player.pos.x + 10, player.pos.y + 15),
        "face"
    ]);

    const rightEye = add([
        rect(8, 8),
        color(255, 255, 255),
        pos(player.pos.x + 32, player.pos.y + 15),
        "face"
    ]);

    const smile = add([
        rect(20, 5),
        color(255, 255, 255),
        pos(player.pos.x + 15, player.pos.y + 35),
        "face"
    ]);

    // Update face position with player
    player.onUpdate(() => {
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > width() - 50) player.pos.x = width() - 50;

        // Update face positions
        leftEye.pos.x = player.pos.x + 10;
        leftEye.pos.y = player.pos.y + 15;
        
        rightEye.pos.x = player.pos.x + 32;
        rightEye.pos.y = player.pos.y + 15;
        
        smile.pos.x = player.pos.x + 15;
        smile.pos.y = player.pos.y + 35;

        // Handle auto-shoot
        if (player.autoShoot && !gameOver) {
            shoot();
        }

        // Update power-up timer
        if (player.powerUpTime > 0) {
            player.powerUpTime -= dt();
            
            // Gold color when invincible
            if (player.isInvincible) {
                player.use(color(255, 215, 0));
            }
            
            if (player.powerUpTime <= 0) {
                player.isInvincible = false;
                player.autoShoot = false;
                player.spreadShot = false;
                player.use(color(0, 0, 255));
            }
        }
    });

    // Add to game over collision
    onCollide("enemy", "player", (enemy, player) => {
        if (!gameOver && !player.isInvincible) {
            destroy(enemy);
            lives--;
            livesText.text = "Lives: " + lives;

            if (lives <= 0) {
                gameOver = true;
                destroy(leftEye);
                destroy(rightEye);
                destroy(smile);
                
                add([
                    text("Game Over!", { size: 32 }),
                    pos(width()/2 - 100, height()/2 - 50)
                ]);
                
                // Rest of game over code...
            }
        }
    });
