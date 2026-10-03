// ----------------------------------------------------
// 1. CORE NAVIGATION (Placed at top for instant safety)
// ----------------------------------------------------
function nextScreen(screenNum) {
    console.log("Navigating to screen: " + screenNum);
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(`screen-${screenNum}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
        console.error(`Screen ${screenNum} not found in HTML!`);
    }
}

// ----------------------------------------------------
// 2. CONFIGURATION & MASTER DATABASE
// ----------------------------------------------------
const PLAYER_DATABASE = [
    "Bartoš", "Čičatka", "Čuvara", "Dvorský", "Galko", "Gejdoš", 
    "Gudkov", "Hikl", "Horváth", "Kosinský", "Kytka", "Masár", 
    "Montoya", "Morong", "Paulík", "Polakovič", "Rosolov", "Rybár", 
    "Škoda", "Tištan", "Torma", "Tóth", "Vavrovič", "Vrabec", "Zeleňák", "Žukal"
];

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

// ----------------------------------------------------
// 3. SAFE INITIALIZATION (Protected via try-catch)
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    try {
        renderNominationGrid();
        setupCoachListener();
        console.log("App safely initialized.");
    } catch (error) {
        console.error("Initialization failed, but core navigation is protected:", error);
    }
});

function renderNominationGrid() {
    const grid = document.getElementById('squad-grid');
    if (!grid) return;
    grid.innerHTML = "";
    
    PLAYER_DATABASE.forEach(name => {
        const btn = document.createElement('button');
        btn.className = "player-btn";
        btn.textContent = name;
        
        // Auto-select defaults from layout setup
        const defaultSelected = ["Gejdoš", "Gudkov", "Kosinský", "Kytka", "Montoya", "Morong", "Tištan", "Vrabec"];
        if (defaultSelected.includes(name)) {
            btn.classList.add('active');
            if (!appState.nominatedPlayers.includes(name)) appState.nominatedPlayers.push(name);
        }

        btn.onclick = () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                appState.nominatedPlayers = appState.nominatedPlayers.filter(p => p !== name);
            } else {
                btn.classList.add('active');
                appState.nominatedPlayers.push(name);
            }
            const counter = document.getElementById('selected-count');
            if (counter) counter.textContent = appState.nominatedPlayers.length;
        };
        grid.appendChild(btn);
    });
    
    const counter = document.getElementById('selected-count');
    if (counter) counter.textContent = appState.nominatedPlayers.length;
}

function setupCoachListener() {
    const select = document.getElementById('coach-select');
    if (!select) return;
    select.addEventListener('change', (e) => {
        const metaCoach = document.getElementById('meta-coach');
        if (metaCoach) metaCoach.textContent = e.target.value;
        appState.coach = e.target.value;
    });
}

// ----------------------------------------------------
// 4. MATCH RUNTIME ACTIONS
// ----------------------------------------------------
function startMatch() {
    const oppInput = document.getElementById('opponent-name');
    appState.opponent = oppInput ? (oppInput.value || "Opponent") : "Opponent";
    
    const liveOpp = document.getElementById('live-opp-name');
    if (liveOpp) liveOpp.textContent = appState.opponent;
    
    appState.nominatedPlayers.forEach(p => {
        appState.scores[p] = appState.scores[p] || 0;
    });
    
    const ownGoalLabel = `${appState.opponent} own goal`;
    appState.scores[ownGoalLabel] = appState.scores[ownGoalLabel] || 0;

    renderScorersRows(ownGoalLabel);
    updateLiveScoreDisplay();
    nextScreen(3);
}

function renderScorersRows(ownGoalLabel) {
    const container = document.getElementById('scorers-rows-container');
    if (!container) return;
    container.innerHTML = "";

    const fieldPlayers = appState.nominatedPlayers.filter(p => p !== GOALKEEPER_NAME);

    fieldPlayers.forEach(name => {
        createRowElement(container, name);
    });

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
        if (appState.scores[name] > 0) {
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
    const scoreText = document.getElementById('live-score-text');
    if (scoreText) scoreText.textContent = `${ourTotal} : ${appState.opponentScore}`;
}

function toggleTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    } else {
        timerInterval = setInterval(() => {
            totalSeconds++;
            const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
            const secs = String(totalSeconds % 60).padStart(2, '0');
            const timerDisp = document.getElementById('timer-display');
            if (timerDisp) timerDisp.textContent = `${mins}:${secs}`;
        }, 1000);
    }
}

// ----------------------------------------------------
// 5. GRAPHIC GENERATION & OUTPUT
// ----------------------------------------------------
function finishMatch() {
    if (timerInterval) toggleTimer();

    const d = new Date();
    const formattedDate = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const dateDisp = document.getElementById('graphic-current-date');
    if (dateDisp) dateDisp.textContent = formattedDate;

    let ourTotal = 0;
    Object.keys(appState.scores).forEach(key => ourTotal += appState.scores[key]);
    
    const scoreSpan = document.getElementById('graph-score-span');
    if (scoreSpan) scoreSpan.textContent = `${ourTotal} : ${appState.opponentScore}`;
    
    const oppSpan = document.getElementById('graph-opp-span');
    if (oppSpan) oppSpan.textContent = appState.opponent;
    
    const coachSpan = document.getElementById('graph-coach-span');
    if (coachSpan) coachSpan.textContent = `team: ${appState.coach}`;

    let goalsArray = [];
    Object.keys(appState.scores).forEach(name => {
        if (appState.scores[name] > 0) {
            goalsArray.push(`${name} ${appState.scores[name] > 1 ? appState.scores[name] : ''}`.trim());
        }
    });
    const summary = document.getElementById('graph-goals-text-summary');
    if (summary) summary.textContent = goalsArray.length > 0 ? goalsArray.join(', ') : "None";

    const jerseysGrid = document.getElementById('jerseys-container-grid');
    if (jerseysGrid) {
        jerseysGrid.innerHTML = "";
        const fieldPlayers = appState.nominatedPlayers.filter(p => p !== GOALKEEPER_NAME);
        
        fieldPlayers.forEach(name => {
            const item = document.createElement('div');
            item.className = "jersey-item";
            
            const icon = document.createElement('div');
            icon.className = "jersey-icon-svg";
            icon.textContent = "👕"; 
            
            if ((appState.scores[name] || 0) > 0) {
                icon.style.filter = "drop-shadow(0px 0px 6px #c91d24)";
            }

            const nameDiv = document.createElement('div');
            nameDiv.className = "jersey-player-name";
            nameDiv.textContent = name;

            item.appendChild(icon);
            item.appendChild(nameDiv);

            if ((appState.scores[name] || 0) > 0) {
                const badge = document.createElement('div');
                badge.className = "jersey-goals-badge";
                badge.textContent = `⚽ ${appState.scores[name]}`;
                item.appendChild(badge);
            }

            jerseysGrid.appendChild(item);
        });
    }

