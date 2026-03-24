export type PlanType = "residential" | "business"

export interface Plan {
  id: string
  name: string
  downloadSpeed: number
  uploadSpeed: number
  price: number
  type: PlanType
}

export interface PlanFormValues {
  name: string
  downloadSpeed: number
  uploadSpeed: number
  price: number
  type: PlanType
}
