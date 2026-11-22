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
        item.classList.remove('isRevealed');
      }
    });

    // 3. Aplicar límite de colapso a los elementos que coinciden
    matchingItems.forEach((item, index) => {
      if (isExpanded || index < INITIAL_VISIBLE_COUNT) {
        item.style.display = 'flex';
        // Añadir clase de microanimación si se acaba de desplegar
        if (isExpanded && index >= INITIAL_VISIBLE_COUNT) {
          item.classList.add('isRevealed');
        }
      } else {
        item.style.display = 'none';
        item.classList.remove('isRevealed');
      }
    });

    // 4. Actualizar el botón de desplegar / replegar
    const totalMatching = matchingItems.length;
    const remainingCount = totalMatching - INITIAL_VISIBLE_COUNT;

    if (totalMatching <= INITIAL_VISIBLE_COUNT) {
      toggleWrapper.style.display = 'none';
    } else {
      toggleWrapper.style.display = 'flex';

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
            historySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    }
  };

  // Event Listener para el botón Desplegar / Replegar
  toggleBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    updateMovementsView(!isExpanded);
  });

  // Event Listeners para los botones del Segmented Control
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedFilter = btn.dataset.filter;
      if (selectedFilter === currentFilter) return;

      // Actualizar estado visual de los botones de filtro
      filterButtons.forEach((otherBtn) => {
        otherBtn.classList.remove('isActive');
        otherBtn.setAttribute('aria-selected', 'false');
      });

      btn.classList.add('isActive');
      btn.setAttribute('aria-selected', 'true');

      currentFilter = selectedFilter;
      // Al cambiar de filtro, se resetea a vista compacta para mantener orden
      isExpanded = false;
      updateMovementsView(false);
    });
  });

  // Inicialización inmediata
  updateMovementsView(false);
});
