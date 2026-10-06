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
  currentScreen: "setup",
  teamsReversed: false
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
      data.homeGoals && typeof data.homeGoals === "object"
        ? data.homeGoals
        : {};

    state.awayGoals = Array.isArray(data.awayGoals) ? data.awayGoals : [];
    state.ownGoals = Math.max(0, Number(data.ownGoals) || 0);
    state.elapsedSeconds = Math.max(0, Number(data.elapsedSeconds) || 0);
    state.timerRunning = false;
    state.lastTimerStart = null;
    state.teamsReversed = Boolean(data.teamsReversed);

    state.currentScreen = ["setup", "lineup", "match", "output"].includes(
      data.currentScreen
    )
      ? data.currentScreen
      : "setup";
  } catch (error) {
    console.warn("Uložený zápas sa nepodarilo načítať.", error);
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        timerRunning: false,
        lastTimerStart: null
      })
    );
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

  const selectedCount = $("#selected-count");
  if (selectedCount) {
    selectedCount.textContent = String(state.selectedPlayers.length);
  }

  const heading = $("#screen-lineup")?.querySelector(".screen-heading");
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
    button.setAttribute(
      "aria-pressed",
      String(state.selectedPlayers.includes(name))
    );

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

  return (
    state.elapsedSeconds +
    Math.floor((Date.now() - state.lastTimerStart) / 1000)
  );
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatMatchDate(date = new Date()) {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
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
  const karlovkaGoals = totalGoals(state.homeGoals) + state.ownGoals;
  const opponentGoals = state.awayGoals.length;

  const homeName = state.teamsReversed ? opponent : "FKM Karlova Ves";
  const awayName = state.teamsReversed ? "FKM Karlova Ves" : opponent;
  const displayHomeGoals = state.teamsReversed
    ? opponentGoals
    : karlovkaGoals;
  const displayAwayGoals = state.teamsReversed
    ? karlovkaGoals
    : opponentGoals;

  $("#home-team-name").textContent = homeName;
  $("#away-team-name").textContent = awayName;
  $("#home-score").textContent = String(displayHomeGoals);
  $("#away-score").textContent = String(displayAwayGoals);

  const coach = state.squads === 2 ? state.coach : "";
  const homeCoachElement = $("#home-coach");
  const awayCoachElement = $("#screen-match .team-coach-placeholder");

  homeCoachElement.textContent =
    !state.teamsReversed && coach ? `Tréner: ${coach}` : "";
  homeCoachElement.hidden = state.teamsReversed || !coach;

  awayCoachElement.textContent =
    state.teamsReversed && coach ? `Tréner: ${coach}` : "";
  awayCoachElement.hidden = !state.teamsReversed || !coach;

  $("#opponent-dock-name").textContent = opponent;
  $("#opponent-goal-count").textContent = String(opponentGoals);
  $("#opponent-goal-remove").disabled = opponentGoals === 0;

  const timerToggle = $("#timer-toggle");
  timerToggle.setAttribute(
    "aria-label",
    state.timerRunning ? "Zastaviť a vynulovať čas" : "Spustiť čas"
  );

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

/* Screen 4 scorer summary:
   goals descending, then alphabetical; own goals after regular scorers on ties. */
function getGoalsSummary() {
  const scorers = new Map();

  Object.entries(state.homeGoals).forEach(([name, value]) => {
    const count = Math.max(0, Number(value) || 0);
    if (count > 0) {
      scorers.set(name, (scorers.get(name) || 0) + count);
    }
  });

  const ownGoalName = `${state.opponent || "Súper"} vl.`;
  if (state.ownGoals > 0) {
    scorers.set(
      ownGoalName,
      (scorers.get(ownGoalName) || 0) + state.ownGoals
    );
  }

  return [...scorers.entries()]
    .sort(([nameA, goalsA], [nameB, goalsB]) => {
      if (goalsA !== goalsB) return goalsB - goalsA;

      const isOwnA = nameA === ownGoalName;
      const isOwnB = nameB === ownGoalName;
      if (isOwnA !== isOwnB) return isOwnA ? 1 : -1;

      return nameA.localeCompare(nameB, "sk");
    })
    .map(([name, count]) => ({
      name,
      count,
      label: count === 1 ? name : `${name} ${count}`
    }));
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

  const coach =
    state.squads === 2 && state.coach ? `Tréner: ${state.coach}` : "";

  const homeTeam = state.teamsReversed
    ? state.opponent || "Súper"
    : "FKM Karlova Ves";

  const awayTeam = state.teamsReversed
    ? "FKM Karlova Ves"
    : state.opponent || "Súper";

  $("#poster-home-team").textContent = homeTeam;
  $("#poster-away-team").textContent = awayTeam;

  $("#poster-home-coach").textContent = state.teamsReversed ? "" : coach;
  $("#poster-away-coach").textContent = state.teamsReversed ? coach : "";

  const karlovkaGoals = totalGoals(state.homeGoals) + state.ownGoals;
  const opponentGoals = state.awayGoals.length;

  $("#poster-home-score").textContent = String(
    state.teamsReversed ? opponentGoals : karlovkaGoals
  );
  $("#poster-away-score").textContent = String(
    state.teamsReversed ? karlovkaGoals : opponentGoals
  );

  const scorers = getGoalsSummary();
  const scorerText = $("#poster-goals-text");
  scorerText.replaceChildren();
  scorerText.classList.add("scorer-summary");

  if (scorers.length === 0) {
    scorerText.textContent = "Bez gólov.";
  } else {
    scorers.forEach((scorer, index) => {
      const item = document.createElement("span");
      item.className = "scorer-summary-item";
      item.textContent = scorer.label;
      scorerText.append(item);

      if (index < scorers.length - 1) {
        scorerText.append(document.createTextNode(", "));
      }
    });
  }

  const playersContainer = $("#poster-players");
  playersContainer.replaceChildren();

  [...state.selectedPlayers]
    .sort((a, b) => a.localeCompare(b, "sk"))
    .forEach((player) => {
      const item = document.createElement("div");
      item.className = "poster-player";
      item.innerHTML = `${shirtSvg()}<span></span>`;
      item.querySelector("span").textContent = player;
      playersContainer.append(item);
    });
}

function wrapCanvasText(context, text, maxWidth) {
  const words = String(text).trim().split(/\s+/);
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

function waitForImage(image) {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    image.addEventListener("load", resolve, { once: true });
    image.addEventListener("error", resolve, { once: true });
  });
}

async function makePosterBlob() {
  const poster = $("#match-poster");
  const width = Math.max(320, poster.scrollWidth);
  const height = Math.max(500, poster.scrollHeight);
  const scale = 2;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas sa nepodarilo vytvoriť.");
  }

  canvas.width = width * scale;
  canvas.height = height * scale;
  context.scale(scale, scale);

  const red =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--red")
      .trim() || "#c9282b";

  const homeTeam = $("#poster-home-team").textContent;
  const awayTeam = $("#poster-away-team").textContent;
  const homeCoach = $("#poster-home-coach").textContent;
  const awayCoach = $("#poster-away-coach").textContent;
  const homeScore = $("#poster-home-score").textContent;
  const awayScore = $("#poster-away-score").textContent;
  const date = $("#poster-date").textContent;

  const scorers = getGoalsSummary();
  const scorerLabels = scorers.map((scorer) => scorer.label);

  const roster = [...state.selectedPlayers].sort((a, b) =>
    a.localeCompare(b, "sk")
  );

  const headerHeight = 190;
  const contentPadding = 18;

  context.fillStyle = "#fff";
  context.fillRect(0, 0, width, height);

  /* Compact red match header; deliberately no club crest/logo. */
  context.fillStyle = red;
  context.fillRect(0, 0, width, headerHeight);

  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.font = "700 16px Arial";
  context.fillText(date, width / 2, 30);

  const sideWidth = width * 0.32;
  const leftCenter = width * 0.25;
  const centerX = width / 2;
  const rightCenter = width * 0.75;

  context.font = "700 15px Arial";
  context.fillText(homeTeam, leftCenter, 76, sideWidth);
  context.fillText(awayTeam, rightCenter, 76, sideWidth);

  if (homeCoach) {
    context.font = "12px Arial";
    context.fillText(homeCoach, leftCenter, 96, sideWidth);
  }

  if (awayCoach) {
    context.font = "12px Arial";
    context.fillText(awayCoach, rightCenter, 96, sideWidth);
  }

  context.font = "800 38px Arial";
  context.fillText(homeScore, width * 0.39, 151);
  context.fillText(":", centerX, 151);
  context.fillText(awayScore, width * 0.61, 151);

  /* Scorers: keep each name-and-count entry indivisible when wrapping. */
  let y = headerHeight;
  context.textAlign = "left";
  context.fillStyle = red;
  context.font = "800 13px Arial";
  context.fillText("STRELCI", contentPadding, y + 24);

  context.fillStyle = "#242424";
  context.font = "13px Arial";

  const scorerLines = wrapCanvasText(
    context,
    scorerLabels.length ? scorerLabels.join(", ") : "Bez gólov.",
    width - contentPadding * 2
  );

  scorerLines.forEach((line, index) => {
    context.fillText(
      line,
      contentPadding,
      y + 49 + index * 19,
      width - contentPadding * 2
    );
  });

  const scorerSectionHeight = 63 + Math.max(0, scorerLines.length - 1) * 19;
  y += scorerSectionHeight;

  /* Centered lineup section. */
  context.fillStyle = "#f8f8f8";
  context.fillRect(0, y, width, height - y);

  context.fillStyle = red;
  context.font = "800 13px Arial";
  context.textAlign = "left";
  context.fillText("NOMINÁCIA", contentPadding, y + 24);

  const columns = 3;
  const gridWidth = width - contentPadding * 2;
  const cellWidth = gridWidth / columns;
  const rowHeight = 58;
  const lineupStartY = y + 42;

  roster.forEach((player, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellLeft = contentPadding + column * cellWidth;
    const cellCenter = cellLeft + cellWidth / 2;
    const playerY = lineupStartY + row * rowHeight;

    /* Shirt icon centered in its equal-width column. */
    const shirtWidth = 28;
    const shirtHeight = 28;
    const shirtX = cellCenter - shirtWidth / 2;
    const shirtY = playerY;

    context.fillStyle = red;
    context.beginPath();
    context.moveTo(shirtX + 8, shirtY + 4);
    context.lineTo(shirtX + 13, shirtY);
    context.lineTo(shirtX + 18, shirtY + 4);
    context.lineTo(shirtX + 27, shirtY + 9);
    context.lineTo(shirtX + 23, shirtY + 17);
    context.lineTo(shirtX + 20, shirtY + 15);
    context.lineTo(shirtX + 20, shirtY + shirtHeight);
    context.lineTo(shirtX + 8, shirtY + shirtHeight);
    context.lineTo(shirtX + 8, shirtY + 15);
    context.lineTo(shirtX + 5, shirtY + 17);
    context.lineTo(shirtX + 1, shirtY + 9);
    context.closePath();
    context.fill();

    context.fillStyle = "#242424";
    context.textAlign = "center";
    context.font = "10px Arial";
    context.fillText(player, cellCenter, playerY + 42, cellWidth - 8);
  });

  context.fillStyle = "#777";
  context.textAlign = "center";
  context.font = "800 9px Arial";
  context.fillText("FKM KARLOVA VES", width / 2, height - 12);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Obrázok sa nepodarilo vytvoriť."));
      },
      "image/png"
    );
  });
}

async function downloadPoster() {
  try {
    await waitForImage(document.querySelector(".brand-logo"));

    const blob = await makePosterBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `fkm-karlova-ves-zapas-${new Date()
      .toISOString()
      .slice(0, 10)}.png`;

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
    await waitForImage(document.querySelector(".brand-logo"));

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
  state.teamsReversed = false;

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

  $("#back-to-setup")?.addEventListener("click", () => showScreen("setup"));
  $("#start-match")?.addEventListener("click", startMatchFromLineup);

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
    if (state.timerRunning) resetTimer();
    else startTimer();
  });

  $("#reverse-teams")?.addEventListener("click", () => {
    state.teamsReversed = !state.teamsReversed;
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

/* Reset to setup on every page load/refresh, as requested. */
localStorage.removeItem(STORAGE_KEY);

loadSavedState();
bindEvents();
restoreUiFromState();
