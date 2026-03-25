import api from "@/api/axios"
import type { ClientMapFiltersValues, ClientMapItem } from "../types/clientMap"

export const getClientsMap = async () => {
  const { data } = await api.get<ClientMapItem[]>("/clients-map")
  return data
}

export const getClientsMapByFilters = async (filters: ClientMapFiltersValues) => {
  const { data } = await api.get<ClientMapItem[]>("/clients-map", { params: filters })
  return data
}
