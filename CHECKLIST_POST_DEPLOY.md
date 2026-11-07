# Checklist después de publicar

Se publica al subir a `main`: Cloudflare Workers Builds lo despliega solo.

## Cada vez que se publique

```bash
pnpm check:seo https://correderamadrid.com --rendered
```

```bash
pnpm indexnow
```

## Search Console (cuenta `ibraguimova19@gmail.com`)

- [x] Propiedad de dominio `correderamadrid.com` verificada por DNS. No borrar el registro TXT.
- [x] Sitemap enviado: `https://correderamadrid.com/sitemap.xml`.
- [x] Indexación pedida para portada, tienda, carta, jamones, embutidos, quesos y guía.
- [ ] En unos días, abrir **Páginas** y revisar los motivos de las no indexadas.
- [ ] Pedir indexación de `/lotes-navidad` y `/servicio-corte-jamon`. Google limita las peticiones diarias.

## Bing Webmaster Tools

- [ ] Entrar en https://www.bing.com/webmasters con tu cuenta.
- [ ] Elegir **Importar desde Google Search Console**.
- [ ] Comprobar que aparece el sitemap.

## Perfiles de Google

- [ ] Cambiar la web en Corredera Gourmet.
- [ ] Cambiar la web en Corredera Bakery.
- [ ] Revisar que nombre, dirección, teléfono y horario coinciden con la web.

## Validar

- [ ] Prueba de resultados enriquecidos: https://search.google.com/test/rich-results
- [ ] PageSpeed Insights: https://pagespeed.web.dev/
- [ ] Buscar `site:correderamadrid.com` en Google dentro de unos días.

## Qué esperar

- Google suele tardar de días a un par de semanas en indexar un dominio nuevo.
- El resumen de IA de Google se actualiza después. Hasta entonces puede seguir diciendo que no conoce el dominio.
- Nadie puede garantizar el primer puesto. Lo que más ayuda en búsquedas de marca y locales es que los perfiles enlacen a esta web.
