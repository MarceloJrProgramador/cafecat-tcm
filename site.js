/* Interações compartilhadas: menu, rodapé e formulários demonstrativos. */
"use strict";
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
function closeMenu() {
  navigation.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menu");
}
menuButton.addEventListener("click", () => {
  const open = navigation.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navigation.classList.contains("open")) {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
  if (event.matches) closeMenu();
});
// O rodapé mantém 2024, ano do TCM original.

// Contato: gera um arquivo local. Não há envio nem armazenamento dos campos.
const contactForm = document.querySelector("#contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const data = new FormData(contactForm);
    const contents = [
      "Mensagem — Cafecat",
      "Nome: " + data.get("name"),
      "E-mail: " + data.get("email"),
      "Assunto: " + data.get("subject"),
      "",
      data.get("message"),
    ].join("\n");
    const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = url;
    download.download = "mensagem-cafecat.txt";
    document.body.append(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.querySelector("#contact-result").textContent =
      "Arquivo gerado. Nenhuma mensagem foi enviada.";
  });
}

// Cadastro e conta: prévia visual, sem senha nem autenticação simulada.
document.querySelectorAll(".profile-demo").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const result = form.querySelector(".profile-result");
    result.querySelector("strong").textContent =
      "Olá, " + data.get("name").trim() + "!";
    result.querySelector("p").textContent =
      "E-mail da prévia: " + data.get("email");
    result.hidden = false;
  });
});
