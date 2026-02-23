document.addEventListener("DOMContentLoaded", () => {
  initSynopsisToggle();
  initModal();
});

function initSynopsisToggle() {
  const synopsisContent = document.querySelector(".synopsisContent");
  const synopsisToggle = document.querySelector(".synopsisToggle");

  if (!synopsisContent || !synopsisToggle) return;

  const checkOverflow = () => {
    synopsisContent.classList.add("collapsed");
    const isOverflowing =
      synopsisContent.scrollHeight > synopsisContent.clientHeight;

    synopsisToggle.classList.toggle("visible", isOverflowing);
    if (!isOverflowing) synopsisContent.classList.remove("collapsed");
  };

  checkOverflow();
  window.addEventListener("resize", checkOverflow, { passive: true });

  synopsisToggle.addEventListener("click", () => {
    const isExpanded = synopsisToggle.classList.contains("expanded");
    synopsisContent.classList.toggle("collapsed", isExpanded);
    synopsisToggle.classList.toggle("expanded", !isExpanded);
    synopsisToggle.innerHTML = `
      ${isExpanded ? "Ver más" : "Ver menos"}
      <svg><use href="/img/svg/novela.svg#chevronDown" /></svg>
    `;
  });
}

function initModal() {
  const modalOverlay = document.getElementById("downloadModal");
  if (!modalOverlay) return;

  const modalClose = modalOverlay.querySelector(".modalClose");
  const modalTitle = document.getElementById("modalVolumeTitle");
  const modalHeader = modalOverlay.querySelector(".modalHeader");
  const creditsContainer = document.getElementById("creditsContainer");
  const webReaderLink = document.getElementById("webReaderLink");
  const pdfLink = document.getElementById("pdfDownloadLink");
  const epubLink = document.getElementById("epubDownloadLink");
  const serverBtns = modalOverlay.querySelectorAll(".serverBtn");

  const isValidLink = (link) => link && link !== "#" && link.trim() !== "";
  const hasValidLinks = (serverLinks) =>
    isValidLink(serverLinks?.pdf) || isValidLink(serverLinks?.epub);

  let currentLinks = {};

  function updateDownloadLink(linkEl, href) {
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
      const serverLinks = currentLinks[btn.dataset.server];
      btn.classList.toggle("disabled", !hasValidLinks(serverLinks));
    });
  }

  function openModal(card) {
    const volumeNumber = card.dataset.volume;
    const creditsData = JSON.parse(card.dataset.credits || "[]");
    currentLinks = JSON.parse(card.dataset.links || "{}");
    const isPreview = card.classList.contains("preview");
    const hasWebReader = card.dataset.webReader === "true";
    const novelLink = card.dataset.novelLink || "#";

    // Setup Reader Link
    if (webReaderLink) {
      if (hasWebReader) {
        webReaderLink.style.display = "flex";
        webReaderLink.href = novelLink;
      } else {
        webReaderLink.style.display = "none";
        webReaderLink.href = "#";
      }
    }

    // Limpiar indicador previo
    modalHeader.querySelector(".previewIndicator")?.remove();

    modalTitle.textContent = `Volumen ${volumeNumber}`;

    if (isPreview) {
      modalTitle.insertAdjacentHTML(
        "afterend",
        `
        <span class="previewIndicator">
          <svg><use href="/img/svg/novela.svg#eyeIcon" /></svg>
          Vista previa
        </span>
      `
      );
    }

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

    updateServerButtons();

    // Determinar servidor activo
    const propioHasLinks = hasValidLinks(currentLinks.propio);
    const driveHasLinks = hasValidLinks(currentLinks.drive);
    const activeServer = propioHasLinks
      ? "propio"
      : driveHasLinks
      ? "drive"
      : "propio";

    serverBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.server === activeServer);
    });

    updateDownloadLinks(activeServer);
    modalOverlay.classList.add("active");
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
  }

  function triggerLinkUpdate(server) {
    updateDownloadLinks(server);
    modalOverlay
      .querySelectorAll(".downloadLink:not(.disabled)")
      .forEach((link) => {
        link.classList.remove("update-flash");
        void link.offsetWidth; // Force reflow
        link.classList.add("update-flash");
      });
  }

  // Event listeners - delegación para volumeCards
  document.querySelector(".volumesGrid")?.addEventListener("click", (e) => {
    const card = e.target.closest(".volumeCard");
    if (card && !card.classList.contains("upcoming")) {
      openModal(card);
    }
  });

  modalClose?.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
      closeModal();
    }
  });

  // Server toggle - delegación
  modalOverlay
    .querySelector(".serverToggle")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest(".serverBtn");
      if (
        !btn ||
        btn.classList.contains("disabled") ||
        btn.classList.contains("active")
      )
        return;

      serverBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      triggerLinkUpdate(btn.dataset.server);
    });
}
