import type { Client } from "../types/client"

export type ClientFormValues = Omit<Client, "id">

interface ClientFormProps {
  initialValues: ClientFormValues
  onSubmit: (values: ClientFormValues) => void
  submitLabel?: string
}

const ClientForm = ({ initialValues, onSubmit, submitLabel = "Save" }: ClientFormProps) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)

        const values: ClientFormValues = {
          name: String(formData.get("name") ?? ""),
          document: String(formData.get("document") ?? ""),
          address: String(formData.get("address") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          plan: String(formData.get("plan") ?? ""),
          ipAddress: String(formData.get("ipAddress") ?? ""),
          status: String(formData.get("status") ?? ""),
          latitude: formData.get("latitude")
            ? Number(formData.get("latitude"))
            : null,
          longitude: formData.get("longitude")
            ? Number(formData.get("longitude"))
            : null,
        }

        onSubmit(values)
      }}
      style={{ display: "grid", gap: 12, maxWidth: 480 }}
    >
      <label style={{ display: "grid", gap: 6 }}>
        Name
        <input name="name" defaultValue={initialValues.name} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Document
        <input name="document" defaultValue={initialValues.document} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Address
        <input name="address" defaultValue={initialValues.address} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Phone
        <input name="phone" defaultValue={initialValues.phone} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Email
        <input name="email" type="email" defaultValue={initialValues.email} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Plan
        <input name="plan" defaultValue={initialValues.plan} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        IP Address
        <input name="ipAddress" defaultValue={initialValues.ipAddress} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Status
        <input name="status" defaultValue={initialValues.status} required />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Latitude
        <input name="latitude" type="number" step="any" defaultValue={initialValues.latitude ?? ""} />
      </label>
      <label style={{ display: "grid", gap: 6 }}>
        Longitude
        <input name="longitude" type="number" step="any" defaultValue={initialValues.longitude ?? ""} />
      </label>
      <button type="submit">{submitLabel}</button>
    </form>
  )
}

export default ClientForm
