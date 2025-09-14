document.addEventListener("DOMContentLoaded", () => {
  const dropdownToggle = document.querySelector(".dropdown-toggle");

  dropdownToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const isExpanded = dropdownToggle.getAttribute("aria-expanded") === "true";
    dropdownToggle.setAttribute("aria-expanded", !isExpanded);
  });

  // Cerrar el dropdown al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      dropdownToggle.setAttribute("aria-expanded", "false");
    }
  });
});
