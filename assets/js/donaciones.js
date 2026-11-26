/**
 * donaciones.js - Interactividad del Historial de Movimientos
 * Kasnia Project - 100% Vanilla JS ES6+ (camelCase)
 */

document.addEventListener('DOMContentLoaded', () => {
  const INITIAL_VISIBLE_COUNT = 5;

  const filterButtons = document.querySelectorAll('.historyFilterBtn');
  const historyItems = Array.from(document.querySelectorAll('.historyItem'));
  const toggleWrapper = document.getElementById('historyToggleWrapper');
  const toggleBtn = document.getElementById('historyToggleBtn');
  const toggleText = toggleBtn ? toggleBtn.querySelector('.toggleBtnText') : null;
  const historyList = document.querySelector('.historyList');

  if (!historyItems.length || !toggleBtn || !toggleWrapper) {
    return;
  }

  let currentFilter = 'all';
  let isExpanded = false;

  /**
   * Actualiza la visibilidad de los movimientos y el estado del botón desplegable
   */
  const updateMovementsView = (shouldScrollToTop = false) => {
    const applyChanges = () => {
      // 1. Filtrar los movimientos según el filtro actual
      const matchingItems = historyItems.filter((item) => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'income') return item.classList.contains('isIncome');
        if (currentFilter === 'expense') return item.classList.contains('isExpense');
        return true;
      });

      // 2. Ocultar los que no coinciden con el filtro
      historyItems.forEach((item) => {
        if (!matchingItems.includes(item)) {
          item.style.display = 'none';
          item.hidden = true;
          item.classList.remove('isRevealed');
        }
      });

      // 3. Aplicar límite de colapso a los elementos que coinciden
      matchingItems.forEach((item, index) => {
        const isVisible = isExpanded || index < INITIAL_VISIBLE_COUNT;
        item.style.display = isVisible ? 'flex' : 'none';
        item.hidden = !isVisible;
        // Añadir clase de microanimación si se acaba de desplegar
        if (isExpanded && index >= INITIAL_VISIBLE_COUNT) {
          item.classList.add('isRevealed');
        } else if (!isVisible) {
          item.classList.remove('isRevealed');
        }
      });

      // 4. Actualizar el botón de desplegar / replegar
      const totalMatching = matchingItems.length;
      const remainingCount = totalMatching - INITIAL_VISIBLE_COUNT;

      if (totalMatching <= INITIAL_VISIBLE_COUNT) {
        toggleWrapper.style.display = 'none';
        toggleWrapper.hidden = true;
      } else {
        toggleWrapper.style.display = 'flex';
        toggleWrapper.hidden = false;

        if (isExpanded) {
          if (toggleText) toggleText.textContent = 'Mostrar menos';
          toggleBtn.setAttribute('aria-expanded', 'true');
          toggleBtn.classList.add('isExpanded');
        } else {
          if (toggleText) {
            toggleText.textContent = `Ver todos los movimientos (${remainingCount} más)`;
          }
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.classList.remove('isExpanded');

          // Si se repliega y el usuario estaba abajo, restaurar scroll suave a la sección
          if (shouldScrollToTop) {
            const historySection = document.querySelector('.historySection');
            if (historySection) {
              const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
              historySection.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
            }
          }
        }
      }
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (document.startViewTransition && !prefersReducedMotion) {
      document.startViewTransition(() => {
        applyChanges();
      });
    } else {
      applyChanges();
    }
  };

  // Event Listener para el botón Desplegar / Replegar
  toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    updateMovementsView(!isExpanded);
  });

  // Función para seleccionar un filtro en el Segmented Control
  const selectFilter = (targetBtn) => {
    const selectedFilter = targetBtn.dataset.filter;
    if (selectedFilter === currentFilter) return;

    filterButtons.forEach((otherBtn) => {
      otherBtn.classList.remove('isActive');
      otherBtn.setAttribute('aria-selected', 'false');
      otherBtn.setAttribute('tabindex', '-1');
    });

    targetBtn.classList.add('isActive');
    targetBtn.setAttribute('aria-selected', 'true');
    targetBtn.setAttribute('tabindex', '0');
    targetBtn.focus();

    currentFilter = selectedFilter;
    // Al cambiar de filtro, se resetea a vista compacta para mantener orden
    isExpanded = false;
    updateMovementsView(false);
  };

  // Event Listeners para clicks y navegación por teclado (WAI-ARIA Tablist Pattern)
  const filterButtonsArr = Array.from(filterButtons);

  filterButtonsArr.forEach((btn, index) => {
    btn.addEventListener('click', () => selectFilter(btn));

    btn.addEventListener('keydown', (e) => {
      let targetIndex = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        targetIndex = (index + 1) % filterButtonsArr.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        targetIndex = (index - 1 + filterButtonsArr.length) % filterButtonsArr.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIndex = filterButtonsArr.length - 1;
      }

      if (targetIndex !== null) {
        selectFilter(filterButtonsArr[targetIndex]);
      }
    });
  });

  // Inicialización inmediata
  updateMovementsView(false);
});
