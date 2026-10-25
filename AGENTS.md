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
│   ├── _default/            # Plantilla base (baseof.html) y fallback genérico (single.html)
│   ├── novelas/             # Layouts para fichas de novela y catálogo (HTML y JSON)
│   ├── comisiones/          # Tarifas y solicitud de comisiones
│   ├── dmca/                # Política DMCA
│   ├── donaciones/          # Información de donaciones e historial dinámico
│   ├── lector/              # Lector ePub online
│   ├── privacy/             # Política de privacidad
│   ├── ranking/             # Ranking de popularidad
│   └── staff/               # Lista de miembros del equipo
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

### 5.2 Páginas Estáticas e Institucionales (`content/*.md`)

Todas las páginas individuales del sitio en `/content/*.md` se definen exclusivamente mediante Frontmatter YAML. No contienen código HTML en su cuerpo; todo el maquetado y los estilos residen en sus plantillas correspondientes en `/layouts/`.

- **Donaciones (`donaciones.md`)**:
  Define metadatos (`type: "donaciones"`, `layout: "single"`) y el historial de transacciones en la colección `historial`:
  ```yaml
  historial:
    - nombre: "Donación"
      fecha: "2026-09-17"
      fechaTexto: "17 Septiembre 2026"
      descripcion: '"Gracias por su trabajo"' # Opcional
      monto: "+ $7,65"
      tipo: "received" # "received" (ingreso) | "spent" (gasto)
  ```
  La plantilla `layouts/donaciones/single.html` renderiza la vista y clasifica automáticamente cada movimiento con `amountReceived` (verde) o `amountSpent` (rojo). Carga `donaciones.css`.

- **Staff (`staff.md`)**:
  Define a los miembros activos del equipo en la colección `miembros`:
  ```yaml
  layout: list
  miembros:
    - staffId: "01"
      nombre: "Lugh"
      rol: "Traductor, Corrector, Admin y Maquetador PDF"
      badge: "Creator" # Opcional
      novelIds: ["02", "03", "04", "09"]
  ```
  La plantilla `layouts/staff/list.html` itera sobre los miembros, enlaza avatares (`/img/staff/`) y resuelve dinámicamente los enlaces a sus proyectos. Carga `staff.css`.

- **Comisiones (`comisiones.md`)**:
  Define metadatos de página (`type: "comisiones"`, `layout: "single"`). Su contenido, tarifas y condiciones residen en su plantilla `layouts/comisiones/single.html` con `comisiones.css`.

- **DMCA (`dmca.md`) y Privacidad (`privacy.md`)**:
  Definen metadatos de página (`type: "dmca"` / `type: "privacy"`, `layout: "single"`). Sus plantillas en `layouts/dmca/single.html` y `layouts/privacy/single.html` contienen el marcado legal y cargan `legal.css`.

- **Ranking (`ranking.md`) y Lector (`lector.md`)**:
  Definen metadatos de página (`type: "ranking"` / `type: "lector"`, `layout: "single"`). Su estructura y lógica residen en `layouts/ranking/single.html` y `layouts/lector/single.html`.

---

### 5.3 Procedimiento paso a paso para añadir contenido

#### Paso 1: Añadir una Nueva Novela

1.  Crear el archivo `mi-novela.md` en `/content/novelas/`.
2.  Definir un frontmatter completo con un `novelId` secuencial y no utilizado (ej. `"15"`).
3.  Establecer el `link` con el valor `"mi-novela"` (debe coincidir con el nombre del archivo).
4.  Subir la imagen de la portada / volúmenes a través de **kasnia-admin** (o mediante el workflow `process-images.yml` en GitHub Actions). La imagen se almacena en Cloudflare R2 (`img.kasniaproject.com`) y se procesa automáticamente en variantes AVIF y JPG.
5.  Asegurar que los estados de los volúmenes y del proyecto en general estén actualizados en el frontmatter.

#### Paso 2: Añadir un Nuevo Volumen

1.  Subir el archivo de la portada del volumen desde **kasnia-admin** en la sección de la novela o el gestor de imágenes.
    _(Nota: kasnia-admin redimensionará la imagen original con Lanczos3 a máx. 1.000px y la subirá a `raw/[novelId]/v[num].jpg` en R2, disparando el workflow de GitHub Actions para generar las variantes AVIF y JPG en `https://img.kasniaproject.com`)._
2.  Editar el archivo `.md` de la novela en `/content/novelas/[slug].md`.
3.  En la sección `volumes`, añadir el objeto correspondiente al volumen estructurando adecuadamente los créditos, fechas, estado y enlaces.

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
- **`_default/single.html` (Fallback Genérico)**:
  Plantilla de respaldo para páginas individuales que rendericen contenido Markdown directo (`{{ .Content }}`). Carga dinámicamente `css/[File.BaseFileName].css` si el archivo existe.
- **`novelas/list.html` (Catálogo)**:
  Define el layout del catálogo de novelas. Prepara el esqueleto de búsqueda, filtros de género, grid dinámico y paginación en cliente. Carga `novelas.css` y `novelas.js`.
- **`novelas/single.html` (Ficha de Novela)**:
  Define el layout detallado de cada novela: metadatos técnicos, sinopsis colapsable y tarjetas de volúmenes con data attributes consumidos por los modales de descarga. Carga `novela.css` y `novela.js`.
- **`novelas/list.novelasJSON.json` (Catálogo JSON)**:
  Genera el archivo estático `/novelas/novelas.json` en tiempo de compilación con la lista ordenada de novelas para el catálogo interactivo.
- **`staff/list.html` (Equipo)**:
  Itera sobre la lista de miembros de `content/staff.md`, renderiza avatares y genera enlaces dinámicos a sus novelas asociadas. Carga `staff.css`.
- **`donaciones/single.html` (Donaciones)**:
  Define la estructura de héroe, información, botón de PayPal e itera dinámicamente sobre la colección `historial` de `content/donaciones.md`. Carga `donaciones.css`.
- **`comisiones/single.html` (Comisiones)**:
  Define el tarifario, requisitos, plazos de entrega y condiciones del servicio. Carga `comisiones.css`.
- **`ranking/single.html` (Ranking)**:
  Estructura del ranking de popularidad de novelas. Carga `ranking.css` y `ranking.js`.
- **`lector/single.html` (Lector Online)**:
  Visor en línea para archivos EPUB basado en epub.js. Carga `lector.css` y `lector.js`.
- **`dmca/single.html` y `privacy/single.html` (Legales)**:
  Maquetado completo de las políticas de DMCA y Privacidad respectivamente. Cargan `legal.css`.

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
  - `novelas.js`: Realiza un `fetch` asíncrono hacia `/novelas/novelas.json`. Implementa los filtros de género (controlados por un `Set`), búsqueda de texto con debounce de 300ms, generación de marcado para las tarjetas del grid con `DocumentFragment`
  - `novela.js`: Lógica del colapso dinámico de la sinopsis e inicialización de los modales. Al hacer click en una tarjeta de volumen, lee sus atributos `data-*`, los analiza como JSON y rellena el modal de descarga con los créditos correspondientes, activando o desactivando los botones de descarga de PDF/EPUB según el servidor seleccionado (Servidor Propio vs Google Drive).

### 6.3 Separación Estricta de Contenido y Maquetado

**El proyecto no utiliza shortcodes ni código HTML dentro de Markdown**. Toda la estructura visual, marcado semántico y estilos residen exclusivamente en plantillas dentro de `/layouts/`. Los archivos Markdown en `/content/` se limitan estrictamente a metadatos y colecciones de datos en su frontmatter YAML (como el historial en `donaciones.md`, los integrantes en `staff.md` o los proyectos en `comisiones.md`).

---

## 7. Convenciones y Reglas del Agente (Reglas de Oro)

Para mantener la consistencia del proyecto y evitar errores de compilación o visuales, el agente debe seguir estrictamente estas reglas:

### 7.1 Cosas que NO se deben hacer (Restricciones)

- **NO usar frameworks CSS**: Está prohibido añadir TailwindCSS, Bootstrap o cualquier otro framework CSS. Todos los estilos deben ser Vanilla CSS.
- **NO añadir dependencias JS externas**: No añadas React, Vue, Svelte u otras librerías pesadas al frontend. La interactividad debe implementarse usando Vanilla JS (ES6+) nativo.
- **NO escribir código HTML en Markdown ni usar shortcodes**: Todo el maquetado visual debe residir en plantillas dentro de `/layouts`. El contenido en `/content` se compone únicamente de metadatos o colecciones estructuradas en YAML.
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

Las reglas de la sección 7 tienen prioridad absoluta sobre cualquier skill. Si una skill sugiere Tailwind, librerías JS, kebab-case o BEM, ignora esa parte.

---

## 8. Lector ePub Integrado (epub.js)

Se ha implementado un lector en línea (en fase BETA) utilizando la librería `epub.js` (`/assets/js/lector.js` y `/assets/css/lector.css`).

### 8.1 Arquitectura del Lector
- **Acceso:** Se accede mediante un botón "Leer Online (BETA)" en el modal de descargas (`layouts/_default/baseof.html` y `novela.js`).
- **Renderizado:** Utiliza una página base en Hugo (`/layouts/lector/single.html`).
- **Estilos (`lector.css`):** Estructurado por flujo lógico de interfaz (Base -> Layout -> Modales -> Controles). Para prevenir recálculos costosos, están prohibidos los selectores universales (`*`), especialmente en pseudos-elementos como las scrollbars.
- **Lógica (`lector.js`):** Gestiona la instanciación de `ePub()`, controles de interfaz (TOC, Ajustes), persistencia en `localStorage` y navegación. Los límites numéricos, pasos y precisiones de todos los controles de ajuste se centralizan en el objeto `SETTING_LIMITS`.
- **Rendimiento UI:** Las consultas al DOM (`getElementById`, `querySelectorAll`) requeridas por la interfaz se realizan una única vez durante `DOMContentLoaded` y se mantienen en caché global. La función `updateUIFromSettings` actúa exclusivamente sobre estas referencias para evitar bloqueos durante la sincronización interactiva.
- **Temas:** Existen 4 temas (Claro, Oscuro, Sepia y Noche), implementados usando `rendition.themes.register`.

### 8.2 Workarounds y Prevención de Bugs (epub.js)

#### 1. Invariantes de Navegación y Bloqueos
- **`book.renderTo` (Opciones de Manager):** En epub.js v0.3.93, la instanciación de la rendition debe recibir el nodo DOM directo `viewer` y la propiedad `manager: "default"` (o `"continuous"`) junto con `flow: "paginated"` (o `"scrolled-doc"`). Está prohibido usar la propiedad `method`, ya que no es reconocida por el motor y rompe la inicialización del visor.
- **`isPageTurning` (Bloqueo silencioso):** La navegación (`rendition.next()` / `prev()`) debe envolverse siempre en una cadena `Promise.resolve().then(...)` con un bloque `finally()` que libere la bandera `isPageTurning = false` y un temporizador defensivo de desbloqueo. epub.js lanza excepciones síncronas bajo ciertas condiciones que, de no capturarse, inutilizan la navegación permanentemente.
- **`injectIdentifier` TypeError:** Al alternar modos de lectura (`renderBook()`), epub.js deja hooks huérfanos. Es obligatorio limpiar los hooks del spine (`book.spine.hooks.content.clear()`) antes de recrear la rendition y aplicar un null-check defensivo en `Rendition.prototype.injectIdentifier`.

#### 2. Anti-FOUC y Renderizado
El FOUC se manifiesta como contenido "moviéndose" al cambiar de capítulo.
**Mitigación en 2 capas:**
- **Capa 1 (raíz):** `rendition.hooks.content.register` inyecta un `<style id="kasniaThemePreload">` en el `<head>` del iframe con TODOS los estilos del tema **antes del primer paint**.
- **Capa 2 (visual):** Un `<div class="foucOverlay">` dentro de `.readerContainer` se superpone al viewer. Se muestra en `rendering` y se oculta con debounce de 150ms tras `relocated`.
**Regla Estricta:** NUNCA ocultar el `#viewer` ni el iframe con `opacity`, `visibility` o `display`. Esto rompe `getBoundingClientRect()` en epub.js y destruye el cálculo de anclas del TOC.

#### 3. Inyección de Fuentes
Para evitar la saturación del DOM al cambiar de tipografía repetidas veces, la inyección de `<link>` hacia Google Fonts debe usar IDs estáticos (`kasniaCustomFontHost` y `kasniaCustomFontIframe`). Se debe actualizar el `href` del nodo existente en lugar de adjuntar nuevos elementos.

#### 4. TOC y Navegación por Anclas
Los hrefs del TOC de epub.js no siempre coinciden con los hrefs del spine.
**Resolución flexible de secciones:**
1. Intenta `book.spine.get(baseHref)`.
2. Si falla, itera `book.spine.spineItems` comparando por `endsWith()`.
3. Navega con `rendition.display(section.href + '#' + fragment)`.
4. Tras la navegación, verifica el scroll al fragment con `scrollIntoView()` manual a los 150ms.
5. Si falla el fragmento, realiza un fallback a `rendition.display(section.href)`.
6. Siempre llama `scheduleHideOverlay()` en caso de error para evitar la retención infinita de la pantalla de carga.

### 8.3 Interacción Táctil, Gestos y Eventos
- **Prevención de Interferencias (Regla estricta):** El contenedor raíz y el body del iframe deben forzar `touch-action: none` (o `pan-y` en modo continuo) y desactivar la selección nativa de texto (`user-select: none`). Esto aísla los eventos de lectura de los gestos nativos del navegador móvil (zoom, pull-to-refresh, selección accidental).
- **Compensación de Coordenadas del Iframe (`getEventPositionRatio`):** epub.js desplaza internamente el iframe en modo paginado (vía transform o scroll). La función calcula `iframeRect.left + clientX - viewerRect.left` para garantizar que las zonas de tap (retroceso, menú, avance) permanezcan inmutables sin importar la página.
- **Toque en el Centro (Tap Toggle):** Alterna la visibilidad de la UI al tocar el centro de la pantalla (`absX < 15px`, `elapsed < 500ms`). En modo continuo, los eventos verticales (`absY >= 15px`) se ignoran explícitamente para permitir la lectura fluida sin aperturas accidentales del menú.
- **Scroll Continuo:** Los saltos inesperados por *Scroll Anchoring* se previenen con `overflow-anchor: none !important` inyectado tanto en el `<style>` del iframe como en `.epub-container`.

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
