document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const htmlElement = document.documentElement;
  const webReaderContainer = document.getElementById('webReaderContainer');
  const webReaderHeader = document.getElementById('webReaderHeader');
  const webReaderFooter = document.getElementById('webReaderFooter');
  const btnBack = document.getElementById('btnBack');
  const btnSettings = document.getElementById('btnSettings');
  const webReaderSettings = document.getElementById('webReaderSettings');
  const settingsOverlay = document.getElementById('settingsOverlay');
  
  // Settings Controls
  const themeBtns = document.querySelectorAll('.themeBtn');
  const fontSizeRange = document.getElementById('fontSizeRange');
  const lineHeightRange = document.getElementById('lineHeightRange');
  const fontFamilySelect = document.getElementById('fontFamilySelect');

  // Footnote Toast
  const footnoteToast = document.getElementById('footnoteToast');
  const footnoteToastContent = document.getElementById('footnoteToastContent');
  const btnCloseToast = document.getElementById('btnCloseToast');

  // Lectura del progreso (dummy base)
  const progressText = document.getElementById('progressText');
  let isUIVisible = false; // UI is invisible initially for reading

  // 1. Cargar Configuración del LocalStorage (Persistencia)
  const loadSettings = () => {
    const savedTheme = localStorage.getItem('kasniaReaderTheme') || 'dark';
    const savedFontSize = localStorage.getItem('kasniaReaderFontSize') || '18';
    const savedLineHeight = localStorage.getItem('kasniaReaderLineHeight') || '1.6';
    const savedFont = localStorage.getItem('kasniaReaderFont') || 'system-ui, sans-serif';

    // Aplicar a HTML
    htmlElement.setAttribute('data-theme', savedTheme);
    document.documentElement.style.setProperty('--reader-size', `${savedFontSize}px`);
    document.documentElement.style.setProperty('--reader-line-height', savedLineHeight);
    document.documentElement.style.setProperty('--reader-font', savedFont);

    // Actualizar controles UI
    fontSizeRange.value = savedFontSize;
    lineHeightRange.value = savedLineHeight;
    fontFamilySelect.value = savedFont;
  };

  // 2. Guardar Configuración
  const saveSettings = (key, value) => {
    localStorage.setItem(key, value);
  };

  // Listener Pestaña Configuración
  themeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const theme = e.target.getAttribute('data-theme');
      htmlElement.setAttribute('data-theme', theme);
      saveSettings('kasniaReaderTheme', theme);
    });
  });

  fontSizeRange.addEventListener('input', (e) => {
    const val = e.target.value;
    document.documentElement.style.setProperty('--reader-size', `${val}px`);
    saveSettings('kasniaReaderFontSize', val);
  });

  lineHeightRange.addEventListener('input', (e) => {
    const val = e.target.value;
    document.documentElement.style.setProperty('--reader-line-height', val);
    saveSettings('kasniaReaderLineHeight', val);
  });

  fontFamilySelect.addEventListener('change', (e) => {
    const val = e.target.value;
    document.documentElement.style.setProperty('--reader-font', val);
    saveSettings('kasniaReaderFont', val);
  });

  // 3. UI Toggle (Mostrar/Ocultar Header Sidebar)
  const toggleUI = () => {
    isUIVisible = !isUIVisible;
    if (isUIVisible) {
      webReaderHeader.classList.remove('hidden');
      webReaderFooter.classList.remove('hidden');
    } else {
      webReaderHeader.classList.add('hidden');
      webReaderFooter.classList.add('hidden');
      webReaderSettings.classList.add('hidden'); // Also close settings
    }
  };

  // Click en medio de la pantalla para mostrar UI
  webReaderContainer.addEventListener('click', (e) => {
    // Evitar si se hace click en controles o links
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.webReaderHeader') || e.target.closest('.webReaderSettings') || e.target.closest('.footnoteToast')) {
      return;
    }
    toggleUI();
  });

  btnSettings.addEventListener('click', () => {
    webReaderSettings.classList.remove('hidden');
  });

  settingsOverlay.addEventListener('click', () => {
    webReaderSettings.classList.add('hidden');
  });

  btnBack.addEventListener('click', () => {
    window.history.back(); // Or redirect to novel's main page
  });

  // 4. Lógica de Footnote / Toasts
  const initFootnotes = () => {
    // Encontrar todos los enlaces que sean a las notas (típicamente #fn... o similares en Hugo)
    const links = document.querySelectorAll('.webReaderContent a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.substring(1); // Quitar el '#'
          const targetElement = document.getElementById(targetId);
          
          if(targetElement) {
             // Mostrar Toast con el texto o contenido de la nota
             footnoteToastContent.innerHTML = targetElement.innerHTML;
             footnoteToast.classList.remove('hidden');
          } else {
             console.warn("Footnote reference not found in current DOM: ", targetId);
          }
        }
      });
    });
  };

  btnCloseToast.addEventListener('click', () => {
    footnoteToast.classList.add('hidden');
  });

  /* Lógica de scroll para 'Lectura continua' progresiva */
  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    const clientHeight = document.documentElement.clientHeight;
    
    const maxScroll = scrollHeight - clientHeight;
    
    if (maxScroll > 0) {
      const progress = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
      progressText.textContent = `${progress}%`;
    } else {
      progressText.textContent = `100%`;
    }
  };

  window.addEventListener('scroll', () => {
     updateProgress();
     if(typeof checkBoundaries === 'function') checkBoundaries();
  }, {passive: true});

  // 5. Motor de Carga Asíncrona con index.json
  const webReaderContent = document.getElementById('webReaderContent');
  const readerNovelTitle = document.getElementById('readerNovelTitle');
  
  let currentFragments = [];
  let currentFragmentIndex = 0;
  
  const urlParams = new URLSearchParams(window.location.search);
  const novelSlug = urlParams.get('novel') || 'seirei-gensouki'; 
  const novelVol = urlParams.get('vol') || '25';
  const basePath = `/lector/data/${novelSlug}-${novelVol}/`;
  
  // Lista de archivos HTML a cargar, orden dictado por el index.json
  let readingQueue = [];
  let currentStartFileIndex = 0;
  let currentEndFileIndex = 0;
  let isFetchingChapter = false;

  let activeJsonData = null;

  const topBoundary = document.createElement('div');
  const bottomBoundary = document.createElement('div');
  topBoundary.style.height = '1px';
  bottomBoundary.style.height = '100px'; // Un poco de margen para iniciar la carga antes de llegar

  // Helpers
  const createPictureHTML = (pathsArr, altText = "") => {
     let html = `<picture>`;
     if (Array.isArray(pathsArr)) {
        pathsArr.forEach(p => {
           if(p.endsWith('.avif')) html += `<source srcset="${basePath}${p}" type="image/avif">`;
           if(p.endsWith('.webp')) html += `<source srcset="${basePath}${p}" type="image/webp">`;
        });
        const fallback = pathsArr.find(p => p.endsWith('.jpg') || p.endsWith('.png')) || pathsArr[0];
        html += `<img src="${basePath}${fallback}" alt="${altText}" loading="lazy">`;
     } else {
        html += `<img src="${pathsArr}" alt="${altText}" loading="lazy">`;
     }
     html += `</picture>`;
     return html;
  };

  const fetchChapterNodes = async (fileIndex) => {
    if (fileIndex < 0 || fileIndex >= readingQueue.length) return [];
    const fileObj = readingQueue[fileIndex];
    let nodes = [];

    try {
      // Tipos nativos JSON
      if(fileObj.type === 'cover' || fileObj.type === 'image') {
         let tempChunk = document.createElement('figure');
         tempChunk.className = 'dimg grande readerChunk';
         tempChunk.innerHTML = createPictureHTML(fileObj.images, fileObj.title);
         nodes.push(tempChunk);
         return nodes;
      }
      
      if(fileObj.type === 'gallery') {
         fileObj.images.forEach(imgGroup => {
            let tempChunk = document.createElement('figure');
            tempChunk.className = 'dimg grande readerChunk';
            tempChunk.innerHTML = createPictureHTML(imgGroup, fileObj.title);
            nodes.push(tempChunk);
         });
         return nodes;
      }

      // Archivos HTML (EPUB originales o genéricos como sinopsis/título en los nuevos libros)
      if(fileObj.type === 'html') {
         const response = await fetch(`${basePath}${fileObj.file}`);
         if (!response.ok) throw new Error('Fragmento HTML fallido');
         const htmlText = await response.text();
         const parser = new DOMParser();
         const doc = parser.parseFromString(htmlText, 'text/html');
         
         const images = doc.querySelectorAll('img');
         images.forEach(img => {
           let oldSrc = img.getAttribute('src');
           if (oldSrc && oldSrc.includes('../Images/')) {
              oldSrc = oldSrc.replace('../Images/', '');
              let baseName = oldSrc.replace('.jpg', '').replace('.jpeg', '').replace('.png', '');
              let picture = document.createElement('picture');
              // Loading lazy asume la optimización de bandwidth del navegador
              picture.innerHTML = `<source srcset="${basePath}${baseName}.avif" type="image/avif"><img src="${basePath}${oldSrc}" alt="Ilustración" loading="lazy">`;
              img.parentNode.replaceChild(picture, img);
           }
         });

         // Nivelar nodos (evitar que la etiqueta section agrupe todo y genere cajas blancas)
         let childrenSource = doc.body.children;
         if (childrenSource.length === 1 && childrenSource[0].tagName === 'SECTION') {
             childrenSource = childrenSource[0].children;
         }

         Array.from(childrenSource).forEach(child => {
            let wrapper = document.createElement('div');
            wrapper.className = 'readerChunk';
            wrapper.appendChild(child.cloneNode(true));
            nodes.push(wrapper);
         });

         // Quitar headerChunk redundante generado
         return nodes;
      }
    } catch (e) {
      console.warn("Fallo cargando seccion:", e);
    }
    return nodes;
  };

  // Controladores de scroll bidireccional más robustos (sin IntersectionObserver defectuoso)
  const loadPreviousChapter = async () => {
      if (isFetchingChapter || currentStartFileIndex <= 0) return;
      isFetchingChapter = true;
      currentStartFileIndex--;
      
      const nodes = await fetchChapterNodes(currentStartFileIndex);
      if (nodes.length > 0) {
         const anchor = topBoundary.nextElementSibling;
         let offsetTopBefore = anchor ? anchor.getBoundingClientRect().top : 0;
         
         nodes.reverse().forEach(node => topBoundary.insertAdjacentElement('afterend', node));

         // Compensar el scroll por los nodos inyectados arriba
         if (anchor) {
            const scrollDiff = anchor.getBoundingClientRect().top - offsetTopBefore;
            window.scrollBy(0, scrollDiff);
         }
      }
      
      initFootnotes();
      isFetchingChapter = false;
      setTimeout(checkBoundaries, 150); // Revisar si debemos seguir cargando
  };

  const loadNextChapter = async () => {
      if (isFetchingChapter || currentEndFileIndex >= readingQueue.length - 1) return;
      isFetchingChapter = true;
      currentEndFileIndex++;
      
      const nodes = await fetchChapterNodes(currentEndFileIndex);
      nodes.forEach(node => bottomBoundary.insertAdjacentElement('beforebegin', node));

      initFootnotes();

      if (currentEndFileIndex >= readingQueue.length - 1) {
         let fin = document.createElement('p');
         fin.className = 'centrado salto2';
         fin.innerHTML = '<b>Fin del volumen.</b><br>Gracias por leer Kasnia Project.';
         bottomBoundary.insertAdjacentElement('beforebegin', fin);
         document.querySelector('.readerLoadingSpinner')?.remove();
      }
      
      isFetchingChapter = false;
      setTimeout(checkBoundaries, 150);
  };

  const checkBoundaries = () => {
     if (isFetchingChapter) return;
     const topRect = topBoundary.getBoundingClientRect();
     const bottomRect = bottomBoundary.getBoundingClientRect();
     const vh = window.innerHeight || document.documentElement.clientHeight;
     
     // Top is hitting viewport -> Scroll up
     if (topRect.bottom >= -300 && currentStartFileIndex > 0) {
        loadPreviousChapter();
     } 
     // Bottom is hitting viewport -> Scroll down
     else if (bottomRect.top <= vh + 300 && currentEndFileIndex < readingQueue.length - 1) {
        loadNextChapter();
     }
  };

  const loadInitialChapter = async (index) => {
     isFetchingChapter = true;
     webReaderContent.innerHTML = '';
     
     currentStartFileIndex = index;
     currentEndFileIndex = index;

     const nodes = await fetchChapterNodes(index);
     
     webReaderContent.appendChild(topBoundary);
     nodes.forEach(node => webReaderContent.appendChild(node));
     webReaderContent.appendChild(bottomBoundary);
     
     isFetchingChapter = false;
     
     initFootnotes();
     window.scrollTo(0, 0);
     
     setTimeout(checkBoundaries, 200);
  };

  const loadIndexJson = async () => {
    try {
      const response = await fetch(`${basePath}index.json`);
      if (!response.ok) throw new Error('Index.json no encontrado');
      const data = await response.json();
      activeJsonData = data;
      
      // Actualizar metadata de la portada
      document.title = `${data.title} Vol ${data.volume} - Lector Web`;
      readerNovelTitle.textContent = `${data.title} - Volumen ${data.volume}`;
      
      // Llenar cola de lectura
      readingQueue = data.order;

      // Dibujar TOC
      const readerTocList = document.getElementById('readerTocList');
      if(readerTocList) {
        data.order.forEach((item, index) => {
           let li = document.createElement('li');
           let btn = document.createElement('button');
           btn.className = 'tocBtn';
           btn.textContent = item.title;
           btn.onclick = () => {
              loadInitialChapter(index);
              toggleUI(); // Ocultar settings menu al dar click
           };
           li.appendChild(btn);
           readerTocList.appendChild(li);
        });
      }

      return true;
    } catch (e) {
      console.warn("Fallo el index.json. ", e);
      return false;
    }
  };

  // Init Base
  loadSettings();
  initFootnotes();
  updateProgress();
  
  // Start Loader Queue workflow
  loadIndexJson().then((success) => {
     if(success) {
        loadInitialChapter(0);
     } else {
        const spinner = document.querySelector('.readerLoadingSpinner');
        if(spinner) spinner.textContent = "Error: Faltan archivos de datos (index.json)";
     }
  });
});
