import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use(
  (config) => {
    // Attach auth token here when available
    return config
  },
  (error) => Promise.reject(error),
)

export default api
