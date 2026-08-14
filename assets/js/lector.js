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
          
          // Separar capítulo y fragment
          const hashIdx = href.indexOf('#');
          const baseHref = hashIdx !== -1 ? href.substring(0, hashIdx) : href;
          const fragment = hashIdx !== -1 ? href.substring(hashIdx + 1) : null;
          
          // Buscar la sección en el spine con matching flexible
          // (el TOC puede usar rutas relativas que no coinciden con las del spine)
          let section = book.spine.get(baseHref);
          
          if (!section) {
            const filename = baseHref.split('/').pop();
            const spineItems = book.spine.spineItems;
            for (let i = 0; i < spineItems.length; i++) {
              const itemHref = spineItems[i].href;
              if (itemHref === baseHref || 
                  itemHref.endsWith('/' + baseHref) || 
                  baseHref.endsWith('/' + itemHref) ||
                  itemHref.endsWith(filename)) {
                section = spineItems[i];
                break;
              }
            }
          }
          
          if (!section) {
            console.warn("TOC: No section found for", baseHref);
            scheduleHideOverlay();
            return;
          }
          
          // Navegar usando el href canónico del spine (que epub.js sí reconoce)
          const displayTarget = fragment ? section.href + '#' + fragment : section.href;
          
          rendition.display(displayTarget).then(() => {
            // Verificar que el fragment scroll funcionó; si no, hacerlo manualmente
            if (fragment) {
              setTimeout(() => {
                const contents = rendition.getContents();
                if (contents && contents.length > 0) {
                  const doc = contents[0].document;
                  const target = doc.getElementById(fragment);
                  if (target) {
                    target.scrollIntoView({ block: "start", behavior: "instant" });
                  }
                }
              }, 150);
            }
          }).catch(() => {
            // Último recurso: navegar solo al capítulo sin fragment
            rendition.display(section.href).catch(() => {
              scheduleHideOverlay();
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
    // Limpiar DOM del viewer para evitar referencias a iframes destruidos
    // (previene el error 'packaging' al cambiar de modo)
    viewer.innerHTML = '';

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
        "html { background: transparent !important; -webkit-tap-highlight-color: transparent !important; }" +
        "body {" +
          "background: transparent !important;" +
          "color: " + textColor + " !important;" +
          "font-family: " + currentFontFamily + " !important;" +
          "font-size: " + currentFontSize + "% !important;" +
          "padding-top: 60px !important;" +
          "padding-bottom: 80px !important;" +
          "overflow-anchor: none !important;" +
          "-webkit-tap-highlight-color: transparent !important;" +
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

    // Registrar eventos de interacción en rendition
    rendition.on("touchstart", handleTouchStart);
    rendition.on("touchmove", handleTouchMove);
    rendition.on("touchend", handleTouchEnd);
    rendition.on("click", handleClick);

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

  // --- Control de Gestos Táctiles y Clics (Tap, Swipe, Menú) ---
  let touchStartScreenX = 0;
  let touchStartScreenY = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isTouching = false;
  let lastTouchEndTime = 0;
  let lastSwipeTime = 0;

  function getEventPositionRatio(e) {
    const viewerEl = document.getElementById("viewer") || viewer;
    const viewerRect = viewerEl ? viewerEl.getBoundingClientRect() : { left: 0, width: window.innerWidth };
    
    let clientX = e.clientX;
    if (clientX === undefined && e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
    } else if (clientX === undefined && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    }
    if (clientX === undefined) clientX = 0;

    let visualX = clientX;
    
    // Detectar si el evento proviene de dentro de un iframe
    const targetDoc = e.target && e.target.ownerDocument;
    const iframe = targetDoc && targetDoc.defaultView && targetDoc.defaultView !== window
      ? targetDoc.defaultView.frameElement
      : (viewerEl ? viewerEl.querySelector("iframe") : null);

    if (iframe) {
      const iframeRect = iframe.getBoundingClientRect();
      // En modo paginado, epub.js desplaza el iframe horizontalmente (transform o scroll).
      // iframeRect.left compensa ese desplazamiento con respecto al visor visible en pantalla.
      visualX = iframeRect.left + clientX - viewerRect.left;
    } else {
      visualX = clientX - viewerRect.left;
    }

    const width = viewerRect.width || window.innerWidth || 1;
    return visualX / width;
  }

  function handleTouchStart(e) {
    const touch = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : null);
    if (!touch) return;

    isTouching = true;
    touchStartScreenX = touch.screenX !== undefined ? touch.screenX : touch.clientX;
    touchStartScreenY = touch.screenY !== undefined ? touch.screenY : touch.clientY;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
  }

  function handleTouchMove(e) {
    // Registro pasivo de movimiento si es necesario
  }

  function clearActiveSelection() {
    try {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
      const iframes = document.querySelectorAll("iframe");
      iframes.forEach(iframe => {
        const iframeSel = iframe.contentWindow?.getSelection();
        if (iframeSel) iframeSel.removeAllRanges();
      });
    } catch (_) {}
  }

  function handleTouchEnd(e) {
    if (!isTouching) return;
    isTouching = false;

    const touch = e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null;
    if (!touch) return;

    const currentScreenX = touch.screenX !== undefined ? touch.screenX : touch.clientX;
    const currentScreenY = touch.screenY !== undefined ? touch.screenY : touch.clientY;
    const deltaX = currentScreenX - touchStartScreenX;
    const deltaY = currentScreenY - touchStartScreenY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const elapsed = Date.now() - touchStartTime;

    lastTouchEndTime = Date.now();

    // Ignorar toques sobre elementos interactivos (enlaces, botones, inputs)
    if (e.target && e.target.closest && e.target.closest("a, button, input, select, textarea")) {
      return;
    }

    // 1. Gesto de Deslizar (Swipe) solo en modo paginado
    // Requiere: desplazamiento horizontal significativo (>= 40px), predominantemente horizontal (absX > absY * 1.2) y duración razonable (< 800ms)
    if (currentMode === "paginated" && absX >= 40 && absX > absY * 1.2 && elapsed < 800) {
      if (e.cancelable) e.preventDefault();
      clearActiveSelection();
      lastSwipeTime = Date.now();
      if (deltaX < 0) {
        // Deslizar hacia la izquierda -> Siguiente página
        if (rendition) rendition.next();
      } else {
        // Deslizar hacia la derecha -> Página anterior
        if (rendition) rendition.prev();
      }
      return;
    }

    // 2. Gesto de Toque (Tap): movimiento físico mínimo (< 15px) y duración corta (< 500ms)
    if (absX < 15 && absY < 15 && elapsed < 500) {
      const ratio = getEventPositionRatio(e);

      if (currentMode === "paginated") {
        if (ratio < 0.25) {
          // Lateral izquierdo: página anterior
          if (e.cancelable) e.preventDefault();
          clearActiveSelection();
          if (rendition) rendition.prev();
        } else if (ratio > 0.75) {
          // Lateral derecho: página siguiente
          if (e.cancelable) e.preventDefault();
          clearActiveSelection();
          if (rendition) rendition.next();
        } else {
          // Centro (25% a 75%): alternar menú del lector
          clearActiveSelection();
          readerApp.classList.toggle("ui-hidden");
        }
      } else {
        // Modo continuo: tap en la zona central (15% a 85%) para alternar menú
        if (ratio >= 0.15 && ratio <= 0.85) {
          clearActiveSelection();
          readerApp.classList.toggle("ui-hidden");
        }
      }
    }
  }

  function handleClick(e) {
    // Si este click proviene inmediatamente de un evento táctil (ghost/synthetic click en móvil), ignorar
    if (Date.now() - lastTouchEndTime < 500) {
      return;
    }

    // Ignorar clicks sobre elementos interactivos
    if (e.target && e.target.closest && e.target.closest("a, button, input, select, textarea")) {
      return;
    }

    // Ignorar si el usuario estaba seleccionando texto
    const targetDoc = e.target && e.target.ownerDocument;
    const targetWin = targetDoc && targetDoc.defaultView ? targetDoc.defaultView : window;
    const docSelection = targetWin.getSelection()?.toString();
    if (docSelection && docSelection.length > 0) {
      return;
    }

    const ratio = getEventPositionRatio(e);

    if (currentMode === "paginated") {
      if (ratio < 0.25) {
        clearActiveSelection();
        if (rendition) rendition.prev();
      } else if (ratio > 0.75) {
        clearActiveSelection();
        if (rendition) rendition.next();
      } else {
        clearActiveSelection();
        readerApp.classList.toggle("ui-hidden");
      }
    } else {
      if (ratio >= 0.15 && ratio <= 0.85) {
        clearActiveSelection();
        readerApp.classList.toggle("ui-hidden");
      }
    }
  }

  // Eventos táctiles y clics también en el contenedor del lector (para áreas externas al iframe)
  const readerContainer = document.getElementById("readerContainer");
  if (readerContainer) {
    readerContainer.addEventListener("touchstart", handleTouchStart, { passive: true });
    readerContainer.addEventListener("touchmove", handleTouchMove, { passive: true });
    readerContainer.addEventListener("touchend", handleTouchEnd);
    readerContainer.addEventListener("click", handleClick);
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
    if (Date.now() - lastSwipeTime < 500) return;
    if (rendition && currentMode === "paginated") rendition.prev();
  });
  btnNext.addEventListener("click", () => {
    if (Date.now() - lastSwipeTime < 500) return;
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
