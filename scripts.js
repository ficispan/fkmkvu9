// Master database array of players
const PLAYER_DATABASE = [
    "Bartoš", "Čičatka", "Čuvara", "Dvorský", "Galko", "Gejdoš", 
    "Gudkov", "Hikl", "Horváth", "Kosinský", "Kytka", "Masár", 
    "Montoya", "Morong", "Paulík", "Polakovič", "Rosolov", "Rybár", 
    "Škoda", "Tištan", "Torma", "Tóth", "Vavrovič", "Vrabec", "Zeleňák", "Žukal"
];

// Goalkeeper configuration hook
const GOALKEEPER_NAME = "Vrabec";

let appState = {
    opponent: "ŠK Slovan",
    coach: "Peto V.",
    nominatedPlayers: [],
    scores: {}, 
    opponentScore: 0
};

let timerInterval = null;
let totalSeconds = 0;

document.addEventListener("DOMContentLoaded", () => {
    renderNominationGrid();
    setupCoachListener();
});

function nextScreen(screenNum) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenNum}`).classList.add('active');
}

// Generate Screen 2 Player selection buttons
function renderNominationGrid() {
    const grid = document.getElementById('squad-grid');
    grid.innerHTML = "";
    
    PLAYER_DATABASE.forEach(name => {
        const btn = document.createElement('button');
        btn.className = "player-btn";
        btn.textContent = name;
        
        // Populate standard default selectors matching your image layout
        const defaultSelected = ["Gejdoš", "Gudkov", "Kosinský", "Kytka", "Montoya", "Morong", "Tištan", "Vrabec"];
        if(defaultSelected.includes(name)) {
            btn.classList.add('active');
            if(!appState.nominatedPlayers.includes(name)) appState.nominatedPlayers.push(name);
        }

        btn.onclick = () => {
            if(btn.classList.contains('active')) {
                btn.classList.remove('active');
                appState.nominatedPlayers = appState.nominatedPlayers.filter(p => p !== name);
            } else {
                btn.classList.add('active');
                appState.nominatedPlayers.push(name);
            }
            document.getElementById('selected-count').textContent = appState.nominatedPlayers.length;
        };
        grid.appendChild(btn);
    });
    document.getElementById('selected-count').textContent = appState.nominatedPlayers.length;
}

function setupCoachListener() {
    const select = document.getElementById('coach-select');
    select.addEventListener('change', (e) => {
        document.getElementById('meta-coach').textContent = e.target.value;
        appState.coach = e.target.value;
    });
}

// Proceed to runtime event logging interface
function startMatch() {
    appState.opponent = document.getElementById('opponent-name').value || "Opponent";
    document.getElementById('live-opp-name').textContent = appState.opponent;
    
    appState.nominatedPlayers.forEach(p => {
        appState.scores[p] = appState.scores[p] || 0;
    });
    
    // Label tag configuration for own goals explicitly tied to opponent
    const ownGoalLabel = `${appState.opponent} own goal`;
    appState.scores[ownGoalLabel] = appState.scores[ownGoalLabel] || 0;

    renderScorersRows(ownGoalLabel);
    updateLiveScoreDisplay();
    nextScreen(3);
}

// Generate incremental tracking nodes
function renderScorersRows(ownGoalLabel) {
    const container = document.getElementById('scorers-rows-container');
    container.innerHTML = "";

    // Render active field crew roster nodes
    const fieldPlayers = appState.nominatedPlayers.filter(p => p !== GOALKEEPER_NAME);

    fieldPlayers.forEach(name => {
        createRowElement(container, name);
    });

    // Append custom tracking node element mapped for opponent's own goal
    createRowElement(container, ownGoalLabel);
}

function createRowElement(container, name) {
    const row = document.createElement('div');
    row.className = "scorer-row-item";

    const nameSpan = document.createElement('span');
    nameSpan.className = "scorer-name";
    nameSpan.textContent = name;

    const controls = document.createElement('div');
    controls.className = "scorer-controls";

    const countSpan = document.createElement('span');
    countSpan.className = "scorer-counter";
    countSpan.id = `count-${name.replace(/\s+/g, '-')}`;
    countSpan.textContent = appState.scores[name] || 0;

    const btnMinus = document.createElement('button');
    btnMinus.className = "btn-math";
    btnMinus.textContent = "−";
    btnMinus.onclick = () => {
        if(appState.scores[name] > 0) {
            appState.scores[name]--;
            countSpan.textContent = appState.scores[name];
            updateLiveScoreDisplay();
        }
    };

    const btnPlus = document.createElement('button');
    btnPlus.className = "btn-math";
    btnPlus.textContent = "+";
    btnPlus.onclick = () => {
        appState.scores[name] = (appState.scores[name] || 0) + 1;
        countSpan.textContent = appState.scores[name];
        updateLiveScoreDisplay();
    };

    controls.appendChild(countSpan);
    controls.appendChild(btnPlus);
    controls.appendChild(btnMinus);
    
    row.appendChild(nameSpan);
    row.appendChild(controls);
    container.appendChild(row);
}

function addOpponentGoal() {
    appState.opponentScore++;
    updateLiveScoreDisplay();
}

function resetScore() {
    Object.keys(appState.scores).forEach(k => appState.scores[k] = 0);
    appState.opponentScore = 0;
    updateLiveScoreDisplay();
    
    const ownGoalLabel = `${appState.opponent} own goal`;
    renderScorersRows(ownGoalLabel);
}

function updateLiveScoreDisplay() {
    let ourTotal = 0;
    Object.keys(appState.scores).forEach(key => {
        ourTotal += appState.scores[key];
    });
    document.getElementById('live-score-text').textContent = `${ourTotal} : ${appState.opponentScore}`;
}

// Timer logic functions
function toggleTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    } else {
        timerInterval = setInterval(() => {
            totalSeconds++;
            const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            const secs = String(totalSeconds % 60).padStart(2, '0');
            document.getElementById('timer-display').textContent = `${mins}:${secs}`;
        }, 1000);
    }
}

// Render dynamic statistical layouts into Screen 4 export asset
function finishMatch() {
    if (timerInterval) toggleTimer();

    // Chrono timestamp formatting
    const d = new Date();
    const formattedDate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    document.getElementById('graphic-current-date').textContent = formattedDate;

    // Calculate runtime values
    let ourTotal = 0;
    Object.keys(appState.scores).forEach(key => ourTotal += appState.scores[key]);
    
    document.getElementById('graph-score-span').textContent = `${ourTotal} : ${appState.opponentScore}`;
    document.getElementById('graph-opp-span').textContent = appState.opponent;
    document.getElementById('graph-coach-span').textContent = `team: ${appState.coach}`;

    // Compute concise score updates string mapping (e.g., Gejdoš 3, Gudkov 2)
    let goalsArray = [];
    Object.keys(appState.scores).forEach(name => {
        if(appState.scores[name] > 0) {
            goalsArray.push(`${name} ${appState.scores[name] > 1 ? appState.scores[name] : ''}`.trim());
        }
    });
    document.getElementById('graph-goals-text-summary').textContent = goalsArray.length > 0 ? goalsArray.join(', ') : "None";

    // Rebuild active grid compilation object items
    const jerseysGrid = document.getElementById('jerseys-container-grid');
    jerseysGrid.innerHTML = "";

    const fieldPlayers = appState.nominatedPlayers.filter(p => p !== GOALKEEPER_NAME);
    
    fieldPlayers.forEach(name => {
        const item = document.createElement('div');
        item.className = "jersey-item";
        
        const icon = document.createElement('div');
        icon.className = "jersey-icon-svg";
        icon.textContent = "👕"; 
        
        if((appState.scores[name] || 0) > 0) {
            icon.style.filter = "drop-shadow(0px 0px 6px #c91d24)";
        }

        const nameDiv = document.createElement('div');
        nameDiv.className = "jersey-player-name";
        nameDiv.textContent = name;

        item.appendChild(icon);
        item.appendChild(nameDiv);

        if((appState.scores[name] || 0) > 0) {
            const badge = document.createElement('div');
            badge.className = "jersey-goals-badge";
            badge.textContent = `⚽ ${appState.scores[name]}`;
            item.appendChild(badge);
        }

        jerseysGrid.appendChild(item);
    });

    document.getElementById('gk-name-display').textContent = GOALKEEPER_NAME;

    nextScreen(4);
}

function changeGraphicTheme() {
    const val = document.getElementById('theme-selector').value;
    const card = document.getElementById('export-graphic-area');
    if(val === "dark-mode") {
        card.classList.add('dark-theme-active');
    } else {
        card.classList.remove('dark-theme-active');
    }
}

function restartApp() {
    totalSeconds = 0;
    document.getElementById('timer-display').textContent = "00:00";
    appState.scores = {};
    appState.opponentScore = 0;
    nextScreen(1);
}
