const root = document.documentElement;
const dateTag = document.querySelector("[data-today]");
const searchInput = document.querySelector("[data-search]");
const cards = [...document.querySelectorAll("[data-card]")];

if (dateTag) {
  const now = new Date();
  dateTag.textContent = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

if (searchInput && cards.length) {
  searchInput.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();

    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      const shouldShow = text.includes(query);
      card.classList.toggle("hidden", !shouldShow);
    });
  });
}

const checklists = [...document.querySelectorAll("[data-checklist-key]")];

checklists.forEach((list) => {
  const key = `estudo:${list.dataset.checklistKey}`;
  const boxes = [...list.querySelectorAll("input[type='checkbox']")];
  const progressLabel = document.querySelector(`[data-progress-label='${list.dataset.checklistKey}']`);
  const progressBar = document.querySelector(`[data-progress-fill='${list.dataset.checklistKey}']`);

  let saved = {};

  try {
    saved = JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    saved = {};
  }

  boxes.forEach((box) => {
    if (saved[box.value]) {
      box.checked = true;
    }

    box.addEventListener("change", () => {
      saved[box.value] = box.checked;
      localStorage.setItem(key, JSON.stringify(saved));
      renderProgress();
    });
  });

  function renderProgress() {
    const done = boxes.filter((box) => box.checked).length;
    const total = boxes.length || 1;
    const pct = Math.round((done / total) * 100);

    if (progressLabel) {
      progressLabel.textContent = `${done}/${total} concluido (${pct}%)`;
    }

    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }
  }

  renderProgress();
});

const resetButton = document.querySelector("[data-reset-checklist]");

if (resetButton) {
  resetButton.addEventListener("click", () => {
    const pageKey = resetButton.dataset.resetChecklist;

    if (!pageKey) {
      return;
    }

    localStorage.removeItem(`estudo:${pageKey}`);
    window.location.reload();
  });
}

root.style.setProperty("--loaded", "1");
