"use strict";

/*
 * Počiatočný zoznam mien podľa priloženej ukážky.
 * Pred použitím ho porovnaj s úplnou súpiskou a uprav.
 */
const DEFAULT_PLAYERS = [
  "Bartoš",
  "Čičatka",
  "Čuvara",
  "Dvorský",
  "Gálik",
  "Gejdoš",
  "Gudkov",
  "Hikl",
  "Horváth",
  "Kosinský",
  "Kytka",
  "Mašár",
  "Montoya",
  "Morong",
  "Paulik",
  "Polakovič",
  "Roszoly",
  "Rybár",
  "Škoda",
  "Tišťan",
  "Torma",
  "Tóth",
  "Vavrovič",
  "Vrabec",
  "Zeleňák",
  "Zukal"
];

const STORAGE_KEY = "fkm-karlova-ves-match-v1";

const state = {
  opponent: "",
  squads: 1,
  coach: "",
  selectedPlayers: [],
  homeGoals: {},
  awayGoals: [],
  elapsedSeconds: 0,
  timerRunning: false,
  lastTimerStart: null,
  currentScreen: "setup"
};

let timerInterval = null;
let toastTimeout = null;

const $ = (selector) => document.querySelector(selector);

function loadSavedState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    if (!data || typeof data !== "object") return;

    state.opponent = typeof data.opponent === "string" ? data.opponent : "";
    state.squads = Number(data.squads) === 2 ? 2 : 1;
    state.coach = typeof data.coach === "string" ? data.coach : "";
    state.selectedPlayers = Array.isArray(data.selectedPlayers)
      ? data.selectedPlayers.filter((name) => DEFAULT_PLAYERS.includes(name))
      : [];
    state.homeGoals =
      data.homeGoals && typeof data.homeGoals === "object" ? data.homeGoals : {};
    state.awayGoals = Array.isArray(data.awayGoals) ? data.awayGoals : [];
    state.elapsedSeconds = Math.max(0, Number(data.elapsedSeconds) || 0);
    state.timerRunning = false;
    state.currentScreen = ["setup", "lineup", "match", "output"].includes(data.currentScreen)
      ? data.currentScreen
      : "setup";
  } catch (error) {
    console.warn("Uložený zápas sa nepodarilo načítať.", error);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      timerRunning: false,
      lastTimerStart: null
    }));
  } catch (error) {
    console.warn("Zápas sa nepodarilo uložiť do zariadenia.", error);
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");

  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 2600);
}

function showScreen(screenName) {
  const screens = {
    setup: $("#screen-setup"),
    lineup: $("#screen-lineup"),
    match: $("#screen-match"),
    output: $("#screen-output")
  };

  Object.entries(screens).forEach(([name, element]) => {
    const active = name === screenName;
    element.classList.toggle("active", active);
    element.hidden = !active;
  });

  state.currentScreen = screenName;
  saveState();

  if (screenName === "lineup") renderPlayers();
  if (screenName === "match") renderMatch();
  if (screenName === "output") renderOutput();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("sk");
}

function sortedPlayers() {
  return [...DEFAULT_PLAYERS].sort((a, b) => a.localeCompare(b, "sk"));
}

function renderPlayers() {
  const search = normalizeText($("#player-search").value);
  const list = $("#player-list");
  const players = sortedPlayers().filter((name) => normalizeText(name).includes(search));

  $("#lineup-match-label").textContent =
    `${state.opponent || "Súper"} · ${state.squads} ${state.squads === 1 ? "squad" : "squady"}`;
  $("#selected-count").textContent = String(state.selectedPlayers.length);
  list.replaceChildren();

  if (players.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Nenašli sa žiadni hráči.";
    list.append(empty);
    return;
  }

  players.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "player-button";
    button.textContent = name;
    button.setAttribute("aria-pressed", String(state.selectedPlayers.includes(name)));

    if (state.selectedPlayers.includes(name)) button.classList.add("selected");

    button.addEventListener("click", () => {
      const selected = state.selectedPlayers.includes(name);
      state.selectedPlayers = selected
        ? state.selectedPlayers.filter((player) => player !== name)
        : [...state.selectedPlayers, name];

      saveState();
      renderPlayers();
    });

    list.append(button);
  });
}

function calculateElapsed() {
  if (!state.timerRunning || !state.lastTimerStart) return state.elapsedSeconds;
  return state.elapsedSeconds + Math.floor((Date.now() - state.lastTimerStart) / 1000);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  $("#timer-display").textContent = formatTime(calculateElapsed());
}

function startTimer() {
  if (state.timerRunning) return;

  state.timerRunning = true;
  state.lastTimerStart = Date.now();
  $("#timer-toggle").textContent = "Pozastaviť stopky";
  timerInterval = window.setInterval(updateTimerDisplay, 250);
  updateTimerDisplay();
}

function pauseTimer() {
  if (!state.timerRunning) return;

  state.elapsedSeconds = calculateElapsed();
  state.timerRunning = false;
  state.lastTimerStart = null;
  window.clearInterval(timerInterval);
  timerInterval = null;
  $("#timer-toggle").textContent = "Pokračovať";
  updateTimerDisplay();
  saveState();
}

function resetTimer() {
  pauseTimer();
  state.elapsedSeconds = 0;
  $("#timer-toggle").textContent = "Spustiť stopky";
  updateTimerDisplay();
  saveState();
}

function totalGoals(goals) {
  return Object.values(goals).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function renderMatch() {
  $("#away-team-name").textContent = state.opponent || "Súper";
  $("#home-score").textContent = String(totalGoals(state.homeGoals));
  $("#away-score").textContent = String(state.awayGoals.length);
  $("#timer-toggle").textContent = state.timerRunning
    ? "Pozastaviť stopky"
    : state.elapsedSeconds > 0
      ? "Pokračovať"
      : "Spustiť stopky";

  updateTimerDisplay();

  const list = $("#scorer-list");
  list.replaceChildren();

  state.selectedPlayers.forEach((player) => {
    const row = document.createElement("div");
    row.className = "scorer-row";

    const name = document.createElement("span");
    name.className = "scorer-name";
    name.textContent = player;

    const count = document.createElement("span");
    count.className = "scorer-count";
    count.textContent = String(state.homeGoals[player] || 0);

    const add = document.createElement("button");
    add.type = "button";
    add.className = "goal-button";
    add.textContent = "+";
    add.setAttribute("aria-label", `Pridať gól: ${player}`);
    add.addEventListener("click", () => {
      state.homeGoals[player] = (state.homeGoals[player] || 0) + 1;
      saveState();
      renderMatch();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "goal-button minus";
    remove.textContent = "−";
    remove.setAttribute("aria-label", `Odobrať gól: ${player}`);
    remove.disabled = !state.homeGoals[player];
    remove.addEventListener("click", () => {
      state.homeGoals[player] = Math.max(0, (state.homeGoals[player] || 0) - 1);
      saveState();
      renderMatch();
    });

    row.append(name, count, add, remove);
    list.append(row);
  });

  if (state.selectedPlayers.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Nominácia je prázdna. Vráť sa a vyber hráčov.";
    list.append(empty);
  }
}

function addOpponentGoal() {
  const input = $("#opponent-scorer");
  const scorer = input.value.trim();

  state.awayGoals.push({
    scorer: scorer || "Neznámy strelec",
    minute: formatTime(calculateElapsed())
  });

  input.value = "";
  saveState();
  renderMatch();
  showToast("Gól súpera bol zaznamenaný.");
}

function getGoalsSummary() {
  const home = Object.entries(state.homeGoals)
    .filter(([, count]) => Number(count) > 0)
    .flatMap(([name, count]) => Array(Number(count)).fill(name));

  const away = state.awayGoals.map((goal) => goal.scorer);
  return { home, away };
}

function shirtSvg() {
  return `
    <svg class="shirt-icon" viewBox="0 0 64 58" aria-hidden="true">
      <path fill="currentColor" d="M18 5 27 1c2 5 8 5 10 0l9 4 15 8-7 13-8-4v34H18V22l-8 4-7-13z"/>
      <path fill="#fff" opacity=".9" d="M28 7h8l-4 7z"/>
    </svg>
  `;
}

function renderOutput() {
  $("#poster-date").textContent = new Intl.DateTimeFormat("sk-SK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date());

  $("#poster-coach").textContent =
    state.squads === 2 && state.coach ? `Tréner: ${state.coach}` : "";

  $("#poster-opponent").textContent = state.opponent || "Súper";
  $("#poster-home-score").textContent = String(totalGoals(state.homeGoals));
  $("#poster-away-score").textContent = String(state.awayGoals.length);

  const { home, away } = getGoalsSummary();
  const goalLines = [];

  if (home.length) goalLines.push(`FKM Karlova Ves: ${home.join(", ")}`);
  if (away.length) goalLines.push(`${state.opponent || "Súper"}: ${away.join(", ")}`);

  $("#poster-goals-text").textContent =
    goalLines.length ? goalLines.join(" · ") : "Zatiaľ bez gólov.";

  const playersContainer = $("#poster-players");
  playersContainer.replaceChildren();

  state.selectedPlayers.forEach((player) => {
    const item = document.createElement("div");
    item.className = "poster-player";
    item.innerHTML = `${shirtSvg()}<span></span>`;
    item.querySelector("span").textContent = player;
    playersContainer.append(item);
  });
}

function wrapCanvasText(context, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

async function makePosterBlob() {
  const poster = $("#match-poster");
  const posterWidth = poster.scrollWidth;
  const posterHeight = poster.scrollHeight;
  const scale = 2;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = posterWidth * scale;
  canvas.height = posterHeight * scale;
  context.scale(scale, scale);

  const red = getComputedStyle(document.documentElement)
    .getPropertyValue("--red")
    .trim() || "#c9282b";

  context.fillStyle = "#fff";
  context.fillRect(0, 0, posterWidth, posterHeight);

  const headerHeight = 70;
  const scoreHeight = 120;

  context.fillStyle = red;
  context.fillRect(0, 0, posterWidth, headerHeight + scoreHeight);

  context.fillStyle = "#fff";
  context.font = "800 15px Arial";
  context.textAlign = "left";
  context.fillText("FKM", 20, 41);
  context.font = "12px Arial";
  context.fillText($("#poster-date").textContent, 76, 31);
  context.fillText($("#poster-coach").textContent, 76, 50);

  context.textAlign = "center";
  context.font = "700 14px Arial";
  context.fillText("FKM Karlova Ves", posterWidth * 0.25, 96);
  context.fillText($("#poster-opponent").textContent, posterWidth * 0.75, 96);

  context.font = "800 43px Arial";
  context.fillText($("#poster-home-score").textContent, posterWidth * 0.25, 154);
  context.fillText(":", posterWidth * 0.5, 151);
  context.fillText($("#poster-away-score").textContent, posterWidth * 0.75, 154);

  let y = headerHeight + scoreHeight;
  context.textAlign = "left";
  context.fillStyle = red;
  context.font = "800 13px Arial";
  context.fillText("GÓLY", 18, y + 23);

  context.fillStyle = "#242424";
  context.font = "13px Arial";
  const goalLines = wrapCanvasText(context, $("#poster-goals-text").textContent, posterWidth - 36);
  goalLines.forEach((line, index) => context.fillText(line, 18, y + 47 + index * 18));

  y += 66 + Math.max(0, goalLines.length - 1) * 18;
  context.fillStyle = "#f8f8f8";
  context.fillRect(0, y, posterWidth, posterHeight - y);

  context.fillStyle = red;
  context.font = "800 13px Arial";
  context.fillText("NOMINÁCIA", 18, y + 23);

  const columns = 3;
  const cellWidth = (posterWidth - 36) / columns;

  state.selectedPlayers.forEach((player, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 18 + column * cellWidth;
    const playerY = y + 48 + row * 58;

    context.fillStyle = red;
    context.beginPath();
    context.moveTo(x + 8, playerY + 5);
    context.lineTo(x + 14, playerY + 1);
    context.lineTo(x + 20, playerY + 5);
    context.lineTo(x + 25, playerY + 9);
    context.lineTo(x + 22, playerY + 16);
    context.lineTo(x + 19, playerY + 14);
    context.lineTo(x + 19, playerY + 29);
    context.lineTo(x + 9, playerY + 29);
    context.lineTo(x + 9, playerY + 14);
    context.lineTo(x + 6, playerY + 16);
    context.lineTo(x + 3, playerY + 9);
    context.closePath();
    context.fill();

    context.fillStyle = "#242424";
    context.font = "10px Arial";
    context.textAlign = "left";
    context.fillText(player, x, playerY + 43, cellWidth - 8);
  });

  context.fillStyle = "#777";
  context.textAlign = "center";
  context.font = "800 9px Arial";
  context.fillText("FKM KARLOVA VES", posterWidth / 2, posterHeight - 12);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Obrázok sa nepodarilo vytvoriť."));
    }, "image/png");
  });
}

async function downloadPoster() {
  try {
    const blob = await makePosterBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `fkm-karlova-ves-zapas-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.append(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Obrázok bol uložený.");
  } catch (error) {
    console.error(error);
    showToast("Obrázok sa nepodarilo vytvoriť.");
  }
}

async function sharePoster() {
  try {
    const blob = await makePosterBlob();
    const file = new File([blob], "fkm-karlova-ves-zapas.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({
        title: "Výsledok zápasu FKM Karlova Ves",
        files: [file]
      });
    } else {
      await downloadPoster();
      showToast("Zdieľanie nie je dostupné. Obrázok sa stiahol.");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error);
      showToast("Zdieľanie sa nepodarilo.");
    }
  }
}

function resetMatch() {
  pauseTimer();
  localStorage.removeItem(STORAGE_KEY);

  state.opponent = "";
  state.squads = 1;
  state.coach = "";
  state.selectedPlayers = [];
  state.homeGoals = {};
  state.awayGoals = [];
  state.elapsedSeconds = 0;
  state.timerRunning = false;
  state.lastTimerStart = null;
  state.currentScreen = "setup";

  $("#setup-form").reset();
  $("#player-search").value = "";
  $("#opponent-scorer").value = "";
  $("#coach-field").classList.add("hidden");

  showScreen("setup");
  showToast("Pripravený nový zápas.");
}

function restoreUiFromState() {
  $("#opponent").value = state.opponent;
  $("#squads").value = String(state.squads);
  if (state.coach) $("#coach").value = state.coach;

  $("#coach-field").classList.toggle("hidden", state.squads !== 2);

  if (state.currentScreen !== "setup" && state.opponent) {
    showScreen(state.currentScreen);
  } else {
    showScreen("setup");
  }
}

function bindEvents() {
  $("#squads").addEventListener("change", (event) => {
    const isTwoSquads = event.target.value === "2";
    $("#coach-field").classList.toggle("hidden", !isTwoSquads);
  });

  $("#setup-form").addEventListener("submit", (event) => {
    event.preventDefault();

    state.opponent = $("#opponent").value.trim();
    state.squads = Number($("#squads").value) === 2 ? 2 : 1;
    state.coach = state.squads === 2 ? $("#coach").value : "";

    if (!state.opponent) {
      showToast("Zadaj názov súpera.");
      return;
    }

    saveState();
    showScreen("lineup");
  });

  $("#player-search").addEventListener("input", renderPlayers);
  $("#back-to-setup").addEventListener("click", () => showScreen("setup"));

  $("#start-match").addEventListener("click", () => {
    if (state.selectedPlayers.length === 0) {
      showToast("Vyber aspoň jedného hráča do nominácie.");
      return;
    }

    state.homeGoals = Object.fromEntries(
      state.selectedPlayers.map((player) => [player, state.homeGoals[player] || 0])
    );
    saveState();
    showScreen("match");
  });

  $("#back-to-lineup").addEventListener("click", () => {
    pauseTimer();
    showScreen("lineup");
  });

  $("#go-to-output").addEventListener("click", () => {
    pauseTimer();
    showScreen("output");
  });

  $("#timer-toggle").addEventListener("click", () => {
    if (state.timerRunning) pauseTimer();
    else startTimer();

    renderMatch();
    if (state.timerRunning) {
      $("#timer-toggle").textContent = "Pozastaviť stopky";
      timerInterval = window.setInterval(updateTimerDisplay, 250);
    }
  });

  $("#timer-reset").addEventListener("click", () => {
    resetTimer();
    renderMatch();
  });

  $("#score-reset").addEventListener("click", () => {
    if (!window.confirm("Naozaj chceš vynulovať všetky góly?")) return;

    state.homeGoals = Object.fromEntries(state.selectedPlayers.map((player) => [player, 0]));
    state.awayGoals = [];
    saveState();
    renderMatch();
  });

  $("#add-opponent-goal").addEventListener("click", addOpponentGoal);

  $("#opponent-scorer").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addOpponentGoal();
    }
  });

  $("#back-to-match").addEventListener("click", () => showScreen("match"));
  $("#download-image").addEventListener("click", downloadPoster);
  $("#share-image").addEventListener("click", sharePoster);

  $("#restart-match").addEventListener("click", () => {
    if (window.confirm("Začať nový zápas? Aktuálny zápis sa vymaže.")) resetMatch();
  });
}

loadSavedState();
bindEvents();
restoreUiFromState();
