import { trpc } from "@/lib/trpc";
import { ChevronDown, Eye, EyeOff, Package, Plus, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { categories, productBrand, type MenuItem, type Mode } from "../../../../shared/catalog";
import {
  VALID_BAKERY_CATEGORIES,
  VALID_GOURMET_CATEGORIES,
  type ManagedCatalogProduct,
} from "../../../../shared/catalogAdminSchema";
import { buildProductDataUri } from "../../../../shared/productVisuals";
import { PRODUCT_PHOTO_VERSION } from "../../storefront/data";
import {
  Badge,
  Button,
  Card,
  Confirm,
  Drawer,
  Empty,
  errorMessage,
  Field,
  ImageUpload,
  Input,
  Loading,
  PageHeader,
  Segmented,
  Select,
  Textarea,
  Toggle,
} from "../ui";

const EXTRA_LABELS: Record<string, string> = {
  jamones_enteros: "Jamones enteros",
  sobres_jamon: "Jamón loncheado 100 g",
  embutidos: "Embutidos al corte",
  sobres_embutidos: "Embutidos loncheados 100 g",
  ibericos: "Ibéricos",
  carniceria: "Carnicería",
  fruteria: "Frutería",
  conservas: "Conservas y aperitivo",
  vinos: "Vinos y bebidas",
  raciones: "Raciones (barra)",
  tablas: "Tablas (barra)",
  bocadillos: "Bocadillos y tostas",
};

export function categoryName(mode: Mode, id: string) {
  if (mode === "gourmet" && EXTRA_LABELS[id]) return EXTRA_LABELS[id];
  return categories[mode].find((c) => c.id === id)?.es ?? EXTRA_LABELS[id] ?? id;
}

const categoriesFor = (mode: Mode) => [...(mode === "gourmet" ? VALID_GOURMET_CATEGORIES : VALID_BAKERY_CATEGORIES)];

const ICON_BY_CATEGORY: Record<string, MenuItem["icon"]> = {
  jamones_enteros: "ham",
  sobres_jamon: "ham",
  embutidos: "ham",
  sobres_embutidos: "ham",
  ibericos: "ham",
  carniceria: "ham",
  quesos: "cheese",
  vinos: "wine",
  cafeteria: "coffee",
  desayunos: "coffee",
  tartas: "cake",
  bolleria: "cake",
  packs: "cake",
  bocadillos: "sandwich",
};

type Unit = "€" | "€ / kg" | "€ / unidad" | "Consultar";

function parsePrice(price: string): { amount: string; unit: Unit } {
  if (price === "Consultar") return { amount: "", unit: "Consultar" };
  const m = price.match(/^\+?(\d+(?:[.,]\d{1,2})?)\s*€(?:\s*\/\s*(kg|unidad))?/);
  if (!m) return { amount: "", unit: "€" };
  return { amount: m[1].replace(".", ","), unit: m[2] === "kg" ? "€ / kg" : m[2] === "unidad" ? "€ / unidad" : "€" };
}

function buildPrice(amount: string, unit: Unit): string | null {
  if (unit === "Consultar") return "Consultar";
  const n = Number(amount.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const fixed = n.toFixed(2).replace(".", ",");
  return unit === "€" ? `${fixed} €` : `${fixed} ${unit}`;
}

function slugId(name: string) {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "producto"}-${Math.random().toString(36).slice(2, 6)}`;
}

type Draft = {
  isNew: boolean;
  id: string;
  mode: Mode;
  category: string;
  name: string;
  desc: string;
  amount: string;
  unit: Unit;
  badge: string;
  unitInfo: string;
  weightInfo: string;
  refPricePerKg: string;
  nameEn: string;
  descEn: string;
  badgeEn: string;
  unitInfoEn: string;
  weightInfoEn: string;
  imageUrl: string;
  hoverImageUrl: string;
  brand: string;
  active: boolean;
  featured: boolean;
  freeCuttingService: boolean;
  subGroup?: "por_kilo" | "por_unidad";
};

function toDraft(p: ManagedCatalogProduct): Draft {
  const { amount, unit } = parsePrice(p.price);
  return {
    isNew: false,
    id: p.id,
    mode: p.mode,
    category: p.category,
    name: p.name,
    desc: p.desc,
    amount,
    unit,
    badge: p.badge ?? "",
    unitInfo: p.unitInfo ?? "",
    weightInfo: p.weightInfo ?? "",
    refPricePerKg: p.refPricePerKg ?? "",
    nameEn: p.nameEn ?? "",
    descEn: p.descEn ?? "",
    badgeEn: p.badgeEn ?? "",
    unitInfoEn: p.unitInfoEn ?? "",
    weightInfoEn: p.weightInfoEn ?? "",
    imageUrl: p.imageUrl,
    hoverImageUrl: p.hoverImageUrl ?? "",
    brand: p.brand ?? "",
    active: p.active,
    featured: Boolean(p.featured),
    freeCuttingService: Boolean(p.freeCuttingService),
    subGroup: p.subGroup,
  };
}

function newDraft(mode: Mode): Draft {
  return {
    isNew: true,
    id: "",
    mode,
    category: mode === "gourmet" ? "jamones_enteros" : "bolleria",
    name: "",
    desc: "",
    amount: "",
    unit: "€",
    badge: "",
    unitInfo: "",
    weightInfo: "",
    refPricePerKg: "",
    nameEn: "",
    descEn: "",
    badgeEn: "",
    unitInfoEn: "",
    weightInfoEn: "",
    imageUrl: "",
    hoverImageUrl: "",
    brand: "",
    active: true,
    featured: false,
    freeCuttingService: false,
  };
}

function productThumb(p: { imageUrl?: string } & Pick<MenuItem, "id" | "mode" | "category" | "name" | "nameEn" | "price">) {
  if (!p.imageUrl) return buildProductDataUri(p);
  return p.imageUrl.startsWith("/assets/products/") ? `${p.imageUrl}?v=${PRODUCT_PHOTO_VERSION}` : p.imageUrl;
}

type ModeFilter = "gourmet" | "bakery" | "all";

export function ProductsSection() {
  const utils = trpc.useUtils();
  const q = trpc.admin.listAllProducts.useQuery();
  const toggle = trpc.admin.toggleProductActive.useMutation();
  const update = trpc.admin.updateProduct.useMutation();
  const [mode, setMode] = useState<ModeFilter>(() => (new URLSearchParams(window.location.search).get("filtro") ? "all" : "gourmet"));
  const [cat, setCat] = useState("all");
  // The summary links here with ?filtro=consultar or ?filtro=ocultos.
  const [status, setStatus] = useState<"all" | "active" | "hidden" | "ask">(() => {
    const f = new URLSearchParams(window.location.search).get("filtro");
    return f === "consultar" ? "ask" : f === "ocultos" ? "hidden" : "all";
  });
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const products = q.data ?? [];
  useEffect(() => setCat("all"), [mode]);

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return products.filter((p) => {
      if (mode !== "all" && p.mode !== mode) return false;
      if (cat !== "all" && p.category !== cat) return false;
      if (status === "active" && !p.active) return false;
      if (status === "hidden" && p.active) return false;
      if (status === "ask" && p.price !== "Consultar") return false;
      if (s && !`${p.name} ${p.desc} ${p.id}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [products, mode, cat, status, search]);

  const catOptions = useMemo(() => {
    const set = new Set(products.filter((p) => mode === "all" || p.mode === mode).map((p) => `${p.mode}:${p.category}`));
    return [...set].map((k) => {
      const [m, c] = k.split(":");
      return { value: c, label: categoryName(m as Mode, c) };
    }).filter((v, i, a) => a.findIndex((x) => x.value === v.value) === i);
  }, [products, mode]);

  const refresh = () => Promise.all([utils.admin.listAllProducts.invalidate(), utils.catalog.listPublic.invalidate()]);

  const quickToggle = async (p: ManagedCatalogProduct) => {
    try {
      await toggle.mutateAsync({ id: p.id, active: !p.active });
      toast.success(p.active ? "Producto oculto en la web" : "Producto visible en la web");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const quickFeature = async (p: ManagedCatalogProduct) => {
    try {
      const { updatedAt: _u, updatedBy: _b, sortOrder: _s, ...rest } = p;
      await update.mutateAsync({ ...rest, badge: rest.badge ?? "", badgeEn: rest.badgeEn ?? "", featured: !p.featured });
      toast.success(p.featured ? "Quitado de «Más vendidos»" : "Añadido a «Más vendidos»");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const counts = {
    total: products.length,
    active: products.filter((p) => p.active).length,
    featured: products.filter((p) => p.featured && p.active).length,
  };

  return (
    <>
      <PageHeader
        title="Productos y precios"
        subtitle={`${counts.total} productos · ${counts.active} visibles en la web · ${counts.featured} en «Más vendidos»`}
        actions={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setDraft(newDraft(mode === "bakery" ? "bakery" : "gourmet"))}>
            Nuevo producto
          </Button>
        }
      />

      <Card pad={false}>
        <div className="adm-toolbar adm-toolbar--wrap">
          <Segmented<ModeFilter>
            value={mode}
            onChange={setMode}
            options={[
              { value: "gourmet", label: "Tienda gourmet" },
              { value: "bakery", label: "Carta Bakery & Café" },
              { value: "all", label: "Todo" },
            ]}
          />
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="adm-select--auto">
            <option value="all">Todas las categorías</option>
            {catOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="adm-select--auto">
            <option value="all">Visibles y ocultos</option>
            <option value="active">Solo visibles</option>
            <option value="hidden">Solo ocultos</option>
            <option value="ask">Precio «Consultar»</option>
          </Select>
          <label className="adm-search adm-search--grow">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto…" />
          </label>
        </div>

        {q.isLoading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <Empty icon={<Package size={30} strokeWidth={1.25} />} title="No hay productos con estos filtros" />
        ) : (
          <div className="adm-products">
            {visible.map((p) => (
              <article key={p.id} className={`adm-product${p.active ? "" : " is-hidden"}`}>
                <button type="button" className="adm-product__media" onClick={() => setDraft(toDraft(p))}>
                  <img src={productThumb(p)} alt="" loading="lazy" onError={(e) => (e.currentTarget.src = buildProductDataUri(p))} />
                  {!p.active && <span className="adm-product__flag">Oculto</span>}
                </button>
                <div className="adm-product__body">
                  <button type="button" className="adm-product__name" onClick={() => setDraft(toDraft(p))}>
                    {p.name}
                  </button>
                  <span className="adm-product__cat">{categoryName(p.mode, p.category)}</span>
                  <div className="adm-product__foot">
                    <strong>{p.price}</strong>
                    <span className="adm-product__actions">
                      <button type="button" className={`adm-icon-btn${p.featured ? " is-on" : ""}`} title={p.featured ? "Quitar de Más vendidos" : "Destacar en Más vendidos"} onClick={() => void quickFeature(p)}>
                        <Star size={16} fill={p.featured ? "currentColor" : "none"} />
                      </button>
                      <button type="button" className="adm-icon-btn" title={p.active ? "Ocultar en la web" : "Mostrar en la web"} onClick={() => void quickToggle(p)}>
                        {p.active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {draft && <ProductEditor draft={draft} onClose={() => setDraft(null)} onSaved={refresh} />}
    </>
  );
}

function ProductEditor({ draft: initial, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => Promise<unknown> }) {
  const create = trpc.admin.createProduct.useMutation();
  const update = trpc.admin.updateProduct.useMutation();
  const del = trpc.admin.deleteProduct.useMutation();
  const [d, setD] = useState<Draft>(initial);
  const [showEn, setShowEn] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = async () => {
    const price = buildPrice(d.amount, d.unit);
    if (!d.name.trim()) return toast.error("Escribe el nombre del producto.");
    if (d.desc.trim().length < 3) return toast.error("Escribe una descripción (mínimo 3 caracteres).");
    if (!price) return toast.error("Indica un precio válido, por ejemplo 24,90.");
    if (!d.imageUrl) return toast.error("Sube una foto del producto.");
    const en = (v: string, es: string) => (v.trim() ? v.trim() : es.trim());
    const payload = {
      id: d.isNew ? slugId(d.name) : d.id,
      mode: d.mode,
      category: d.category as ManagedCatalogProduct["category"],
      name: d.name.trim(),
      nameEn: en(d.nameEn, d.name),
      desc: d.desc.trim(),
      descEn: en(d.descEn, d.desc),
      price,
      badge: d.badge.trim(),
      badgeEn: d.badge.trim() ? en(d.badgeEn, d.badge) : "",
      unitInfo: d.unitInfo.trim() || undefined,
      unitInfoEn: d.unitInfo.trim() ? en(d.unitInfoEn, d.unitInfo) : undefined,
      weightInfo: d.weightInfo.trim() || undefined,
      weightInfoEn: d.weightInfo.trim() ? en(d.weightInfoEn, d.weightInfo) : undefined,
      refPricePerKg: d.refPricePerKg.trim() || undefined,
      subGroup: d.category === "quesos" ? (d.unit === "€ / kg" ? ("por_kilo" as const) : ("por_unidad" as const)) : d.subGroup,
      freeCuttingService: d.category === "jamones_enteros" ? d.freeCuttingService : undefined,
      featured: d.featured,
      icon: ICON_BY_CATEGORY[d.category] ?? "bag",
      imageUrl: d.imageUrl,
      hoverImageUrl: d.hoverImageUrl,
      brand: d.brand.trim() || undefined,
      active: d.active,
    };
    try {
      if (d.isNew) await create.mutateAsync(payload);
      else await update.mutateAsync(payload);
      toast.success(d.isNew ? "Producto creado y publicado" : "Cambios guardados en la web");
      await onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const cats = categoriesFor(d.mode);

  return (
    <Drawer
      open
      onClose={onClose}
      title={d.isNew ? "Nuevo producto" : "Editar producto"}
      subtitle={d.isNew ? "Se publicará en la web al guardar" : `Referencia ${d.id}`}
      width={720}
      footer={
        <>
          {!d.isNew && (
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setConfirmDelete(true)}>
              Eliminar
            </Button>
          )}
          <div className="adm-spacer" />
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" loading={create.isPending || update.isPending} onClick={() => void save()}>
            {d.isNew ? "Crear producto" : "Guardar cambios"}
          </Button>
        </>
      }
    >
      <div className="adm-editor">
        <div className="adm-editor__media">
          <ImageUpload value={d.imageUrl} onChange={(url) => set("imageUrl", url)} label="Foto del producto" />
          <ImageUpload
            value={d.hoverImageUrl}
            onChange={(url) => set("hoverImageUrl", url)}
            onClear={() => set("hoverImageUrl", "")}
            label="Segunda foto (al pasar el cursor)"
          />
          <Toggle checked={d.active} onChange={(v) => set("active", v)} label="Visible en la web" description="Si lo apagas, el producto deja de mostrarse sin borrarlo." />
          {d.mode === "gourmet" && (
            <Toggle checked={d.featured} onChange={(v) => set("featured", v)} label="Destacar en «Más vendidos»" description="Aparece en la portada." />
          )}
          {d.category === "jamones_enteros" && (
            <Toggle checked={d.freeCuttingService} onChange={(v) => set("freeCuttingService", v)} label="Corte y envasado gratis" description="Ofrece al cliente cortarlo a cuchillo." />
          )}
        </div>

        <div className="adm-form">
          <Field label="Sección">
            <Select
              value={d.mode}
              onChange={(e) => {
                const m = e.target.value as Mode;
                setD((x) => ({ ...x, mode: m, category: categoriesFor(m)[0] }));
              }}
            >
              <option value="gourmet">Tienda gourmet (se puede encargar)</option>
              <option value="bakery">Carta Bakery & Café</option>
            </Select>
          </Field>
          <Field label="Categoría">
            <Select value={d.category} onChange={(e) => set("category", e.target.value)}>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {categoryName(d.mode, c)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nombre" span={2}>
            <Input value={d.name} onChange={(e) => set("name", e.target.value)} maxLength={180} placeholder="Ej. Jamón ibérico de bellota · Pieza entera" />
          </Field>
          <Field label="Marca o denominación" hint="Se muestra sobre la foto. Ej. Joselito, 5 Jotas, D.O.P. Manchego" span={2}>
            <Input value={d.brand} onChange={(e) => set("brand", e.target.value)} maxLength={80} placeholder={productBrand({ name: d.name, mode: d.mode }) ?? "Sin marca"} />
          </Field>
          <Field label="Descripción" span={2}>
            <Textarea value={d.desc} onChange={(e) => set("desc", e.target.value)} maxLength={600} rows={4} placeholder="Cuenta qué es, su origen, curación, sabor…" />
          </Field>
          <Field label="Precio">
            <div className="adm-price">
              <Input
                value={d.amount}
                onChange={(e) => set("amount", e.target.value.replace(/[^\d,.]/g, ""))}
                inputMode="decimal"
                placeholder="0,00"
                disabled={d.unit === "Consultar"}
              />
              <Select value={d.unit} onChange={(e) => set("unit", e.target.value as Unit)}>
                <option value="€">€</option>
                <option value="€ / kg">€ / kg</option>
                <option value="€ / unidad">€ / unidad</option>
                <option value="Consultar">Consultar precio</option>
              </Select>
            </div>
          </Field>
          <Field label="Etiqueta destacada" hint="Opcional · ej. «Novedad», «Corte gratis»">
            <Input value={d.badge} onChange={(e) => set("badge", e.target.value)} maxLength={80} />
          </Field>
          <Field label="Peso o formato" hint="Ej. «Peso aproximado: 7 a 8 kg»">
            <Input value={d.weightInfo} onChange={(e) => set("weightInfo", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Información de venta" hint="Ej. «Sobre 100 g envasado al vacío»">
            <Input value={d.unitInfo} onChange={(e) => set("unitInfo", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Precio de referencia por kilo" hint="Opcional · ej. «89,90 €/kg»" span={2}>
            <Input value={d.refPricePerKg} onChange={(e) => set("refPricePerKg", e.target.value)} maxLength={80} />
          </Field>

          <div className="adm-field--wide">
            <button type="button" className={`adm-collapse${showEn ? " is-open" : ""}`} onClick={() => setShowEn((v) => !v)}>
              <ChevronDown size={16} /> Traducción al inglés <Badge>Opcional</Badge>
            </button>
            {showEn && (
              <div className="adm-form adm-form--nested">
                <p className="adm-field__hint adm-field--wide">Si dejas un campo vacío, en la versión inglesa se mostrará el texto en español.</p>
                <Field label="Name" span={2}>
                  <Input value={d.nameEn} onChange={(e) => set("nameEn", e.target.value)} maxLength={180} placeholder={d.name} />
                </Field>
                <Field label="Description" span={2}>
                  <Textarea value={d.descEn} onChange={(e) => set("descEn", e.target.value)} maxLength={600} placeholder={d.desc} />
                </Field>
                <Field label="Badge">
                  <Input value={d.badgeEn} onChange={(e) => set("badgeEn", e.target.value)} maxLength={80} placeholder={d.badge} />
                </Field>
                <Field label="Weight / format">
                  <Input value={d.weightInfoEn} onChange={(e) => set("weightInfoEn", e.target.value)} maxLength={120} placeholder={d.weightInfo} />
                </Field>
                <Field label="Sales info" span={2}>
                  <Input value={d.unitInfoEn} onChange={(e) => set("unitInfoEn", e.target.value)} maxLength={120} placeholder={d.unitInfo} />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>

      <Confirm
        open={confirmDelete}
        danger
        title="¿Eliminar este producto?"
        text={
          <>
            «{d.name}» se borrará del catálogo. Si solo quieres retirarlo temporalmente, usa <strong>Visible en la web</strong>.
          </>
        }
        confirmLabel="Eliminar definitivamente"
        loading={del.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await del.mutateAsync({ id: d.id, confirmId: d.id });
            toast.success("Producto eliminado");
            await onSaved();
            onClose();
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </Drawer>
  );
}
