document.addEventListener("DOMContentLoaded", () => {
  const navButtons = document.querySelectorAll(".nav-button");
  const container2 = document.querySelector(".container-2");
  let currentActiveSectionId = "descargas";
  let isInitialLoad = true;

  // Cache de elementos que se usan frecuentemente
  const sections = {
    descargas: document.getElementById("descargas"),
    informacion: document.getElementById("informacion")
  };

  // Función optimizada para scroll suave
  const smoothScrollToSection = () => {
    if (!container2) return;
    
    const offsetTop = container2.offsetTop - 20;
    const currentScroll = window.pageYOffset;
    const distance = offsetTop - currentScroll;

    if (distance < -50) {
      const duration = 300;
      const startTime = performance.now();

      const scrollAnimation = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : -1 + (4 - 2 * progress) * progress;
        
        window.scrollTo(0, currentScroll + distance * easeProgress);
        
        if (progress < 1) {
          requestAnimationFrame(scrollAnimation);
        }
      };

      requestAnimationFrame(scrollAnimation);
    }
  };

  // Función para cambiar de sección optimizada
  const switchSection = (targetSectionId) => {
    if (targetSectionId === currentActiveSectionId) return;

    const targetSection = sections[targetSectionId];
    const currentActiveSection = sections[currentActiveSectionId];

    // Actualizar botones activos
    navButtons.forEach(btn => 
      btn.classList.toggle("active", btn.dataset.target === targetSectionId)
    );

    if (!isInitialLoad) {
      smoothScrollToSection();

      if (currentActiveSection) {
        currentActiveSection.classList.remove("section-active");
      }

      setTimeout(() => {
        if (currentActiveSection) {
          currentActiveSection.style.display = "none";
        }
        
        targetSection.style.display = "block";
        targetSection.offsetHeight; // Forzar reflow
        targetSection.classList.add("section-active");

        setTimeout(() => {
          if (container2) {
            const targetPosition = container2.offsetTop - 20;
            if (Math.abs(window.pageYOffset - targetPosition) > 10) {
              window.scrollTo({ top: targetPosition, behavior: "smooth" });
            }
          }
        }, 50);
      }, 200);
    } else {
      if (currentActiveSection) currentActiveSection.style.display = "none";
      targetSection.style.display = "block";
      targetSection.classList.add("section-active", "initial-load");
    }

    currentActiveSectionId = targetSectionId;
  };

  // Inicialización optimizada
  const init = () => {
    const initialSection = sections[currentActiveSectionId];
    initialSection.style.display = "block";
    initialSection.classList.add("section-active", "initial-load");

    document.querySelector(`.nav-button[data-target="${currentActiveSectionId}"]`)
      .classList.add("active");

    setTimeout(() => {
      initialSection.classList.remove("initial-load");
      isInitialLoad = false;
    }, 100);
  };

  // Event listeners optimizados
  navButtons.forEach(button => {
    button.addEventListener("click", () => switchSection(button.dataset.target));
  });

  init();
});