document.addEventListener("DOMContentLoaded", () => {
  // Evitar que epub.js aplique sandbox al iframe del lector (elimina advertencias de sandbox y bloqueos de scripts falsos)
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function (tagName, options) {
    const el = originalCreateElement(tagName, options);
    if (typeof tagName === "string" && tagName.toLowerCase() === "iframe") {
      Object.defineProperty(el, "sandbox", {
        get() {
          return {
            add() {},
            remove() {},
            contains() { return false; },
            toggle() { return false; },
            value: "",
            toString() { return ""; },
            valueOf() { return ""; }
          };
        },
        set(_val) {},
        configurable: true
      });
      const originalSetAttribute = el.setAttribute.bind(el);
      el.setAttribute = function (name, val) {
        if (typeof name === "string" && name.toLowerCase() === "sandbox") {
          return;
        }
        return originalSetAttribute(name, val);
      };
    }
    return el;
  };

  const params = new URLSearchParams(window.location.search);
  const epubUrl = params.get("epub");

  if (!epubUrl) {
    document.getElementById("readerTitle").textContent = "Error: EPUB no especificado";
    return;
  }

  // Elementos UI principales
  const readerApp = document.getElementById("readerApp");
  const readerTitle = document.getElementById("readerTitle");
  const viewer = document.getElementById("viewer");
  const progressEl = document.getElementById("readerProgress");

  // Botones de cabecera y navegación
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

  // Catálogo de Fuentes
  const FONT_PRESETS = {
    "'Open Sans', sans-serif": {
      name: "Open Sans",
      url: "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
    },
    "'Merriweather', serif": {
      name: "Merriweather",
      url: "https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap"
    },
    "'Lora', serif": {
      name: "Lora",
      url: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap"
    },
    "'Literata', serif": {
      name: "Literata",
      url: "https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,200..900;1,7..72,200..900&display=swap"
    },
    "'Roboto', sans-serif": {
      name: "Roboto",
      url: "https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300..700;1,300..700&display=swap"
    },
    "'Inter', sans-serif": {
      name: "Inter",
      url: "https://fonts.googleapis.com/css2?family=Inter:wght@300..800&display=swap"
    },
    "'JetBrains Mono', monospace": {
      name: "JetBrains Mono",
      url: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300..800;1,300..800&display=swap"
    }
  };

  // Presets de temas
  const THEME_PRESETS = {
    light: { bg: "#fdfdfd", text: "#222222", headerBg: "#f5f5f5", border: "#dddddd", accent: "#e6528b" },
    dark: { bg: "#121212", text: "#e0e0e0", headerBg: "#1e1e1e", border: "#333333", accent: "#ff9ac5" },
    sepia: { bg: "#f4ecd8", text: "#5b4636", headerBg: "#e8dcc4", border: "#d3c4a8", accent: "#e6528b" },
    grey: { bg: "#2e3440", text: "#eceff4", headerBg: "#282e3a", border: "#434c5e", accent: "#ff9ac5" }
  };

  // Ajustes predeterminados
  const DEFAULT_SETTINGS = {
    theme: "dark",
    bgColor: "#121212",
    textColor: "#e0e0e0",
    mode: "paginated",
    font: "'Open Sans', sans-serif",
    fontSize: 1.0,
    bold: false,
    italic: false,
    underline: false,
    align: "justify",
    hyphens: "auto",
    paraSpacing: 1.0,
    lineHeight: 1.6,
    letterSpacing: 0.0,
    marginTop: 30,
    marginBottom: 30,
    marginLeft: 20,
    marginRight: 20
  };

  let settings = { ...DEFAULT_SETTINGS };

  // Variables del lector
  let book = null;
  let rendition = null;
  let foucOverlay = null;
  let foucHideTimer = null;

  const storageKey = `kasnia_progress_${btoa(epubUrl).replace(/=/g, "")}`;
  const loadedFonts = new Set(["'Open Sans', sans-serif", "'Merriweather', serif"]);

  // 1. Cargar Ajustes desde LocalStorage
  loadSettings();

  function loadSettings() {
    const savedTheme = localStorage.getItem("kasnia_reader_theme");
    if (savedTheme && (THEME_PRESETS[savedTheme] || savedTheme === "custom")) {
      settings.theme = savedTheme;
    }

    const savedBgColor = localStorage.getItem("kasnia_reader_bg_color");
    const savedTextColor = localStorage.getItem("kasnia_reader_text_color");

    if (savedBgColor) {
      settings.bgColor = savedBgColor;
    } else if (THEME_PRESETS[settings.theme]) {
      settings.bgColor = THEME_PRESETS[settings.theme].bg;
    }

    if (savedTextColor) {
      settings.textColor = savedTextColor;
    } else if (THEME_PRESETS[settings.theme]) {
      settings.textColor = THEME_PRESETS[settings.theme].text;
    }

    const savedMode = localStorage.getItem("kasnia_reader_mode");
    if (savedMode === "paginated" || savedMode === "continuous") {
      settings.mode = savedMode;
    }

    const savedFont = localStorage.getItem("kasnia_reader_font");
    if (savedFont && FONT_PRESETS[savedFont]) {
      settings.font = savedFont;
    }

    const savedSize = localStorage.getItem("kasnia_reader_size_em");
    if (savedSize) {
      const parsed = parseFloat(savedSize);
      if (!isNaN(parsed) && parsed >= 0.6 && parsed <= 2.5) {
        settings.fontSize = parsed;
      }
    } else {
      const oldSize = localStorage.getItem("kasnia_reader_size");
      if (oldSize && oldSize.endsWith("%")) {
        const pct = parseInt(oldSize.replace("%", ""));
        if (!isNaN(pct)) {
          settings.fontSize = Math.max(0.6, Math.min(2.5, +(pct / 100).toFixed(2)));
        }
      }
    }

    settings.bold = localStorage.getItem("kasnia_reader_bold") === "true";
    settings.italic = localStorage.getItem("kasnia_reader_italic") === "true";
    settings.underline = localStorage.getItem("kasnia_reader_underline") === "true";

    const savedAlign = localStorage.getItem("kasnia_reader_align");
    if (savedAlign && ["justify", "left", "center"].includes(savedAlign)) {
      settings.align = savedAlign;
    }

    const savedHyphens = localStorage.getItem("kasnia_reader_hyphens");
    if (savedHyphens && (savedHyphens === "auto" || savedHyphens === "none")) {
      settings.hyphens = savedHyphens;
    }

    const savedPara = parseFloat(localStorage.getItem("kasnia_reader_para_spacing"));
    if (!isNaN(savedPara)) settings.paraSpacing = Math.max(0, Math.min(3.0, savedPara));

    const savedLine = parseFloat(localStorage.getItem("kasnia_reader_line_height"));
    if (!isNaN(savedLine)) settings.lineHeight = Math.max(1.0, Math.min(2.8, savedLine));

    const savedLetter = parseFloat(localStorage.getItem("kasnia_reader_letter_spacing"));
    if (!isNaN(savedLetter)) settings.letterSpacing = Math.max(-0.5, Math.min(3.0, savedLetter));

    const savedMt = parseInt(localStorage.getItem("kasnia_reader_margin_top"));
    if (!isNaN(savedMt)) settings.marginTop = Math.max(0, Math.min(100, savedMt));

    const savedMb = parseInt(localStorage.getItem("kasnia_reader_margin_bottom"));
    if (!isNaN(savedMb)) settings.marginBottom = Math.max(0, Math.min(100, savedMb));

    const savedMl = parseInt(localStorage.getItem("kasnia_reader_margin_left"));
    if (!isNaN(savedMl)) settings.marginLeft = Math.max(0, Math.min(80, savedMl));

    const savedMr = parseInt(localStorage.getItem("kasnia_reader_margin_right"));
    if (!isNaN(savedMr)) settings.marginRight = Math.max(0, Math.min(80, savedMr));
  }

  function saveSettings() {
    localStorage.setItem("kasnia_reader_theme", settings.theme);
    localStorage.setItem("kasnia_reader_bg_color", settings.bgColor);
    localStorage.setItem("kasnia_reader_text_color", settings.textColor);
    localStorage.setItem("kasnia_reader_mode", settings.mode);
    localStorage.setItem("kasnia_reader_font", settings.font);
    localStorage.setItem("kasnia_reader_size_em", settings.fontSize.toFixed(2));
    localStorage.setItem("kasnia_reader_bold", settings.bold ? "true" : "false");
    localStorage.setItem("kasnia_reader_italic", settings.italic ? "true" : "false");
    localStorage.setItem("kasnia_reader_underline", settings.underline ? "true" : "false");
    localStorage.setItem("kasnia_reader_align", settings.align);
    localStorage.setItem("kasnia_reader_hyphens", settings.hyphens);
    localStorage.setItem("kasnia_reader_para_spacing", settings.paraSpacing.toFixed(2));
    localStorage.setItem("kasnia_reader_line_height", settings.lineHeight.toFixed(1));
    localStorage.setItem("kasnia_reader_letter_spacing", settings.letterSpacing.toFixed(1));
    localStorage.setItem("kasnia_reader_margin_top", settings.marginTop);
    localStorage.setItem("kasnia_reader_margin_bottom", settings.marginBottom);
    localStorage.setItem("kasnia_reader_margin_left", settings.marginLeft);
    localStorage.setItem("kasnia_reader_margin_right", settings.marginRight);
  }

  // 2. Control de fuentes dinámicas
  function ensureFontLoaded(fontFamily, callback) {
    const fontInfo = FONT_PRESETS[fontFamily];
    if (!fontInfo || !fontInfo.url || loadedFonts.has(fontFamily)) {
      if (callback) callback();
      return;
    }

    const fontLoadingIndicator = document.getElementById("fontLoadingIndicator");
    if (fontLoadingIndicator) fontLoadingIndicator.style.display = "inline";

    let link = document.querySelector(`link[href="${fontInfo.url}"]`);
    if (!link) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = fontInfo.url;
      document.head.appendChild(link);
    }

    if (rendition) {
      const contents = rendition.getContents();
      contents.forEach(content => {
        const doc = content.document;
        if (doc && !doc.querySelector(`link[href="${fontInfo.url}"]`)) {
          const frameLink = doc.createElement("link");
          frameLink.rel = "stylesheet";
          frameLink.href = fontInfo.url;
          doc.head.appendChild(frameLink);
        }
      });
    }

    const done = () => {
      loadedFonts.add(fontFamily);
      if (fontLoadingIndicator) fontLoadingIndicator.style.display = "none";
      if (callback) callback();
    };

    if (document.fonts && document.fonts.load) {
      document.fonts.load(`1em ${fontFamily}`)
        .then(() => done())
        .catch(() => done());
    } else {
      setTimeout(done, 600);
    }
  }

  // 3. Generador de CSS para el iframe (Anti-FOUC Capa 1)
  function generateReaderIframeCSS() {
    const hyphensVal = settings.hyphens;
    const fontWeightVal = settings.bold ? "bold !important" : "normal !important";
    const fontStyleVal = settings.italic ? "italic !important" : "normal !important";
    const textDecorVal = settings.underline ? "underline !important" : "none !important";

    return (
      "html {" +
        "background: transparent !important;" +
        "-webkit-tap-highlight-color: transparent !important;" +
        "-webkit-touch-callout: none !important;" +
        "-webkit-user-select: none !important;" +
        "user-select: none !important;" +
      "}" +
      "body {" +
        "background: transparent !important;" +
        "color: " + settings.textColor + " !important;" +
        "font-family: " + settings.font + " !important;" +
        "font-size: " + settings.fontSize.toFixed(2) + "em !important;" +
        "font-weight: " + fontWeightVal + ";" +
        "font-style: " + fontStyleVal + ";" +
        "text-decoration: " + textDecorVal + ";" +
        "text-align: " + settings.align + ";" +
        "line-height: " + settings.lineHeight.toFixed(1) + " !important;" +
        "letter-spacing: " + settings.letterSpacing.toFixed(1) + "px !important;" +
        "hyphens: " + hyphensVal + " !important;" +
        "-webkit-hyphens: " + hyphensVal + " !important;" +
        "-ms-hyphens: " + hyphensVal + " !important;" +
        "padding-top: " + settings.marginTop + "px !important;" +
        "padding-bottom: " + settings.marginBottom + "px !important;" +
        "padding-left: 0 !important;" +
        "padding-right: 0 !important;" +
        "margin: 0 !important;" +
        "overflow-anchor: none !important;" +
        "-webkit-tap-highlight-color: transparent !important;" +
        "-webkit-touch-callout: none !important;" +
        "-webkit-user-select: none !important;" +
        "user-select: none !important;" +
        "box-sizing: border-box !important;" +
      "}" +
      "p, div, span, li, a, h1, h2, h3, h4, h5, h6 {" +
        "color: inherit !important;" +
        "line-height: inherit !important;" +
        "letter-spacing: inherit !important;" +
        "-webkit-touch-callout: none !important;" +
        "-webkit-user-select: none !important;" +
        "user-select: none !important;" +
      "}" +
      "p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, pre, table, hr {" +
        "margin-left: " + settings.marginLeft + "px !important;" +
        "margin-right: " + settings.marginRight + "px !important;" +
        "width: auto !important;" +
        "max-width: calc(100% - " + (settings.marginLeft + settings.marginRight) + "px) !important;" +
        "box-sizing: border-box !important;" +
      "}" +
      "li p, blockquote p, table p {" +
        "margin-left: 0 !important;" +
        "margin-right: 0 !important;" +
        "max-width: 100% !important;" +
      "}" +
      "p {" +
        "margin-top: 0;" +
        "margin-bottom: " + settings.paraSpacing.toFixed(2) + "em !important;" +
        "hyphens: " + hyphensVal + " !important;" +
        "-webkit-hyphens: " + hyphensVal + " !important;" +
        "-ms-hyphens: " + hyphensVal + " !important;" +
      "}" +
      "figure, .dimg {" +
        "max-width: 100% !important;" +
        "box-sizing: border-box !important;" +
      "}" +
      "img {" +
        "max-width: 100% !important;" +
        "box-sizing: border-box !important;" +
      "}" +
      // Preservar y priorizar alineaciones explícitas de portadas, títulos y párrafos centrados del EPUB
      ".centrado, .center, .text-center, [align='center'], [style*='text-align: center'], [style*='text-align:center'] { text-align: center !important; }" +
      ".derecha, .right, .text-right, [align='right'], [style*='text-align: right'], [style*='text-align:right'] { text-align: right !important; }" +
      ".izquierda, .left, .text-left, [align='left'], [style*='text-align: left'], [style*='text-align:left'] { text-align: left !important; }" +
      (settings.bold ? "p, div, span, li, a, h1, h2, h3, h4, h5, h6 { font-weight: bold !important; }" : "") +
      (settings.italic ? "p, div, span, li, a, h1, h2, h3, h4, h5, h6 { font-style: italic !important; }" : "") +
      (settings.underline ? "p, div, span, li, a { text-decoration: underline !important; }" : "")
    );
  }

  // Actualización en tiempo real de iframes y tema visual
  function updateIframeStyles() {
    const css = generateReaderIframeCSS();

    readerApp.style.setProperty("--reader-bg", settings.bgColor);
    readerApp.style.setProperty("--reader-text", settings.textColor);

    if (foucOverlay) {
      foucOverlay.style.backgroundColor = settings.bgColor;
    }

    if (rendition) {
      const contents = rendition.getContents();
      contents.forEach(content => {
        const doc = content.document;
        if (!doc) return;

        const fontInfo = FONT_PRESETS[settings.font];
        if (fontInfo && fontInfo.url && !doc.querySelector(`link[href="${fontInfo.url}"]`)) {
          const frameLink = doc.createElement("link");
          frameLink.rel = "stylesheet";
          frameLink.href = fontInfo.url;
          doc.head.appendChild(frameLink);
        }

        let preStyle = doc.getElementById("kasniaThemePreload");
        if (!preStyle) {
          preStyle = doc.createElement("style");
          preStyle.id = "kasniaThemePreload";
          doc.head.insertBefore(preStyle, doc.head.firstChild);
        }
        preStyle.textContent = css;
      });
    }
  }

  // 4. Sincronización de UI con estado
  function updateUIFromSettings() {
    const themeBtns = document.querySelectorAll(".themeOptionBtn");
    themeBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.theme === settings.theme);
    });

    const bgPicker = document.getElementById("bgColorPicker");
    const bgHex = document.getElementById("bgColorHex");
    const textPicker = document.getElementById("textColorPicker");
    const textHex = document.getElementById("textColorHex");

    if (bgPicker) bgPicker.value = settings.bgColor;
    if (bgHex) bgHex.textContent = settings.bgColor.toUpperCase();
    if (textPicker) textPicker.value = settings.textColor;
    if (textHex) textHex.textContent = settings.textColor.toUpperCase();

    const modeBtns = document.querySelectorAll(".modeOptionBtn");
    modeBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === settings.mode);
    });

    const fontSelect = document.getElementById("fontFamilySelect");
    if (fontSelect) fontSelect.value = settings.font;

    const fontSizeDisplay = document.getElementById("fontSizeDisplay");
    if (fontSizeDisplay) fontSizeDisplay.textContent = `${settings.fontSize.toFixed(2)}em`;

    const btnBold = document.getElementById("btnBold");
    const btnItalic = document.getElementById("btnItalic");
    const btnUnderline = document.getElementById("btnUnderline");
    if (btnBold) btnBold.classList.toggle("active", settings.bold);
    if (btnItalic) btnItalic.classList.toggle("active", settings.italic);
    if (btnUnderline) btnUnderline.classList.toggle("active", settings.underline);

    const alignBtns = document.querySelectorAll(".alignBtn");
    alignBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.align === settings.align);
    });

    const toggleHyphens = document.getElementById("toggleHyphens");
    if (toggleHyphens) toggleHyphens.checked = (settings.hyphens === "auto");

    const paraSpacingDisplay = document.getElementById("paragraphSpacingDisplay");
    if (paraSpacingDisplay) paraSpacingDisplay.textContent = `${settings.paraSpacing.toFixed(2)}em`;

    const lineHeightDisplay = document.getElementById("lineHeightDisplay");
    if (lineHeightDisplay) lineHeightDisplay.textContent = settings.lineHeight.toFixed(1);

    const letterSpacingDisplay = document.getElementById("letterSpacingDisplay");
    if (letterSpacingDisplay) letterSpacingDisplay.textContent = `${settings.letterSpacing.toFixed(1)}px`;

    const marginTopDisplay = document.getElementById("marginTopDisplay");
    const marginBottomDisplay = document.getElementById("marginBottomDisplay");
    const marginLeftDisplay = document.getElementById("marginLeftDisplay");
    const marginRightDisplay = document.getElementById("marginRightDisplay");
    if (marginTopDisplay) marginTopDisplay.textContent = `${settings.marginTop}px`;
    if (marginBottomDisplay) marginBottomDisplay.textContent = `${settings.marginBottom}px`;
    if (marginLeftDisplay) marginLeftDisplay.textContent = `${settings.marginLeft}px`;
    if (marginRightDisplay) marginRightDisplay.textContent = `${settings.marginRight}px`;
  }

  // 5. Control del overlay anti-FOUC (Capa 2)
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

  // 5.1 Control de Transición Suave entre Páginas (Modo Paginado)
  let isPageTurning = false;
  let currentLocation = null;

  function turnPage(direction) {
    if (!rendition || settings.mode !== "paginated" || isPageTurning) return;

    // Evitar animación innecesaria si ya estamos al inicio o al final del libro
    const loc = (typeof rendition.currentLocation === "function" ? rendition.currentLocation() : null) || currentLocation;
    if (loc) {
      if (direction === "prev" && loc.atStart) return;
      if (direction === "next" && loc.atEnd) return;
    }

    isPageTurning = true;
    const isNext = direction === "next";
    const outOffset = isNext ? -18 : 18;
    const inOffset = isNext ? 18 : -18;

    // Fase 1: Salida suave (desplazamiento sutil + desvanecimiento rápido)
    viewer.style.transition = "transform 0.09s ease-out, opacity 0.09s ease-out";
    viewer.style.transform = `translateX(${outOffset}px)`;
    viewer.style.opacity = "0.15";

    setTimeout(() => {
      const pagePromise = isNext ? rendition.next() : rendition.prev();

      Promise.resolve(pagePromise)
        .catch(err => {
          console.warn("Page navigation warning:", err);
        })
        .finally(() => {
          // Posicionar instantáneamente en el lado opuesto para la entrada
          viewer.style.transition = "none";
          viewer.style.transform = `translateX(${inOffset}px)`;
          viewer.style.opacity = "0.15";

          // Forzar reflujo del navegador
          void viewer.offsetWidth;

          // Fase 2: Entrada suave a posición neutral
          viewer.style.transition = "transform 0.13s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.13s ease-out";
          viewer.style.transform = "translateX(0)";
          viewer.style.opacity = "1";

          setTimeout(() => {
            viewer.style.transition = "";
            viewer.style.transform = "";
            viewer.style.opacity = "";
            isPageTurning = false;
          }, 150);
        });
    }, 90);
  }

  let isLocationsReady = false;

  // 6. Inicialización del Libro
  initBook();

  function initBook() {
    book = ePub(epubUrl);

    if (settings.theme !== "custom") {
      readerApp.dataset.readerTheme = settings.theme;
    }
    readerApp.dataset.readerMode = settings.mode;
    readerApp.style.setProperty("--reader-bg", settings.bgColor);
    readerApp.style.setProperty("--reader-text", settings.textColor);

    ensureFontLoaded(settings.font, () => {
      updateUIFromSettings();
    });

    book.ready.then(() => {
      const metadata = book.package.metadata;
      readerTitle.textContent = metadata.title || "Lector Kasnia";

      if (loadingOverlay) {
        loadingOverlay.style.opacity = "0";
        setTimeout(() => loadingOverlay.style.display = "none", 300);
      }

      if (!isLocationsReady) {
        isLocationsReady = true;
        book.locations.generate(1600).then(() => {
          if (rendition) {
            try {
              const currentLocation = rendition.currentLocation();
              if (currentLocation && currentLocation.start && currentLocation.start.cfi) {
                const pct = book.locations.percentageFromCfi(currentLocation.start.cfi);
                if (pct !== null && !isNaN(pct)) {
                  const percentage = Math.max(0, Math.min(100, Math.round(pct * 100)));
                  progressEl.textContent = `${percentage}%`;
                }
              }
            } catch (_) {}
          }
        }).catch(() => {});
      }
    });

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
          closePanel(tocPanel, true);

          const hashIdx = href.indexOf('#');
          const baseHref = hashIdx !== -1 ? href.substring(0, hashIdx) : href;
          const fragment = hashIdx !== -1 ? href.substring(hashIdx + 1) : null;

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

          const displayTarget = fragment ? section.href + '#' + fragment : section.href;

          rendition.display(displayTarget).then(() => {
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
            rendition.display(section.href).catch(() => {
              scheduleHideOverlay();
            });
          });
        });
      });
    });

    renderBook();
  }

  // 7. Renderizado del Libro con Rendition
  function renderBook() {
    if (rendition) {
      rendition.destroy();
    }
    // Limpiar hooks huérfanos del spine para evitar que renditions destruidas disparen injectIdentifier
    if (book && book.spine && book.spine.hooks && book.spine.hooks.content) {
      book.spine.hooks.content.clear();
    }
    viewer.innerHTML = '';

    const flow = settings.mode === "paginated" ? "paginated" : "scrolled-doc";
    const manager = settings.mode === "paginated" ? "default" : "continuous";

    rendition = book.renderTo(viewer, {
      width: "100%",
      height: "100%",
      manager: manager,
      flow: flow,
      spread: "none",
      snap: true
    });

    // Patch defensivo en el prototipo de Rendition para proteger injectIdentifier contra referencias nulas
    if (rendition && rendition.constructor && rendition.constructor.prototype) {
      const proto = rendition.constructor.prototype;
      if (!proto._kasniaPatched) {
        proto._kasniaPatched = true;
        const origInjectIdentifier = proto.injectIdentifier;
        if (typeof origInjectIdentifier === "function") {
          proto.injectIdentifier = function (doc, section) {
            if (!this.book || !this.book.packaging || !this.book.packaging.metadata) {
              return;
            }
            return origInjectIdentifier.call(this, doc, section);
          };
        }
      }
    }

    if (!foucOverlay) {
      foucOverlay = document.createElement("div");
      foucOverlay.id = "foucOverlay";
      foucOverlay.className = "foucOverlay";
      viewer.parentElement.appendChild(foucOverlay);
    }
    foucOverlay.style.backgroundColor = settings.bgColor;
    showOverlay();

    rendition.on("rendering", showOverlay);

    rendition.hooks.content.register((contents) => {
      const doc = contents.document;
      if (!doc || !doc.documentElement) return;

      const fontInfo = FONT_PRESETS[settings.font];
      if (fontInfo && fontInfo.url && !doc.querySelector(`link[href="${fontInfo.url}"]`)) {
        const frameLink = doc.createElement("link");
        frameLink.rel = "stylesheet";
        frameLink.href = fontInfo.url;
        doc.head.appendChild(frameLink);
      }

      let preStyle = doc.getElementById("kasniaThemePreload");
      if (!preStyle) {
        preStyle = doc.createElement("style");
        preStyle.id = "kasniaThemePreload";
        doc.head.insertBefore(preStyle, doc.head.firstChild);
      }
      preStyle.textContent = generateReaderIframeCSS();

      if (rendition && rendition.manager && rendition.manager.container) {
        rendition.manager.container.style.setProperty("overflow-anchor", "none", "important");
      }

      if (settings.mode === "continuous") {
        contents.addStylesheetRules({
          "::-webkit-scrollbar": { "width": "8px" },
          "::-webkit-scrollbar-track": { "background": "transparent" },
          "::-webkit-scrollbar-thumb": { "background": "rgba(128,128,128,0.4)", "border-radius": "4px" }
        });
      }
    });

    Object.keys(THEME_PRESETS).forEach(key => {
      const preset = THEME_PRESETS[key];
      rendition.themes.register(key, {
        body: {
          background: "transparent !important",
          color: `${preset.text} !important`
        }
      });
    });

    if (THEME_PRESETS[settings.theme]) {
      rendition.themes.select(settings.theme);
    }
    rendition.themes.fontSize(`${settings.fontSize.toFixed(2)}em`);

    const savedLocation = localStorage.getItem(storageKey);
    if (savedLocation) {
      rendition.display(savedLocation);
    } else {
      rendition.display();
    }

    rendition.on("relocated", location => {
      scheduleHideOverlay();
      currentLocation = location;
      if (!location || !location.start || !location.start.cfi) return;

      localStorage.setItem(storageKey, location.start.cfi);

      if (settings.mode === "paginated") {
        btnPrev.style.visibility = location.atStart ? "hidden" : "visible";
        btnNext.style.visibility = location.atEnd ? "hidden" : "visible";
      }

      if (book.locations && (typeof book.locations.length === "function" ? book.locations.length() > 0 : (book.locations.length > 0 || book.locations.total > 0))) {
        try {
          const pct = book.locations.percentageFromCfi(location.start.cfi);
          if (pct !== null && !isNaN(pct)) {
            const percentage = Math.max(0, Math.min(100, Math.round(pct * 100)));
            progressEl.textContent = `${percentage}%`;
            return;
          }
        } catch (_) {}
      }

      if (location.start.index !== undefined && book && book.spine && book.spine.spineItems && book.spine.spineItems.length > 0) {
        const total = book.spine.spineItems.length;
        const current = location.start.index;
        const pct = Math.max(0, Math.min(100, Math.round((current / total) * 100)));
        progressEl.textContent = `${pct}%`;
      }
    });

    rendition.on("keyup", e => {
      if (e.key === "ArrowLeft") turnPage("prev");
      if (e.key === "ArrowRight") turnPage("next");
    });

    rendition.on("touchstart", handleTouchStart);
    rendition.on("touchmove", handleTouchMove);
    rendition.on("touchend", handleTouchEnd);
    rendition.on("click", handleClick);
  }

  // 8. Control Táctil y Gestos (Tap, Swipe, UI)
  let touchStartScreenX = 0;
  let touchStartScreenY = 0;
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
    const targetDoc = e.target && e.target.ownerDocument;
    const iframe = targetDoc && targetDoc.defaultView && targetDoc.defaultView !== window
      ? targetDoc.defaultView.frameElement
      : (viewerEl ? viewerEl.querySelector("iframe") : null);

    if (iframe) {
      const iframeRect = iframe.getBoundingClientRect();
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
    touchStartTime = Date.now();
  }

  function handleTouchMove() {}

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

    if (e.target && e.target.closest && e.target.closest("a, button, input, select, textarea")) {
      return;
    }

    // Swipe en modo paginado
    if (settings.mode === "paginated" && absX >= 40 && absX > absY * 1.2 && elapsed < 800) {
      lastSwipeTime = Date.now();
      if (deltaX < 0) {
        turnPage("next");
      } else {
        turnPage("prev");
      }
      return;
    }

    // Tap en pantalla
    if (absX < 15 && absY < 15 && elapsed < 500) {
      const ratio = getEventPositionRatio(e);

      if (settings.mode === "paginated") {
        if (ratio < 0.25) {
          turnPage("prev");
        } else if (ratio > 0.75) {
          turnPage("next");
        } else {
          readerApp.classList.toggle("ui-hidden");
        }
      } else {
        if (ratio >= 0.15 && ratio <= 0.85) {
          readerApp.classList.toggle("ui-hidden");
        }
      }
    }
  }

  function handleClick(e) {
    if (Date.now() - lastTouchEndTime < 500) return;
    if (e.target && e.target.closest && e.target.closest("a, button, input, select, textarea")) return;

    const ratio = getEventPositionRatio(e);

    if (settings.mode === "paginated") {
      if (ratio < 0.25) {
        turnPage("prev");
      } else if (ratio > 0.75) {
        turnPage("next");
      } else {
        readerApp.classList.toggle("ui-hidden");
      }
    } else {
      if (ratio >= 0.15 && ratio <= 0.85) {
        readerApp.classList.toggle("ui-hidden");
      }
    }
  }

  const readerContainer = document.getElementById("readerContainer");
  if (readerContainer) {
    readerContainer.addEventListener("touchstart", handleTouchStart, { passive: true });
    readerContainer.addEventListener("touchmove", handleTouchMove, { passive: true });
    readerContainer.addEventListener("touchend", handleTouchEnd, { passive: true });
    readerContainer.addEventListener("click", handleClick);
  }

  // 9. Configuración de Event Listeners de UI
  btnPrev.addEventListener("click", () => {
    if (Date.now() - lastSwipeTime < 500) return;
    turnPage("prev");
  });

  btnNext.addEventListener("click", () => {
    if (Date.now() - lastSwipeTime < 500) return;
    turnPage("next");
  });

  document.addEventListener("keyup", e => {
    if (settings.mode === "paginated" && rendition) {
      if (e.key === "ArrowLeft") turnPage("prev");
      if (e.key === "ArrowRight") turnPage("next");
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (tocPanel && tocPanel.style.display === "flex") closePanel(tocPanel);
      if (settingsPanel && settingsPanel.style.display === "flex") closePanel(settingsPanel);
    }
  });

  btnClose.addEventListener("click", () => {
    window.history.back();
  });

  // Control de Modales (Apertura y Cierre con Animación)
  function openPanel(panel) {
    if (!panel) return;
    const otherPanel = panel === tocPanel ? settingsPanel : tocPanel;
    if (otherPanel && otherPanel.style.display === "flex") {
      closePanel(otherPanel, true);
    }
    panel.classList.remove("isClosing");
    panel.style.display = "flex";
  }

  function closePanel(panel, immediate = false) {
    if (!panel || panel.style.display !== "flex") return;

    if (immediate) {
      panel.classList.remove("isClosing");
      panel.style.display = "none";
      return;
    }

    if (panel.classList.contains("isClosing")) return;
    panel.classList.add("isClosing");

    const onEnd = () => {
      panel.removeEventListener("animationend", onEnd);
      panel.classList.remove("isClosing");
      panel.style.display = "none";
    };

    panel.addEventListener("animationend", onEnd, { once: true });
    setTimeout(() => {
      if (panel.classList.contains("isClosing")) {
        panel.classList.remove("isClosing");
        panel.style.display = "none";
      }
    }, 250);
  }

  function togglePanel(panel) {
    if (panel.style.display === "flex" && !panel.classList.contains("isClosing")) {
      closePanel(panel);
    } else {
      openPanel(panel);
    }
  }

  btnToc.addEventListener("click", () => togglePanel(tocPanel));
  btnSettings.addEventListener("click", () => togglePanel(settingsPanel));

  panelCloseBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      const panel = e.currentTarget.closest(".readerModalOverlay");
      if (panel) closePanel(panel);
    });
  });

  [tocPanel, settingsPanel].forEach(panel => {
    panel.addEventListener("click", e => {
      if (e.target === panel) closePanel(panel);
    });
  });

  // Tema y Colores
  const themeBtns = document.querySelectorAll(".themeOptionBtn");
  themeBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      const selectedTheme = e.currentTarget.dataset.theme;
      if (THEME_PRESETS[selectedTheme]) {
        settings.theme = selectedTheme;
        settings.bgColor = THEME_PRESETS[selectedTheme].bg;
        settings.textColor = THEME_PRESETS[selectedTheme].text;
        readerApp.dataset.readerTheme = selectedTheme;

        saveSettings();
        updateUIFromSettings();
        updateIframeStyles();

        if (rendition) {
          rendition.themes.select(selectedTheme);
        }
      }
    });
  });

  const bgPicker = document.getElementById("bgColorPicker");
  if (bgPicker) {
    bgPicker.addEventListener("input", e => {
      settings.bgColor = e.target.value;
      settings.theme = "custom";
      delete readerApp.dataset.readerTheme;

      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  const textPicker = document.getElementById("textColorPicker");
  if (textPicker) {
    textPicker.addEventListener("input", e => {
      settings.textColor = e.target.value;
      settings.theme = "custom";
      delete readerApp.dataset.readerTheme;

      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  // Modo de lectura
  const modeBtns = document.querySelectorAll(".modeOptionBtn");
  modeBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      const selectedMode = e.currentTarget.dataset.mode;
      if (settings.mode === selectedMode && rendition) return;

      settings.mode = selectedMode;
      readerApp.dataset.readerMode = selectedMode;

      saveSettings();
      updateUIFromSettings();
      renderBook();
    });
  });

  // Tipografía
  const fontSelect = document.getElementById("fontFamilySelect");
  if (fontSelect) {
    fontSelect.addEventListener("change", e => {
      const selectedFont = e.target.value;
      settings.font = selectedFont;
      saveSettings();

      ensureFontLoaded(selectedFont, () => {
        updateUIFromSettings();
        updateIframeStyles();
      });
    });
  }

  // Tamaño de texto en em
  const btnIncFont = document.getElementById("increaseFontBtn");
  const btnDecFont = document.getElementById("decreaseFontBtn");

  if (btnIncFont) {
    btnIncFont.addEventListener("click", () => {
      settings.fontSize = Math.min(2.5, +(settings.fontSize + 0.05).toFixed(2));
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
      if (rendition) rendition.themes.fontSize(`${settings.fontSize.toFixed(2)}em`);
    });
  }

  if (btnDecFont) {
    btnDecFont.addEventListener("click", () => {
      settings.fontSize = Math.max(0.6, +(settings.fontSize - 0.05).toFixed(2));
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
      if (rendition) rendition.themes.fontSize(`${settings.fontSize.toFixed(2)}em`);
    });
  }

  // Formato
  const btnBold = document.getElementById("btnBold");
  const btnItalic = document.getElementById("btnItalic");
  const btnUnderline = document.getElementById("btnUnderline");

  if (btnBold) {
    btnBold.addEventListener("click", () => {
      settings.bold = !settings.bold;
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  if (btnItalic) {
    btnItalic.addEventListener("click", () => {
      settings.italic = !settings.italic;
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  if (btnUnderline) {
    btnUnderline.addEventListener("click", () => {
      settings.underline = !settings.underline;
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  // Alineación
  const alignBtns = document.querySelectorAll(".alignBtn");
  alignBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      settings.align = e.currentTarget.dataset.align;
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  });

  // Separación de sílabas
  const toggleHyphens = document.getElementById("toggleHyphens");
  if (toggleHyphens) {
    toggleHyphens.addEventListener("change", e => {
      settings.hyphens = e.target.checked ? "auto" : "none";
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  // Espaciados
  const incParaBtn = document.getElementById("incParaSpacingBtn");
  const decParaBtn = document.getElementById("decParaSpacingBtn");
  if (incParaBtn) {
    incParaBtn.addEventListener("click", () => {
      settings.paraSpacing = Math.min(3.0, +(settings.paraSpacing + 0.25).toFixed(2));
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }
  if (decParaBtn) {
    decParaBtn.addEventListener("click", () => {
      settings.paraSpacing = Math.max(0.0, +(settings.paraSpacing - 0.25).toFixed(2));
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  const incLineBtn = document.getElementById("incLineHeightBtn");
  const decLineBtn = document.getElementById("decLineHeightBtn");
  if (incLineBtn) {
    incLineBtn.addEventListener("click", () => {
      settings.lineHeight = Math.min(2.8, +(settings.lineHeight + 0.1).toFixed(1));
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }
  if (decLineBtn) {
    decLineBtn.addEventListener("click", () => {
      settings.lineHeight = Math.max(1.0, +(settings.lineHeight - 0.1).toFixed(1));
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  const incLetterBtn = document.getElementById("incLetterSpacingBtn");
  const decLetterBtn = document.getElementById("decLetterSpacingBtn");
  if (incLetterBtn) {
    incLetterBtn.addEventListener("click", () => {
      settings.letterSpacing = Math.min(3.0, +(settings.letterSpacing + 0.5).toFixed(1));
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }
  if (decLetterBtn) {
    decLetterBtn.addEventListener("click", () => {
      settings.letterSpacing = Math.max(-0.5, +(settings.letterSpacing - 0.5).toFixed(1));
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  // Márgenes
  const incMtBtn = document.getElementById("incMarginTopBtn");
  const decMtBtn = document.getElementById("decMarginTopBtn");
  if (incMtBtn) {
    incMtBtn.addEventListener("click", () => {
      settings.marginTop = Math.min(100, settings.marginTop + 5);
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }
  if (decMtBtn) {
    decMtBtn.addEventListener("click", () => {
      settings.marginTop = Math.max(0, settings.marginTop - 5);
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  const incMbBtn = document.getElementById("incMarginBottomBtn");
  const decMbBtn = document.getElementById("decMarginBottomBtn");
  if (incMbBtn) {
    incMbBtn.addEventListener("click", () => {
      settings.marginBottom = Math.min(100, settings.marginBottom + 5);
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }
  if (decMbBtn) {
    decMbBtn.addEventListener("click", () => {
      settings.marginBottom = Math.max(0, settings.marginBottom - 5);
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  const incMlBtn = document.getElementById("incMarginLeftBtn");
  const decMlBtn = document.getElementById("decMarginLeftBtn");
  if (incMlBtn) {
    incMlBtn.addEventListener("click", () => {
      settings.marginLeft = Math.min(80, settings.marginLeft + 5);
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }
  if (decMlBtn) {
    decMlBtn.addEventListener("click", () => {
      settings.marginLeft = Math.max(0, settings.marginLeft - 5);
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  const incMrBtn = document.getElementById("incMarginRightBtn");
  const decMrBtn = document.getElementById("decMarginRightBtn");
  if (incMrBtn) {
    incMrBtn.addEventListener("click", () => {
      settings.marginRight = Math.min(80, settings.marginRight + 5);
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }
  if (decMrBtn) {
    decMrBtn.addEventListener("click", () => {
      settings.marginRight = Math.max(0, settings.marginRight - 5);
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  // Restablecer Ajustes por Defecto
  const resetBtn = document.getElementById("resetSettingsBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      settings = { ...DEFAULT_SETTINGS };
      readerApp.dataset.readerTheme = settings.theme;
      readerApp.dataset.readerMode = settings.mode;

      saveSettings();
      ensureFontLoaded(settings.font, () => {
        updateUIFromSettings();
        updateIframeStyles();
        if (rendition) {
          rendition.themes.select(settings.theme);
          rendition.themes.fontSize(`${settings.fontSize.toFixed(2)}em`);
        }
      });
    });
  }

});
