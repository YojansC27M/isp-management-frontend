import api from "@/api/axios"
import type { ClientMapFiltersValues, ClientMapItem } from "../types/clientMap"

export const getClientsMap = async () => {
  const { data } = await api.get<ClientMapItem[]>("/clients-map", { cancelKey: "list" })
  return data
}

export const getClientsMapByFilters = async (filters: ClientMapFiltersValues) => {
  const { data } = await api.get<ClientMapItem[]>("/clients-map", { params: filters, cancelKey: "filtered-list" })
  return data
}
