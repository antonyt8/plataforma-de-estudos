const searchEl = document.querySelector("[data-search-subject]");
const links = [...document.querySelectorAll("[data-subject-link]")];
const countEl = document.querySelector("[data-count]");
const sidebar = document.querySelector("[data-sidebar]");
const toggleBtn = document.querySelector("[data-mobile-toggle]");

function updateCount() {
  if (!countEl) return;
  const visible = links.filter((item) => !item.classList.contains("hidden")).length;
  countEl.textContent = `Materias (${visible})`;
}

if (searchEl) {
  searchEl.addEventListener("input", (event) => {
    const q = event.target.value.trim().toLowerCase();

    links.forEach((link) => {
      const text = link.textContent.toLowerCase();
      link.classList.toggle("hidden", !text.includes(q));
    });

    updateCount();
  });
}

if (toggleBtn && sidebar) {
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

updateCount();
