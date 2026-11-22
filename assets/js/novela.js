/* ==========================================================================
   NOVELA.JS — LÓGICA DE FICHA DE NOVELA Y MODALES
   Kasnia Project — Vanilla JS ES6+ (camelCase)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initSynopsisToggle();
  initModal();
  initPreviousVolsModal();
  initSortOrder();
  initComments();
});

/**
 * Control del colapso dinámico de la sinopsis con detección de desbordamiento
 */
function initSynopsisToggle() {
  const synopsisContent = document.querySelector(".synopsisContent");
  const synopsisToggle = document.querySelector(".synopsisToggle");

  if (!synopsisContent || !synopsisToggle) return;

  const toggleText = synopsisToggle.querySelector(".toggleText");

  const checkOverflow = () => {
    const isExpanded = synopsisToggle.classList.contains("expanded");
    if (!isExpanded) {
      synopsisContent.classList.add("collapsed");
    }
    const isOverflowing = synopsisContent.scrollHeight > synopsisContent.clientHeight + 4;

    synopsisToggle.classList.toggle("visible", isOverflowing || isExpanded);
    if (!isOverflowing && !isExpanded) {
      synopsisContent.classList.remove("collapsed");
    }
  };

  checkOverflow();
  window.addEventListener("resize", checkOverflow, { passive: true });

  synopsisToggle.addEventListener("click", () => {
    const willExpand = !synopsisToggle.classList.contains("expanded");
    synopsisContent.classList.toggle("collapsed", !willExpand);
    synopsisToggle.classList.toggle("expanded", willExpand);
    synopsisToggle.setAttribute("aria-expanded", willExpand ? "true" : "false");
    if (toggleText) {
      toggleText.textContent = willExpand ? "Ver menos" : "Ver más";
    }
  });
}

/**
 * Utilidad compartida para cierre animado de <dialog>
 */
function animateDialogClose(dialogEl, onClosed) {
  if (!dialogEl || !dialogEl.open || dialogEl.classList.contains("isClosing")) return;

  dialogEl.classList.add("isClosing");

  const finishClose = () => {
    dialogEl.classList.remove("isClosing");
    if (typeof dialogEl.close === "function") {
      dialogEl.close();
    } else {
      dialogEl.removeAttribute("open");
    }
    document.body.style.overflow = "";
    if (typeof onClosed === "function") {
      onClosed();
    }
  };

  // Timeout de seguridad en caso de que animationend no se dispare
  const safetyTimer = setTimeout(finishClose, 250);

  const onAnimEnd = (e) => {
    if (e.target === dialogEl || e.target.classList?.contains("modalContainer")) {
      clearTimeout(safetyTimer);
      dialogEl.removeEventListener("animationend", onAnimEnd);
      finishClose();
    }
  };

  dialogEl.addEventListener("animationend", onAnimEnd);
}

/**
 * Habilita el gesto táctil de arrastre hacia abajo para cerrar con feedback visual continuo
 */
function enableDragToDismiss(dialogEl, closeFn) {
  const container = dialogEl.querySelector(".modalContainer");
  const topBar = dialogEl.querySelector(".modalTopBar");
  const handle = dialogEl.querySelector(".modalHandle");

  if (!container || !topBar) return;

  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  const onPointerDown = (e) => {
    // Solo arrastrar desde el tirador o la barra superior, no desde botones
    if (e.target.closest("button") || e.target.closest("a")) return;

    isDragging = true;
    startY = e.clientY;
    currentY = 0;
    container.classList.add("isDragging");
    container.style.transition = "none";
    try {
      topBar.setPointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;

    if (deltaY > 0) {
      currentY = deltaY;
      const progress = Math.min(currentY / 220, 1);
      container.style.transform = `translateY(${currentY}px)`;
      container.style.opacity = (1 - progress * 0.3).toFixed(2);
      if (currentY > 70) {
        container.classList.add("willDismiss");
      } else {
        container.classList.remove("willDismiss");
      }
    } else {
      const rubber = deltaY * 0.2;
      container.style.transform = `translateY(${rubber}px)`;
      container.style.opacity = "1";
      container.classList.remove("willDismiss");
    }
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      topBar.releasePointerCapture?.(e.pointerId);
    } catch (_) {}
    container.classList.remove("isDragging");
    container.classList.remove("willDismiss");
    container.style.transition = "";

    if (currentY > 70) {
      container.style.transform = "";
      container.style.opacity = "";
      closeFn();
    } else {
      container.style.transform = "";
      container.style.opacity = "";
    }
  };

  topBar.addEventListener("pointerdown", onPointerDown);
  topBar.addEventListener("pointermove", onPointerMove);
  topBar.addEventListener("pointerup", onPointerUp);
  topBar.addEventListener("pointercancel", onPointerUp);

  handle?.addEventListener("click", () => {
    closeFn();
  });
}

/**
 * Control del modal de descargas (<dialog> nativo) y lector online
 */
function initModal() {
  const modal = document.getElementById("downloadModal");
  if (!modal) return;

  const modalClose = modal.querySelector(".modalClose");
  const modalTitle = document.getElementById("modalVolumeTitle");
  const modalHeaderInfo = modal.querySelector(".modalHeaderInfo");
  const creditsContainer = document.getElementById("creditsContainer");
  const updateDateContainer = document.getElementById("updateDateContainer");
  const pdfLink = document.getElementById("pdfDownloadLink");
  const epubLink = document.getElementById("epubDownloadLink");
  const readerSection = document.getElementById("readerSection");
  const readerLinkBtn = document.getElementById("readerLinkBtn");
  const serverBtns = modal.querySelectorAll(".serverBtn");
  const quickDownloadBtn = document.getElementById("quickDownloadBtn");
  const volumesGrid = document.querySelector(".volumesGrid");

  const isValidLink = (link) => link && link !== "#" && link.trim() !== "";
  const hasValidLinks = (serverLinks) =>
    isValidLink(serverLinks?.pdf) || isValidLink(serverLinks?.epub);

  let currentLinks = {};
  let lastActiveTrigger = null;

  function updateDownloadLink(linkEl, href) {
    if (!linkEl) return;
    linkEl.href = href || "#";
    linkEl.classList.toggle("disabled", !isValidLink(href));
  }

  function updateDownloadLinks(server) {
    const serverLinks = currentLinks[server] || {};
    updateDownloadLink(pdfLink, serverLinks.pdf);
    updateDownloadLink(epubLink, serverLinks.epub);
  }

  function updateServerButtons() {
    serverBtns.forEach((btn) => {
      const server = btn.dataset.server;
      const serverLinks = currentLinks[server];
      const valid = hasValidLinks(serverLinks);
      btn.classList.toggle("disabled", !valid);
      btn.setAttribute("aria-disabled", valid ? "false" : "true");
    });
  }

  function triggerServerChangeAnimation() {
    const links = modal.querySelectorAll(".downloadLink");
    links.forEach((link) => {
      link.classList.remove("serverSwitchAnim");
      void link.offsetWidth; // Forzar reflow para reiniciar animación
      link.classList.add("serverSwitchAnim");
    });
  }

  function openModal(card, triggerEl = null) {
    if (!card) return;
    lastActiveTrigger = triggerEl || card;

    const volumeNumber = card.dataset.volume;
    const creditsData = JSON.parse(card.dataset.credits || "[]");
    currentLinks = JSON.parse(card.dataset.links || "{}");
    const isPreview = card.classList.contains("preview");

    // Limpiar indicador previo
    modalHeaderInfo?.querySelector(".previewIndicator")?.remove();

    if (modalTitle) {
      modalTitle.textContent = `Volumen ${volumeNumber}`;
      if (isPreview && modalHeaderInfo) {
        modalHeaderInfo.insertAdjacentHTML(
          "beforeend",
          `
          <span class="previewIndicator">
            <svg aria-hidden="true"><use href="/img/svg/novela.svg#eyeIcon" /></svg>
            Vista previa
          </span>
          `
        );
      }
    }

    // Botón "Leer Online": depende ÚNICAMENTE de si existe EPUB en servidor propio
    const epubPropio = currentLinks.propio?.epub;
    if (readerSection && readerLinkBtn) {
      if (isValidLink(epubPropio)) {
        readerSection.style.display = "block";
        readerLinkBtn.href = "/lector/?epub=" + encodeURIComponent(epubPropio);
      } else {
        readerSection.style.display = "none";
      }
    }

    if (creditsContainer) {
      creditsContainer.innerHTML = creditsData
        .map(
          (credit) => `
          <div class="creditItem">
            <span class="creditRole">${credit.role}</span>
            <span class="creditName">${credit.name}</span>
          </div>
        `
        )
        .join("");
    }

    if (updateDateContainer) {
      const pdfUpdate = card.dataset.pdfUpdate;
      const epubUpdate = card.dataset.epubUpdate;
      let updateHtml = "";
      if (pdfUpdate) {
        updateHtml += `
          <div class="updateDateItem">
            <span class="updateDateLabel">PDF actualizado</span>
            <span class="updateDateValue">${pdfUpdate}</span>
          </div>
        `;
      }
      if (epubUpdate) {
        updateHtml += `
          <div class="updateDateItem">
            <span class="updateDateLabel">EPUB actualizado</span>
            <span class="updateDateValue">${epubUpdate}</span>
          </div>
        `;
      }
      if (updateHtml) {
        updateDateContainer.innerHTML = updateHtml;
        updateDateContainer.style.display = "grid";
      } else {
        updateDateContainer.innerHTML = "";
        updateDateContainer.style.display = "none";
      }
    }

    updateServerButtons();

    // Determinar servidor preferido con enlaces válidos
    const propioHasLinks = hasValidLinks(currentLinks.propio);
    const driveHasLinks = hasValidLinks(currentLinks.drive);
    const activeServer = propioHasLinks
      ? "propio"
      : driveHasLinks
      ? "drive"
      : "propio";

    serverBtns.forEach((btn) => {
      const isActive = btn.dataset.server === activeServer;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    updateDownloadLinks(activeServer);

    // Apertura nativa de <dialog>
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
    document.body.style.overflow = "hidden";

    // Foco en el primer elemento interactivo
    requestAnimationFrame(() => {
      const primaryTarget =
        readerSection && readerSection.style.display !== "none"
          ? readerLinkBtn
          : modal.querySelector(".downloadLink:not(.disabled)") || modalClose;
      primaryTarget?.focus();
    });
  }

  function closeModal() {
    animateDialogClose(modal, () => {
      lastActiveTrigger?.focus();
    });
  }

  // Delegación de eventos en cuadrícula de volúmenes
  volumesGrid?.addEventListener("click", (e) => {
    const card = e.target.closest(".volumeCard");
    if (
      card &&
      !card.classList.contains("upcoming") &&
      !card.classList.contains("translating")
    ) {
      openModal(card, card);
    }
  });

  volumesGrid?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const card = e.target.closest(".volumeCard");
      if (
        card &&
        !card.classList.contains("upcoming") &&
        !card.classList.contains("translating")
      ) {
        e.preventDefault();
        openModal(card, card);
      }
    }
  });

  // Botón CTA de acción rápida en Hero
  quickDownloadBtn?.addEventListener("click", () => {
    const targetVolume = quickDownloadBtn.dataset.targetVolume;
    if (!targetVolume) return;
    const targetCard = document.querySelector(
      `.volumeCard[data-volume="${targetVolume}"]`
    );
    if (targetCard) {
      openModal(targetCard, quickDownloadBtn);
    }
  });

  // Cierre con botón X
  modalClose?.addEventListener("click", closeModal);

  // Clic en el telón de fondo (backdrop)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Evento Escape nativo en <dialog>
  modal.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal();
  });

  // Control segmentado de servidor
  modal.querySelector(".serverToggle")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".serverBtn");
    if (
      !btn ||
      btn.classList.contains("disabled") ||
      btn.classList.contains("active")
    ) {
      return;
    }

    serverBtns.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    updateDownloadLinks(btn.dataset.server);
    triggerServerChangeAnimation();
  });

  // Habilitar gesto de arrastre para cerrar en móvil
  enableDragToDismiss(modal, closeModal);
}

/**
 * Control del modal de volúmenes anteriores (<dialog> nativo)
 */
function initPreviousVolsModal() {
  const openBtn = document.getElementById("openPreviousVols");
  const modal = document.getElementById("previousVolsModal");
  if (!openBtn || !modal) return;

  const closeBtn = document.getElementById("closePreviousVols");
  let lastActiveTrigger = null;

  const openModal = () => {
    lastActiveTrigger = openBtn;
    if (typeof modal.showModal === "function") {
      modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      closeBtn?.focus();
    });
  };

  const closeModal = () => {
    animateDialogClose(modal, () => {
      lastActiveTrigger?.focus();
    });
  };

  openBtn.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  modal.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeModal();
  });

  enableDragToDismiss(modal, closeModal);
}

/**
 * Selector de orden de volúmenes (Ascendente / Descendente)
 */
function initSortOrder() {
  const sortToggle = document.getElementById("sortOrderToggle");
  const volumesGrid = document.querySelector(".volumesGrid");
  if (!sortToggle || !volumesGrid) return;

  const label = sortToggle.querySelector(".sortOrderLabel");
  let isDesc = false;

  sortToggle.addEventListener("click", () => {
    isDesc = !isDesc;
    sortToggle.setAttribute("aria-pressed", isDesc ? "true" : "false");

    if (label) {
      label.textContent = isDesc ? "Primeros primero" : "Nuevos primero";
    }

    // Invertir orden de los nodos en el grid
    const cards = Array.from(volumesGrid.children);
    cards.reverse().forEach((card) => volumesGrid.appendChild(card));
  });
}

/**
 * Inicialización del Sistema de Comentarios Nativo Kasnia
 */
function initComments() {
  const commentsCard = document.querySelector(".commentsCard");
  const loadCommentsBtn = document.getElementById("loadCommentsBtn");
  const commentsPlaceholder = document.getElementById("commentsPlaceholder");
  const commentsContent = document.getElementById("commentsContent");
  const commentsSkeletons = document.getElementById("commentsSkeletons");
  const commentsList = document.getElementById("commentsList");
  const emptyCommentsState = document.getElementById("emptyCommentsState");
  const commentsCountBadge = document.getElementById("commentsCountBadge");
  const mainCommentForm = document.getElementById("mainCommentForm");
  const commentAuthorInput = document.getElementById("commentAuthor");
  const commentEmailInput = document.getElementById("commentEmail");
  const commentTextInput = document.getElementById("commentText");
  const charCountSpan = document.getElementById("charCount");

  if (!commentsCard || !loadCommentsBtn || !commentsContent) return;

  const novelId = commentsCard.getAttribute("data-novel-id");
  const novelTitle = commentsCard.getAttribute("data-novel-title") || "";
  let isLoaded = false;
  let commentsData = [];

  const commentsToolbar = document.getElementById("commentsToolbar");
  const sortButtons = commentsToolbar ? commentsToolbar.querySelectorAll(".segmentedBtn") : [];
  let currentSort = localStorage.getItem("kasniaCommentSort") || "newest";

  if (commentsToolbar && sortButtons.length > 0) {
    sortButtons.forEach((btn) => {
      const isMatch = btn.getAttribute("data-sort") === currentSort;
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-pressed", String(isMatch));

      btn.addEventListener("click", () => {
        const targetSort = btn.getAttribute("data-sort");
        if (targetSort === currentSort) return;
        currentSort = targetSort;
        localStorage.setItem("kasniaCommentSort", currentSort);

        sortButtons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("active", active);
          b.setAttribute("aria-pressed", String(active));
        });

        renderCommentsTree(commentsData);
      });
    });
  }

  // Pre-llenar datos del autor guardados en localStorage
  if (commentAuthorInput && localStorage.getItem("kasniaAuthor")) {
    commentAuthorInput.value = localStorage.getItem("kasniaAuthor");
  }
  if (commentEmailInput && localStorage.getItem("kasniaEmail")) {
    commentEmailInput.value = localStorage.getItem("kasniaEmail");
  }

  // Gestión de modo Staff (Autenticación por MOD_SECRET guardada en el dispositivo)
  const staffAuthTrigger = document.getElementById("staffAuthTrigger");
  const staffAuthBox = document.getElementById("staffAuthBox");
  const staffKeyInput = document.getElementById("staffKeyInput");
  const saveStaffKeyBtn = document.getElementById("saveStaffKeyBtn");
  const cancelStaffKeyBtn = document.getElementById("cancelStaffKeyBtn");
  const staffActiveBadge = document.getElementById("staffActiveBadge");
  const logoutStaffBtn = document.getElementById("logoutStaffBtn");

  function updateStaffUi() {
    const hasKey = Boolean(localStorage.getItem("kasniaStaffKey"));
    if (staffActiveBadge) staffActiveBadge.hidden = !hasKey;
    if (staffAuthTrigger) staffAuthTrigger.hidden = hasKey;
    if (staffAuthBox) staffAuthBox.hidden = true;
  }

  if (staffAuthTrigger && staffAuthBox) {
    updateStaffUi();

    staffAuthTrigger.addEventListener("click", () => {
      staffAuthTrigger.hidden = true;
      staffAuthBox.hidden = false;
      if (staffKeyInput) {
        staffKeyInput.value = "";
        staffKeyInput.focus();
      }
    });

    cancelStaffKeyBtn?.addEventListener("click", () => {
      updateStaffUi();
    });

    saveStaffKeyBtn?.addEventListener("click", () => {
      const val = (staffKeyInput?.value || "").trim();
      if (val) {
        localStorage.setItem("kasniaStaffKey", val);
        updateStaffUi();
      }
    });

    logoutStaffBtn?.addEventListener("click", () => {
      localStorage.removeItem("kasniaStaffKey");
      updateStaffUi();
    });
  }

  // Contador de caracteres en tiempo real
  if (commentTextInput && charCountSpan) {
    commentTextInput.addEventListener("input", () => {
      charCountSpan.textContent = commentTextInput.value.length;
    });
  }

  // Herramientas de formato (Negrita, Cursiva, Spoiler)
  function applyFormat(textarea, formatType) {
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let prefix = "";
    let suffix = "";
    let placeholder = "";

    if (formatType === "bold") {
      prefix = "**";
      suffix = "**";
      placeholder = "texto en negrita";
    } else if (formatType === "italic") {
      prefix = "*";
      suffix = "*";
      placeholder = "texto en cursiva";
    } else if (formatType === "spoiler") {
      prefix = "||";
      suffix = "||";
      placeholder = "spoiler";
    }

    if (selected.length > 0) {
      textarea.setRangeText(`${prefix}${selected}${suffix}`, start, end, "select");
    } else {
      textarea.setRangeText(`${prefix}${placeholder}${suffix}`, start, end, "select");
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
    }

    textarea.focus();
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Conectar botones de formato del formulario principal
  mainCommentForm.querySelectorAll(".formatBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const format = btn.getAttribute("data-format");
      applyFormat(commentTextInput, format);
    });
  });

  // Parser seguro para comentarios: escapa HTML y convierte Markdown / Spoilers
  function formatCommentText(rawText) {
    if (!rawText) return "";
    let safe = escapeHTML(rawText);

    // 1. Spoilers: ||texto||
    safe = safe.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="commentSpoiler" role="button" tabindex="0" title="Clic para revelar spoiler">$1</span>');

    // 2. Negrita: **texto**
    safe = safe.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');

    // 3. Cursiva: *texto*
    safe = safe.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');

    return safe;
  }

  // Delegación de eventos para interactuar con spoilers
  commentsList.addEventListener("click", (e) => {
    const spoiler = e.target.closest(".commentSpoiler");
    if (spoiler) {
      spoiler.classList.toggle("isRevealed");
      return;
    }
  });

  commentsList.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const spoiler = e.target.closest(".commentSpoiler");
      if (spoiler) {
        e.preventDefault();
        spoiler.classList.toggle("isRevealed");
      }
    }
  });

  // Cargar comentarios bajo demanda
  const loadComments = async () => {
    if (isLoaded) return;
    isLoaded = true;

    // Cambiar vista: ocultar placeholder, mostrar contenedor
    commentsPlaceholder.hidden = true;
    commentsContent.hidden = false;
    commentsSkeletons.hidden = false;

    // Si la visita viene con ancla hacia comentarios, iniciar scroll preliminar
    if (window.location.hash && (window.location.hash.startsWith("#comment-") || window.location.hash === "#comentarios")) {
      commentsCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
      const apiUrl = `/api/comments?novelId=${encodeURIComponent(novelId)}`;
      const res = await fetch(apiUrl);

      if (res.ok) {
        const data = await res.json();
        commentsData = Array.isArray(data.comments) ? data.comments : [];
      } else {
        let errMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        console.error("Error al cargar comentarios:", errMsg);
        commentsData = [];
      }
    } catch (err) {
      console.error("Error de red al cargar comentarios:", err);
      commentsData = [];
    } finally {
      commentsSkeletons.hidden = true;
      renderCommentsTree(commentsData);
    }
  };

  loadCommentsBtn.addEventListener("click", loadComments);

  // Si el usuario entra con ancla #comentarios o hacia un comentario específico (#comment-XX)
  const hasCommentHash =
    window.location.hash === "#comentarios" ||
    window.location.hash.startsWith("#comment-");

  if (hasCommentHash) {
    loadComments();
  }

  // Generador de color determinista según el nombre
  function getAvatarColor(name) {
    const colors = [
      "#2563eb", "#0284c7", "#059669", "#7c3aed",
      "#db2777", "#d97706", "#4f46e5", "#0d9488"
    ];
    let hash = 0;
    const str = name || "A";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Formato relativo de tiempo en español
  function formatRelativeTime(dateString) {
    if (!dateString) return "recientemente";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "hace unos segundos";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `hace ${diffMonths} ${diffMonths === 1 ? "mes" : "meses"}`;
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Renderizar árbol de comentarios
  function renderCommentsTree(comments) {
    commentsList.innerHTML = "";

    // Contar total de comentarios incluyendo respuestas
    let totalCount = 0;
    const countTotal = (items) => {
      items.forEach((item) => {
        totalCount++;
        if (item.replies && item.replies.length > 0) {
          countTotal(item.replies);
        }
      });
    };
    countTotal(comments);

    if (commentsCountBadge) {
      commentsCountBadge.textContent = `${totalCount} ${totalCount === 1 ? "comentario" : "comentarios"}`;
      commentsCountBadge.hidden = totalCount === 0;
    }

    if (commentsToolbar) {
      commentsToolbar.hidden = comments.length === 0;
    }

    if (comments.length === 0) {
      emptyCommentsState.hidden = false;
      return;
    }

    emptyCommentsState.hidden = true;

    // Ordenar comentarios raíz según el criterio activo
    const sortedComments = [...comments].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime() || 0;
      const dateB = new Date(b.created_at).getTime() || 0;
      return currentSort === "oldest" ? dateA - dateB : dateB - dateA;
    });

    sortedComments.forEach((comment) => {
      const commentEl = createCommentNode(comment);
      commentsList.appendChild(commentEl);
    });

    // Desplazamiento suave hacia el comentario referenciado en la URL
    if (window.location.hash && (window.location.hash.startsWith("#comment-") || window.location.hash === "#comentarios")) {
      setTimeout(scrollToTargetHash, 200);
    }
  }

  // Navegación precisa y resaltado de comentarios vía ancla
  function scrollToTargetHash() {
    const hash = window.location.hash;
    if (!hash) return;

    if (hash.startsWith("#comment-")) {
      const targetComment = document.querySelector(hash);
      if (targetComment) {
        targetComment.scrollIntoView({ behavior: "smooth", block: "center" });
        targetComment.classList.add("highlightedComment");
        setTimeout(() => targetComment.classList.remove("highlightedComment"), 3500);
      } else {
        commentsCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (hash === "#comentarios") {
      commentsCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Soporte para cambios dinámicos de hash en el navegador
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash;
    if (hash === "#comentarios" || hash.startsWith("#comment-")) {
      if (!isLoaded) {
        loadComments();
      } else {
        scrollToTargetHash();
      }
    }
  });

  // Crear nodo de comentario individual
  function createCommentNode(comment, isReply = false) {
    const item = document.createElement("div");
    item.className = `commentItem ${isReply ? "isReply" : ""}`;
    item.id = `comment-${comment.id}`;

    const initial = (comment.author_name || "A").trim().charAt(0).toUpperCase();
    const avatarBg = getAvatarColor(comment.author_name);
    const dateText = formatRelativeTime(comment.created_at);
    const formattedContent = formatCommentText(comment.content);
    const staffBadgeHtml = comment.is_staff ? '<span class="commentStaffBadge">Staff</span>' : '';

    item.innerHTML = `
      <div class="commentCard">
        <div class="commentAvatar" style="background-color: ${avatarBg}" aria-hidden="true">${initial}</div>
        <div class="commentMain">
          <div class="commentMeta">
            <span class="commentAuthorName">${escapeHTML(comment.author_name)}</span>
            ${staffBadgeHtml}
            <span class="commentDate">${dateText}</span>
          </div>
          <div class="commentText">${formattedContent}</div>
          <div class="commentActions">
            <button type="button" class="commentReplyBtn" data-reply-to="${comment.id}" data-author="${escapeHTML(comment.author_name)}">
              <svg class="btnIcon" aria-hidden="true"><use href="/img/svg/novela.svg#replyIcon" /></svg>
              <span>Responder</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Botón responder
    const replyBtn = item.querySelector(".commentReplyBtn");
    replyBtn.addEventListener("click", () => {
      toggleInlineReplyForm(item, comment.id, comment.author_name);
    });

    // Contenedor de respuestas anidadas
    if (comment.replies && comment.replies.length > 0) {
      const repliesContainer = document.createElement("div");
      repliesContainer.className = "repliesContainer";
      comment.replies.forEach((reply) => {
        repliesContainer.appendChild(createCommentNode(reply, true));
      });
      item.appendChild(repliesContainer);
    }

    return item;
  }

  // Desplegar / cerrar mini formulario de respuesta inline
  function toggleInlineReplyForm(commentItem, parentId, authorName) {
    const existingForm = commentItem.querySelector(".inlineReplyWrapper");
    if (existingForm) {
      existingForm.remove();
      return;
    }

    // Cerrar cualquier otro formulario inline abierto
    document.querySelectorAll(".inlineReplyWrapper").forEach((f) => f.remove());

    const replyWrapper = document.createElement("div");
    replyWrapper.className = "inlineReplyWrapper";

    const savedAuthor = localStorage.getItem("kasniaAuthor") || "";
    const savedEmail = localStorage.getItem("kasniaEmail") || "";

    replyWrapper.innerHTML = `
      <form class="commentForm inlineForm" novalidate>
        <div class="inlineReplyHeader">
          <span class="inlineReplyTitle">Respondiendo a <strong>@${escapeHTML(authorName)}</strong></span>
          <button type="button" class="cancelReplyBtn">Cancelar</button>
        </div>
        <div class="formRow">
          <div class="formGroup">
            <input type="text" name="author" class="formInput" placeholder="Tu nombre *" value="${escapeHTML(savedAuthor)}" maxlength="40" required autocomplete="nickname" />
          </div>
          <div class="formGroup">
            <input type="email" name="email" class="formInput" placeholder="Correo (opcional)" value="${escapeHTML(savedEmail)}" autocomplete="email" />
          </div>
        </div>
        <!-- Honeypot -->
        <div class="honeypotGroup" aria-hidden="true" style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;">
          <input type="text" name="website" tabindex="-1" autocomplete="off" />
        </div>
        <div class="formGroup">
          <div class="textareaHeader">
            <label class="formLabel">Tu respuesta *</label>
            <div class="formatToolbar" role="toolbar" aria-label="Herramientas de formato">
              <button type="button" class="formatBtn" data-format="bold" title="Negrita (**texto**)"><strong>B</strong></button>
              <button type="button" class="formatBtn" data-format="italic" title="Cursiva (*texto*)"><em>I</em></button>
              <button type="button" class="formatBtn formatSpoiler" data-format="spoiler" title="Spoiler (||texto||)">
                <svg class="btnIcon" aria-hidden="true"><use href="/img/svg/novela.svg#eyeIcon" /></svg>
                <span>Spoiler</span>
              </button>
            </div>
          </div>
          <textarea name="content" class="formTextarea" placeholder="Escribe tu respuesta... Usa ||spoilers|| si es necesario" maxlength="1000" rows="2" required></textarea>
        </div>
        <div class="formFooter">
          <div class="charCounter"><span class="inlineCharCount">0</span> / 1000</div>
          <button type="submit" class="submitCommentBtn">
            <svg class="btnIcon" aria-hidden="true"><use href="/img/svg/novela.svg#sendIcon" /></svg>
            <span>Responder</span>
          </button>
        </div>
      </form>
    `;

    const inlineForm = replyWrapper.querySelector(".inlineForm");
    const textarea = replyWrapper.querySelector(".formTextarea");
    const counter = replyWrapper.querySelector(".inlineCharCount");
    const cancelBtn = replyWrapper.querySelector(".cancelReplyBtn");

    // Conectar botones de formato en el formulario inline
    inlineForm.querySelectorAll(".formatBtn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const format = btn.getAttribute("data-format");
        applyFormat(textarea, format);
      });
    });

    cancelBtn.addEventListener("click", () => replyWrapper.remove());

    textarea.addEventListener("input", () => {
      counter.textContent = textarea.value.length;
    });

    inlineForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleFormSubmit(inlineForm, parentId, commentItem);
    });

    commentItem.appendChild(replyWrapper);
    textarea.focus();
  }

  // Manejar envío de comentarios (tanto principal como respuesta)
  async function handleFormSubmit(form, parentId = null, parentCommentItem = null) {
    const authorInput = form.querySelector('[name="author"]');
    const emailInput = form.querySelector('[name="email"]');
    const contentInput = form.querySelector('[name="content"]');
    const honeypotInput = form.querySelector('[name="website"]');
    const submitBtn = form.querySelector('.submitCommentBtn');

    // Validación Honeypot (bot trap)
    if (honeypotInput && honeypotInput.value) {
      console.warn("Honeypot activado. Descartando bot.");
      form.reset();
      return;
    }

    const author = (authorInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const content = (contentInput?.value || "").trim();

    if (!author || !content) {
      showFeedback(form, "Por favor completa tu nombre y el comentario.", "error");
      return;
    }

    // Guardar nombre y correo en localStorage para próximas interacciones
    localStorage.setItem("kasniaAuthor", author);
    if (email) {
      localStorage.setItem("kasniaEmail", email);
    }

    submitBtn.disabled = true;
    const btnSpan = submitBtn.querySelector("span");
    const originalText = btnSpan ? btnSpan.textContent : "";
    if (btnSpan) btnSpan.textContent = "Publicando...";

    const staffToken = localStorage.getItem("kasniaStaffKey") || null;

    const payload = {
      novelId,
      novelTitle,
      novelPath: window.location.pathname,
      parentId,
      author,
      email: email || null,
      content,
      staffToken
    };

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const result = await res.json();
      const newComment = result.comment;

      if (!newComment) {
        throw new Error("Respuesta inválida del servidor");
      }

      // Inserción en el DOM
      if (parentId && parentCommentItem) {
        let repliesContainer = parentCommentItem.querySelector(".repliesContainer");
        if (!repliesContainer) {
          repliesContainer = document.createElement("div");
          repliesContainer.className = "repliesContainer";
          parentCommentItem.appendChild(repliesContainer);
        }
        const replyEl = createCommentNode(newComment, true);
        repliesContainer.appendChild(replyEl);
        const parentObj = commentsData.find((c) => String(c.id) === String(parentId));
        if (parentObj) {
          if (!parentObj.replies) parentObj.replies = [];
          parentObj.replies.push(newComment);
        }
        form.closest(".inlineReplyWrapper")?.remove();
        replyEl.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        emptyCommentsState.hidden = true;
        if (commentsToolbar) commentsToolbar.hidden = false;
        commentsData.unshift(newComment);
        const commentEl = createCommentNode(newComment, false);
        if (currentSort === "oldest") {
          commentsList.appendChild(commentEl);
        } else {
          commentsList.insertBefore(commentEl, commentsList.firstChild);
        }
        commentEl.scrollIntoView({ behavior: "smooth", block: "center" });
        form.reset();
        if (charCountSpan) charCountSpan.textContent = "0";
      }

      // Actualizar contador del badge
      if (commentsCountBadge) {
        const currentCount = parseInt(commentsCountBadge.textContent, 10) || 0;
        commentsCountBadge.textContent = `${currentCount + 1} comentarios`;
        commentsCountBadge.hidden = false;
      }
    } catch (err) {
      console.warn("Error al enviar comentario:", err);
      showFeedback(form, err.message || "Ocurrió un error al publicar el comentario.", "error");
    } finally {
      submitBtn.disabled = false;
      if (btnSpan) btnSpan.textContent = originalText;
    }
  }

  // Mostrar mensaje de feedback temporal
  function showFeedback(form, message, type) {
    let feedback = form.querySelector(".commentFeedback");
    if (!feedback) {
      feedback = document.createElement("div");
      form.appendChild(feedback);
    }
    feedback.className = `commentFeedback ${type}`;
    feedback.textContent = message;
    setTimeout(() => feedback.remove(), 4000);
  }

  // Escapar HTML seguro contra XSS
  function escapeHTML(str) {
    const p = document.createElement("p");
    p.appendChild(document.createTextNode(str || ""));
    return p.innerHTML;
  }

  // Enviar formulario principal
  mainCommentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleFormSubmit(mainCommentForm);
  });
}
