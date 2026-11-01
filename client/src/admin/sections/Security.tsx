import { trpc } from "@/lib/trpc";
import { DatabaseBackup, History, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Confirm, Empty, errorMessage, Field, fmtDate, Input, Loading, PageHeader } from "../ui";

const ACTION_LABELS: Record<string, string> = {
  ADMIN_LOGIN_SUCCESS: "Inicio de sesión correcto",
  ADMIN_LOGIN_FAILED: "Intento de acceso fallido",
  ADMIN_PASSWORD_CHANGED: "Contraseña cambiada",
  ADMIN_INITIAL_SETUP: "Configuración inicial",
  CREATE_PRODUCT: "Producto creado",
  UPDATE_PRODUCT: "Producto editado",
  DELETE_PRODUCT: "Producto eliminado",
  TOGGLE_PRODUCT_ACTIVE: "Producto mostrado / ocultado",
  UPLOAD_PRODUCT_IMAGE: "Foto subida",
  UPLOAD_PRODUCT_VIDEO: "Vídeo subido",
  UPDATE_SITE_SETTINGS: "Contenido de la web actualizado",
  RESTORE_SITE_SETTINGS_VERSION: "Versión de la web restaurada",
  UPDATE_ORDER_STATUS: "Estado de pedido cambiado",
  UPDATE_ORDER_NOTE: "Nota de pedido guardada",
  DELETE_ORDER: "Pedido eliminado",
  CREATE_BACKUP: "Copia de seguridad creada",
};

export function SecuritySection({ onPasswordChanged }: { onPasswordChanged: (token: string) => void }) {
  const utils = trpc.useUtils();
  const change = trpc.admin.changePassword.useMutation();
  const logs = trpc.admin.listAuditLogs.useQuery({ limit: 80 });
  const history = trpc.admin.listSiteSettingsHistory.useQuery();
  const restore = trpc.admin.restoreSiteSettingsVersion.useMutation();
  const backup = trpc.admin.createBackup.useMutation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [restoreVersion, setRestoreVersion] = useState<number | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 12) return toast.error("La nueva contraseña debe tener al menos 12 caracteres.");
    if (next !== repeat) return toast.error("Las contraseñas nuevas no coinciden.");
    try {
      const res = await change.mutateAsync({ currentPassword: current, newPassword: next });
      onPasswordChanged(res.sessionToken);
      setCurrent("");
      setNext("");
      setRepeat("");
      toast.success("Contraseña cambiada. Cualquier otra sesión abierta se ha cerrado.");
      void utils.admin.listAuditLogs.invalidate();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const failed = (logs.data ?? []).filter((l) => l.action === "ADMIN_LOGIN_FAILED").length;

  return (
    <>
      <PageHeader title="Seguridad y actividad" subtitle="Acceso exclusivo del propietario, historial de cambios y copias de seguridad." />

      <div className="adm-grid adm-grid--2">
        <Card title="Cambiar contraseña" subtitle="Solo existe una contraseña de acceso. Al cambiarla se cierran todas las demás sesiones.">
          <form className="adm-form" onSubmit={submit}>
            <Field label="Contraseña actual" span={2}>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
            </Field>
            <Field label="Nueva contraseña" hint="Mínimo 12 caracteres">
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
            </Field>
            <Field label="Repite la nueva contraseña">
              <Input type="password" value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required />
            </Field>
            <div className="adm-field--wide adm-row-end">
              <Button type="submit" variant="primary" icon={<KeyRound size={16} />} loading={change.isPending}>
                Cambiar contraseña
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Protección del acceso">
          <ul className="adm-checks">
            <li><ShieldCheck size={18} /> Acceso único del propietario con contraseña cifrada (scrypt).</li>
            <li><ShieldCheck size={18} /> Bloqueo de 15 minutos tras 5 intentos fallidos.</li>
            <li><ShieldCheck size={18} /> Sesión segura que caduca a las 12 horas.</li>
            <li><ShieldCheck size={18} /> Nadie puede crear otra cuenta desde la web.</li>
          </ul>
          <div className={`adm-alert ${failed > 0 ? "adm-alert--warning" : "adm-alert--success"}`}>
            {failed > 0 ? `${failed} intentos de acceso fallidos en el registro reciente.` : "Sin intentos de acceso fallidos recientes."}
          </div>
          <Button
            icon={<DatabaseBackup size={16} />}
            loading={backup.isPending}
            onClick={async () => {
              try {
                const res = await backup.mutateAsync({ label: "panel" });
                toast.success(`Copia del catálogo creada (${res.productsCount} productos)`);
                void utils.admin.listAuditLogs.invalidate();
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            Crear copia de seguridad del catálogo
          </Button>
        </Card>
      </div>

      <div className="adm-grid adm-grid--2">
        <Card title="Registro de actividad" subtitle="Últimas acciones en el panel" pad={false}>
          {logs.isLoading ? (
            <Loading />
          ) : (logs.data ?? []).length === 0 ? (
            <Empty title="Sin actividad registrada" />
          ) : (
            <div className="adm-table-wrap adm-table-wrap--scroll">
              <table className="adm-table adm-table--compact">
                <tbody>
                  {(logs.data ?? []).map((l) => (
                    <tr key={l.id}>
                      <td>
                        {l.action === "ADMIN_LOGIN_FAILED" ? <Badge tone="danger">{ACTION_LABELS[l.action]}</Badge> : ACTION_LABELS[l.action] ?? l.action}
                        {l.targetProductId && <small className="adm-muted">{l.targetProductId}</small>}
                      </td>
                      <td className="num adm-muted">{fmtDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Versiones de la web" subtitle="Cada vez que publicas cambios se guarda una versión. Puedes volver a una anterior." pad={false}>
          {history.isLoading ? (
            <Loading />
          ) : (history.data ?? []).length === 0 ? (
            <Empty icon={<History size={26} strokeWidth={1.25} />} title="Aún no hay versiones guardadas" />
          ) : (
            <div className="adm-table-wrap adm-table-wrap--scroll">
              <table className="adm-table adm-table--compact">
                <tbody>
                  {[...(history.data ?? [])].reverse().map((h) => (
                    <tr key={`${h.version}-${h.updatedAt}`}>
                      <td>
                        <strong>Versión {h.version}</strong>
                        <small className="adm-muted">{h.label}</small>
                      </td>
                      <td className="adm-muted">{fmtDate(h.updatedAt)}</td>
                      <td className="num">
                        <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => setRestoreVersion(h.version)}>
                          Restaurar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Confirm
        open={restoreVersion !== null}
        title={`¿Restaurar la versión ${restoreVersion}?`}
        text="Los textos, avisos, carrusel, horarios y campaña de la web volverán a como estaban en esa versión. Los productos y pedidos no cambian."
        confirmLabel="Restaurar versión"
        loading={restore.isPending}
        onCancel={() => setRestoreVersion(null)}
        onConfirm={async () => {
          if (restoreVersion === null) return;
          try {
            await restore.mutateAsync({ version: restoreVersion });
            toast.success("Versión restaurada y publicada");
            setRestoreVersion(null);
            await Promise.all([utils.admin.getSiteSettings.invalidate(), utils.catalog.siteSettings.invalidate(), utils.admin.listSiteSettingsHistory.invalidate()]);
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      />
    </>
  );
}
