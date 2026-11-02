import { Cookie, FileText, Scale, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Lang } from "../../../shared/catalog";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "../../../shared/siteSettingsSchema";

export type LegalTabId = "aviso-legal" | "privacidad" | "cookies" | "condiciones";

const PRIVACY_ACK_STORAGE_KEY = "corredera_privacy_notice_v1";
const LAST_UPDATED = { es: "2 de noviembre de 2026", en: "2 November 2026" };

interface LegalPrivacyModalProps {
  open: boolean;
  initialTab?: LegalTabId;
  onClose: () => void;
  lang: Lang;
  siteSettings?: SiteSettings;
}

/** Owner fields still holding the "[PENDIENTE…]" placeholder are left out instead of shown. */
const filled = (value: string) => (value && !value.includes("PENDIENTE") ? value : "");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cg-legal__section">
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="cg-legal__facts">
      {rows
        .filter(([, value]) => Boolean(value))
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

export function LegalPrivacyModal({
  open,
  initialTab = "privacidad",
  onClose,
  lang,
  siteSettings = DEFAULT_SITE_SETTINGS,
}: LegalPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTabId>(initialTab);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
    // On phones the tab row scrolls sideways: keep the open document's tab in view.
    document
      .querySelector('.cg-legal__tabs [aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeTab, open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const es = lang === "es";
  const { legal, contact } = siteSettings;
  const site = typeof window !== "undefined" ? window.location.host : "";
  const nif = filled(legal.nif);
  const registry = filled(legal.registryInfo);
  const email = legal.privacyEmail;
  const mail = <a href={`mailto:${email}`}>{email}</a>;
  const owner = `${legal.companyName}${nif ? ` (NIF ${nif})` : ""}`;

  const tabs: { id: LegalTabId; es: string; en: string; icon: typeof Scale }[] = [
    { id: "aviso-legal", es: "Aviso legal", en: "Legal notice", icon: Scale },
    { id: "privacidad", es: "Privacidad", en: "Privacy", icon: ShieldCheck },
    { id: "cookies", es: "Cookies", en: "Cookies", icon: Cookie },
    { id: "condiciones", es: "Condiciones de encargo", en: "Order terms", icon: FileText },
  ];
  const current = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="cg-legal" role="dialog" aria-modal="true" aria-labelledby="cg-legal-title" onClick={onClose}>
      <div className="cg-legal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="cg-legal__head">
          <div>
            <p className="cg-eyebrow">{legal.tradeName}</p>
            <h2 id="cg-legal-title">{es ? "Información legal" : "Legal information"}</h2>
          </div>
          <button type="button" className="cg-icon-btn" onClick={onClose} aria-label={es ? "Cerrar" : "Close"}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </header>

        <div className="cg-legal__tabs" role="tablist" aria-label={es ? "Documentos legales" : "Legal documents"}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
                {es ? tab.es : tab.en}
              </button>
            );
          })}
        </div>

        <div className="cg-legal__body" ref={bodyRef} role="tabpanel" aria-label={es ? current.es : current.en}>
          <h3 className="cg-legal__title">{es ? current.es : current.en}</h3>
          <p className="cg-legal__updated">
            {es ? "Última actualización" : "Last updated"}: {es ? LAST_UPDATED.es : LAST_UPDATED.en}
          </p>

          {activeTab === "aviso-legal" &&
            (es ? (
              <>
                <p>
                  En cumplimiento del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio
                  Electrónico (LSSI-CE), se informa de los datos del titular de este sitio web ({site}).
                </p>
                <Facts
                  rows={[
                    ["Titular", legal.companyName],
                    ["Nombre comercial", `${legal.tradeName} (Corredera Gourmet, Carnicería, Frutería y Corredera Bakery)`],
                    ["NIF", nif],
                    ["Domicilio", legal.registeredAddress],
                    ["Datos registrales", registry],
                    ["Teléfono", contact.landlineDisplay],
                    ["WhatsApp", contact.whatsappDisplay],
                    ["Email", mail],
                  ]}
                />
                <Section title="Objeto">
                  <p>
                    Este sitio web presenta la tienda gourmet, la carnicería, la frutería y el obrador y cafetería que{" "}
                    {legal.companyName} gestiona en {contact.addressLine}, y permite preparar encargos que se envían por WhatsApp
                    para su confirmación. No se realizan pagos en la web.
                  </p>
                </Section>
                <Section title="Condiciones de uso">
                  <p>
                    El acceso es libre y gratuito. Quien navega se compromete a hacer un uso lícito del sitio, a no dañar su
                    funcionamiento y a facilitar datos veraces al preparar un encargo. Podemos modificar los contenidos, precios y
                    estas condiciones en cualquier momento; la versión vigente es la publicada en esta página.
                  </p>
                </Section>
                <Section title="Propiedad intelectual e industrial">
                  <p>
                    Los textos, fotografías, logotipos, diseño y código de este sitio pertenecen a {legal.companyName} o a sus
                    licenciantes. Queda prohibida su reproducción, distribución o transformación con fines comerciales sin
                    autorización expresa. Las marcas de los productos que comercializamos pertenecen a sus respectivos titulares.
                  </p>
                </Section>
                <Section title="Responsabilidad">
                  <p>
                    Cuidamos que la información sea correcta y esté actualizada, pero las fotografías son orientativas y los precios
                    de los productos al peso o según mercado se confirman siempre antes de preparar el encargo. Los enlaces a
                    servicios de terceros (WhatsApp, Google Maps, Instagram o TikTok) se rigen por las condiciones de esos servicios.
                  </p>
                </Section>
                <Section title="Legislación aplicable">
                  <p>
                    Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someten a los
                    juzgados y tribunales que correspondan conforme a la normativa de consumidores y usuarios (Real Decreto
                    Legislativo 1/2007), que en el caso de un consumidor son los de su domicilio.
                  </p>
                </Section>
              </>
            ) : (
              <>
                <p>
                  In accordance with article 10 of Spanish Law 34/2002 on Information Society Services and Electronic Commerce
                  (LSSI-CE), these are the details of the owner of this website ({site}).
                </p>
                <Facts
                  rows={[
                    ["Owner", legal.companyName],
                    ["Trade name", `${legal.tradeName} (Corredera Gourmet, Butcher, Greengrocer and Corredera Bakery)`],
                    ["Tax ID (NIF)", nif],
                    ["Address", legal.registeredAddress],
                    ["Company registry", registry],
                    ["Phone", contact.landlineDisplay],
                    ["WhatsApp", contact.whatsappDisplay],
                    ["Email", mail],
                  ]}
                />
                <Section title="Purpose">
                  <p>
                    This website presents the gourmet shop, butcher, greengrocer and bakery-café run by {legal.companyName} at{" "}
                    {contact.addressLine}, and lets you prepare orders that are sent via WhatsApp for confirmation. No payments are
                    taken on the website.
                  </p>
                </Section>
                <Section title="Terms of use">
                  <p>
                    Access is free. Visitors agree to use the site lawfully, not to disrupt it and to provide accurate details when
                    preparing an order. We may update content, prices and these terms at any time; the version published here
                    applies.
                  </p>
                </Section>
                <Section title="Intellectual property">
                  <p>
                    Texts, photographs, logos, design and code belong to {legal.companyName} or its licensors and may not be
                    reproduced, distributed or transformed for commercial purposes without express permission. Product brands
                    belong to their respective owners.
                  </p>
                </Section>
                <Section title="Liability">
                  <p>
                    We keep the information accurate and up to date, but photographs are illustrative and prices of items sold by
                    weight or at market price are always confirmed before an order is prepared. Links to third-party services
                    (WhatsApp, Google Maps, Instagram, TikTok) are governed by those services' own terms.
                  </p>
                </Section>
                <Section title="Governing law">
                  <p>
                    This notice is governed by Spanish law. Disputes are submitted to the courts that apply under consumer
                    protection law (Royal Legislative Decree 1/2007), which for consumers are those of their place of residence.
                  </p>
                </Section>
              </>
            ))}

          {activeTab === "privacidad" &&
            (es ? (
              <>
                <p>
                  Esta política explica cómo tratamos tus datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley
                  Orgánica 3/2018 (LOPDGDD). Solo pedimos los datos necesarios para atender tu encargo.
                </p>
                <Facts
                  rows={[
                    ["Responsable", owner],
                    ["Dirección", legal.registeredAddress],
                    ["Contacto de privacidad", mail],
                  ]}
                />
                <Section title="Qué datos tratamos">
                  <ul>
                    <li>
                      <strong>Encargos:</strong> nombre, teléfono, dirección de entrega (solo si eliges envío a domicilio), fecha u
                      hora deseada, productos y las notas que añadas.
                    </li>
                    <li>
                      <strong>Alergias o intolerancias:</strong> solo si nos las indicas voluntariamente en las notas, para preparar
                      tu pedido con seguridad. Al escribirlas nos das tu consentimiento explícito para usarlas con ese único fin.
                    </li>
                    <li>
                      <strong>Mensajes:</strong> lo que nos escribas por WhatsApp, teléfono o email.
                    </li>
                    <li>
                      <strong>Estadísticas de uso:</strong> páginas visitadas, tipo de dispositivo, idioma y web de procedencia, de
                      forma agregada y sin cookies. La dirección IP no se guarda: solo un código irreversible para evitar abusos.
                    </li>
                  </ul>
                </Section>
                <Section title="Para qué y con qué base legal">
                  <ul>
                    <li>Preparar, confirmar y entregar tu encargo y contactarte sobre él: ejecución de un contrato o de medidas precontractuales a tu petición (art. 6.1.b RGPD).</li>
                    <li>Responder tus consultas: tu consentimiento al escribirnos (art. 6.1.a RGPD).</li>
                    <li>Cumplir obligaciones contables y fiscales cuando se emite factura: obligación legal (art. 6.1.c RGPD).</li>
                    <li>Mantener la seguridad de la web, evitar pedidos fraudulentos y conocer el uso del sitio de forma agregada: interés legítimo (art. 6.1.f RGPD).</li>
                  </ul>
                  <p>No elaboramos perfiles, no tomamos decisiones automatizadas y no enviamos publicidad sin tu permiso.</p>
                </Section>
                <Section title="Cuánto tiempo los guardamos">
                  <p>
                    Los datos de los encargos se borran automáticamente del sistema a los {legal.orderRetentionDays} días. Los
                    mensajes se conservan el tiempo necesario para atenderte. Los datos de facturación se guardan los plazos que
                    exige la ley (por ejemplo, seis años según el Código de Comercio).
                  </p>
                </Section>
                <Section title="Quién más puede verlos">
                  <ul>
                    <li>
                      <strong>WhatsApp</strong> (WhatsApp Ireland Ltd., grupo Meta): al enviar tu encargo, tu dispositivo abre
                      WhatsApp y el mensaje viaja por ese servicio según su propia política de privacidad.
                    </li>
                    <li>
                      <strong>Proveedor de alojamiento</strong> (Cloudflare, Inc.): aloja la web y sus datos como encargado del
                      tratamiento, con las garantías del Marco de Privacidad de Datos UE-EE. UU. y cláusulas contractuales tipo.
                    </li>
                    <li>Empresas de reparto, solo si eliges envío a domicilio y únicamente los datos de entrega.</li>
                    <li>Administraciones públicas cuando la ley lo exija.</li>
                  </ul>
                  <p>No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>
                </Section>
                <Section title="Tus derechos">
                  <p>
                    Puedes pedir el acceso, la rectificación, la supresión, la limitación, la portabilidad de tus datos u oponerte a
                    su tratamiento, y retirar tu consentimiento cuando quieras, escribiendo a {mail} o por correo postal a{" "}
                    {legal.registeredAddress}. Si consideras que no te hemos atendido bien, puedes reclamar ante la Agencia Española
                    de Protección de Datos (
                    <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
                      www.aepd.es
                    </a>
                    ).
                  </p>
                </Section>
                <Section title="Seguridad y menores">
                  <p>
                    La web funciona siempre con conexión cifrada (HTTPS) y el acceso al panel de gestión está protegido con
                    contraseña cifrada. Los encargos deben realizarlos mayores de 14 años; la compra de vino y otras bebidas
                    alcohólicas está reservada a mayores de 18.
                  </p>
                </Section>
              </>
            ) : (
              <>
                <p>
                  This policy explains how we process your personal data under Regulation (EU) 2016/679 (GDPR) and Spanish
                  Organic Law 3/2018 (LOPDGDD). We only ask for the data needed to handle your order.
                </p>
                <Facts
                  rows={[
                    ["Controller", owner],
                    ["Address", legal.registeredAddress],
                    ["Privacy contact", mail],
                  ]}
                />
                <Section title="Data we process">
                  <ul>
                    <li>
                      <strong>Orders:</strong> name, phone, delivery address (only for home delivery), preferred date or time,
                      products and any notes you add.
                    </li>
                    <li>
                      <strong>Allergies or intolerances:</strong> only if you choose to mention them in the notes, so we can prepare
                      your order safely. By writing them you give explicit consent to use them for that sole purpose.
                    </li>
                    <li>
                      <strong>Messages:</strong> whatever you send us by WhatsApp, phone or email.
                    </li>
                    <li>
                      <strong>Usage statistics:</strong> pages visited, device type, language and referring website, aggregated and
                      without cookies. IP addresses are not stored: only an irreversible code used to prevent abuse.
                    </li>
                  </ul>
                </Section>
                <Section title="Purposes and legal bases">
                  <ul>
                    <li>Preparing, confirming and delivering your order and contacting you about it: performance of a contract or pre-contractual steps at your request (art. 6.1.b GDPR).</li>
                    <li>Answering your enquiries: your consent when you contact us (art. 6.1.a GDPR).</li>
                    <li>Accounting and tax obligations when an invoice is issued: legal obligation (art. 6.1.c GDPR).</li>
                    <li>Website security, fraud prevention and aggregated usage insights: legitimate interest (art. 6.1.f GDPR).</li>
                  </ul>
                  <p>We do not profile you, make automated decisions or send advertising without your permission.</p>
                </Section>
                <Section title="Retention">
                  <p>
                    Order data is deleted from the system automatically after {legal.orderRetentionDays} days. Messages are kept as
                    long as needed to assist you. Billing data is kept for the periods required by law (for example, six years
                    under the Spanish Commercial Code).
                  </p>
                </Section>
                <Section title="Recipients">
                  <ul>
                    <li>
                      <strong>WhatsApp</strong> (WhatsApp Ireland Ltd., Meta group): when you send your order, your device opens
                      WhatsApp and the message travels through that service under its own privacy policy.
                    </li>
                    <li>
                      <strong>Hosting provider</strong> (Cloudflare, Inc.): hosts the website and its data as a processor, under the
                      EU-US Data Privacy Framework and standard contractual clauses.
                    </li>
                    <li>Delivery companies, only for home delivery and only the delivery details.</li>
                    <li>Public authorities where required by law.</li>
                  </ul>
                  <p>We never sell or share your data with third parties for marketing.</p>
                </Section>
                <Section title="Your rights">
                  <p>
                    You may request access, rectification, erasure, restriction, portability or object to processing, and withdraw
                    consent at any time, by writing to {mail} or by post to {legal.registeredAddress}. You may also lodge a
                    complaint with the Spanish Data Protection Agency (
                    <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
                      www.aepd.es
                    </a>
                    ).
                  </p>
                </Section>
                <Section title="Security and minors">
                  <p>
                    The website always uses an encrypted connection (HTTPS) and the management panel is protected by an encrypted
                    password. Orders must be placed by people aged 14 or over; wine and other alcoholic drinks are sold only to
                    adults aged 18 or over.
                  </p>
                </Section>
              </>
            ))}

          {activeTab === "cookies" && (
            <>
              <p>
                {es
                  ? "Esta web no utiliza cookies publicitarias, de redes sociales ni de analítica de terceros. Solo usa el almacenamiento técnico imprescindible para que funcione, que está exento de consentimiento según el artículo 22.2 de la LSSI-CE y la Guía sobre cookies de la AEPD. Las fuentes tipográficas se sirven desde nuestro propio servidor."
                  : "This website does not use advertising, social media or third-party analytics cookies. It only uses the technical storage strictly needed for it to work, which is exempt from consent under article 22.2 of the LSSI-CE and the Spanish Data Protection Agency's cookie guidelines. Fonts are served from our own server."}
              </p>
              <Section title={es ? "Qué guardamos en tu navegador" : "What we store in your browser"}>
                <div className="cg-legal__table">
                  <table>
                    <thead>
                      <tr>
                        <th>{es ? "Nombre" : "Name"}</th>
                        <th>{es ? "Tipo" : "Type"}</th>
                        <th>{es ? "Duración" : "Duration"}</th>
                        <th>{es ? "Para qué sirve" : "Purpose"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["cbg-cart-v2", es ? "Almacenamiento local" : "Local storage", es ? "Hasta vaciar el pedido" : "Until the order is cleared", es ? "Guarda los productos de tu pedido." : "Keeps the products in your order."],
                        ["cbg-lang", es ? "Almacenamiento local" : "Local storage", es ? "Persistente" : "Persistent", es ? "Recuerda el idioma elegido." : "Remembers your language."],
                        ["cbg-ham-pref", es ? "Almacenamiento local" : "Local storage", es ? "Persistente" : "Persistent", es ? "Recuerda si quieres el jamón cortado o entero." : "Remembers whether you want your ham carved or whole."],
                        [PRIVACY_ACK_STORAGE_KEY, es ? "Almacenamiento local" : "Local storage", es ? "Persistente" : "Persistent", es ? "Recuerda que ya has visto el aviso de privacidad." : "Remembers that you have seen the privacy notice."],
                        ["cbg-landing-sent", es ? "Almacenamiento de sesión" : "Session storage", es ? "Hasta cerrar la pestaña" : "Until the tab is closed", es ? "Evita contar dos veces la misma visita en las estadísticas anónimas." : "Avoids counting the same visit twice in anonymous statistics."],
                        ["corredera_admin_session", es ? "Cookie propia (HttpOnly)" : "First-party cookie (HttpOnly)", es ? "12 horas" : "12 hours", es ? "Solo para el propietario: mantiene abierta su sesión en el panel de gestión." : "Owner only: keeps the management panel session open."],
                        ["corredera-admin-token", es ? "Almacenamiento de sesión" : "Session storage", es ? "Hasta cerrar la pestaña" : "Until the tab is closed", es ? "Solo para el propietario: respaldo de la sesión del panel." : "Owner only: backup of the panel session."],
                        ["__cf_bm", es ? "Cookie técnica de Cloudflare" : "Cloudflare technical cookie", es ? "30 minutos" : "30 minutes", es ? "Puede aparecer para proteger la web frente a tráfico automatizado malicioso." : "May be set to protect the site from malicious automated traffic."],
                      ].map(([name, type, duration, purpose]) => (
                        <tr key={name}>
                          <td>
                            <code>{name}</code>
                          </td>
                          <td>{type}</td>
                          <td>{duration}</td>
                          <td>{purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
              <Section title={es ? "Cómo borrarlas o bloquearlas" : "How to delete or block them"}>
                <p>
                  {es
                    ? "Puedes borrar o bloquear este almacenamiento desde la configuración de tu navegador (Chrome, Safari, Firefox o Edge, en el apartado de privacidad o datos de sitios). Si lo haces, la web seguirá funcionando, pero se vaciará tu pedido y se olvidará el idioma elegido."
                    : "You can delete or block this storage in your browser settings (Chrome, Safari, Firefox or Edge, under privacy or site data). The site will keep working, but your order will be emptied and your language preference forgotten."}
                </p>
                <p>
                  {es
                    ? "Si en el futuro usamos cookies que requieran consentimiento, te lo pediremos antes de instalarlas."
                    : "If we ever use cookies that require consent, we will ask you before setting them."}
                </p>
              </Section>
            </>
          )}

          {activeTab === "condiciones" &&
            (es ? (
              <>
                <p>
                  Estas condiciones regulan los encargos que preparas en esta web para {legal.tradeName} (tienda gourmet,
                  carnicería, frutería y obrador), titularidad de {owner}, {legal.registeredAddress}.
                </p>
                <Section title="1. Cómo se hace un encargo">
                  <p>
                    Añade los productos a tu pedido, indica recogida o envío y tus datos, y pulsa «Enviar pedido por WhatsApp». Se
                    abrirá WhatsApp con el resumen y un código de referencia para enviarlo a {contact.whatsappDisplay}. También puedes
                    encargar por teléfono ({contact.landlineDisplay}) o en la tienda.
                  </p>
                </Section>
                <Section title="2. Confirmación">
                  <p>
                    El envío del mensaje es una solicitud. El encargo queda confirmado cuando te respondemos con la disponibilidad,
                    el importe y el día y la hora de recogida o entrega. Si algún producto no está disponible, te propondremos una
                    alternativa o lo retiraremos del pedido.
                  </p>
                </Section>
                <Section title="3. Precios">
                  <p>
                    Los precios están en euros e incluyen el IVA. Los productos al peso (embutidos y quesos al corte, carnicería y
                    frutería) y los marcados como «Consultar» se cobran según el peso exacto y el precio del día; te confirmamos el
                    importe antes de preparar el encargo. Los gastos de envío se indican aparte antes de confirmar.
                  </p>
                </Section>
                <Section title="4. Pago">
                  <p>
                    La web no cobra ni pide datos bancarios. Pagas en la tienda al recoger o en la entrega, por los medios aceptados
                    en el establecimiento. Para encargos grandes o cestas personalizadas podemos pedir una señal, que te
                    indicaremos al confirmar.
                  </p>
                </Section>
                <Section title="5. Recogida y envío">
                  <p>
                    Recogida en {contact.addressLine} en el horario de la tienda. Si no puedes venir a la hora acordada, avísanos
                    por WhatsApp; los productos frescos se guardan como máximo hasta el cierre del día acordado. El envío a
                    domicilio está sujeto a la zona de reparto y a su coste, que te confirmamos antes. Revisa el pedido al recibirlo
                    y avísanos en el momento si hay cualquier incidencia.
                  </p>
                </Section>
                <Section title="6. Cambios y cancelaciones">
                  <p>
                    Puedes cambiar o cancelar tu encargo sin coste mientras no se haya preparado. Una vez cortados, fileteados,
                    loncheados o envasados a tu medida (jamones, carne, embutidos, quesos, cestas o tartas), no es posible cancelarlos.
                  </p>
                </Section>
                <Section title="7. Derecho de desistimiento">
                  <p>
                    En los encargos con envío a domicilio, tienes 14 días naturales desde la entrega para desistir, sin dar
                    explicaciones, de los productos envasados y no perecederos (por ejemplo aceites, conservas o vino), siempre que
                    estén precintados. Según el artículo 103 del Real Decreto Legislativo 1/2007, este derecho no se aplica a
                    productos perecederos o que caducan con rapidez (carne, fruta, verdura, pan y repostería), a los confeccionados
                    según tus indicaciones (cortados, loncheados o envasados a medida) ni a los precintados por razones de higiene
                    que se hayan abierto. Para ejercerlo, escríbenos a {mail} o por WhatsApp; te devolveremos el importe en un plazo
                    máximo de 14 días.
                  </p>
                </Section>
                <Section title="8. Alérgenos">
                  <p>
                    Conforme al Reglamento (UE) 1169/2011, la información sobre alérgenos de cada producto está disponible en la
                    tienda y por WhatsApp. En nuestras instalaciones se manipulan gluten, frutos de cáscara, leche, huevo, sésamo,
                    soja, sulfitos y otros alérgenos, por lo que no podemos descartar trazas. Indícanos cualquier alergia antes de
                    confirmar tu encargo.
                  </p>
                </Section>
                <Section title="9. Bebidas alcohólicas">
                  <p>No vendemos vino ni otras bebidas alcohólicas a menores de 18 años; podemos pedir el documento de identidad al entregarlas.</p>
                </Section>
                <Section title="10. Garantía y reclamaciones">
                  <p>
                    Todos los productos cuentan con la garantía legal. Si algo no está bien, contacta con nosotros en {mail},{" "}
                    {contact.whatsappDisplay} o en la tienda, donde tienes hojas de reclamación a tu disposición. También puedes
                    acudir a los servicios de consumo de la Comunidad de Madrid o del Ayuntamiento de Madrid.
                  </p>
                </Section>
              </>
            ) : (
              <>
                <p>
                  These terms govern orders prepared on this website for {legal.tradeName} (gourmet shop, butcher, greengrocer and
                  bakery), owned by {owner}, {legal.registeredAddress}.
                </p>
                <Section title="1. Placing an order">
                  <p>
                    Add products to your order, choose pickup or delivery, enter your details and tap “Send order via WhatsApp”.
                    WhatsApp opens with the summary and a reference code to send to {contact.whatsappDisplay}. You can also order by
                    phone ({contact.landlineDisplay}) or in store.
                  </p>
                </Section>
                <Section title="2. Confirmation">
                  <p>
                    Sending the message is a request. Your order is confirmed when we reply with availability, the amount and the
                    pickup or delivery date and time. If a product is unavailable we will suggest an alternative or remove it.
                  </p>
                </Section>
                <Section title="3. Prices">
                  <p>
                    Prices are in euros and include VAT. Items sold by weight (charcuterie and cheese cut to order, butcher and
                    greengrocer) and those marked “Ask price” are charged by exact weight and the day's price; we confirm the amount
                    before preparing your order. Delivery costs are stated separately before confirmation.
                  </p>
                </Section>
                <Section title="4. Payment">
                  <p>
                    The website takes no payments and asks for no bank details. You pay in store on pickup or on delivery, using the
                    methods accepted by the store. For large orders or custom baskets we may ask for a deposit, stated when
                    confirming.
                  </p>
                </Section>
                <Section title="5. Pickup and delivery">
                  <p>
                    Pickup at {contact.addressLine} during opening hours. If you cannot make the agreed time, let us know on
                    WhatsApp; fresh products are kept until closing time on the agreed day at most. Home delivery depends on the
                    delivery area and its cost, confirmed beforehand. Please check your order on arrival and tell us straight away
                    about any issue.
                  </p>
                </Section>
                <Section title="6. Changes and cancellations">
                  <p>
                    You can change or cancel your order free of charge until it has been prepared. Once cut, sliced or packed to your
                    specifications (hams, meat, charcuterie, cheese, baskets or cakes), it can no longer be cancelled.
                  </p>
                </Section>
                <Section title="7. Right of withdrawal">
                  <p>
                    For home-delivered orders, you have 14 calendar days from delivery to withdraw, without giving reasons, from
                    packaged non-perishable products (such as olive oil, preserves or wine) that remain sealed. Under article 103 of
                    Royal Legislative Decree 1/2007 this right does not apply to perishable goods (meat, fruit, vegetables, bread and
                    pastries), goods made to your specifications (cut, sliced or packed to order) or hygiene-sealed goods that have
                    been opened. To withdraw, write to {mail} or on WhatsApp; we will refund you within 14 days at the latest.
                  </p>
                </Section>
                <Section title="8. Allergens">
                  <p>
                    In line with Regulation (EU) 1169/2011, allergen information for each product is available in store and on
                    WhatsApp. Gluten, tree nuts, milk, egg, sesame, soy, sulphites and other allergens are handled on our premises,
                    so traces cannot be ruled out. Tell us about any allergy before confirming your order.
                  </p>
                </Section>
                <Section title="9. Alcoholic drinks">
                  <p>We do not sell wine or other alcoholic drinks to anyone under 18 and may ask for ID on delivery.</p>
                </Section>
                <Section title="10. Guarantee and complaints">
                  <p>
                    All products carry the legal guarantee. If something is not right, contact us at {mail},{" "}
                    {contact.whatsappDisplay} or in store, where complaint forms are available. You can also contact the consumer
                    services of the Community or City of Madrid.
                  </p>
                </Section>
              </>
            ))}
        </div>
      </div>
    </div>
  );
}

interface PrivacyNoticeBannerProps {
  lang: Lang;
  onOpenLegalModal: (tab: LegalTabId) => void;
}

/** Informative notice only: the site uses no storage that needs consent. */
export function PrivacyNoticeBanner({ lang, onOpenLegalModal }: PrivacyNoticeBannerProps) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(PRIVACY_ACK_STORAGE_KEY) === "ack";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;
  const es = lang === "es";

  const acknowledge = () => {
    try {
      window.localStorage.setItem(PRIVACY_ACK_STORAGE_KEY, "ack");
    } catch {
      // storage disabled
    }
    setDismissed(true);
  };

  return (
    <aside className="cg-privacy-note" aria-label={es ? "Aviso de privacidad" : "Privacy notice"}>
      <Cookie size={20} strokeWidth={1.5} aria-hidden="true" />
      <p>
        {es
          ? "Sin cookies publicitarias ni rastreadores: solo guardamos tu pedido y tu idioma en este navegador."
          : "No advertising cookies or trackers: we only keep your order and language in this browser."}{" "}
        <button type="button" onClick={() => onOpenLegalModal("cookies")}>
          {es ? "Más información" : "Learn more"}
        </button>
      </p>
      <button type="button" className="cg-btn cg-btn--primary cg-btn--sm" onClick={acknowledge}>
        {es ? "Entendido" : "Got it"}
      </button>
    </aside>
  );
}
