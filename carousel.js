/* Carrossel independente: autoplay, teclado, rolagem, zoom e acessibilidade. */
"use strict";
class CafecatCarousel {
  constructor(root, duration = 4000) {
    this.root = root;
    this.track = root.querySelector("#carousel-track");
    this.slides = [...root.querySelectorAll(".image-slide")];
    this.dots = [...root.querySelectorAll("[data-slide]")];
    this.pauseButton = root.querySelector("#slide-pause");
    this.progress = root.querySelector("#carousel-progress");
    this.dialog = document.querySelector("#image-dialog");
    this.motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.duration = duration;
    this.index = 0;
    this.paused = this.motion.matches;
    this.inView = true;
    this.timer = null;
    this.frame = null;
    this.touching = false;
    this.bindEvents();
    this.render();
    this.schedule();
  }
  left(index) {
    return this.slides[index].offsetLeft;
  }
  go(index, announce = true) {
    this.index = (index + this.slides.length) % this.slides.length;
    this.track.scrollTo({
      left: this.left(this.index),
      behavior: this.motion.matches ? "instant" : "smooth",
    });
    this.render();
    if (announce)
      this.root.querySelector("#slide-status").textContent =
        `Imagem ${this.index + 1} de ${this.slides.length}: ${this.slides[this.index].querySelector("h3").textContent}`;
    this.schedule();
  }
  render() {
    this.dots.forEach((dot, i) => {
      if (i === this.index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    this.root.querySelector("#slide-counter").textContent =
      `${String(this.index + 1).padStart(2, "0")} / ${String(this.slides.length).padStart(2, "0")}`;
  }
  schedule() {
    clearTimeout(this.timer);
    const linkFocused = Boolean(
      document.activeElement?.closest(".image-slide a"),
    );
    const blocked =
      this.paused ||
      document.hidden ||
      this.dialog.open ||
      !this.inView ||
      this.touching ||
      linkFocused;
    this.pauseButton.textContent = this.paused ? "Reproduzir" : "Pausar";
    this.pauseButton.setAttribute("aria-pressed", String(this.paused));
    this.pauseButton.setAttribute(
      "aria-label",
      this.paused ? "Iniciar troca automática" : "Pausar troca automática",
    );
    this.root.querySelector("#autoplay-status").textContent = this.paused
      ? "Reprodução pausada"
      : this.dialog.open
        ? "Imagem ampliada"
        : linkFocused
          ? "Pausa durante a leitura do link"
          : `Automático · ${this.duration / 1000} segundos`;
    // Reinicia a barra junto com o tempo de permanência da imagem.
    this.progress.style.animation = "none";
    void this.progress.offsetWidth;
    this.progress.style.animation = blocked
      ? "none"
      : `carousel-time ${this.duration}ms linear forwards`;
    if (!blocked)
      this.timer = setTimeout(
        () => this.go(this.index + 1, false),
        this.duration,
      );
  }
  expand(button) {
    const image = button.closest(".image-slide").querySelector("img");
    const enlarged = document.querySelector("#expanded-image");
    enlarged.src = image.src;
    enlarged.alt = image.alt;
    enlarged.style.width = "100%";
    document.querySelector("#image-zoom").value = "100";
    document.querySelector("#image-dialog-title").textContent = button
      .closest(".image-slide")
      .querySelector("h3").textContent;
    this.dialog.showModal();
    document.body.classList.add("image-view-open");
    this.schedule();
  }
  bindEvents() {
    this.root
      .querySelector("#slide-prev")
      .addEventListener("click", () => this.go(this.index - 1));
    this.root
      .querySelector("#slide-next")
      .addEventListener("click", () => this.go(this.index + 1));
    this.dots.forEach((dot) =>
      dot.addEventListener("click", () => this.go(Number(dot.dataset.slide))),
    );
    this.pauseButton.addEventListener("click", () => {
      this.paused = !this.paused;
      this.schedule();
    });
    this.track.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => {
          this.index = this.slides.reduce(
            (nearest, slide, i) =>
              Math.abs(slide.offsetLeft - this.track.scrollLeft) <
              Math.abs(this.left(nearest) - this.track.scrollLeft)
                ? i
                : nearest,
            0,
          );
          this.render();
        });
      },
      { passive: true },
    );
    this.track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        this.go(this.index + (event.key === "ArrowRight" ? 1 : -1));
      }
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        this.go(event.key === "Home" ? 0 : this.slides.length - 1);
      }
    });
    this.root.addEventListener("focusin", () => this.schedule());
    this.root.addEventListener("focusout", () =>
      requestAnimationFrame(() => this.schedule()),
    );
    document.addEventListener("visibilitychange", () => this.schedule());
    this.motion.addEventListener("change", (event) => {
      if (event.matches) this.paused = true;
      this.schedule();
    });
    this.track.addEventListener(
      "touchstart",
      () => {
        this.touching = true;
        this.schedule();
      },
      { passive: true },
    );
    ["touchend", "touchcancel"].forEach((type) =>
      this.track.addEventListener(
        type,
        () => {
          this.touching = false;
          this.schedule();
        },
        { passive: true },
      ),
    );
    new ResizeObserver(() =>
      this.track.scrollTo({ left: this.left(this.index), behavior: "instant" }),
    ).observe(this.track);
    new IntersectionObserver(
      (entries) => {
        this.inView = entries[0].isIntersecting;
        this.schedule();
      },
      { threshold: 0.1 },
    ).observe(this.root);
    this.root
      .querySelectorAll(".image-expand")
      .forEach((button) =>
        button.addEventListener("click", () => this.expand(button)),
      );
    document
      .querySelector("#image-close")
      .addEventListener("click", () => this.dialog.close());
    this.dialog.addEventListener("close", () => {
      document.body.classList.remove("image-view-open");
      this.schedule();
    });
    this.dialog.addEventListener("click", (event) => {
      if (event.target !== this.dialog) return;
      const rect = this.dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        this.dialog.close();
    });
    document
      .querySelector("#image-zoom")
      .addEventListener("change", (event) => {
        document.querySelector("#expanded-image").style.width =
          event.target.value + "%";
      });
  }
}
const cafecatCarousel = new CafecatCarousel(
  document.querySelector("#hero-carousel"),
);
