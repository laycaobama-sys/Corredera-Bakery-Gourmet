# Corredera Bakery & Gourmet

Tienda online gourmet (jamones ibéricos, embutidos, quesos y aceites) con carta Bakery & Café secundaria.
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
| `/gourmet/:slug` | Categorías: `jamones`, `jamon-cortado`, `sobres-jamon`, `embutidos`, `sobres-embutidos`, `quesos`, `aceites` |
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

## Fotos de producto

Las fotos de estudio de la tienda se generaron con Google Flow mediante la herramienta local `srzGoogleFlowMCP/` (no incluida en el repositorio):
`node scripts/generate-product-photos.mjs [id …]` y después `python scripts/install-product-photos.py`.
Las descripciones de cada foto están en `scripts/product-photo-prompts.json`. El propietario puede sustituir
cualquier foto desde **Productos y precios**.

`server/_core/publicConfig.ts` expone solo valores públicos; las claves privadas permanecen en el servidor.
