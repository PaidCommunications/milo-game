// Only changing the relevant sections of the code:

    // In the player update section, modify the invincibility color effect
    player.onUpdate(() => {
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > width() - 50) player.pos.x = width() - 50;

        // Handle auto-shoot
        if (player.autoShoot && !gameOver) {
            shoot();
        }

        // Update power-up timer and effects
        if (player.powerUpTime > 0) {
            player.powerUpTime -= dt();
            
            // Gold color for shield
            if (player.isInvincible) {
                player.color = rgb(255, 215, 0); // Gold color
            }
            
            if (player.powerUpTime <= 0) {
                player.isInvincible = false;
                player.autoShoot = false;
                player.spreadShot = false;
                player.color = rgb(0, 0, 255); // Reset to blue
            }
        }
    });

    // In the power-up collision handler, ensure color change when getting shield
    onCollide("player", "powerUp", (p, powerUp) => {
        const type = powerUp.powerUpType;
        destroy(powerUp);

        if (type.type === "extraLife") {
            lives++;
            livesText.text = "Lives: " + lives;
        } else {
            // Reset all power-ups before applying new one
            player.isInvincible = false;
            player.autoShoot = false;
            player.spreadShot = false;
            player.color = rgb(0, 0, 255); // Reset color
            
            // Apply the new power-up
            player.powerUpTime = type.duration;
            if (type.type === "shield") {
                player.isInvincible = true;
                player.color = rgb(255, 215, 0); // Set to gold immediately
            } else if (type.type === "autoShoot") {
                player.autoShoot = true;
            } else if (type.type === "spreadShot") {
                player.spreadShot = true;
            }
        }
    });
