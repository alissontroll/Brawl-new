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
});

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
    results.classList.remove("hidden");
  } catch (err) {
    statusMsg.textContent = "Não consegui conectar. Confere sua internet.";
  }
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
