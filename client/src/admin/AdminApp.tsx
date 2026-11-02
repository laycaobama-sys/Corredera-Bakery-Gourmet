import { Toaster } from "@/components/ui/sonner";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  MonitorSmartphone,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import "./admin.css";
import { AnalyticsSection } from "./sections/Analytics";
import { CampaignSection } from "./sections/Campaign";
import { CustomersSection } from "./sections/Customers";
import { DashboardSection } from "./sections/Dashboard";
import { HomepageSection } from "./sections/Homepage";
import { OrdersSection } from "./sections/Orders";
import { PagesContentSection } from "./sections/PagesContent";
import { ProductsSection } from "./sections/Products";
import { SecuritySection } from "./sections/Security";
import { StoreInfoSection } from "./sections/StoreInfo";
import { Button, errorMessage, Loading } from "./ui";

const TOKEN_KEY = "corredera-admin-token";

export const SECTIONS = [
  { id: "", label: "Resumen", icon: LayoutDashboard, group: "Negocio" },
  { id: "pedidos", label: "Pedidos", icon: ShoppingBag, group: "Negocio" },
  { id: "clientes", label: "Clientes", icon: Users, group: "Negocio" },
  { id: "analitica", label: "Analítica web", icon: BarChart3, group: "Negocio" },
  { id: "productos", label: "Productos y precios", icon: Package, group: "Catálogo y web" },
  { id: "portada", label: "Portada y avisos", icon: MonitorSmartphone, group: "Catálogo y web" },
  { id: "contenido", label: "Fotos y textos de la web", icon: ImageIcon, group: "Catálogo y web" },
  { id: "eventos", label: "Eventos y campañas", icon: Megaphone, group: "Catálogo y web" },
  { id: "tienda", label: "Tienda, horarios y envíos", icon: Store, group: "Catálogo y web" },
  { id: "seguridad", label: "Seguridad y actividad", icon: ShieldCheck, group: "Cuenta" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

function storeToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

function LoginScreen({ onSuccess, notConfigured }: { onSuccess: () => void; notConfigured: boolean }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = trpc.admin.loginWithToken.useMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login.mutateAsync({ token: password, actorName: "Propietario Corredera" });
      storeToken(res.sessionToken);
      setPassword("");
      onSuccess();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="adm-login">
      <div className="adm-login__art" aria-hidden="true">
        <img src="/assets/home/hero-jamon.jpg" alt="" />
        <div className="adm-login__quote">
          <img src="/assets/brand/corredera-logo-light.png" alt="" />
          <p>Panel de gestión</p>
        </div>
      </div>
      <div className="adm-login__panel">
        <form className="adm-login__form" onSubmit={submit}>
          <img src="/assets/brand/corredera-lockup.png" alt="Corredera Gourmet" className="adm-login__logo" />
          <h1>Acceso del propietario</h1>
          <p className="adm-login__sub">Área privada. Introduce tu contraseña para gestionar la tienda.</p>
          {notConfigured ? (
            <div className="adm-alert adm-alert--warning">
              El acceso aún no está configurado. En el servidor ejecuta <code>pnpm admin:password</code> para crear la contraseña del propietario.
            </div>
          ) : (
            <>
              <label className="adm-field">
                <span className="adm-field__label">Contraseña</span>
                <span className="adm-password">
                  <Lock size={16} />
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                    required
                  />
                  <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              {error && <div className="adm-alert adm-alert--danger">{error}</div>}
              <Button type="submit" variant="primary" loading={login.isPending} className="adm-btn--block">
                Entrar al panel
              </Button>
            </>
          )}
          <p className="adm-login__foot">
            <ShieldCheck size={14} /> Conexión protegida · bloqueo automático tras 5 intentos fallidos
          </p>
        </form>
      </div>
    </div>
  );
}

/** The panel's notifications live here so the public shop never loads them. */
export default function AdminApp({ section = "" }: { section?: string }) {
  return (
    <>
      <AdminPanel section={section} />
      <Toaster />
    </>
  );
}

/** Two-note chime made in the browser (no audio file to download). */
function playChime() {
  try {
    const ctx = new AudioContext();
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });
    window.setTimeout(() => void ctx.close(), 1500);
  } catch {
    // audio unavailable
  }
}

/** While the panel is open: chime, notice and tab title when a new order arrives, so it never goes unseen. */
function useNewOrderAlert(pending: number | undefined) {
  const previous = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (pending === undefined) return;
    const before = previous.current;
    previous.current = pending;
    document.title = pending > 0 ? `(${pending}) Pedidos pendientes · Corredera` : "Panel de gestión · Corredera Gourmet";
    if (before !== undefined && pending > before) {
      playChime();
      toast.success(pending - before === 1 ? "Nuevo pedido recibido" : `${pending - before} pedidos nuevos`, {
        description: "Confírmalo por WhatsApp desde Pedidos.",
        duration: 10_000,
      });
    }
  }, [pending]);
}

function AdminPanel({ section }: { section: string }) {
  const utils = trpc.useUtils();
  const auth = trpc.admin.authStatus.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const logout = trpc.admin.logoutAdmin.useMutation();
  const [, navigate] = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const isAdmin = Boolean(auth.data?.isAdmin);
  const dash = trpc.admin.getAnalyticsDashboard.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000 });
  useNewOrderAlert(dash.data?.totals.pendingOrdersCount);

  useEffect(() => {
    document.title = "Panel de gestión · Corredera Gourmet";
    const robots = document.querySelector('meta[name="robots"]');
    const prev = robots?.getAttribute("content");
    robots?.setAttribute("content", "noindex, nofollow");
    return () => {
      if (prev) robots?.setAttribute("content", prev);
    };
  }, []);

  useEffect(() => setNavOpen(false), [section]);

  if (auth.isLoading) return <div className="adm adm-center"><Loading label="Comprobando acceso…" /></div>;

  if (!isAdmin) {
    return (
      <div className="adm">
        <LoginScreen
          notConfigured={!auth.data?.authConfig.readyForAdminLogin}
          onSuccess={() => {
            void utils.admin.invalidate();
          }}
        />
      </div>
    );
  }

  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];
  const pending = dash.data?.totals.pendingOrdersCount ?? 0;

  const doLogout = async () => {
    await logout.mutateAsync().catch(() => undefined);
    storeToken(null);
    await utils.admin.invalidate();
    navigate("/admin");
  };

  const groups = [...new Set(SECTIONS.map((s) => s.group))];

  return (
    <div className="adm adm-shell">
      <aside className={`adm-sidebar${navOpen ? " is-open" : ""}`}>
        <div className="adm-sidebar__brand">
          <img src="/assets/brand/corredera-lockup-light.png" alt="Corredera Gourmet" />
          <button type="button" className="adm-icon-btn adm-sidebar__close" onClick={() => setNavOpen(false)} aria-label="Cerrar menú">
            <X size={18} />
          </button>
        </div>
        <nav className="adm-nav" aria-label="Secciones del panel">
          {groups.map((g) => (
            <div key={g} className="adm-nav__group">
              <p className="adm-nav__label">{g}</p>
              {SECTIONS.filter((s) => s.group === g).map(({ id, label, icon: Icon }) => (
                <Link key={id} href={id ? `/admin/${id}` : "/admin"} className={`adm-nav__item${current.id === id ? " is-active" : ""}`}>
                  <Icon size={18} strokeWidth={1.75} />
                  <span>{label}</span>
                  {id === "pedidos" && pending > 0 && <span className="adm-nav__count">{pending}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-sidebar__foot">
          <a href="/" target="_blank" rel="noreferrer" className="adm-nav__item">
            <ExternalLink size={18} strokeWidth={1.75} />
            <span>Ver la web</span>
          </a>
          <button type="button" className="adm-nav__item" onClick={() => void doLogout()}>
            <LogOut size={18} strokeWidth={1.75} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      {navOpen && <div className="adm-overlay adm-overlay--nav" onClick={() => setNavOpen(false)} />}

      <div className="adm-main">
        <header className="adm-topbar">
          <button type="button" className="adm-icon-btn adm-topbar__menu" onClick={() => setNavOpen(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <div className="adm-topbar__crumb">
            <span>Panel</span> / <strong>{current.label}</strong>
          </div>
          <div className="adm-topbar__right">
            {pending > 0 && (
              <Link href="/admin/pedidos" className="adm-topbar__alert">
                {pending} {pending === 1 ? "pedido pendiente" : "pedidos pendientes"}
              </Link>
            )}
            <div className="adm-topbar__user">
              <span className="adm-avatar">P</span>
              <span>
                <strong>{auth.data?.user?.name ?? "Propietario"}</strong>
                <small>Administrador</small>
              </span>
            </div>
          </div>
        </header>
        <main className="adm-content">
          {current.id === "" && <DashboardSection />}
          {current.id === "pedidos" && <OrdersSection />}
          {current.id === "clientes" && <CustomersSection />}
          {current.id === "analitica" && <AnalyticsSection />}
          {current.id === "productos" && <ProductsSection />}
          {current.id === "portada" && <HomepageSection />}
          {current.id === "contenido" && <PagesContentSection />}
          {current.id === "eventos" && <CampaignSection />}
          {current.id === "tienda" && <StoreInfoSection />}
          {current.id === "seguridad" && <SecuritySection onPasswordChanged={(t) => storeToken(t)} />}
        </main>
      </div>
    </div>
  );
}
