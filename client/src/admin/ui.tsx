import { trpc } from "@/lib/trpc";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ formatting */

export const eur = (cents: number) =>
  (cents / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export const num = (n: number) => n.toLocaleString("es-ES");

export function fmtDate(iso: string, withTime = true) {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function fmtDuration(seconds: number | null) {
  if (seconds === null) return "—";
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s.toString().padStart(2, "0")} s`;
}

export function errorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) {
    const raw = String((err as { message: string }).message);
    // zod errors arrive as a JSON array of issues
    try {
      const issues = JSON.parse(raw) as { message: string; path?: (string | number)[] }[];
      if (Array.isArray(issues) && issues[0]?.message) return issues.map((i) => i.message).join(" · ");
    } catch {
      /* plain message */
    }
    return raw;
  }
  return "Ha ocurrido un error inesperado.";
}

/* ------------------------------------------------------------------ layout */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="adm-page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="adm-page-head__actions">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
  pad = true,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={`adm-card ${className}`}>
      {(title || actions) && (
        <div className="adm-card__head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={pad ? "adm-card__body" : ""}>{children}</div>
    </section>
  );
}

export function Kpi({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  return (
    <div className={`adm-kpi adm-kpi--${tone}`}>
      <div className="adm-kpi__top">
        <span className="adm-kpi__label">{label}</span>
        {icon && <span className="adm-kpi__icon">{icon}</span>}
      </div>
      <div className="adm-kpi__value">{value}</div>
      {hint && <div className="adm-kpi__hint">{hint}</div>}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="adm-empty">
      {icon}
      <p className="adm-empty__title">{title}</p>
      {text && <p className="adm-empty__text">{text}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="adm-loading">
      <Loader2 className="adm-spin" size={20} /> {label}
    </div>
  );
}

/* ------------------------------------------------------------------ controls */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
  loading?: boolean;
  icon?: ReactNode;
};

export function Button({ variant = "secondary", size = "md", loading, icon, children, className = "", disabled, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      className={`adm-btn adm-btn--${variant} adm-btn--${size} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="adm-spin" size={16} /> : icon}
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  span = 1,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  span?: 1 | 2;
}) {
  return (
    <label className={`adm-field${span === 2 ? " adm-field--wide" : ""}`}>
      <span className="adm-field__label">{label}</span>
      {children}
      {hint && <span className="adm-field__hint">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`adm-input ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`adm-input adm-textarea ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`adm-input adm-select ${props.className ?? ""}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="adm-toggle" onClick={() => onChange(!checked)}>
      <span className="adm-toggle__track">
        <span className="adm-toggle__thumb" />
      </span>
      <span className="adm-toggle__text">
        <span className="adm-toggle__label">{label}</span>
        {description && <span className="adm-toggle__desc">{description}</span>}
      </span>
    </button>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent" | "violet"; children: ReactNode }) {
  return <span className={`adm-badge adm-badge--${tone}`}>{children}</span>;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="adm-segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ overlays */

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="adm-drawer-root">
      <div className="adm-overlay" onClick={onClose} />
      <aside className="adm-drawer" style={{ width: `min(${width}px, 100vw)` }} role="dialog" aria-modal="true">
        <div className="adm-drawer__head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="adm-drawer__body">{children}</div>
        {footer && <div className="adm-drawer__foot">{footer}</div>}
      </aside>
    </div>
  );
}

export function Confirm({
  open,
  title,
  text,
  confirmLabel = "Confirmar",
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="adm-modal-root">
      <div className="adm-overlay" onClick={onCancel} />
      <div className="adm-modal" role="alertdialog" aria-modal="true">
        <h2>{title}</h2>
        <div className="adm-modal__text">{text}</div>
        <div className="adm-modal__actions">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ image upload */

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"] as const;
const ACCEPTED_VIDEO = ["video/mp4", "video/webm"] as const;
type MediaMime = (typeof ACCEPTED)[number] | (typeof ACCEPTED_VIDEO)[number];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Image (or video) picker with drag & drop that uploads to the server and returns the public URL. */
export function ImageUpload({
  value,
  onChange,
  aspect = "5 / 4",
  label = "Imagen",
  kind = "image",
  onClear,
}: {
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
  label?: string;
  kind?: "image" | "video";
  onClear?: () => void;
}) {
  const upload = trpc.admin.uploadProductImage.useMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const accepted: readonly string[] = kind === "video" ? ACCEPTED_VIDEO : ACCEPTED;
  const maxBytes = kind === "video" ? 15 * 1024 * 1024 : 5 * 1024 * 1024;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!accepted.includes(file.type)) {
      toast.error(kind === "video" ? "Formato no válido. Usa MP4 o WebM." : "Formato no válido. Usa JPG, PNG o WebP.");
      return;
    }
    if (file.size > maxBytes) {
      toast.error(kind === "video" ? "El vídeo supera 15 MB. Usa uno más corto o comprimido." : "La imagen supera 5 MB. Redúcela antes de subirla.");
      return;
    }
    try {
      const base64Data = await readAsDataUrl(file);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || (kind === "video" ? "video.mp4" : "imagen.jpg");
      const res = await upload.mutateAsync({
        fileName: safeName,
        mimeType: file.type as MediaMime,
        base64Data,
      });
      onChange(res.imageUrl);
      toast.success(kind === "video" ? "Vídeo subido" : "Imagen subida");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="adm-upload">
      <span className="adm-field__label">{label}</span>
      <div
        className={`adm-upload__drop${drag ? " is-drag" : ""}`}
        style={{ aspectRatio: aspect }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      >
        {value ? (
          kind === "video" ? <video src={value} muted loop autoPlay playsInline /> : <img src={value} alt="" />
        ) : (
          <span className="adm-upload__placeholder">
            <ImagePlus size={28} strokeWidth={1.25} />
            {kind === "video" ? "Arrastra un vídeo MP4 o haz clic" : "Arrastra una foto o haz clic"}
          </span>
        )}
        {upload.isPending && (
          <span className="adm-upload__busy">
            <Loader2 className="adm-spin" size={22} />
          </span>
        )}
      </div>
      <div className="adm-upload__actions">
        <Button size="sm" icon={<Upload size={14} />} onClick={() => inputRef.current?.click()} loading={upload.isPending}>
          {value ? (kind === "video" ? "Cambiar vídeo" : "Cambiar foto") : kind === "video" ? "Subir vídeo" : "Subir foto"}
        </Button>
        {value && onClear && (
          <Button size="sm" variant="ghost" onClick={onClear}>
            Quitar
          </Button>
        )}
        <span className="adm-field__hint">{kind === "video" ? "MP4 o WebM · máx. 15 MB" : "JPG, PNG o WebP · máx. 5 MB"}</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accepted.join(",")}
        hidden
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Sticky publish bar shown while a settings page has unsaved edits. */
export function SaveBar({ dirty, saving, onSave, onDiscard }: { dirty: boolean; saving: boolean; onSave: () => void; onDiscard: () => void }) {
  if (!dirty) return null;
  return (
    <div className="adm-savebar" role="region" aria-label="Cambios sin publicar">
      <span className="adm-savebar__dot" />
      <span>Tienes cambios sin publicar</span>
      <div className="adm-spacer" />
      <Button variant="ghost" onClick={onDiscard} disabled={saving}>
        Descartar
      </Button>
      <Button variant="primary" onClick={onSave} loading={saving}>
        Publicar cambios
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ csv */

export function downloadCsv(fileName: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
