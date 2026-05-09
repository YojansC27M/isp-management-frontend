import api from "@/api/axios"
import type { DashboardOverview } from "../types/dashboard"

export const getDashboardOverview = async () => {
  const { data } = await api.get<DashboardOverview>("/dashboard/overview", {
    cancelKey: "dashboard-overview",
  })
  return data
}
