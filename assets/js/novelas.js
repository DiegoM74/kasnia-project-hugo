(function () {
  "use strict";

  const state = {
    allNovels: [],
    filteredNovels: [],
    currentPage: 1,
    itemsPerPage: 10,
    selectedGenres: new Set(),
    searchQuery: "",
  };

  const elements = {};
  let searchTimeout;

  async function init() {
    // Cachear elementos del DOM una vez
    elements.searchInput = document.getElementById("searchInput");
    elements.filterToggle = document.getElementById("filterToggle");
    elements.genreFilters = document.getElementById("genreFilters");
    elements.genreList = document.getElementById("genreList");
    elements.novelsGrid = document.getElementById("novelsGrid");
    elements.noResultsMessage = document.getElementById("noResultsMessage");
    elements.paginationBottom = document.getElementById("paginationBottom");
    elements.prevPageBottom = document.getElementById("prevPageBottom");
    elements.nextPageBottom = document.getElementById("nextPageBottom");
    elements.pageInfoBottom = document.getElementById("pageInfoBottom");

    try {
      const response = await fetch("/novelas/novelas.json");
      if (!response.ok) throw new Error("Error al cargar novelas");
      state.allNovels = await response.json();
      state.filteredNovels = state.allNovels.slice();

      setupEventListeners();
      renderGenreFilters();
      renderNovels();
      updatePaginationVisibility();
    } catch (error) {
      console.error(error);
    }
  }

  function setupEventListeners() {
    elements.searchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim().toLowerCase();
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.searchQuery = val;
        applyFilters();
      }, 300);
    });

    elements.filterToggle.addEventListener("click", () => {
      const isExpanded =
        elements.filterToggle.getAttribute("aria-expanded") === "true";
      elements.filterToggle.setAttribute("aria-expanded", !isExpanded);
      elements.genreFilters.classList.toggle("is-open");
    });

    elements.prevPageBottom.addEventListener("click", () => changePage(-1));
    elements.nextPageBottom.addEventListener("click", () => changePage(1));
  }

  function renderGenreFilters() {
    const allGenres = new Set();
    for (const novel of state.allNovels) {
      for (const genre of novel.genres) {
        allGenres.add(genre);
      }
    }

    const sortedGenres = [...allGenres].sort();
    elements.genreList.innerHTML = sortedGenres
      .map(
        (g) =>
          `<button class="genreTag" data-genre="${g}" role="checkbox" aria-checked="false">${g}</button>`
      )
      .join("");

    // Delegación de eventos en lugar de múltiples listeners
    elements.genreList.addEventListener("click", (e) => {
      const btn = e.target.closest(".genreTag");
      if (!btn) return;

      const g = btn.dataset.genre;
      const isActive = state.selectedGenres.has(g);

      if (isActive) {
        state.selectedGenres.delete(g);
        btn.classList.remove("active");
        btn.setAttribute("aria-checked", "false");
      } else {
        state.selectedGenres.add(g);
        btn.classList.add("active");
        btn.setAttribute("aria-checked", "true");
      }
      applyFilters();
    });
  }

  function applyFilters() {
    const query = state.searchQuery;
    const genres = state.selectedGenres;
    const hasGenreFilter = genres.size > 0;

    state.filteredNovels = state.allNovels.filter((novel) => {
      // Verificar búsqueda
      if (query) {
        const matchSearch =
          novel.nameJp.toLowerCase().includes(query) ||
          novel.nameEn.toLowerCase().includes(query) ||
          (novel.nameEs && novel.nameEs.toLowerCase().includes(query)) ||
          (novel.novelTitle && novel.novelTitle.toLowerCase().includes(query));
        if (!matchSearch) return false;
      }

      // Verificar géneros
      if (hasGenreFilter) {
        for (const g of genres) {
          if (!novel.genres.includes(g)) return false;
        }
      }

      return true;
    });

    state.currentPage = 1;
    renderNovels();
    updatePaginationVisibility();
  }

  function renderNovels() {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const pageData = state.filteredNovels.slice(
      start,
      start + state.itemsPerPage
    );

    if (pageData.length === 0) {
      elements.novelsGrid.style.display = "none";
      elements.noResultsMessage.style.display = "block";
    } else {
      elements.novelsGrid.style.display = "grid";
      elements.noResultsMessage.style.display = "none";

      // Calcular tamaño real de columna para sizes
      const gridWidth = elements.novelsGrid.getBoundingClientRect().width;
      const gap = 24; // 1.5rem
      const minColWidth = 180;
      const cols = Math.max(1, Math.floor((gridWidth + gap) / (minColWidth + gap)));
      const colWidth = Math.round((gridWidth - gap * (cols - 1)) / cols);
      const coverSizes = `${colWidth}px`;

      // Usar DocumentFragment para mejor rendimiento
      const fragment = document.createDocumentFragment();
      const template = document.createElement("template");

      for (const novel of pageData) {
        template.innerHTML = `
          <a href="/novelas/${novel.link}" class="novelCard" style="view-transition-name: n${novel.novelId}">
            <div class="novelCoverContainer">
              <picture>
                <source
                  srcset="/img/cover/avif/${novel.novelId}-400.avif 400w, /img/cover/avif/${novel.novelId}-700.avif 700w, /img/cover/avif/${novel.novelId}-900.avif 900w"
                  sizes="${coverSizes}"
                  type="image/avif"
                />
                <source
                  srcset="/img/cover/jpg/${novel.novelId}-400.jpg 400w, /img/cover/jpg/${novel.novelId}-700.jpg 700w, /img/cover/jpg/${novel.novelId}-900.jpg 900w"
                  sizes="${coverSizes}"
                  type="image/jpeg"
                />
                <img
                  src="/img/cover/jpg/${novel.novelId}-400.jpg"
                  alt="${novel.nameJp}"
                  class="novelCover"
                  loading="lazy"
                />
              </picture>
              <div class="hoverOverlay">
                <span>Leer Ahora</span>
              </div>
            </div>
          </a>`;
        fragment.appendChild(
          template.content.firstElementChild.cloneNode(true)
        );
      }

      elements.novelsGrid.innerHTML = "";
      elements.novelsGrid.appendChild(fragment);
    }
    updatePagination();
  }

  function changePage(dir) {
    state.currentPage += dir;
    renderNovels();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updatePagination() {
    const total =
      Math.ceil(state.filteredNovels.length / state.itemsPerPage) || 1;
    elements.pageInfoBottom.textContent = `Página ${state.currentPage} de ${total}`;
    elements.prevPageBottom.disabled = state.currentPage === 1;
    elements.nextPageBottom.disabled = state.currentPage >= total;
  }

  function updatePaginationVisibility() {
    elements.paginationBottom.style.display =
      state.filteredNovels.length > 10 ? "flex" : "none";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
