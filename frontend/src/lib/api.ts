import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  User, 
  Asset, 
  AssetCreate, 
  Holding, 
  HoldingCreate, 
  BTCTrade, 
  BTCTradeCreate, 
  DashboardData 
} from '@/types'

// API URL configuration - handle different environments
const getApiUrl = () => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Check if we're running in Docker container
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000'
    }
    // For production or custom domains, use relative URLs
    return ''
  }
  // Server-side rendering - use Docker service name
  return process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000'
}

const API_URL = getApiUrl()

// ─────────────────────────────
// axios インスタンスの設定
// ─────────────────────────────
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// ─────────────────────────────
// Zustand 認証ストア
// ─────────────────────────────
interface AuthState {
  token: string | null
  user: User | null
  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => {
        const token = get().token
        return token !== null && token !== undefined && token !== ''
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)

// ─────────────────────────────
// axios インターセプター
// ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─────────────────────────────
// 認証 API
// ─────────────────────────────
export const authAPI = {
  login: async (username: string, password: string) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    const response = await api.post('/api/auth/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  register: async (data: { username: string; email: string; password: string }) => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },

  me: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  setupTOTP: async () => {
    const response = await api.post('/api/auth/setup-totp')
    return response.data
  },

  verifyTOTP: async (code: string) => {
    const response = await api.post('/api/auth/verify-totp', { code })
    return response.data
  }
}

// ─────────────────────────────
// 資産 API
// ─────────────────────────────
export const assetsAPI = {
  list: async () => {
    const response = await api.get<Asset[]>('/api/assets')
    return response.data
  },

  getEnums: async () => {
    const response = await api.get('/api/assets/enums')
    return response.data
  },

  create: async (data: AssetCreate) => {
    const response = await api.post<Asset>('/api/assets', data)
    return response.data
  },

  update: async (id: number, data: Partial<Omit<Asset, 'id'>>) => {
    const response = await api.put<Asset>(`/api/assets/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/api/assets/${id}`)
  },

  search: async (query: string) => {
    const response = await api.get(`/api/assets/search/${query}`)
    return response.data
  }
}

// ─────────────────────────────
// 保有資産 API
// ─────────────────────────────
export const holdingsAPI = {
  list: async () => {
    const response = await api.get<Holding[]>('/api/holdings')
    return response.data
  },

  create: async (data: HoldingCreate) => {
    const response = await api.post<Holding>('/api/holdings', data)
    return response.data
  },

  update: async (id: number, data: Partial<Omit<Holding, 'id'>>) => {
    const response = await api.put<Holding>(`/api/holdings/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/api/holdings/${id}`)
  }
}

// ─────────────────────────────
// BTC取引 API
// ─────────────────────────────
export const btcTradesAPI = {
  list: async () => {
    const response = await api.get<BTCTrade[]>('/api/btc-trades')
    return response.data
  },

  create: async (data: BTCTradeCreate) => {
    const response = await api.post<BTCTrade>('/api/btc-trades', data)
    return response.data
  },

  calculateGain: async (sellId: number, method: 'FIFO' | 'HIFO') => {
    const response = await api.post(`/api/btc-trades/${sellId}/calculate-gain`, { method })
    return response.data
  },

  yearlyReport: async (year: number, method: 'FIFO' | 'HIFO') => {
    const response = await api.get(`/api/btc-trades/report/${year}`, {
      params: { method },
      responseType: 'blob'
    })
    return response.data
  }
}

// ─────────────────────────────
// ダッシュボード API
// ─────────────────────────────
export const dashboardAPI = {
  overview: async () => {
    const response = await api.get<DashboardData>('/api/dashboard/overview')
    return response.data
  },

  history: async (days: number = 365) => {
    const response = await api.get('/api/dashboard/history', {
      params: { days }
    })
    return response.data
  },

  refreshPrices: async () => {
    const response = await api.post('/api/dashboard/refresh-prices')
    return response.data
  }
}

console.log("BASE API URL:", API_URL)