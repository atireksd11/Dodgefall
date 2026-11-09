import { createDefaultData, loadData, saveData } from "./storage.js";
import { createDodgefall } from "./games/dodgefall.js";
import { createLaneRush } from "./games/lane-rush.js";

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");

if (!context) {
    throw new Error("This browser could not create the game canvas.");
}

const menuScreen = document.getElementById("menu-screen");
const playScreen = document.getElementById("play-screen");
const notice = document.getElementById("notice");
const profileSelect = document.getElementById("profile-select");
const profileForm = document.getElementById("new-profile-form");
const profileNameInput = document.getElementById("new-profile-name");
const bestDodgefallText = document.getElementById("best-dodgefall");
const bestLanesText = document.getElementById("best-lanes");
const coinCountText = document.getElementById("coin-count");
const gamesPlayedText = document.getElementById("games-played");
const gameTitle = document.getElementById("game-title");
const gameKicker = document.getElementById("game-kicker");
const gameInstructionsTitle = document.getElementById("game-instructions-title");
const gameDescription = document.getElementById("game-description");
const gameControls = document.getElementById("game-controls");
const gameBestText = document.getElementById("game-best");
const scoreText = document.getElementById("current-score");
const stateText = document.getElementById("game-state-label");
const playerLabel = document.getElementById("current-player-label");
const startButton = document.getElementById("start-button");
const pauseButton = document.getElementById("pause-button");
const restartButton = document.getElementById("restart-button");
const backButton = document.getElementById("back-button");
const backRunButton = document.getElementById("back-run-button");

const gameOptions = {
    dodgefall: {
        title: "Dodgefall",
        instructions: "Dodge the blocks.",
        description: "Move around the arena, avoid the falling blocks, and collect coins for bonus points.",
        controls: "WASD or arrow keys to move.",
        create: createDodgefall
    },
    "lane-rush": {
        title: "Lane Rush",
        instructions: "Watch the lanes.",
        description: "Switch between three lanes to avoid obstacles. Coins are worth five bonus points.",
        controls: "A / D or left / right arrows to switch lanes.",
        create: createLaneRush
    }
};

const keys = {};
let data;
let activeProfile;
let selectedGameId = "dodgefall";
let gameState = "menu";
let activeGame = null;
let score = 0;
let previousTime = null;

try {
    data = loadData();
} catch (error) {
    console.error("Could not load saved profile data:", error);
    data = createDefaultData();
    showNotice("Saved data could not be read, so a fresh profile was opened.", true);
}

activeProfile = data.profiles.find((profile) => {
    return profile.id === data.activeProfileId;
}) || data.profiles[0];

function showNotice(message, isError = false) {
    notice.textContent = message;
    notice.classList.toggle("error", isError);
}

function saveProgress() {
    try {
        saveData(data);
    } catch (error) {
        console.error("Could not save game progress:", error);
        showNotice("Progress could not be saved in this browser.", true);
    }
}

function getBestScore(gameId) {
    return activeProfile.bestScores[gameId] || 0;
}

function refreshProfileStats() {
    bestDodgefallText.textContent = getBestScore("dodgefall");
    bestLanesText.textContent = getBestScore("lane-rush");
    coinCountText.textContent = activeProfile.coins;
    gamesPlayedText.textContent = activeProfile.gamesPlayed;
    gameBestText.textContent = getBestScore(selectedGameId);
    playerLabel.textContent = activeProfile.name;
}

function fillProfileSelect() {
    profileSelect.replaceChildren();

    for (const profile of data.profiles) {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;
        profileSelect.appendChild(option);
    }

    profileSelect.value = activeProfile.id;
}

function updateMenuCards() {
    for (const button of document.querySelectorAll(".game-choice")) {
        const isSelected = button.dataset.game === selectedGameId;
        button.setAttribute("aria-pressed", String(isSelected));
    }
}

function updateInterface() {
    const showingPlay = gameState !== "menu";

    menuScreen.hidden = showingPlay;
    playScreen.hidden = !showingPlay;

    const option = gameOptions[selectedGameId];
    gameTitle.textContent = option.title;
    gameKicker.textContent = `GAME 0${selectedGameId === "dodgefall" ? "1" : "2"}`;
    gameInstructionsTitle.textContent = option.instructions;
    gameDescription.textContent = option.description;
    gameControls.textContent = option.controls;

    const labels = {
        menu: "MENU",
        ready: "READY",
        playing: "PLAYING",
        paused: "PAUSED",
        gameover: "GAME OVER"
    };

    stateText.textContent = labels[gameState];
    scoreText.textContent = String(score);

    profileSelect.disabled = gameState !== "menu";
    startButton.textContent = gameState === "gameover" ? "Play again" : "Start run";
    startButton.disabled = gameState === "playing" || gameState === "paused";
    pauseButton.disabled = gameState !== "playing" && gameState !== "paused";
    pauseButton.textContent = gameState === "paused" ? "Resume" : "Pause";
    restartButton.disabled = gameState === "menu" || gameState === "ready";

    refreshProfileStats();
    updateMenuCards();
}

function clearKeys() {
    for (const key in keys) {
        keys[key] = false;
    }
}

function chooseGame(gameId) {
    if (!gameOptions[gameId]) {
        showNotice("That game could not be selected.", true);
        return;
    }

    selectedGameId = gameId;
    gameState= "ready";
    score = 0;
    activeGame = gameOptions[gameId].create({
        canvas, 
        onScore(newScore) {
            score = newScore;

            if (score > getBestScore(selectedGameId)) {
                activeProfile.bestScores[selectedGameId] = score;
                saveProgress();
            }

            updateInterface();
        },
        onCoin() {
            activeProfile.coins += 1;
            saveProgress();
            refreshProfileStats();
        },
        onGameOver(finalScore) {
            score = finalScore;
            gameState = "gameover";
            clearKeys();
            updateInterface();
            showNotice(`Run over. Your score was ${finalScore}. `);
        }
    });

    activeGame.start();
    updateInterface();
    showNotice(`${gameOptions[selectedGameId].title} selected. Press Start run when you're ready. `);
}

function startRun() {
    if (!activeGame) {
        chooseGame(selectedGameId);
    }

    activeGame.start();
    activeProfile.gamesPlayed += 1;
    gameState = "playing"
    score = 0;
    clearKeys();
    saveProgress();
    updateInterface();
    showNotice("Good luck!");
}

function returnToMenu() {
    gameState = "menu";
    activeGame = null;
    score = 0;
    clearKeys();
    fillProfileSelect();
    updateInterface();
    showNotice("Choose a game to start a new run.");
}

function switchProfile() {
    const profile = data.profiles.find((item) => {
        return item.id === profileSelect.value;
    });

    if (!profile) {
        showNotice("That profile could not be found.", true);
        return;
    }

    activeProfile = profile;
    data.activeProfileId = profile.id;
    saveProgress();
    updateInterface();
}

function addProfile(event) {
    event.preventDefault();

    const name = profileNameInput.value.trim();

    if (!name) {
        showNotice("Enter a name for the new player.", true);
        return;
    }

    const existing = data.profiles.find((profile) => {
        return profile.name.toLowerCase() === name.toLowerCase();
    });

    if (existing) {
        actvieProfile = existing;
        data.activeProfileId = existing.id;
        fillProfileSelect();
        updateInterface();
        showProgress();
        showNotice("That player already exists, so I selected it.");
        return;
    }

    const profile = {
        id: `player-${Date.now()}`,
        name: name.slice(0, 16),
        coins: 0,
        gamesPlayed: 0,
        bestScores: {
            dodgefall: 0,
            "lane-rush": 0,
        }
    };

    data.profiles.push(profile);
    activeProfile = profile;
    data.activeProfileId = profile.id;
    profileNameInput.value = "";
    fillProfileSelect();
    updateInterface();
    saveProgress();
    showNotice(`Added player ${profile.name}.`);
}

function togglePause() {
    if (gameState === "playing") {
        gameState = "paused";
        clearKeys();
        showNotice("Run paused.");
    } else if (gameState === "paused") {
        gameState = "playing";
        showNotice("Back to it.");
    }

    updateInterface();
}

function drawWelcome() {
    context.fillStyle = "#10110f";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#d7ed75";
    context.textAlign = "center";
    context.font = "bold 28px Arial";
    context.fillText("SMALL ARCADE", canvas.width / 2, 270);
    context.fillStyle = "#b7b4a7";
    context.font = "15px Arial";
    context.fillText("Choose a game from the shelf.", canvas.width / 2, 305);
}

function drawOverlay(title, line, hint) {
    context.fillStyle = "rgba(16, 17, 15, 0.84)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = "center";
    context.fillStyle = "#eee9dc";
    context.font = "bold 30px Arial";
    context.fillText(title, canvas.width / 2, 270);
    context.fillStyle = "#b7b4a7";
    context.font = "15px Arial";
    context.fillText(line, canvas.width / 2, 305);
    context.fillStyle = "#d7ed75";
    context.font = "13px Arial";
    context.fillText(hint, canvas.width / 2, 340);
}

function draw() {
    if (!activeGame) {
        drawWelcome();
        return;
    }

    activeGame.draw();

    if (gameState === "paused") {
        drawOverlay("PAUSED", "Take a break.", "Press Esc or Resume to continue");
    } else if (gameState === "gameover") {
        drawOverlay("RUN OVER", `Score: ${score}`, "Press R or choose Play again");
    }
}

function frame(timestamp) {
    let deltaTime = 0;

    if (previousTime !== null) {
        deltaTime = Math.min((timestamp - previousTime) / 1000, 0.05);
    }

    previousTime = timestamp;

    if (gameState === "playing" && activeGame) {
        activeGame.update(deltaTime, keys);
    }

    draw();
    requestAnimationFrame(frame);
}

for (const button of document.querySelectorAll(".game-choice")) {
    button.addEventListener("click", () => {
        chooseGame(button.dataset.game);
    });
}

profileSelect.addEventListener("change", switchProfile);
profileForm.addEventListener("submit", addProfile);
startButton.addEventListener("click", startRun);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", startRun);
backButton.addEventListener("click", returnToMenu);
backRunButton.addEventListener("click", returnToMenu);
window.addEventListener("keydown", (event) => {
    const target = event.target;

    if (target instanceof HTMLElement &&
        target.closest("input, select, button")) {
        return;
    }

    const key = event.key.toLowerCase();

    if (gameState === "playing" && key.startsWith("arrow")) {
        event.preventDefault();
    }

    if (key === "escape") {
        togglePause();
        return;
    }

    if (key === "r" && gameState === "gameover") {
        startRun();
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

fillProfileSelect();
updateInterface();
requestAnimationFrame(frame);