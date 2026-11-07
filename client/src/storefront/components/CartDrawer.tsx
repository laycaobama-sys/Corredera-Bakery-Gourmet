import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { CheckCircle2, MessageCircle, ShoppingBag, Trash2, X } from "lucide-react";
import { useCallback, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { productPath } from "../../../../shared/productUrls";
import {
  buildWhatsAppOrderMessage,
  canOrderOnline,
  formatEuros,
  type OrderModality,
} from "../../../../shared/catalog";
import { cartTotals, isVariablePrice } from "../cart";
import { itemName, isWholeHam, priceParts } from "../data";
import { useEscape, useScrollLock, useT } from "../hooks";
import { useStore } from "../StoreContext";
import { ProductImage, QtyStepper } from "./ProductCard";

type Sent = { code: string | null; url: string };

export function CartDrawer() {
  const {
    lang,
    cartOpen,
    setCartOpen,
    cartLines,
    setQty,
    removeFromCart,
    clearCart,
    hamPref,
    setHamPref,
    settings,
    openLegal,
    track,
    whatsappHref,
  } = useStore();
  const t = useT();
  const close = useCallback(() => setCartOpen(false), [setCartOpen]);
  useScrollLock(cartOpen);
  useEscape(cartOpen, close);

  const deliveryEnabled = settings.contact.homeDeliveryEnabled !== false;
  const ordersEnabled = settings.contact.whatsappOrdersEnabled !== false;
  const [modality, setModality] = useState<Extract<OrderModality, "pickup" | "delivery">>("pickup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const prepare = trpc.order.validateAndPrepareOrder.useMutation();

  const orderable = cartLines.filter((l) => canOrderOnline(l.item));
  const { fixed, hasVariable, count } = cartTotals(orderable);
  const hasHam = orderable.some((l) => isWholeHam(l.item));
  const effectiveModality = deliveryEnabled ? modality : "pickup";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError(t("Indica tu nombre y un teléfono de contacto.", "Please add your name and a contact phone."));
      return;
    }
    if (effectiveModality === "delivery" && !address.trim()) {
      setError(t("Indica la dirección de entrega.", "Please add the delivery address."));
      return;
    }
    if (!privacy) {
      setError(t("Debes aceptar la política de privacidad.", "Please accept the privacy policy."));
      return;
    }

    // Open the tab synchronously so pop-up blockers allow it; it is pointed at WhatsApp once the order is validated.
    const popup = window.open("", "_blank");
    const payload = {
      items: orderable.map((l) => ({ id: l.item.id, qty: l.qty })),
      modality: effectiveModality,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      deliveryAddress: effectiveModality === "delivery" ? address.trim() : "",
      hamCuttingPreference: hasHam ? hamPref : undefined,
      desiredTime: date.trim(),
      notes: notes.trim(),
      privacyAccepted: true,
      lang,
    } as const;

    let url: string;
    let code: string | null = null;
    try {
      const res = await prepare.mutateAsync(payload);
      url = res.whatsappUrl;
      code = res.orderCode;
      track("order_validated");
    } catch (err) {
      const isServerRejection = err instanceof TRPCClientError && Boolean(err.data?.code);
      if (isServerRejection) {
        popup?.close();
        setError(err.message);
        return;
      }
      // API unreachable (static hosting): build the same message locally.
      url = whatsappHref(
        buildWhatsAppOrderMessage({
          items: orderable,
          modality: effectiveModality,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          deliveryAddress: payload.deliveryAddress,
          hamCuttingPreference: payload.hamCuttingPreference,
          desiredTime: payload.desiredTime,
          notes: payload.notes,
          lang,
        }),
      );
    }
    track("whatsapp_click");
    if (popup && !popup.closed) popup.location.href = url;
    else window.location.href = url;
    setSent({ code, url });
  };

  const finish = () => {
    clearCart();
    setSent(null);
    setPrivacy(false);
    setNotes("");
    close();
  };

  return (
    <div className={`cg-drawer-root${cartOpen ? " is-open" : ""}`} aria-hidden={!cartOpen}>
      <div className="cg-overlay" onClick={close} />
      <aside className="cg-drawer cg-drawer--right cg-cart" role="dialog" aria-modal="true" aria-label={t("Tu pedido", "Your order")} inert={!cartOpen}>
        <div className="cg-drawer__head">
          <h2 className="cg-cart__title">
            {t("Tu pedido", "Your order")} {count > 0 && <span>({count})</span>}
          </h2>
          <button type="button" className="cg-icon-btn" onClick={close} aria-label={t("Cerrar", "Close")}>
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {sent ? (
          <div className="cg-cart__done">
            <CheckCircle2 size={44} strokeWidth={1.25} aria-hidden="true" />
            <h3>{t("¡Solicitud preparada!", "Request ready!")}</h3>
            {sent.code && (
              <p className="cg-cart__code">
                {t("Referencia", "Reference")}: <strong>{sent.code}</strong>
              </p>
            )}
            <p>
              {t(
                "Hemos abierto WhatsApp con el detalle de tu pedido. Envía el mensaje y te confirmaremos disponibilidad, peso exacto e importe final.",
                "We opened WhatsApp with your order details. Send the message and we will confirm availability, exact weight and final amount.",
              )}
            </p>
            <a className="cg-btn cg-btn--wa" href={sent.url} target="_blank" rel="noreferrer">
              <MessageCircle size={18} aria-hidden="true" /> {t("Abrir WhatsApp de nuevo", "Open WhatsApp again")}
            </a>
            <button type="button" className="cg-btn cg-btn--ghost" onClick={finish}>
              {t("Finalizar y vaciar pedido", "Finish and clear order")}
            </button>
          </div>
        ) : cartLines.length === 0 ? (
          <div className="cg-cart__empty">
            <ShoppingBag size={40} strokeWidth={1} aria-hidden="true" />
            <p>{t("Tu pedido está vacío.", "Your order is empty.")}</p>
            <Link href="/tienda" className="cg-btn cg-btn--primary" onClick={close}>
              {t("Descubrir la tienda", "Explore the shop")}
            </Link>
          </div>
        ) : (
          <form className="cg-cart__form" onSubmit={submit} noValidate>
            <ul className="cg-cart__lines">
              {cartLines.map(({ item, qty }) => {
                const { amount, unit } = priceParts(item, lang);
                return (
                  <li key={item.id} className="cg-cart__line">
                    <Link href={productPath(item.id)} className="cg-cart__thumb" onClick={close}>
                      <ProductImage item={item} />
                    </Link>
                    <div className="cg-cart__info">
                      <p className="cg-cart__name">{itemName(item, lang)}</p>
                      <p className="cg-cart__price">
                        {amount} {unit && <small>{unit}</small>}
                      </p>
                      {!canOrderOnline(item) && (
                        <p className="cg-cart__warn">{t("Solo consumo en local: no se incluirá en el encargo.", "In-store only: not included in the order.")}</p>
                      )}
                      <div className="cg-cart__row">
                        <QtyStepper value={qty} onChange={(v) => setQty(item.id, v)} label={t("Cantidad", "Quantity")} />
                        <button type="button" className="cg-cart__remove" onClick={() => removeFromCart(item.id)} aria-label={t(`Quitar ${itemName(item, lang)}`, `Remove ${itemName(item, lang)}`)}>
                          <Trash2 size={16} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {hasHam && (
              <fieldset className="cg-fieldset">
                <legend>{t("Tu jamón entero", "Your whole ham")}</legend>
                <label className="cg-choice">
                  <input type="radio" name="ham" checked={hamPref === "free_sliced_vacuum"} onChange={() => setHamPref("free_sliced_vacuum")} />
                  <span>
                    <strong>{t("Cortado a cuchillo y envasado al vacío", "Hand-carved and vacuum packed")}</strong>
                    <small>{t("Servicio gratuito", "Complimentary service")}</small>
                  </span>
                </label>
                <label className="cg-choice">
                  <input type="radio" name="ham" checked={hamPref === "whole_piece"} onChange={() => setHamPref("whole_piece")} />
                  <span>
                    <strong>{t("Pieza entera sin empezar", "Whole uncut piece")}</strong>
                  </span>
                </label>
              </fieldset>
            )}

            <fieldset className="cg-fieldset">
              <legend>{t("Entrega", "Delivery")}</legend>
              <div className="cg-segment">
                <button type="button" aria-pressed={effectiveModality === "pickup"} onClick={() => setModality("pickup")}>
                  {t("Recogida en tienda", "Store pickup")}
                </button>
                <button
                  type="button"
                  aria-pressed={effectiveModality === "delivery"}
                  onClick={() => setModality("delivery")}
                  disabled={!deliveryEnabled}
                >
                  {t("Envío a domicilio", "Home delivery")}
                </button>
              </div>
              <p className="cg-help">
                {effectiveModality === "delivery"
                  ? lang === "en"
                    ? settings.contact.shippingNoticeEn
                    : settings.contact.shippingNoticeEs
                  : settings.contact.addressLine}
              </p>
            </fieldset>

            <fieldset className="cg-fieldset">
              <legend>{t("Tus datos", "Your details")}</legend>
              <div className="cg-field">
                <label htmlFor="cg-name">{t("Nombre", "Name")} *</label>
                <input id="cg-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
              </div>
              <div className="cg-field">
                <label htmlFor="cg-phone">{t("Teléfono", "Phone")} *</label>
                <input id="cg-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={60} required />
              </div>
              {effectiveModality === "delivery" && (
                <div className="cg-field">
                  <label htmlFor="cg-address">{t("Dirección de entrega", "Delivery address")} *</label>
                  <input id="cg-address" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={220} required />
                </div>
              )}
              <div className="cg-field">
                <label htmlFor="cg-date">{t("Fecha y hora deseadas", "Preferred date & time")}</label>
                <input id="cg-date" value={date} onChange={(e) => setDate(e.target.value)} maxLength={100} placeholder={t("Ej. viernes por la tarde", "e.g. Friday afternoon")} />
              </div>
              <div className="cg-field">
                <label htmlFor="cg-notes">{t("Notas", "Notes")}</label>
                <textarea id="cg-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
              </div>
            </fieldset>

            <div className="cg-cart__summary">
              <div className="cg-cart__total">
                <span>{t("Subtotal", "Subtotal")}</span>
                <strong>{fixed > 0 ? formatEuros(fixed, lang) : "—"}</strong>
              </div>
              {hasVariable && (
                <p className="cg-help">
                  {t(
                    "Incluye artículos al peso: el importe final se confirma tras el corte.",
                    "Includes items sold by weight: final amount confirmed after cutting.",
                  )}
                </p>
              )}
              <p className="cg-help">{t("Precios con IVA incluido. Sin pago online: confirmamos y cobramos en tienda o a la entrega.", "VAT included. No online payment: we confirm and charge in store or on delivery.")}</p>
              <label className="cg-check">
                <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
                <span>
                  {t("He leído y acepto la ", "I have read and accept the ")}
                  <button type="button" className="cg-inline-link" onClick={() => openLegal("privacidad")}>
                    {t("política de privacidad", "privacy policy")}
                  </button>
                  {t(" y las ", " and the ")}
                  <button type="button" className="cg-inline-link" onClick={() => openLegal("condiciones")}>
                    {t("condiciones de encargo", "order terms")}
                  </button>
                  .
                </span>
              </label>
              {!ordersEnabled && (
                <p className="cg-alert">
                  {(lang === "en" ? settings.contact.pauseOrdersNoticeEn : settings.contact.pauseOrdersNoticeEs) ||
                    t("Los encargos online están pausados temporalmente.", "Online orders are temporarily paused.")}
                </p>
              )}
              {error && (
                <p className="cg-alert" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="cg-btn cg-btn--wa cg-btn--block" disabled={!ordersEnabled || prepare.isPending || orderable.length === 0}>
                <MessageCircle size={18} aria-hidden="true" />
                {prepare.isPending ? t("Preparando…", "Preparing…") : t("Enviar pedido por WhatsApp", "Send order via WhatsApp")}
              </button>
              {orderable.some((l) => isVariablePrice(l.item)) && (
                <p className="cg-help cg-help--center">{t("Te confirmaremos el peso exacto antes de preparar tu pedido.", "We will confirm the exact weight before preparing your order.")}</p>
              )}
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
