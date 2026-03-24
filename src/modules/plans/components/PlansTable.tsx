import type { CSSProperties } from "react"
import type { Plan } from "../types/plan"

interface PlansTableProps {
  plans: Plan[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

const cellNumeric: CSSProperties = { textAlign: "right" }

const PlansTable = ({ plans, onEdit, onDelete }: PlansTableProps) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Name</th>
            <th style={cellNumeric}>Download</th>
            <th style={cellNumeric}>Upload</th>
            <th style={cellNumeric}>Price</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{plan.name}</td>
              <td style={cellNumeric}>{plan.downloadSpeed} Mbps</td>
              <td style={cellNumeric}>{plan.uploadSpeed} Mbps</td>
              <td style={cellNumeric}>${plan.price.toFixed(2)}</td>
              <td style={{ textTransform: "capitalize" }}>{plan.type}</td>
              <td style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => onEdit(plan.id)}>
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(plan.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PlansTable
