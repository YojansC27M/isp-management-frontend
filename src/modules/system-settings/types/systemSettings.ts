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
  brandPrimaryColor: string
  brandSecondaryColor: string
  legalFooter: string
}

export type SystemSettingsFormValues = SystemSettings

export interface DocumentTypeItem {
  id: string
  code: string
  name: string
  active: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface DocumentTypesPageMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface DocumentTypesPageResponse {
  items: DocumentTypeItem[]
  meta: DocumentTypesPageMeta
}

export interface CreateDocumentTypePayload {
  code: string
  name: string
}

export interface UpdateDocumentTypePayload {
  name: string
  active?: boolean
}
