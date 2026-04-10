import axios from "axios"
import mockAdapter from "@/mocks/adapter"
import { getAuthToken, getClientToken } from "@/auth/session"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

if (import.meta.env.VITE_USE_MOCKS === "true") {
  api.defaults.adapter = mockAdapter
}

api.interceptors.request.use(
  (config) => {
    const isClientPortal = config.url?.includes("/client-portal")
    const token = isClientPortal ? getClientToken() : getAuthToken()

    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

export default api
