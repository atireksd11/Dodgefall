    "use strict";

const canvas = document.getElementById("game");
const menuScreen = document.getElementById("menu-screen");
const playScreen = document.getElementById("play-screen");
const currentProfileName = document.getElementById("current-profile-name");
const gameCointCount = document.getElementById("game-coin-count");
const context = canvas.getContext("2d");


if (!context) {
    throw new Error("Could not get the canvas drawing context.");
}

const profileSelect = document.getElementById("profile-select");
const newProfileForm = document.getElementById("new-profile-form");
const newProfileName = document.getElementById("new-profile-name");
const bestScoreText = document.getElementById("best-score");
const coinCountText = document.getElementById("coin-count");
const gamesPlayedText = document.getElementById("games-played");
const currentScoreText = document.getElementById("current-score");
const gameStateLabel = document.getElementById("game-state-label");
const notice = document.getElementById("notice");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const restartButton = document.getElementById("restart-button");
const menuButton = document.getElementById("menu-button");

const saveKey = "dodgefall-v2-profiles";

function makeDefaultProfile() {
    return {
        id: "player-1",
        name: "Player 1",
        best: 0,
        coins: 0,
        gamesPlayed: 0
    };
}

function loadSavedData() {
    try {
        const savedText = localStorage.getItem(saveKey);

        if (!savedText) {
            return {
                profiles: [makeDefaultProfile()],
                activeProfileId: "player-1"
            };
        }

        const saved = JSON.parse(savedText);

        if (!saved || !Array.isArray(saved.profiles)) {
            throw new Error("Saved profile data has the wrong format.");
        }

        const profiles = saved.profiles
            .filter((profile) => {
                return profile &&
                    typeof profile.id === "string" &&
                    typeof profile.name === "string";
            })
            .map((profile) => {
                return {
                    id: profile.id,
                    name: profile.name.slice(0, 16),
                    best: Number.isFinite(profile.best) ? Math.max(0, profile.best) : 0,
                    coins: Number.isFinite(profile.coins) ? Math.max(0, profile.coins) : 0,
                    gamesPlayed: Number.isFinite(profile.gamesPlayed)
                        ? Math.max(0, profile.gamesPlayed)
                        : 0
                };
            });

        if (profiles.length === 0) {
            profiles.push(makeDefaultProfile());
        }

        const hasActiveProfile = profiles.some((profile) => {
            return profile.id === saved.activeProfileId;
        });

        return {
            profiles,
            activeProfileId: hasActiveProfile
                ? saved.activeProfileId
                : profiles[0].id
        };
    } catch (error) {
        console.error("Could not load Dodgefall profiles:", error);

        return {
            profiles: [makeDefaultProfile()],
            activeProfileId: "player-1"
        };
    }
}

const savedData = loadSavedData();
const profiles = savedData.profiles;
let activeProfileId = savedData.activeProfileId;
let activeProfile = profiles.find((profile) => {
    return profile.id === activeProfileId;
});

if (!activeProfile) {
    activeProfile = profiles[0];
    activeProfileId = activeProfile.id;
}

const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 65,
    size: 30,
    speed: 250
};

const keys = {};
const blocks = [];
const coins = [];

let gameState = "menu";
let score = 0;
let survivalTime = 0;
let blockTimer = 0;
let coinTimer = 0;
let lastFrameTime = null;

function saveData() {
    try {
        localStorage.setItem(saveKey, JSON.stringify({
            profiles,
            activeProfileId
        }));
    } catch (error) {
        console.error("Could not save Dodgefall progress:", error);
        showNotice("Progress could not be saved in this browser.", true);
    }
}

function showNotice(message, isError = false) {
    notice.textContent = message;
    notice.classList.toggle("error", isError);
}

function fillProfileList() {
    profileSelect.replaceChildren();

    for (const profile of profiles) {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;
        profileSelect.appendChild(option);
    }

    profileSelect.value = activeProfileId;
}

function updateInterface() {
    bestScoreText.textContent = activeProfile.best;
    coinCountText.textContent = activeProfile.coins;
    gamesPlayedText.textContent = activeProfile.gamesPlayed;
    currentScoreText.textContent = `Score: ${score}`;

    const labels = {
        menu: "MENU",
        playing: "PLAYING",
        paused: "PAUSED",
        gameover: "GAME OVER"
    };

    gameStateLabel.textContent = labels[gameState];
    const showingGame = gameState !== "menu";
    menuScreen.hidden = showingGame;
    playScreen.hidden = !showingGame;
    currentProfileName.textContent = activeProfile.name;
    gameCointCount.textContent = activeProfile.coins;
    profileSelect.disabled = gameState === "playing" || gameState === "paused";

    startButton.disabled = gameState === "playing" || gameState === "paused";
    pauseButton.disabled = gameState !== "playing" && gameState !== "paused";
    restartButton.disabled = gameState === "menu";
    menuButton.disabled = gameState === "menu";

    if (gameState === "gameover") {
        startButton.textContent = "Play again";
    } else {
        startButton.textContent = "Start game";
    }

    pauseButton.textContent = gameState === "paused" ? "Resume" : "Pause";
}

function clearKeys() {
    for (const key in keys) {
        keys[key] = false;
    }
}

function resetRound() {
    score = 0;
    survivalTime = 0;
    blockTimer = 0;
    coinTimer = 0;
    blocks.length = 0;
    coins.length = 0;

    player.x = canvas.width / 2 - player.size / 2;
    player.y = canvas.height - player.size - 35;

    clearKeys();
}

function startGame() {
    resetRound();
    gameState = "playing";
    activeProfile.gamesPlayed += 1;

    saveData();
    updateInterface();
    showNotice("Good luck! Dodge blocks and collect coins.");
}

function showMenu() {
    gameState = "menu";
    resetRound();
    updateInterface();
    showNotice("Choose a profile, then start a game.");
}

function endGame() {
    gameState = "gameover";
    clearKeys();

    if (score > activeProfile.best) {
        activeProfile.best = score;
    }

    saveData();
    updateInterface();
    showNotice(`Game over! Final score: ${score}.`);
}

function addProfile(event) {
    event.preventDefault();
    const name = newProfileName.value.trim();

    if (!name) {
        showNotice("Type a name for the new profile first.", true);
        return;
    }

    const existingProfile = profiles.find((profile) => {
        return profile.name.toLowerCase() === name.toLowerCase();
    });

    if (existingProfile) {
        activeProfile = existingProfile;
        activeProfileId = existingProfile.id;
        showMenu();
        fillProfileList();
        saveData();
        showNotice("That profile already exists, so I selected it.");
        return;
    }

    const profile = {
        id: `player-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        name: name.slice(0, 16),
        best: 0,
        coins: 0,
        gamesPlayed: 0
    };

    profiles.push(profile);
    activeProfile = profile;
    activeProfileId = profile.id;

    newProfileName.value = "";
    fillProfileList();
    showMenu();
    saveData();
    showNotice(`Profile created for ${profile.name}.`);
}

function switchProfile() {
    const selectedProfile = profiles.find((profile) => {
        return profile.id === profileSelect.value;
    });

    if (!selectedProfile) {
        showNotice("Could not find that profile.", true);
        return;
    }

    activeProfile = selectedProfile;
    activeProfileId = selectedProfile.id;

    showMenu();
    saveData();
    updateInterface();
}

function rectanglesTouch(a, b) {
    return a.x < b.x + b.size &&
        a.x + a.size > b.x &&
        a.y < b.y + b.size &&
        a.y + a.size > b.y;
}

function collectCoin(coin) {
    const closestX = Math.max(player.x, Math.min(coin.x, player.x + player.size));
    const closestY = Math.max(player.y, Math.min(coin.y, player.y + player.size));
    const distanceX = coin.x - closestX;
    const distanceY = coin.y - closestY;

    return distanceX * distanceX + distanceY * distanceY <
        coin.radius * coin.radius;
}

function updateScore(points) {
    score += points;

    if (score > activeProfile.best) {
        activeProfile.best = score;
        saveData();
    }

    updateInterface();
}

function update(deltaTime) {
    if (gameState !== "playing") {
        return;
    }

    survivalTime += deltaTime;

    let moveX = 0;
    let moveY = 0;

    if (keys.a || keys.arrowleft) {
        moveX -= 1;
    }

    if (keys.d || keys.arrowright) {
        moveX += 1;
    }

    if (keys.w || keys.arrowup) {
        moveY -= 1;
    }

    if (keys.s || keys.arrowdown) {
        moveY += 1;
    }

    const moveLength = Math.hypot(moveX, moveY);

    if (moveLength > 0) {
        player.x += (moveX / moveLength) * player.speed * deltaTime;
        player.y += (moveY / moveLength) * player.speed * deltaTime;
    }

    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    const blockInterval = Math.max(0.4, 0.95 - survivalTime * 0.01);
    blockTimer += deltaTime;

    if (blockTimer >= blockInterval) {
        blockTimer -= blockInterval;

        blocks.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            size: 30,
            speed: Math.min(160 + survivalTime * 5, 400)
        });
    }

    coinTimer += deltaTime;

    if (coinTimer >= 3) {
        coinTimer = 0;

        coins.push({
            x: 16 + Math.random() * (canvas.width - 32),
            y: -20,
            radius: 11,
            speed: Math.min(125 + survivalTime * 2, 250)
        });
    }

    for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        block.y += block.speed * deltaTime;

        if (rectanglesTouch(player, block)) {
            endGame();
            return;
        }

        if (block.y > canvas.height) {
            blocks.splice(i, 1);
            updateScore(1);
        }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.y += coin.speed * deltaTime;

        if (collectCoin(coin)) {
            coins.splice(i, 1);
            activeProfile.coins += 1;
            updateScore(5);
            saveData();
            showNotice("Coin collected! That’s 5 bonus points.");
        } else if (coin.y - coin.radius > canvas.height) {
            coins.splice(i, 1);
        }
    }

    updateInterface();
}

function drawBackground() {
    context.fillStyle = "#101827";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "rgba(130, 170, 220, 0.08)";
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
}

function drawPlayer() {
    context.fillStyle = "#73eadb";
    context.fillRect(player.x, player.y, player.size, player.size);

    context.fillStyle = "#e9fffb";
    context.fillRect(player.x + 5, player.y + 5, player.size - 10, 4);
}

function drawBlock(block) {
    const gradient = context.createLinearGradient(
        block.x,
        block.y,
        block.x + block.size,
        block.y + block.size
    );

    gradient.addColorStop(0, "#ff7187");
    gradient.addColorStop(1, "#bd3d68");

    context.fillStyle = gradient;
    context.fillRect(block.x, block.y, block.size, block.size);

    context.fillStyle = "rgba(255, 255, 255, 0.28)";
    context.fillRect(block.x + 4, block.y + 4, block.size - 8, 3);
}

function drawCoin(coin) {
    context.beginPath();
    context.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
    context.fillStyle = "#ffd166";
    context.shadowColor = "#ffd166";
    context.shadowBlur = 14;
    context.fill();
    context.shadowBlur = 0;

    context.beginPath();
    context.arc(coin.x, coin.y, coin.radius - 4, 0, Math.PI * 2);
    context.strokeStyle = "#fff1bd";
    context.lineWidth = 2;
    context.stroke();
}

function drawMessage(title, line, hint) {
    context.fillStyle = "rgba(8, 13, 24, 0.78)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#f4f6ff";
    context.textAlign = "center";
    context.font = "bold 30px Arial";
    context.fillText(title, canvas.width / 2, 255);

    context.fillStyle = "#b9c9e2";
    context.font = "17px Arial";
    context.fillText(line, canvas.width / 2, 292);

    context.fillStyle = "#79e4d8";
    context.font = "14px Arial";
    context.fillText(hint, canvas.width / 2, 330);
}

function draw() {
    drawBackground();

    for (const coin of coins) {
        drawCoin(coin);
    }

    for (const block of blocks) {
        drawBlock(block);
    }

    drawPlayer();

    if (gameState === "menu") {
        drawMessage("DODGEFALL", "Dodge blocks. Collect coins.", "Press Start game to play");
    } else if (gameState === "paused") {
        drawMessage("PAUSED", "Take a breather.", "Press Esc or Resume to continue");
    } else if (gameState === "gameover") {
        drawMessage("GAME OVER", `Your score: ${score}`, "Press R or Play again");
    }
}

function gameLoop(timestamp) {
    let deltaTime = 0;

    if (lastFrameTime !== null) {
        deltaTime = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
    }

    lastFrameTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

newProfileForm.addEventListener("submit", addProfile);
profileSelect.addEventListener("change", switchProfile);

startButton.addEventListener("click", startGame);

pauseButton.addEventListener("click", () => {
    if (gameState === "playing") {
        gameState = "paused";
        clearKeys();
        showNotice("Game paused.");
    } else if (gameState === "paused") {
        gameState = "playing";
        showNotice("Back in the game!");
    }

    updateInterface();
});

restartButton.addEventListener("click", startGame);
menuButton.addEventListener("click", showMenu);

window.addEventListener("keydown", (event) => {
    if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, select, button")
    ) {
        return;
    }

    const key = event.key.toLowerCase();

    if (key.startsWith("arrow") && gameState === "playing") {
        event.preventDefault();
    }

    if (key === "escape") {
        if (gameState === "playing") {
            gameState = "paused";
            clearKeys();
            showNotice("Game paused.");
            updateInterface();
        } else if (gameState === "paused") {
            gameState = "playing";
            showNotice("Back in the game!");
            updateInterface();
        }

        return;
    }

    if (key === "r" && gameState === "gameover") {
        startGame();
        return;
    }

    if (gameState === "playing") {
        keys[key] = true;
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

window.addEventListener("blur", clearKeys);

fillProfileList();
updateInterface();
requestAnimationFrame(gameLoop);

