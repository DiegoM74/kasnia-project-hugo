# Documentación para Agentes de IA (AGENTS.md)

Este documento sirve como guía rápida de referencia para que cualquier agente de IA o desarrollador comprenda la arquitectura, convenciones y flujo de trabajo de este proyecto sin tener que explorar los archivos uno por uno.

---

## 1. Introducción y Propósito

**Kasnia Project** es un sitio web estático dedicado a publicar y distribuir traducciones al español de novelas ligeras japonesas de alta calidad. El sitio está diseñado para proporcionar una experiencia de usuario premium, ofreciendo descarga de volúmenes en PDF y EPUB mediante un catálogo interactivo rápido y optimizado.

---

## 2. Stack Tecnológico

El proyecto prescinde de frameworks JavaScript pesados y temas preconstruidos, utilizando una solución ligera y 100% personalizada:

- **Generador de Sitios Estáticos**: [Hugo](https://gohugo.io/) (Recomendado: **Hugo Extended v0.120.0+** o superior para soporte de procesamiento de recursos y minificación).
- **Diseño y Estilos**: CSS Vanilla organizado modularmente, procesado y optimizado en tiempo de compilación.
- **Interactividad**: Vanilla JS (ES6+) nativo para el catálogo, modal de descargas y cambio de tema.
- **Procesamiento de Imágenes**: Subproyecto Node.js en `/images` utilizando la biblioteca `sharp` para redimensionar y convertir portadas a formatos modernos (`.avif` y `.jpg`).

---

## 3. Estructura de Carpetas de Alto Nivel

```text
c:\Users\Diego\Documents\kasnia-project-hugo\
├── assets/                  # Código fuente de recursos procesables (CSS y JS)
│   ├── css/                 # Hojas de estilo modulares (main.css, novelas.css, etc.)
│   └── js/                  # Lógica del lado del cliente (main.js, novela.js, etc.)
├── content/                 # Contenido en formato Markdown con Frontmatter YAML
│   ├── novelas/             # Archivos de contenido de cada novela (.md)
│   └── *.md                 # Páginas estáticas individuales (staff, donaciones, dmca, privacy)
├── layouts/                 # Plantillas HTML (Go templates) que definen la estructura visual
│   ├── _default/            # Plantilla base (baseof.html) y plantilla genérica (single.html)
│   ├── novelas/             # Layouts para fichas de novela y catálogo (HTML y JSON)
│   └── staff/               # Layout para la lista de miembros del staff
├── static/                  # Archivos estáticos crudos que se copian tal cual al build final
│   └── img/                 # Directorio de imágenes organizadas (cover, vols, svg, icon, staff)
├── images/                  # Utilidad para optimizar imágenes y portadas (Sharp + Node.js)
│   ├── [novelId]/           # Subdirectorios numéricos con imágenes JPG de entrada (ej: 01, 02)
│   └── process_images.js    # Script encargado de generar y optimizar portadas y volúmenes
├── config/                  # Archivos de configuración modular para entornos (default / dev)
├── hugo.toml                # Archivo principal de configuración global de Hugo
└── public/                  # Carpeta generada automáticamente con el build de producción
```

---

## 4. Comandos de Desarrollo y Compilación

Todos los comandos de Hugo deben ejecutarse en la raíz del proyecto.

### Servidor de Desarrollo Local

Para levantar el sitio con recarga automática en tiempo real:

```bash
hugo server --gc --minify --cleanDestinationDir
```

- **Acceso**: `http://localhost:1313/` (o la dirección indicada por la consola).
- **--gc**: Fuerza la recolección de basura de caché de recursos.
- **--minify**: Habilita la minificación en tiempo de ejecución de desarrollo para emular producción.
- **--cleanDestinationDir**: Remueve archivos residuales en el directorio temporal.

### Generación de Producción (Build)

Para compilar el sitio estático optimizado final en el directorio `/public`:

```bash
hugo --gc --minify --cleanDestinationDir
```

---

## 5. Gestión de Contenido (`/content`)

El contenido del sitio se gestiona en archivos Markdown (`.md`) con Frontmatter YAML. Toda la información de las novelas y de las páginas estáticas reside en este directorio.

### 5.1 Fichas de Novelas (`content/novelas/[slug].md`)

Cada novela es un archivo `.md` (ej. `eighty-six.md`). Su comportamiento e información se definen a través de los metadatos en su frontmatter.

#### Ejemplo de Frontmatter Real (`content/novelas/eighty-six.md`):

```yaml
---
title: "86: Eighty-Six"
description: "Lee 86: Eighty-Six en español. Descarga los volúmenes traducidos de esta novela ligera de acción, drama y romance. Traducción de calidad por Kasnia Project."
novelId: "07"
novelTitle: "86: Eighty-Six"
nameJp: "86: Eighty-Six"
nameEn: "86: Eighty-Six"
nameEs: "86: Ochenta y seis"
genres:
  - "Acción"
  - "Bélico"
  - "Ciencia ficción"
  - "Drama"
  - "Misterio"
  - "Romance"
  - "Sobrenatural"
link: "eighty-six"
status: "uptodate"
synopsis: "Los “Juggernaut” son drones de combate no tripulados desarrollados por la República de San Magnolia..."
author: "Asato Asato"
illustrator: "Shirabi"
volumesReleased: 14
demography: "Seinen (Maduro, Adultos)"
mangaAdaptation: true
animeAdaptation: true

volumes:
  - num: "14"
    state: "published"
    pdfUpdateDate: "26/04/2026"
    epubUpdateDate: "26/04/2026"
    credits:
      translator: "DeepSeek (IA)"
      corrector: "AndresLD"
      editor: "Diego"
      pdfTypesetter: "Diego"
      epubTypesetter: "Diego"
    propio:
      pdf: true
      epub: true
    drive:
      pdf: "https://drive.google.com/file/d/1FLcVHNMyxpn4rfaMbkSKduaP1yQb_ixP/view"
      epub: "https://drive.google.com/file/d/1bEGVwsQElQylMC3rl7xQVgOq69olv0Ae/view"

previousVols:
  - range: "Volúmenes 01 al 13"
    group: "Traducciones Ferindrad"
    links:
      external: "https://traduccionesferin.wixsite.com/traducciones-ferindr/100-14"
---
```

#### Detalles de los campos:

- `title` _(String, Obligatorio)_: Título de la página utilizado para SEO y la pestaña del navegador.
- `description` _(String, Obligatorio)_: Meta descripción SEO para motores de búsqueda.
- `novelId` _(String, Obligatorio)_: Identificador único de dos dígitos con cero a la izquierda (ej: `"01"`, `"07"`). Vincula la novela con sus recursos de imágenes (`/images/[novelId]`) y miembros del staff.
- `novelTitle` _(String, Obligatorio)_: Nombre de la novela utilizado en títulos visuales y generación automática de descargas en el Servidor Propio.
- `nameJp` / `nameEn` / `nameEs` _(Strings, Obligatorios)_: Nombres oficiales en japonés (romaji), inglés y español.
- `genres` _(Lista de Strings, Obligatorio)_: Lista de géneros para el filtrado dinámico del catálogo.
- `link` _(String, Obligatorio)_: Slug URL de la novela. Debe coincidir exactamente con el nombre de archivo `.md` (sin extensión).
- `status` _(String, Obligatorio)_: Estado de traducción del proyecto. Valores permitidos:
  - `active` (Activa)
  - `uptodate` (Al día)
  - `paused` (Pausada)
  - `completed` (Finalizada)
  - `planned` (Planificada)
- `synopsis` _(String, Obligatorio)_: Texto descriptivo de la obra. Admite formato markdown.
- `author` / `illustrator` _(String, Obligatorio)_: Creadores de la obra.
- `illustratorNote` _(String, Opcional)_: Nota adicional del ilustrador (ej. `"Nozomi desde Vol. 9"`).
- `volumesReleased` _(String o Int, Obligatorio)_: Cantidad total de volúmenes publicados originalmente.
- `demography` _(String, Obligatorio)_: Público objetivo (ej. `"Shounen"`, `"Seinen"`).
- `mangaAdaptation` / `animeAdaptation` _(Booleano, Obligatorio)_: Habilita el badge correspondiente en la ficha técnica.
- `novelNote` _(String, Opcional)_: Mensaje destacado o advertencia de traducción para los lectores en el bloque superior de descargas.
- `volumes` _(Lista de Objetos, Obligatorio)_: Volúmenes del proyecto. Cada volumen requiere:
  - `num` _(String)_: Número de volumen formateado a dos dígitos (ej. `"01"`, `"12"`).
  - `state` _(String)_: Estado de publicación. Valores permitidos:
    - `published` (Público y descargable).
    - `preview` (Muestra badge de Vista Previa).
    - `translating` (Muestra badge de Proceso, descarga bloqueada).
    - `upcoming` (Muestra badge de Pronto, descarga bloqueada).
  - `pdfUpdateDate` / `epubUpdateDate` _(String, Opcional)_: Fecha de subida o actualización en formato `DD/MM/AAAA`.
  - `credits` _(Objeto)_: Roles de producción. Si un rol no aplica, usar `"-"`.
  - `propio` _(Objeto)_: Atributos booleanos `pdf` y `epub`. Si son `true`, la web genera un enlace automático al Servidor Propio.
  - `drive` _(Objeto)_: Enlaces directos a Google Drive. Si no hay, usar `"#"` o dejar vacío.
- `previousVols` _(Lista de Objetos, Opcional)_: Referencias a traducciones anteriores de otros grupos.
  - `range`: Rango del volumen (ej: `"Volúmenes 01 al 13"`).
  - `group`: Nombre del grupo (ej: `"Traducciones Ferindrad"`).
  - `links`: Objeto que puede contener `external` (enlace a web externa) o `pdf` / `epub` (enlaces de descarga directa).

---

### 5.2 Páginas Especiales y Estáticas

- **DMCA (`dmca.md`) y Privacidad (`privacy.md`)**:
  Contienen texto legal estructurado con secciones HTML. Cargan automáticamente el archivo CSS `legal.css`.
- **Donaciones (`donaciones.md`)**:
  Contiene la descripción, enlaces de PayPal y el historial de transacciones. Utiliza código HTML crudo estructurado por `<article class="historyItem">` con clases de importe `amountSpent` (para gastos en rojo) y `amountReceived` (para ingresos en verde). Carga automáticamente `donaciones.css`.
- **Staff (`staff.md`)**:
  Define a los miembros activos en el frontmatter:
  ```yaml
  layout: list
  miembros:
    - staffId: "01"
      nombre: "Lugh"
      rol: "Traductor, Corrector, Admin y Maquetador PDF"
      badge: "Creator"
      novelIds: ["02", "03", "04", "09"]
  ```

  - `staffId`: ID numérico que enlaza al avatar correspondiente en `static/img/staff/jpg/` y `avif/`.
  - `badge` (Opcional): Permite destacar al miembro en el grid (ej. `"Creator"`, `"Admin"`).
  - `novelIds`: Lista de strings correspondientes a los `novelId` de las novelas en las que el miembro colabora. El layout resolverá automáticamente los títulos y enlaces dinámicamente.

---

### 5.3 Procedimiento paso a paso para añadir contenido

#### Paso 1: Añadir una Nueva Novela

1.  Crear el archivo `mi-novela.md` en `/content/novelas/`.
2.  Definir un frontmatter completo con un `novelId` secuencial y no utilizado (ej. `"15"`).
3.  Establecer el `link` con el valor `"mi-novela"` (debe coincidir con el nombre del archivo).
4.  Crear la carpeta `/images/15/` en el proyecto de procesamiento de imágenes.
5.  Depositar la imagen de portada y los volúmenes en formato JPG (`v01.jpg`, `v02.jpg`, etc.) dentro de `/images/15/`.
6.  Ejecutar el procesador de imágenes (`node process_images.js` en `/images`) para generar y distribuir automáticamente todas las imágenes necesarias a `/static/img/`.
7.  Asegurar que los estados de los volúmenes y del proyecto en general estén actualizados en el frontmatter.

#### Paso 2: Añadir un Nuevo Volumen

1.  Subir el archivo de la portada del volumen en formato JPG a `/images/[novelId]/v[num].jpg` (ej: `/images/07/v15.jpg` para el volumen 15 de Eighty-Six).
2.  Navegar a la carpeta `/images` en tu terminal y ejecutar el comando:
    ```bash
    node process_images.js
    ```
    _(Nota: El script detectará la nueva imagen, la convertirá y la redimensionará en formatos AVIF y JPG a sus respectivas ubicaciones en `/static/img/vols/` y actualizará las portadas si corresponde)._
3.  Editar el archivo `.md` de la novela en `/content/novelas/[slug].md`.
4.  En la sección `volumes`, añadir el objeto correspondiente al volumen estructurando adecuadamente los créditos, fechas, estado y enlaces.

---

## 6. Arquitectura de Diseño y Plantillas (`/layouts` y `/assets`)

El diseño del sitio es 100% personalizado y prescinde de temas externos. La presentación visual y la interactividad están estrechamente coordinadas entre las plantillas de Hugo y los assets.

### 6.1 Plantillas Principales (`/layouts`)

Las plantillas HTML procesan los metadatos de los archivos markdown para generar la estructura del sitio:

- **`_default/baseof.html` (Estructura Base)**:
  Esqueleto HTML principal del sitio. Define el `<head>`, el header (navbar), el footer común y el botón de "Volver arriba". También incluye la estructura de los modales (`downloadModal` y `previousVolsModal`). Expone tres bloques principales para las plantillas hijas:
  - `{{ block "css" . }}{{ end }}`: Para inyección de archivos CSS específicos en el `<head>`.
  - `{{ block "main" . }}{{ end }}`: Para inyección del cuerpo principal del contenido.
  - `{{ block "js" . }}{{ end }}`: Para inyección de scripts JS específicos antes del cierre de `</body>`.
- **`index.html` (Inicio)**:
  Define la landing page del sitio. Inyecta `css/home.css` en el bloque CSS. Su sección de "Novelas Destacadas" carga las novelas de forma semi-estática mediante una lista hardcoded de IDs de novela:
  ```go
  {{ $destacadas := slice "01" "09" "07" }}
  ```
- **`_default/single.html` (Páginas Estáticas Genéricas)**:
  Se utiliza para renderizar páginas estáticas individuales como `donaciones.md`, `dmca.md` o `privacy.md`. Carga dinámicamente el estilo CSS basado en el nombre del archivo de origen:
  - `dmca.md` y `privacy.md` cargan `legal.css`.
  - Cualquier otra página estática carga automáticamente `css/[File.BaseFileName].css`.
    Renderiza el contenido compilado mediante `{{ .Content }}`.
- **`novelas/list.html` (Catálogo)**:
  Define el layout del catálogo de novelas. **No genera elementos HTML de novelas en tiempo de compilación**. En su lugar, prepara el esqueleto de búsqueda, los filtros de género vacíos, el contenedor del grid (`<div id="novelsGrid" class="novelsGrid"></div>`) y el sistema de paginación. Carga `novelas.css` y `novelas.js` para renderizar el contenido dinámicamente en el lado del cliente.
- **`novelas/single.html` (Ficha de Novela)**:
  Define el layout detallado de cada novela. Muestra la información técnica (sinopsis, autor, ilustrador, badges de adaptaciones a manga o anime) y genera las tarjetas de cada volumen (`volumeCard`). Los datos de descarga, créditos y actualización se inyectan como atributos de datos HTML (`data-volume`, `data-credits`, `data-links`, `data-pdf-update`, `data-epub-update`) formateados en JSON para ser consumidos por el cliente.
- **`novelas/list.novelasJSON.json` (Generación de Catálogo JSON)**:
  Layout alternativo para la sección `/novelas/` que genera el archivo estático `/novelas/novelas.json` en tiempo de compilación. Recopila información básica de todas las novelas en la carpeta `/novelas/` y las exporta como un arreglo JSON ordenado alfabéticamente por título en inglés.
- **`staff/list.html` (Miembros)**:
  Itera sobre la lista de miembros de `content/staff.md`. Muestra sus avatares (con fallback HTML/CSS si no existen) y busca dinámicamente en las páginas del sitio de tipo novela cuáles coinciden con los `novelIds` del miembro para crear sus enlaces correspondientes.

### 6.2 Assets y Procesamiento (`/assets`)

Los archivos dentro de `/assets` son procesados en el servidor de Hugo utilizando **Hugo Pipes**:

#### Procesamiento de CSS y JS (Minificación y Fingerprinting)

Para optimizar el rendimiento y garantizar que el navegador descargue siempre la versión más reciente del código, los assets se procesan de la siguiente manera:

```go
{{ $mainCSS := resources.Get "css/main.css" | minify | fingerprint }}
<link rel="stylesheet" href="{{ $mainCSS.Permalink }}" />
```

_(Nota: El script inyecta la URL del asset procesado y añade el hash único en el enlace final)._

#### Organización y Lógica Cliente

- **Convención de Nombres (camelCase)**: Tanto las clases de CSS en las hojas de estilo como las funciones y variables en JavaScript deben nombrarse utilizando estrictamente **camelCase** (ej: `.navbarContainer`, `.volumeCard`, `downloadModal`, `initSynopsisToggle`). No se utiliza kebab-case o BEM.
- **Estilos CSS Vanilla**: Ubicados en `assets/css/`, organizados por componentes y páginas de forma modular sin preprocesadores.
- **Scripts JS ES6+**:
  - `theme.js`: Cargado al principio de `<head>`. Inicializa el tema (`dark`/`light`) desde `localStorage` para evitar parpadeos visuales. Controla el toggle del tema implementando la API de View Transitions si el navegador la soporta.
  - `main.js`: Lógica global del menú móvil (`mobileMenu`) y throttle por `requestAnimationFrame` del botón flotante "Volver arriba".
  - `novelas.js`: Realiza un `fetch` asíncrono hacia `/novelas/novelas.json`. Implementa los filtros de género (controlados por un `Set`), búsqueda de texto con debounce de 300ms, generación de marcado para las tarjetas del grid con `DocumentFragment` y paginación cliente limitada a 15 elementos por página.
  - `novela.js`: Lógica del colapso dinámico de la sinopsis e inicialización de los modales. Al hacer click en una tarjeta de volumen, lee sus atributos `data-*`, los analiza como JSON y rellena el modal de descarga con los créditos correspondientes, activando o desactivando los botones de descarga de PDF/EPUB según el servidor seleccionado (Servidor Propio vs Google Drive).

### 6.3 Shortcodes

**El proyecto no utiliza shortcodes personalizados**. Para incluir elementos interactivos o tablas personalizadas en las páginas markdown (como el historial de movimientos de `donaciones.md`), se utiliza HTML crudo directamente en el Markdown, lo cual es permitido por la directiva `unsafe = true` en el renderizador Goldmark en `hugo.toml`.

---

## 7. Convenciones y Reglas del Agente (Reglas de Oro)

Para mantener la consistencia del proyecto y evitar errores de compilación o visuales, el agente debe seguir estrictamente estas reglas:

### 7.1 Cosas que NO se deben hacer (Restricciones)

- **NO usar frameworks CSS**: Está prohibido añadir TailwindCSS, Bootstrap o cualquier otro framework CSS. Todos los estilos deben ser Vanilla CSS.
- **NO añadir dependencias JS externas**: No añadas React, Vue, Svelte u otras librerías pesadas al frontend. La interactividad debe implementarse usando Vanilla JS (ES6+) nativo.
- **NO romper el sistema de paginación**: El catálogo dinámico está programado en cliente mediante `novelas.js` consumiendo `novelas.json`. No intentes cambiarlo por la paginación interna de Hugo. El límite de visualización es de 15 novelas por página.
- **NO usar shortcodes personalizados**: La inclusión de elementos especiales en Markdown (como el historial de movimientos de `donaciones.md`) se hace mediante HTML crudo nativo directamente en el archivo `.md`. No crees plantillas de shortcode en layouts.
- **NO usar kebab-case o BEM en clases CSS**: Este proyecto utiliza **camelCase** para nombrar clases de CSS (ej: `.navbarContainer`, `.volumeCard`, `.statusBadge`) y variables/funciones en JavaScript. No utilices guiones o guiones bajos para separar nombres de clases.
- **NO alterar los estados predefinidos**:
  - **Novelas (`status`)**: Solo usar `active`, `uptodate`, `paused`, `completed`, `planned`.
  - **Volúmenes (`state`)**: Solo usar `published`, `preview`, `translating`, `upcoming`.

### 7.2 Diseño Custom vs Temas Genéricos

Este es un diseño 100% personalizado, desarrollado a medida y sin ningún tema base preconstruido de Hugo (como Ananke).

- **No asumas convenciones genéricas**: No asumas que existen directorios de temas de Hugo, archivos `theme.toml`, o variables de plantilla estándar de terceros.
- **Estructura unificada**: Todos los cambios interactivos y visuales deben realizarse modificando directamente las plantillas personalizadas en `/layouts` y los estilos/scripts en `/assets`.

### 7.3 Cómo verificar que un cambio no rompió nada

Antes de dar por terminado un cambio en el código:

- Ejecuta la compilación de producción:
  ```bash
  hugo --gc --minify --cleanDestinationDir
  ```
  Asegúrate de que la consola no imprima ningún warning o error de Go templates o Goldmark, y que la carpeta `/public` se genere correctamente sin archivos huérfanos.

---

## 8. Lector ePub Integrado (epub.js)

Se ha implementado un lector en línea (en fase BETA) utilizando la librería `epub.js` (`/assets/js/lector.js` y `/assets/css/lector.css`).

### 8.1 Arquitectura del Lector
- **Acceso:** Se accede mediante un botón "Leer Online (BETA)" en el modal de descargas (`layouts/_default/baseof.html` y `novela.js`).
- **Renderizado:** Utiliza una página base en Hugo (`/layouts/lector/single.html`).
- **Lógica (`lector.js`):** Gestiona la instanciación de `ePub()`, controles de interfaz (TOC, Ajustes), persistencia de configuraciones en `localStorage` (fuente, tamaño, modo y tema) y navegación.
- **Temas:** Existen 4 temas (Claro, Oscuro, Sepia y Noche), implementados usando `rendition.themes.register`.

### 8.2 Soluciones Implementadas

#### Anti-FOUC (Resuelto)
El FOUC se manifestaba como contenido "moviéndose" al cambiar de capítulo XHTML, causado por la aplicación secuencial de padding, fuente y color al iframe nuevo.

**Solución en 2 capas:**
- **Capa 1 (raíz):** `rendition.hooks.content.register` inyecta un `<style id="kasniaThemePreload">` en el `<head>` del iframe con TODOS los estilos del tema (color, fondo, fuente, tamaño, padding-top/bottom, overflow-anchor) **antes del primer paint**. Los colores del tema están mapeados en `themeTextColors`.
- **Capa 2 (visual):** Un `<div class="foucOverlay">` dentro de `.readerContainer` (CSS: `position: absolute; inset: 0; z-index: 4; background: var(--reader-bg)`) se superpone al viewer sin alterar el layout del iframe. Se muestra en `rendering` y se oculta con debounce de 150ms tras `relocated`. Funciones: `showOverlay()` y `scheduleHideOverlay()`.

**Regla:** NUNCA ocultar el `#viewer` ni el iframe con `opacity`, `visibility` o `display`. Esto rompe `getBoundingClientRect()` en epub.js para las anclas del TOC.

#### TOC y Navegación por Anclas (Resuelto)
Los hrefs del TOC de epub.js (ej. `Text/chapter.xhtml#sigil_toc_id_1`) no siempre coinciden con los hrefs del spine (ej. `chapter.xhtml`), causando `Error: No Section Found`.

**Solución:** Resolución flexible de secciones:
1. Intenta `book.spine.get(baseHref)` (directo).
2. Si falla, itera `book.spine.spineItems` comparando por `endsWith()` (sufijo y filename).
3. Navega con `rendition.display(section.href + '#' + fragment)` usando el href canónico del spine.
4. Tras la navegación, verifica el scroll al fragment con `scrollIntoView()` manual a los 150ms.
5. Si la navegación con fragment falla, fallback a `rendition.display(section.href)` sin fragment.
6. Siempre llama `scheduleHideOverlay()` en caso de error para evitar pantalla negra.

#### Scroll Continuo (Resuelto)
Los saltos inesperados por *Scroll Anchoring* se previenen con `overflow-anchor: none !important` inyectado tanto en el `<style>` del iframe como en `rendition.manager.container`.

#### Cambio de Modo (Paginado ↔ Continuo)
`renderBook()` llama `rendition.destroy()` seguido de `viewer.innerHTML = ''` para limpiar iframes huérfanos antes de recrear la rendition.

#### Interacción Táctil y Gestos (Tap, Swipe y Prevención de Menú en Scroll)
Se implementó un sistema de control táctil y de clics responsivo en `assets/js/lector.js`:
- **Compensación de Coordenadas del Iframe (`getEventPositionRatio`):** En modo paginado, epub.js desplaza internamente el iframe (mediante CSS transform o scroll horizontal) al cambiar de página. La función calcula `iframeRect.left + clientX - viewerRect.left` para compensar el desplazamiento del iframe, garantizando que las zonas de tap (retroceso, menú central y avance) y la detección de clics permanezcan 100% fijas e inmutables sin importar a qué página se haya navegado.
- **Medición Física para Deslizamiento (`screenX`):** El reconocimiento de gestos de swipe y la tolerancia de movimiento en taps se calcula usando `screenX` y `screenY` físicos, evitando interferencias con transformaciones DOM internas.
- **Toque en el Centro (Tap Toggle):** Al hacer un tap limpio (`absX < 15px`, `absY < 15px`, `elapsed < 500ms`) en la zona central de la pantalla (25% a 75% en modo paginado, 15% a 85% en modo continuo), se alterna la visibilidad de la barra superior/inferior (`.ui-hidden`).
- **Navegación por Toque Lateral:** En modo paginado, un tap en el 25% lateral izquierdo retrocede de página (`rendition.prev()`) y en el 25% lateral derecho avanza de página (`rendition.next()`).
- **Gesto de Deslizamiento (Swipe):** En modo paginado, un swipe horizontal rápido (`absX >= 40px`, `absX > absY * 1.2`, `elapsed < 800ms`) hacia la izquierda avanza de página y hacia la derecha retrocede de página.
- **Aislamiento de Scroll Continuo:** En modo continuo, los eventos de arrastre/desplazamiento vertical (`absY >= 15px`) no ejecutan ninguna acción sobre el menú ni la paginación, garantizando una lectura fluida sin parpadeos ni aperturas accidentales de la interfaz.
- **Supresión de Ghost Clicks:** Se registra `lastTouchEndTime` para ignorar los eventos `click` sintéticos que emiten los navegadores móviles tras un `touchend`, evitando que el menú se cierre inmediatamente tras abrirse por doble disparo.

### 8.3 Bug Conocido de epub.js (No accionable)
- **`injectIdentifier` TypeError:** `Cannot read properties of undefined (reading 'packaging')`. Es un bug interno de epub.js v0.3 en la función `Section.injectIdentifier`. Se dispara durante el trigger de hooks de contenido. No afecta la funcionalidad del lector. No tiene fix desde nuestro código; requeriría un patch o fork de la librería.

---

## 9. Sistema de Ranking Dinámico (Cloudflare Analytics)

El sitio cuenta con una página de Ranking (`/ranking`) que muestra las novelas más visitadas en diferentes periodos (7, 21 y 30 días). Este sistema es completamente automatizado y no requiere base de datos, apoyándose en la infraestructura existente.

### 9.1 Arquitectura del Ranking

- **Fuente de Datos**: Cloudflare Web Analytics. Se utiliza su API GraphQL (dataset `rumPageloadEventsAdaptiveGroups` agrupado por la dimensión `requestPath`) para extraer métricas de visitas reales.
- **Extracción (`scripts/fetch-ranking.js`)**: Script en Node.js que consulta la API de Cloudflare. Cruza las rutas HTTP devueltas con los archivos `.md` de `content/novelas/` para identificar el `novelId`. Luego calcula los porcentajes de visualización de cada novela y exporta los resultados ordenados en `data/ranking.json`.
- **Automatización (GitHub Actions)**: El workflow en `.github/workflows/update-ranking.yml` ejecuta el script de extracción diariamente (vía cron) o manualmente. Si detecta cambios en las métricas, el bot realiza un commit automático de `data/ranking.json` a la rama `main`.
- **Despliegue Cero-Config**: Al recibir el nuevo commit con el archivo JSON actualizado, Cloudflare Pages dispara automáticamente un nuevo build estático. El action de GitHub NO debe encargarse de hacer deploy; su única responsabilidad es inyectar la data más reciente al repositorio.

### 9.2 Renderizado Frontend (`/ranking`)

- **Procesamiento Híbrido**: Para evitar regenerar HTML repetitivo y pesados bloques lógicos en Go templates, la página base (`layouts/ranking/single.html`) simplemente inyecta `data/ranking.json` y una lista de los metadatos de las novelas en bloques de texto crudo en el DOM.
- **Lógica Cliente (`assets/js/ranking.js`)**: Lee el JSON inyectado y renderiza el DOM utilizando Vanilla JS. Al igual que el catálogo principal, implementa la **View Transitions API** e inyecta dinámicamente un cálculo de píxeles (`sizes`) para solicitar a través de la etiqueta `<picture>` la resolución de portada exacta y óptima (`400w`, `700w` o `900w`).
- **Integración con Home**: La sección de "Novelas Destacadas" en `layouts/index.html` es semi-dinámica. Lee la data de `site.Data.ranking.periods.days7` en tiempo de compilación para mostrar siempre las 3 novelas más populares de la última semana. Si el archivo JSON llegara a faltar, utiliza un fallback seguro de 3 IDs predefinidos para no romper el diseño.
