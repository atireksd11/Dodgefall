export function createLaneRush({ canvas, onScore, onCoin, onGameOver }) {
    const context = canvas.getContext("2d");
    const laneX = [80, 200, 320];
    const playerY = 505;
    const playerSize = 34;
    const obstacles = [];
    const coins = [];

    let playerLane = 1;
    let score = 0;
    let survivalTime = 0;
    let obstacleTimer = 0;
    let coinTimer = 0;
    let leftWasDown = false;
    let rightWasDown = false;
    let ended = false;

    function start() {
        playerLane = 1;
        score = 0;
        survivalTime = 0;
        obstacleTimer = 0;
        coinTimer = 0;
        leftWasDown = false;
        rightWasDown = false;
        ended = false;
        obstacles.length = 0;
        coins.length = 0;
        onScore(score);
    }

    function addScore(points) {
        score += points;
        onScore(score);
    }

    function update(deltaTime, keys) {
        if (ended) {
            return;
        }

        survivalTime += deltaTime;

        const leftDown = keys.a || keys.arrowleft;
        const rightDown = keys.d || keys.arrowright;

        if (leftDown && !leftWasDown) {
            playerLane = Math.max(0, playerLane - 1);
        }

        if (rightDown && !rightWasDown) {
            playerLane = Math.min(2, playerLane + 1);
        }

        leftWasDown = leftDown;
        rightWasDown = rightDown;

        obstacleTimer += deltaTime;
        const obstacleDelay = Math.max(0.45, 1 - survivalTime * 0.012);

        if (obstacleTimer >= obstacleDelay) {
            obstacleTimer -= obstacleDelay;
            obstacles.push({
                lane: Math.floor(Math.random() * 3),
                y: -40,
                size: 34
            });
        }

        coinTimer += deltaTime;

        if (coinTimer >= 2.5) {
            coinTimer = 0;
            coins.push({
                lane: Math.floor(Math.random() * 3),
                y: -20,
                radius: 10
            });
        }

        const speed = Math.min(190 + survivalTime * 5, 420);

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            obstacle.y += speed * deltaTime;

            const hitsPlayer =
                obstacle.lane === playerLane &&
                obstacle.y + obstacle.size > playerY &&
                obstacle.y < playerY + playerSize;
            
            if (hitsPlayer) {
                ended = true;
                onGameOver(score);
                return;
            }

            if (obstacle.y > canvas.height) {
                obstacles.splice(i, 1); 
                addScore(1);
            }
        }

        for (let i = coins.length - 1; i >= 0; i--) {
            const coin = coins[i];
            coin.y += Math.min(speed * 0.8, 300) * deltaTime;

            const gotCoin = 
                coin.lane === playerLane &&
                coin.y + coin.radius >= playerY && 
                coin.y - coin.radius <= playerY + playerSize;

            if (gotCoin) {
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

        for (let i = 0; i < laneX.length; i++) {
            context.fillStyle = i === playerLane ? "#24271e" : "#191a17";
            context.fillRect(laneX[i] - 58, 0, 116, canvas.height);

            context.strokeStyle = "#393a32";
            context.setLineDash([8, 10]);
            context.beginPath();
            context.moveTo(laneX[i], 0);
            context.lineTo(laneX[i], canvas.height);
            context.stroke();
            context.setLineDash([]);
        }

        for (const coin of coins) {
            context.beginPath();
            context.arc(laneX[coin.lane], coin.y, coin.radius, 0, Math.PI * 2);
            context.fillStyle = "#f0c75e";
            context.fill();
        }

        for (const obstacle of obstacles) {
            context.fillStyle = "#df6c55";
            context.fillRect(
                laneX[obstacle.lane] - obstacle.size / 2,
                obstacle.y,
                obstacle.size,
                obstacle.size
            );
        }

        context.fillStyle = "#d7ed75";
        context.fillRect(
            laneX[playerLane] - playerSize / 2,
            playerY,
            playerSize,
            playerSize
        );
    }

    return { start, update, draw };
}