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
  const webReaderContent = document.getElementById('webReaderContent');
  const readerNovelTitle = document.getElementById('readerNovelTitle');
  
  // Settings Controls
  const themeBtns = document.querySelectorAll('.themeBtn');
  const fontSizeRange = document.getElementById('fontSizeRange');
  const lineHeightRange = document.getElementById('lineHeightRange');
  const fontFamilySelect = document.getElementById('fontFamilySelect');

  // Footnote Toast
  const footnoteToast = document.getElementById('footnoteToast');
  const footnoteToastContent = document.getElementById('footnoteToastContent');
  const btnCloseToast = document.getElementById('btnCloseToast');

  const btnToc = document.getElementById('btnToc');
  const webReaderTocPanel = document.getElementById('webReaderTocPanel');
  const tocOverlay = document.getElementById('tocOverlay');
  
  const hyphensToggle = document.getElementById('hyphensToggle');
  const pagedModeToggle = document.getElementById('pagedModeToggle');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnCloseToc = document.getElementById('btnCloseToc');

  let isUIVisible = false; // UI is invisible initially for reading

  // Medir y exponer las alturas reales del header/footer como variables CSS
  // Esto permite que el modo paginado calcule la altura exacta del área de lectura
  const updateReaderHeightVars = () => {
    const headerH = webReaderHeader.offsetHeight || 60;
    const footerH = webReaderFooter.offsetHeight || 60;
    document.documentElement.style.setProperty('--reader-header-h', `${headerH}px`);
    document.documentElement.style.setProperty('--reader-footer-h', `${footerH}px`);
  };

  // Recalcular en cambios de tamaño de viewport (rotación, chrome del nav entrando/saliendo)
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => updateReaderHeightVars());
    ro.observe(webReaderHeader);
    ro.observe(webReaderFooter);
  }
  window.addEventListener('resize', updateReaderHeightVars, { passive: true });

  // 1. Cargar Configuración del LocalStorage (Persistencia)
  const loadSettings = () => {
    const savedTheme = localStorage.getItem('kasniaReaderTheme') || 'dark';
    const savedFontSize = localStorage.getItem('kasniaReaderFontSize') || '18';
    const savedLineHeight = localStorage.getItem('kasniaReaderLineHeight') || '1.6';
    const savedFont = localStorage.getItem('kasniaReaderFont') || 'system-ui, sans-serif';
    const savedHyphens = localStorage.getItem('kasniaReaderHyphens') || 'false';
    const savedPaged = localStorage.getItem('kasniaReaderPagedMode') || 'false';

    // Aplicar a HTML
    htmlElement.setAttribute('data-theme', savedTheme);
    document.documentElement.style.setProperty('--reader-size', `${savedFontSize}px`);
    document.documentElement.style.setProperty('--reader-line-height', savedLineHeight);
    document.documentElement.style.setProperty('--reader-font', savedFont);
    
    if (savedHyphens === 'true') {
       webReaderContent.setAttribute('data-hyphens', 'true');
       if(hyphensToggle) hyphensToggle.checked = true;
    }

    if (savedPaged === 'true') {
       document.body.classList.add('pagedMode');
       webReaderContent.classList.add('pagedMode');
       if(pagedModeToggle) pagedModeToggle.checked = true;
    }

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

  hyphensToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
       webReaderContent.setAttribute('data-hyphens', 'true');
       saveSettings('kasniaReaderHyphens', 'true');
    } else {
       webReaderContent.removeAttribute('data-hyphens');
       saveSettings('kasniaReaderHyphens', 'false');
    }
  });

  if (pagedModeToggle) {
     pagedModeToggle.addEventListener('change', (e) => {
       const isChecked = e.target.checked;
       if (isChecked) {
          document.body.classList.add('pagedMode');
          webReaderContent.classList.add('pagedMode');
          saveSettings('kasniaReaderPagedMode', 'true');
       } else {
          document.body.classList.remove('pagedMode');
          webReaderContent.classList.remove('pagedMode');
          saveSettings('kasniaReaderPagedMode', 'false');
       }
       // Recalcular variables de altura al cambiar el modo
       setTimeout(updateReaderHeightVars, 50);
     });
  }

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
      webReaderTocPanel.classList.add('hidden'); // Also close TOC
    }
    // Recalcular variables de altura del lector tras la transición CSS (300ms)
    setTimeout(updateReaderHeightVars, 350);
  };

  // Click en medio de la pantalla para mostrar UI (o pasar pag en modo paginado)
  webReaderContainer.addEventListener('click', (e) => {
    // Evitar si se hace click en controles o links
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.webReaderHeader') || e.target.closest('.webReaderSettings') || e.target.closest('.footnoteToast')) {
      return;
    }
    
    if (webReaderContent.classList.contains('pagedMode')) {
      const clickX = e.clientX;
      const width = window.innerWidth;
      if (clickX < width * 0.25) {
         // Page Prev
         webReaderContent.scrollBy({ left: -width, behavior: 'smooth' });
      } else if (clickX > width * 0.75) {
         // Page Next
         webReaderContent.scrollBy({ left: width, behavior: 'smooth' });
      } else {
         toggleUI(); // Center click opens UI
      }
    } else {
      toggleUI();
    }
  });

  btnSettings.addEventListener('click', () => {
    webReaderSettings.classList.remove('hidden');
    webReaderTocPanel.classList.add('hidden');
  });

  settingsOverlay.addEventListener('click', () => {
    webReaderSettings.classList.add('hidden');
  });

  if (btnToc) {
    btnToc.addEventListener('click', () => {
      webReaderTocPanel.classList.remove('hidden');
      webReaderSettings.classList.add('hidden');
    });
  }

  if (tocOverlay) {
    tocOverlay.addEventListener('click', () => {
      webReaderTocPanel.classList.add('hidden');
    });
  }

  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      webReaderSettings.classList.add('hidden');
    });
  }

  if (btnCloseToc) {
    btnCloseToc.addEventListener('click', () => {
      webReaderTocPanel.classList.add('hidden');
    });
  }

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

  // 4.5 Resaltado dinámico del TOC
  const updateActiveToc = () => {
     const chunks = document.querySelectorAll('.readerChunk[data-chapter-index]');
     const isPaged = webReaderContent.classList.contains('pagedMode');
     let activeIndex = -1;
     let minDistance = Infinity;
     const vh = window.innerHeight || document.documentElement.clientHeight;
     const vw = window.innerWidth || document.documentElement.clientWidth;
     
     chunks.forEach(chunk => {
        const rect = chunk.getBoundingClientRect();
        if (isPaged) {
           if (rect.left <= vw/2 && rect.right >= vw/2) {
              activeIndex = parseInt(chunk.getAttribute('data-chapter-index'));
           } else if (rect.left >= 0 && rect.left < minDistance) {
              minDistance = rect.left;
              if (activeIndex === -1) activeIndex = parseInt(chunk.getAttribute('data-chapter-index'));
           }
        } else {
           if (rect.top <= vh/3 && rect.bottom >= vh/3) {
              activeIndex = parseInt(chunk.getAttribute('data-chapter-index'));
           } else if (rect.top >= 0 && rect.top < minDistance) {
              minDistance = rect.top;
              if (activeIndex === -1) activeIndex = parseInt(chunk.getAttribute('data-chapter-index'));
           }
        }
     });

     if (activeIndex !== -1) {
        document.querySelectorAll('.tocBtn').forEach((btn, idx) => {
           if (idx === activeIndex) {
              btn.classList.add('active');
           } else {
              btn.classList.remove('active');
           }
        });
     }
  };

  // Re-hook checkBoundaries para el Infinite Scroll y actualizar TOC
  window.addEventListener('scroll', () => {
     if(typeof checkBoundaries === 'function') checkBoundaries();
     updateActiveToc();
  }, {passive: true});

  webReaderContent.addEventListener('scroll', () => {
     if(webReaderContent.classList.contains('pagedMode')){
         if(typeof checkBoundaries === 'function') checkBoundaries();
         updateActiveToc();
     }
  }, {passive: true});

  // 5. Motor de Carga Asíncrona con index.json
  
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
        html += `<img src="${basePath}${fallback}" alt="${altText}">`;
     } else {
        html += `<img src="${pathsArr}" alt="${altText}">`;
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
         tempChunk.setAttribute('data-chapter-index', fileIndex);
         tempChunk.innerHTML = createPictureHTML(fileObj.images, fileObj.title);
         nodes.push(tempChunk);
         return nodes;
      }
      
      if(fileObj.type === 'gallery') {
         fileObj.images.forEach(imgGroup => {
            let tempChunk = document.createElement('figure');
            tempChunk.className = 'dimg grande readerChunk';
            tempChunk.setAttribute('data-chapter-index', fileIndex);
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
               // Sin loading lazy explícito, permitimos carga veloz para calcular alturas
               picture.innerHTML = `<source srcset="${basePath}${baseName}.avif" type="image/avif"><img src="${basePath}${oldSrc}" alt="Ilustración">`;
               img.parentNode.replaceChild(picture, img);
            }
          });

         // Nivelar nodos (evitar que la etiqueta section agrupe todo y genere cajas blancas)
         let childrenSource = doc.body.children;
         if (childrenSource.length === 1 && childrenSource[0].tagName === 'SECTION') {
             childrenSource = childrenSource[0].children;
         }

         let wrapper = document.createElement('div');
         wrapper.className = 'readerChunk';
         wrapper.setAttribute('data-chapter-index', fileIndex);
         Array.from(childrenSource).forEach(child => {
            wrapper.appendChild(child.cloneNode(true));
         });
         nodes.push(wrapper);

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
         // Precargar imágenes para asegurar que tengan altura definida antes de compensar el scroll
         const imagesToPreload = [];
         nodes.forEach(n => {
            if (n.nodeType === 1) {
               imagesToPreload.push(...Array.from(n.querySelectorAll('img')));
            }
         });

         if (imagesToPreload.length > 0) {
            await Promise.all(imagesToPreload.map(img => {
               if (img.complete) return Promise.resolve();
               return new Promise(resolve => {
                  img.onload = resolve;
                  img.onerror = resolve; // Resolvemos igual si falla
               });
            }));
         }

         const isPaged = webReaderContent.classList.contains('pagedMode');
         const anchor = topBoundary.nextElementSibling;
         let offsetTopBefore = anchor ? anchor.getBoundingClientRect().top : 0;
         let offsetLeftBefore = anchor ? anchor.getBoundingClientRect().left : 0;
         
         nodes.reverse().forEach(node => topBoundary.insertAdjacentElement('afterend', node));

         // Compensar el scroll por los nodos inyectados arriba/izquierda
         if (anchor) {
            if (isPaged) {
               const scrollDiff = anchor.getBoundingClientRect().left - offsetLeftBefore;
               webReaderContent.scrollBy({ left: scrollDiff, behavior: 'instant' });
            } else {
               const scrollDiff = anchor.getBoundingClientRect().top - offsetTopBefore;
               window.scrollBy(0, scrollDiff);
            }
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
     const isPaged = webReaderContent.classList.contains('pagedMode');
     
     if (isPaged) {
        const scrollL = webReaderContent.scrollLeft;
        const scrollW = webReaderContent.scrollWidth;
        const clientW = webReaderContent.clientWidth;
        
        if (scrollL <= 300 && currentStartFileIndex > 0) {
           loadPreviousChapter();
        } else if (scrollL + clientW >= scrollW - 300 && currentEndFileIndex < readingQueue.length - 1) {
           loadNextChapter();
        }
     } else {
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
     
     if (currentEndFileIndex >= readingQueue.length - 1) {
         let fin = document.createElement('p');
         fin.className = 'centrado salto2';
         fin.innerHTML = '<b>Fin del volumen.</b><br>Gracias por leer Kasnia Project.';
         webReaderContent.appendChild(fin);
         document.querySelector('.readerLoadingSpinner')?.remove();
     }
     
     webReaderContent.appendChild(bottomBoundary);
     
     isFetchingChapter = false;
     
     initFootnotes();
     window.scrollTo(0, 0);
     
     setTimeout(() => {
        checkBoundaries();
        updateActiveToc();
     }, 200);
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
  updateReaderHeightVars(); // Calcular alturas reales al inicio
  initFootnotes();
  
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
