# DESIGN.md ─ Referencia de Diseño e Interfaz

> **Cómo usar este documento:**
> 1. Consulta este documento **antes de modificar cualquier archivo de interfaz** (`assets/css/`, `assets/js/` o `layouts/`).
> 2. Mantén actualizado este documento cada vez que añadas o modifiques un componente, regla o token.
> 3. Las reglas de `AGENTS.md` (sección 7), los tokens de color e identidad, las reglas transversales (sección 5) y las invariantes del lector (sección 8) son **estrictamente inmutables**.

---

## 1. Dirección e Identidad

- **Filosofía visual:** Estilo inspirado en Apple Books y App Store: tipografía grande y jerárquica, amplio espacio en blanco y aire, tarjetas con radios continuos, efecto cristal selectivo (`backdrop-filter`) y movimiento sutil y fluido.
- **Skills de referencia:** `apple-design`, `emil-design-eng`, `redesign-existing-projects`.
- **Acento Kasnia (Inmutable):**
  - **Modo Oscuro:** `--accentColor: #ff9ac5` | Texto sobre acento: `--accentContrastText: #12070c` (ratio de contraste > 8.5:1).
  - **Modo Claro:** `--accentColor: #e6528b` | Texto sobre acento: `--accentContrastText: #ffffff` (ratio de contraste > 4.5:1).
- **Fondo base oscuro:** `--surfaceBase: #0d0e12` (gris neutro profundo en lugar de negro puro `#000000` para reducir fatiga visual y permitir jerarquía por capas de elevación).

---

## 2. Tipografía y Espaciado Óptico

- **Familia principal:** `Inter`, autoalojada en formato variable `.woff2` en `static/fonts/` (`/fonts/InterVariable.woff2` y `/fonts/InterVariable-Italic.woff2`), con `@font-face`, pesos `100 900`, `font-display: swap` y preload en el `<head>` de `baseof.html`.
- **Token CSS:** `--fontPrimary: "Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif;`
- **Ajustes y OpenType:** `font-feature-settings: "cv02", "cv03", "cv04", "cv11";` aplicados globalmente en `body`.
- **Tracking óptico (Inspirado en Apple HIG):**
  - `--trackingTight`: `-0.02em` (Headings, display titles y nombres de obras).
  - `--trackingNormal`: `0em` (Texto base de lectura y párrafos).
  - `--trackingWide`: `0.04em` (Badges, tags, small caps y metadatos).
  - `--trackingWider`: `0.08em` (Subencabezados en mayúsculas y eyebrows).

---

## 3. Tokens (camelCase)

Todos los valores visuales están centralizados en `:root` (`assets/css/main.css`) y redefinidos en `[data-theme="light"]`.

### 3.1 Colores y Superficies

| Token | Modo Oscuro | Modo Claro | Uso y Semántica |
| --- | --- | --- | --- |
| `--accentColor` | `#ff9ac5` | `#e6528b` | Color de acento de marca (fijo e inmutable) |
| `--accentContrastText` | `#12070c` | `#ffffff` | Texto legible sobre fondo de acento |
| `--surfaceBase` | `#0d0e12` | `#fbfbfd` | Fondo principal de página (gris neutro / off-white Apple) |
| `--surfaceSecondary` | `#13151b` | `#f2f2f7` | Fondo secundario (footer, paneles secundarios, inputs) |
| `--surfaceCard` | `#181a22` | `#ffffff` | Superficie de tarjetas y contenedores elevados |
| `--surfaceElevated` | `#20232e` | `#ffffff` | Capas flotantes, popovers y modales |
| `--navbarBg` | `rgba(13, 14, 18, 0.75)` | `rgba(251, 251, 253, 0.8)` | Fondo translúcido con efecto cristal |
| `--navbarBgSolid` | `#0d0e12` | `#fbfbfd` | Fallback sólido para navegadores sin `backdrop-filter` |
| `--mobileMenuBg` | `rgba(13, 14, 18, 0.94)` | `rgba(251, 251, 253, 0.96)` | Fondo del menú móvil a pantalla completa |
| `--textPrimary` | `#f5f5f7` | `#1d1d1f` | Texto principal de alto contraste |
| `--textSecondary` | `#98989f` | `#6e6e73` | Texto secundario y descriptivo |
| `--textMuted` | `#636366` | `#86868b` | Texto atenuado, etiquetas y metadatos |
| `--borderSubtle` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.06)` | Bordes sutiles y divisores internos |
| `--borderStrong` | `rgba(255, 255, 255, 0.16)` | `rgba(0, 0, 0, 0.12)` | Bordes destacados y estado hover |
| `--shadowSubtle` | `0 2px 8px rgba(0,0,0,0.25)` | `0 2px 8px rgba(0,0,0,0.04)` | Sombra para elementos interactivos pequeños |
| `--shadowMedium` | `0 8px 24px rgba(0,0,0,0.35)` | `0 8px 24px rgba(0,0,0,0.08)` | Sombra para elevación estándar |
| `--shadowElevated` | `0 16px 40px rgba(0,0,0,0.45)` | `0 16px 40px rgba(0,0,0,0.12)` | Sombra para elementos flotantes y modales |

### 3.2 Radios y Bordes Redondeados

- `--radiusSmall`: `8px` (Botones compactos, tags, enlaces, inputs).
- `--radiusMedium`: `14px` (Portadas físicas, tarjetas secundarias, paneles).
- `--radiusLarge`: `20px` (Tarjetas principales, contenedores editoriales).
- `--radiusXLarge`: `28px` (Tarjetas destacadas, bottom sheets móviles).
- `--radiusFull`: `9999px` (Cápsulas, segmented controls, botones circulares, toggles).

### 3.3 Espaciado Sistemático

- `--space2xs`: `4px` | `--spaceXs`: `8px` | `--spaceSm`: `12px` | `--spaceMd`: `16px`
- `--spaceLg`: `24px` | `--spaceXl`: `32px` | `--space2xl`: `48px` | `--space3xl`: `64px` | `--space4xl`: `96px`

### 3.4 Estructura y Layout

- `--containerMaxWidth`: `1080px` (Ancho uniforme central en navbar, catálogo, comisiones, donaciones, staff, legales).
- `--navbarHeight`: `68px` (Altura fija del header).

### 3.5 Movimiento, Curvas y Tiempos

- **Curvas de Bézier:**
  - `--easeOutStrong`: `cubic-bezier(0.23, 1, 0.32, 1)` (Microinteracciones, feedback `:active`, elevación hover).
  - `--easeInOutSmooth`: `cubic-bezier(0.77, 0, 0.175, 1)` (Transiciones de tema y color de fondo).
  - `--easeDrawer`: `cubic-bezier(0.32, 0.72, 0, 1)` (Entrada y salida de hojas móviles / bottom sheets estilo iOS).
- **Duraciones:**
  - `--durationInstant`: `100ms` (Respuesta táctil y feedback de presión `:active`).
  - `--durationFast`: `160ms` (Hover, elevación de libros y microanimaciones).
  - `--durationNormal`: `240ms` (Transiciones de color, apertura de menús, filtros).
  - `--durationSlow`: `350ms` (Transición de modales y crossfade de vistas).

### 3.6 Tokens Específicos del Lector Online (`.readerApp`)

Definidos en `assets/css/lector.css` según el tema activo (`light`, `dark`, `sepia`, `grey`):
- `--reader-bg`, `--reader-text`, `--reader-header-bg`, `--reader-border`, `--reader-accent`.
- `--reader-panel-glass`, `--reader-panel-solid`, `--reader-panel-border`, `--reader-panel-text`, `--reader-panel-text-muted`, `--reader-panel-input-bg`.

---

## 4. Componentes y Métricas

### 4.1 Globales

- **Navbar (`.navbar`):** Altura 68px fija, z-index 1000, `backdrop-filter: blur(20px) saturate(180%)`, borde inferior de 1px con `--borderSubtle`. Contenedor centrado en `--containerMaxWidth: 1080px` con padding horizontal `--spaceLg`.
  - `.navbarLogo`: 42px de altura, `:hover scale(1.04)`, `:active scale(0.97)`.
  - `#themeToggle`, `#menuToggle`: Mínimo 44x44px. Animación de sol/luna coordinada con View Transitions API. Menú hamburguesa conmuta suavemente entre `menuIcon` y `closeIcon`.
- **Menú Móvil (`.mobileMenu`):** Fijado bajo la navbar (`top: var(--navbarHeight); height: calc(100dvh - var(--navbarHeight))`). `backdrop-filter: blur(24px) saturate(180%)`, animación de entrada `--easeDrawer`, stagger de enlaces cada 40ms, cierre con Escape y tap exterior.
- **Footer (`footer`):** 3 bloques (Marca con logo de 52px y `text-wrap: pretty`, Enlaces en mayúsculas de 0.78rem con tracking `0.08em`, Redes sociales en botones circulares de 44x44px con elevación `-2px` y acento). En móviles (`<= 768px`), todos los elementos se centran simétricamente.
- **Botón "Volver arriba" (`#backToTop`):** Botón circular de 46x46px en superficie flotante, throttle de scroll con `requestAnimationFrame` en `main.js`, traslación vertical y escalado por aceleración gráfica.

### 4.2 Home (`layouts/index.html`, `assets/css/home.css`)

- **Hero (`.heroSection`):** Titular H1 "Kasnia Project" con `clamp(2.5rem, 6.5vw, 4rem)`, peso 800, `--trackingTight`. Badge editorial "Novelas Ligeras en Español" con punto luminoso de 6px. Barra de métricas unificada en `--surfaceCard` con radio `--radiusFull` y cifras tabulares (`tabular-nums`).
  - **Ambient Glow (`.heroAmbientGlow`):** Gradiente radial superior (10% de `--accentColor` en oscuro, 16% con parada al 6% y 840px de ancho en claro). Aporta profundidad perceptible sin usar `backdrop-filter`.
- **Últimos Lanzamientos (`.latestReleasesSection`, `.latestReleasesGrid`):** Rejilla simétrica compacta de 2 columnas en una sola fila (1 en tablet y móvil `<= 820px`) con los 2 volúmenes traducidos más recientes del sitio. Cada tarjeta horizontal `.latestReleaseCard` integra portada física (68x97px, aspect ratio 1 / 1.43 con lomo reflectante `.coverSpine`), badge de acento `#1 Último Lanzamiento` (`.latestReleaseTag` con `#tagSparkle`) o `#2 Reciente`, estado de publicación (`Publicado` / `Vista previa`), metadatos de volumen y fecha con icono de calendario, flecha direccional `.latestReleaseArrow`, micro-elevación en hover y respuesta táctil `:active scale(0.98)`.
- **Novelas Destacadas (`.featuredCard`):** Grid del Top 3 semanal. Portadas físicas con aspect ratio 1 / 1.43, radio `--radiusMedium`, lomo especular y badges de podio idénticos al Ranking (`#1` con base opaca de alto contraste `rgba(13, 14, 18, 0.94)` / `rgba(255, 255, 255, 0.98)` y borde en `--accentColor`; `#2` y `#3` en superficies neutras elevadas).
- **Sección de Comisiones (`.commissionsCard`):** Tarjeta destacada de 2 columnas (máx. 960px). Columna izquierda con lista de ventajas con checks; columna derecha (280px) con caja de acción y botón directo a `/comisiones`. En pantallas `<= 768px` pasa a una sola columna vertical.
- **Tarjetas de Comunidad y Apoyo (`.communityCard`):** Rejilla simétrica de 2 columnas con radio `--radiusLarge`, cajas de iconos de 52x52px tintadas con 10% de acento y botón `.communityBtn` al 100%.

### 4.3 Catálogo y Tarjeta de Portada Reutilizable

- **Barra de Controles (`.controlsSection`):** Buscador de 48px de altura táctil con botón (×) dinámico de vaciado. Botón toggle de filtros con badge numérico de filtros activos. Panel colapsable mediante CSS Grid (`grid-template-rows: 0fr` a `1fr`), con 3 grupos filtrables (Estado del proyecto, Demografía y Géneros), chips interactivos tipo Apple con `:active scale(0.96)` y botón contextual de "Limpiar selección".
- **Barra de Acciones y Ordenación (`.catalogMetaBar`):** Contador dinámico de resultados con `aria-live="polite"` desacoplado del criterio de ordenación (solo varía cuando hay filtros o búsquedas activas). Selector de ordenación nativo estilizado mediante el modelo moderno `appearance: base-select` y `::picker(select)` con rotación en `:open`, checkmark acentuado y popover con glassmorphism Apple. Botón de restablecimiento (`#resetFiltersBtn`) posicionado a la izquierda del selector para evitar saltos o desplazamientos visuales del control.
- **Skeletons de Carga:** 8 tarjetas esqueleto con animación de pulso sutil (`skeletonPulse` al 50%-85%) entre `--surfaceSecondary` y `--surfaceCard`, eliminando el parpadeo durante la petición fetch.
- **Tarjeta de Portada Reutilizable (`.novelCard`):**
  > **PUNTO DE SINCRONIZACIÓN CRÍTICO:** El marcado y CSS de `.novelCard` está unificado entre el Catálogo (`assets/css/novelas.css`) y el Ranking (`assets/css/ranking.css`). Toda modificación debe replicarse en ambos archivos.
  - **Estructura semántica:** `<article class="novelCardWrapper">` conteniendo `<a class="novelCard">` con `view-transition-name: n[novelId]`.
  - **Portada física:** Aspect ratio 1 / 1.43, radio `--radiusMedium` (14px), fondo `--surfaceSecondary`, lomo reflectante `.coverSpine` (`inset: 0` con degradado sutil al 7% y sombra interior) y sombra difusa multicapa.
  - **Hover & Press:** Elevación física `translateY(-5px)` con sombra de 44px en hover; retracción háptica `scale(0.98)` en `:active` bajo `--easeOutStrong`.
  - **Pie editorial (`.novelCardContent`):** Título en peso 700 con clamp a 2 líneas, autor en `--textSecondary` y recuento de volúmenes en cifras tabulares. En el Ranking se añaden la insignia `.rankingBadge` y el porcentaje de visitas `.rankingPercentage`.

### 4.4 Ficha de Novela y Modales (`novela.css`, `novela.js`)

- **Hero de Novela (`.novelHero`):** 2 columnas en escritorio (1 en móvil). Portada física a la izquierda; a la derecha: badges de estado/demografía, título display, línea de creadores ("Por Autor • Ilustrado por Ilustrador"), botón CTA de descarga rápida del último volumen y sinopsis colapsable con chevron en 180°.
- **Tarjeta de Volumen (`.volumeCard`):** Portada completa e intacta sin cintas diagonales. Pie fijo y legible con número de volumen ("Volumen X"), badges especiales (`Vista previa` en ámbar, `En proceso` en azul, `Pronto` en rojo) e indicador de descarga.
- **Panel de Detalles de la Obra (`.detailsCard`):** Panel unificado de 2 columnas al estilo especificaciones técnicas de Apple (nombres alternativos, autor, ilustrador, volúmenes traducidos vs. publicados en cifras tabulares, adaptaciones y chips de género interactivos).
- **Novelas Recomendadas (`.recommendationsSection`):** Módulo "También te podría gustar" situado entre la ficha técnica y la sección de comentarios. Calcula dinámicamente en compilación las 3 obras más afines mediante puntuación ponderada (mismo autor/universo +15, demografía compartida +3, géneros comunes +2). Emplea la cuadrícula compacta `.recommendationsGrid` (portadas acotadas a máx. 160px para mantener jerarquía visual por debajo de las descargas) y la tarjeta reutilizable `.novelCard` con preservación de `view-transition-name: n[id]` hacia la siguiente ficha.
- **Modales HTML5 `<dialog>` (`downloadModal`, `previousVolsModal`):**
  - Implementación nativa con `top layer`, backdrop (`blur(8px)` con `rgba(0,0,0,0.6)`), trampa de foco accesible y cierre por Escape o clic exterior.
  - **Cristal Apple:** Panel con `backdrop-filter: blur(28px) saturate(180%)`, fondo semitranslúcido de alto contraste (> 7:1) y fallback sólido.
  - **Bottom Sheet en Móvil (`<= 680px`):** Anclaje inferior con radio superior `--radiusXLarge`, tirador táctil `.modalHandle` (36x4px en área de 44x44px), curva iOS `--easeDrawer` y animación de arrastre hacia abajo (drag-to-dismiss) con umbral de descarte en 70px (`.willDismiss`).
  - **Controles internos:** Botón "Leer Online" tintado de acento translúcido al 12% (permanece visible si el volumen tiene EPUB propio independientemente del servidor activo), selector de servidor estilo Segmented Control iOS y botones de formato estandarizados ("Archivo .pdf" y "Archivo .epub").
- **Sección de Comentarios y Discusión (`.novelCommentsSection`):**
  - **Ubicación y scroll:** Al final de la ficha técnica. Con `scroll-margin-top: calc(var(--navbarHeight) + 24px)` para evitar colisiones visuales con la navbar fija al navegar por ancla.
  - **Placeholder bajo demanda (`.commentsPlaceholder`):** Estado inicial ligero que evita consultas innecesarias. Aloja icono central `#chatIcon`, títulos descriptivos y botón principal `.loadCommentsBtn` (48px de altura táctil).
  - **Formulario de Comentario (`.commentForm`):** Tarjeta en `--surfaceSecondary` con radio `--radiusMedium`. Dispone de grid adaptable para autor y correo opcional, selector discreto para identificación de staff con `MOD_SECRET`, barra de formato con botones compactos (`.formatBtn` para negrita, cursiva y spoilers con icono `#eyeIcon`), campo honeypot oculto y contador de caracteres con cifras tabulares (`#charCount`).
  - **Tarjeta de Comentario (`.commentCard`):** Superficie `--surfaceSecondary` con radio `--radiusLarge` (20px) y borde `--borderSubtle`. Aloja avatar determinista de 40x40px generado por hash de autor, insignia semántica `.commentStaffBadge` (cuando `is_staff === 1`), fecha relativa y botón "Responder" con microinteracción.
  - **Spoilers Interactivos (`.commentSpoiler`):** Bloque difuminado con fondo oscuro accesible vía teclado (`Enter`/`Espacio`) o clic táctil. Cambia al estado `.isRevealed` mostrando el contenido con microtransición suave.
  - **Resplandor de Anclaje Directo (`.highlightedComment`):** Resalta la tarjeta con borde en `--accentColor` y sombra en resplandor rosa `rgba(255, 154, 197, 0.4)` durante 3,5 segundos al llegar mediante enlace directo con `#comment-X`.
  - **Árbol de Respuestas Anidadas (`.repliesContainer`):** Subhilo indentado con línea guía continua izquierda en `--borderSubtle`, manteniendo la jerarquía visual de conversación.
  - **Barra de Herramientas y Ordenación (`.commentsToolbar`):** Cabecera de discusión situada entre el formulario y la lista con selector Segmented Control (`.commentsSortControl`) para alternar entre "Más recientes" y "Más antiguos". Persiste la preferencia en `localStorage` (`kasniaCommentSort`). En móviles (`<= 480px`), se distribuye al ancho completo con botones divididos al 50%/50%.

### 4.5 Ranking de Popularidad (`ranking.css`, `ranking.js`)

- **Podio Top 3 (`.rankingPodiumGrid`):** Fila superior de 3 columnas destacadas con portadas prominentes y carga `loading="eager"`. Insignia `#1` con base opaca de alto contraste (`rgba(13, 14, 18, 0.94)` / `rgba(255, 255, 255, 0.98)`), borde de 1.5px en `--accentColor` y resplandor difuso.
- **Cuadrícula Restante (`.rankingGrid`):** Grid adaptable de 4 columnas (3 en tablet, 2 en móvil) para los puestos del `#4` en adelante, con carga diferida (`loading="lazy"`).
- **Controles Segmented Control:** Dos selectores en cápsula para periodo (7, 21 y 30 días) y límite (Top 5 / Todas).
- **Transición suave Vanilla en filtros:** Microtransición de crossfade (`.isSwitching` con reducción de opacidad a 0.45 y microdesplazamiento vertical de 4px con `--easeOutStrong`) al alternar periodo o límite. La View Transitions API se reserva estrictamente para la navegación entre páginas (al pulsar sobre la portada hacia la ficha de la obra mediante `style="view-transition-name: n${novelId}"`).
- **Ausencia de `backdrop-filter`:** Prescinde de blur en favor de fondos sólidos y sombras sutiles.

### 4.6 Páginas Estáticas (Comisiones, Donaciones, Staff)

- **Comisiones (`comisiones.css`):** Contenedor `--containerMaxWidth: 1080px`, barra de navegación rápida `.quickNav` en cápsula para anclas (`#precios`, `#proceso`, `#incluye`, `#tiempos`, `#solicitar`, `#condiciones`). Tarifario comparativo de 2 columnas donde la tarifa **Prioritaria** destaca con superficie `--surfaceCard` y borde de acento frente a la **Estándar** en `--surfaceSecondary`, con precios tabulares (`$5` / `$10`) y botones CTA alineados simétricamente mediante `margin-top: auto`.
- **Donaciones (`donaciones.css`, `donaciones.js`):** Tarjeta de donación de PayPal (`.donationCtaCard`) destacada con botón de 52px inmediatamente bajo la cabecera. Historial de movimientos estilo Apple Wallet accesible sin depender del color (badges semánticos "Ingreso"/"Gasto", signos `+`/`-`, iconos direccionales en sprite `arrowDownLeft`/`arrowUpRight` y cifras tabulares). Segmented Control para filtrar (Todos / Donaciones / Gastos) y botón dinámico colapsable que muestra inicialmente 5 movimientos.
- **Staff (`staff.css`):** Detección nativa en compilación (`fileExists`) de avatares en `static/img/staff/jpg/[id].jpg` (cero errores 404 en consola). Tarjetas con flujo vertical natural (`flex-grow: 1` en `.staffBody`), roles detallados, badges refinados (`Creator` en ámbar dorado, `Admin` en acento) y proyectos en chips horizontales en flex-wrap con truncado limpio.

### 4.7 Páginas Legales y 404

- **Legales ─ DMCA y Privacidad (`legal.css`):** Columna de lectura editorial acotada a 720px con párrafos de máximo 68 caracteres (`~68ch`), interlineado `1.68`, títulos con acento vertical de 3px, barra `.quickNav`, tarjeta de contacto `.contactCard` con email en tipografía pesada y fecha semántica `<time datetime="YYYY-MM-DD">`.
- **Página 404 ─ 'La Página Perdida' (`404.css`):** Ilustración editorial rica de libro abierto con corte de página rasgado, marca de agua "404", partículas flotantes y marcapáginas curvado en `static/img/svg/404.svg` (`#missingPageBook`).
  - **Física de Sombra Desacoplada (`#bookGroundShadow`):** Sombra fija en el suelo; blanca (`#ffffff`) en modo oscuro para proyectar luz/sombra visible sobre `#0d0e12`, y oscura (`#000000`) en modo claro. Sincronizada con el libro bajo la misma curva armónica sinusoidal (3.6s, `cubic-bezier(0.45, 0.05, 0.55, 0.95)`).
  - **Acciones duales:** `btnPrimary` ("Volver al inicio") y `btnSecondary` ("Explorar catálogo") con mínimo 48px de altura táctil.

### 4.8 Lector Online (`lector.css`, `lector.js`)

- **Filosofía Apple Books:** El libro es el protagonista; la interfaz permanece oculta durante la lectura y aparece con suavidad mediante un tap central (`.ui-hidden`).
- **Estructura fija:**
  - Barra superior accesible `<nav id="readerHeader">` con botón "Volver" (44x44px) y título truncado con `--trackingTight`.
  - Barra inferior fija `<nav id="readerBottomBar">` con safe-area insets y 4 botones de 44x44px: Índice, Ajustes, Info y Pantalla completa.
  - Progreso flotante `.readerFooter` con porcentaje en cifras tabulares.
  - Barras con fondos sólidos (`--reader-header-bg`), evitando `backdrop-filter` durante la lectura para asegurar 60/120fps fluidos.
- **Paneles Modales con Cristal Apple (`.readerModal`):**
  - Aplicado a Índice, Ajustes e Info al abrirse: `backdrop-filter: blur(28px) saturate(180%)`, scrim con `blur(8px)` y superficies adaptadas a los 4 temas (contraste > 8.5:1).
  - En móviles (`<= 680px`), emergen como bottom sheets con tirador `.modalHandle`, curva iOS `--easeDrawer` y gesto drag-to-dismiss limitado a la cabecera/tirador.
  - **Navegación de Volúmenes en Info (`.infoVolumeNavSection`):** Módulo "Volúmenes de la Obra" integrado en `#readerInfoPanel`. Cruza el EPUB actual contra `/novelas/uploads.json` para renderizar botones directos hacia el volumen anterior y siguiente publicados, además de un enlace a la ficha completa de la obra en la web.
- **Controles de Ajustes:** Segmented controls para Temas (Claro, Oscuro, Sepia, Gris), Modos (Paginado / Continuo) y Alineación (Justificado, Izquierda, Centro). Steppers táctiles para tipografía, interlineado, espaciado de párrafo, tracking y márgenes. Switch iOS para guionado silábico (`hyphens`).

---

## 5. Reglas de Diseño Transversales (Reglas de Oro)

1. **Nomenclatura camelCase estricta:** Todas las clases CSS, IDs, variables y funciones en JavaScript se nombran estrictamente en **camelCase** (ej: `.navbarContainer`, `.volumeCard`, `#downloadModal`, `initSynopsisToggle`). Está prohibido el uso de kebab-case o BEM.
2. **Tokens obligatorios:** Nunca uses colores hexadecimales o valores mágicos sueltos en el CSS. Utiliza siempre las variables de `:root` (`var(--accentColor)`, `var(--surfaceCard)`, `var(--spaceMd)`).
3. **Uso selectivo de Cristal (`backdrop-filter`):**
   - **Permitido exclusivamente en:** Navbar, menú móvil, modales de descarga (`downloadModal`, `previousVolsModal`) y paneles del lector (`.readerModal`).
   - **Prohibido en:** Catálogo, tarjetas de libros, fichas de novela, ranking, páginas estáticas, 404 y barras fijas de lectura.
4. **Semántica estricta y exclusividad de `<header>`:**
   - La etiqueta `<header>` está reservada **única y exclusivamente para la navbar global** en `baseof.html`.
   - Todo el contenido dentro de `<main>` debe estructurarse mediante etiquetas `<section>`.
   - En el lector, la cabecera superior debe ser `<nav id="readerHeader">`. Esto erradica colisiones con el selector global `header { position: fixed; top: 0; view-transition-name: header; }` de `main.css`.
5. **Jerarquía de Encabezados (Un solo `h1` por página):** Cada página debe contar con un único elemento `<h1>` semántico:
   - Home: `#heroTitle` ("Kasnia Project").
   - Catálogo: `.novelsIntroTitle` ("Catálogo de Novelas").
   - Ficha: `.novelTitle` ("[Título de la Obra]").
   - Ranking: `.sectionTitle` ("Ranking de Popularidad").
   - Comisiones: `.commissionsTitle` ("Comisiones de Traducción").
   - Donaciones: `.donationsTitle` ("Apoya a Kasnia Project").
   - Staff: `.staffTitle` ("Nuestro Equipo").
   - Legales: Titular display ("Aviso Legal y DMCA" / "Política de Privacidad").
   - 404: `.errorTitle` ("Página no encontrada").
   - Lector: `#readerTitle` ("[Título del Libro]").
6. **Cero SVGs inline (Centralización en Sprites):** Ningún archivo HTML debe contener código SVG crudo ni elementos `<path>` en su marcado. Todos los iconos vectoriales deben definirse como símbolos en `static/img/svg/` y consumirse vía `<use href="/img/svg/[archivo].svg#[id]" />`.
7. **Accesibilidad táctil y visual:**
   - Todo botón o elemento interactivo debe tener un área táctil mínima de **44x44px** (o 48px de altura para botones principales de acción).
   - Foco accesible garantizado: `:focus-visible { outline: 2px solid var(--accentColor); outline-offset: 3px; }`.
   - Preferencias de movimiento (`prefers-reduced-motion: reduce`): Cancela todas las transformaciones físicas (`transform: none !important`) y reduce transiciones a 0.01ms.
   - Preferencias de transparencia (`prefers-reduced-transparency: reduce`): Desactiva `backdrop-filter` y sustituye superficies de cristal por fondos sólidos de alto contraste.
   - Cifras tabulares: Emplear siempre `font-variant-numeric: tabular-nums` en números de volúmenes, porcentajes, métricas, fechas y precios.

---

## 6. Decisiones Vigentes y su Justificación

- **Navbar fija translúcida (Sticky Blur):** Mantiene la navegación accesible en todo momento y el contenido fluyendo de forma visible bajo ella.
- **Fondo base `#0d0e12` (Gris neutro profundo):** Evita el contraste excesivo del negro puro `#000000`, aportando calidez visual y permitiendo hasta 3 capas de elevación perceptible.
- **Acento Kasnia fijo:** Identidad inmutable de la marca (Rosa suave `#ff9ac5` en oscuro / Fucsia frambuesa `#e6528b` en claro).
- **Tipografía Inter variable autoalojada:** Garantiza independencia de servicios de terceros, evita latencias externas, resuelve caracteres especiales japoneses/latinos y ofrece tracking óptico nativo.
- **Hero de Home con marca protagonista:** Sitúa "Kasnia Project" en el titular principal display (`H1`) para afianzar el reconocimiento del proyecto desde el primer segundo.
- **Separación de Hero y Último Lanzamiento:** Mantiene el Hero como manifiesto editorial despejado y ofrece al último volumen una tarjeta horizontal destacada con su portada física visible.
- **Resplandor ambiental al 16% en modo claro:** Aporta calidez espacial sobre el fondo off-white `#fbfbfd` sin necesidad de filtros pesados.
- **Paginación eliminada en el Catálogo:** El volumen de novelas permite carga instantánea y filtrado dinámico en memoria sin fragmentar la navegación.
- **Duplicación de `novelCard` en `ranking.css`:** Mantiene hojas de estilo aisladas y modulares sin generar dependencias cruzadas entre el catálogo y el ranking.
- **Transiciones de página vs. transiciones intra-página en Ranking:** La View Transitions API se emplea exclusivamente para la navegación entre páginas (transición fluida de la portada física hacia la ficha de novela mediante `view-transition-name: n${novelId}`). Los cambios dinámicos dentro de la misma vista (periodos y límites) utilizan transiciones normales con Vanilla CSS (`.isSwitching`), preservando el identificador de transición de página de cada tarjeta.
- **HTML5 `<dialog>` nativo en Modales:** Delega en el navegador el control del *top layer*, trampa de foco y Escape, asegurando cero dependencias JS externas.
- **Modales como Bottom Sheet en móvil con drag-to-dismiss:** Proporciona interacción nativa táctil en pantallas estrechas sin perder la elegancia del diálogo centrado en escritorio.
- **Botón 'Leer Online' desacoplado del servidor de descargas:** Permite acceder al visor si el volumen tiene EPUB propio, independientemente de si el usuario está explorando la pestaña de Google Drive.
- **Avatares con `fileExists` en Staff:** Comprobación nativa de Hugo en compilación; erradica por completo las peticiones erróneas y los 404 en consola.
- **Distinción no-cromática en Donaciones:** Asegura accesibilidad WCAG total para personas con daltonismo mediante badges textuales ("Ingreso"/"Gasto") e iconos vectoriales direccionales.
- **Ilustración 'La Página Perdida' en 404:** Reemplaza mascotas genéricas por una narrativa visual literaria acorde a una plataforma de novelas ligeras.
- **Sombra desacoplada en 404:** La sombra se ancla al suelo y reacciona en escala y opacidad según la altura del libro; en modo oscuro es blanca luminosa para proyectarse visiblemente sobre el fondo oscuro.
- **Desacoplamiento de color en el Lector:** El selector de color de texto actúa exclusivamente sobre el iframe del EPUB; la UI del lector mantiene su esquema temático derivado de la luminancia del fondo (`settings.bgColor`).
- **Carga de comentarios bajo demanda:** Ahorra millones de lecturas innecesarias en Cloudflare D1 al no consultar comentarios en visitas de lectores enfocadas exclusivamente en la descarga de volúmenes o lectura de la ficha técnica.
- **Spoilers interactivos con microtransición:** Permite discusiones sobre la trama sin destripar giros argumentales a nuevos lectores.
- **Enmascaramiento de spoilers en correos:** Evita que clientes de correo revelen fragmentos sensibles en notificaciones o bandejas de entrada.
- **Moderación instantánea vía Telegram:** Elimina la necesidad de paneles de administración pesados, permitiendo moderar desde cualquier dispositivo móvil con un solo toque.
- **Rejilla compacta de 2 lanzamientos en Home:** Equilibra la frescura editorial de la página de inicio sin ocupar un espacio vertical excesivo, permitiendo acceder a los dos tomos más recientes traducidos en una sola fila simétrica en escritorio.
- **Selector de ordenación nativo moderno (`appearance: base-select`):** Utiliza el estándar de la plataforma web moderna (`appearance: base-select` y `::picker(select)`) para estilizar el selector de ordenación del catálogo sin requerir librerías JavaScript pesadas ni duplicar estructuras en el DOM, garantizando soporte de teclado nativo y transiciones elásticas.
- **Botón de restablecimiento a la izquierda del selector de ordenación:** Previene que el selector de ordenación sufra desplazamientos horizontales en la barra de acciones al mostrarse u ocultarse el botón de reset.
- **Desacople del contador de novelas en Catálogo:** El número de novelas mostradas (`aria-live="polite"`) únicamente reacciona a filtros o términos de búsqueda activos, manteniéndose inmutable al alternar el criterio de ordenación.
- **Recomendaciones dinámicas calculadas en compilación:** Algoritmo estático de afinidad por autor, demografía y géneros en Hugo Go templates; cero impacto en la carga en el cliente y cero dependencias de bases de datos.
- **Navegación entre volúmenes en el lector vía `uploads.json`:** Aísla completamente la lógica de cambio de libro del motor `epub.js`, evitando reinicializaciones accidentales o desestabilización del visor.
- **Ordenación cronológica de comentarios (Más recientes / Más antiguos):** Selector Segmented Control en `#commentsToolbar` con persistencia en `localStorage` (`kasniaCommentSort`). Permite reorganizar el árbol de comentarios instantáneamente en memoria sin repetir peticiones a Cloudflare D1.

---

## 7. Probado y Rechazado

Cada uno de los siguientes enfoques fue evaluado, probado en el código y formalmente rechazado por los motivos técnicos que se detallan:

1. **Sombra unificada dentro del elemento flotante en 404:** Hacía que la sombra flotara en el aire junto al libro perdiendo el anclaje físico con el suelo; se desacopló en una capa base independiente.
2. **Mascota fantasma en 404:** Genérica y descontextualizada de la temática de literatura y novelas ligeras; se sustituyó por 'La Página Perdida'.
3. **Buscador integrado en 404:** Añadía complejidad innecesaria en una pantalla de error; se priorizaron dos botones claros hacia Inicio y Catálogo.
4. **Cláusula de retirada por licenciamiento comercial en DMCA:** Descartada a petición del dueño para mantener el documento centrado estrictamente en el procedimiento de notificación.
5. **Afirmación de uso de cookies para preferencias de tema en Privacidad:** Falsa técnicamente; el sitio opera con `localStorage` y analíticas sin cookies de rastreo.
6. **Alias heredados de compatibilidad (`--bg-primary`, etc.):** Mantener duplicidad de variables con guiones ensuciaba el código; eliminados al migrar todo a tokens camelCase.
7. **Uso erróneo de View Transitions API para filtros intra-página o eliminación de `view-transition-name` en tarjetas de Ranking:** La View Transitions API está reservada para transiciones de navegación entre páginas (al hacer clic en la portada hacia la ficha de la obra). Los cambios dinámicos de periodo o límite dentro de la misma vista deben usar transiciones estándar Vanilla CSS (`.isSwitching`), preservando siempre `style="view-transition-name: n${novelId}"` en los enlaces de las tarjetas.
8. **Barras de progreso ruidosas en Ranking:** Sobrecargaban visualmente la tarjeta; sustituidas por el porcentaje en texto con cifras tabulares en los metadatos editoriales.
9. **Icono decorativo de trofeo en el eyebrow del Ranking:** Inconsistente con el resto del sitio (los demás eyebrows carecen de iconos); retirado.
10. **Insignia #1 con fondo translúcido al 20% en Ranking y Home:** Se desvanecía sobre portadas claras o de tonos rosáceos; se adoptó una superficie opaca de alto contraste con borde de acento unificada en ambas páginas.
11. **Hero de Home asimétrico con tarjeta incrustada en 2 columnas:** Comprimía excesivamente la información del lanzamiento en dispositivos móviles; se dividió en dos secciones autónomas.
12. **Hero sin 'Kasnia Project' en el titular principal:** Omitir la marca en el H1 restaba identidad al impacto visual inicial; se elevó a titular principal display.
13. **Resplandor ambiental al 5% en modo claro:** Resultaba imperceptible sobre el fondo blanco hueso `#fbfbfd`; se incrementó al 16% con radio de 840px.
14. **SVG inline en plantillas HTML:** Dificultaba el mantenimiento y aumentaba el peso del HTML; se unificó todo en sprites SVG en `static/img/svg/`.
15. **Icono decorativo sobre texto de cotizaciones en Comisiones:** Sobrecargaba la tarjeta de acción; se retiró para mantener el foco en el botón de contacto.
16. **Apilamiento vertical de badges en Último Lanzamiento móvil:** Al caer en la columna estrecha de la portada los badges se apilaban; se configuraron con CSS Grid horizontal en una sola fila.
17. **Paginación en el Catálogo:** Innecesaria para el volumen del catálogo y fragmentaba la búsqueda; se eliminó todo código HTML, CSS y JS remanente.
18. **`<header>` dentro de `<main>` para la cabecera del catálogo:** Colisionaba con el selector global `header` de `main.css`, duplicaba identificadores en View Transitions y rompía el layout; sustituido por `<section class="novelsIntroSection">`.
19. **Lomo de portada fijo de 22px con sombra negra:** Demasiado pronunciado y tosco; se estandarizó con el degradado físico al 7% de `novelas.css`.
20. **Caja de aviso `novelNote` al 100% de ancho y alineada a la izquierda:** Se extendía de forma desproporcionada en pantallas anchas; se acotó a 680px y se centró simétricamente.
21. **Botón 'Leer Online' como banner de acento completo con subtítulo:** Competía visualmente en exceso contra las descargas; se rediseñó como botón refinado de 44px.
22. **Botón 'Leer Online' en gris neutro plano:** Se fusionaba con la superficie de la modal perdiendo notoriedad; se sustituyó por material tintado de acento translúcido al 12%.
23. **Ocultar 'Leer Online' al seleccionar Google Drive:** Error de UX; el botón debe permanecer accesible si el volumen cuenta con EPUB propio sin importar el servidor seleccionado.
24. **`justify-content: space-between` en `.downloadsToolbar` móvil:** Pegaba los botones a los extremos opuestos de la pantalla con un gran vacío central; se distribuyeron juntos en una fila compacta.
25. **Tirador de modal dentro del contenedor con scroll en móvil:** Desaparecía al scrollear el contenido largo; se desacopló a una barra superior fija `.modalTopBar`.
26. **Textos heterogéneos en descargas ('Descarga directa' vs 'Libro electrónico'):** Confuso al mezclar medio y formato; se unificó en "Archivo .pdf" y "Archivo .epub".
27. **`justify-content: space-between` en `.staffCard`:** Al estirarse tarjetas en la misma fila del grid por integrantes con muchas obras, dejaba vacíos artificiales bajo el avatar de miembros con pocos proyectos; se resolvió con `flex-grow: 1` en `.staffBody`.
28. **Espaciado reducido (`--spaceXs: 8px`) entre icono y texto en botones de acción:** Apiñaba visualmente iconos y textos extensos; se estandarizó en `var(--spaceSm)` (12px).
29. **Borde superior estridente de color en tarifas y alcance de Comisiones:** Rompía la sobriedad editorial; se sustituyó por elevación de superficie y badges refinados.
30. **Botón de PayPal bajo las tarjetas informativas en Donaciones:** Relegaba la llamada a la acción fuera del primer scroll; se reubicó inmediatamente bajo la cabecera intro.
31. **Historial de Donaciones dependiente únicamente del color:** Inaccesible para personas con dificultades de visión cromática; se dotó de badges textuales e iconos direccionales.
32. **Lista vertical con viñetas para proyectos en Staff:** Generaba desbalance vertical severo; se transformó en flex-wrap de chips horizontales compactos.
33. **Script `onerror` inline para avatares ausentes en Staff:** Provocaba peticiones fallidas y errores 404 en la consola del navegador; se reemplazó por la función `fileExists` de Hugo en el build.
34. **Cálculo automático de balances desde cadenas en frontmatter:** Frágil de parsear en Go templates por variaciones de formato y moneda; se mantiene como texto formateado explícito.
35. **Footer alineado a la izquierda en móvil:** Dejaba un vacío visual asimétrico en pantallas pequeñas; se centró simétricamente en `<= 768px`.
36. **Botón de copiar enlace en Donaciones:** Ruido visual innecesario; la dirección `paypal.me` es visible y el botón principal abre la pasarela de forma directa.
37. **Barra de métricas cuantitativas en Donaciones:** Redundante; el historial de movimientos ya aporta toda la transparencia necesaria.
38. **Buscador de texto en el historial de Donaciones:** Innecesario; el Segmented Control de tipo de movimiento y el colapso dinámico son suficientes y mantienen la agilidad.
39. **Presets de importes fijos para PayPal:** Restaban flexibilidad al usuario frente a la libertad de seleccionar el monto directamente en PayPal.
40. **Atajos de teclado adicionales `T` / `S` / `I` en el lector:** Complejidad innecesaria en el listener de teclado que aumentaba el riesgo de conflictos con la navegación.
41. **Arrastre táctil en todo el cuerpo del panel del lector:** Colisionaba con el scroll vertical de listas internas en Índice, Ajustes e Info; se acotó estrictamente al tirador `.modalHandle` y barra superior.
42. **Acoplamiento del color de texto del EPUB a la UI del lector:** Provocaba pérdida de legibilidad en controles y cambios de tema no deseados; la UI se desacopló manteniendo esquemas fijos coordinados con el fondo.
43. **Widgets de comentarios de terceros en iframe (Disqus, Cusdis, Remarkbox):** Probados y rechazados por caídas externas del servidor origen (Error 521 de Cusdis), rastreadores y anuncios de terceros, bugs de colisión de inputs del formulario (`form.submit` en Remarkbox) y grave colisión estética contra la interfaz limpia de Kasnia. Se implementó una solución nativa serverless con Cloudflare D1.
44. **Carga automática de comentarios en cada visita:** Descartada por provocar consultas redundantes en la base de datos D1 en visitas de usuarios que únicamente entran a descargar un volumen o revisar la ficha técnica. Se adoptó carga bajo demanda por botón o ancla directa.
45. **Emojis crudos en la interfaz de moderación:** Rechazados por apariencia informal y poco homogénea entre sistemas operativos; reemplazados por vectores SVG integrados en diseño oscuro Kasnia.
46. **Colores SaaS azul/cian en plantillas de correo:** Descartados por romper la identidad visual de Kasnia Project; se unificó la paleta del correo con Rosa suave (`#ff9ac5`), fondo `#0d0e12` y tarjeta `#181a22`.
47. **Rejilla de 4 lanzamientos en Home (2x2):** Ocupaba demasiado espacio vertical en la portada y restaba protagonismo a las novelas destacadas; se redujo a los 2 lanzamientos más recientes en una fila horizontal compacta.
48. **Puntuación por adaptación compartida en recomendaciones:** Distorsionaba la afinidad temática real entre obras asignando puntos a novelas sin relación argumental; descartado para priorizar creador, demografía y géneros coincidentes.
49. **Botón de restablecer filtros a la derecha del selector:** Provocaba un desplazamiento horizontal brusco del menú desplegable de ordenación cada vez que aparecía o desaparecía; reubicado a la izquierda.
50. **Transición por defecto y apertura abrupta en `::picker(select)`:** Carecía de transición de salida y escalaba desde el centro con un espaciado excesivo hacia el checkmark; se pulió con `@starting-style`, `display: allow-discrete`, `transform-origin: top right`, curva `--easeOutStrong` y espaciado compacto.

---

## 8. Contrato DOM-JS del Lector y Bugs Corregidos

### 8.1 Bugs Corregidos que NO se Deben Revertir

1. **Ilustraciones en modo continuo (`lector.js`):** El límite `max-height: calc(100vh - ...)` debe aplicarse **únicamente en modo paginado**. En modo continuo (`settings.mode === "continuous"`), las imágenes e ilustraciones fuerzan `max-height: none !important; height: auto !important;` tanto en `generateReaderIframeCSS()` como en `figure.dimg img` y `figure.dimg svg`. Esto previene el bucle de recálculo dinámico donde las imágenes se reducían progresivamente hasta desaparecer.
2. **Error 404 en `/OEBPS/OEBPS/content.opf` (`lector.js`):** En `loadBookInfo()`, la consulta del archivo OPF se realiza directamente sobre el zip en memoria (`book.archive.zip.files`) en lugar de llamar a `book.load()` con rutas relativas duplicadas provocadas por `book.container.packagePath`.
3. **Canvas opaco forzado en Chromium (`lector.css`):** La regla `.viewer iframe { color-scheme: normal; background-color: transparent; }` es permanente e inmutable. Neutraliza el lienzo blanco opaco que los motores Chromium/Blink fuerzan sobre los iframes debido a la declaración global `color-scheme` de `html` en `main.css`.
4. **Anulación de gutter en lectura inmersiva (`lector.css`):** `html, body { scrollbar-gutter: auto; }` anula de forma permanente `scrollbar-gutter: stable` de `main.css`, evitando la franja vertical derecha fantasma en la vista a pantalla completa (`100dvh`).
5. **Desacoplamiento de color de texto y cascada EPUB (`lector.js`):** `kasniaThemePreload` se inserta al final de `doc.head` mediante `appendChild` (no con `insertBefore`). El tema `"custom"` se registra en `rendition.themes` al cambiar el color de texto. Se prohíbe inyectar `--reader-text` en la raíz de `.readerApp` para que la UI conserve sus contrastes temáticos independientes del texto del libro.
6. **Tipografía Inter en visor (`lector.js`):** Inyección obligatoria de la regla `@font-face` para Inter dentro del CSS del iframe en `generateReaderIframeCSS()`, garantizando la resolución local inmediata desde `/fonts/InterVariable.woff2`.
7. **Coherencia de tema en UI y desacoplamiento cromático (`resolveUITheme`):** Al elegir un color personalizado de texto, la interfaz no conmuta a oscuro. `resolveUITheme` calcula el tema visual (`light`, `sepia`, `dark`, `grey`) derivándolo exclusivamente de la luminancia del fondo (`settings.bgColor`).
8. **Transiciones y gesto táctil en barra superior móvil (`modalHandle` / `modalDrawer`):** Las animaciones de paneles modales calcan de manera idéntica las de descargas (`modalDrawerIn`/`modalDrawerOut` en móvil, `modalScaleIn`/`modalScaleOut` en escritorio) animando el backdrop (`readerOverlayFadeIn/Out`) sin atenuar la opacidad del contenedor. El tirador móvil responde tanto a tap directo (<10px) como a arrastre (>70px) para un descarte fluido.

### 8.2 Contrato DOM-JS Inmutable

Para evitar regresiones en `assets/js/lector.js`, los siguientes identificadores y clases son estrictamente obligatorios en `layouts/lector/single.html`:

- **Nodos Principales:**
  - `#readerApp` (Contenedor raíz con control de clase `.ui-hidden`).
  - `#readerTitle` (Encabezado con título de la obra).
  - `#readerContainer` (Área que aloja el visor y navegación lateral).
  - `#viewer` (Contenedor DOM directo donde epub.js monta el libro).
  - `#readerProgress` (Indicador textual del porcentaje de lectura).
  - `#readerLoadingOverlay` (Pantalla de carga inicial a pantalla completa).
- **Botones de Cabecera y Navegación:**
  - `#readerCloseBtn` (Botón para salir del lector y volver).
  - `#readerTocBtn` (Abre el panel del índice).
  - `#readerSettingsBtn` (Abre el panel de ajustes).
  - `#readerInfoBtn` (Abre el panel de información de la obra).
  - `#readerFullscreenBtn` (Alterna pantalla completa).
  - `#readerPrev`, `#readerNext` (Botones laterales de paso de página).
- **Paneles Modales y Listas:**
  - `#readerTocPanel`, `#readerSettingsPanel`, `#readerInfoPanel`.
  - `#readerInfoContent` (Contenedor de metadatos del libro).
  - `#readerTocList` (Lista desordenada donde se monta el árbol del TOC).
  - `.closePanelBtn` (Botón de cierre presente en la cabecera de cada panel).
  - `.modalHandle` (Tirador táctil superior para drag-to-dismiss móvil).
- **Controles de Ajustes:**
  - Tema: `.themeOptionBtn` con atributo `data-theme` ("light", "dark", "sepia", "grey").
  - Colores personalizados: `#bgColorPicker`, `#bgColorHex`, `#textColorPicker`, `#textColorHex`.
  - Modo: `.modeOptionBtn` con atributo `data-mode` ("paginated", "continuous").
  - Fuente: `#fontFamilySelect`, `#fontLoadingIndicator`, `#fontSizeDisplay`, `#decreaseFontBtn`, `#increaseFontBtn`.
  - Formato: `#btnBold`, `#btnItalic`, `#btnUnderline`.
  - Alineación: `.alignBtn` con atributo `data-align` ("justify", "left", "center") e IDs `#btnAlignJustify`, `#btnAlignLeft`, `#btnAlignCenter`.
  - Guionado: `#toggleHyphens`.
  - Espaciados y Steppers: `#paragraphSpacingDisplay`, `#decParaSpacingBtn`, `#incParaSpacingBtn`, `#lineHeightDisplay`, `#decLineHeightBtn`, `#incLineHeightBtn`, `#letterSpacingDisplay`, `#decLetterSpacingBtn`, `#incLetterSpacingBtn`.
  - Márgenes: `#marginTopDisplay`, `#decMarginTopBtn`, `#incMarginTopBtn`, `#marginBottomDisplay`, `#decMarginBottomBtn`, `#incMarginBottomBtn`, `#marginLeftDisplay`, `#decMarginLeftBtn`, `#incMarginLeftBtn`, `#marginRightDisplay`, `#decMarginRightBtn`, `#incMarginRightBtn`.
  - Reseteo: `#resetSettingsBtn`.
- **Clases de Estado en Runtime:**
  - `.ui-hidden`: Oculta barras superior e inferior durante la lectura inmersiva.
  - `.isClosing`: Aplica keyframes de salida coordinados antes de ocultar modales.
  - `.active`: Indica botón o preset activo en controles de ajustes.
  - `.isDragging`, `.willDismiss`: Feedback táctil visual durante el arrastre móvil.
- **Inyecciones Dinámicas en Tiempo de Ejecución:**
  - Capa anti-FOUC: `#foucOverlay` (`.foucOverlay`) montada sobre `#viewer`.
  - Fuentes externas: `<link id="kasniaCustomFontHost">` y `<link id="kasniaCustomFontIframe">`.
  - Estilos de tema: `<style id="kasniaThemePreload">` insertado al final del `<head>` del iframe.

---

## 9. Deuda y Puntos de Sincronización Conocidos

1. **Paridad obligatoria de la Tarjeta de Portada (`novelCard`):**
   - El código CSS de la tarjeta reside de forma unificada y sincronizada en `assets/css/novelas.css`, `assets/css/ranking.css` y `assets/css/novela.css` (para las novelas recomendadas) para mantener las hojas de estilo autónomas y libres de importaciones cruzadas.
   - **Regla:** Cualquier cambio de diseño, sombra, lomo (`.coverSpine`), radio o hover en `.novelCard` debe aplicarse idénticamente en los tres archivos.
2. **Estructura de Contenedor y Cabecera Intro en Páginas Estáticas:**
   - La cabecera editorial (`.sectionHeader` / `.introSection`) y el contenedor de 1080px se mantienen aislados localmente en `comisiones.css`, `donaciones.css` y `staff.css`. Si en el futuro se refactorizan como utilidades compartidas, deben unificarse de forma sincronizada entre las tres plantillas.
3. **Catálogo de Sprites SVG:**
   - Cada página consume sus iconos desde su sprite dedicado en `static/img/svg/`:
     - `main.svg`: Navbar, footer, tema, menú, redes y back-to-top.
     - `home.svg`: Sparkle, calendario, flechas y checks.
     - `novela.svg`: Chevrons, formatos PDF/EPUB, usuarios, notas, enlace externo y comentarios (`#chatIcon`, `#replyIcon`, `#sendIcon`).
     - `ranking.svg`: Reloj y estado vacío de ranking.
     - `comisiones.svg`: Iconos de ventajas, moneda y mensajería.
     - `donaciones.svg`: Flechas direccionales de ingresos/gastos, tarjeta y aviso vacío.
     - `404.svg`: Libro abierto 'La Página Perdida' y sombra desacoplada.
     - `lector.svg`: Ajustes, índice, info, pantalla completa y controles de lectura.
     - `logo.svg`: Isotipo vectorial de la marca.
   - **Regla:** Queda prohibido añadir SVGs inline; todo icono nuevo debe agregarse como `<symbol id="...">` en el sprite correspondiente.
4. **Registro de Deuda Técnica Resuelta:**
   - *Alias heredados:* 100% eliminados; el proyecto usa exclusivamente tokens camelCase.
   - *Canvas Chromium en iframe:* Resuelto permanentemente mediante `color-scheme: normal; background-color: transparent;`.
   - *Scrollbar fantasma en lector inmersivo:* Resuelto permanentemente mediante `scrollbar-gutter: auto;`.
   - *Paginación muerta en catálogo:* 100% eliminada de plantillas, estilos y lógica cliente.