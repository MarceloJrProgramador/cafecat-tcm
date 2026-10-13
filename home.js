/* Página inicial Cafecat. JavaScript puro, sem bibliotecas externas. */
"use strict";
const cards = [...document.querySelectorAll(".card")];
const search = document.querySelector("#search");
const filters = [...document.querySelectorAll("[data-filter]")];
const key = "cafecat-home-favorites-v1";
let favorites = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(key) || "[]");
  if (Array.isArray(saved))
    favorites = new Set(
      saved.filter((id) => cards.some((card) => card.dataset.id === id)),
    );
} catch {
  /* Funciona também sem armazenamento local. */
}
let currentFilter = "all";
const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
function render() {
  const words = normalize(search.value).split(/\s+/).filter(Boolean);
  let visible = 0;
  cards.forEach((card) => {
    const favorite = favorites.has(card.dataset.id);
    const button = card.querySelector(".favorite");
    button.setAttribute("aria-pressed", String(favorite));
    button.textContent = favorite ? "♥" : "♡";
    const title = card.querySelector(".category").textContent;
    button.setAttribute(
      "aria-label",
      `${favorite ? "Remover dos favoritos:" : "Favoritar"} ${title}`,
    );
    const match =
      (currentFilter === "all" ||
        (currentFilter === "favorites"
          ? favorite
          : currentFilter === card.dataset.category)) &&
      words.every((word) => normalize(card.dataset.search).includes(word));
    card.hidden = !match;
    if (match) visible++;
  });
  document.querySelector("#favorite-count").textContent = favorites.size;
  document.querySelector("#empty").hidden = visible !== 0;
  document.querySelector("#search-status").textContent =
    `${visible} ${visible === 1 ? "categoria encontrada" : "categorias encontradas"}.`;
  filters.forEach((button) => {
    const selected = button.dataset.filter === currentFilter;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}
let toastTimer;
function notify(message) {
  const toast = document.querySelector("#toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
cards.forEach((card) =>
  card.querySelector(".favorite").addEventListener("click", () => {
    const id = card.dataset.id;
    const removing = favorites.has(id);
    if (removing) favorites.delete(id);
    else favorites.add(id);
    let stored = true;
    try {
      localStorage.setItem(key, JSON.stringify([...favorites]));
    } catch {
      stored = false;
    }
    render();
    notify(
      removing
        ? "Categoria removida dos favoritos."
        : stored
          ? "Categoria salva nos favoritos."
          : "Favorito adicionado somente nesta sessão.",
    );
  }),
);
filters.forEach((button) =>
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  }),
);
search.addEventListener("input", render);
document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});
document.querySelector("#reset-search").addEventListener("click", () => {
  search.value = "";
  currentFilter = "all";
  render();
  search.focus();
});
render();
