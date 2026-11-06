# Auditoría SEO Técnica y Local — Corredera Bakery & Gourmet

**Establecimiento**: Corredera Bakery & Gourmet (Razón social: *Vallejo Lorenzo S.L.*)  
**Dirección física verificada**: Calle de la Puebla, 15, 28004 Madrid (Distrito Centro · Barrio de Universidad / Malasaña, junto a Gran Vía y Corredera Baja de San Pablo)  
**Dominio canónico**: `https://correderamadrid.com/`  
**Canales oficiales**: WhatsApp `+34 640 34 19 32` · Teléfono fijo `+34 919 47 14 49` · Email `info@correderamadrid.com`

---

## 1. Resumen de Errores Detectados y Corregidos

| Área Auditada | Estado Anterior (Deficiencia Detectada) | Mejora Verificable Implementada |
| :--- | :--- | :--- |
| **Códigos HTTP y Páginas 404 (Soft-404)** | El servidor Express devolvía `HTTP 200 OK` para cualquier ruta inexistente (`/404`, `/carta-antigua`, etc.) y carecía de cabeceras `X-Robots-Tag`, generando *Soft-404s* indexables. | Se implementó `server/_core/seoMiddleware.ts` e integración en `server/_core/vite.ts` y `server/_core/index.ts`: `/` devuelve `200 OK` (`index, follow`), `/admin` devuelve `200 OK` con `X-Robots-Tag: noindex, nofollow, noarchive`, y cualquier ruta inexistente o `/404` devuelve **`HTTP 404 Not Found` real** con `X-Robots-Tag: noindex, nofollow`. |
| **Title y Meta Description** | `og:description` tenía solo 57 caracteres (*"Obrador, café y despensa gourmet en el corazón de Madrid."*) y no estaba sincronizado con `metadata.json` ni `site.webmanifest`. | Se sincronizaron `<title>` (**58 caracteres**: `Corredera Bakery & Gourmet · Obrador, Café y Gourmet Madrid`) y `<meta name="description">` (**155 caracteres**: `Obrador artesanal, cafetería, desayunos, packs para eventos, jamón ibérico, quesos y tablas con vino en Calle de la Puebla 15, Madrid (Centro - Malasaña).`) en `client/index.html`, `metadata.json` y `site.webmanifest`. |
| **Jerarquía de Encabezados (`H1`–`H6`)** | El `<h1>` (`"Haz tu pedido, encarga tus packs..."`) omitía el nombre comercial y la actividad principal; además, en la sección `#visitanos` se repetía el mismo texto (`"Calle de la Puebla, 15"`) tanto en `<h2>` como en `<h3>`. | Se optimizó el `<h1>` con intención local natural (*"Corredera Bakery & Gourmet: obrador artesanal, café y tienda gourmet en el centro de Madrid."*) y se desduplicó el `<h2>` de `#visitanos` (*"Visítanos en Calle de la Puebla, 15 · Madrid Centro"*), manteniendo una jerarquía estricta `H1 -> H2 -> H3` sin saltos de nivel. |
| **Idioma Inglés y `hreflang`** | El cambio a inglés (`EN`) ocurría solo en memoria de React sin reflejarse en la URL ni contar con etiquetas `hreflang`, impidiendo indexar o compartir la versión en inglés. | Se habilitó soporte de URL `?lang=en` (`https://correderamadrid.com/?lang=en`) con sincronización dinámica de `<html lang>`, `<title>`, `<meta name="description">`, `og:url` y `<link rel="canonical">`, además de etiquetas `<link rel="alternate" hreflang="es">`, `hreflang="en"` y `hreflang="x-default"` en HTML y `sitemap.xml`. |
| **Open Graph y Tarjetas Sociales** | `og:type` usaba `"restaurant"` (no estándar sin namespace específico) y `og:image` apuntaba al logotipo cuadrado (`corredera-official-logo.png`) sin dimensiones declaradas. | Se configuró `og:type="website"`, `og:locale="es_ES"`, `og:locale:alternate="en_US"` y tarjeta panorámica `summary_large_image` apuntando a `/assets/photos/hero-bakery-entrance.jpg` (`1200x800`, `image/jpeg`) con `og:image:alt` y `twitter:image:alt` descriptivos. |
| **Datos Estructurados Schema.org (`JSON-LD`)** | Incluía coordenadas `GeoCoordinates` no verificadas en el contenido visible y carecía de la entidad matriz (`Vallejo Lorenzo S.L.`) y del desglose verificable de carta (`hasMenu`). | Se reestructuró el `@graph` JSON-LD separando claramente `WebSite`, `Organization` (*Vallejo Lorenzo S.L.*), `Corredera Bakery` (`Bakery` + `CafeOrCoffeeShop`) y `Corredera Gourmet` (`Store` + `FoodEstablishment`) con horarios propios, enlace real a Google Maps (`hasMap`), precios exactos en `EUR` (`hasMenu`) y **cero reseñas o valoraciones inventadas**. |
| **`robots.txt` y `sitemap.xml`** | `robots.txt` no bloqueaba `/api/` y `sitemap.xml` carecía de `<lastmod>` y de anotaciones `xhtml:link` para el idioma inglés. | `robots.txt` permite `/` y bloquea `Disallow: /api/` sin exponer rutas privadas (`/admin` se protege con `X-Robots-Tag: noindex, nofollow, noarchive` y autenticación en servidor). `sitemap.xml` incluye únicamente las 2 URLs canónicas indexables (`/` y `/?lang=en`) con `<lastmod>2026-10-26</lastmod>`. |
| **Enlaces Internos y Rendimiento** | Los enlaces del menú principal y del pie de página eran elementos `<button>` sin atributo `href`, y `<head>` abría dos conexiones `preconnect` a `fonts.googleapis.com` / `fonts.gstatic.com` que no se usaban. | Se convirtieron los enlaces de navegación principal y footer en etiquetas semánticas `<a href="#...">` rastreables y se eliminaron los `preconnect` innecesarios a Google Fonts, manteniendo `preload` prioritario para los recursos críticos del primer pantallazo. |

---

## 2. Separación de Identidades: Corredera Bakery vs. Corredera Gourmet

Siguiendo el criterio de rigor comercial y local:
- **Relación societaria documentada**: Ambos espacios operan en el mismo local físico (**Calle de la Puebla, 15, 28004 Madrid**) bajo la titularidad de **Vallejo Lorenzo S.L.** y comparten atención telefónica (`+34 919 47 14 49`) y WhatsApp de pedidos/reservas (`+34 640 34 19 32`).
- **Separación en Schema.org y en la interfaz**: Dado que en Google Maps aparecen referencias diferenciadas para **Corredera Bakery** y **Corredera Gourmet** con horarios distintos, **no se han fusionado artificialmente sus horarios ni sus tipos de negocio en una única ficha confusa**:
  1. **`#organization` (`Vallejo Lorenzo S.L.`)**: Entidad legal matriz.
  2. **`#bakery` (`Corredera Bakery` — `["Bakery", "CafeOrCoffeeShop"]`)**: Horario L–J `08:00–21:00`, V–S `08:00–23:00`, D `09:00–21:00`; rango `€`; carta propia de 65 referencias.
  3. **`#gourmet` (`Corredera Gourmet` — `["Store", "FoodEstablishment"]`)**: Horario L–S `09:00–21:00` (domingos y festivos cerrado); rango `€€`; carta propia de 37 referencias.

---

## 3. Estudio y Justificación de Palabras Clave Locales (Madrid Centro / Malasaña)

El establecimiento se ubica en **Calle de la Puebla, 15 (CP 28004, Madrid)**, en la confluencia entre **Malasaña / Universidad**, **Gran Vía**, **Callao** y **Corredera Baja de San Pablo**. Se han seleccionado términos con intención de búsqueda local y transaccional real, integrados de forma natural en títulos, encabezados `H1`–`H3`, descripciones de secciones y atributos `alt` (sin *keyword stuffing* ni páginas puerta artificiales):

| Clúster / Intención de Búsqueda | Palabras Clave Locales Principales | Ubicación Natural en la Web |
| :--- | :--- | :--- |
| **1. Obrador, Panadería y Bollería (Mañana / Takeaway)** | *obrador artesanal Madrid centro*, *bollería recién horneada Malasaña*, *croissant de mantequilla Madrid*, *NY Roll pistacho Madrid*, *hogaza de masa madre Calle de la Puebla* | `<title>`, `<h1>`, portal `01 · Corredera Bakery`, sección `#concepto` y fichas de las 14 referencias de bollería. |
| **2. Cafetería y Desayunos** | *desayunos en el centro de Madrid*, *cafetería cerca de Gran Vía y Callao*, *desayuno ibérico Madrid*, *tartas artesanas y tarta de queso Madrid* | `<meta name="description">`, `<h1>`, accesos rápidos del hero y categorías `Desayunos`, `Tartas` y `Cafetería`. |
| **3. Packs para Empresas, Oficinas y Eventos** | *packs desayuno oficina Madrid*, *catering dulce y salado empresas Madrid*, *Sweet & Salty Packs para llevar*, *cortador de jamón para bodas Madrid* | Sección `#packs` (`<h2>`), configurador interactivo de eventos y bloque de 8 servicios verificados en `#experiencia`. |
| **4. Tienda Gourmet, Ibéricos y Barra de Degustación** | *tienda gourmet Madrid centro*, *jamón ibérico de bellota al corte Malasaña*, *tablas de ibéricos y quesos con vino Madrid*, *tostas en pan de masa madre y conservas gourmet* | Portal `02 · Corredera Gourmet`, sección `#concepto`, JSON-LD `#gourmet` y 37 referencias de la carta Gourmet. |
| **5. Público Internacional / Turístico (EN)** | *artisan bakery central Madrid*, *specialty coffee Malasaña*, *acorn-fed Iberian ham tasting board Madrid*, *Spanish gourmet shop near Gran Vía* | Versión completa en `/?lang=en`, metadatos dinámicos en inglés y textos bilingües `nameEn` / `descEn` de las 102 referencias. |

---

## 4. URLs Previstas para Indexación vs. Rutas Excluidas

### URLs Canónicas Indexables (incluidas en `sitemap.xml`)
| URL Canónica | Idioma (`hreflang`) | Código HTTP | Directiva `Robots` | Propósito |
| :--- | :---: | :---: | :--- | :--- |
| `https://correderamadrid.com/` | `es` / `x-default` | `200 OK` | `index, follow` | Portada oficial, carta interactiva de 102 referencias, packs y contacto en español. |
| `https://correderamadrid.com/?lang=en` | `en` | `200 OK` | `index, follow` | Versión completa en inglés con precios formateados y pedido directo por WhatsApp. |

### Rutas Excluidas de Indexación (Protegidas)
| Ruta / Patrón | Código HTTP | Protección Aplicada | Motivo de Exclusión |
| :--- | :---: | :--- | :--- |
| `/admin` | `200 OK` | Cabecera HTTP `X-Robots-Tag: noindex, nofollow, noarchive` + `<meta name="robots" content="noindex, nofollow, noarchive">` + RBAC servidor | Panel privado del propietario; no se expone en `robots.txt` ni en `sitemap.xml`. |
| `/api/*` | `200` / `401` / `404` | `Disallow: /api/` en `robots.txt` + `X-Robots-Tag: noindex, nofollow, noarchive` | Endpoints internos tRPC, salud y configuración. |
| `/404` y cualquier ruta no existente | `404 Not Found` | Código HTTP `404` real + `X-Robots-Tag: noindex, nofollow` + `<meta name="robots" content="noindex, nofollow">` | Evita *Soft-404* en buscadores. |
| `#destacados`, `#carta`, `#packs`, `#concepto`, `#visitanos` | N/A (anclas en `/`) | Enlaces internos semánticos `<a href="#...">`, excluidos de `sitemap.xml` | Los fragmentos `#` pertenecen al documento canónico `/` y no deben listarse como URLs separadas en `sitemap.xml`. |

---

## 5. Tareas Externas que Requieren Intervención del Propietario

> **Declaración de transparencia**: No se ha creado, reclamado ni modificado ninguna cuenta externa de Google Business Profile, Google Search Console ni Google Analytics, ya que requieren acceso autenticado desde las cuentas oficiales de **Vallejo Lorenzo S.L.**

Pasos recomendados para el propietario:

1. **Confirmación de Estrategia en Google Business Profile (Ficha de Google Maps)**:
   - Verificar desde la cuenta de propietario de Google Business Profile si se mantendrán dos fichas separadas (**Corredera Bakery** y **Corredera Gourmet**) en `Calle de la Puebla, 15, 28004 Madrid` o una ficha unificada con departamentos.
   - Asegurar que el teléfono principal (`+34 919 47 14 49`), el enlace de mensajería/WhatsApp (`+34 640 34 19 32`), la URL web (`https://correderamadrid.com/`) y los horarios coincidan exactamente con los publicados en la web y en el marcado Schema.org.
   - Subir fotografías reales adicionales del local, del obrador y de las tablas servidas en barra directamente a la ficha de Google Business Profile.

2. **Alta y Envío de Sitemap en Google Search Console**:
   - Acceder a [Google Search Console](https://search.google.com/search-console) con la cuenta del negocio y verificar la propiedad de dominio `correderamadrid.com` mediante registro TXT en el DNS.
   - En la sección **Sitemaps**, enviar la URL: `https://correderamadrid.com/sitemap.xml`.
   - Usar la herramienta **Inspección de URLs** sobre `https://correderamadrid.com/` y `https://correderamadrid.com/?lang=en` para solicitar la indexación y comprobar la detección de los bloques estructurados (`Organization`, `Bakery`, `FoodEstablishment`, `Menu`).

3. **Medición de Conversiones (Opcional, con Consentimiento RGPD/LSSI)**:
   - Si el propietario desea medir clics hacia WhatsApp (`wa.me/34640341932`) y llamadas telefónicas (`tel:+34919471449`) mediante Google Analytics 4 o Plausible/Matomo, deberá incorporar su propio identificador de medición junto con un banner de consentimiento de cookies si emplea cookies analíticas no exentas.
