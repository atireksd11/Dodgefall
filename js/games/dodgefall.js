export function createDodgefall({ canvas, onScore, onCoin, onGameOver }) {
    const context = canvas.getContext("2d");
    const player = { x: 185, y: 520, size: 30, speed: 250 };
    const blocks = [];
    const coins = [];

    let score = 0;
    let survivalTime = 0;
    let blockTimer = 0;
    let coinTimer = 0;
    let ended = false;

    function start() {
        player.x = canvas.width / 2 - player.size / 2;
        player.y = canvas.height - player.size - 35;
        blocks.length = 0;
        coins.length = 0;
        score = 0;
        survivalTime = 0;
        blockTimer = 0;
        coinTimer = 0;
        ended = false;
        onScore(score);
    }

    function addScore(points) {
        score += points;
        onScore(score);
    }

    function touchesPlayer(block) {
        return player.x < block.x + block.size &&
            player.x + player.size > block.x &&
            player.y < block.y + block.size &&
            player.y + player.size > block.y;
    }

    function touchesCoin(coin) {
        const nearestX = Math.max(player.x, Math.min(coin.x, player.x + player.size));
        const nearestY = Math.max(player.y, Math.min(coin.y, player.y + player.size));
        const dx = coin.x - nearestX;
        const dy = coin.y - nearestY;

        return dx * dx + dy * dy < coin.radius * coin.radius;
    }

    function update(deltaTime, keys) {
        if (ended) {
            return;
        }

        survivalTime += deltaTime;

        let dx = 0;
        let dy = 0;

        if (keys.a || keys.arrowleft) dx -= 1;
        if (keys.d || keys.arrowright) dx += 1;
        if (keys.w || keys.arrowup) dy -= 1;
        if (keys.s || keys.arrowdown) dy += 1;

        const length = Math.hypot(dx, dy);

        if (length > 0) {
            player.x += dx / length * player.speed * deltaTime;
            player.y += dy / length * player.speed * deltaTime;
        }

        player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
        player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

        blockTimer += deltaTime;
        const blockDelay = Math.max(0.42, 0.95 - survivalTime * 0.01);

        if (blockTimer >= blockDelay) {
            blockTimer -= blockDelay;
            blocks.push({
                x: Math.random() * (canvas.width - 30),
                y: -30,
                size: 30
            });
        }

        coinTimer += deltaTime;

        if (coinTimer >= 3) {
            coinTimer = 0;
            coins.push({
                x: 15 + Math.random() * (canvas.width - 30),
                y: -15,
                radius: 11
            });
        }

        const blockSpeed = Math.min(160 + survivalTime * 5, 400);

        for (let i = blocks.length - 1; i >= 0; i--) {
            const block = blocks[i];
            block.y += blockSpeed * deltaTime;

            if (touchesPlayer(block)) {
                ended = true;
                onGameOver(score);
                return;
            }

            if (block.y > canvas.height) {
                blocks.splice(i, 1);
                addScore(1);
            }
        }

        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];
            coin.y += Math.min(125 + survivalTime * 2, 250) * deltaTime;

            if (touchesCoin(coin)) {
                coins.splice(i, 1);
                onCoin();
                addScore(5);
            } else if (coin.y - coin.radius > canvas.height) {
                coins.splice(i, 1);
            }
        }
    }

    function draw() {
        context.fillStyle = "#10110f";
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = "#272922";
        context.lineWidth = 1;

        for (let x = 20; x < canvas.width; x += 40) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
            context.stroke();
        }

        for (let y = 20; y < canvas.height; y += 40) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
            context.stroke();
        }

        for (const coin of coins) {
            context.beginPath();
            context.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
            context.fillStyle = "#f0c75e";
            context.fill();
        }

        for (const block of blocks) {
            context.fillStyle = "#df6c55";
            context.fillRect(block.x, block.y, block.size, block.size);
        }

        context.fillStyle = "#d7ed75";
        context.fillRect(player.x, player.y, player.size, player.size);
    }

    return { start, update, draw };
}