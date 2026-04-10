import KpiCard from "@/components/shared/KpiCard"

interface MetricsCardProps {
  label: string
  value: string
}

const MetricsCard = ({ label, value }: MetricsCardProps) => {
  return <KpiCard label={label} value={value} />
}

export default MetricsCard
