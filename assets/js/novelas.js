(function () {
  "use strict";

  const CDN_IMG = "https://img.kasniaproject.com";
  const SKELETON_COUNT = 8;

  const state = {
    allNovels: [],
    filteredNovels: [],
    selectedGenres: new Set(),
    selectedStatus: new Set(),
    selectedDemography: new Set(),
    sortBy: "nameAsc",
    searchQuery: "",
    isLoading: true,
  };

  const elements = {};
  let searchTimeout;

  /**
   * Escape básico para prevenir inyecciones accidentales en templates
   */
  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Inicialización del catálogo
   */
  function init() {
    cacheDOMElements();
    renderSkeletons();
    setupEventListeners();
    fetchNovels();
  }

  /**
   * Cacheo único de nodos DOM
   */
  function cacheDOMElements() {
    elements.searchInput = document.getElementById("searchInput");
    elements.searchClearBtn = document.getElementById("searchClearBtn");
    elements.filterToggle = document.getElementById("filterToggle");
    elements.filterActiveBadge = document.getElementById("filterActiveBadge");
    elements.genreFilters = document.getElementById("genreFilters");
    elements.genreList = document.getElementById("genreList");
    elements.clearGenresBtn = document.getElementById("clearGenresBtn");
    elements.resultsCount = document.getElementById("resultsCount");
    elements.sortSelect = document.getElementById("sortSelect");
    elements.resetFiltersBtn = document.getElementById("resetFiltersBtn");
    elements.novelsGrid = document.getElementById("novelsGrid");
    elements.noResultsMessage = document.getElementById("noResultsMessage");
    elements.emptyStateResetBtn = document.getElementById("emptyStateResetBtn");
    elements.errorMessage = document.getElementById("errorMessage");
    elements.retryBtn = document.getElementById("retryBtn");
  }

  /**
   * Renderiza tarjetas esqueleto durante la carga inicial
   */
  function renderSkeletons() {
    if (!elements.novelsGrid) return;

    const fragment = document.createDocumentFragment();
    const template = document.createElement("template");

    for (let i = 0; i < SKELETON_COUNT; i++) {
      template.innerHTML = `
        <div class="novelCardSkeleton" aria-hidden="true">
          <div class="skeletonCover"></div>
          <div class="skeletonContent">
            <div class="skeletonLine skeletonLineTitle"></div>
            <div class="skeletonLine skeletonLineAuthor"></div>
            <div class="skeletonLine skeletonLineMeta"></div>
          </div>
        </div>
      `;
      fragment.appendChild(template.content.firstElementChild.cloneNode(true));
    }

    elements.novelsGrid.innerHTML = "";
    elements.novelsGrid.appendChild(fragment);
    elements.novelsGrid.style.display = "grid";
    elements.novelsGrid.setAttribute("aria-busy", "true");
  }

  /**
   * Carga asíncrona del archivo JSON del catálogo
   */
  async function fetchNovels() {
    state.isLoading = true;
    if (elements.errorMessage) elements.errorMessage.style.display = "none";
    if (elements.noResultsMessage) elements.noResultsMessage.style.display = "none";
    if (elements.novelsGrid) elements.novelsGrid.style.display = "grid";
    if (elements.resultsCount) elements.resultsCount.textContent = "Cargando novelas...";

    try {
      const response = await fetch("/novelas/novelas.json");
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      state.allNovels = await response.json();
      state.filteredNovels = state.allNovels.slice();
      state.isLoading = false;

      if (elements.novelsGrid) {
        elements.novelsGrid.setAttribute("aria-busy", "false");
      }

      renderGenreFilters();
      applyFilters();
    } catch (error) {
      console.error("Error al cargar novelas:", error);
      state.isLoading = false;
      showErrorState();
    }
  }

  /**
   * Manejo visual del estado de error de conexión
   */
  function showErrorState() {
    if (elements.novelsGrid) elements.novelsGrid.style.display = "none";
    if (elements.noResultsMessage) elements.noResultsMessage.style.display = "none";
    if (elements.errorMessage) elements.errorMessage.style.display = "flex";
    if (elements.resultsCount) elements.resultsCount.textContent = "Error al cargar";
  }

  /**
   * Registro centralizado de listeners
   */
  function setupEventListeners() {
    // Búsqueda con debounce de 300ms
    elements.searchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      toggleSearchClearBtn(val.length > 0);

      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.searchQuery = val.trim().toLowerCase();
        applyFilters();
      }, 300);
    });

    // Botón para limpiar búsqueda rápida
    elements.searchClearBtn.addEventListener("click", () => {
      elements.searchInput.value = "";
      toggleSearchClearBtn(false);
      state.searchQuery = "";
      elements.searchInput.focus();
      applyFilters();
    });

    // Toggle de apertura/cierre de filtros
    elements.filterToggle.addEventListener("click", () => {
      const isExpanded = elements.filterToggle.getAttribute("aria-expanded") === "true";
      const nextState = !isExpanded;
      elements.filterToggle.setAttribute("aria-expanded", String(nextState));
      elements.genreFilters.classList.toggle("is-open", nextState);
    });

    // Limpiar filtros activos del cajón
    elements.clearGenresBtn.addEventListener("click", () => {
      clearDrawerFilters();
      applyFilters();
    });

    // Botones globales de restablecimiento
    elements.resetFiltersBtn.addEventListener("click", resetAllFilters);
    elements.emptyStateResetBtn.addEventListener("click", resetAllFilters);

    // Reintentar carga en error
    elements.retryBtn.addEventListener("click", () => {
      renderSkeletons();
      fetchNovels();
    });

    // Cambio en el selector de ordenación
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener("change", (e) => {
        state.sortBy = e.target.value;
        applyFilters();
      });
    }

    // Delegación de eventos para filtros en el panel desplegable
    if (elements.genreFilters) {
      elements.genreFilters.addEventListener("click", (e) => {
        const btn = e.target.closest(".genreTag, .filterChip");
        if (!btn) return;

        if (btn.dataset.status) {
          const status = btn.dataset.status;
          const isActive = state.selectedStatus.has(status);
          if (isActive) {
            state.selectedStatus.delete(status);
            btn.classList.remove("active");
            btn.setAttribute("aria-checked", "false");
          } else {
            state.selectedStatus.add(status);
            btn.classList.add("active");
            btn.setAttribute("aria-checked", "true");
          }
          updateGenrePanelHeader();
          applyFilters();
          return;
        }

        if (btn.dataset.demography) {
          const demography = btn.dataset.demography;
          const isActive = state.selectedDemography.has(demography);
          if (isActive) {
            state.selectedDemography.delete(demography);
            btn.classList.remove("active");
            btn.setAttribute("aria-checked", "false");
          } else {
            state.selectedDemography.add(demography);
            btn.classList.add("active");
            btn.setAttribute("aria-checked", "true");
          }
          updateGenrePanelHeader();
          applyFilters();
          return;
        }

        if (btn.dataset.genre) {
          const genre = btn.dataset.genre;
          const isActive = state.selectedGenres.has(genre);
          if (isActive) {
            state.selectedGenres.delete(genre);
            btn.classList.remove("active");
            btn.setAttribute("aria-checked", "false");
          } else {
            state.selectedGenres.add(genre);
            btn.classList.add("active");
            btn.setAttribute("aria-checked", "true");
          }
          updateGenrePanelHeader();
          applyFilters();
        }
      });
    }
  }

  /**
   * Alterna la visibilidad del botón de limpiar texto en el buscador
   */
  function toggleSearchClearBtn(visible) {
    if (elements.searchClearBtn) {
      elements.searchClearBtn.style.display = visible ? "inline-flex" : "none";
    }
  }

  /**
   * Construye los chips de géneros dinámicamente a partir del JSON
   */
  function renderGenreFilters() {
    const allGenres = new Set();
    for (const novel of state.allNovels) {
      if (Array.isArray(novel.genres)) {
        for (const genre of novel.genres) {
          allGenres.add(genre);
        }
      }
    }

    const sortedGenres = [...allGenres].sort((a, b) => a.localeCompare(b, "es"));
    elements.genreList.innerHTML = sortedGenres
      .map(
        (g) =>
          `<button type="button" class="genreTag filterChip" data-genre="${escapeHTML(
            g
          )}" role="checkbox" aria-checked="false">${escapeHTML(g)}</button>`
      )
      .join("");

    updateGenrePanelHeader();
  }

  /**
   * Actualiza el encabezado del panel de filtros (link "Limpiar selección")
   */
  function updateGenrePanelHeader() {
    const totalActive =
      state.selectedGenres.size + state.selectedStatus.size + state.selectedDemography.size;
    if (elements.clearGenresBtn) {
      elements.clearGenresBtn.style.display = totalActive > 0 ? "inline-block" : "none";
    }
  }

  /**
   * Limpia todos los filtros del panel desplegable (estado, demografía y géneros)
   */
  function clearDrawerFilters() {
    state.selectedGenres.clear();
    state.selectedStatus.clear();
    state.selectedDemography.clear();

    if (elements.genreFilters) {
      const activeChips = elements.genreFilters.querySelectorAll(
        ".genreTag.active, .filterChip.active"
      );
      activeChips.forEach((chip) => {
        chip.classList.remove("active");
        chip.setAttribute("aria-checked", "false");
      });
    }

    updateGenrePanelHeader();
  }

  /**
   * Restablece completamente los filtros (búsqueda, cajón de filtros y ordenación)
   */
  function resetAllFilters() {
    elements.searchInput.value = "";
    toggleSearchClearBtn(false);
    state.searchQuery = "";
    state.sortBy = "nameAsc";
    if (elements.sortSelect) {
      elements.sortSelect.value = "nameAsc";
    }
    clearDrawerFilters();
    applyFilters();
  }

  /**
   * Ordena un listado de novelas según el criterio seleccionado
   */
  function sortNovels(list) {
    const sortBy = state.sortBy;
    return list.slice().sort((a, b) => {
      if (sortBy === "nameAsc") {
        const nameA = a.novelTitle || a.nameEn || a.nameJp || "";
        const nameB = b.novelTitle || b.nameEn || b.nameJp || "";
        return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
      }
      if (sortBy === "nameDesc") {
        const nameA = a.novelTitle || a.nameEn || a.nameJp || "";
        const nameB = b.novelTitle || b.nameEn || b.nameJp || "";
        return nameB.localeCompare(nameA, "es", { sensitivity: "base" });
      }
      if (sortBy === "popular") {
        const popA = typeof a.popularityScore === "number" ? a.popularityScore : 0;
        const popB = typeof b.popularityScore === "number" ? b.popularityScore : 0;
        if (popB !== popA) return popB - popA;
        const volsA = Number(a.volumesReleased) || 0;
        const volsB = Number(b.volumesReleased) || 0;
        if (volsB !== volsA) return volsB - volsA;
        const nameA = a.novelTitle || a.nameEn || a.nameJp || "";
        const nameB = b.novelTitle || b.nameEn || b.nameJp || "";
        return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
      }
      if (sortBy === "recent") {
        const dateA = Number(a.latestDate) || 0;
        const dateB = Number(b.latestDate) || 0;
        if (dateB !== dateA) return dateB - dateA;
        const nameA = a.novelTitle || a.nameEn || a.nameJp || "";
        const nameB = b.novelTitle || b.nameEn || b.nameJp || "";
        return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
      }
      if (sortBy === "volumes") {
        const volsA = Number(a.volumesReleased) || 0;
        const volsB = Number(b.volumesReleased) || 0;
        if (volsB !== volsA) return volsB - volsA;
        const nameA = a.novelTitle || a.nameEn || a.nameJp || "";
        const nameB = b.novelTitle || b.nameEn || b.nameJp || "";
        return nameA.localeCompare(nameB, "es", { sensitivity: "base" });
      }
      return 0;
    });
  }

  /**
   * Aplica los filtros activos y la ordenación al listado de novelas
   */
  function applyFilters() {
    const query = state.searchQuery;
    const genres = state.selectedGenres;
    const status = state.selectedStatus;
    const demography = state.selectedDemography;
    const hasGenreFilter = genres.size > 0;
    const hasStatusFilter = status.size > 0;
    const hasDemographyFilter = demography.size > 0;

    const filtered = state.allNovels.filter((novel) => {
      // Filtrado por búsqueda de texto
      if (query) {
        const titleJp = (novel.nameJp || "").toLowerCase();
        const titleEn = (novel.nameEn || "").toLowerCase();
        const titleEs = (novel.nameEs || "").toLowerCase();
        const novelTitle = (novel.novelTitle || "").toLowerCase();

        const match =
          titleJp.includes(query) ||
          titleEn.includes(query) ||
          titleEs.includes(query) ||
          novelTitle.includes(query);

        if (!match) return false;
      }

      // Filtrado por estado del proyecto (OR entre los seleccionados)
      if (hasStatusFilter) {
        if (!status.has(novel.status)) return false;
      }

      // Filtrado por demografía (OR entre las seleccionadas)
      if (hasDemographyFilter) {
        const novelDemo = novel.demography || "";
        let matchesDemo = false;
        for (const d of demography) {
          if (novelDemo.includes(d)) {
            matchesDemo = true;
            break;
          }
        }
        if (!matchesDemo) return false;
      }

      // Filtrado por géneros (coincidencia de todos los seleccionados - AND)
      if (hasGenreFilter) {
        if (!Array.isArray(novel.genres)) return false;
        for (const g of genres) {
          if (!novel.genres.includes(g)) return false;
        }
      }

      return true;
    });

    state.filteredNovels = sortNovels(filtered);
    updateMetaBar();

    // Renderizar con View Transitions API si está soportada y no hay movimiento reducido
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if ("startViewTransition" in document && !prefersReducedMotion) {
      try {
        const transition = document.startViewTransition(() => {
          renderNovels();
        });
        transition.finished.catch(() => {});
      } catch (err) {
        renderNovels();
      }
    } else {
      renderNovels();
    }
  }

  /**
   * Actualiza el contador dinámico, el botón de restablecer y el badge de filtros
   */
  function updateMetaBar() {
    const total = state.allNovels.length;
    const count = state.filteredNovels.length;
    const activeFiltersCount =
      state.selectedGenres.size + state.selectedStatus.size + state.selectedDemography.size;
    const isFiltered = state.searchQuery.length > 0 || activeFiltersCount > 0;
    const hasActiveFilters = isFiltered || state.sortBy !== "nameAsc";

    // Actualizar texto del contador dinámico (el número total no se ve afectado al cambiar de orden)
    if (elements.resultsCount) {
      if (!isFiltered) {
        elements.resultsCount.textContent = `Mostrando las ${total} novelas`;
      } else if (count === 0) {
        elements.resultsCount.textContent = "0 novelas encontradas";
      } else if (count === 1) {
        elements.resultsCount.textContent = "1 novela encontrada";
      } else {
        elements.resultsCount.textContent = `${count} de ${total} novelas encontradas`;
      }
    }

    // Botón de restablecer (ubicado a la izquierda del selector para no desplazarlo)
    if (elements.resetFiltersBtn) {
      elements.resetFiltersBtn.style.display = hasActiveFilters ? "inline-flex" : "none";
    }

    // Badge numérico en el botón de toggle de filtros
    if (elements.filterActiveBadge) {
      if (activeFiltersCount > 0) {
        elements.filterActiveBadge.textContent = String(activeFiltersCount);
        elements.filterActiveBadge.style.display = "inline-flex";
      } else {
        elements.filterActiveBadge.style.display = "none";
      }
    }
  }

  /**
   * Renderiza las tarjetas del grid
   */
  function renderNovels() {
    if (!elements.novelsGrid || !elements.noResultsMessage) return;

    if (state.filteredNovels.length === 0) {
      elements.novelsGrid.style.display = "none";
      elements.noResultsMessage.style.display = "flex";
      return;
    }

    elements.novelsGrid.style.display = "grid";
    elements.noResultsMessage.style.display = "none";

    // Calcular tamaño real de columna para el atributo sizes de <picture> (máx 4 columnas)
    const gridWidth = elements.novelsGrid.getBoundingClientRect().width || 1080;
    const gap = 24; // var(--spaceLg) = 24px
    let cols = 4;
    if (window.innerWidth <= 640) {
      cols = 2;
    } else if (window.innerWidth <= 920) {
      cols = 3;
    }
    const colWidth = Math.round((gridWidth - gap * (cols - 1)) / cols);
    const coverSizes = `${Math.max(colWidth, 140)}px`;

    // Render con DocumentFragment para óptimo rendimiento sin reflows
    const fragment = document.createDocumentFragment();
    const template = document.createElement("template");

    for (const novel of state.filteredNovels) {
      const title = escapeHTML(novel.novelTitle || novel.nameEn || novel.nameJp);
      const author = escapeHTML(novel.author || "Autor por confirmar");
      const vols = Number(novel.volumesReleased) || 0;
      const volsLabel = vols === 1 ? "1 volumen" : `${vols} volúmenes`;
      const novelId = escapeHTML(novel.novelId);
      const link = escapeHTML(novel.link);

      template.innerHTML = `
        <article class="novelCardWrapper">
          <a
            href="/novelas/${link}"
            class="novelCard"
            style="view-transition-name: n${novelId}"
            aria-label="${title}, por ${author}"
          >
            <div class="novelCoverContainer">
              <picture>
                <source
                  srcset="${CDN_IMG}/cover/avif/${novelId}-400.avif 400w, ${CDN_IMG}/cover/avif/${novelId}-700.avif 700w, ${CDN_IMG}/cover/avif/${novelId}-900.avif 900w"
                  sizes="${coverSizes}"
                  type="image/avif"
                />
                <source
                  srcset="${CDN_IMG}/cover/jpg/${novelId}-400.jpg 400w, ${CDN_IMG}/cover/jpg/${novelId}-700.jpg 700w, ${CDN_IMG}/cover/jpg/${novelId}-900.jpg 900w"
                  sizes="${coverSizes}"
                  type="image/jpeg"
                />
                <img
                  src="${CDN_IMG}/cover/jpg/${novelId}-400.jpg"
                  alt="Portada de ${title}"
                  class="novelCover"
                  loading="lazy"
                  width="240"
                  height="343"
                />
              </picture>
              <div class="coverSpine" aria-hidden="true"></div>
            </div>

            <div class="novelCardContent">
              <h2 class="novelCardTitle">${title}</h2>
              <p class="novelCardAuthor">${author}</p>
              <p class="novelCardMeta">
                <span class="novelCardVolumes">${volsLabel}</span>
              </p>
            </div>
          </a>
        </article>
      `;

      fragment.appendChild(template.content.firstElementChild.cloneNode(true));
    }

    elements.novelsGrid.innerHTML = "";
    elements.novelsGrid.appendChild(fragment);
  }

  // Ejecución segura tras DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
