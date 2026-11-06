# Corredera Bakery & Gourmet

Tienda online gourmet (jamones ibéricos, embutidos, quesos y aceites), carnicería y frutería del mismo local, con carta Bakery & Café secundaria.
React 19 + Vite / Express / tRPC. Pedidos validados en servidor y enviados por WhatsApp (sin pago online).

## Comandos

- `pnpm install`: instala dependencias.
- `pnpm dev`: servidor de desarrollo en `http://127.0.0.1:3000` (respeta `PORT`). Funciona en Windows, macOS y Linux.
- `pnpm build` / `pnpm start`: compila y sirve `dist/index.js` y `dist/public/`.
- `pnpm test` / `pnpm check`: tests (vitest) y tipos.
- `pnpm sitemap`: regenera `client/public/sitemap.xml` a partir del catálogo.
- `pnpm db:migrate` / `pnpm db:push`: migraciones de base de datos (opcional; sin `DATABASE_URL` se usa almacenamiento en disco).

## Estructura de la web

| Ruta | Página |
| --- | --- |
| `/` | Home gourmet: hero con carrusel + accesos, barra de contacto, más vendidos con pestañas, ¿Por qué Corredera?, servicio de corte, departamentos, cómo encargar, nosotros, Bakery & Café (secundario), visítanos y FAQ |
| `/tienda` | Toda la tienda para llevar, con filtros por categoría (`?c=quesos`), búsqueda y orden |
| `/gourmet/:slug` | Categorías: `jamones`, `jamon-cortado`, `sobres-jamon`, `embutidos`, `sobres-embutidos`, `quesos`, `aceites`, `carniceria`, `fruteria` |
| `/producto/:id` | Ficha de producto: galería, precio, opción de corte del jamón, cantidad, añadir al pedido / WhatsApp directo, relacionados |
| `/bakery-cafe` | Carta Bakery & Café (consumo en local; packs y tartas enteras por encargo) |
| `/admin` | Panel privado de catálogo y contenidos (CMS) |

## Código del escaparate

- `client/src/storefront/`: sistema de la tienda.
  - `StoreContext.tsx`: idioma ES/EN, catálogo (servidor con respaldo local), ajustes del CMS, carrito persistente.
  - `data.ts`: departamentos de navegación y utilidades de producto (precio, formato, nombre).
  - `components/`: cabecera con mega-menú, menú lateral, buscador, carrito/checkout, tarjeta de producto, listado con filtros, pie.
- `client/src/pages/`: `Home`, `ShopPage`, `CategoryPage`, `ProductDetailPage`, `CartaPage`, `NotFound`, `AdminPanel`.
- `client/src/index.css`: sistema de diseño (tokens de marca, tipografías EB Garamond + Jost autoalojadas, componentes y responsive 1024/720/360 px).
- `client/public/assets/brand/`: logotipo oficial recortado con fondo transparente (versión burdeos y clara), emblema y favicons.
- `shared/catalog.ts` y `shared/gourmetRoutes.ts`: catálogo, precios y textos de categorías (fuente única de verdad).

## Panel del propietario (`/admin`)

Acceso exclusivo con **una única contraseña** (cifrada con scrypt en `server/data/admin-owner-lock.json`).
Desde la web no se puede crear ninguna cuenta: la contraseña se fija en el servidor.

- `pnpm admin:password` genera una clave segura nueva y la muestra una vez (cierra todas las sesiones).
- `pnpm admin:password "MiClaveSegura-2026"` fija una clave concreta (mínimo 12 caracteres).
- Bloqueo de 15 minutos tras 5 intentos fallidos; la sesión caduca a las 12 horas.
- Al desplegar, conserva la carpeta `server/data/` (o define `DATA_DIR`): ahí están la clave, el catálogo, los ajustes, los pedidos y la analítica.

El panel es además la herramienta de gestión del negocio (`server/businessRepository.ts`, `client/src/admin/sections/`). Todo arranca a cero y se calcula con datos reales: nunca muestra cifras inventadas.

| Sección | Qué permite |
| --- | --- |
| Panel de dirección | En directo: facturación, margen bruto, clientes nuevos, previsión de cierre, valor del inventario, referencias activas, pedidos de hoy, envíos en ruta y roturas de stock |
| Finanzas e Informes | Resultado del mes, gastos, por cobrar y por pagar, objetivo mensual, productos más vendidos y exportación a CSV |
| Logística | Tablero por estados, transportista, seguimiento e importe final tras pesar |
| Facturación y Presupuestos | Numeración consecutiva, IVA por línea, impresión o PDF y paso de presupuesto a factura. Es un registro interno: confirmar Verifactu con el gestor antes de usarlas como facturas oficiales |
| Leads | Oportunidades por etapas con seguimiento |
| Stock y Compras | Existencias, mínimos, coste, movimientos, proveedores y recepción de compras |

Secciones del panel (`client/src/admin/`):

| Sección | Qué permite |
| --- | --- |
| Resumen | Visitas, visitantes, pedidos, importe, conversión, embudo de compra, últimos pedidos |
| Pedidos | Lista con filtros por estado, detalle completo del cliente, cambio de estado, nota interna, WhatsApp directo, eliminar, exportar CSV |
| Clientes | Clientes agrupados por teléfono, historial de pedidos e importe, exportar CSV |
| Analítica web | Evolución diaria, páginas donde se quedan y tiempo medio, origen de las visitas, dispositivos, idioma, productos más vistos y añadidos |
| Productos y precios | Crear, editar, ocultar, destacar y eliminar productos; subir fotos; precio por unidad, kilo o «consultar» |
| Portada y avisos | Barra de avisos y diapositivas del carrusel (foto, textos, botón, orden) |
| Eventos y campañas | Evento o promoción con imagen, texto y botón de WhatsApp, activable cuando se quiera |
| Tienda, horarios y envíos | Contacto, horarios, envío a domicilio, pausa de pedidos y textos generales |
| Seguridad y actividad | Cambiar contraseña, registro de actividad, versiones de la web (restaurables) y copias del catálogo |

La analítica es propia y anónima (sin cookies ni servicios externos, sin guardar IPs).

## Contenido editable y SEO

- **Fotos y textos de la web** (panel): cartel y textos de la carta, bloques junto al carrusel, «¿Por qué Corredera?», servicio de corte, «Somos Corredera» y fotos de categorías. El carrusel admite foto y vídeo opcional (MP4/WebM).
- Las páginas abiertas recogen los cambios del panel en menos de un minuto (y al volver a la pestaña).
- El servidor genera para cada URL su título, descripción, canonical, Open Graph, datos estructurados (Product, ItemList, BreadcrumbList, FAQPage, Menu) y un resumen de texto, para Google y asistentes de IA. `/sitemap.xml` y `/llms.txt` se generan en vivo desde el catálogo; `robots.txt` permite a GPTBot, ClaudeBot, PerplexityBot y Google-Extended.

## Despliegue en Cloudflare (recomendado)

Todo funciona en Cloudflare Workers: la web, el panel, los pedidos, la analítica y las fotos subidas desde el panel.
Los datos se guardan en un Durable Object con SQLite (`worker/index.ts`), incluido en el plan gratuito.
La primera vez se cargan el catálogo y los textos de `server/data/catalog-store.json` y `site-settings.json`.

**Opción A: desde el panel de Cloudflare (Workers Builds, se despliega solo con cada push)**

1. Cloudflare → *Workers & Pages* → *Create* → *Import a repository* → este repositorio de GitHub.
2. Build command: `pnpm build:cloudflare` · Deploy command: `npx wrangler deploy` · Root: `/`.
3. *Settings → Domains & Routes*: añade el dominio. La web detecta sola su dominio (canonical, sitemap, robots y datos para Google e IA), así que no hay que configurar nada más. `www.` redirige al dominio sin `www`, y la dirección `*.workers.dev` no se indexa.

**Acceso del dueño a `/admin`:** el código incluye una contraseña inicial ya preparada (solo su huella cifrada con scrypt, en `worker/owner-seed.json`; la clave en claro nunca está en el repositorio). Se aplica una única vez al desplegar. El dueño entra con ella y la cambia en *Seguridad y actividad*; esa nueva clave se mantiene en los siguientes despliegues. Para dar otra clave inicial en el futuro: genera una nueva huella con otro `id` en ese archivo.
Opcional: el secreto `ADMIN_INITIAL_PASSWORD` solo se usa si todavía no existe ninguna contraseña.

**Novedades de catálogo:** los productos añadidos a `server/data/catalog-store.json` con `"updatedBy": "seed-…"` se incorporan una vez a la tienda en producción al desplegar, sin tocar lo que el dueño haya cambiado.

**Opción B: desde el ordenador**

```bash
pnpm install
pnpm exec wrangler login
pnpm deploy:cloudflare
```

`pnpm dev:cloudflare` prueba la versión de Cloudflare en local (`http://127.0.0.1:8787`).
En Cloudflare deja **Rocket Loader desactivado**. Las páginas se guardan en la caché de Cloudflare 60 s y las fotos subidas un año.
Rellena el NIF y los datos del Registro Mercantil en el panel (*Tienda, horarios y envíos → Datos legales*): aparecen en el aviso legal en cuanto se guardan.

## Despliegue en un servidor Node (alternativa)

Railway, Render, Fly.io, un VPS o Docker con Node.js 20+.

1. `pnpm install && pnpm build`, y arrancar con `pnpm start` (puerto `PORT`).
2. Volumen persistente para `DATA_DIR` (catálogo, ajustes, pedidos, analítica, clave) y `UPLOAD_DIR` (fotos subidas desde el panel).
3. `PUBLIC_SITE_URL=https://tu-dominio` si el dominio no es `correderagourmet.com`.
4. En el servidor: `pnpm admin:password` para crear la clave del propietario.

## Cartas para imprimir

`node scripts/build-cartas.mjs` genera en `cartas/` las cartas A4 Gourmet y Bakery & Café en español e inglés (no se publican en la web). Con `--live https://tu-dominio` usa los precios publicados en ese momento.

## Fotos de producto

Las fotos de estudio de la tienda se generaron con Google Flow mediante la herramienta local `srzGoogleFlowMCP/` (no incluida en el repositorio):
`node scripts/generate-product-photos.mjs [id …]` y después `python scripts/install-product-photos.py`.
Las descripciones de cada foto están en `scripts/*-photo-prompts.json`. La instalación deja la foto principal sobre fondo blanco; `-alt` es la segunda foto que aparece al pasar el cursor (`node scripts/build-hover-map.mjs` actualiza la lista). Lanza un solo proceso de generación cada vez: dos a la vez mezclan los resultados. El propietario puede sustituir
cualquier foto desde **Productos y precios**.

`server/_core/publicConfig.ts` expone solo valores públicos; las claves privadas permanecen en el servidor.
