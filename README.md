# Kasnia Project

Este repositorio contiene la versión migrada a **[Hugo](https://gohugo.io/)** del sitio web de **Kasnia Project**. A diferencia de la versión prototipo (HTML/JS puro), este proyecto utiliza un Generador de Sitios Estáticos (SSG) para facilitar la gestión de contenido, escalabilidad y mantenimiento.

> ⚠️ **Nota para Desarrolladores:** El objetivo de esta migración es separar la lógica de presentación del contenido. Si eres un colaborador encargado de añadir o editar novelas, ve directamente a la sección de [Gestión de Contenido](#-gestión-de-contenido-novelas).

## 🎯 Objetivo Arquitectónico

El sitio ha sido refactorizado para utilizar la arquitectura de Hugo:

- **Separación de Responsabilidades:** El contenido reside en archivos Markdown (`.md`) en `/content`, mientras que el diseño está en `/layouts` y `/assets`.
- **Automatización**: Las listas de novelas, paginación y páginas individuales se generan automáticamente a partir de los metadatos (Frontmatter).
- **Rendimiento**: Generación de HTML estático optimizado en tiempo de compilación.

## 🛠️ Stack Tecnológico

- **Core**: [Hugo](https://gohugo.io/) (Extended Version necesaria para features avanzadas).
- **Templating**: Go Templates (HTML dinámico).
- **Estilos**: CSS Vanilla organizado en `assets/css` (procesado por Hugo Pipes).
- **Lógica Cliente**: JavaScript módulos ES6+ en `assets/js` (para funcionalidades interactivas que requieren ejecución en el navegador, como la búsqueda dinámica o el lazy loading).

## 📂 Estructura del Proyecto

```text
├── assets/          # Recursos procesables (CSS, JS)
├── content/         # Contenido del sitio
│   └── novelas/     # Archivos .md de cada novela
├── layouts/         # Plantillas HTML (partials, shortcodes, defaults)
├── static/          # Archivos estáticos crudos (imágenes, favicons)
└── hugo.toml        # Configuración global del sitio
```

## 📝 Gestión de Contenido (Novelas)

Esta es la sección más importante para editores y colaboradores. Toda la información de las novelas se maneja editando archivos **Markdown** dentro de la carpeta `/content/novelas/`.

### Crear o Editar una Novela

Cada novela es un archivo `.md` (ej: `seirei-gensouki.md`). La información se define en el **Frontmatter** (el bloque entre `---` al inicio del archivo).

#### Estados de la Novela (`status`)

Define el estado actual de la traducción o publicación en el sitio.

| Valor       | Significado                                                     | Badge Visual       |
| :---------- | :-------------------------------------------------------------- | :----------------- |
| `active`    | **Activa**. Se está traduciendo y publicando regularmente.      | Verde (Activa)     |
| `uptodate`  | **Al día**. Estamos al día con la publicación japonesa/inglesa. | Azul (Al día)      |
| `paused`    | **Pausada**. No hay actividad reciente.                         | Amarillo (Pausada) |
| `completed` | **Finalizada**. La traducción de la novela ha concluido.        | Rojo (Finalizada)  |

#### Estados de los Volúmenes (`state`)

Dentro de la lista de `volumes`, cada entrada tiene un estado que determina cómo se muestra la portada del volumen.

| Valor         | Significado                                                  | Comportamiento en UI                                           |
| :------------ | :----------------------------------------------------------- | :------------------------------------------------------------- |
| `published`   | **Publicado**. El volumen está listo para descarga.          | No muestra badge.                                              |
| `preview`     | **Vista Previa**. Solo hay una preview disponible.           | Muestra badge de "Preview".                                    |
| `translating` | **En Traducción**. El volumen está en proceso de traducción. | Muestra badge de "Proceso" y deshabilita la modal de descarga. |
| `upcoming`    | **Pronto**. Anunciado pero no disponible.                    | Muestra badge de "Pronto" y deshabilita la modal de descarga.  |

### Ejemplo de Estructura (.md)

```yaml
---
title: "Seirei Gensouki"
# ... otros metadatos básicos ...
status: "uptodate" # <--- ESTADO DE LA NOVELA

volumes:
  - num: "25"
    state: "published" # <--- ESTADO DEL VOLUMEN
    credits:
      translator: "Diego"
      corrector: "Diego"
      # ...
    propio:
      pdf: true
      epub: true
    drive:
      pdf: "URL_DEL_PDF"
      epub: "URL_DEL_EPUB"

  - num: "26"
    state: "upcoming" # Ejemplo de volumen futuro
    # ...
---
```

## 🚀 Instalación y Desarrollo Local

Para trabajar en el código del sitio o visualizar cambios en tiempo real:

1.  **Instalar Hugo**: Asegúrate de tener la versión "Extended" instalada.
    ```bash
    hugo version
    # Debería decir "hugo v0.x.x+extended ..."
    ```
2.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/DiegoM74/kasnia-project-hugo.git
    ```
3.  **Ejecutar Servidor de Desarrollo**:
    ```bash
    hugo server --gc --minify --cleanDestinationDir
    ```
    El sitio estará disponible en `http://localhost:1313/`. Los cambios en los `.md` o layouts se reflejarán automáticamente.

## ✨ Características Heredadas

Mantenemos la filosofía de diseño "Premium" del prototipo original:

- **View Transitions**: Implementadas nativamente para navegación suave.
- **Sin Frameworks JS Pesados**: Solo JS nativo para la interactividad necesaria.
- **Diseño Responsivo**: CSS Grid/Flexbox moderno.

## 📄 Licencia

El código fuente del tema/sitio es propiedad de **Kasnia Project**. Las traducciones y obras derivadas pertenecen a sus respectivos creadores según se indique.

#### Nota: Este README fue generado por **Gemini**.
