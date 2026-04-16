import api from "@/api/axios"
import type { SystemSettings, SystemSettingsFormValues } from "../types/systemSettings"

export const getSystemSettings = async () => {
  const { data } = await api.get<SystemSettings>("/settings/system", { cancelKey: "system-settings" })
  return data
}

export const updateSystemSettings = async (payload: SystemSettingsFormValues) => {
  const { data } = await api.put<SystemSettings>("/settings/system", payload)
  return data
}

export const uploadSystemLogo = async (fileName: string) => {
  const { data } = await api.post<{ logoUrl: string }>("/settings/system/logo", { fileName })
  return data
}

