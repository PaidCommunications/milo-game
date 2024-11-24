// In your existing code, modify these sections:

    // Modify enemy spawning logic
    const MAX_DIFFICULTY = 10;  // Cap the difficulty scaling
    const BASE_SPAWN_RATE = 1;  // Base time between enemy spawns
    const MIN_SPAWN_RATE = 0.3; // Fastest spawn rate allowed

    function getSpawnRate() {
        // Gradually decrease spawn time but never below MIN_SPAWN_RATE
        return Math.max(
            MIN_SPAWN_RATE,
            BASE_SPAWN_RATE / (1 + (Math.min(difficulty, MAX_DIFFICULTY) * 0.1))
        );
    }

    // Replace your existing enemy spawn loop with:
    let spawnTime = 0;
    onUpdate(() => {
        if (!gameOver) {
            // Handle difficulty increase
            const newDifficulty = 1 + Math.floor(scoreText.value / 100);
            if (newDifficulty !== difficulty) {
                difficulty = newDifficulty;
                levelText.text = "Level: " + difficulty;
            }

            // Enemy spawning
            spawnTime += dt();
            if (spawnTime >= getSpawnRate()) {
                spawnEnemy();
                spawnTime = 0;
            }

            // Power-up spawning
            const timeSinceLastPowerUp = time() - lastPowerUpTime;
            if (timeSinceLastPowerUp > POWER_UP_COOLDOWN && rand(0, 1) < POWER_UP_CHANCE * dt()) {
                spawnPowerUp();
                lastPowerUpTime = time();
            }
        }
    });

    // Modify enemy spawning function
    function spawnEnemy() {
        if (gameOver) return;
        
        // Limit the enemy type selection to prevent overflow
        const maxTypeIndex = Math.min(
            enemyTypes.length - 1,
            Math.floor((difficulty - 1) / 3)  // New type every 3 levels
        );
        const typeIndex = Math.floor(rand(0, maxTypeIndex + 1));
        const enemyType = enemyTypes[typeIndex];
        
        // Cap the speed increase
        const speedMultiplier = Math.min(1 + (difficulty * 0.1), 2.5);  // Max 2.5x speed
        
        add([
            rect(enemyType.width, enemyType.height),
            pos(rand(0, width() - enemyType.width), 0),
            color(enemyType.color[0], enemyType.color[1], enemyType.color[2]),          
            move(DOWN, enemyType.speed * speedMultiplier),           
            area(),
            "enemy",
            { points: enemyType.points }
        ]);
    }

    // Modify power-up spawn settings
    const POWER_UP_COOLDOWN = 10;  // Reduced from 15 to 10 seconds
    const POWER_UP_CHANCE = 0.03;  // Increased from 0.02 to 0.03
