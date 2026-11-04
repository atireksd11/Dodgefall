"use strict";

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

const player = {
    x: 185,
    y: 520,
    size: 30,
    speed: 250,
    gotHit: false
};

const keys = {};
const blocks = [];
let timeSinceBlock = 0;
let lastTime = null;


window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] =  true;

    if (event.key.startsWith("Arrow")) {
        event.preventDefault();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

function update(deltaTime) {
    const moveAmount = player.speed * deltaTime;

    if (keys["arrowleft"] || keys["a"]) {
        player.x -= moveAmount;
    }

    if (keys["arrowright"] || keys["d"]) {
        player.x+= moveAmount;
    }

    if (keys["arrowup"] || keys["w"]) {
        player.y-= moveAmount;
    }

    if (keys["arrowdown"] || keys["s"]) {
        player.y += moveAmount;
    }

    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#ddd";
    context.font = "16px Arial";
    context.textAlign = "center";
    context.fillText("Move with WASD or arrow keys", canvas.width / 2, 30);

    context.fillStyle = player.gotHit ? "#e74c3c" : "yellow";
    context.fillRect(player.x, player.y, player.size, player.size);
    context.fillStyle = "#e74c3c";

    for (const block of blocks) {
        context.fillRect(block.x, block.y, block.size, block.size);
        }
    }
    if (player.gotHit) {
            context.fillStyle = "#fff";
            context.font = "bold 24px Arial";
            context.fillText("Collision detected!", canvas.width / 2, 80);
}

function gameLoop(timestamp) {
    let deltaTime = 0;

    if (lastTime !== null) {
        deltaTime = (timestamp - lastTime) / 1000;
    }

    lastTime = timestamp;

    update(deltaTime);

    timeSinceBlock += deltaTime;
    if (timeSinceBlock >= 1) {
        const blockSize = 30;

        blocks.push({
            x: Math.random() * (canvas.width - blockSize),
            y: -blockSize,
            size: blockSize,
            speed: 160
        });

        timeSinceBlock = 0;
    }

    for (const block of blocks) {
        block.y += block.speed * deltaTime;
        if (
            player.x < block.x + block.size && 
            player.x + player.size > block.x &&
            player.y < block.y + block.size &&
            player.y + player.size > block.y
        ) {
            player.gotHit = true;
        }
    }

    for (let i = blocks.length - 1; i >= 0; i--) {
        if (blocks[i].y > canvas.height) {
            blocks.splice(i, 1);
        }
    }
    draw();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

