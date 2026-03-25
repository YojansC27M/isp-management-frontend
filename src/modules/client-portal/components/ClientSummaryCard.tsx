import type { ClientProfile } from "../types/clientPortal"

interface ClientSummaryCardProps {
  profile: ClientProfile
}

const ClientSummaryCard = ({ profile }: ClientSummaryCardProps) => {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Client</strong>
        <span>{profile.name}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Email</strong>
        <span>{profile.email}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Plan</strong>
        <span>{profile.plan}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>Status</strong>
        <span style={{ textTransform: "capitalize" }}>{profile.status}</span>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <strong>IP Address</strong>
        <span>{profile.ipAddress}</span>
      </div>
    </div>
  )
}

export default ClientSummaryCard
