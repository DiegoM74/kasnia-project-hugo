# Documentación para Agentes de IA (AGENTS.md)

Este documento sirve como guía rápida de referencia para que cualquier agente de IA o desarrollador comprenda la arquitectura, convenciones y flujo de trabajo de este proyecto sin tener que explorar los archivos uno por uno.

> **CONSULTA OBLIGATORIA DE DISEÑO:**
> Si tu tarea implica modificar o añadir estilos (`assets/css/`), scripts del lado del cliente (`assets/js/`) o plantillas HTML (`layouts/`), es **estrictamente obligatorio consultar `DESIGN.md`**. En él reside la referencia viva de tokens (camelCase), componentes, métricas exactas, reglas transversales, bugs que no se deben revertir y el contrato DOM-JS del lector.

> **CONSULTA OBLIGATORIA DE ESTÁNDARES FRONTEND (SKILL):**
> Si tu tarea implica agregar nuevas funcionalidades, componentes interactivos o modificar HTML/CSS/JS, es **estrictamente obligatorio leer la skill `.agents/skills/modern-web-guidance`**. Su propósito es garantizar que los agentes de IA utilicen las APIs y estándares web nativos más modernos (Baseline) y **no introduzcan frontend obsoleto**, técnicas deprecadas ni soluciones redundantes en JS para cosas que la plataforma web actual ya resuelve nativamente. Consulta la sección 7.4 para instrucciones detalladas.

---

## 1. Introducción y Propósito

**Kasnia Project** es un sitio web estático dedicado a publicar y distribuir traducciones al español de novelas ligeras japonesas de alta calidad. El sitio está diseñado para proporcionar una experiencia de usuario premium, ofreciendo descarga de volúmenes en PDF y EPUB mediante un catálogo interactivo rápido y optimizado.

---

## 2. Stack Tecnológico

El proyecto prescinde de frameworks JavaScript pesados y temas preconstruidos, utilizando una solución ligera y 100% personalizada:

- **Generador de Sitios Estáticos**: [Hugo](https://gohugo.io/) (Recomendado: **Hugo Extended v0.120.0+** o superior para soporte de procesamiento de recursos y minificación).
- **Diseño y Estilos**: CSS Vanilla organizado modularmente, procesado y optimizado en tiempo de compilación con Hugo Pipes.
- **Interactividad**: Vanilla JS (ES6+) nativo para el catálogo, modal de descargas, ranking, lector ePub y cambio de tema.
- **Procesamiento y Entrega de Imágenes**: Almacenamiento en Cloudflare R2 (`https://img.kasniaproject.com`). Carga y redimensionamiento mediante el panel **kasnia-admin** o a través del workflow de GitHub Actions (`process-images.yml` ejecutando `scripts/process-images-r2.js` con la biblioteca `sharp`) para generar variantes `.avif` y `.jpg` optimizadas.

---

## 3. Estructura de Carpetas de Alto Nivel

```text
kasnia-project-hugo/
├── .agents/                 # Skills y directrices especializadas para agentes de IA
│   └── skills/              # modern-web-guidance, apple-design, emil-design-eng, etc.
├── assets/                  # Código fuente de recursos procesables (CSS y JS)
│   ├── css/                 # Hojas de estilo modulares (main.css, novelas.css, etc.)
│   └── js/                  # Lógica del lado del cliente (main.js, novela.js, etc.)
├── content/                 # Contenido en formato Markdown con Frontmatter YAML
│   ├── novelas/             # Archivos de contenido de cada novela (.md)
│   └── *.md                 # Páginas estáticas individuales (staff, donaciones, dmca, privacy)
├── functions/               # Endpoints serverless de Cloudflare Pages Functions
│   └── api/                 # API REST (/api/comments, /api/comments/delete)
├── layouts/                 # Plantillas HTML (Go templates) que definen la estructura visual
│   ├── _default/            # Plantilla base (baseof.html) y fallback genérico (single.html)
│   ├── novelas/             # Layouts para fichas de novela y catálogo (HTML y JSON)
│   ├── comisiones/          # Tarifas y solicitud de comisiones
│   ├── dmca/                # Política DMCA
│   ├── donaciones/          # Información de donaciones e historial dinámico
│   ├── lector/              # Lector ePub online
│   ├── privacy/             # Política de privacidad
│   ├── ranking/             # Ranking de popularidad
│   ├── staff/               # Lista de miembros del equipo
│   └── 404.html             # Plantilla para la página de error 404
├── static/                  # Archivos estáticos crudos que se copian tal cual al build final
│   ├── fonts/               # Tipografía Inter Variable autoalojada (.woff2)
│   └── img/                 # Directorio de recursos estáticos (svg, icon, staff)
├── data/                    # Datos estáticos consumidos por plantillas (ranking.json)
├── scripts/                 # Scripts Node.js (fetch-ranking.js, process-images-r2.js)
├── hugo.toml                # Archivo principal de configuración global de Hugo
├── skills-lock.json         # Registro y bloqueo de versiones/hashes de skills instaladas
├── DESIGN.md                # Referencia viva de interfaz, tokens, métricas y componentes
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
- `novelId` _(String, Obligatorio)_: Identificador único de dos dígitos con cero a la izquierda (ej: `"01"`, `"07"`). Vincula la novela con sus recursos de imágenes en R2 CDN (`https://img.kasniaproject.com/vols/[novelId]/`) y miembros del staff.
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
  La plantilla `layouts/donaciones/single.html` renderiza la vista y clasifica cada movimiento con badges semánticos, iconos direccionales y montos (`amountReceived` / `amountSpent`). Carga `donaciones.css` y `donaciones.js`.

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
  La plantilla `layouts/staff/list.html` itera sobre los miembros, comprueba nativamente en compilación con `fileExists` la presencia del avatar en `static/img/staff/jpg/[id].jpg` (evitando 404s en consola) y resuelve los enlaces a sus proyectos en chips flex-wrap. Carga `staff.css`.

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
4.  Subir la imagen de la portada / volúmenes a través de **kasnia-admin** (o mediante el workflow `process-images.yml` en GitHub Actions). La imagen se almacena en Cloudflare R2 (`https://img.kasniaproject.com`) y se procesa automáticamente en variantes AVIF y JPG.
5.  Asegurar que los estados de los volúmenes y del proyecto en general estén actualizados en el frontmatter.

#### Paso 2: Añadir un Nuevo Volumen

1.  Subir el archivo de la portada del volumen desde **kasnia-admin** en la sección de la novela o el gestor de imágenes.
    _(Nota: kasnia-admin redimensionará la imagen original con Lanczos3 a máx. 1.000px y la subirá a `raw/[novelId]/v[num].jpg` en R2, disparando el workflow de GitHub Actions para generar las variantes AVIF y JPG en `https://img.kasniaproject.com`)._
2.  Editar el archivo `.md` de la novela en `/content/novelas/[slug].md`.
3.  En la sección `volumes`, añadir el objeto correspondiente al volumen estructurando adecuadamente los créditos, fechas, estado y enlaces.

---

## 6. Arquitectura de Diseño y Plantillas (`/layouts` y `/assets`)

El diseño del sitio es 100% personalizado y prescinde de temas externos. La presentación visual y la interactividad están estrechamente coordinadas entre las plantillas de Hugo y los assets.

> **CONSULTA DE DESIGN.MD OBLIGATORIA:**
> Antes de modificar o añadir cualquier archivo en `assets/css/`, `assets/js/` o `layouts/`, consulta **`DESIGN.md`**. Allí se especifican todos los tokens camelCase, la paleta cromática, radios, alturas táctiles mínimas, la jerarquía de encabezados, el uso selectivo de `backdrop-filter` y el contrato DOM-JS del lector.

### 6.1 Plantillas Principales (`/layouts`)

Las plantillas HTML procesan los metadatos de los archivos markdown para generar la estructura del sitio:

- **`_default/baseof.html` (Estructura Base)**:
  Esqueleto HTML principal del sitio. Define el `<head>`, el header (navbar), el footer común y el botón de "Volver arriba". También incluye la estructura de los modales (`downloadModal` y `previousVolsModal`). Expone tres bloques principales para las plantillas hijas:
  - `{{ block "css" . }}{{ end }}`: Para inyección de archivos CSS específicos en el `<head>`.
  - `{{ block "main" . }}{{ end }}`: Para inyección del cuerpo principal del contenido.
  - `{{ block "js" . }}{{ end }}`: Para inyección de scripts JS específicos antes del cierre de `</body>`.
- **`index.html` (Inicio)**:
  Define la landing page del sitio. Inyecta `css/home.css` en el bloque CSS. Renderiza una sección compacta de "Últimos Lanzamientos" con los 2 volúmenes traducidos más recientes recopilados dinámicamente en tiempo de compilación (`first 2 $recentVolumes`), mostrando portadas físicas con lomo reflectante, badges de publicación y enlaces directos. Su sección de "Novelas Destacadas" es semi-dinámica: consume en tiempo de compilación las 3 novelas más populares de los últimos 7 días desde `site.Data.ranking.periods.days7`, con un fallback seguro de IDs predefinidos (`slice "01" "09" "10"`) si los datos de ranking no están disponibles.
- **`_default/single.html` (Fallback Genérico)**:
  Plantilla de respaldo para páginas individuales que rendericen contenido Markdown directo (`{{ .Content }}`). Carga dinámicamente `css/[File.BaseFileName].css` si el archivo existe.
- **`novelas/list.html` (Catálogo)**:
  Define el layout del catálogo de novelas. Prepara el buscador con debounce, el cajón colapsable de filtros multi-criterio (Estado del proyecto, Demografía y Géneros), la barra meta con contador dinámico desacoplado de la ordenación, selector de ordenación nativo personalizable (`appearance: base-select`) y grid dinámico. Carga `novelas.css` y `novelas.js`.
- **`novelas/single.html` (Ficha de Novela)**:
  Define el layout detallado de cada novela: metadatos técnicos, sinopsis colapsable, tarjetas de volúmenes con data attributes consumidos por los modales de descarga, módulo dinámico de novelas recomendadas ("También te podría gustar") basado en afinidad en compilación (autor, demografía, géneros) y sistema de discusión y comentarios. Carga `novela.css` y `novela.js`.
- **`novelas/list.novelasJSON.json` (Catálogo JSON)**:
  Genera el archivo estático `/novelas/novelas.json` en tiempo de compilación con la lista estructurada de novelas (incluyendo `status`, `demography`, `latestDate` y `popularityScore`) para alimentar el catálogo interactivo del cliente.
- **`staff/list.html` (Equipo)**:
  Itera sobre la lista de miembros de `content/staff.md`, renderiza avatares con verificación nativa `fileExists` y genera enlaces dinámicos a sus novelas asociadas. Carga `staff.css`.
- **`donaciones/single.html` (Donaciones)**:
  Define la estructura de héroe, información, botón destacado de PayPal e itera dinámicamente sobre la colección `historial` de `content/donaciones.md`. Carga `donaciones.css` y `donaciones.js`.
- **`comisiones/single.html` (Comisiones)**:
  Define el tarifario, requisitos, plazos de entrega y condiciones del servicio. Carga `comisiones.css`.
- **`ranking/single.html` (Ranking)**:
  Estructura del ranking de popularidad de novelas. Carga `ranking.css` y `ranking.js`.
- **`lector/single.html` (Lector Online)**:
  Visor en línea para archivos EPUB basado en epub.js. Incluye paneles modales de Ajustes, Índice y panel de Información con módulo de navegación a volúmenes anterior y siguiente de la obra. Carga `lector.css` y `lector.js`.
- **`dmca/single.html` y `privacy/single.html` (Legales)**:
  Maquetado completo de las políticas de DMCA y Privacidad respectivamente. Cargan `legal.css`.
- **`404.html` (Página de Error 404)**:
  Define la vista para rutas no encontradas. Renderiza la ilustración de 'La Página Perdida' con física de sombra desacoplada, enlaces de escape útiles (`btnPrimary` a inicio y `btnSecondary` al catálogo) y carga `404.css`. Utiliza rutas absolutas para garantizar su resolución desde cualquier nivel de URL.

### 6.2 Assets y Procesamiento (`/assets`)

Los archivos dentro de `/assets` son procesados en el servidor de Hugo utilizando **Hugo Pipes**:

#### Procesamiento de CSS y JS (Minificación y Fingerprinting)

Para optimizar el rendimiento y garantizar que el navegador descargue siempre la versión más reciente del código, los assets se procesan de la siguiente manera:

```go
{{ $mainCSS := resources.Get "css/main.css" | minify | fingerprint }}
<link rel="stylesheet" href="{{ $mainCSS.Permalink }}" />
```

#### Organización y Lógica Cliente

- **Convención de Nombres (camelCase)**: Tanto las clases de CSS en las hojas de estilo como las funciones y variables en JavaScript deben nombrarse utilizando estrictamente **camelCase** (ej: `.navbarContainer`, `.volumeCard`, `downloadModal`, `initSynopsisToggle`). No se utiliza kebab-case o BEM.
- **Estilos CSS Vanilla**: Ubicados en `assets/css/`, organizados por componentes y páginas de forma modular sin preprocesadores. Los tokens se centralizan en `:root` en `assets/css/main.css`.
- **Scripts JS ES6+**:
  - `theme.js`: Cargado al principio de `<head>`. Inicializa el tema (`dark`/`light`) desde `localStorage` para evitar parpadeos visuales. Controla el toggle del tema implementando la API de View Transitions si el navegador la soporta.
  - `main.js`: Lógica global del menú móvil (`mobileMenu`) y throttle por `requestAnimationFrame` del botón flotante "Volver arriba".
  - `novelas.js`: Realiza un `fetch` asíncrono hacia `/novelas/novelas.json`. Implementa filtros multi-criterio combinados (estado, demografía y géneros mediante `Set`), ordenación reactiva (defecto, alfabética, lanzamientos recientes, popularidad), contador de resultados en vivo desacoplado de la ordenación, búsqueda con debounce de 300ms y generación de tarjetas mediante `DocumentFragment`.
  - `novela.js`: Lógica de sinopsis colapsable, apertura/cierre animado de modales `<dialog>`, selector de servidor de descargas (Servidor Propio vs Google Drive), orden ascendente/descendente, gesto táctil drag-to-dismiss en móviles y sistema nativo de comentarios y discusión (carga bajo demanda, ordenación reactiva más recientes/más antiguos con persistencia en `localStorage`, anclaje directo a `#comment-X`, formato enriquecido, revelación de spoilers, respuestas anidadas y autenticación de staff).
  - `ranking.js`: Consume `data/ranking.json` inyectado en el DOM, gestiona segmented controls para alternar periodos (7, 21, 30 días) y límites (Top 5 / Todas) mediante microtransiciones Vanilla (`.isSwitching`), e inyecta View Transitions entre páginas (`view-transition-name: n${novelId}`).
  - `donaciones.js`: Controla el filtrado reactivo del historial por Segmented Control (Todos, Donaciones, Gastos) y el despliegue/replegado dinámico de movimientos con scroll restaurado.
  - `lector.js`: Motor del lector online con epub.js (renderizado paginado/continuo, TOC, steppers de personalización, 4 temas, persistencia en `localStorage`, inyección anti-FOUC, drag-to-dismiss móvil y salto no-invasivo a volúmenes anterior/siguiente consultando `/novelas/uploads.json`).

### 6.3 Separación Estricta de Contenido y Maquetado

**El proyecto no utiliza shortcodes ni código HTML dentro de Markdown**. Toda la estructura visual, marcado semántico y estilos residen exclusivamente en plantillas dentro de `/layouts/`. Los archivos Markdown en `/content/` se limitan estrictamente a metadatos y colecciones de datos en su frontmatter YAML.

---

## 7. Convenciones y Reglas del Agente (Reglas de Oro)

Para mantener la consistencia del proyecto y evitar errores de compilación o visuales, el agente debe seguir estrictamente estas reglas:

### 7.1 Cosas que NO se deben hacer (Restricciones)

- **NO modificar la interfaz sin consultar `DESIGN.md`**: Antes de tocar o crear estilos, scripts o plantillas, es obligatorio consultar `DESIGN.md`.
- **NO usar frameworks CSS**: Está prohibido añadir TailwindCSS, Bootstrap o cualquier otro framework CSS. Todos los estilos deben ser Vanilla CSS.
- **NO añadir dependencias JS externas**: No añadas React, Vue, Svelte u otras librerías pesadas al frontend. La interactividad debe implementarse usando Vanilla JS (ES6+) nativo.
- **NO escribir código HTML en Markdown ni usar shortcodes**: Todo el maquetado visual debe residir en plantillas dentro de `/layouts`. El contenido en `/content` se compone únicamente de metadatos o colecciones estructuradas en YAML.
- **NO usar kebab-case o BEM en clases CSS**: Este proyecto utiliza **camelCase** para nombrar clases de CSS (ej: `.navbarContainer`, `.volumeCard`, `.statusBadge`) y variables/funciones en JavaScript. No utilices guiones o guiones bajos para separar nombres de clases.
- **NO usar valores mágicos en CSS**: Se deben emplear siempre los tokens definidos en `:root` en `main.css` y documentados en `DESIGN.md`.
- **NO usar SVG inline**: Todo icono debe pertenecer a su sprite en `static/img/svg/` y consumirse vía `<use href="/img/svg/[archivo].svg#[id]" />`.
- **NO usar `<header>` dentro de `<main>`**: La etiqueta `<header>` está reservada exclusivamente para la navbar global en `baseof.html`. Dentro de `<main>` deben utilizarse etiquetas `<section>` (o `<nav>` para controles específicos de lectura en el lector).
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

### 7.4 Prevención de Frontend Obsoleto y Nuevas Funcionalidades (`.agents/skills/modern-web-guidance`)

Los modelos de lenguaje tienden naturalmente a generar patrones de desarrollo frontend heredados u obsoletos que aprendieron en sus pesos de entrenamiento (por ejemplo: recrear ventanas modales o popovers con código JS complejo en lugar de `<dialog>` o la Popover API, manejar listeners de teclado manuales para cerrar capas flotantes, manipular opacidades para animaciones que hoy resuelve CSS con `@starting-style`, o instalar dependencias externas para cosas que los navegadores modernos soportan nativamente).

Para prevenir esto, el repositorio incluye la skill **`modern-web-guidance`** ubicada en `.agents/skills/modern-web-guidance/`.

#### 1. Cuándo es obligatorio leer esta skill
El agente **debe leer la skill** antes de escribir código si se le pide:
- **Agregar nuevas funcionalidades** a la página o a cualquiera de sus vistas.
- Crear **nuevos componentes interactivos o de interfaz** (diálogos, modales, drawers/cajones de navegación, menús emergentes, popovers, tooltips, acordeones, selectores personalizados, etc.).
- Implementar **formularios, validaciones o controles de entrada** en el cliente.
- Añadir **animaciones, transiciones o microinteracciones** (View Transitions, scroll-driven animations, animaciones de entrada/salida de display, etc.).
- Trabajar con **fechas, zonas horarias, sanitización de HTML o internacionalización** del lado del cliente.
- Optimizar **rendimiento web (Core Web Vitals - LCP, INP, CLS)**, contraste de color o accesibilidad (a11y).

#### 2. Cómo consultarla y utilizarla
- **Documento principal**: Lee el archivo `.agents/skills/modern-web-guidance/SKILL.md`.
- **Catálogo de guías locales**: El directorio `.agents/skills/modern-web-guidance/guides/` contiene guías especializadas organizadas por temática (`accessibility`, `css`, `forms`, `html`, `js`, `performance`, `ui-components`, `visual-design`, etc.). Puedes leer directamente los archivos markdown de cada categoría.
- **Búsqueda vía CLI**:
  ```bash
  npx -y modern-web-guidance@latest search "<consulta en inglés de 2-5 palabras>"
  npx -y modern-web-guidance@latest retrieve "<id-de-guia>"
  ```

#### 3. Convivencia y Prioridad con las Reglas de Kasnia Project
Las recomendaciones de `modern-web-guidance` deben aplicarse **respetando en todo momento las reglas inmutables de la sección 7 y `DESIGN.md`**:
- **Vanilla JS y CSS puro**: No importar frameworks (React, Vue, Tailwind, etc.) ni librerías externas pesadas. Toda sugerencia de la skill debe implementarse con Vanilla JS (ES6+) y CSS nativo modular.
- **Convención camelCase obligatoria**: Cualquier clase CSS o identificador derivado de un patrón de la skill debe usar estrictamente **camelCase** (ej: `.dialogBackdrop`, `.filterDrawer`, `.sortSelect`), nunca kebab-case ni BEM.
- **Tokens de diseño**: Utilizar los tokens CSS definidos en `:root` en `assets/css/main.css` y documentados en `DESIGN.md`.
- **Prevalencia de sección 7**: Las restricciones de la sección 7 de este documento tienen prioridad absoluta sobre cualquier guía externa. Si una guía sugiere sintaxis o herramientas que contradicen estas reglas, adopta el principio de la API nativa pero manteniendo el estándar Vanilla + camelCase de Kasnia Project.

---

## 8. Lector ePub Integrado (epub.js)

Se ha implementado un lector en línea utilizando la librería `epub.js` (`assets/js/lector.js` y `assets/css/lector.css`).

> **CONTRATO Y BUGS DE DISEÑO DEL LECTOR:**
> Consulta la **sección 8 de `DESIGN.md`** para revisar el contrato DOM-JS inmutable (IDs obligatorios en `layouts/lector/single.html`) y los 8 bugs corregidos que no se deben revertir (como ilustraciones en modo continuo, canvas Chromium transparente, `scrollbar-gutter: auto` y tipografía Inter).

### 8.1 Arquitectura del Lector
- **Acceso:** Se accede mediante un botón "Leer Online" en el modal de descargas (`layouts/_default/baseof.html` y `novela.js`).
- **Renderizado:** Utiliza una página base en Hugo (`layouts/lector/single.html`).
- **Estilos (`lector.css`):** Estructurado por flujo lógico de interfaz (Base -> Layout -> Modales -> Controles). Para prevenir recálculos costosos, están prohibidos los selectores universales (`*`), especialmente en pseudo-elementos como las scrollbars.
- **Lógica (`lector.js`):** Gestiona la instanciación de `ePub()`, controles de interfaz (TOC, Ajustes), persistencia en `localStorage` y navegación. Los límites numéricos, pasos y precisiones de todos los controles de ajuste se centralizan en el objeto `SETTING_LIMITS`.
- **Rendimiento UI:** Las consultas al DOM (`getElementById`, `querySelectorAll`) requeridas por la interfaz se realizan una única vez durante `DOMContentLoaded` y se mantienen en caché global. La función `updateUIFromSettings` actúa exclusivamente sobre estas referencias para evitar bloqueos durante la sincronización interactiva.
- **Temas:** Existen 4 temas (Claro, Oscuro, Sepia y Gris), implementados usando `rendition.themes.register`.
- **Navegación de Volúmenes:** El panel de Información (`#readerInfoPanel`) consulta de forma asíncrona `/novelas/uploads.json` para resolver dinámicamente los botones de salto hacia el volumen anterior y siguiente publicados, así como el enlace a la ficha de la obra, sin intervenir en el ciclo de vida del visor de epub.js.

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
- **Lógica Cliente (`assets/js/ranking.js`)**: Lee el JSON inyectado y renderiza el DOM utilizando Vanilla JS. Los filtros intra-página (periodo y límite) usan transiciones suaves Vanilla CSS (`.isSwitching`). La **View Transitions API** se reserva exclusivamente para la transición de página al hacer clic en una tarjeta de novela hacia su ficha técnica inyectando `style="view-transition-name: n${novelId}"`. También inyecta dinámicamente un cálculo de píxeles (`sizes`) para solicitar a través de la etiqueta `<picture>` la resolución de portada exacta y óptima (`400w`, `700w` o `900w`).
- **Integración con Home**: La sección de "Novelas Destacadas" en `layouts/index.html` es semi-dinámica. Lee la data de `site.Data.ranking.periods.days7` en tiempo de compilación para mostrar siempre las 3 novelas más populares de la última semana. Si el archivo JSON llegara a faltar, utiliza un fallback seguro de 3 IDs predefinidos para no romper el diseño.

---

## 10. Sistema de Comentarios y Discusión (Cloudflare D1 & Functions)

El sitio cuenta con un sistema nativo de comentarios integrado al final de cada ficha de novela (`layouts/novelas/single.html`). Es 100% independiente de servicios externos de terceros: no utiliza `<iframe>`, cookies de rastreo ni publicidad, preservando la velocidad, la privacidad del lector y la estética de Kasnia Project.

### 10.1 Arquitectura y Base de Datos (Cloudflare D1)

- **Motor Serverless**: Utiliza Cloudflare Pages Functions en el directorio `/functions/` para resolver las peticiones REST.
  - `GET /api/comments?novelId=XX`: Consulta y devuelve el árbol estructurado de comentarios y respuestas anidadas.
  - `POST /api/comments`: Procesa y almacena nuevos comentarios o respuestas directas.
  - `GET /api/comments/delete?id=XX&token=YY`: Endpoint seguro de moderación rápida con token secreto.
- **Base de Datos Relacional**: Utiliza **Cloudflare D1** (base de datos SQLite distribuida globalmente, binding `DB`).
- **Esquema de la Tabla `comments`**:
  ```sql
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id TEXT NOT NULL,
    parent_id INTEGER DEFAULT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT DEFAULT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_approved INTEGER DEFAULT 1,
    is_staff INTEGER DEFAULT 0
  );
  ```
- **Aislamiento Estricto de Entornos**: El backend analiza el encabezado del host (`request.url`). En producción (`kasniaproject.com`), opera con el `novel_id` original (ej: `"01"`). En entornos de vista previa (`*.pages.dev`) o desarrollo local, prefija el identificador como `dev_${novelId}` (ej: `"dev_01"`). Esto garantiza que las pruebas de desarrollo nunca contaminen los comentarios de producción.

### 10.2 Flujo Cliente y Optimización de Consultas (`novela.js`)

- **Carga Bajo Demanda (On-Demand)**: La sección de comentarios se presenta inicialmente con un placeholder ligero (`.commentsPlaceholder`) y un botón *"Cargar comentarios"*. Los comentarios no se consultan automáticamente en cada visita regular a la novela, lo que ahorra millones de lecturas innecesarias en D1 en visitas que solo descargan tomos o leen la sinopsis.
- **Carga Automática por Ancla Profunda**: Si un lector accede mediante un enlace con ancla (`#comentarios` o `#comment-X`), el script omite el placeholder e inicia inmediatamente la petición a `/api/comments`. Desplaza la pantalla con scroll suave hacia el contenedor de comentarios, renderiza el árbol y centra el comentario objetivo aplicando un resplandor rosa Kasnia temporal (`.highlightedComment`).
- **Compensación de Navbar**: La sección (`.novelCommentsSection`) y cada tarjeta (`.commentItem`) cuentan con `scroll-margin-top: calc(var(--navbarHeight) + 24px);`, evitando que la barra de navegación fija (68px) oculte el encabezado del comentario tras el scroll.
- **Formato Enriquecido y Spoilers**: Soporta marcado Markdown ligero:
  - Negrita: `**texto**`
  - Cursiva: `*texto*`
  - Spoilers: `||texto secreto||`. Se transforman en elementos accesibles `.commentSpoiler` con `role="button"` que revelan su contenido al hacer clic o presionar `Enter`/`Espacio`.
- **Árbol de Respuestas Anidadas**: Cada comentario dispone de un botón *"Responder"* que despliega un formulario inline dinámico, permitiendo conversaciones fluidas vinculadas mediante `parent_id`.
- **Ordenación Cronológica Reactiva**: Cabecera de discusión (`#commentsToolbar`) con selector Segmented Control para conmutar entre "Más recientes" y "Más antiguos". Reorganiza el árbol de comentarios instantáneamente en memoria sin repetir llamadas a la base de datos D1 y persiste la preferencia del usuario en `localStorage` (`kasniaCommentSort`).
- **Persistencia en Navegador**: El nombre y correo del lector se guardan en `localStorage` (`kasniaAuthor`, `kasniaEmail`) para no tener que reintroducirlos en futuros comentarios.

### 10.3 Moderación y Notificaciones

- **Alertas en Tiempo Real por Telegram**:
  - Al publicarse un comentario, Cloudflare Functions notifica inmediatamente al bot de Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).
  - El mensaje incluye autor, correo (oculto para el público, visible solo para staff), novela, texto y dos botones interactivos:
    - `[ 🔗 Ver en la web ]`: Abre directamente la novela centrando el comentario específico.
    - `[ 🗑️ Eliminar ]`: Llama al endpoint `/api/comments/delete` mediante enlace directo autenticado con `MOD_SECRET`, eliminando el comentario con un solo clic.
- **Página de Eliminación Limpia**:
  - La respuesta de `/api/comments/delete` renderiza una pantalla minimalista con diseño oscuro Kasnia y vectores SVG limpios (sin emojis) informando del éxito o fallo de la acción.
- **Notificaciones por Correo a Lectores (Resend)**:
  - Si un lector deja su correo voluntariamente y recibe una respuesta directa a su comentario, el sistema despacha un correo transaccional vía Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`).
  - La plantilla HTML aplica la identidad oscura de Kasnia (`#0d0e12`, tarjeta `#181a22`, acentos `#ff9ac5`, texto `#12070c`).
  - Los spoilers se enmascaran automáticamente como `[Spoiler oculto]` para no arruinar la trama en la bandeja de entrada.
  - La promesa de envío se ejecuta en segundo plano con `context.waitUntil()`. Si la cuota mensual de correo se agota o falla el servicio, el comentario se guarda en la base de datos sin interrumpir la experiencia del usuario.

### 10.4 Identificación y Modo Staff

- **Verificación Segura**: El formulario dispone de un enlace discreto *"¿Eres del Staff?"*. El miembro introduce el `MOD_SECRET` configurado en Cloudflare.
- **Almacenamiento Local**: La clave se guarda de forma persistente en `localStorage.getItem("kasniaStaffKey")` del dispositivo del moderador.
- **Validación Backend**: Al enviar el comentario, el backend valida la clave contra `context.env.MOD_SECRET`. De coincidir, almacena `is_staff = 1` en D1.
- **Distintivo Visual**: Los comentarios de staff muestran una insignia semántica `.commentStaffBadge` ("Staff") y en Telegram se etiquetan con `🎖️ [STAFF]`. Nadie puede fingir ser staff simplemente escribiendo ese nombre en el formulario.

### 10.5 Filtros de Seguridad y Antispam

- **Honeypot Bot Trap**: El formulario incluye un campo oculto `website` invisible para humanos. Si un bot lo rellena, el backend rechaza la petición silenciosamente con HTTP 200 sin escribir en D1.
- **Filtro de Enlaces**: Los comentarios que contengan más de 2 enlaces HTTP/HTTPS se rechazan con HTTP 400.
- **Límite de Longitud**: Validación estricta a un máximo de 1.000 caracteres en frontend y backend.
- **Privacidad**: Los correos electrónicos de los lectores nunca se devuelven en la API pública (`GET /api/comments`), manteniéndose estrictamente confidenciales.
