(function () {
  try {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersLight = window.matchMedia(
      "(prefers-color-scheme: light)"
    ).matches;
    const activeTheme = savedTheme || (systemPrefersLight ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", activeTheme);
  } catch (_) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();

const initThemeToggle = () => {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  const html = document.documentElement;

  const applyTheme = (theme, persist = true) => {
    html.setAttribute("data-theme", theme);
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (_) {}
    }
  };

  themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    if (!document.startViewTransition) {
      applyTheme(newTheme, true);
      return;
    }

    // Supresión declarativa en CSS (.themeTransitioning) sin manipular inline styles
    html.classList.add("themeTransitioning");

    const transition = document.startViewTransition(() => {
      applyTheme(newTheme, true);
    });

    transition.finished.finally(() => {
      html.classList.remove("themeTransitioning");
    });
  });

  // Sincronización en vivo entre pestañas
  window.addEventListener("storage", (e) => {
    if (e.key === "theme" && (e.newValue === "light" || e.newValue === "dark")) {
      applyTheme(e.newValue, false);
    }
  });

  // Sincronización con el sistema si el usuario no ha fijado una preferencia explícita
  try {
    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          applyTheme(e.matches ? "light" : "dark", false);
        }
      });
  } catch (_) {}
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeToggle);
} else {
  initThemeToggle();
}
