const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

if (menuToggle && mobileMenu) {
  const toggleMenu = (forceClose = false) => {
    const isActive = !forceClose && !mobileMenu.classList.contains("active");
    mobileMenu.classList.toggle("active", isActive);
    menuToggle.classList.toggle("active", isActive);
    document.body.classList.toggle("menuOpen", isActive);
  };

  menuToggle.addEventListener("click", () => toggleMenu());

  // Cerrar al hacer click en un enlace del menú
  document.querySelector(".mobileMenuLinks")?.addEventListener("click", (e) => {
    if (e.target.tagName === "A") toggleMenu(true);
  });

  // Cerrar al hacer click fuera del menú
  mobileMenu.addEventListener("click", (e) => {
    if (e.target === mobileMenu) toggleMenu(true);
  });
}

// Botón Volver Arriba con throttle
const backToTopBtn = document.getElementById("backToTop");

if (backToTopBtn) {
  let ticking = false;
  let lastScrollY = 0;

  const updateBackToTop = () => {
    backToTopBtn.classList.toggle("visible", lastScrollY > 300);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      lastScrollY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(updateBackToTop);
        ticking = true;
      }
    },
    { passive: true }
  );

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
