const players = [
    "Bartoš",
    "Čičatka",
    "Čuvara",
    "Dvorský",
    "Gálik",
    "Gejdoš",
    "Gudkov",
    "Hikí",
    "Horváth",
    "Kosinský",
    "Kytka",
    "Mašar",
    "Montoya",
    "Morong",
    "Paulík",
    "Polakovič",
    "Rosolý",
    "Ryblár",
    "Škoda",
    "Tišťan",
    "Tóma",
    "Tóth",
    "Varovčík",
    "Vrabec",
    "Zeleňák",
    "Zukal"
];

let selectedPlayers = [];

let scores = {};

let match = {
    opponent: "ŠK Slovan",
    coach: "Peto V."
};


/* =========================
   SCREEN NAVIGATION
========================= */

function showScreen(number) {

    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    document
        .getElementById("screen" + number)
        .classList.add("active");
}


/* =========================
   START MATCH
========================= */

function startMatch() {

    match.opponent =
        document.getElementById("opponent").value || "Opponent";

    match.coach =
        document.getElementById("coach").value;

    document.getElementById("selectedCoach").textContent =
        match.coach;

    createPlayers();

    showScreen(2);
}


/* =========================
   PLAYER SELECTION
========================= */

function createPlayers() {

    const grid =
        document.getElementById("playersGrid");

    grid.innerHTML = "";

    players.forEach(player => {

        const button =
            document.createElement("button");

        button.className = "player-button";

        button.textContent = player;

        button.onclick = () =>
            togglePlayer(player, button);

        grid.appendChild(button);
    });

    updateSelectedCount();
}


function togglePlayer(player, button) {

    if (selectedPlayers.includes(player)) {

        selectedPlayers =
            selectedPlayers.filter(p => p !== player);

        button.classList.remove("selected");

    } else {

        selectedPlayers.push(player);

        button.classList.add("selected");
    }

    updateSelectedCount();
}


function updateSelectedCount() {

    document.getElementById("selectedCount").textContent =
        selectedPlayers.length;
}


/* =========================
   GOAL SCREEN
========================= */

function showGoals() {

    selectedPlayers.forEach(player => {

        if (!(player in scores)) {
            scores[player] = 0;
        }

    });

    createScoreRows();

    document.getElementById("opponentName").textContent =
        match.opponent;

    showScreen(3);
}


function createScoreRows() {

    const container =
        document.getElementById("scoreRows");

    container.innerHTML = "";

    selectedPlayers.forEach(player => {

        const row =
            document.createElement("div");

        row.className = "score-row";

        row.innerHTML = `
            <div class="score-player">${player}</div>

            <div
                class="score-number"
                id="score-${player}"
            >
                ${scores[player] || 0}
            </div>

            <button
                class="plus"
                onclick="addGoal('${player}')"
            >
                +
            </button>

            <button
                class="minus"
                onclick="removeGoal('${player}')"
            >
                −
            </button>
        `;

        container.appendChild(row);
    });

    /* Opponent own goal */
    const opponentRow =
        document.createElement("div");

    opponentRow.className = "score-row";

    opponentRow.innerHTML = `
        <div class="score-player">
            ${match.opponent} vl.
        </div>

        <div
            class="score-number"
            id="score-own"
        >
            0
        </div>

        <button
            class="plus"
            onclick="addOwnGoal()"
        >
            +
        </button>

        <button
            class="minus"
            onclick="removeOwnGoal()"
        >
            −
        </button>
    `;

    container.appendChild(opponentRow);
}


function addGoal(player) {

    scores[player] =
        (scores[player] || 0) + 1;

    updateScoreDisplay();
}


function removeGoal(player) {

    if ((scores[player] || 0) > 0) {
        scores[player]--;
    }

    updateScoreDisplay();
}


let ownGoals = 0;


function addOwnGoal() {

    ownGoals++;

    updateScoreDisplay();
}


function removeOwnGoal() {

    if (ownGoals > 0) {
        ownGoals--;
    }

    updateScoreDisplay();
}


function updateScoreDisplay() {

    let homeScore = 0;

    selectedPlayers.forEach(player => {
        homeScore += scores[player] || 0;
    });

    document.getElementById("homeScore").textContent =
        homeScore;

    document.getElementById("awayScore").textContent =
        0 + ownGoals;

    selectedPlayers.forEach(player => {

        const element =
            document.getElementById("score-" + player);

        if (element) {
            element.textContent =
                scores[player] || 0;
        }
    });

    const ownElement =
        document.getElementById("score-own");

    if (ownElement) {
        ownElement.textContent = ownGoals;
    }
}


/* =========================
   RESET
========================= */

function resetScore() {

    scores = {};
    ownGoals = 0;

    selectedPlayers.forEach(player => {
        scores[player] = 0;
    });

    createScoreRows();
    updateScoreDisplay();
}


/* =========================
   OUTPUT
========================= */

function showOutput() {

    document.getElementById("outputOpponent").textContent =
        match.opponent;

    createOutputField();

    createGoalsSummary();

    showScreen(4);
}


function createOutputField() {

    const field =
        document.getElementById("field");

    field.innerHTML = "";

    const positions = [
        [35, 5],
        [65, 5],
        [35, 42],
        [65, 42],
        [35, 79],
        [65, 79],
        [50, 112]
    ];

    selectedPlayers
        .slice(0, positions.length)
        .forEach((player, index) => {

            const playerElement =
                document.createElement("div");

            playerElement.className =
                "jersey-player";

            playerElement.style.left =
                positions[index][0] + "%";

            playerElement.style.top =
                positions[index][1] + "px";

            playerElement.innerHTML = `
                <div class="jersey"></div>
                <div>${player}</div>
            `;

            field.appendChild(playerElement);
        });
}


function createGoalsSummary() {

    const goalScorers = [];

    selectedPlayers.forEach(player => {

        const count = scores[player] || 0;

        if (count > 0) {

            if (count === 1) {
                goalScorers.push(player);
            } else {
                goalScorers.push(
                    `${player} ${count}`
                );
            }
        }
    });

    if (ownGoals > 0) {

        goalScorers.push(
            `${match.opponent} vl.`
        );
    }

    document.getElementById("goalsText").textContent =
        goalScorers.join(", ");
}


/* =========================
   RESTART
========================= */

function restartGame() {

    selectedPlayers = [];
    scores = {};
    ownGoals = 0;

    document.getElementById("opponent").value =
        "ŠK Slovan";

    showScreen(1);
}
