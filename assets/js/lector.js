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
  const readerContainer = document.getElementById("readerContainer");
  const viewer = document.getElementById("viewer");
  const progressEl = document.getElementById("readerProgress");

  // Botones de cabecera y navegación
  const btnClose = document.getElementById("readerCloseBtn");
  const btnToc = document.getElementById("readerTocBtn");
  const btnSettings = document.getElementById("readerSettingsBtn");
  const btnPrev = document.getElementById("readerPrev");
  const btnNext = document.getElementById("readerNext");

  // Modales y Loader
  const tocPanel = document.getElementById("readerTocPanel");
  const settingsPanel = document.getElementById("readerSettingsPanel");
  const tocList = document.getElementById("readerTocList");
  const panelCloseBtns = document.querySelectorAll(".closePanelBtn");
  const loadingOverlay = document.getElementById("readerLoadingOverlay");

  // Elementos de Ajustes
  const themeBtns = document.querySelectorAll(".themeOptionBtn");
  const bgPicker = document.getElementById("bgColorPicker");
  const bgHex = document.getElementById("bgColorHex");
  const textPicker = document.getElementById("textColorPicker");
  const textHex = document.getElementById("textColorHex");
  const modeBtns = document.querySelectorAll(".modeOptionBtn");
  const fontSelect = document.getElementById("fontFamilySelect");
  const fontLoadingIndicator = document.getElementById("fontLoadingIndicator");
  const fontSizeDisplay = document.getElementById("fontSizeDisplay");
  const btnBold = document.getElementById("btnBold");
  const btnItalic = document.getElementById("btnItalic");
  const btnUnderline = document.getElementById("btnUnderline");
  const alignBtns = document.querySelectorAll(".alignBtn");
  const toggleHyphens = document.getElementById("toggleHyphens");
  const paraSpacingDisplay = document.getElementById("paragraphSpacingDisplay");
  const lineHeightDisplay = document.getElementById("lineHeightDisplay");
  const letterSpacingDisplay = document.getElementById("letterSpacingDisplay");
  const marginTopDisplay = document.getElementById("marginTopDisplay");
  const marginBottomDisplay = document.getElementById("marginBottomDisplay");
  const marginLeftDisplay = document.getElementById("marginLeftDisplay");
  const marginRightDisplay = document.getElementById("marginRightDisplay");
  const resetBtn = document.getElementById("resetSettingsBtn");

  // Steppers
  const btnIncFont = document.getElementById("increaseFontBtn");
  const btnDecFont = document.getElementById("decreaseFontBtn");
  const incPsBtn = document.getElementById("incParaSpacingBtn");
  const decPsBtn = document.getElementById("decParaSpacingBtn");
  const incLhBtn = document.getElementById("incLineHeightBtn");
  const decLhBtn = document.getElementById("decLineHeightBtn");
  const incLsBtn = document.getElementById("incLetterSpacingBtn");
  const decLsBtn = document.getElementById("decLetterSpacingBtn");
  const incMtBtn = document.getElementById("incMarginTopBtn");
  const decMtBtn = document.getElementById("decMarginTopBtn");
  const incMbBtn = document.getElementById("incMarginBottomBtn");
  const decMbBtn = document.getElementById("decMarginBottomBtn");
  const incMlBtn = document.getElementById("incMarginLeftBtn");
  const decMlBtn = document.getElementById("decMarginLeftBtn");
  const incMrBtn = document.getElementById("incMarginRightBtn");
  const decMrBtn = document.getElementById("decMarginRightBtn");

  // 1. Catálogos y constantes de configuración
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

  const THEME_PRESETS = {
    light: { bg: "#fdfdfd", text: "#222222", headerBg: "#f5f5f5", border: "#dddddd", accent: "#e6528b" },
    dark: { bg: "#121212", text: "#e0e0e0", headerBg: "#1e1e1e", border: "#333333", accent: "#ff9ac5" },
    sepia: { bg: "#f4ecd8", text: "#5b4636", headerBg: "#e8dcc4", border: "#d3c4a8", accent: "#e6528b" },
    grey: { bg: "#2e3440", text: "#eceff4", headerBg: "#282e3a", border: "#434c5e", accent: "#ff9ac5" }
  };

  const SETTING_LIMITS = {
    fontSize: { min: 0.6, max: 2.5, step: 0.05, precision: 2 },
    paraSpacing: { min: 0.0, max: 3.0, step: 0.1, precision: 2 },
    lineHeight: { min: 1.0, max: 2.8, step: 0.1, precision: 2 },
    letterSpacing: { min: -2.0, max: 8.0, step: 0.5, precision: 1 },
    marginTop: { min: 0, max: 100, step: 5, precision: 0 },
    marginBottom: { min: 0, max: 100, step: 5, precision: 0 },
    marginLeft: { min: 0, max: 80, step: 5, precision: 0 },
    marginRight: { min: 0, max: 80, step: 5, precision: 0 }
  };

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
    lineHeight: 1.5,
    letterSpacing: 0.0,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 10,
    marginRight: 10
  };

  let settings = { ...DEFAULT_SETTINGS };

  // Variables de ciclo de vida del lector
  let book = null;
  let rendition = null;
  let foucOverlay = null;
  let foucHideTimer = null;
  let isPageTurning = false;
  let isLocationsReady = false;
  let currentLocation = null;

  const storageKey = `kasnia_progress_${btoa(epubUrl).replace(/=/g, "")}`;
  const locationsKey = `kasnia_locations_${btoa(epubUrl).replace(/=/g, "")}`;
  const loadedFonts = new Set(["'Open Sans', sans-serif", "'Merriweather', serif"]);

  // 2. Persistencia y carga de ajustes
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

    const parseBounded = (key, isFloat = true) => {
      const raw = localStorage.getItem(`kasnia_reader_${key === "fontSize" ? "font_size" : key.replace(/([A-Z])/g, "_$1").toLowerCase()}`);
      if (!raw) return;
      const val = isFloat ? parseFloat(raw) : parseInt(raw, 10);
      const limits = SETTING_LIMITS[key];
      if (!isNaN(val) && val >= limits.min && val <= limits.max) {
        settings[key] = val;
      }
    };

    parseBounded("fontSize", true);
    parseBounded("paraSpacing", true);
    parseBounded("lineHeight", true);
    parseBounded("letterSpacing", true);
    parseBounded("marginTop", false);
    parseBounded("marginBottom", false);
    parseBounded("marginLeft", false);
    parseBounded("marginRight", false);

    const savedBold = localStorage.getItem("kasnia_reader_bold");
    if (savedBold !== null) settings.bold = savedBold === "true";

    const savedItalic = localStorage.getItem("kasnia_reader_italic");
    if (savedItalic !== null) settings.italic = savedItalic === "true";

    const savedUnderline = localStorage.getItem("kasnia_reader_underline");
    if (savedUnderline !== null) settings.underline = savedUnderline === "true";

    const savedAlign = localStorage.getItem("kasnia_reader_align");
    if (["justify", "left", "center"].includes(savedAlign)) {
      settings.align = savedAlign;
    }

    const savedHyphens = localStorage.getItem("kasnia_reader_hyphens");
    if (savedHyphens === "auto" || savedHyphens === "none") {
      settings.hyphens = savedHyphens;
    }
  }

  function saveSettings() {
    localStorage.setItem("kasnia_reader_theme", settings.theme);
    localStorage.setItem("kasnia_reader_bg_color", settings.bgColor);
    localStorage.setItem("kasnia_reader_text_color", settings.textColor);
    localStorage.setItem("kasnia_reader_mode", settings.mode);
    localStorage.setItem("kasnia_reader_font", settings.font);
    localStorage.setItem("kasnia_reader_font_size", settings.fontSize);
    localStorage.setItem("kasnia_reader_bold", settings.bold);
    localStorage.setItem("kasnia_reader_italic", settings.italic);
    localStorage.setItem("kasnia_reader_underline", settings.underline);
    localStorage.setItem("kasnia_reader_align", settings.align);
    localStorage.setItem("kasnia_reader_hyphens", settings.hyphens);
    localStorage.setItem("kasnia_reader_para_spacing", settings.paraSpacing);
    localStorage.setItem("kasnia_reader_line_height", settings.lineHeight);
    localStorage.setItem("kasnia_reader_letter_spacing", settings.letterSpacing);
    localStorage.setItem("kasnia_reader_margin_top", settings.marginTop);
    localStorage.setItem("kasnia_reader_margin_bottom", settings.marginBottom);
    localStorage.setItem("kasnia_reader_margin_left", settings.marginLeft);
    localStorage.setItem("kasnia_reader_margin_right", settings.marginRight);
  }

  // 2. Control de fuentes dinámicas
  function ensureFontLoaded(fontFamily, callback) {
    const fontInfo = FONT_PRESETS[fontFamily];
    if (!fontInfo || !fontInfo.url) {
      if (callback) callback();
      return;
    }

    if (fontLoadingIndicator && !loadedFonts.has(fontFamily)) {
      fontLoadingIndicator.style.display = "inline";
    }

    let link = document.getElementById("kasniaCustomFontHost");
    if (!link) {
      link = document.createElement("link");
      link.id = "kasniaCustomFontHost";
      link.rel = "stylesheet";
      link.href = fontInfo.url;
      document.head.appendChild(link);
    } else if (link.href !== fontInfo.url) {
      link.href = fontInfo.url;
    }

    if (rendition) {
      const contents = rendition.getContents();
      contents.forEach(content => {
        const doc = content.document;
        if (doc) {
          let frameLink = doc.getElementById("kasniaCustomFontIframe");
          if (!frameLink) {
            frameLink = doc.createElement("link");
            frameLink.id = "kasniaCustomFontIframe";
            frameLink.rel = "stylesheet";
            frameLink.href = fontInfo.url;
            doc.head.appendChild(frameLink);
          } else if (frameLink.href !== fontInfo.url) {
            frameLink.href = fontInfo.url;
          }
        }
      });
    }

    if (loadedFonts.has(fontFamily)) {
      if (callback) callback();
      return;
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
    const touchAction = settings.mode === "continuous" ? "pan-y !important" : "none !important";
    const alignVal = settings.align || "justify";

    return (
      "html {" +
        "background: transparent !important;" +
        "-webkit-tap-highlight-color: transparent !important;" +
        "-webkit-touch-callout: none !important;" +
        "-webkit-user-select: none !important;" +
        "user-select: none !important;" +
        "touch-action: " + touchAction + ";" +
      "}" +
      "body {" +
        "background: transparent !important;" +
        "color: " + settings.textColor + " !important;" +
        "font-family: " + settings.font + " !important;" +
        "font-size: " + settings.fontSize.toFixed(2) + "em !important;" +
        "font-weight: " + fontWeightVal + ";" +
        "font-style: " + fontStyleVal + ";" +
        "text-decoration: " + textDecorVal + ";" +
        "text-align: " + alignVal + " !important;" +
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
        "touch-action: " + touchAction + ";" +
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
      "p, li, blockquote, dd, dt {" +
        "text-align: " + alignVal + " !important;" +
      "}" +
      "p {" +
        "margin-top: 0 !important;" +
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
      // Preservar y priorizar alineaciones explícitas de portadas, títulos, firmas y párrafos especiales del EPUB
      ".centrado, .centrado *, .centro, .centro *, .center, .center *, .text-center, .text-center *, .c, .c *, " +
      ".titulo, .titulo *, .subtitulo, .subtitulo *, .autor, .autor *, .dedicatoria, .dedicatoria *, .epigrafe, .epigrafe *, .logo, .logo *, " +
      "figcaption, figcaption *, caption, caption *, " +
      "p.centrado, p.centro, p.center, p.text-center, p.c, p.titulo, p.subtitulo, p.autor, p.dedicatoria, p.epigrafe, p.logo, " +
      "div.centrado p, div.centro p, div.center p, div.text-center p, " +
      "[align='center'], [align='center'] *, [style*='text-align: center'], [style*='text-align: center'] *, [style*='text-align:center'], [style*='text-align:center'] * { text-align: center !important; }" +
      ".derecha, .derecha *, .der, .der *, .right, .right *, .text-right, .text-right *, .d, .d *, .firma, .firma *, .fecha, .fecha *, " +
      "p.derecha, p.der, p.right, p.text-right, p.d, p.firma, p.fecha, " +
      "div.derecha p, div.der p, div.right p, " +
      "[align='right'], [align='right'] *, [style*='text-align: right'], [style*='text-align: right'] *, [style*='text-align:right'], [style*='text-align:right'] * { text-align: right !important; }" +
      ".izquierda, .izquierda *, .izq, .izq *, .left, .left *, .text-left, .text-left *, " +
      "p.izquierda, p.izq, p.left, p.text-left, " +
      "div.izquierda p, div.izq p, div.left p, " +
      "[align='left'], [align='left'] *, [style*='text-align: left'], [style*='text-align: left'] *, [style*='text-align:left'], [style*='text-align:left'] * { text-align: left !important; }" +
      (settings.bold ? "p, div, span, li, a, h1, h2, h3, h4, h5, h6 { font-weight: bold !important; }" : "") +
      (settings.italic ? "p, div, span, li, a, h1, h2, h3, h4, h5, h6 { font-style: italic !important; }" : "") +
      (settings.underline ? "p, div, span, li, a { text-decoration: underline !important; }" : "")
    );
  }

  // Actualización en tiempo real de iframes y tema visual
  function updateIframeStyles() {
    readerApp.style.setProperty("--reader-bg", settings.bgColor);
    readerApp.style.setProperty("--reader-text", settings.textColor);
    readerApp.style.setProperty("--reader-header-bg", settings.theme === "light" ? "#f5f5f5" : (settings.theme === "sepia" ? "#e8dcc4" : (settings.theme === "grey" ? "#282e3a" : "#1e1e1e")));
    readerApp.style.setProperty("--reader-border", settings.theme === "light" ? "#dddddd" : (settings.theme === "sepia" ? "#d3c4a8" : (settings.theme === "grey" ? "#434c5e" : "#333333")));
    readerApp.style.setProperty("--reader-accent", settings.theme === "light" || settings.theme === "sepia" ? "#e6528b" : "#ff9ac5");

    if (viewer) {
      viewer.style.backgroundColor = settings.bgColor;
    }

    if (foucOverlay) {
      foucOverlay.style.backgroundColor = settings.bgColor;
    }

    if (rendition) {
      const cssString = generateReaderIframeCSS();
      const contents = rendition.getContents();
      contents.forEach(content => {
        const doc = content.document;
        if (doc) {
          let styleEl = doc.getElementById("kasniaThemePreload");
          if (!styleEl) {
            styleEl = doc.createElement("style");
            styleEl.id = "kasniaThemePreload";
            doc.head.appendChild(styleEl);
          }
          styleEl.textContent = cssString;

          // Inyectar fuente personalizada si no está
          const fontInfo = FONT_PRESETS[settings.font];
          if (fontInfo && fontInfo.url) {
            let frameLink = doc.getElementById("kasniaCustomFontIframe");
            if (!frameLink) {
              frameLink = doc.createElement("link");
              frameLink.id = "kasniaCustomFontIframe";
              frameLink.rel = "stylesheet";
              frameLink.href = fontInfo.url;
              doc.head.appendChild(frameLink);
            } else if (frameLink.href !== fontInfo.url) {
              frameLink.href = fontInfo.url;
            }
          }
        }
      });
    }
  }

  // 4. Sincronización de UI con estado
  function updateUIFromSettings() {
    themeBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.theme === settings.theme);
    });

    if (bgPicker) bgPicker.value = settings.bgColor;
    if (bgHex) bgHex.textContent = settings.bgColor.toUpperCase();
    if (textPicker) textPicker.value = settings.textColor;
    if (textHex) textHex.textContent = settings.textColor.toUpperCase();

    modeBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.mode === settings.mode);
    });

    if (fontSelect) fontSelect.value = settings.font;
    if (fontSizeDisplay) fontSizeDisplay.textContent = `${settings.fontSize.toFixed(2)}em`;

    if (btnBold) btnBold.classList.toggle("active", settings.bold);
    if (btnItalic) btnItalic.classList.toggle("active", settings.italic);
    if (btnUnderline) btnUnderline.classList.toggle("active", settings.underline);

    alignBtns.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.align === settings.align);
    });

    if (toggleHyphens) toggleHyphens.checked = settings.hyphens === "auto";

    if (paraSpacingDisplay) paraSpacingDisplay.textContent = `${settings.paraSpacing.toFixed(2)}em`;
    if (lineHeightDisplay) lineHeightDisplay.textContent = settings.lineHeight.toFixed(1);
    if (letterSpacingDisplay) letterSpacingDisplay.textContent = `${settings.letterSpacing.toFixed(1)}px`;

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

  // 5.1 Detección de extremos (Primera y Última Página)
  function isAtBeginning() {
    if (!currentLocation) return false;
    if (currentLocation.atStart === true) return true;
    if (currentLocation.start && currentLocation.start.index === 0) {
      if (currentLocation.start.displayed && currentLocation.start.displayed.page > 1) {
        return false;
      }
      return true;
    }
    return false;
  }

  function isAtEnding() {
    if (!currentLocation) return false;
    if (currentLocation.atEnd === true) return true;
    if (currentLocation.end && book && book.spine && book.spine.spineItems && book.spine.spineItems.length > 0) {
      const lastIndex = book.spine.spineItems.length - 1;
      if (currentLocation.end.index >= lastIndex) {
        if (currentLocation.end.displayed && currentLocation.end.displayed.total && currentLocation.end.displayed.page < currentLocation.end.displayed.total) {
          return false;
        }
        return true;
      }
    }
    return false;
  }

  // 5.2 Actualización y Persistencia del Progreso
  function updateProgress(loc) {
    if (!progressEl) return;
    const location = loc || currentLocation || (typeof rendition?.currentLocation === "function" ? rendition.currentLocation() : null);
    if (!location || !location.start || !location.start.cfi) return;

    if (isLocationsReady && book && book.locations && book.locations.length() > 0) {
      try {
        const pct = book.locations.percentageFromCfi(location.start.cfi);
        if (pct !== null && !isNaN(pct)) {
          const percentage = Math.max(0, Math.min(100, Math.round(pct * 100)));
          progressEl.textContent = `${percentage}%`;
          try {
            localStorage.setItem(`${storageKey}_pct`, percentage.toString());
          } catch (_) {}
          return;
        }
      } catch (_) {}
    }

    // Si las locations aún no están generadas, mantener el porcentaje previo de localStorage si existe
    const savedPct = localStorage.getItem(`${storageKey}_pct`);
    if (savedPct) {
      progressEl.textContent = `${savedPct}%`;
    }
  }

  // 5.3 Control de Transición Suave entre Páginas (Modo Paginado)
  function turnPage(direction) {
    if (!rendition || settings.mode !== "paginated" || isPageTurning) return;
    const isNext = direction === "next";

    // No animar ni ejecutar transición si ya se está en el extremo correspondiente
    if (!isNext && isAtBeginning()) return;
    if (isNext && isAtEnding()) return;

    isPageTurning = true;
    const outOffset = isNext ? -14 : 14;
    const inOffset = isNext ? 14 : -14;

    // Fase 1: Salida suave con desvanecimiento completo para enmascarar el repintado de epub.js
    viewer.style.transition = "transform 0.07s ease-out, opacity 0.07s ease-out";
    viewer.style.transform = `translateX(${outOffset}px)`;
    viewer.style.opacity = "0";

    setTimeout(() => {
      Promise.resolve()
        .then(() => (isNext ? rendition.next() : rendition.prev()))
        .catch(err => {
          console.warn("Page navigation warning:", err);
        })
        .finally(() => {
          // Posicionar instantáneamente en el lado opuesto para la entrada
          viewer.style.transition = "none";
          viewer.style.transform = `translateX(${inOffset}px)`;
          viewer.style.opacity = "0";

          // Forzar reflujo del navegador
          void viewer.offsetWidth;

          requestAnimationFrame(() => {
            // Fase 2: Entrada suave a posición neutral
            viewer.style.transition = "transform 0.10s cubic-bezier(0.2, 0.8, 0.35, 1), opacity 0.10s ease-out";
            viewer.style.transform = "translateX(0)";
            viewer.style.opacity = "1";

            setTimeout(() => {
              viewer.style.transition = "";
              viewer.style.transform = "";
              viewer.style.opacity = "";
              isPageTurning = false;
            }, 110);
          });
        });
    }, 70);
  }

  // 6. Inicialización del Libro
  initBook();

  function showInitError(msg) {
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `
        <div style="text-align:center; padding: 2rem; max-width: 400px;">
          <p style="color: var(--reader-accent, #ff9ac5); font-size: 1.1rem; margin-bottom: 1rem; font-weight: 600;">${msg}</p>
          <button id="readerRetryBtn" class="resetSettingsBtn" style="width: auto; padding: 0.5rem 1.5rem; margin-top: 0.5rem; cursor: pointer;">Volver al catálogo</button>
        </div>
      `;
      const retryBtn = document.getElementById("readerRetryBtn");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => {
          if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
            window.history.back();
          } else {
            window.location.href = "/novelas/";
          }
        });
      }
    }
    if (readerTitle) readerTitle.textContent = "Error de carga";
  }

  function initBook() {
    try {
      book = ePub(epubUrl);
    } catch (err) {
      console.error("Error al instanciar ePub:", err);
      showInitError("Error al abrir el archivo EPUB.");
      return;
    }

    if (settings.theme !== "custom") {
      readerApp.dataset.readerTheme = settings.theme;
    }
    readerApp.dataset.readerMode = settings.mode;
    readerApp.style.setProperty("--reader-bg", settings.bgColor);
    readerApp.style.setProperty("--reader-text", settings.textColor);

    // Cargar locations cacheadas si existen para cálculo instantáneo y preciso desde la recarga
    const savedLocationsData = localStorage.getItem(locationsKey);
    if (savedLocationsData) {
      try {
        book.locations.load(savedLocationsData);
        isLocationsReady = true;
      } catch (e) {
        console.warn("No se pudieron cargar las locations cacheadas:", e);
      }
    }

    // Restaurar inmediatamente el último porcentaje guardado en UI
    const savedPct = localStorage.getItem(`${storageKey}_pct`);
    if (savedPct && progressEl) {
      progressEl.textContent = `${savedPct}%`;
    }

    ensureFontLoaded(settings.font, () => {
      updateUIFromSettings();
    });

    book.ready.then(() => {
      const metadata = (book.package && book.package.metadata) || {};
      readerTitle.textContent = metadata.title || "Lector Kasnia";
      document.title = `${metadata.title || "Lector"} - Kasnia Project`;

      if (loadingOverlay) {
        loadingOverlay.style.opacity = "0";
        setTimeout(() => {
          loadingOverlay.style.display = "none";
          readerApp.classList.remove("ui-hidden");
        }, 300);
      }

      if (!isLocationsReady) {
        book.locations.generate(1600).then(() => {
          isLocationsReady = true;
          try {
            localStorage.setItem(locationsKey, book.locations.save());
          } catch (_) {}
          updateProgress();
        }).catch(() => {});
      }
    }).catch(err => {
      console.error("Error al cargar el libro:", err);
      showInitError("Error al cargar el libro.");
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
            scheduleHideOverlay();
            window.scrollTo(0, 0);
            if (fragment && settings.mode === "continuous") {
              setTimeout(() => {
                const contents = rendition.getContents();
                if (contents && contents.length > 0) {
                  const doc = contents[0].document;
                  const target = doc.getElementById(fragment);
                  if (target && doc.defaultView) {
                    const rect = target.getBoundingClientRect();
                    const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
                    doc.defaultView.scrollTo({ top: scrollTop + rect.top, behavior: "instant" });
                  }
                }
                window.scrollTo(0, 0);
              }, 150);
            }
          }).catch(() => {
            rendition.display(section.href).then(() => {
              scheduleHideOverlay();
              window.scrollTo(0, 0);
            }).catch(() => {
              scheduleHideOverlay();
              window.scrollTo(0, 0);
            });
          });
        });
      });
    }).catch(err => {
      console.warn("No se pudo cargar la navegación del TOC:", err);
    });

    renderBook();
  }

  // 7. Renderizado del Libro con Rendition
  function renderBook() {
    isPageTurning = false;

    if (rendition) {
      rendition.destroy();
      rendition = null;
    }

    // Limpiar hooks huérfanos del spine para evitar que renditions destruidas disparen injectIdentifier
    if (book && book.spine && book.spine.hooks && book.spine.hooks.content) {
      book.spine.hooks.content.clear();
    }

    viewer.innerHTML = "";
    viewer.style.transition = "";
    viewer.style.transform = "";
    viewer.style.opacity = "";

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
    if (typeof Rendition !== "undefined" && Rendition.prototype && Rendition.prototype.injectIdentifier) {
      const originalInjectIdentifier = Rendition.prototype.injectIdentifier;
      Rendition.prototype.injectIdentifier = function (doc, section) {
        if (!doc || !section) return;
        return originalInjectIdentifier.call(this, doc, section);
      };
    }

    if (!foucOverlay) {
      foucOverlay = document.createElement("div");
      foucOverlay.id = "foucOverlay";
      foucOverlay.className = "foucOverlay";
      if (viewer.parentElement) {
        viewer.parentElement.appendChild(foucOverlay);
      }
    }
    foucOverlay.style.backgroundColor = settings.bgColor;
    showOverlay();

    rendition.on("rendering", showOverlay);

    // Inyectar tema ANTES del primer renderizado para evitar FOUC
    rendition.hooks.content.register(contents => {
      const doc = contents.document;
      if (!doc || !doc.documentElement) return;

      const fontInfo = FONT_PRESETS[settings.font];
      if (fontInfo && fontInfo.url && !doc.querySelector(`link[href="${fontInfo.url}"]`)) {
        const frameLink = doc.createElement("link");
        frameLink.id = "kasniaCustomFontIframe";
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

      // Interceptar clics en enlaces internos (como notas) para evitar "No Section Found" de epub.js
      doc.addEventListener("click", e => {
        const a = e.target.closest("a");
        if (!a) return;
        
        const href = a.getAttribute("href");
        if (!href || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) return;

        e.preventDefault();
        e.stopPropagation();

        const hashIdx = href.indexOf('#');
        const baseHref = hashIdx !== -1 ? href.substring(0, hashIdx) : href;
        const fragment = hashIdx !== -1 ? href.substring(hashIdx + 1) : null;

        let section = book.spine.get(baseHref);

        if (!section && baseHref) {
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

        // Si es un enlace local en el mismo archivo
        if (!baseHref && fragment) {
          if (settings.mode === "continuous") {
            const target = doc.getElementById(fragment);
            if (target && doc.defaultView) {
              const rect = target.getBoundingClientRect();
              const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
              doc.defaultView.scrollTo({ top: scrollTop + rect.top, behavior: "smooth" });
            }
          } else if (rendition) {
            rendition.display(fragment);
          }
          window.scrollTo(0, 0);
          return;
        }

        if (!section) {
          console.warn("Link intercept: No section found for", baseHref);
          return;
        }

        const displayTarget = fragment ? section.href + '#' + fragment : section.href;

        if (typeof showOverlay === "function") showOverlay();
        rendition.display(displayTarget).then(() => {
          if (typeof scheduleHideOverlay === "function") scheduleHideOverlay();
          window.scrollTo(0, 0);
          if (fragment && settings.mode === "continuous") {
            setTimeout(() => {
              const currentContents = rendition.getContents();
              if (currentContents && currentContents.length > 0) {
                const currentDoc = currentContents[0].document;
                const target = currentDoc.getElementById(fragment);
                if (target && currentDoc.defaultView) {
                  const rect = target.getBoundingClientRect();
                  const scrollTop = currentDoc.documentElement.scrollTop || currentDoc.body.scrollTop || 0;
                  currentDoc.defaultView.scrollTo({ top: scrollTop + rect.top, behavior: "instant" });
                }
              }
              window.scrollTo(0, 0);
            }, 150);
          }
        }).catch(() => {
          rendition.display(section.href).then(() => {
            if (typeof scheduleHideOverlay === "function") scheduleHideOverlay();
            window.scrollTo(0, 0);
          }).catch(() => {
            if (typeof scheduleHideOverlay === "function") scheduleHideOverlay();
            window.scrollTo(0, 0);
          });
        });
      }, true);
    });

    rendition.on("rendered", () => {
      updateIframeStyles();
      scheduleHideOverlay();
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
      rendition.display(savedLocation).then(() => {
        scheduleHideOverlay();
      }).catch(() => {
        rendition.display().then(() => {
          scheduleHideOverlay();
        });
      });
    } else {
      rendition.display().then(() => {
        scheduleHideOverlay();
      });
    }

    rendition.on("relocated", location => {
      scheduleHideOverlay();
      currentLocation = location;
      if (!location || !location.start || !location.start.cfi) return;

      try {
        localStorage.setItem(storageKey, location.start.cfi);
      } catch (_) {}

      if (settings.mode === "paginated") {
        btnPrev.style.visibility = isAtBeginning() ? "hidden" : "visible";
        btnNext.style.visibility = isAtEnding() ? "hidden" : "visible";
      }

      updateProgress(location);
    });

    rendition.on("keyup", e => {
      if (settings.mode === "paginated") {
        if (e.key === "ArrowLeft") turnPage("prev");
        if (e.key === "ArrowRight") turnPage("next");
      }
    });

    rendition.on("touchstart", handleTouchStart);
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
    const viewerRect = viewer ? viewer.getBoundingClientRect() : { left: 0, width: window.innerWidth };

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
      : (viewer ? viewer.querySelector("iframe") : null);

    if (iframe) {
      const iframeRect = iframe.getBoundingClientRect();
      visualX = iframeRect.left + clientX - viewerRect.left;
    } else {
      visualX = clientX - viewerRect.left;
    }

    const width = Math.max(1, viewerRect.width || window.innerWidth);
    return Math.max(0, Math.min(1, visualX / width));
  }

  function handleTouchStart(e) {
    const touch = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : null);
    if (!touch) return;

    isTouching = true;
    touchStartScreenX = touch.screenX !== undefined ? touch.screenX : touch.clientX;
    touchStartScreenY = touch.screenY !== undefined ? touch.screenY : touch.clientY;
    touchStartTime = Date.now();
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

    function isInteractiveTarget(target) {
      if (!target) return false;
      const el = target.nodeType === 3 ? target.parentElement : target;
      return Boolean(el && typeof el.closest === "function" && el.closest("a, button, input, select, textarea, [role='button']"));
    }

    if (isInteractiveTarget(e.target)) {
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
      handleZoneInteraction(getEventPositionRatio(e));
    }
  }

  function handleZoneInteraction(ratio) {
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

  function handleClick(e) {
    if (Date.now() - lastTouchEndTime < 500) return;
    const el = e.target && e.target.nodeType === 3 ? e.target.parentElement : e.target;
    if (el && typeof el.closest === "function" && el.closest("a, button, input, select, textarea, [role='button']")) return;

    handleZoneInteraction(getEventPositionRatio(e));
  }

  if (readerContainer) {
    readerContainer.addEventListener("touchstart", handleTouchStart, { passive: true });
    readerContainer.addEventListener("touchend", handleTouchEnd, { passive: true });
    readerContainer.addEventListener("click", handleClick);
  }

  // 9. Configuración de Event Listeners de UI
  btnPrev.addEventListener("click", () => {
    if (Date.now() - lastSwipeTime < 500) return;
    if (settings.mode === "paginated") turnPage("prev");
  });

  btnNext.addEventListener("click", () => {
    if (Date.now() - lastSwipeTime < 500) return;
    if (settings.mode === "paginated") turnPage("next");
  });

  document.addEventListener("keyup", e => {
    if (e.key === "Escape") {
      if (tocPanel && tocPanel.style.display === "flex") closePanel(tocPanel);
      if (settingsPanel && settingsPanel.style.display === "flex") closePanel(settingsPanel);
      return;
    }
    if (settings.mode === "paginated") {
      if (e.key === "ArrowLeft") turnPage("prev");
      if (e.key === "ArrowRight") turnPage("next");
    }
  });

  btnClose.addEventListener("click", () => {
    if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = "/novelas/";
    }
  });

  // Control de Modales (Apertura y Cierre con Animación)
  function openPanel(panel) {
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

    panel.classList.add("isClosing");

    const onAnimEnd = e => {
      if (e && e.target !== panel) return;
      panel.removeEventListener("animationend", onAnimEnd);
      panel.classList.remove("isClosing");
      panel.style.display = "none";
    };

    panel.addEventListener("animationend", onAnimEnd);

    // Fallback de seguridad en caso de que animationend no se dispare
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
    if (panel) {
      panel.addEventListener("click", e => {
        if (e.target === panel) closePanel(panel);
      });
    }
  });

  // Tema y Colores
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

  if (bgPicker) {
    bgPicker.addEventListener("input", e => {
      settings.bgColor = e.target.value;
      settings.theme = "custom";
      readerApp.dataset.readerTheme = "custom";
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  if (textPicker) {
    textPicker.addEventListener("input", e => {
      settings.textColor = e.target.value;
      settings.theme = "custom";
      readerApp.dataset.readerTheme = "custom";
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  // Modo de lectura
  modeBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      const selectedMode = e.currentTarget.dataset.mode;
      if (selectedMode === settings.mode && rendition) return;

      settings.mode = selectedMode;
      readerApp.dataset.readerMode = selectedMode;
      saveSettings();
      updateUIFromSettings();
      renderBook();
    });
  });

  // Tipografía
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

  // Stepper helper genérico
  function bindStepper(incElement, decElement, key, onUpdate) {
    const limit = SETTING_LIMITS[key];
    if (!limit) return;

    if (incElement) {
      incElement.addEventListener("click", () => {
        settings[key] = Math.min(limit.max, +(settings[key] + limit.step).toFixed(limit.precision));
        saveSettings();
        updateUIFromSettings();
        updateIframeStyles();
        if (onUpdate) onUpdate();
      });
    }
    if (decElement) {
      decElement.addEventListener("click", () => {
        settings[key] = Math.max(limit.min, +(settings[key] - limit.step).toFixed(limit.precision));
        saveSettings();
        updateUIFromSettings();
        updateIframeStyles();
        if (onUpdate) onUpdate();
      });
    }
  }

  // Tamaño de texto en em
  bindStepper(btnIncFont, btnDecFont, "fontSize", () => {
    if (rendition) rendition.themes.fontSize(`${settings.fontSize.toFixed(2)}em`);
  });

  // Espaciados
  bindStepper(incPsBtn, decPsBtn, "paraSpacing");
  bindStepper(incLhBtn, decLhBtn, "lineHeight");
  bindStepper(incLsBtn, decLsBtn, "letterSpacing");

  // Márgenes
  bindStepper(incMtBtn, decMtBtn, "marginTop");
  bindStepper(incMbBtn, decMbBtn, "marginBottom");
  bindStepper(incMlBtn, decMlBtn, "marginLeft");
  bindStepper(incMrBtn, decMrBtn, "marginRight");

  // Formato
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
  alignBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      settings.align = e.currentTarget.dataset.align;
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  });

  // Separación de sílabas
  if (toggleHyphens) {
    toggleHyphens.addEventListener("change", e => {
      settings.hyphens = e.target.checked ? "auto" : "none";
      saveSettings();
      updateUIFromSettings();
      updateIframeStyles();
    });
  }

  // Restablecer Ajustes por Defecto
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const previousMode = settings.mode;
      settings = { ...DEFAULT_SETTINGS };
      readerApp.dataset.readerTheme = settings.theme;
      readerApp.dataset.readerMode = settings.mode;

      saveSettings();
      ensureFontLoaded(settings.font, () => {
        updateUIFromSettings();
        updateIframeStyles();
        if (previousMode !== settings.mode) {
          renderBook();
        } else if (rendition) {
          rendition.themes.select(settings.theme);
          rendition.themes.fontSize(`${settings.fontSize.toFixed(2)}em`);
        }
      });
    });
  }

});
