import KpiCard from "@/components/shared/KpiCard"

interface StatsCardProps {
  label: string
  value: string
}

const StatsCard = ({ label, value }: StatsCardProps) => {
  return <KpiCard label={label} value={value} />
}

export default StatsCard
