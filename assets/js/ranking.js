document.addEventListener('DOMContentLoaded', () => {
  const rankingDataEl = document.getElementById('rankingData');
  const novelasDataEl = document.getElementById('novelasData');
  const rankingList = document.getElementById('rankingList');
  const lastUpdated = document.getElementById('lastUpdated');
  
  if (!rankingList) return;

  let currentPeriod = 'days7';
  let currentLimit = 5; // 5 or 'all'
  let rankingData = {};
  let novelasMap = {};

  // Attach event listeners first so UI is always responsive
  const periodBtns = document.querySelectorAll('[data-period]');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      periodBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentPeriod = e.target.getAttribute('data-period');
      renderRanking();
    });
  });

  const limitBtns = document.querySelectorAll('[data-limit]');
  limitBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      limitBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const limitVal = e.target.getAttribute('data-limit');
      currentLimit = limitVal === 'all' ? 'all' : parseInt(limitVal, 10);
      renderRanking();
    });
  });
  
  if (rankingDataEl && novelasDataEl) {
    try {
      rankingData = JSON.parse(rankingDataEl.textContent);
      const novelasArray = JSON.parse(novelasDataEl.textContent);
      novelasArray.forEach(n => {
        novelasMap[n.novelId] = n;
      });
    } catch (e) {
      console.error('Error parseando datos de ranking:', e);
    }
  }

  if (rankingData.updatedAt) {
    try {
      const date = new Date(rankingData.updatedAt);
      const formattedDate = new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
      if (lastUpdated) lastUpdated.textContent = `Última actualización: ${formattedDate}`;
    } catch (e) {
      if (lastUpdated) lastUpdated.textContent = 'Última actualización: Desconocida';
    }
  }

  function renderRanking() {
    rankingList.innerHTML = '';
    
    // Si rankingData está vacío (no hay archivo JSON o no tiene la estructura correcta)
    if (!rankingData || !rankingData.periods) {
      rankingList.innerHTML = `
        <div class="emptyState">
          <h3>Ranking en preparación</h3>
          <p style="margin-top: 0.5rem">Los datos de analíticas aún no se han sincronizado. Se mostrarán automáticamente cuando estén disponibles.</p>
        </div>
      `;
      return;
    }

    if (!rankingData.periods[currentPeriod]) {
      rankingList.innerHTML = '<div class="emptyState">Datos no disponibles para el intervalo seleccionado.</div>';
      return;
    }

    let data = rankingData.periods[currentPeriod];
    
    // Si es Top 5, filtrar los de > 0 visitas y cortar en 5
    if (currentLimit === 5) {
      data = data.filter(item => item.percentage > 0).slice(0, 5);
    }
    
    if (data.length === 0) {
      rankingList.innerHTML = '<div class="emptyState">No hay visitas registradas en este periodo.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    
    data.forEach((item, index) => {
      const novel = novelasMap[item.novelId];
      if (!novel) return;

      const coverId = item.novelId.padStart(2, '0');
      
      const a = document.createElement('a');
      a.href = `/novelas/${novel.link}/`;
      a.className = 'rankingItem';
      
      a.innerHTML = `
        <div class="rankingCoverContainer">
          <picture>
            <source srcset="/img/cover/avif/${coverId}-400.avif" type="image/avif">
            <img src="/img/cover/jpg/${coverId}-400.jpg" alt="Portada ${novel.title}" class="rankingCover" loading="lazy">
          </picture>
          <div class="rankingPosition">#${index + 1}</div>
        </div>
        <div class="rankingInfo">
          <h2 class="rankingNovelTitle">${novel.title}</h2>
          <div class="rankingPercentage">${item.percentage}%</div>
          <div class="rankingBarContainer">
            <div class="rankingBar" style="width: ${item.percentage}%"></div>
          </div>
        </div>
      `;
      
      fragment.appendChild(a);
    });
    
    rankingList.appendChild(fragment);
  }

  // Initial render
  renderRanking();
});
