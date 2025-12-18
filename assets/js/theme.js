(function () {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  if (!themeToggle) return;

  const html = document.documentElement;

  themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    const updateTheme = () => {
      html.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    };

    if (!document.startViewTransition) {
      updateTheme();
      return;
    }

    // Guardar y remover temporalmente view-transition-name de las portadas
    const elementsWithTransition = document.querySelectorAll(
      '[style*="view-transition-name"]'
    );
    const savedStyles = [];

    elementsWithTransition.forEach((el, i) => {
      savedStyles[i] = el.getAttribute("style");
      const newStyle = el.style.cssText
        .replace(/view-transition-name:\s*[^;]+;?/gi, "")
        .trim();
      newStyle
        ? el.setAttribute("style", newStyle)
        : el.removeAttribute("style");
    });

    document.startViewTransition(updateTheme).finished.finally(() => {
      elementsWithTransition.forEach((el, i) => {
        if (savedStyles[i]) el.setAttribute("style", savedStyles[i]);
      });
    });
  });
});
