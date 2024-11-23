// Keep all the existing code the same, but modify these sections:

    // Modified Power-up types - add extra life
    const powerUpTypes = [
        { color: [0, 255, 0], type: "shield", duration: 5 },       // Green shield
        { color: [255, 100, 255], type: "autoShoot", duration: 8 }, // Purple auto-shoot
        { color: [0, 255, 255], type: "spreadShot", duration: 6 },  // Cyan spread shot
        { color: [255, 255, 255], type: "extraLife", duration: 0 }  // White extra life
    ];

    // Modified power-up collision handler
    onCollide("player", "powerUp", (p, powerUp) => {
        destroy(powerUp);
        const type = powerUp.powerUpType;
        
        if (type.type === "extraLife") {
            // Extra life power-up
            lives++;
            livesText.text = "Lives: " + lives;
        } else {
            // Reset all power-ups
            player.isInvincible = false;
            player.autoShoot = false;
            player.spreadShot = false;
            
            // Apply new power-up
            player.powerUpTime = type.duration;
            if (type.type === "shield") {
                player.isInvincible = true;
            } else if (type.type === "autoShoot") {
                player.autoShoot = true;
            } else if (type.type === "spreadShot") {
                player.spreadShot = true;
            }
        }
    });
