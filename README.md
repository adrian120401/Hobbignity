# Hobbignity

Sitio estático de ocio adaptado, disponible en español e inglés. Para probar las rutas localmente, ejecutá `python -m http.server 8000` en esta carpeta y abrí [localhost:8000](http://localhost:8000/).

## Idiomas

- `/es/` muestra español y `/en/` muestra inglés. En GitHub Pages las rutas quedan bajo `/Hobbignity/`.
- La raíz detecta el primer idioma compatible en las preferencias del navegador. Si no hay ninguno, usa español. Una URL con idioma explícito siempre respeta ese idioma.
- El selector Español / English conserva la sección y los parámetros de la URL. El carrito se conserva en la misma pestaña cuando el navegador permite almacenamiento de sesión.
- Sin JavaScript, la raíz muestra español y ambas versiones mantienen su contenido y los enlaces para cambiar de idioma.

El HTML fuente está en `src/index.html`, las traducciones estáticas al inglés en `locales/en.json` y los mensajes interactivos de ambos idiomas en `app.js`. Después de editar la plantilla o sus traducciones, ejecutá:

```sh
node scripts/build-pages.mjs
node --test tests/i18n.test.mjs
```

El generador produce `index.html`, `es/index.html` y `en/index.html`, con metadatos, URL canónica y enlaces `hreflang` de cada idioma. Los archivos generados se incluyen en el repositorio para publicar sin instalar dependencias ni configurar un proceso de compilación en GitHub Pages. No edites esos HTML directamente. La URL pública se configura en `scripts/build-pages.mjs`.

## Publicar en GitHub Pages

1. Regenerá las páginas y subí a la rama `main` los HTML de la raíz y de `es/` y `en/`, `language-redirect.js`, `styles.css`, `app.js`, toda la carpeta `assets/` y `.nojekyll`. Incluí también las fuentes y los scripts para poder mantener las traducciones.
2. En el repositorio de GitHub, abrí **Settings → Pages**.
3. En **Build and deployment**, elegí **Deploy from a branch**, seleccioná `main` y `/(root)`, y guardá.
4. Cuando termine el despliegue, abrí el enlace que aparece en **Settings → Pages**. La URL prevista es [adrian120401.github.io/Hobbignity](https://adrian120401.github.io/Hobbignity/).

El logo original `assets/logo.svg` se usa en la cabecera y el footer. Las versiones PNG e ICO se derivan de la imagen incluida en ese SVG para buscadores, vistas previas al compartir e iconos del navegador y de iOS. Si cambia el logo, regenerá esas variantes. Si cambia la URL pública, actualizá `siteUrl` en `scripts/build-pages.mjs` y regenerá las páginas.

[Documentación del proyecto](https://docs.google.com/document/d/196Yj3mc-NqnGKHphDuExStcg_wY6fvbS3OD9bNYj2Bg/edit?tab=t.0)



