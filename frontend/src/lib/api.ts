import axios from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  User, 
  Asset, 
  AssetCreate, 
  Owner,
  OwnerCreate,
  OwnerUpdate,
  Holding, 
  HoldingCreate, 
  BTCTrade, 
  BTCTradeCreate, 
  DashboardData 
} from '@/types'


// 🔧 修正: より確実なAPI URL設定
const getApiUrl = () => {
  // 環境変数が設定されている場合は優先
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // ブラウザ環境でのデフォルト設定
  if (typeof window !== 'undefined') {
    // 開発環境の場合
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000'
    }
    // 本番環境ではrelative URLを使用
    return ''
  }
  
  // サーバーサイドでは Docker service nameを使用
  return 'http://backend:8000'
}

const API_URL = getApiUrl()

// 🔧 修正: より詳細なログとエラーハンドリング
console.log("🔧 API Configuration:", {
  API_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
})

// axios インスタンスの設定（タイムアウトを延長）
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 🔧 修正: 30秒に延長
  // 🔧 追加: より詳細なconfig
  withCredentials: false, // CORSで問題が発生する場合はfalseに
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
  // 🔧 修正: isAuthenticated関数を追加
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
      // 🔧 修正: isAuthenticated関数の実装
      isAuthenticated: () => {
        const { token } = get()
        return !!token && token.length > 0
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

// ─────────────────────────────
// axios インターセプター（デバッグ強化）
// ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 🔧 追加: リクエストログ
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      headers: config.headers,
    })
    
    return config
  },
  (error) => {
    console.error('🚨 Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for auth errors（デバッグ強化）
api.interceptors.response.use(
  (response) => {
    // 🔧 追加: レスポンスログ
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    })
    return response
  },
  (error) => {
    // 🔧 修正: より詳細なエラーログ
    console.error('🚨 API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      }
    })
    
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

  // 🔧 修正: update メソッドを追加
  update: async (id: string, data: Partial<AssetCreate>) => {
    const response = await api.put<Asset>(`/api/assets/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await api.delete(`/api/assets/${id}`)
  },

  search: async (query: string) => {
    const response = await api.get(`/api/assets/search/${query}`)
    return response.data
  }
}

// ─────────────────────────────
// 名義人 API
// ─────────────────────────────
export const ownersAPI = {
  list: async (): Promise<Owner[]> => {
    const response = await api.get<Owner[]>('/api/owners')
    return response.data
  },

  create: async (data: OwnerCreate): Promise<Owner> => {
    const response = await api.post<Owner>('/api/owners', data)
    return response.data
  },

  update: async (id: string, data: OwnerUpdate): Promise<Owner> => {
    const response = await api.put<Owner>(`/api/owners/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/owners/${id}`)
  },

  getOwnerTypes: async () => {
    const response = await api.get('/api/owners/enums/owner-types')
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

  update: async (id: string, data: Partial<Omit<Holding, 'id'>>) => {
    const response = await api.put<Holding>(`/api/holdings/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
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

  calculateGain: async (sellId: string, method: 'FIFO' | 'HIFO') => {
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


// ─────────────────────────────
// 価格 API
// ─────────────────────────────
export const pricesAPI = {
  current: async () => {
    const response = await api.get('/api/prices/current')
    return response.data
  },

  latest: async () => {
    const response = await api.get('/api/prices/latest')
    return response.data
  },

  history: async (assetId: string, startDate?: string, endDate?: string) => {
    const response = await api.post('/api/prices/history', {
      asset_id: assetId,
      start_date: startDate,
      end_date: endDate
    })
    return response.data
  },

  fetch: async (assetId: string) => {
    const response = await api.post(`/api/prices/fetch/${assetId}`)
    return response.data
  },

  fxRates: async () => {
    const response = await api.get('/api/prices/fx-rates')
    return response.data
  }
}