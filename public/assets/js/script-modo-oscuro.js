(function () {
  // Espera a que el body esté disponible y aplica el modo oscuro si hace falta
  if (localStorage.getItem("theme") === "dark") {
    // Esperar hasta que el <body> exista
    const observer = new MutationObserver(() => {
      if (document.body) {
        document.body.classList.add("dark-mode");
        observer.disconnect(); // dejar de observar
      }
    });

    observer.observe(document.documentElement, { childList: true });
  }

  // Una vez que el DOM está listo, configuramos el botón
  window.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggle-theme");
    if (!toggleBtn) return;

    const isDark = document.body.classList.contains("dark-mode");
    toggleBtn.textContent = isDark ? "🌞" : "🌙";

    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const nowDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("theme", nowDark ? "dark" : "light");
      toggleBtn.textContent = nowDark ? "🌞" : "🌙";
    });
  });
})();
