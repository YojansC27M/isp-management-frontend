import type { CSSProperties } from "react"
import type { InterfaceStatus, InterfaceStatusType } from "../types/monitoring"

interface InterfacesTableProps {
  interfaces: InterfaceStatus[]
}

const statusStyles: Record<InterfaceStatusType, CSSProperties> = {
  up: { backgroundColor: "#dcfce7", color: "#166534" },
  down: { backgroundColor: "#fee2e2", color: "#991b1b" },
}

const InterfacesTable = ({ interfaces }: InterfacesTableProps) => {
  return (
    <div style={{ overflowX: "auto" }}>
      <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
            <th>Interfaz</th>
            <th>Estado</th>
            <th>RX</th>
            <th>TX</th>
          </tr>
        </thead>
        <tbody>
          {interfaces.map((item) => (
            <tr key={item.name} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td>{item.name}</td>
              <td>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    ...statusStyles[item.status],
                  }}
                >
                  {item.status}
                </span>
              </td>
              <td>{item.rx}</td>
              <td>{item.tx}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default InterfacesTable
