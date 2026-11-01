import { Check, Cookie, FileText, Lock, Scale, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Lang } from "../../../shared/catalog";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "../../../shared/siteSettingsSchema";

export type LegalTabId = "aviso-legal" | "privacidad" | "cookies" | "condiciones";

const PRIVACY_ACK_STORAGE_KEY = "corredera_privacy_notice_v1";

interface LegalPrivacyModalProps {
  open: boolean;
  initialTab?: LegalTabId;
  onClose: () => void;
  lang: Lang;
  siteSettings?: SiteSettings;
}

export function LegalPrivacyModal({
  open,
  initialTab = "privacidad",
  onClose,
  lang,
  siteSettings = DEFAULT_SITE_SETTINGS,
}: LegalPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTabId>(initialTab);

  useEffect(() => {
    if (open && initialTab) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const { legal, contact } = siteSettings;
  const isNifPending = legal.nif.includes("PENDIENTE");
  const isRegistryPending = legal.registryInfo.includes("PENDIENTE");

  const tabs: { id: LegalTabId; labelEs: string; labelEn: string; icon: typeof Scale }[] = [
    { id: "aviso-legal", labelEs: "Aviso Legal", labelEn: "Legal Notice", icon: Scale },
    { id: "privacidad", labelEs: "Privacidad (RGPD)", labelEn: "Privacy (GDPR)", icon: ShieldCheck },
    { id: "cookies", labelEs: "Política de Cookies", labelEn: "Cookies Policy", icon: Cookie },
    { id: "condiciones", labelEs: "Condiciones de Pedido", labelEn: "Order Terms", icon: FileText },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={
        lang === "es"
          ? "Información Legal, Privacidad, Cookies y Condiciones de Pedido"
          : "Legal Notice, Privacy Policy, Cookies and Order Terms"
      }
      onClick={onClose}
    >
      <div
        className="bg-[#FAF6F0] text-[#1E1915] rounded-2xl max-w-4xl w-full border border-stone-300 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#181310] text-[#F5EFE6] px-5 py-4 flex items-center justify-between border-b border-amber-200/20 shrink-0">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-300 shrink-0" aria-hidden="true" />
            <div>
              <span className="text-[11px] uppercase tracking-widest text-amber-300/90 block font-semibold">
                {legal.companyName} · {legal.tradeName}
              </span>
              <h2 className="font-serif text-lg sm:text-xl text-white">
                {lang === "es"
                  ? "Marco Legal, Protección de Datos y Condiciones"
                  : "Legal Notice, Data Protection & Terms"}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition"
            aria-label={lang === "es" ? "Cerrar ventana legal" : "Close legal modal"}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="bg-[#EFE9DF] px-4 py-2.5 border-b border-stone-300 flex flex-wrap gap-1.5 shrink-0"
          role="tablist"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  active
                    ? "bg-[#181310] text-amber-100 shadow-xs"
                    : "text-stone-700 hover:bg-stone-200/80"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{lang === "es" ? tab.labelEs : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 text-sm leading-relaxed text-stone-800">
          {activeTab === "aviso-legal" && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                  Ley 34/2002 (LSSI-CE) · Información General
                </span>
                <h3 className="font-serif text-2xl text-stone-900 mt-0.5">
                  1. Aviso Legal y Datos Identificativos del Titular
                </h3>
              </div>

              <p>
                En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de
                la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se exponen los
                datos identificativos del titular del sitio web{" "}
                <strong>https://correderagourmet.com/</strong>:
              </p>

              <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-2 text-xs sm:text-sm">
                <div>
                  <strong>Denominación Social (Titular):</strong> {legal.companyName}
                </div>
                <div>
                  <strong>Nombre Comercial:</strong> {legal.tradeName} (Corredera Bakery &amp;
                  Corredera Gourmet)
                </div>
                <div>
                  <strong>NIF / CIF:</strong>{" "}
                  <span
                    className={
                      isNifPending
                        ? "bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-mono text-xs font-semibold"
                        : ""
                    }
                  >
                    {legal.nif}
                  </span>
                </div>
                <div>
                  <strong>Domicilio Social y Establecimiento Físico:</strong>{" "}
                  {legal.registeredAddress}
                </div>
                <div>
                  <strong>Datos de Inscripción Registral:</strong>{" "}
                  <span
                    className={
                      isRegistryPending
                        ? "bg-amber-100 text-amber-950 px-2 py-0.5 rounded font-mono text-xs font-semibold"
                        : ""
                    }
                  >
                    {legal.registryInfo}
                  </span>
                </div>
                <div>
                  <strong>Teléfono del Establecimiento:</strong> {contact.landlineDisplay} ·{" "}
                  <strong>WhatsApp Oficial Pedidos/Reservas:</strong> {contact.whatsappDisplay}
                </div>
                <div>
                  <strong>Correo Electrónico de Contacto y Ejercicio de Derechos:</strong>{" "}
                  <a href={`mailto:${legal.privacyEmail}`} className="underline text-amber-900">
                    {legal.privacyEmail}
                  </a>
                </div>
              </div>

              {(isNifPending || isRegistryPending) && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950">
                  <strong>Nota de auditoría:</strong> Los campos marcados como{" "}
                  <code>[PENDIENTE DE COMPLETAR POR EL PROPIETARIO]</code> no han sido inventados.
                  El propietario puede completarlos en cualquier momento desde{" "}
                  <strong>Panel de Administración → Contenido Web &amp; Temporadas → Datos Legales</strong>.
                </div>
              )}

              <h4 className="font-semibold text-stone-900 pt-2">
                Propiedad Intelectual e Industrial
              </h4>
              <p>
                Los textos, fotografías autorizadas del establecimiento, logotipos oficiales,
                estructura de carta (102 referencias de Corredera Bakery y Corredera Gourmet) y
                código fuente pertenecen a <strong>{legal.companyName}</strong> o a sus legítimos
                licenciantes, quedando prohibida su reproducción, distribución o transformación con
                fines comerciales sin autorización expresa.
              </p>

              <h4 className="font-semibold text-stone-900 pt-2">
                Legislación Aplicable y Jurisdicción
              </h4>
              <p>
                Las presentes condiciones se rigen por la legislación española. Para cualquier
                controversia que pudiera derivarse del acceso o uso de este sitio web, las partes
                se someten a los Juzgados y Tribunales de la ciudad de Madrid, salvo fuero
                imperativo aplicable a consumidores y usuarios conforme al Real Decreto Legislativo
                1/2007 (TRLGDCU).
              </p>
            </div>
          )}

          {activeTab === "privacidad" && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                  RGPD (UE) 2016/679 · LOPDGDD 3/2018
                </span>
                <h3 className="font-serif text-2xl text-stone-900 mt-0.5">
                  2. Política de Privacidad y Protección de Datos Personales
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-stone-200">
                <div>
                  <strong className="uppercase tracking-wider text-stone-500 block">
                    Responsable del Tratamiento
                  </strong>
                  <p className="mt-1 font-medium text-stone-900">
                    {legal.companyName} ({legal.tradeName}) · {legal.registeredAddress} ·{" "}
                    {legal.privacyEmail}
                  </p>
                </div>
                <div>
                  <strong className="uppercase tracking-wider text-stone-500 block">
                    Finalidad Principal
                  </strong>
                  <p className="mt-1 text-stone-800">
                    Gestionar consultas, pre-pedidos de recogida en tienda, encargos para eventos y
                    solicitudes de reserva en barra enviadas por el usuario hacia nuestro canal
                    oficial de WhatsApp ({contact.whatsappDisplay}).
                  </p>
                </div>
                <div>
                  <strong className="uppercase tracking-wider text-stone-500 block">
                    Legitimación (Base Jurídica)
                  </strong>
                  <p className="mt-1 text-stone-800">
                    Aplicación de medidas precontractuales a petición del interesado (art. 6.1.b
                    RGPD) y consentimiento explícito mediante casilla no premarcada (art. 6.1.a
                    RGPD). Interés legítimo (art. 6.1.f RGPD) en seguridad técnica y prevención de
                    fraude/abuso mediante hash irreversible de IP.
                  </p>
                </div>
                <div>
                  <strong className="uppercase tracking-wider text-stone-500 block">
                    Plazo de Conservación
                  </strong>
                  <p className="mt-1 text-stone-800">
                    Los registros de pre-pedidos se conservan durante un máximo de{" "}
                    <strong>{legal.orderRetentionDays} días</strong> para la atención comercial del
                    encargo, salvo obligación legal aplicable.
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-stone-900 pt-1">
                Principio de Minimización de Datos
              </h4>
              <p>
                En el configurador de pedidos únicamente solicitamos los datos estrictamente
                necesarios para preparar tu selección: artículos y cantidades de la carta, modalidad
                de entrega/reserva y, de forma voluntaria, tu <strong>nombre o alias</strong>,{" "}
                <strong>día/hora estimada</strong> y <strong>notas de alérgenos o preparación</strong>.
                No solicitamos datos bancarios ni tarjetas de crédito en esta web. La dirección IP
                nunca se almacena en texto claro en la base de datos ni en registros de auditoría,
                aplicándose una función hash criptográfica unidireccional truncada (SHA-256).
              </p>

              <h4 className="font-semibold text-stone-900 pt-1">
                Destinatarios y Comunicación por WhatsApp
              </h4>
              <p>
                No cedemos tus datos a terceros con fines comerciales ni publicitarios. Al pulsar el
                botón de envío a WhatsApp, tu dispositivo abre la aplicación o web de{" "}
                <strong>WhatsApp</strong> (operada por WhatsApp Ireland Limited / Meta Platforms)
                para remitir el mensaje directamente al teléfono oficial del establecimiento (
                {contact.whatsappDisplay}).
              </p>

              <h4 className="font-semibold text-stone-900 pt-1">
                Derechos de las Personas Interesadas (ARSULIPO)
              </h4>
              <p>
                Puedes ejercer en cualquier momento tus derechos de{" "}
                <strong>
                  acceso, rectificación, supresión, limitación del tratamiento, portabilidad y
                  oposición
                </strong>{" "}
                escribiendo a{" "}
                <a href={`mailto:${legal.privacyEmail}`} className="underline text-amber-900">
                  {legal.privacyEmail}
                </a>{" "}
                o por correo postal a {legal.registeredAddress}, indicando el derecho que deseas
                ejercer. Asimismo, tienes derecho a presentar una reclamación ante la{" "}
                <strong>Agencia Española de Protección de Datos (AEPD)</strong> en{" "}
                <a
                  href="https://www.aepd.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-amber-900"
                >
                  www.aepd.es
                </a>
                .
              </p>
            </div>
          )}

          {activeTab === "cookies" && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                  Art. 22.2 LSSI-CE · Guía de Cookies AEPD
                </span>
                <h3 className="font-serif text-2xl text-stone-900 mt-0.5">
                  3. Política de Cookies y Almacenamiento Local
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/90 text-emerald-100 text-xs sm:text-sm flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white">
                    Sitio web libre de cookies publicitarias y de rastreo de terceros
                  </strong>
                  <p className="mt-1 text-emerald-100/90">
                    La web pública de {legal.tradeName} utiliza exclusivamente almacenamiento
                    técnico estrictamente necesario para el funcionamiento de la interfaz. No
                    instalamos cookies de perfiles publicitarios, píxeles de redes sociales ni
                    analítica invasiva sin consentimiento, y todas las tipografías se sirven
                    localmente desde nuestro propio servidor.
                  </p>
                </div>
              </div>

              <h4 className="font-semibold text-stone-900 pt-1">
                Inventario Verificado de Cookies y Almacenamiento Técnico
              </h4>
              <div className="overflow-x-auto border border-stone-200 rounded-xl bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-100 text-stone-600 uppercase">
                      <th className="py-2.5 px-3">Nombre</th>
                      <th className="py-2.5 px-3">Tipo / Titular</th>
                      <th className="py-2.5 px-3">Duración</th>
                      <th className="py-2.5 px-3">Finalidad Técnica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        corredera_privacy_notice_v1
                      </td>
                      <td className="py-2.5 px-3">LocalStorage · Propia (Técnica)</td>
                      <td className="py-2.5 px-3">Persistente</td>
                      <td className="py-2.5 px-3">
                        Recuerda que el usuario ha cerrado o leído el aviso informativo de
                        privacidad/cookies para no mostrarlo repetidamente.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-semibold">
                        corredera_admin_session
                      </td>
                      <td className="py-2.5 px-3">Cookie HttpOnly · Propia (Seguridad)</td>
                      <td className="py-2.5 px-3">12 horas</td>
                      <td className="py-2.5 px-3">
                        Se genera exclusivamente cuando el propietario inicia sesión en el panel
                        privado <code>/admin</code> para autenticar sus operaciones.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "condiciones" && (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                  TRLGDCU · Transparencia Precontractual
                </span>
                <h3 className="font-serif text-2xl text-stone-900 mt-0.5">
                  4. Condiciones de Uso, Pre-Pedidos y Reservas por WhatsApp
                </h3>
              </div>

              <ul className="space-y-3 list-disc pl-5">
                <li>
                  <strong>Naturaleza de solicitud / pre-pedido:</strong> La selección de productos
                  en la web genera un resumen detallado con precios verificados de carta y código
                  de referencia (<code>CORR-...</code>) para ser enviado al WhatsApp oficial del
                  establecimiento (<strong>{contact.whatsappDisplay}</strong>).{" "}
                  <strong>
                    Ningún pedido ni reserva queda formalizado ni confirmado hasta que el personal
                    de {legal.tradeName} confirme expresamente la disponibilidad y hora de recogida
                  </strong>
                  .
                </li>
                <li>
                  <strong>Precios e Impuestos:</strong> Todos los precios mostrados en la carta
                  están expresados en Euros (€) e incluyen el IVA legalmente aplicable. En los
                  artículos comercializados al peso (<code>€/kg</code>) o con indicación{" "}
                  <code>Consultar</code>, el importe final se confirmará según el peso exacto o
                  formato elegido antes de su preparación.
                </li>
                <li>
                  <strong>Pago y Recogida:</strong> Esta página web no realiza cobros automáticos
                  con tarjeta ni pasarela de pago online. El abono se realiza en el propio
                  establecimiento ({contact.addressLine}) en el momento de la recogida o mediante
                  el medio acordado directamente con el local para encargos de eventos/catering.
                </li>
                <li>
                  <strong>Información sobre Alérgenos (Reglamento UE 1169/2011):</strong> Dado que
                  trabajamos en un obrador artesanal y charcutería con presencia de gluten, frutos
                  de cáscara, lácteos, huevo, sésamo, soja, sulfitos, pescado y mostaza, el
                  cliente debe indicar cualquier alergia o intolerancia alimentaria antes de
                  confirmar su pedido.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#EFE9DF] px-5 py-3.5 border-t border-stone-300 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 shrink-0">
          <span>
            {legal.companyName} · {contact.addressLine}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#181310] text-amber-100 font-semibold hover:bg-stone-800 transition"
          >
            {lang === "es" ? "Cerrar ventana" : "Close window"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PrivacyNoticeBannerProps {
  lang: Lang;
  onOpenLegalModal: (tab: LegalTabId) => void;
}

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

  const handleAcknowledge = () => {
    try {
      window.localStorage.setItem(PRIVACY_ACK_STORAGE_KEY, "ack");
    } catch {
      // storage disabled
    }
    setDismissed(true);
  };

  return (
    <aside
      aria-label={
        lang === "es" ? "Aviso de privacidad y cookies técnicas" : "Privacy & technical cookies notice"
      }
      className="fixed bottom-20 sm:bottom-24 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-40 bg-[#181310]/95 backdrop-blur-md text-[#F5EFE6] border border-amber-200/25 rounded-2xl p-4 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <Cookie className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs leading-relaxed space-y-2.5">
          <div>
            <strong className="text-white block text-sm font-serif tracking-wide">
              {lang === "es"
                ? "Privacidad y Uso Exclusivo de Cookies Técnicas"
                : "Privacy & Strictly Necessary Technical Storage"}
            </strong>
            <p className="text-stone-300 mt-1">
              {lang === "es"
                ? "Utilizamos únicamente almacenamiento técnico esencial para tu selección de pedido e idioma. No empleamos cookies publicitarias ni rastreadores de terceros."
                : "We only use strictly necessary technical storage for your order selection and language. No advertising cookies or third-party trackers are used."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAcknowledge}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C89D66] hover:bg-[#b88c54] text-[#15110E] font-semibold text-xs transition"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{lang === "es" ? "Entendido" : "Got it"}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenLegalModal("cookies")}
              className="px-3 py-1.5 rounded-lg border border-amber-200/30 text-amber-100 hover:bg-white/10 text-xs transition"
            >
              {lang === "es" ? "Política de Cookies y RGPD" : "Cookies & GDPR Policy"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
