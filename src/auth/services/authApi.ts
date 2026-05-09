import api from "@/api/axios"
import type { AuthLoginPayload, AuthLoginResponse, AuthMeResponse, AuthRefreshMeResponse } from "@/auth/contracts/authContracts"

export const login = async (payload: AuthLoginPayload) => {
  const { data } = await api.post<AuthLoginResponse>("/auth/login", payload)
  return data
}

export const getMe = async () => {
  const { data } = await api.get<AuthMeResponse>("/auth/me", {
    skipRetry: true,
  })
  return data
}

export const refreshMe = async () => {
  const { data } = await api.post<AuthRefreshMeResponse>("/auth/refresh-me", undefined, {
    skipRetry: true,
  })
  return data
}
