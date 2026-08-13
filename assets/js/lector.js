document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const epubUrl = params.get("epub");

  if (!epubUrl) {
    document.getElementById("readerTitle").textContent = "Error: EPUB no especificado";
    return;
  }

  // Elementos UI
  const readerApp = document.getElementById("readerApp");
  const readerTitle = document.getElementById("readerTitle");
  const viewer = document.getElementById("viewer");
  const progressEl = document.getElementById("readerProgress");
  
  // Botones
  const btnPrev = document.getElementById("readerPrev");
  const btnNext = document.getElementById("readerNext");
  const btnClose = document.getElementById("readerCloseBtn");
  const btnToc = document.getElementById("readerTocBtn");
  const btnSettings = document.getElementById("readerSettingsBtn");
  const panelCloseBtns = document.querySelectorAll(".closePanelBtn");
  
  // Modales y Loader
  const loadingOverlay = document.getElementById("readerLoadingOverlay");
  const tocPanel = document.getElementById("readerTocPanel");
  const tocList = document.getElementById("readerTocList");
  const settingsPanel = document.getElementById("readerSettingsPanel");

  // Ajustes
  const themeBtns = document.querySelectorAll(".themeOptionBtn");
  const modeBtns = document.querySelectorAll(".modeOptionBtn");
  const btnIncFont = document.getElementById("increaseFontBtn");
  const btnDecFont = document.getElementById("decreaseFontBtn");
  const fontDisplay = document.getElementById("fontSizeDisplay");
  const fontSelect = document.getElementById("fontFamilySelect");

  // Variables de estado
  let book = null;
  let rendition = null;
  let currentFontSize = 100;
  let currentTheme = localStorage.getItem("kasnia_reader_theme") || "dark";
  let currentMode = localStorage.getItem("kasnia_reader_mode") || "paginated";
  let currentFontFamily = localStorage.getItem("kasnia_reader_font") || "Open Sans, sans-serif";
  let currentFontSizeStr = localStorage.getItem("kasnia_reader_size") || "100%";
  
  // Mapa de colores de texto por tema (para inyección CSS en iframe)
  const themeTextColors = {
    light: "#222222",
    dark: "#e0e0e0",
    sepia: "#5b4636",
    grey: "#eceff4"
  };

  // Control del overlay anti-FOUC
  let foucOverlay = null;
  let foucHideTimer = null;

  function showOverlay() {
    if (!foucOverlay) return;
    clearTimeout(foucHideTimer);
    foucOverlay.style.transition = "none";
    foucOverlay.style.opacity = "1";
    foucOverlay.style.pointerEvents = "auto";
  }

  function scheduleHideOverlay() {
    clearTimeout(foucHideTimer);
    foucHideTimer = setTimeout(() => {
      if (!foucOverlay) return;
      foucOverlay.style.transition = "opacity 0.2s ease-out";
      foucOverlay.style.opacity = "0";
      foucOverlay.style.pointerEvents = "none";
    }, 150);
  }

  const storageKey = `kasnia_progress_${btoa(epubUrl).replace(/=/g, "")}`;

  // Inicialización de Lector
  initBook();

  function initBook() {
    book = ePub(epubUrl);
    
    // Configuración inicial de UI
    applyTheme(currentTheme);
    applyMode(currentMode);
    
    // Obtener título del libro
    book.ready.then(() => {
      const metadata = book.package.metadata;
      readerTitle.textContent = metadata.title || "Lector Kasnia";
      
      // Ocultar Loader
      if (loadingOverlay) {
        loadingOverlay.style.opacity = "0";
        setTimeout(() => loadingOverlay.style.display = "none", 300);
      }
    });

    // Cargar índice (TOC)
    book.loaded.navigation.then(nav => {
      const generateToc = (items) => {
        return items.map(item => `
          <li>
            <a href="${item.href}" data-href="${item.href}">${item.label}</a>
            ${item.subitems && item.subitems.length > 0 ? `<ul style="padding-left: 1rem; list-style: none;">${generateToc(item.subitems)}</ul>` : ''}
          </li>
        `).join("");
      };
      
      tocList.innerHTML = generateToc(nav.toc);
      
      tocList.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", e => {
          e.preventDefault();
          const href = e.currentTarget.dataset.href;
          if (!rendition) return;
          
          showOverlay();
          tocPanel.style.display = "none";
          
          const hashIdx = href.indexOf('#');
          
          if (hashIdx === -1) {
            // Sin fragment: navegación directa
            rendition.display(href);
            return;
          }
          
          // Con fragment: intentar directo, fallback manual con scrollIntoView
          const chapterHref = href.substring(0, hashIdx);
          const fragment = href.substring(hashIdx + 1);
          
          rendition.display(href).catch(() => {
            // Fallback: cargar capítulo y scroll manual al ancla
            return rendition.display(chapterHref).then(() => {
              return new Promise(resolve => setTimeout(resolve, 100));
            }).then(() => {
              const contents = rendition.getContents();
              if (contents && contents.length > 0) {
                const doc = contents[0].document;
                const target = doc.getElementById(fragment);
                if (target) {
                  target.scrollIntoView({ block: "start", behavior: "instant" });
                }
              }
            });
          });
        });
      });
    });

    // Renderizado
    renderBook();
  }

  function renderBook() {
    if (rendition) {
      rendition.destroy();
    }

    const flow = currentMode === "paginated" ? "paginated" : "scrolled-doc";
    const manager = currentMode === "paginated" ? "default" : "continuous";
    
    // Parse currentFontSizeStr
    if (currentFontSizeStr.endsWith("%")) {
      currentFontSize = parseInt(currentFontSizeStr.replace("%", ""));
    }

    rendition = book.renderTo(viewer, {
      width: "100%",
      height: "100%",
      manager: manager,
      flow: flow,
      spread: "none",
      snap: true,
      allowScriptedContent: true
    });

    // --- Anti-FOUC Capa 2: overlay opaco sobre el viewer ---
    // Se superpone al viewer sin alterar el layout del iframe, permitiendo
    // que epub.js calcule posiciones de anclas normalmente.
    if (!foucOverlay) {
      foucOverlay = document.createElement("div");
      foucOverlay.id = "foucOverlay";
      foucOverlay.className = "foucOverlay";
      viewer.parentElement.appendChild(foucOverlay);
    }
    showOverlay(); // Mostrar durante carga inicial

    // Mostrar overlay cuando un nuevo capítulo comienza a renderizarse
    rendition.on("rendering", showOverlay);

    // --- Anti-FOUC Capa 1: inyección de CSS del tema en el iframe ---
    // Inyecta TODOS los estilos (color, fuente, padding) en el <head> del iframe
    // ANTES del primer paint, eliminando el reflow que causa el "movimiento" visual.
    rendition.hooks.content.register((contents) => {
      const doc = contents.document;
      if (!doc || !doc.documentElement) return;
      
      // Construir CSS del tema actual
      const textColor = themeTextColors[currentTheme] || themeTextColors.dark;
      let preStyle = doc.getElementById("kasniaThemePreload");
      if (!preStyle) {
        preStyle = doc.createElement("style");
        preStyle.id = "kasniaThemePreload";
        doc.head.insertBefore(preStyle, doc.head.firstChild);
      }
      preStyle.textContent =
        "html { background: transparent !important; }" +
        "body {" +
          "background: transparent !important;" +
          "color: " + textColor + " !important;" +
          "font-family: " + currentFontFamily + " !important;" +
          "font-size: " + currentFontSize + "% !important;" +
          "padding-top: 60px !important;" +
          "padding-bottom: 80px !important;" +
          "overflow-anchor: none !important;" +
        "}";
      
      // Overflow anchor en el contenedor del manager
      if (rendition && rendition.manager && rendition.manager.container) {
        rendition.manager.container.style.setProperty("overflow-anchor", "none", "important");
      }
      
      // Scrollbar personalizada para modo continuo
      if (currentMode === "continuous") {
        contents.addStylesheetRules({
          "::-webkit-scrollbar": { "width": "8px" },
          "::-webkit-scrollbar-track": { "background": "transparent" },
          "::-webkit-scrollbar-thumb": { "background": "rgba(128,128,128,0.4)", "border-radius": "4px" }
        });
      }
    });

    // Estilos iniciales (Temas)
    registerThemes();
    rendition.themes.select(currentTheme);
    rendition.themes.font(currentFontFamily);
    rendition.themes.fontSize(`${currentFontSize}%`);
    fontSelect.value = currentFontFamily;
    fontDisplay.textContent = `${currentFontSize}%`;

    // Restaurar progreso
    const savedLocation = localStorage.getItem(storageKey);
    if (savedLocation) {
      rendition.display(savedLocation);
    } else {
      rendition.display();
    }

    // Eventos de rendition
    rendition.on("relocated", location => {
      // Anti-FOUC: fade-out debounced del overlay
      // El debounce de 150ms asegura que si relocated se dispara múltiples
      // veces (capítulo + fragment), solo se oculta tras el último.
      scheduleHideOverlay();

      // Guardar progreso
      localStorage.setItem(storageKey, location.start.cfi);
      
      // Actualizar botones prev/next
      if (currentMode === "paginated") {
        btnPrev.style.visibility = location.atStart ? "hidden" : "visible";
        btnNext.style.visibility = location.atEnd ? "hidden" : "visible";
      }

      // Si tenemos ubicaciones generadas, mostrar porcentaje
      if (book.locations.length > 0) {
        const percentage = Math.round(book.locations.percentageFromCfi(location.start.cfi) * 100);
        progressEl.textContent = `${percentage}%`;
      } else {
        progressEl.textContent = "...";
      }
    });

    // Soporte para teclas dentro del iframe
    rendition.on("keyup", e => {
      if (e.key === "ArrowLeft") rendition.prev();
      if (e.key === "ArrowRight") rendition.next();
    });

    // UI Inmersiva: Mostrar/Ocultar controles al hacer tap en el centro
    const toggleMenuHandler = (e) => {
      const width = window.innerWidth;
      let x = 0;
      if (e.type.includes('touch') && e.changedTouches) {
        x = e.changedTouches[0].clientX;
      } else {
        x = e.clientX;
      }
      
      // Ampliar el área táctil al 80% central (0.1 a 0.9)
      if (x > width * 0.1 && x < width * 0.9) {
        readerApp.classList.toggle("ui-hidden");
      }
    };

    rendition.on("click", toggleMenuHandler);
    rendition.on("touchstart", toggleMenuHandler);

    // Generar locations en background para %
    book.ready.then(() => {
      return book.locations.generate(1600);
    }).then(locations => {
      const currentLocation = rendition.currentLocation();
      if (currentLocation && currentLocation.start) {
        const percentage = Math.round(book.locations.percentageFromCfi(currentLocation.start.cfi) * 100);
        progressEl.textContent = `${percentage}%`;
      }
    }).catch(() => {
       progressEl.textContent = "";
    });
  }

  function registerThemes() {
    rendition.themes.register("light", { body: { background: "transparent", color: "#222222" }});
    rendition.themes.register("dark", { body: { background: "transparent", color: "#e0e0e0" }});
    rendition.themes.register("sepia", { body: { background: "transparent", color: "#5b4636" }});
    rendition.themes.register("grey", { body: { background: "transparent", color: "#eceff4" }});
  }

  function applyTheme(theme) {
    currentTheme = theme;
    readerApp.dataset.readerTheme = theme;
    localStorage.setItem("kasnia_reader_theme", theme);
    
    themeBtns.forEach(b => b.classList.toggle("active", b.dataset.theme === theme));
    
    if (rendition) {
      rendition.themes.select(theme);
    }
  }

  function applyMode(mode) {
    if (currentMode === mode && rendition) return; // Ya está activo
    currentMode = mode;
    readerApp.dataset.readerMode = mode;
    localStorage.setItem("kasnia_reader_mode", mode);
    
    modeBtns.forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
    
    // Para cambiar de modo en epub.js, generalmente es mejor volver a renderizar
    if (rendition) {
      renderBook();
    }
  }

  // --- Event Listeners UI ---

  // Navegación
  btnPrev.addEventListener("click", () => {
    if (rendition && currentMode === "paginated") rendition.prev();
  });
  btnNext.addEventListener("click", () => {
    if (rendition && currentMode === "paginated") rendition.next();
  });
  
  // Soporte teclado general
  document.addEventListener("keyup", e => {
    if (currentMode === "paginated" && rendition) {
      if (e.key === "ArrowLeft") rendition.prev();
      if (e.key === "ArrowRight") rendition.next();
    }
  });

  // Botón cerrar (vuelve atrás)
  btnClose.addEventListener("click", () => {
    window.history.back();
  });

  // Modales
  const togglePanel = panel => {
    const isVisible = panel.style.display === "flex";
    tocPanel.style.display = "none";
    settingsPanel.style.display = "none";
    panel.style.display = isVisible ? "none" : "flex";
  };

  btnToc.addEventListener("click", () => togglePanel(tocPanel));
  btnSettings.addEventListener("click", () => togglePanel(settingsPanel));

  panelCloseBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      e.currentTarget.closest(".readerModalOverlay").style.display = "none";
    });
  });

  // Cerrar modales al hacer clic fuera del contenido
  [tocPanel, settingsPanel].forEach(panel => {
    panel.addEventListener("click", e => {
      if (e.target === panel) panel.style.display = "none";
    });
  });

  // Ajustes - Tema
  themeBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      applyTheme(e.currentTarget.dataset.theme);
    });
  });

  // Ajustes - Modo
  modeBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      applyMode(e.currentTarget.dataset.mode);
    });
  });

  // Ajustes - Fuente
  btnIncFont.addEventListener("click", () => {
    currentFontSize += 10;
    updateFontSize();
  });
  
  btnDecFont.addEventListener("click", () => {
    currentFontSize = Math.max(50, currentFontSize - 10);
    updateFontSize();
  });

  function updateFontSize() {
    currentFontSizeStr = `${currentFontSize}%`;
    fontDisplay.textContent = currentFontSizeStr;
    localStorage.setItem("kasnia_reader_size", currentFontSizeStr);
    if (rendition) {
      rendition.themes.fontSize(currentFontSizeStr);
    }
  }

  fontSelect.addEventListener("change", e => {
    currentFontFamily = e.target.value;
    localStorage.setItem("kasnia_reader_font", currentFontFamily);
    if (rendition) {
      rendition.themes.font(currentFontFamily);
    }
  });

});
