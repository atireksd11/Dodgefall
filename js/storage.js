const STORAGE_KEY = "small-arcade-v3-profiles";
const OLD_STORAGE_KEY = "dodgefall-v2-profiles";

export function createDefaultData() {
    return {
        activeProfileId: "player-1",
        profiles: [{
            id: "player-1",
            name: "Player 1",
            coins: 0,
            gamesPlayed: 0,
            bestScores: {
                dodgefall: 0,
                "lane-rush": 0
            }
        }]
    };
}

function cleanProfile(profile, index) {
    if (!profile || typeof profile !== "object") {
        return null;
    }

    if (typeof profile.id !== "string" || typeof profile.name !== "string") {
        return null;
    }

    const oldScores = profile.bestScores || {};

    return {
        id: profile.id,
        name: profile.name.trim().slice(0, 16) || `Player ${index + 1}`,
        coins: Number.isFinite(profile.coins) ? Math.max(0, profile.coins) : 0,
        gamesPlayed: Number.isFinite(profile.gamesPlayed)
            ? Math.max(0, profile.gamesPlayed)
            : 0,
        bestScores: {
            dodgefall: Number.isFinite(oldScores.dodgefall)
                ? Math.max(0, oldScores.dodgefall)
                : Number.isFinite(profile.best)
                    ? Math.max(0, profile.best)
                    : 0,
            "lane-rush": Number.isFinite(oldScores["lane-rush"])
                ? Math.max(0, oldScores["lane-rush"])
                : 0
        }
    };
}

export function loadData() {
    const currentText = localStorage.getItem(STORAGE_KEY);
    const oldText = localStorage.getItem(OLD_STORAGE_KEY);
    const savedText = currentText || oldText;

    if (!savedText) {
        return createDefaultData();
    }

    const saved = JSON.parse(savedText);

    if (!saved || !Array.isArray(saved.profiles)) {
        throw new Error("The saved profile data has an unexpected format.");
    }

    const profiles = saved.profiles
        .map(cleanProfile)
        .filter((profile) => profile !== null);

    if (profiles.length === 0) {
        profiles.push(createDefaultData().profiles[0]);
    }

    const activeExists = profiles.some((profile) => {
        return profile.id === saved.activeProfileId;
    });

    return {
        activeProfileId: activeExists ? saved.activeProfileId : profiles[0].id,
        profiles
    };
}

export function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}