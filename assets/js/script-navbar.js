document.addEventListener("DOMContentLoaded", () => {
  const dropdownToggle = document.querySelector(".dropdown-toggle");
  const subheaders = document.querySelectorAll(".dropdown-subheader");

  // Toggle del menú principal
  dropdownToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const isExpanded = dropdownToggle.getAttribute("aria-expanded") === "true";
    dropdownToggle.setAttribute("aria-expanded", !isExpanded);

    // Cerrar todos los submenús cuando se cierra el menú principal
    if (isExpanded) {
      subheaders.forEach((header) => {
        header.classList.remove("active");
        const submenuId = header.getAttribute("data-submenu");
        const submenu = document.getElementById(`submenu-${submenuId}`);
        if (submenu) {
          submenu.classList.remove("active");
        }
      });
    }
  });

  // Toggle de submenús
  subheaders.forEach((header) => {
    header.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const submenuId = header.getAttribute("data-submenu");
      const submenu = document.getElementById(`submenu-${submenuId}`);

      if (submenu) {
        const isActive = header.classList.contains("active");

        // Cerrar otros submenús
        subheaders.forEach((h) => {
          if (h !== header) {
            h.classList.remove("active");
            const otherId = h.getAttribute("data-submenu");
            const otherSubmenu = document.getElementById(`submenu-${otherId}`);
            if (otherSubmenu) {
              otherSubmenu.classList.remove("active");
            }
          }
        });

        // Toggle del submenú actual
        header.classList.toggle("active", !isActive);
        submenu.classList.toggle("active", !isActive);
      }
    });
  });

  // Cerrar el dropdown al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      dropdownToggle.setAttribute("aria-expanded", "false");

      // Cerrar todos los submenús
      subheaders.forEach((header) => {
        header.classList.remove("active");
        const submenuId = header.getAttribute("data-submenu");
        const submenu = document.getElementById(`submenu-${submenuId}`);
        if (submenu) {
          submenu.classList.remove("active");
        }
      });
    }
  });
});
