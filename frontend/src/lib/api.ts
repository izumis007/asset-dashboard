import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth store
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

// Add auth interceptor
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
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: string
  username: string
  email: string
  totp_enabled: boolean
}

export interface Asset {
  id: number
  symbol: string
  name: string
  category: 'equity' | 'etf' | 'fund' | 'bond' | 'crypto' | 'cash'
  currency: string
  exchange?: string
}

export interface Holding {
  id: number
  asset: Asset
  quantity: number
  cost_total: number
  acquisition_date: string
  account_type: 'NISA' | 'iDeCo' | 'taxable'
  broker?: string
  notes?: string
}

export interface Price {
  id: number
  asset_id: number
  date: string
  price: number
  open?: number
  high?: number
  low?: number
  volume?: number
  source?: string
}

export interface BTCTrade {
  id: number
  txid?: string
  amount_btc: number
  counter_value_jpy: number
  jpy_rate: number
  fee_btc?: number
  fee_jpy?: number
  timestamp: string
  exchange?: string
  notes?: string
}

export interface DashboardData {
  total_jpy: number
  total_usd: number
  total_btc: number
  change_24h: number
  change_percentage: number
  breakdown_by_category: Record<string, number>
  breakdown_by_currency: Record<string, number>
  breakdown_by_account_type: Record<string, number>
  history: Array<{
    date: string
    total_jpy: number
    total_usd: number
  }>
}

// API functions
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

export const assetsAPI = {
  list: async () => {
    const response = await api.get<Asset[]>('/api/assets')
    return response.data
  },
  
  create: async (data: Omit<Asset, 'id'>) => {
    const response = await api.post<Asset>('/api/assets', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<Asset>) => {
    const response = await api.put<Asset>(`/api/assets/${id}`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/api/assets/${id}`)
  }
}

export const holdingsAPI = {
  list: async () => {
    const response = await api.get<Holding[]>('/api/holdings')
    return response.data
  },
  
  create: async (data: Omit<Holding, 'id' | 'asset'> & { asset_id: number }) => {
    const response = await api.post<Holding>('/api/holdings', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<Holding>) => {
    const response = await api.put<Holding>(`/api/holdings/${id}`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/api/holdings/${id}`)
  }
}

export const btcTradesAPI = {
  list: async () => {
    const response = await api.get<BTCTrade[]>('/api/btc-trades')
    return response.data
  },
  
  create: async (data: Omit<BTCTrade, 'id'>) => {
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