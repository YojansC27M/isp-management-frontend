import type {
  ClientPortalInvoiceResponse,
  ClientPortalLoginRequest,
  ClientPortalLoginResponse,
  ClientPortalCreateTicketRequest,
  ClientPortalPaymentResponse,
  ClientPortalProfileResponse,
  ClientPortalTicketResponse,
} from "../contracts/clientPortalContracts"

export type ClientProfile = ClientPortalProfileResponse
export type ClientInvoice = ClientPortalInvoiceResponse
export type ClientPayment = ClientPortalPaymentResponse
export type ClientTicket = ClientPortalTicketResponse
export type ClientPortalLoginPayload = ClientPortalLoginRequest
export type ClientPortalLoginResult = ClientPortalLoginResponse
export type ClientPortalCreateTicketPayload = ClientPortalCreateTicketRequest
