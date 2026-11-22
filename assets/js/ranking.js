(function () {
  "use strict";

  const CDN_IMG = "https://img.kasniaproject.com";

  const state = {
    currentPeriod: "days7",
    currentLimit: 5, // 5 o 'all'
    rankingData: null,
    novelasMap: {},
    isSwitching: false,
  };

  const elements = {};

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
   * Inicialización del script tras carga de la página
   */
  function init() {
    cacheDOMElements();
    if (!elements.rankingContent) return;

    parseInjectedData();
    setupLastUpdatedDate();
    setupEventListeners();
    renderRanking(false);
  }

  /**
   * Cacheo único de nodos DOM
   */
  function cacheDOMElements() {
    elements.rankingDataEl = document.getElementById("rankingData");
    elements.novelasDataEl = document.getElementById("novelasData");
    elements.rankingContent = document.getElementById("rankingContent");
    elements.rankingPodiumSection = document.getElementById("rankingPodiumSection");
    elements.rankingPodiumGrid = document.getElementById("rankingPodiumGrid");
    elements.rankingGridSection = document.getElementById("rankingGridSection");
    elements.rankingGrid = document.getElementById("rankingGrid");
    elements.rankingEmptyState = document.getElementById("rankingEmptyState");
    elements.lastUpdatedWrapper = document.getElementById("lastUpdatedWrapper");
    elements.lastUpdated = document.getElementById("lastUpdated");
    elements.rankingLiveRegion = document.getElementById("rankingLiveRegion");
    elements.periodBtns = document.querySelectorAll("[data-period]");
    elements.limitBtns = document.querySelectorAll("[data-limit]");
  }

  /**
   * Parseo seguro de los bloques de datos inyectados en el DOM
   */
  function parseInjectedData() {
    if (elements.rankingDataEl) {
      try {
        const text = elements.rankingDataEl.textContent.trim();
        if (text) {
          state.rankingData = JSON.parse(text);
        }
      } catch (err) {
        console.error("Error al parsear rankingData:", err);
        state.rankingData = null;
      }
    }

    if (elements.novelasDataEl) {
      try {
        const text = elements.novelasDataEl.textContent.trim();
        if (text) {
          const novelasArray = JSON.parse(text);
          if (Array.isArray(novelasArray)) {
            for (const n of novelasArray) {
              if (n && n.novelId) {
                state.novelasMap[n.novelId] = n;
              }
            }
          }
        }
      } catch (err) {
        console.error("Error al parsear novelasData:", err);
      }
    }
  }

  /**
   * Formatea la fecha de última actualización en español con Intl.DateTimeFormat
   */
  function setupLastUpdatedDate() {
    if (!state.rankingData || !state.rankingData.updatedAt || !elements.lastUpdated) {
      return;
    }

    try {
      const date = new Date(state.rankingData.updatedAt);
      if (!isNaN(date.getTime())) {
        const formattedDate = new Intl.DateTimeFormat("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(date);

        elements.lastUpdated.textContent = `Actualizado el ${formattedDate}`;
        if (elements.lastUpdatedWrapper) {
          elements.lastUpdatedWrapper.style.display = "inline-flex";
        }
      }
    } catch (e) {
      // Si falla la fecha, permanece oculta
    }
  }

  /**
   * Registro centralizado de eventos y accesibilidad
   */
  function setupEventListeners() {
    // Control de Periodo (7, 21, 30 días)
    elements.periodBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const period = btn.getAttribute("data-period");
        if (period === state.currentPeriod) return;

        elements.periodBtns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        state.currentPeriod = period;
        renderRanking(true);
      });
    });

    // Control de Límite (Top 5 / Todas)
    elements.limitBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const limitVal = btn.getAttribute("data-limit");
        const nextLimit = limitVal === "all" ? "all" : parseInt(limitVal, 10);
        if (nextLimit === state.currentLimit) return;

        elements.limitBtns.forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        state.currentLimit = nextLimit;
        renderRanking(true);
      });
    });
  }

  /**
   * Construye el marcado para una tarjeta novelCard con datos de ranking
   */
  function buildNovelCard(novel, rank, percentage, coverSizes, isAboveFold) {
    const title = escapeHTML(novel.novelTitle || novel.nameEn || novel.nameJp);
    const author = escapeHTML(novel.author || "Autor por confirmar");
    const vols = Number(novel.volumesReleased) || 0;
    const volsLabel = vols === 1 ? "1 volumen" : `${vols} volúmenes`;
    const novelId = escapeHTML(novel.novelId);
    const link = escapeHTML(novel.link);

    let badgeClass = "rankingBadgeRest";
    if (rank === 1) badgeClass = "rankingBadge1";
    else if (rank === 2) badgeClass = "rankingBadge2";
    else if (rank === 3) badgeClass = "rankingBadge3";

    const pctNum = Number(percentage) || 0;
    const pctFormatted = pctNum.toFixed(1);

    const article = document.createElement("article");
    article.className = "novelCardWrapper";
    article.innerHTML = `
      <a
        href="/novelas/${link}"
        class="novelCard"
        style="view-transition-name: n${novelId}"
        aria-label="Posición ${rank}: ${title}, por ${author}"
      >
        <div class="novelCoverContainer">
          <div class="rankingBadge ${badgeClass}" aria-hidden="true">#${rank}</div>
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
              loading="${isAboveFold ? "eager" : "lazy"}"
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
            <span class="metaDivider" aria-hidden="true">•</span>
            <span class="rankingPercentage">${pctFormatted}% de visitas</span>
          </p>
        </div>
      </a>
    `;

    return article;
  }

  /**
   * Anuncia cambios a lectores de pantalla
   */
  function announceToScreenReader(itemsCount) {
    if (!elements.rankingLiveRegion) return;

    let periodLabel = "7 días";
    if (state.currentPeriod === "days21") periodLabel = "21 días";
    else if (state.currentPeriod === "days30") periodLabel = "30 días";

    const limitLabel = state.currentLimit === "all" ? "todas las novelas" : "Top 5";
    elements.rankingLiveRegion.textContent = `Mostrando ranking de ${periodLabel}, ${limitLabel}. ${itemsCount} novelas en lista.`;
  }

  /**
   * Renderiza el contenido del ranking con transición suave vanilla
   */
  function renderRanking(animate) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (animate && !prefersReducedMotion) {
      elements.rankingContent.classList.add("isSwitching");
      setTimeout(() => {
        doRender();
        requestAnimationFrame(() => {
          elements.rankingContent.classList.remove("isSwitching");
        });
      }, 120);
    } else {
      doRender();
    }
  }

  /**
   * Inyección efectiva en el DOM dividiendo entre Podio (1-3) y Resto (4+)
   */
  function doRender() {
    // Si rankingData no existe o está vacío
    if (
      !state.rankingData ||
      !state.rankingData.periods ||
      !state.rankingData.periods[state.currentPeriod]
    ) {
      if (elements.rankingPodiumSection) elements.rankingPodiumSection.style.display = "none";
      if (elements.rankingGridSection) elements.rankingGridSection.style.display = "none";
      if (elements.rankingEmptyState) elements.rankingEmptyState.style.display = "flex";
      return;
    }

    let items = state.rankingData.periods[state.currentPeriod] || [];

    // Si el límite es Top 5, tomar los primeros 5
    if (state.currentLimit === 5) {
      items = items.slice(0, 5);
    }

    // Filtrar solo las que tengan metadatos válidos
    const validItems = items
      .map((item, idx) => {
        const novel = state.novelasMap[item.novelId];
        return novel ? { item, novel, rank: idx + 1 } : null;
      })
      .filter(Boolean);

    if (validItems.length === 0) {
      if (elements.rankingPodiumSection) elements.rankingPodiumSection.style.display = "none";
      if (elements.rankingGridSection) elements.rankingGridSection.style.display = "none";
      if (elements.rankingEmptyState) elements.rankingEmptyState.style.display = "flex";
      return;
    }

    if (elements.rankingEmptyState) elements.rankingEmptyState.style.display = "none";

    // Separar Podio (primeras 3) y Resto (posición 4 en adelante)
    const podiumItems = validItems.slice(0, 3);
    const restItems = validItems.slice(3);

    // 1. Renderizar Podio
    if (podiumItems.length > 0) {
      elements.rankingPodiumSection.style.display = "block";
      elements.rankingPodiumGrid.innerHTML = "";

      const podiumFragment = document.createDocumentFragment();

      // Cálculo de sizes para las portadas del podio (3 columnas máx.)
      const podiumWidth = elements.rankingPodiumGrid.getBoundingClientRect().width || 1080;
      let podiumCols = 3;
      if (window.innerWidth <= 500) podiumCols = 1;
      else if (window.innerWidth <= 720) podiumCols = 2;
      const podiumColWidth = Math.round((podiumWidth - 24 * (podiumCols - 1)) / podiumCols);
      const podiumCoverSizes = `${Math.max(podiumColWidth, 180)}px`;

      podiumItems.forEach(({ item, novel, rank }) => {
        const card = buildNovelCard(
          novel,
          rank,
          item.percentage,
          podiumCoverSizes,
          true // isAboveFold: carga eager para el podio
        );
        podiumFragment.appendChild(card);
      });

      elements.rankingPodiumGrid.appendChild(podiumFragment);
    } else {
      elements.rankingPodiumSection.style.display = "none";
    }

    // 2. Renderizar Resto de Posiciones (4 en adelante)
    if (restItems.length > 0) {
      elements.rankingGridSection.style.display = "block";
      elements.rankingGrid.innerHTML = "";

      const restFragment = document.createDocumentFragment();

      // Cálculo de sizes para las portadas de la cuadrícula general (4 columnas máx.)
      const gridWidth = elements.rankingGrid.getBoundingClientRect().width || 1080;
      let gridCols = 4;
      if (window.innerWidth <= 640) gridCols = 2;
      else if (window.innerWidth <= 920) gridCols = 3;
      const gridColWidth = Math.round((gridWidth - 24 * (gridCols - 1)) / gridCols);
      const gridCoverSizes = `${Math.max(gridColWidth, 140)}px`;

      restItems.forEach(({ item, novel, rank }) => {
        const card = buildNovelCard(
          novel,
          rank,
          item.percentage,
          gridCoverSizes,
          false // isAboveFold: lazy loading para el resto
        );
        restFragment.appendChild(card);
      });

      elements.rankingGrid.appendChild(restFragment);
    } else {
      elements.rankingGridSection.style.display = "none";
    }

    announceToScreenReader(validItems.length);
  }

  // Ejecución segura tras DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
