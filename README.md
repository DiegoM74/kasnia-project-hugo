# Kasnia Project

Sitio web oficial de Kasnia Project, una plataforma dedicada a la publicación y distribución de traducciones al español de novelas ligeras japonesas en formatos PDF y EPUB, con maquetación cuidada y diseño moderno.

El sitio es estático, rápido y ligero, construido con Hugo Extended sin frameworks CSS ni librerías JavaScript pesadas.

---

## Documentación Técnica

Para comprender a fondo la arquitectura técnica o modificar el diseño, consulta los documentos de referencia:

- **[AGENTS.md](AGENTS.md):** Arquitectura del proyecto, flujo de trabajo, estructura de plantillas en Go, gestión de metadatos en Markdown, sistema de ranking, lector ePub y sistema de comentarios con Cloudflare D1.
- **[DESIGN.md](DESIGN.md):** Sistema de diseño, tokens en camelCase (colores, radios, espaciado, movimiento), especificación de componentes, reglas visuales transversales y contrato DOM-JS.

---

## Stack Tecnológico

- **Generador estático:** Hugo Extended (v0.120.0+ recomendado).
- **Estilos:** Vanilla CSS modular procesado mediante Hugo Pipes.
- **Interactividad:** Vanilla JS (ES6+) nativo (catálogo interactivo, modales accesibles, lector ePub integrado).
- **Comentarios y Discusión:** Arquitectura serverless nativa con Cloudflare Pages Functions y base de datos relacional Cloudflare D1 (SQLite), con alertas instantáneas de moderación vía Telegram y notificaciones transaccionales a lectores vía Resend.
- **Imágenes:** Almacenamiento y optimización en Cloudflare R2 CDN (`img.kasniaproject.com`) con variantes AVIF y JPG.

---

## Desarrollo Local

### Requisitos

- **Hugo Extended** instalado en tu sistema (`hugo version` debe incluir `+extended`).
- **Git** para el control de versiones.

### Instrucciones

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/DiegoM74/kasnia-project-hugo.git
   cd kasnia-project-hugo
   ```

2. Iniciar el servidor de desarrollo local:
   ```bash
   hugo server --gc --minify --cleanDestinationDir
   ```

3. Abrir en el navegador:
   `http://localhost:1313/`

### Compilación de Producción

Para compilar el sitio estático optimizado final en la carpeta `public/`:
```bash
hugo --gc --minify --cleanDestinationDir
```

---

## Gestión de Contenido

El contenido de las novelas y páginas estáticas se gestiona mediante archivos Markdown con Frontmatter YAML en la carpeta `content/`:

- `content/novelas/`: Cada archivo `.md` representa una novela ligera con su información técnica, sinopsis y lista de volúmenes para descarga.
- `content/*.md`: Páginas institucionales como Staff, Donaciones, Comisiones, DMCA y Privacidad.

Para conocer la lista completa de campos, estados permitidos (`active`, `uptodate`, `published`, etc.) y el proceso para publicar nuevos volúmenes, consulta [AGENTS.md](AGENTS.md).

---

## Licencia y Derechos

El código fuente del sitio es propiedad de Kasnia Project. Las novelas ligeras, ilustraciones y material original pertenecen a sus respectivos autores y editoriales.
