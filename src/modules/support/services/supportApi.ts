import api from "@/api/axios"
import type { SupportOverviewPayload } from "../types/support"

export const getSupportOverview = async (days = 7) => {
  const { data } = await api.get<SupportOverviewPayload>("/support/overview", {
    params: { days },
    cancelKey: `support-overview:${days}`,
  })
  return data
}

