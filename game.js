// Initialize kaboom (keep the same)

// Game scene
scene("game", () => {
    // ... (keep existing initialization code)

    // Modified player object to include more power-up states
    const player = add([
        rect(50, 50),            
        pos(400, 500),           
        color(0, 0, 255),        
        area(),
        {
            powerUpTime: 0,
            isInvincible: false,
            rapidFire: false,
            autoShoot: false,
            spreadShot: false,
            currentPowerUp: null
        },
        "player"                 
    ]);

    // Enhanced power-up types
    const powerUpTypes = [
        { 
            color: [0, 255, 0],      // Green
            type: "shield", 
            duration: 5,
            description: "Shield" 
        },
        { 
            color: [255, 255, 0],    // Yellow
            type: "rapidFire", 
            duration: 8,
            description: "Rapid Fire" 
        },
        { 
            color: [255, 0, 255],    // Purple
            type: "autoShoot", 
            duration: 6,
            description: "Auto Shoot" 
        },
        { 
            color: [0, 255, 255],    // Cyan
            type: "spreadShot", 
            duration: 7,
            description: "Spread Shot" 
        }
    ];

    // Power-up status display
    const powerUpText = add([
        text("", { size: 20 }),
        pos(20, 110),
        color(255, 255, 255)
    ]);

    // Auto-shoot timer
    let autoShootTimer = 0;
    const AUTO_SHOOT_DELAY = 0.3;

    // Update player status and power-ups
    player.onUpdate(() => {
        if (!gameOver) {
            // Handle auto-shooting
            if (player.autoShoot) {
                autoShootTimer += dt();
                if (autoShootTimer >= AUTO_SHOOT_DELAY) {
                    shoot();
                    autoShootTimer = 0;
                }
            }

            // Update power-up timer and status
            if (player.powerUpTime > 0) {
                player.powerUpTime -= dt();
                powerUpText.text = `${player.currentPowerUp}: ${Math.ceil(player.powerUpTime)}s`;
                
                if (player.powerUpTime <= 0) {
                    resetPowerUps();
                    powerUpText.text = "";
                }
            }

            // Visual effects for invincibility
            if (player.isInvincible) {
                player.color = rgb(
                    rand(0, 255),
                    rand(0, 255),
                    rand(0, 255)
                );
            } else {
                player.color = rgb(0, 0, 255);
            }
        }
    });

    // Shooting function
    function shoot() {
        if (player.spreadShot) {
            // Spread shot: 3 bullets in a spread pattern
            for (let angle of [-15, 0, 15]) {
                const speed = 400;
                const rad = angle * Math.PI / 180;
                add([
                    rect(6, 15),
                    pos(player.pos.x + 22, player.pos.y),
                    color(255, 255, 0),
                    move(Vec2.fromAngle(rad - Math.PI/2).scale(speed)),
                    area(),
                    "bullet",
                    { damage: 1 }
                ]);
            }
        } else {
            // Normal shot
            add([
                rect(6, 15),
                pos(player.pos.x + 22, player.pos.y),
                color(255, 255, 0),
                move(UP, 400),
                area(),
                "bullet",
                { damage: 1 }
            ]);
        }
    }

    // Modified shooting controls
    let canShoot = true;
    onKeyDown("space", () => {
        if (gameOver) {
            go("game");
            return;
        }
        
        if (canShoot && !player.autoShoot) {
            shoot();
            canShoot = false;
            const cooldown = player.rapidFire ? 0.1 : 0.5;
            wait(cooldown, () => {
                canShoot = true;
            });
        }
    });

    // Reset power-ups function
    function resetPowerUps() {
        player.isInvincible = false;
        player.rapidFire = false;
        player.autoShoot = false;
        player.spreadShot = false;
        player.currentPowerUp = null;
    }

    // Power-up spawn configuration
    let lastPowerUpTime = 0;
    const POWER_UP_COOLDOWN = 15;    // Minimum 15 seconds between power-ups
    const POWER_UP_CHANCE = 0.02;    // 2% chance per second

    // Spawn power-up with modified timing
    onUpdate(() => {
        if (!gameOver) {
            // Update difficulty (keep existing difficulty code)

            // Check for power-up spawn
            const timeSinceLastPowerUp = time() - lastPowerUpTime;
            if (timeSinceLastPowerUp > POWER_UP_COOLDOWN && rand(0, 1) < POWER_UP_CHANCE * dt()) {
                spawnPowerUp();
                lastPowerUpTime = time();
            }
        }
    });

    // Modified power-up collision handling
    onCollide("player", "powerUp", (p, powerUp) => {
        destroy(powerUp);
        const type = powerUp.powerUpType;
        
        // Reset any active power-ups
        resetPowerUps();
        
        // Apply new power-up
        player.powerUpTime = type.duration;
        player.currentPowerUp = type.description;
        
        switch(type.type) {
            case "shield":
                player.isInvincible = true;
                break;
            case "rapidFire":
                player.rapidFire = true;
                break;
            case "autoShoot":
                player.autoShoot = true;
                autoShootTimer = 0;
                break;
            case "spreadShot":
                player.spreadShot = true;
                break;
        }
        
        createExplosion(player.pos, rgb(type.color[0], type.color[1], type.color[2]));
    });

    // Keep the rest of your existing game code...
});

// Start the game
go("game");
