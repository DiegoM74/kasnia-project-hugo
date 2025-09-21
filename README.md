# Kasnia Project

Sitio web del grupo de traducción de novelas ligeras del inglés al español.

## Estructura del proyecto

Este sitio está construido con [Hugo](https://gohugo.io/), un generador de sitios estáticos.

### Directorios importantes

```yaml
kasnia-project/
├── assets/          # Archivos CSS y JS fuente
├── content/         # Contenido del sitio
│   └── novelas/     # Archivos de cada novela
├── layouts/         # Plantillas HTML
├── static/          # Archivos estáticos (imágenes, logos)
└── hugo.toml        # Configuración de Hugo
```

## Cómo editar las novelas

Para actualizar el estado de los volúmenes de las novelas, sigue estos pasos:

1. Ve a la carpeta `content/novelas/` y elige el archivo de la novela que deseas editar (por ejemplo, `beast-tamer.md`).

2. Haz clic en el archivo y luego en el botón "Code" *(para ver el código, no la vista previa)*.

3. Busca la sección `volumenes` al final del archivo. Verás una lista de volúmenes con esta estructura:

   ```yaml
   volumenes:
     - numero: 1
       estado_volumen: "traducido"  # Puede ser "traducido", "proceso" o "proximamente"
       pdf: true   # true si está en Cloudflare R2
       epub: false # false si no está en Cloudflare R2
     - numero: 2
       estado_volumen: "proceso"
       pdf: false  # Si el estado_volumen no es "traducido", pdf y epub no pueden ser true
       epub: false
     - numero: 3
       estado_volumen: "proximamente"
       pdf: false
       epub: false
    ```

4. Para actualizar un volumen:
- Cambia `estado_volumen` de `proceso` a `traducido` cuando la traducción esté completada y los archivos estén subidos a Cloudflare R2.
- Cambia `pdf` y/o `epub` a `true` según corresponda (cuando los archivos estén disponibles para descarga).
- Si has comenzado a traducir un nuevo volumen, cambia el siguiente volumen de `proximamente` a `proceso`.

## Verificación de cambios

Después de guardar los cambios:

1. Los cambios se desplegarán automáticamente en Cloudflare Pages.

2. Visita el sitio web después de la implementación *(puede tomar unos minutos)*.

3. Verifica que:
- El volumen aparezca sin el mensaje de "En traducción" o "Próximamente".
- Los iconos de PDF/EPUB estén activos *(no atenuados)*.
- Los enlaces de descarga funcionen correctamente.

## Archivos en Cloudflare R2

- Los archivos deben subirse al bucket "descargas" de Cloudflare R2 con el formato:<br/>`Nombre-Serie-Volumen-XX-[Kasnia-Project].pdf` *(o .epub)*.
  
  - `Nombre-Serie` corresponde al `nombre_guiones` de los archivos .md de cada novela, con la primera letra de cada palabra en mayúscula. Ej: `nombre_guiones: "beast-tamer"` -> `Beast-Tamer`.

- Los números de volumen deben usar dos dígitos (01, 02, ..., 10, 11, etc.).
- Los cambios en los archivos Markdown *(.md)* se reflejarán automáticamente en el sitio después del despliegue.

## Licencia

Este proyecto es propiedad de Kasnia Project. Todos los derechos reservados.