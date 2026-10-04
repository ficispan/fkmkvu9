"use strict";

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
  "Kosinskyi",
  "Kytka",
  "Mašár",
  "Montoya",
  "Morong",
  "Paulik",
  "Polakovič",
  "Rosolov",
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
  ownGoals: 0,
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
    state.ownGoals = Math.max(0, Number(data.ownGoals) || 0);
    state.elapsedSeconds = Math.max(0, Number(data.elapsedSeconds) || 0);
    state.timerRunning = false;
    state.lastTimerStart = null;
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
    console.warn("Zápas sa nepodarilo uložiť.", error);
  }
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

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
    if (!element) return;

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
  const list = $("#player-list");
  if (!list) return;

  $("#selected-count").textContent = String(state.selectedPlayers.length);

  const heading = $("#screen-lineup").querySelector(".screen-heading");
  if (heading) {
    heading.setAttribute(
      "data-selected-count",
      `${state.selectedPlayers.length} vybraných`
    );
  }

  list.replaceChildren();

  sortedPlayers().forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "player-button";
    button.textContent = name;
    button.setAttribute("aria-pressed", String(state.selectedPlayers.includes(name)));

    if (state.selectedPlayers.includes(name)) {
      button.classList.add("selected");
    }

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
  if (!state.timerRunning || !state.lastTimerStart) {
    return state.elapsedSeconds;
  }

  return state.elapsedSeconds +
    Math.floor((Date.now() - state.lastTimerStart) / 1000);
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function updateTimerDisplay() {
  const display = $("#timer-display");
  if (display) display.textContent = formatTime(calculateElapsed());
}

function startTimer() {
  if (state.timerRunning) return;

  state.timerRunning = true;
  state.lastTimerStart = Date.now();
  timerInterval = window.setInterval(updateTimerDisplay, 250);
  renderMatch();
}

function pauseTimer() {
  if (!state.timerRunning) return;

  state.elapsedSeconds = calculateElapsed();
  state.timerRunning = false;
  state.lastTimerStart = null;
  window.clearInterval(timerInterval);
  timerInterval = null;
  saveState();
  renderMatch();
}

function resetTimer() {
  if (state.timerRunning) {
    state.elapsedSeconds = calculateElapsed();
    state.timerRunning = false;
    state.lastTimerStart = null;
    window.clearInterval(timerInterval);
    timerInterval = null;
  }

  state.elapsedSeconds = 0;
  saveState();
  renderMatch();
}

function totalGoals(goals) {
  return Object.values(goals).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );
}

function makeGoalRow(list, name, count, onAdd, onRemove) {
  const row = document.createElement("div");
  row.className = "scorer-row";

  const scorerName = document.createElement("span");
  scorerName.className = "scorer-name";
  scorerName.textContent = name;

  const scorerCount = document.createElement("span");
  scorerCount.className = "scorer-count";
  scorerCount.textContent = String(count);

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "goal-button";
  addButton.textContent = "+";
  addButton.setAttribute("aria-label", `Pridať gól: ${name}`);
  addButton.addEventListener("click", onAdd);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "goal-button minus";
  removeButton.textContent = "−";
  removeButton.disabled = count <= 0;
  removeButton.setAttribute("aria-label", `Odobrať gól: ${name}`);
  removeButton.addEventListener("click", onRemove);

  row.append(scorerName, scorerCount, addButton, removeButton);
  list.append(row);
}

function renderMatch() {
  const opponent = state.opponent || "Súper";
  const ownGoalName = `${opponent} vl.`;

  $("#away-team-name").textContent = opponent;
  $("#opponent-dock-name").textContent = opponent;
  $("#home-score").textContent = String(totalGoals(state.homeGoals) + state.ownGoals);
  $("#away-score").textContent = String(state.awayGoals.length);
  $("#opponent-goal-count").textContent = String(state.awayGoals.length);

  $("#timer-toggle").textContent = state.timerRunning
    ? "Pozastaviť stopky"
    : state.elapsedSeconds > 0
      ? "Pokračovať"
      : "Spustiť stopky";

  updateTimerDisplay();

  const list = $("#scorer-list");
  list.replaceChildren();

  [...state.selectedPlayers]
    .sort((a, b) => a.localeCompare(b, "sk"))
    .forEach((player) => {
      const count = Number(state.homeGoals[player]) || 0;

      makeGoalRow(
        list,
        player,
        count,
        () => {
          state.homeGoals[player] = (Number(state.homeGoals[player]) || 0) + 1;
          saveState();
          renderMatch();
        },
        () => {
          state.homeGoals[player] = Math.max(
            0,
            (Number(state.homeGoals[player]) || 0) - 1
          );
          saveState();
          renderMatch();
        }
      );
    });

  makeGoalRow(
    list,
    ownGoalName,
    state.ownGoals,
    () => {
      state.ownGoals += 1;
      saveState();
      renderMatch();
    },
    () => {
      state.ownGoals = Math.max(0, state.ownGoals - 1);
      saveState();
      renderMatch();
    }
  );
}

function getGoalsSummary() {
  const home = Object.entries(state.homeGoals)
    .filter(([, count]) => Number(count) > 0)
    .flatMap(([name, count]) => Array(Number(count)).fill(name));

  if (state.ownGoals > 0) {
    home.push(...Array(state.ownGoals).fill(`${state.opponent || "Súper"} vl.`));
  }

  const away = Array(state.awayGoals.length).fill("Súper");
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
  $("#poster-home-score").textContent =
    String(totalGoals(state.homeGoals) + state.ownGoals);
  $("#poster-away-score").textContent = String(state.awayGoals.length);

  const { home, away } = getGoalsSummary();
  const lines = [];

  if (home.length) lines.push(`FKM Karlova Ves: ${home.join(", ")}`);
  if (away.length) lines.push(`${state.opponent || "Súper"}: ${away.join(", ")}`);

  $("#poster-goals-text").textContent =
    lines.length ? lines.join(" · ") : "Zatiaľ bez gólov.";

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
  const width = poster.scrollWidth;
  const height = poster.scrollHeight;
  const scale = 2;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width * scale;
  canvas.height = height * scale;
  context.scale(scale, scale);

  const red = getComputedStyle(document.documentElement)
    .getPropertyValue("--red")
    .trim() || "#c9282b";

  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);

  context.fillStyle = red;
  context.fillRect(0, 0, width, 190);

  context.fillStyle = "#fff";
  context.textAlign = "left";
  context.font = "800 15px Arial";
  context.fillText("FKM", 20, 41);
  context.font = "12px Arial";
  context.fillText($("#poster-date").textContent, 76, 31);
  context.fillText($("#poster-coach").textContent, 76, 50);

  context.textAlign = "center";
  context.font = "700 14px Arial";
  context.fillText("FKM Karlova Ves", width * 0.25, 96);
  context.fillText($("#poster-opponent").textContent, width * 0.75, 96);
  context.font = "800 43px Arial";
  context.fillText($("#poster-home-score").textContent, width * 0.25, 154);
  context.fillText(":", width * 0.5, 151);
  context.fillText($("#poster-away-score").textContent, width * 0.75, 154);

  let y = 190;
  context.textAlign = "left";
  context.fillStyle = red;
  context.font = "800 13px Arial";
  context.fillText("GÓLY", 18, y + 23);

  context.fillStyle = "#242424";
  context.font = "13px Arial";

  const goalLines = wrapCanvasText(
    context,
    $("#poster-goals-text").textContent,
    width - 36
  );

  goalLines.forEach((line, index) => {
    context.fillText(line, 18, y + 47 + index * 18);
  });

  y += 66 + Math.max(0, goalLines.length - 1) * 18;
  context.fillStyle = "#f8f8f8";
  context.fillRect(0, y, width, height - y);

  context.fillStyle = red;
  context.font = "800 13px Arial";
  context.fillText("NOMINÁCIA", 18, y + 23);

  const columns = 3;
  const cellWidth = (width - 36) / columns;

  state.selectedPlayers.forEach((player, index) => {
    const x = 18 + (index % columns) * cellWidth;
    const playerY = y + 48 + Math.floor(index / columns) * 58;

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
  context.fillText("FKM KARLOVA VES", width / 2, height - 12);

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
    const file = new File([blob], "fkm-karlova-ves-zapas.png", {
      type: "image/png"
    });

    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({
        title: "Výsledok zápasu FKM Karlova Ves",
        files: [file]
      });
    } else {
      await downloadPoster();
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error(error);
      showToast("Zdieľanie sa nepodarilo.");
    }
  }
}

function resetMatch() {
  if (state.timerRunning) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }

  localStorage.removeItem(STORAGE_KEY);

  state.opponent = "";
  state.squads = 1;
  state.coach = "";
  state.selectedPlayers = [];
  state.homeGoals = {};
  state.awayGoals = [];
  state.ownGoals = 0;
  state.elapsedSeconds = 0;
  state.timerRunning = false;
  state.lastTimerStart = null;
  state.currentScreen = "setup";

  $("#setup-form").reset();
  $("#coach-field").classList.add("hidden");

  showScreen("setup");
  showToast("Pripravený nový zápas.");
}

function restoreUiFromState() {
  $("#opponent").value = state.opponent;
  $("#squads").value = String(state.squads);

  if (state.coach) {
    $("#coach").value = state.coach;
  }

  $("#coach-field").classList.toggle("hidden", state.squads !== 2);

  if (state.currentScreen !== "setup" && state.opponent) {
    showScreen(state.currentScreen);
  } else {
    showScreen("setup");
  }
}

function startMatchFromLineup() {
  if (state.selectedPlayers.length === 0) {
    showToast("Vyber aspoň jedného hráča do nominácie.");
    return;
  }

  state.homeGoals = Object.fromEntries(
    state.selectedPlayers.map((player) => [
      player,
      Number(state.homeGoals[player]) || 0
    ])
  );

  saveState();
  showScreen("match");
}

function bindEvents() {
  $("#squads").addEventListener("change", (event) => {
    $("#coach-field").classList.toggle("hidden", event.target.value !== "2");
  });

  $("#setup-form").addEventListener("submit", (event) => {
    event.preventDefault();

    state.opponent = $("#opponent").value.trim();
    state.squads = Number($("#squads").value) === 2 ? 2 : 1;
    state.coach = state.squads === 2 ? $("#coach").value : "";

    if (!state.opponent) {
      $("#opponent").focus();
      return;
    }

    saveState();
    showScreen("lineup");
  });

  $("#player-search")?.addEventListener("input", renderPlayers);

  // Zachované spodné tlačidlá, ak sú v HTML.
  $("#back-to-setup")?.addEventListener("click", () => showScreen("setup"));
  $("#start-match")?.addEventListener("click", startMatchFromLineup);

  // Hlavičkové šípky.
  $("#lineup-back")?.addEventListener("click", () => {
    if (state.currentScreen === "match") {
      pauseTimer();
      showScreen("lineup");
    } else if (state.currentScreen === "output") {
      showScreen("match");
    } else {
      showScreen("setup");
    }
  });

  $("#lineup-next")?.addEventListener("click", () => {
    if (state.currentScreen === "setup") {
      $("#setup-form").requestSubmit();
    } else if (state.currentScreen === "lineup") {
      startMatchFromLineup();
    } else if (state.currentScreen === "match") {
      pauseTimer();
      showScreen("output");
    }
  });

  $("#back-to-lineup")?.addEventListener("click", () => {
    pauseTimer();
    showScreen("lineup");
  });

  $("#go-to-output")?.addEventListener("click", () => {
    pauseTimer();
    showScreen("output");
  });

  $("#timer-toggle")?.addEventListener("click", () => {
    if (state.timerRunning) pauseTimer();
    else startTimer();
  });

  $("#timer-reset")?.addEventListener("click", resetTimer);

  $("#score-reset")?.addEventListener("click", () => {
    if (!window.confirm("Naozaj chceš vynulovať všetky góly?")) return;

    state.homeGoals = Object.fromEntries(
      state.selectedPlayers.map((player) => [player, 0])
    );
    state.awayGoals = [];
    state.ownGoals = 0;

    saveState();
    renderMatch();
  });

  $("#opponent-goal-add")?.addEventListener("click", () => {
    state.awayGoals.push({
      scorer: "Súper",
      minute: formatTime(calculateElapsed())
    });
    saveState();
    renderMatch();
  });

  $("#opponent-goal-remove")?.addEventListener("click", () => {
    if (state.awayGoals.length === 0) return;

    state.awayGoals.pop();
    saveState();
    renderMatch();
  });

  $("#back-to-match")?.addEventListener("click", () => showScreen("match"));
  $("#download-image")?.addEventListener("click", downloadPoster);
  $("#share-image")?.addEventListener("click", sharePoster);

  $("#restart-match")?.addEventListener("click", () => {
    if (window.confirm("Začať nový zápas? Aktuálny zápis sa vymaže.")) {
      resetMatch();
    }
  });
}

loadSavedState();
bindEvents();
restoreUiFromState();
