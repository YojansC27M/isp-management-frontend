interface KpiCardProps {
  label: string
  value: string
  className?: string
}

const KpiCard = ({ label, value, className = "" }: KpiCardProps) => {
  return (
    <article className={`rounded-xl border border-border bg-card p-4 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </article>
  )
}

export default KpiCard

