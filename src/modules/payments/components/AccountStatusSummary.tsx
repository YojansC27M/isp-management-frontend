interface AccountStatusSummaryProps {
  totalPending: number
  totalPaid: number
  totalOverdue: number
}

const AccountStatusSummary = ({ totalPending, totalPaid, totalOverdue }: AccountStatusSummaryProps) => {
  const cards = [
    { label: "Total pendiente", value: totalPending, color: "text-amber-700" },
    { label: "Total pagado", value: totalPaid, color: "text-emerald-700" },
    { label: "Total vencido", value: totalOverdue, color: "text-rose-700" },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <article key={card.label} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</p>
          <p className={`mt-2 text-2xl font-semibold ${card.color}`}>${card.value.toFixed(2)}</p>
        </article>
      ))}
    </div>
  )
}

export default AccountStatusSummary
