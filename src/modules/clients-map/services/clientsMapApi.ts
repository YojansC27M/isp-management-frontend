import api from "@/api/axios"
import type { ClientMapFiltersValues, ClientMapItem } from "../types/clientMap"
import { buildClientMapParams } from "../lib/filters"

export const getClientsMap = async () => {
  const { data } = await api.get<ClientMapItem[]>("/clients-map", { cancelKey: "list" })
  return data
}

export const getClientsMapByFilters = async (filters: ClientMapFiltersValues) => {
  const params = buildClientMapParams(filters)

  const { data } = await api.get<ClientMapItem[]>("/clients-map", { params, cancelKey: "filtered-list" })
  return data
}
