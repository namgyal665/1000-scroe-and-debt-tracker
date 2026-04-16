const STORAGE_KEY = "card-debt-tracker-state-v1";

const state = loadState();
const els = {};
let pendingProfileImage = "";

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindElements();
  bindEvents();
  renderSetupInputs();
  renderAll();
}

function bindElements() {
  els.views = [...document.querySelectorAll(".view")];
  els.navButtons = [...document.querySelectorAll(".nav-btn")];
  els.sessionForm = document.getElementById("sessionForm");
  els.sessionName = document.getElementById("sessionName");
  els.sessionMode = document.getElementById("sessionMode");
  els.winCondition = document.getElementById("winCondition");
  els.playerInputs = document.getElementById("playerInputs");
  els.payoutInputs = document.getElementById("payoutInputs");
  els.toggleFifthPlayerBtn = document.getElementById("toggleFifthPlayerBtn");
  els.manageProfilesBtn = document.getElementById("manageProfilesBtn");
  els.demoBtn = document.getElementById("demoBtn");
  els.activeSessionChip = document.getElementById("activeSessionChip");
  els.activeSessionSummary = document.getElementById("activeSessionSummary");
  els.playRoot = document.getElementById("playRoot");
  els.historyRoot = document.getElementById("historyRoot");
  els.positionDialog = document.getElementById("positionDialog");
  els.positionAssignments = document.getElementById("positionAssignments");
  els.positionForm = document.getElementById("positionForm");
  els.cancelPositionBtn = document.getElementById("cancelPositionBtn");
  els.historyDialog = document.getElementById("historyDialog");
  els.historyDialogContent = document.getElementById("historyDialogContent");
  els.setupSteps = [...document.querySelectorAll(".wizard-step")];
  els.setupPanels = [...document.querySelectorAll(".setup-step")];
  els.profileDialog = document.getElementById("profileDialog");
  els.profileForm = document.getElementById("profileForm");
  els.profileList = document.getElementById("profileList");
  els.profileId = document.getElementById("profileId");
  els.profileName = document.getElementById("profileName");
  els.profileBio = document.getElementById("profileBio");
  els.profilePhoto = document.getElementById("profilePhoto");
  els.profilePreview = document.getElementById("profilePreview");
  els.profileFormTitle = document.getElementById("profileFormTitle");
  els.closeProfileDialogBtn = document.getElementById("closeProfileDialogBtn");
  els.resetProfileBtn = document.getElementById("resetProfileBtn");
}

function bindEvents() {
  els.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.activeView = button.dataset.nav;
      saveState();
      renderAll();
    });
  });

  els.toggleFifthPlayerBtn.addEventListener("click", () => {
    state.ui.setupPlayerCount = state.ui.setupPlayerCount === 4 ? 5 : 4;
    renderSetupInputs();
  });

  els.manageProfilesBtn.addEventListener("click", openProfileDialog);

  els.sessionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startSession();
  });

  els.demoBtn.addEventListener("click", loadDemoSession);
  els.setupSteps.forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.setupStep = Number(button.dataset.setupStep);
      renderSetupStep();
      saveState();
    });
  });
  document.querySelectorAll("[data-next-step]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.setupStep = Number(button.dataset.nextStep);
      renderSetupStep();
      saveState();
    });
  });
  document.querySelectorAll("[data-prev-step]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.setupStep = Number(button.dataset.prevStep);
      renderSetupStep();
      saveState();
    });
  });

  els.cancelPositionBtn.addEventListener("click", () => els.positionDialog.close());
  els.positionForm.addEventListener("submit", handlePositionSubmit);
  els.closeProfileDialogBtn.addEventListener("click", () => els.profileDialog.close());
  els.resetProfileBtn.addEventListener("click", resetProfileForm);
  els.profilePhoto.addEventListener("change", handleProfilePhotoChange);
  els.profileForm.addEventListener("submit", handleProfileSave);
}

function renderAll() {
  renderNav();
  renderSetupStep();
  renderActiveSessionChip();
  renderHome();
  renderPlay();
  renderHistory();
}

function renderNav() {
  els.views.forEach((view) => {
    view.classList.toggle("active", view.dataset.view === state.ui.activeView);
  });

  els.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === state.ui.activeView);
  });
}

function renderSetupInputs() {
  const setupPlayers = state.ui.setupPlayerCount;
  els.toggleFifthPlayerBtn.textContent =
    setupPlayers === 4 ? "Add 5th player" : "Use 4 players";

  const existingNames = state.ui.setupPlayers || [];
  const existingProfileIds = state.ui.setupProfileIds || [];
  state.ui.setupPlayers = Array.from({ length: setupPlayers }, (_, index) => existingNames[index] || "");
  state.ui.setupProfileIds = Array.from({ length: setupPlayers }, (_, index) => existingProfileIds[index] || "");

  els.playerInputs.innerHTML = state.ui.setupPlayers
    .map(
      (name, index) => `
        <div class="player-slot">
          <div class="profile-badge">${renderProfileBadge(index)}</div>
          <label>
            <span>Saved profile</span>
            <select data-player-profile-index="${index}">
              <option value="">Custom player</option>
              ${state.profiles
                .map(
                  (profile) => `
                    <option value="${profile.id}" ${state.ui.setupProfileIds[index] === profile.id ? "selected" : ""}>
                      ${escapeHtml(profile.name)}
                    </option>
                  `,
                )
                .join("")}
            </select>
          </label>
          <label>
            <span>Player ${index + 1}</span>
            <input type="text" data-player-index="${index}" value="${escapeHtml(name)}" placeholder="Name" />
          </label>
        </div>
      `,
    )
    .join("");

  const payoutCount = setupPlayers;
  const existingPayouts = state.ui.setupPayouts || {};
  state.ui.setupPayouts = {};
  for (let position = 1; position <= payoutCount; position += 1) {
    state.ui.setupPayouts[position] = Number(existingPayouts[position] ?? (position === 1 ? 0 : ""));
  }

  els.payoutInputs.innerHTML = Array.from({ length: payoutCount }, (_, index) => {
    const position = index + 1;
    const label = getPositionLabel(position, payoutCount);
    const value = Number.isFinite(state.ui.setupPayouts[position]) ? state.ui.setupPayouts[position] : "";
    return `
      <label>
        <span>${label}</span>
        <input type="number" min="0" step="0.01" data-payout-position="${position}" value="${value}" placeholder="0" />
      </label>
    `;
  }).join("");

  els.playerInputs.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (event) => {
      state.ui.setupPlayers[Number(event.target.dataset.playerIndex)] = event.target.value;
    });
  });

  els.playerInputs.querySelectorAll("select").forEach((select) => {
    select.addEventListener("change", (event) => {
      const index = Number(event.target.dataset.playerProfileIndex);
      const profileId = event.target.value;
      state.ui.setupProfileIds[index] = profileId;
      if (profileId) {
        const profile = state.profiles.find((entry) => entry.id === profileId);
        if (profile) {
          state.ui.setupPlayers[index] = profile.name;
        }
      }
      saveState();
      renderSetupInputs();
    });
  });

  els.payoutInputs.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (event) => {
      state.ui.setupPayouts[event.target.dataset.payoutPosition] = sanitizeMoney(event.target.value);
    });
  });
}

function renderSetupStep() {
  const step = state.ui.setupStep || 0;
  els.setupSteps.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.setupStep) === step);
  });
  els.setupPanels.forEach((panel) => {
    panel.classList.toggle("active", Number(panel.dataset.stepPanel) === step);
  });
}

function renderActiveSessionChip() {
  if (!state.activeSession) {
    els.activeSessionChip.textContent = "No active session";
    return;
  }

  const session = state.activeSession;
  const gameCount = session.games.length;
  els.activeSessionChip.textContent = `${session.name} • ${gameCount} game${gameCount === 1 ? "" : "s"}`;
}

function renderHome() {
  if (!state.activeSession) {
    els.activeSessionSummary.textContent = "No active session yet.";
    return;
  }

  const session = state.activeSession;
  const balances = calculateSessionBalances(session);
  const balanceMarkup = balances
    .map(
      (entry) => `
        <div class="summary-row">
          <div>
            <strong>${escapeHtml(entry.name)}</strong>
            <div class="muted">${entry.balance >= 0 ? "Will receive" : "Owes"}</div>
          </div>
          <strong class="mono">${formatCurrency(Math.abs(entry.balance))}</strong>
        </div>
      `,
    )
    .join("");

  els.activeSessionSummary.innerHTML = `
    <div class="summary-card">
      <div class="panel-head">
        <div>
          <h4>${escapeHtml(session.name)}</h4>
          <p class="muted">${session.mode === "session" ? "Session mode" : "Single game mode"} • ${session.players.length} players</p>
        </div>
        <button class="primary-btn" type="button" data-open-active="true">Continue</button>
      </div>
      <div class="pill-row">
        <span class="status-pill">${labelWinCondition(session.winCondition)}</span>
        <span class="status-pill">${session.games.length} completed game${session.games.length === 1 ? "" : "s"}</span>
        <span class="status-pill">${session.currentGame ? "Game in progress" : session.endgameSummary ? "Review last game" : "Ready for next game"}</span>
      </div>
      <div class="summary-list">${balanceMarkup || '<div class="empty-state">No balances yet.</div>'}</div>
    </div>
  `;

  const continueBtn = els.activeSessionSummary.querySelector('[data-open-active="true"]');
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      state.ui.activeView = "play";
      saveState();
      renderAll();
    });
  }
}

function openProfileDialog() {
  renderProfileList();
  resetProfileForm();
  els.profileDialog.showModal();
}

function renderProfileList() {
  if (!state.profiles.length) {
    els.profileList.innerHTML = '<div class="empty-state">No saved player profiles yet.</div>';
    return;
  }

  els.profileList.innerHTML = state.profiles
    .map(
      (profile) => `
        <article class="history-card compact">
          <div class="history-card-header">
            <div class="profile-row">
              ${profile.image ? `<img class="avatar-image" src="${profile.image}" alt="${escapeHtml(profile.name)}" />` : `<div class="avatar-fallback">${escapeHtml(profile.name.slice(0, 1).toUpperCase())}</div>`}
              <div class="history-meta">
                <h4>${escapeHtml(profile.name)}</h4>
                <p>${escapeHtml(profile.bio || "No bio yet")}</p>
              </div>
            </div>
            <div class="wizard-actions">
              <button class="secondary-btn" type="button" data-edit-profile="${profile.id}">Edit</button>
              <button class="secondary-btn danger" type="button" data-delete-profile="${profile.id}">Delete</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  els.profileList.querySelectorAll("[data-edit-profile]").forEach((button) => {
    button.addEventListener("click", () => loadProfileIntoForm(button.dataset.editProfile));
  });
  els.profileList.querySelectorAll("[data-delete-profile]").forEach((button) => {
    button.addEventListener("click", () => deleteProfile(button.dataset.deleteProfile));
  });
}

function renderProfileBadge(index) {
  const profileId = state.ui.setupProfileIds[index];
  const profile = state.profiles.find((entry) => entry.id === profileId);
  if (profile?.image) {
    return `<img class="avatar-image" src="${profile.image}" alt="${escapeHtml(profile.name)}" />`;
  }
  if (profile) {
    return `<div class="avatar-fallback">${escapeHtml(profile.name.slice(0, 1).toUpperCase())}</div>`;
  }
  return `<div class="avatar-fallback">${index + 1}</div>`;
}

function renderAvatar(player) {
  if (player.image) {
    return `<img class="avatar-image" src="${player.image}" alt="${escapeHtml(player.name)}" />`;
  }
  return `<div class="avatar-fallback">${escapeHtml(player.name.slice(0, 1).toUpperCase())}</div>`;
}

function loadProfileIntoForm(profileId) {
  const profile = state.profiles.find((entry) => entry.id === profileId);
  if (!profile) return;
  els.profileFormTitle.textContent = "Edit profile";
  els.profileId.value = profile.id;
  els.profileName.value = profile.name;
  els.profileBio.value = profile.bio || "";
  pendingProfileImage = profile.image || "";
  renderProfilePreview();
}

function resetProfileForm() {
  els.profileFormTitle.textContent = "Add profile";
  els.profileId.value = "";
  els.profileName.value = "";
  els.profileBio.value = "";
  els.profilePhoto.value = "";
  pendingProfileImage = "";
  renderProfilePreview();
}

function renderProfilePreview() {
  if (!pendingProfileImage) {
    els.profilePreview.className = "profile-preview empty-state";
    els.profilePreview.textContent = "No photo selected.";
    return;
  }
  els.profilePreview.className = "profile-preview";
  els.profilePreview.innerHTML = `<img class="profile-preview-image" src="${pendingProfileImage}" alt="Profile preview" />`;
}

function handleProfilePhotoChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pendingProfileImage = typeof reader.result === "string" ? reader.result : "";
    renderProfilePreview();
  };
  reader.readAsDataURL(file);
}

function handleProfileSave(event) {
  event.preventDefault();
  const name = els.profileName.value.trim();
  if (!name) {
    window.alert("Please enter a player name.");
    return;
  }

  const bio = els.profileBio.value.trim();
  const existingId = els.profileId.value;
  if (existingId) {
    const profile = state.profiles.find((entry) => entry.id === existingId);
    if (profile) {
      profile.name = name;
      profile.bio = bio;
      profile.image = pendingProfileImage;
    }
  } else {
    state.profiles.push({
      id: crypto.randomUUID(),
      name,
      bio,
      image: pendingProfileImage,
    });
  }

  saveState();
  renderProfileList();
  renderSetupInputs();
  resetProfileForm();
}

function deleteProfile(profileId) {
  state.profiles = state.profiles.filter((entry) => entry.id !== profileId);
  state.ui.setupProfileIds = (state.ui.setupProfileIds || []).map((id) => (id === profileId ? "" : id));
  saveState();
  renderProfileList();
  renderSetupInputs();
}

function renderPlay() {
  const session = state.activeSession;
  if (!session) {
    els.playRoot.className = "empty-state";
    els.playRoot.textContent = "Start a session to begin tracking scores.";
    return;
  }

  if (session.endgameSummary) {
    renderPlayEndgame(session);
    return;
  }

  const currentGame = session.currentGame || createGameSkeleton(session.players);
  if (!session.currentGame) {
    session.currentGame = currentGame;
    saveState();
  }

  ensureRoundDraft(currentGame);

  const leaderboard = getLeaderboard(currentGame.players);
  const currentWinnerId = leaderboard[0]?.id;
  const topScore = leaderboard[0]?.score ?? 0;
  const topName = leaderboard[0]?.name ?? "No leader";
  const roundStatus = getRoundDraftStatus(currentGame);

  els.playRoot.className = "";
  els.playRoot.innerHTML = `
    <div class="session-head">
      <div class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${session.mode === "session" ? "Session mode" : "Single game mode"}</p>
            <h3>${escapeHtml(session.name)}</h3>
          </div>
          <button class="secondary-btn danger" type="button" data-end-session="true">
            ${session.mode === "single" ? "Finish & save" : "End session"}
          </button>
        </div>
        <div class="pill-row">
          <span class="status-pill">${labelWinCondition(session.winCondition)}</span>
          <span class="status-pill">Game ${session.games.length + 1}</span>
          <span class="status-pill">Round ${currentGame.rounds.length + 1}</span>
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Leader</div>
          <div class="metric-value metric-name">${escapeHtml(topName)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Top score</div>
          <div class="metric-value mono">${topScore}</div>
        </div>
      </div>

      <div class="score-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Current game</p>
            <h4>Leaderboard</h4>
          </div>
          ${
            session.winCondition === "highest-score"
              ? '<button class="secondary-btn" type="button" data-force-finish="true">Finish game now</button>'
              : '<div class="muted">Auto-finish at 1000</div>'
          }
        </div>
        <div class="score-list">
          ${leaderboard
            .map(
              (player, index) => `
                <div class="leaderboard-row ${player.id === currentWinnerId ? "current-winner" : ""}">
                  <div class="profile-row">
                    ${renderAvatar(player)}
                    <div class="player-meta">
                      <strong>${index + 1}. ${escapeHtml(player.name)}</strong>
                      <div class="muted">${escapeHtml(player.bio || "")}</div>
                      <div class="pill-row">
                        ${player.score <= 0 ? '<span class="status-pill bad">0 or negative</span>' : ""}
                        ${player.score === 1000 ? '<span class="status-pill warn">Exact 1000</span>' : ""}
                      </div>
                    </div>
                  </div>
                  <div class="score-number mono">${player.score}</div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Round entry</p>
            <h4>Enter round</h4>
          </div>
          <div class="muted mono" id="roundTotalDisplay">Total: ${roundStatus.total} / ${roundStatus.maxTotal}</div>
        </div>
        <form id="roundForm" class="round-entry">
          <div class="round-player-list">
            ${currentGame.players
              .map((player) => {
                const declaration = currentGame.roundDraft.declarations[player.id] || "none";
                const pointsValue = currentGame.roundDraft.points[player.id] ?? 0;
                const isDeclared = declaration === "declared";
                const isFailed = declaration === "failed";
                return `
                  <div class="round-player-card">
                    <div class="panel-head tight">
                      <div>
                        <strong>${escapeHtml(player.name)}</strong>
                        <div class="muted">Score: ${player.score}</div>
                      </div>
                      <button
                        class="secondary-btn decl-btn ${isDeclared ? "declared" : ""} ${isFailed ? "failed" : ""}"
                        type="button"
                        data-declare-player="${player.id}"
                      >
                        ${declaration === "none" ? "Declare" : declaration === "declared" ? "Declared" : "Failed"}
                      </button>
                    </div>
                    <label>
                      <span>Points won</span>
                      <input
                        type="number"
                        min="0"
                        max="${isDeclared ? 720 : 360}"
                        step="5"
                        inputmode="numeric"
                        data-round-player="${player.id}"
                        value="${pointsValue}"
                        ${isDeclared ? "disabled" : ""}
                      />
                    </label>
                  </div>
                `;
              })
              .join("")}
          </div>

          <div class="round-summary ${roundStatus.kind === "error" ? "is-error" : ""}" id="roundSummary">
            ${escapeHtml(roundStatus.message)}
          </div>

          <button class="primary-btn" type="submit">Confirm round</button>
        </form>
      </div>
    </div>
  `;

  els.playRoot.querySelector("#roundForm").addEventListener("submit", handleRoundSubmit);
  els.playRoot.querySelector("[data-end-session='true']").addEventListener("click", finalizeSession);
  els.playRoot.querySelectorAll("[data-declare-player]").forEach((button) => {
    button.addEventListener("click", () => cycleDeclarationState(button.dataset.declarePlayer));
  });
  els.playRoot.querySelectorAll("[data-round-player]").forEach((input) => {
    input.addEventListener("input", () => updateRoundDraft(input.dataset.roundPlayer, input.value));
  });

  const finishBtn = els.playRoot.querySelector("[data-force-finish='true']");
  if (finishBtn) {
    finishBtn.addEventListener("click", () => beginGameFinish("manual"));
  }
}

function renderPlayEndgame(session) {
  const game = session.endgameSummary;
  els.playRoot.className = "";
  els.playRoot.innerHTML = `
    <div class="session-head">
      <div class="panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Game over</p>
            <h3>Game ${session.games.length} complete</h3>
          </div>
          <span class="status-pill">${session.mode === "session" ? "Session continues" : "Single game"}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Final standings</p>
            <h4>Results</h4>
          </div>
        </div>
        <div class="summary-list">
          ${game.results
            .map(
              (result) => `
                <div class="summary-row">
                  <div>
                    <strong>${result.position}. ${escapeHtml(result.name)}</strong>
                    <div class="muted">
                      ${result.score} points
                      ${result.score === 1000 ? " • exact 1000" : ""}
                      ${result.score <= 0 && result.position > 1 ? " • 0/negative" : ""}
                    </div>
                  </div>
                  <strong class="mono">${result.payment > 0 ? "+" : "-"}${formatCurrency(Math.abs(result.payment))}</strong>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>

      <div class="debt-card">
        <div class="panel-head">
          <div>
            <p class="eyebrow">Payouts this game</p>
            <h4>Who pays what</h4>
          </div>
        </div>
        <div class="settlement-list">
          ${
            game.results.some((result) => result.owesWinner > 0)
              ? game.results
                  .filter((result) => result.owesWinner > 0)
                  .map(
                    (result) => `
                      <div class="debt-row">
                        <div>
                          <strong>${escapeHtml(result.name)} pays ${escapeHtml(game.results[0].name)}</strong>
                          <div class="muted">${escapeHtml(result.multiplierNote || "Base payout")}</div>
                        </div>
                        <strong class="mono">${formatCurrency(result.owesWinner)}</strong>
                      </div>
                    `,
                  )
                  .join("")
              : '<div class="empty-state">No payouts this game.</div>'
          }
        </div>
      </div>

      <div class="panel action-stack">
        ${
          session.mode === "session"
            ? `
              <button class="primary-btn" type="button" data-next-game="true">Start next game</button>
              <button class="secondary-btn" type="button" data-end-session="true">End session & settle</button>
            `
            : `
              <button class="primary-btn" type="button" data-end-session="true">Settle & save</button>
            `
        }
      </div>
    </div>
  `;

  els.playRoot.querySelector("[data-end-session='true']").addEventListener("click", finalizeSession);
  const nextBtn = els.playRoot.querySelector("[data-next-game='true']");
  if (nextBtn) {
    nextBtn.addEventListener("click", startNextGame);
  }
}

function renderHistory() {
  if (!state.history.length) {
    els.historyRoot.className = "history-list empty-state";
    els.historyRoot.textContent = "No completed sessions yet.";
    return;
  }

  els.historyRoot.className = "history-list";
  els.historyRoot.innerHTML = state.history
    .slice()
    .reverse()
    .map((session) => {
      const pending = session.transactions.filter((tx) => !tx.paid).length;
      return `
        <article class="history-card">
          <div class="history-card-header">
            <div class="history-meta">
              <h4>${escapeHtml(session.name)}</h4>
              <p>${new Date(session.finishedAt).toLocaleString()}</p>
              <p>${session.players.map((player) => player.name).join(", ")}</p>
            </div>
            <div class="pill-row">
              <span class="status-pill">${session.mode === "session" ? "Session" : "Single game"}</span>
              <span class="status-pill ${pending ? "warn" : ""}">${pending} pending</span>
            </div>
          </div>
          <div class="summary-row">
            <div>
              <strong>${session.games.length} game${session.games.length === 1 ? "" : "s"}</strong>
              <div class="muted">Tap for full breakdown and payment status</div>
            </div>
            <button class="secondary-btn" type="button" data-history-id="${session.id}">Open</button>
          </div>
        </article>
      `;
    })
    .join("");

  els.historyRoot.querySelectorAll("[data-history-id]").forEach((button) => {
    button.addEventListener("click", () => openHistoryDialog(button.dataset.historyId));
  });
}

function startSession() {
  if (state.activeSession) {
    const replace = window.confirm(
      "You already have an active session. Press OK to replace it, or Cancel to keep the current one.",
    );
    if (!replace) return;
  }

  const playerNames = state.ui.setupPlayers.map((name) => name.trim()).filter(Boolean);
  const expectedCount = state.ui.setupPlayerCount;
  if (playerNames.length !== expectedCount) {
    window.alert(`Please enter all ${expectedCount} player names.`);
    return;
  }

  const uniqueNames = new Set(playerNames.map((name) => name.toLowerCase()));
  if (uniqueNames.size !== playerNames.length) {
    window.alert("Player names need to be unique.");
    return;
  }

  const payouts = {};
  for (let position = 1; position <= expectedCount; position += 1) {
    payouts[position] = sanitizeMoney(state.ui.setupPayouts[position] ?? 0);
  }

  const session = {
    id: crypto.randomUUID(),
    name: els.sessionName.value.trim() || autoSessionName(playerNames),
    mode: els.sessionMode.value,
    winCondition: els.winCondition.value,
    players: playerNames.map((name, index) => {
      const profileId = state.ui.setupProfileIds[index];
      const profile = state.profiles.find((entry) => entry.id === profileId);
      return {
        id: crypto.randomUUID(),
        name,
        profileId: profile?.id || "",
        bio: profile?.bio || "",
        image: profile?.image || "",
      };
    }),
    payouts,
    games: [],
    currentGame: null,
    endgameSummary: null,
    createdAt: new Date().toISOString(),
  };

  session.currentGame = createGameSkeleton(session.players);
  state.activeSession = session;
  state.ui.activeView = "play";
  saveState();
  renderAll();
}

function createGameSkeleton(players) {
  return {
    id: crypto.randomUUID(),
    rounds: [],
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      profileId: player.profileId || "",
      bio: player.bio || "",
      image: player.image || "",
      score: 0,
    })),
    roundDraft: {
      points: Object.fromEntries(players.map((player) => [player.id, 0])),
      declarations: Object.fromEntries(players.map((player) => [player.id, "none"])),
    },
    createdAt: new Date().toISOString(),
  };
}

function handleRoundSubmit(event) {
  event.preventDefault();
  const session = state.activeSession;
  const game = session.currentGame;
  ensureRoundDraft(game);
  const declarationEntries = Object.entries(game.roundDraft.declarations).filter(([, value]) => value !== "none");
  const declaration = declarationEntries.length > 0;
  const activeDeclaration = declarationEntries[0] || null;
  const result = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    declaration,
    declarationPlayerId: activeDeclaration ? activeDeclaration[0] : null,
    declarationResult: activeDeclaration ? activeDeclaration[1] : null,
    points: {},
  };

  if (declaration) {
    const declarerId = result.declarationPlayerId;
    if (result.declarationResult === "declared") {
      game.players.forEach((player) => {
        result.points[player.id] = player.id === declarerId ? 720 : 0;
      });
    } else {
      let total = 0;
      let others = 0;
      game.players.forEach((player) => {
        if (player.id === declarerId) {
          result.points[player.id] = -360;
          return;
        }

        const value = sanitizePoints(game.roundDraft.points[player.id]);
        result.points[player.id] = value;
        total += value;
        others += 1;
      });

      if (total <= 0 || total > 360) {
        window.alert(
          "When a declaration fails, only the points actually won by the other players count. Their total must be more than 0 and no more than 360.",
        );
        return;
      }

      if (!others) {
        window.alert("A declaration needs other players in the round.");
        return;
      }
    }
  } else {
    let total = 0;
    game.players.forEach((player) => {
      const value = sanitizePoints(game.roundDraft.points[player.id]);
      result.points[player.id] = value;
      total += value;
    });

    if (total !== 360) {
      window.alert("Normal rounds must total 360 points.");
      return;
    }
  }

  game.rounds.push(result);
  game.players.forEach((player) => {
    player.score += result.points[player.id];
  });
  resetRoundDraft(game);

  saveState();

  if (session.winCondition === "first-1000" && game.players.some((player) => player.score >= 1000)) {
    beginGameFinish("threshold");
    return;
  }

  renderPlay();
}

function beginGameFinish(reason) {
  const session = state.activeSession;
  if (!session?.currentGame) return;

  const ordered = getLeaderboard(session.currentGame.players, session.winCondition);
  const positions = Array.from({ length: ordered.length }, (_, index) => index + 1);

  els.positionAssignments.innerHTML = ordered
    .map(
      (player, index) => `
        <label class="position-line">
          <span>${escapeHtml(player.name)} (${player.score} pts)</span>
          <select data-position-player="${player.id}">
            ${positions
              .map(
                (position) => `
                  <option value="${position}" ${position === index + 1 ? "selected" : ""}>
                    ${position}
                  </option>
                `,
              )
              .join("")}
          </select>
        </label>
      `,
    )
    .join("");

  els.positionDialog.dataset.reason = reason;
  els.positionDialog.showModal();
}

function handlePositionSubmit(event) {
  event.preventDefault();
  const session = state.activeSession;
  const game = session.currentGame;
  if (!session || !game) return;

  const assignments = [...els.positionAssignments.querySelectorAll("select")].map((select) => ({
    playerId: select.dataset.positionPlayer,
    position: Number(select.value),
  }));

  const uniquePositions = new Set(assignments.map((entry) => entry.position));
  if (uniquePositions.size !== assignments.length) {
    window.alert("Each player needs a unique finishing position.");
    return;
  }

  const playerMap = Object.fromEntries(game.players.map((player) => [player.id, player]));
  const orderedResults = assignments
    .map((assignment) => ({
      ...assignment,
      ...playerMap[assignment.playerId],
    }))
    .sort((a, b) => a.position - b.position);

  const winner = orderedResults[0];
  const exactWinner = winner.score === 1000;
  const results = orderedResults.map((entry) => {
    if (entry.position === 1) {
      return {
        ...entry,
        payment: 0,
        owesWinner: 0,
        multiplierNote: "",
      };
    }

    const baseAmount = sanitizeMoney(session.payouts[entry.position] ?? 0);
    const winnerBonus = exactWinner ? baseAmount : 0;
    const loserBonus = entry.score <= 0 ? baseAmount : 0;
    const totalOwed = roundMoney(baseAmount + winnerBonus + loserBonus);
    const notes = [];
    if (entry.score <= 0) notes.push("0/neg doubles");
    if (exactWinner) notes.push("exact 1000 bonus");

    return {
      ...entry,
      payment: -totalOwed,
      owesWinner: totalOwed,
      multiplierNote: notes.join(", ") || "Base payout",
    };
  });

  const winnerTotal = roundMoney(results.reduce((sum, entry) => sum + entry.owesWinner, 0));
  results[0].payment = winnerTotal;

  const finishedGame = {
    id: game.id,
    createdAt: game.createdAt,
    finishedAt: new Date().toISOString(),
    rounds: game.rounds,
    results: results.map((entry) => ({
      playerId: entry.id,
      name: entry.name,
      score: entry.score,
      position: entry.position,
      payment: entry.payment,
      owesWinner: entry.owesWinner || 0,
      multiplierNote: entry.multiplierNote || "",
    })),
  };

  session.games.push(finishedGame);
  session.currentGame = null;
  session.endgameSummary = finishedGame;
  saveState();
  els.positionDialog.close();

  renderAll();
}

function ensureRoundDraft(game) {
  if (!game.roundDraft) {
    game.roundDraft = {
      points: Object.fromEntries(game.players.map((player) => [player.id, 0])),
      declarations: Object.fromEntries(game.players.map((player) => [player.id, "none"])),
    };
  }
}

function resetRoundDraft(game) {
  game.roundDraft = {
    points: Object.fromEntries(game.players.map((player) => [player.id, 0])),
    declarations: Object.fromEntries(game.players.map((player) => [player.id, "none"])),
  };
}

function cycleDeclarationState(playerId) {
  const session = state.activeSession;
  const game = session?.currentGame;
  if (!game) return;
  ensureRoundDraft(game);

  const current = game.roundDraft.declarations[playerId] || "none";
  const next = current === "none" ? "declared" : current === "declared" ? "failed" : "none";
  Object.keys(game.roundDraft.declarations).forEach((id) => {
    game.roundDraft.declarations[id] = id === playerId ? next : "none";
  });

  if (next === "declared") {
    Object.keys(game.roundDraft.points).forEach((id) => {
      game.roundDraft.points[id] = id === playerId ? 720 : 0;
    });
  } else if (next === "failed") {
    game.roundDraft.points[playerId] = 0;
  } else {
    game.roundDraft.points[playerId] = 0;
  }

  saveState();
  renderPlay();
}

function updateRoundDraft(playerId, value) {
  const session = state.activeSession;
  const game = session?.currentGame;
  if (!game) return;
  ensureRoundDraft(game);
  game.roundDraft.points[playerId] = sanitizePoints(value);
  saveState();
  refreshRoundDraftUi(game);
}

function getRoundDraftStatus(game) {
  ensureRoundDraft(game);
  const declarationEntries = Object.entries(game.roundDraft.declarations).filter(([, value]) => value !== "none");
  const activeDeclaration = declarationEntries[0] || null;

  if (!activeDeclaration) {
    const total = Object.values(game.roundDraft.points).reduce((sum, value) => sum + sanitizePoints(value), 0);
    return {
      total,
      maxTotal: 360,
      kind: total === 360 ? "ok" : "info",
      message: "Normal round: all player points must total 360.",
    };
  }

  if (activeDeclaration[1] === "declared") {
    return {
      total: 720,
      maxTotal: 720,
      kind: "ok",
      message: "Successful declaration: declarer gets 720, everyone else gets 0.",
    };
  }

  const declarerId = activeDeclaration[0];
  const total = Object.entries(game.roundDraft.points).reduce((sum, [id, value]) => {
    if (id === declarerId) return sum;
    return sum + sanitizePoints(value);
  }, 0);

  return {
    total,
    maxTotal: 360,
    kind: total <= 0 || total > 360 ? "error" : "info",
    message:
      "Failed declaration: declarer gets -360. Enter only the points actually won by the other players.",
  };
}

function startNextGame() {
  const session = state.activeSession;
  if (!session) return;
  session.currentGame = createGameSkeleton(session.players);
  session.endgameSummary = null;
  saveState();
  renderAll();
}

function refreshRoundDraftUi(game) {
  const roundStatus = getRoundDraftStatus(game);
  const totalNode = els.playRoot.querySelector("#roundTotalDisplay");
  const summaryNode = els.playRoot.querySelector("#roundSummary");
  if (totalNode) {
    totalNode.textContent = `Total: ${roundStatus.total} / ${roundStatus.maxTotal}`;
  }
  if (summaryNode) {
    summaryNode.textContent = roundStatus.message;
    summaryNode.classList.toggle("is-error", roundStatus.kind === "error");
  }
}

function finalizeSession() {
  const session = state.activeSession;
  if (!session) return;

  if (session.currentGame && session.currentGame.rounds.length > 0) {
    const keepPlaying = window.confirm(
      "This game still has rounds in progress. Press OK to keep playing, or Cancel to end the session without this unfinished game.",
    );
    if (keepPlaying) {
      return;
    }
  }

  if (!session.games.length) {
    window.alert("Finish at least one game before ending the session.");
    return;
  }

  const balances = calculateSessionBalances(session);
  const transactions = simplifyBalances(balances).map((tx) => ({
    ...tx,
    id: crypto.randomUUID(),
    paid: false,
  }));

  const completeSession = {
    ...session,
    currentGame: null,
    finishedAt: new Date().toISOString(),
    balances,
    transactions,
  };

  state.history.push(completeSession);
  state.activeSession = null;
  state.ui.activeView = "history";
  saveState();
  renderAll();
}

function calculateSessionBalances(session) {
  const balances = Object.fromEntries(session.players.map((player) => [player.id, 0]));
  session.games.forEach((game) => {
    game.results.forEach((result) => {
      balances[result.playerId] = roundMoney((balances[result.playerId] || 0) + result.payment);
    });
  });

  return session.players
    .map((player) => ({
      id: player.id,
      name: player.name,
      balance: roundMoney(balances[player.id] || 0),
      image: player.image || "",
    }))
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

function simplifyBalances(entries) {
  const creditors = entries
    .filter((entry) => entry.balance > 0.0001)
    .map((entry) => ({ ...entry, remaining: entry.balance }));
  const debtors = entries
    .filter((entry) => entry.balance < -0.0001)
    .map((entry) => ({ ...entry, remaining: Math.abs(entry.balance) }));

  const transactions = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amount = roundMoney(Math.min(creditor.remaining, debtor.remaining));

    if (amount > 0) {
      transactions.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount,
      });
    }

    creditor.remaining = roundMoney(creditor.remaining - amount);
    debtor.remaining = roundMoney(debtor.remaining - amount);

    if (creditor.remaining <= 0.0001) creditorIndex += 1;
    if (debtor.remaining <= 0.0001) debtorIndex += 1;
  }

  return transactions;
}

function getLeaderboard(players) {
  return [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function openHistoryDialog(sessionId) {
  const session = state.history.find((entry) => entry.id === sessionId);
  if (!session) return;

  els.historyDialogContent.innerHTML = `
    <div class="panel-head">
      <div>
        <p class="eyebrow">History detail</p>
        <h3>${escapeHtml(session.name)}</h3>
      </div>
      <button class="secondary-btn" type="button" data-close-history="true">Close</button>
    </div>

    <div class="summary-card">
      <h4>Pending payments</h4>
      <div class="settlement-list">
        ${
          session.transactions.length
            ? session.transactions
                .map(
                  (tx) => `
                    <div class="debt-row">
                      <div>
                        <strong>${escapeHtml(tx.fromName)} pays ${escapeHtml(tx.toName)}</strong>
                        <div class="muted">${tx.paid ? "Paid" : "Pending"}</div>
                      </div>
                      <div class="pill-row">
                        <strong class="mono">${formatCurrency(tx.amount)}</strong>
                        <button class="secondary-btn" type="button" data-toggle-payment="${tx.id}">
                          ${tx.paid ? "Mark unpaid" : "Mark paid"}
                        </button>
                      </div>
                    </div>
                  `,
                )
                .join("")
            : '<div class="empty-state">No payments to settle.</div>'
        }
      </div>
    </div>

    <div class="summary-card">
      <h4>Final balances</h4>
      <div class="summary-list">
        ${session.balances
          .map(
            (entry) => `
              <div class="summary-row">
                <div>
                  <strong>${escapeHtml(entry.name)}</strong>
                  <div class="muted">${entry.balance >= 0 ? "Receives" : "Owes"}</div>
                </div>
                <strong class="mono">${formatCurrency(Math.abs(entry.balance))}</strong>
              </div>
            `,
          )
          .join("")}
      </div>
    </div>

    <div class="summary-card">
      <h4>Games in this session</h4>
      <div class="round-list">
        ${session.games
          .map(
            (game, index) => `
              <article>
                <div class="round-head">
                  <strong>Game ${index + 1}</strong>
                  <span class="muted">${new Date(game.finishedAt).toLocaleString()}</span>
                </div>
                ${game.results
                  .map(
                    (result) => `
                      <div class="summary-row">
                        <div>
                          <strong>${result.position}. ${escapeHtml(result.name)}</strong>
                          <div class="muted">${result.score} points</div>
                        </div>
                        <strong class="mono">${result.payment > 0 ? "+" : ""}${formatCurrency(result.payment)}</strong>
                      </div>
                    `,
                  )
                  .join("")}
              </article>
            `,
          )
          .join("")}
      </div>
    </div>
  `;

  els.historyDialogContent.querySelector("[data-close-history='true']").addEventListener("click", () => {
    els.historyDialog.close();
  });

  els.historyDialogContent.querySelectorAll("[data-toggle-payment]").forEach((button) => {
    button.addEventListener("click", () => togglePayment(sessionId, button.dataset.togglePayment));
  });

  els.historyDialog.showModal();
}

function togglePayment(sessionId, paymentId) {
  const session = state.history.find((entry) => entry.id === sessionId);
  if (!session) return;
  const payment = session.transactions.find((entry) => entry.id === paymentId);
  if (!payment) return;

  payment.paid = !payment.paid;
  saveState();
  renderHistory();
  if (els.historyDialog.open) {
    els.historyDialog.close();
  }
  openHistoryDialog(sessionId);
}

function loadDemoSession() {
  state.ui.setupPlayerCount = 4;
  state.ui.setupPlayers = ["Tenzin", "Ali", "Sara", "Noah"];
  state.ui.setupPayouts = { 1: 0, 2: 0, 3: 3, 4: 5 };
  els.sessionName.value = "Demo Session";
  els.sessionMode.value = "session";
  els.winCondition.value = "first-1000";
  renderSetupInputs();
}

function autoSessionName(playerNames) {
  return `${playerNames[0]}'s card session`;
}

function labelWinCondition(value) {
  return value === "first-1000" ? "First to 1000" : "Highest score";
}

function getPositionLabel(position, totalPlayers) {
  if (position === 1) return "Winner collects";
  if (totalPlayers === 5 && position === 2) return "2nd highest pays";
  if (totalPlayers === 5 && position === 3) return "3rd pays";
  if (totalPlayers === 5 && position === 4) return "2nd lowest pays";
  if (totalPlayers === 5 && position === 5) return "Lowest pays";
  if (totalPlayers === 4 && position === 2) return "2nd highest pays";
  if (totalPlayers === 4 && position === 3) return "2nd lowest pays";
  if (totalPlayers === 4 && position === 4) return "Lowest pays";
  return `${ordinal(position)} place pays`;
}

function ordinal(number) {
  const suffixes = ["th", "st", "nd", "rd"];
  const value = number % 100;
  return `${number}${suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]}`;
}

function sanitizeMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return roundMoney(amount);
}

function sanitizePoints(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.round(number));
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        profiles: parsed.profiles || [],
        history: parsed.history || [],
        activeSession: parsed.activeSession || null,
        ui: {
          activeView: parsed.ui?.activeView || "home",
          setupStep: parsed.ui?.setupStep || 0,
          setupPlayerCount: parsed.ui?.setupPlayerCount || 4,
          setupPlayers: parsed.ui?.setupPlayers || ["", "", "", ""],
          setupProfileIds: parsed.ui?.setupProfileIds || ["", "", "", ""],
          setupPayouts: parsed.ui?.setupPayouts || { 1: 0, 2: 0, 3: 0, 4: 0 },
        },
      };
    }
  } catch (error) {
    console.error("Could not load saved state", error);
  }

  return {
    profiles: [],
    history: [],
    activeSession: null,
    ui: {
      activeView: "home",
      setupStep: 0,
      setupPlayerCount: 4,
      setupPlayers: ["", "", "", ""],
      setupProfileIds: ["", "", "", ""],
      setupPayouts: { 1: 0, 2: 0, 3: 0, 4: 0 },
    },
  };
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      profiles: state.profiles,
      history: state.history,
      activeSession: state.activeSession,
      ui: state.ui,
    }),
  );
}
