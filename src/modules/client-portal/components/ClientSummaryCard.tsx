import type { ClientProfile } from "../types/clientPortal"

interface ClientSummaryCardProps {
  profile: ClientProfile
}

const ClientSummaryCard = ({ profile }: ClientSummaryCardProps) => {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Datos del cliente</h2>
      <dl className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</dt>
          <dd>{profile.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Correo</dt>
          <dd>{profile.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Plan</dt>
          <dd>{profile.plan}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Estado</dt>
          <dd className="capitalize">{profile.status}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Direccion IP</dt>
          <dd>{profile.ipAddress}</dd>
        </div>
      </dl>
    </section>
  )
}

export default ClientSummaryCard
