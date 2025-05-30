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
// API URL configuration - handle different environments
const getApiUrl = () => {
  // In browser environment
  if (typeof window !== 'undefined') {
    // Check if we're running in Docker container or localhost
    const hostname = window.location.hostname
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Development mode - backend is on localhost:8000
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
// axios インスタンスの設定を強化
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  // HEADリクエストを送信しないように設定
  maxRedirects: 0,  // リダイレクトを追跡しない
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
// インターセプターも強化
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // デバッグ用ログ
  console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)
  
  return config
})

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    return response
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status}`)
    console.error('API Error:', error.response?.data || error.message)
    
    // 307リダイレクトエラーの場合は特別処理
    if (error.response?.status === 307) {
      console.warn('🔄 307 Redirect detected - URL might need trailing slash')
    }
    
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

    const response = await api.post('/api/auth/token/', formData, {  // ✅ 修正
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  register: async (data: { username: string; email: string; password: string }) => {
    const response = await api.post('/api/auth/register/', data)  // ✅ 修正
    return response.data
  },

  me: async () => {
    const response = await api.get('/api/auth/me/')  // ✅ 修正
    return response.data
  },

  setupTOTP: async () => {
    const response = await api.post('/api/auth/setup-totp/')  // ✅ 修正
    return response.data
  },

  verifyTOTP: async (code: string) => {
    const response = await api.post('/api/auth/verify-totp/', { code })  // ✅ 修正
    return response.data
  }
}
// ─────────────────────────────
// 資産 API
// ─────────────────────────────
export const assetsAPI = {
  list: async () => {
    const response = await api.get<Asset[]>('/api/assets/')  // ✅
    return response.data
  },

  getEnums: async () => {
    const response = await api.get('/api/assets/enums/')  // ✅
    return response.data
  },

  create: async (data: AssetCreate) => {
    const response = await api.post<Asset>('/api/assets/', data)  // ✅
    return response.data
  },

  update: async (id: number, data: Partial<Omit<Asset, 'id'>>) => {
    const response = await api.put<Asset>(`/api/assets/${id}/`, data)  // ✅ 追加
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/api/assets/${id}/`)  // ✅ 追加
  },

  search: async (query: string) => {
    const response = await api.get(`/api/assets/search/${query}/`)  // ✅ 追加
    return response.data
  }
}

// ─────────────────────────────
// 保有資産 API
// ─────────────────────────────
export const holdingsAPI = {
  list: async () => {
    const response = await api.get<Holding[]>('/api/holdings/')  // ✅ 修正
    return response.data
  },

  create: async (data: HoldingCreate) => {
    const response = await api.post<Holding>('/api/holdings/', data)  // ✅ 修正
    return response.data
  },

  update: async (id: number, data: Partial<Omit<Holding, 'id'>>) => {
    const response = await api.put<Holding>(`/api/holdings/${id}/`, data)  // ✅ 修正
    return response.data
  },

  delete: async (id: number) => {
    await api.delete(`/api/holdings/${id}/`)  // ✅ 修正
  }
}

// ─────────────────────────────
// BTC取引 API
// ─────────────────────────────
export const btcTradesAPI = {
  list: async () => {
    const response = await api.get<BTCTrade[]>('/api/btc-trades/')  // ✅ 修正
    return response.data
  },

  create: async (data: BTCTradeCreate) => {
    const response = await api.post<BTCTrade>('/api/btc-trades/', data)  // ✅ 修正
    return response.data
  },

  calculateGain: async (sellId: number, method: 'FIFO' | 'HIFO') => {
    const response = await api.post(`/api/btc-trades/${sellId}/calculate-gain/`, { method })  // ✅ 修正
    return response.data
  },

  yearlyReport: async (year: number, method: 'FIFO' | 'HIFO') => {
    const response = await api.get(`/api/btc-trades/report/${year}/`, {  // ✅ 修正
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
    const response = await api.get<DashboardData>('/api/dashboard/overview/')  // ✅ 修正
    return response.data
  },

  history: async (days: number = 365) => {
    const response = await api.get('/api/dashboard/history/', {  // ✅ 修正
      params: { days }
    })
    return response.data
  },

  refreshPrices: async () => {
    const response = await api.post('/api/dashboard/refresh-prices/')  // ✅ 修正
    return response.data
  }
}

console.log("BASE API URL:", API_URL)

