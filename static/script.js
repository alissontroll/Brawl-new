const form = document.getElementById("search-form");
const input = document.getElementById("tag-input");
const statusMsg = document.getElementById("status-msg");
const results = document.getElementById("results");
const rememberCheck = document.getElementById("remember-check");

const STORAGE_KEY = "meubrawl_tag";

// Ao abrir a página: se tiver uma tag salva, preenche e já busca sozinho
window.addEventListener("DOMContentLoaded", () => {
  const savedTag = localStorage.getItem(STORAGE_KEY);
  if (savedTag) {
    input.value = savedTag;
    rememberCheck.checked = true;
    form.requestSubmit();
  }
  checkGameStatus();
});

async function checkGameStatus() {
  const banner = document.getElementById("status-banner");
  try {
    const resp = await fetch("/api/status");
    const data = await resp.json();
    if (data.status === "maintenance") {
      banner.textContent = "🛠️ O jogo está em manutenção agora. Os dados podem não carregar por um tempo.";
      banner.className = "status-banner maintenance";
    } else if (data.status === "online") {
      banner.textContent = "🟢 Servidor do jogo no ar";
      banner.className = "status-banner online";
    } else {
      banner.classList.add("hidden");
      return;
    }
    banner.classList.remove("hidden");
  } catch (err) {
    banner.classList.add("hidden");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const rawTag = input.value.trim().replace("#", "");
  if (!rawTag) return;

  if (rememberCheck.checked) {
    localStorage.setItem(STORAGE_KEY, "#" + rawTag);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }

  statusMsg.textContent = "Buscando...";
  results.classList.add("hidden");

  try {
    const resp = await fetch(`/api/player/${encodeURIComponent(rawTag)}`);
    const data = await resp.json();

    if (!resp.ok) {
      statusMsg.textContent = data.message || "Deu ruim. Tenta de novo.";
      return;
    }

    statusMsg.textContent = "";
    renderPlayer(data);
    saveTrophyHistory(rawTag, data.trophies);
    renderTrophyChart(rawTag);
    results.classList.remove("hidden");

    loadBattlelog(rawTag);
    if (data.clubTag) {
      loadClub(data.clubTag, data.tag);
    } else {
      document.getElementById("club-list").innerHTML = `<p class="empty-note">Você não está em nenhum clube.</p>`;
    }
  } catch (err) {
    statusMsg.textContent = "Não consegui conectar. Confere sua internet.";
  }
});

// ---------- Gráfico de troféus (guardado no próprio celular) ----------
const HISTORY_PREFIX = "meubrawl_history_";

function saveTrophyHistory(rawTag, trophies) {
  const key = HISTORY_PREFIX + rawTag;
  let history = [];
  try { history = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { history = []; }

  const today = new Date().toISOString().slice(0, 10);
  const last = history[history.length - 1];
  if (last && last.date === today) {
    last.trophies = trophies;
  } else {
    history.push({ date: today, trophies });
  }
  if (history.length > 30) history = history.slice(-30);
  localStorage.setItem(key, JSON.stringify(history));
}

function renderTrophyChart(rawTag) {
  const container = document.getElementById("trophy-chart");
  let history = [];
  try { history = JSON.parse(localStorage.getItem(HISTORY_PREFIX + rawTag)) || []; } catch (e) { history = []; }

  if (history.length < 2) {
    container.innerHTML = `<p class="empty">Volta amanhã pra começar a ver o gráfico crescendo!</p>`;
    return;
  }

  const values = history.map(h => h.trophies);
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const w = 300, h = 90, pad = 6;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <polyline points="${points}" fill="none" stroke="#ffcc00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

// ---------- Últimas partidas ----------
async function loadBattlelog(rawTag) {
  const box = document.getElementById("battle-list");
  box.innerHTML = `<p class="empty-note">Carregando...</p>`;
  try {
    const resp = await fetch(`/api/player/${encodeURIComponent(rawTag)}/battlelog`);
    const data = await resp.json();
    if (!resp.ok || !data.battles || data.battles.length === 0) {
      box.innerHTML = `<p class="empty-note">Nenhuma partida recente encontrada.</p>`;
      return;
    }
    box.innerHTML = "";
    data.battles.forEach(b => {
      let cls = "";
      let changeHtml = "";
      if (b.result === "victory") cls = "win";
      else if (b.result === "defeat") cls = "loss";
      if (typeof b.trophyChange === "number") {
        const up = b.trophyChange >= 0;
        cls = up ? "win" : "loss";
        changeHtml = `<span class="battle-change ${up ? "up" : "down"}">${up ? "+" : ""}${b.trophyChange}</span>`;
      } else if (b.result) {
        const label = b.result === "victory" ? "Vitória" : b.result === "defeat" ? "Derrota" : "Empate";
        changeHtml = `<span class="battle-change">${label}</span>`;
      }
      const row = document.createElement("div");
      row.className = `battle-row ${cls}`;
      row.innerHTML = `
        <div class="battle-info">
          <div class="battle-mode">${b.mode || "Partida"}${b.map ? " — " + b.map : ""}</div>
          <div class="battle-brawlers">${(b.brawlers || []).filter(Boolean).join(", ")}</div>
        </div>
        ${changeHtml}
      `;
      box.appendChild(row);
    });
  } catch (err) {
    box.innerHTML = `<p class="empty-note">Não consegui carregar as partidas.</p>`;
  }
}

// ---------- Ranking do clube ----------
async function loadClub(clubTag, myTag) {
  const box = document.getElementById("club-list");
  box.innerHTML = `<p class="empty-note">Carregando...</p>`;
  try {
    const resp = await fetch(`/api/club/${encodeURIComponent(clubTag.replace("#", ""))}/members`);
    const data = await resp.json();
    if (!resp.ok || !data.members) {
      box.innerHTML = `<p class="empty-note">Não consegui carregar o clube.</p>`;
      return;
    }
    box.innerHTML = "";
    data.members.forEach((m, i) => {
      const row = document.createElement("div");
      row.className = "club-row" + (m.tag === myTag ? " me" : "");
      row.innerHTML = `
        <span class="club-pos">${i + 1}</span>
        <div style="flex:1">
          <div class="club-name">${m.name}</div>
          <div class="club-role">${m.role || ""}</div>
        </div>
        <span class="club-trophies">${m.trophies}</span>
      `;
      box.appendChild(row);
    });
  } catch (err) {
    box.innerHTML = `<p class="empty-note">Não consegui carregar o clube.</p>`;
  }
}

// ---------- Instalar como app ----------
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.getElementById("install-row").classList.remove("hidden");
});
document.getElementById("install-btn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  document.getElementById("install-row").classList.add("hidden");
});

function renderPlayer(data) {
  document.getElementById("p-name").textContent = data.name || "—";
  document.getElementById("p-tag").textContent = data.tag || "—";
  document.getElementById("p-trophies").textContent = data.trophies ?? 0;
  document.getElementById("p-level").textContent = data.expLevel ?? 0;
  document.getElementById("p-owned").textContent = data.brawlersOwned ?? 0;
  document.getElementById("p-club").textContent = data.club || "sem clube";

  const todayBody = document.getElementById("today-focus-body");
  if (data.todayFocus) {
    todayBody.innerHTML = `
      ${data.todayFocus.imageUrl ? `<img src="${data.todayFocus.imageUrl}" alt="">` : ""}
      <span>${data.todayFocus.name} — nível de poder ${data.todayFocus.power}</span>
    `;
  } else {
    todayBody.textContent = "Todos os seus brawlers já estão no máximo! 🎉";
  }

  const focusList = document.getElementById("focus-list");
  focusList.innerHTML = "";
  (data.focusList || []).forEach((b, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank">${i + 1}</span>
      ${b.imageUrl ? `<img src="${b.imageUrl}" alt="">` : ""}
      <span class="fname">${b.name}</span>
      <span class="fpower">poder ${b.power}</span>
    `;
    focusList.appendChild(li);
  });

  const grid = document.getElementById("all-brawlers");
  grid.innerHTML = "";
  (data.brawlers || []).forEach((b) => {
    const card = document.createElement("div");
    card.className = "brawler-card" + (b.maxed ? " maxed" : "");
    card.innerHTML = `
      ${b.imageUrl ? `<img src="${b.imageUrl}" alt="">` : ""}
      <div class="bname">${b.name}</div>
      <div class="bpower">poder ${b.power}</div>
    `;
    grid.appendChild(card);
  });
}
