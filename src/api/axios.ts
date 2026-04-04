import axios from "axios"
import mockAdapter from "@/mocks/adapter"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

if (import.meta.env.VITE_USE_MOCKS === "true") {
  api.defaults.adapter = mockAdapter
}

api.interceptors.request.use(
  (config) => {
    // Attach auth token here when available
    return config
  },
  (error) => Promise.reject(error),
)

export default api
