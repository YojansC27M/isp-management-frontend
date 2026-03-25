export interface ClientProfile {
  id: string
  name: string
  email: string
  plan: string
  status: string
  ipAddress: string
}

export interface ClientInvoice {
  id: string
  invoiceNumber: string
  amount: number
  dueDate: string
  status: string
}

export interface ClientPayment {
  id: string
  amount: number
  paymentDate: string
  method: string
}

export interface ClientTicket {
  id: string
  title: string
  status: string
  createdAt: string
}
