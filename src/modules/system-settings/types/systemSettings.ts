export interface SystemSettings {
  companyName: string
  tradeName: string
  taxId: string
  billingEmail: string
  billingPhone: string
  address: string
  currency: string
  timezone: string
  invoicePrefix: string
  logoUrl: string
}

export type SystemSettingsFormValues = SystemSettings

