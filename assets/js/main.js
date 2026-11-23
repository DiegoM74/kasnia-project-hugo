const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

if (menuToggle && mobileMenu) {
  // Asegurar que el menú cerrado no reciba foco por teclado
  mobileMenu.setAttribute("inert", "");

  const toggleMenu = (forceClose = false) => {
    const isActive = !forceClose && !mobileMenu.classList.contains("active");
    mobileMenu.classList.toggle("active", isActive);
    menuToggle.classList.toggle("active", isActive);
    menuToggle.setAttribute("aria-expanded", String(isActive));
    document.body.classList.toggle("menuOpen", isActive);

    if (isActive) {
      mobileMenu.removeAttribute("inert");
      const firstLink = mobileMenu.querySelector("a");
      if (firstLink) firstLink.focus();
    } else {
      mobileMenu.setAttribute("inert", "");
      menuToggle.focus();
    }
  };

  menuToggle.addEventListener("click", () => toggleMenu());

  // Cerrar al hacer clic en un enlace del menú
  document.querySelector(".mobileMenuLinks")?.addEventListener("click", (e) => {
    if (e.target.tagName === "A") toggleMenu(true);
  });

  // Cerrar al hacer clic fuera del contenido del menú
  mobileMenu.addEventListener("click", (e) => {
    if (e.target === mobileMenu) toggleMenu(true);
  });

  // Cerrar al presionar la tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("active")) {
      toggleMenu(true);
    }
  });
}

// Botón Volver Arriba
const backToTopBtn = document.getElementById("backToTop");

if (backToTopBtn) {
  let ticking = false;

  const updateBackToTop = () => {
    backToTopBtn.classList.toggle("visible", window.scrollY > 300);
    ticking = false;
  };

  // Comprobación inicial al cargar (por si la página se recarga con scroll)
  updateBackToTop();

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateBackToTop);
        ticking = true;
      }
    },
    { passive: true }
  );

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.focus({ preventScroll: true });
    }
  });
}
