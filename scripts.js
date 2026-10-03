/* ==================================================
   DATA
================================================== */

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


/* ==================================================
   APPLICATION STATE
================================================== */

const game = {

    opponent: "ŠK Slovan",

    squads: 1,

    coach: "",

    selectedPlayers: [],

    goals: {},

    opponentOwnGoals: 0,

    awayScore: 0,

    timerSeconds: 0,

    timerRunning: false,

    timerInterval: null

};


/* ==================================================
   ELEMENTS
================================================== */

const opponentInput =
    document.getElementById("opponent");

const squadsSelect =
    document.getElementById("squads");

const coachGroup =
    document.getElementById("coachGroup");

const coachSelect =
    document.getElementById("coach");

const startButton =
    document.getElementById("startButton");

const playersGrid =
    document.getElementById("playersGrid");

const selectedCount =
    document.getElementById("selectedCount");

const selectionCoach =
    document.getElementById("selectionCoach");

const scoreRows =
    document.getElementById("scoreRows");

const homeScore =
    document.getElementById("homeScore");

const awayScore =
    document.getElementById("awayScore");

const gameOpponent =
    document.getElementById("gameOpponent");

const timerDisplay =
    document.getElementById("timerDisplay");

const outputOpponent =
    document.getElementById("outputOpponent");

const outputScore =
    document.getElementById("outputScore");

const outputCoach =
    document.getElementById("outputCoach");

const outputDate =
    document.getElementById("outputDate");

const goalsText =
    document.getElementById("goalsText");

const field =
    document.getElementById("field");


/* ==================================================
   SCREEN NAVIGATION
================================================== */

function showScreen(number) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    const target =
        document.getElementById(`screen${number}`);

    if (target) {
        target.classList.add("active");
    }
}


/* ==================================================
   SCREEN 1
   SQUADS / COACH
================================================== */

function updateCoachVisibility() {

    const squads =
        Number(squadsSelect.value);

    game.squads = squads;

    if (squads === 2) {

        coachGroup.classList.remove("hidden");

    } else {

        coachGroup.classList.add("hidden");

        game.coach = "";
    }
}


squadsSelect.addEventListener(
    "change",
    updateCoachVisibility
);


startButton.addEventListener(
    "click",
    startMatch
);


function startMatch() {

    game.opponent =
        opponentInput.value.trim() || "Opponent";

    game.squads =
        Number(squadsSelect.value);


    if (game.squads === 2) {

        game.coach =
            coachSelect.value;

    } else {

        game.coach = "";
    }


    game.selectedPlayers = [];

    game.goals = {};

    game.opponentOwnGoals = 0;

    game.awayScore = 0;


    game.playersRendered = false;


    renderPlayers();

    updateSelectionHeader();

    showScreen(2);
}


/* ==================================================
   SCREEN 2
   PLAYER SELECTION
================================================== */

function renderPlayers() {

    playersGrid.innerHTML = "";


    players.forEach(player => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "player-button";


        if (
            game.selectedPlayers.includes(player)
        ) {

            button.classList.add("selected");
        }


        button.textContent =
            player;


        button.addEventListener(
            "click",
            () => togglePlayer(player, button)
        );


        playersGrid.appendChild(button);
    });
}


function togglePlayer(player, button) {

    const index =
        game.selectedPlayers.indexOf(player);


    if (index === -1) {

        game.selectedPlayers.push(player);

        game.goals[player] =
            game.goals[player] || 0;

        button.classList.add("selected");

    } else {

        game.selectedPlayers.splice(index, 1);

        delete game.goals[player];

        button.classList.remove("selected");
    }


    updateSelectionHeader();
}


function updateSelectionHeader() {

    selectedCount.textContent =
        game.selectedPlayers.length;


    if (game.squads === 2) {

        selectionCoach.textContent =
            `Coach: ${game.coach}`;

    } else {

        selectionCoach.textContent = "";
    }
}


/* ==================================================
   SCREEN 2 NAVIGATION
================================================== */

document
    .getElementById("playersBack")
    .addEventListener(
        "click",
        () => showScreen(1)
    );


document
    .getElementById("playersNext")
    .addEventListener(
        "click",
        () => {

            if (
                game.selectedPlayers.length === 0
            ) {

                alert(
                    "Vyber aspoň jedného hráča."
                );

                return;
            }


            renderScoreRows();

            updateScore();

            showScreen(3);
        }
    );


/* ==================================================
   SCREEN 3
   SCORE
================================================== */

function renderScoreRows() {

    scoreRows.innerHTML = "";


    game.selectedPlayers.forEach(
        player => {

            const row =
                document.createElement("div");

            row.className =
                "score-row";


            row.innerHTML = `

                <div class="score-player">
                    ${player}
                </div>

                <div
                    class="score-number"
                    id="goal-${escapeId(player)}"
                >
                    ${game.goals[player] || 0}
                </div>

                <button
                    class="goal-button"
                    data-player="${player}"
                    data-action="plus"
                >
                    +
                </button>

                <button
                    class="goal-button"
                    data-player="${player}"
                    data-action="minus"
                >
                    −
                </button>
            `;


            scoreRows.appendChild(row);
        }
    );


    /* Opponent own goal */

    const ownGoalRow =
        document.createElement("div");

    ownGoalRow.className =
        "score-row";


    ownGoalRow.innerHTML = `

        <div class="score-player">
            ${game.opponent} vl.
        </div>

        <div
            class="score-number"
            id="own-goal-count"
        >
            ${game.opponentOwnGoals}
        </div>

        <button
            class="goal-button"
            data-own-goal="plus"
        >
            +
        </button>

        <button
            class="goal-button"
            data-own-goal="minus"
        >
            −
        </button>
    `;


    scoreRows.appendChild(ownGoalRow);


    scoreRows
        .querySelectorAll(
            "[data-player]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const player =
                        button.dataset.player;

                    const action =
                        button.dataset.action;


                    changePlayerGoals(
                        player,
                        action
                    );
                }
            );
        });


    scoreRows
        .querySelectorAll(
            "[data-own-goal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    changeOwnGoals(
                        button.dataset.ownGoal
                    );
                }
            );
        });
}


function changePlayerGoals(
    player,
    action
) {

    if (!game.goals[player]) {
        game.goals[player] = 0;
    }


    if (action === "plus") {

        game.goals[player]++;

    } else {

        game.goals[player] =
            Math.max(
                0,
                game.goals[player] - 1
            );
    }


    renderScoreRows();

    updateScore();
}


function changeOwnGoals(action) {

    if (action === "plus") {

        game.opponentOwnGoals++;

    } else {

        game.opponentOwnGoals =
            Math.max(
                0,
                game.opponentOwnGoals - 1
            );
    }


    renderScoreRows();

    updateScore();
}


function updateScore() {

    let homeGoals = 0;


    game.selectedPlayers.forEach(
        player => {

            homeGoals +=
                game.goals[player] || 0;
        }
    );


    /*
        Opponent own goals are goals
        for FKM KV.
    */

    homeGoals +=
        game.opponentOwnGoals;


    homeScore.textContent =
        homeGoals;


    awayScore.textContent =
        game.awayScore;


    gameOpponent.textContent =
        game.opponent;
}


/* ==================================================
   SCORE RESET
================================================== */

document
    .getElementById("resetButton")
    .addEventListener(
        "click",
        resetScore
    );


function resetScore() {

    game.selectedPlayers.forEach(
        player => {
            game.goals[player] = 0;
        }
    );


    game.opponentOwnGoals = 0;

    game.awayScore = 0;


    renderScoreRows();

    updateScore();
}


/* ==================================================
   SCREEN 3 BACK
================================================== */

document
    .getElementById("goalsBack")
    .addEventListener(
        "click",
        () => showScreen(2)
    );


/* ==================================================
   STOPWATCH
================================================== */

document
    .getElementById("timerButton")
    .addEventListener(
        "click",
        toggleTimer
    );


function toggleTimer() {

    if (game.timerRunning) {

        stopTimer();

    } else {

        startTimer();
    }
}


function startTimer() {

    if (game.timerRunning) {
        return;
    }


    game.timerRunning = true;


    game.timerInterval =
        setInterval(
            () => {

                game.timerSeconds++;

                updateTimerDisplay();

            },
            1000
        );
}


function stopTimer() {

    game.timerRunning = false;


    clearInterval(
        game.timerInterval
    );


    game.timerInterval = null;
}


function updateTimerDisplay() {

    const minutes =
        Math.floor(
            game.timerSeconds / 60
        );


    const seconds =
        game.timerSeconds % 60;


    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


/* ==================================================
   OUTPUT
================================================== */

document
    .getElementById("outputButton")
    .addEventListener(
        "click",
        showOutput
    );


function showOutput() {

    updateScore();

    renderOutputHeader();

    renderGoalsSummary();

    renderField();

    showScreen(4);
}


/* ==================================================
   OUTPUT HEADER
================================================== */

function renderOutputHeader() {

    outputOpponent.textContent =
        game.opponent;


    outputScore.textContent =
        `${homeScore.textContent} : ${awayScore.textContent}`;


    outputDate.textContent =
        getCurrentDate();


    if (game.squads === 2) {

        outputCoach.textContent =
            `team: ${game.coach}`;

    } else {

        outputCoach.textContent = "";
    }
}


/* ==================================================
   OUTPUT DATE
================================================== */

function getCurrentDate() {

    const date =
        new Date();


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const year =
        date.getFullYear();


    return `${day}.${month}.${year}`;
}


/* ==================================================
   GOAL SUMMARY
================================================== */

function renderGoalsSummary() {

    const summary = [];


    game.selectedPlayers.forEach(
        player => {

            const count =
                game.goals[player] || 0;


            if (count > 0) {

                if (count === 1) {

                    summary.push(player);

                } else {

                    summary.push(
                        `${player} ${count}`
                    );
                }
            }
        }
    );


    if (game.opponentOwnGoals > 0) {

        summary.push(
            `${game.opponent} vl.`
        );
    }


    goalsText.textContent =
        summary.length > 0
            ? summary.join(", ")
            : "-";
}


/* ==================================================
   OUTPUT FIELD
================================================== */

function renderField() {

    field.innerHTML = "";


    /*
        Positions are based on the
        screenshot.

        No goalkeeper.
    */

    const positions = [

        { x: 25, y: 7 },

        { x: 67, y: 7 },

        { x: 25, y: 48 },

        { x: 67, y: 48 },

        { x: 25, y: 89 },

        { x: 67, y: 89 },

        { x: 46, y: 130 }

    ];


    game.selectedPlayers
        .slice(
            0,
            positions.length
        )
        .forEach(
            (player, index) => {

                const position =
                    positions[index];


                const playerElement =
                    document.createElement("div");


                playerElement.className =
                    "field-player";


                playerElement.style.left =
                    `${position.x}%`;


                playerElement.style.top =
                    `${position.y}px`;


                playerElement.innerHTML = `

                    <div class="jersey"></div>

                    <div>
                        ${player}
                    </div>
                `;


                field.appendChild(
                    playerElement
                );
            }
        );
}


/* ==================================================
   OUTPUT BACK
================================================== */

document
    .getElementById("outputBack")
    .addEventListener(
        "click",
        () => {

            renderScoreRows();

            updateScore();

            showScreen(3);
        }
    );


/* ==================================================
   RESTART
================================================== */

document
    .getElementById("restartButton")
    .addEventListener(
        "click",
        restartGame
    );


function restartGame() {

    stopTimer();


    game.opponent =
        "ŠK Slovan";

    game.squads =
        1;

    game.coach =
        "";

    game.selectedPlayers =
        [];

    game.goals =
        {};

    game.opponentOwnGoals =
        0;

    game.awayScore =
        0;

    game.timerSeconds =
        0;


    opponentInput.value =
        "ŠK Slovan";


    squadsSelect.value =
        "1";


    coachSelect.value =
        "Peťo Šiko";


    updateCoachVisibility();

    updateTimerDisplay();

    showScreen(1);
}


/* ==================================================
   HELPER
================================================== */

function escapeId(text) {

    return text
        .replace(
            /[^a-zA-Z0-9]/g,
            "-"
        );
}


/* ==================================================
   INITIALIZATION
================================================== */

updateCoachVisibility();

updateTimerDisplay();
