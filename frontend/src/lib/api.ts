import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Asset,
  AssetCreate,
  AssetUpdate,
  Holding,
  BTCTrade,
  DashboardData,
  User
} from '@/types'

// ─────────────────────────────
// axios インスタンスの設定
// ─────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api'
console.log("BASE API URL:", API_URL)

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
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

    const response = await api.post('/auth/token', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  register: async (data: { username: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  me: async () => {
    const response = await api.get('/me')
    return response.data
  },

  setupTOTP: async () => {
    const response = await api.post('/auth/setup-totp')
    return response.data
  },

  verifyTOTP: async (code: string) => {
    const response = await api.post('/auth/verify-totp', { code })
    return response.data
  }
}

// ─────────────────────────────
// 資産 API
// ─────────────────────────────
export const assetsAPI = {
  list: async () => {
    const response = await api.get<Asset[]>('/assets')
    return response.data
  },

  create: async (data: AssetCreate) => {
    const response = await api.post<Asset>('/assets', data)
    return response.data
  },

  update: async (id: number, data: Partial<Omit<Asset, 'id'>>) => {
    const response = await api.put<Asset>(`/assets/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/assets/${id}`)
  }
}

// ─────────────────────────────
// 保有資産 API
// ─────────────────────────────
export const holdingsAPI = {
  list: async () => {
    const response = await api.get<Holding[]>('/holdings')
    return response.data
  },

  create: async (data: Omit<Holding, 'id' | 'asset'> & { asset_id: number }) => {
    const response = await api.post<Holding>('/holdings', data)
    return response.data
  },

  update: async (id: number, data: Partial<Omit<Holding, 'id'>>) => {
    const response = await api.put<Holding>(`/holdings/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/holdings/${id}`)
  }
}

// ─────────────────────────────
// BTC取引 API
// ─────────────────────────────
export const btcTradesAPI = {
  list: async () => {
    const response = await api.get<BTCTrade[]>('/btc-trades')
    return response.data
  },

  create: async (data: Omit<BTCTrade, 'id'>) => {
    const response = await api.post<BTCTrade>('/btc-trades', data)
    return response.data
  },

  calculateGain: async (sellId: number, method: 'FIFO' | 'HIFO') => {
    const response = await api.post(`/btc-trades/${sellId}/calculate-gain`, { method })
    return response.data
  },

  yearlyReport: async (year: number, method: 'FIFO' | 'HIFO') => {
    const response = await api.get(`/btc-trades/report/${year}`, {
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
    const response = await api.get<DashboardData>('/dashboard/overview')
    return response.data
  },

  history: async (days: number = 365) => {
    const response = await api.get('/dashboard/history', {
      params: { days }
    })
    return response.data
  },

  refreshPrices: async () => {
    const response = await api.post('/dashboard/refresh-prices')
    return response.data
  }
}

console.log("BASE API URL:", API_URL)