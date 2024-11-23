// Initialize kaboom
kaboom({
    width: 800,
    height: 600,
    background: [0, 0, 30],
    canvas: document.querySelector("canvas"),
});

// Add a simple shape to verify the game is working
add([
    rect(100, 100),
    pos(400, 300),
    color(255, 0, 0),
]);

// Add text to verify rendering
add([
    text("Game Test", { size: 32 }),
    pos(350, 200),
    color(255, 255, 255),
]);
