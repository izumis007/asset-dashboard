import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TickerSearchResult {
  symbol: string
  name: string
  exchange?: string
  currency?: string
  region?: string
  asset_class?: string
}

interface TickerSearchProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (result: TickerSearchResult) => void
  placeholder?: string
  label?: string
}

export function TickerSearch({ value, onChange, onSelect, placeholder = "ティッカーを入力...", label }: TickerSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<TickerSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // デバウンス用の検索関数
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.length >= 2) {
        searchTickers(value)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value])

  const searchTickers = async (query: string) => {
    setIsLoading(true)
    try {
      // モックデータ（実際のAPIに置き換え）
      const mockResults: TickerSearchResult[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', currency: 'USD', region: 'US', asset_class: 'Equity' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', currency: 'USD', region: 'US', asset_class: 'Equity' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', currency: 'USD', region: 'US', asset_class: 'Equity' },
        { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', currency: 'USD', region: 'US', asset_class: 'Equity' },
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSE', currency: 'USD', region: 'US', asset_class: 'Equity' },
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', exchange: 'NYSE', currency: 'USD', region: 'US', asset_class: 'Equity' },
        { symbol: 'BTC-USD', name: 'Bitcoin USD', currency: 'USD', asset_class: 'Crypto' },
        { symbol: '7203.T', name: 'トヨタ自動車', exchange: 'TSE', currency: 'JPY', region: 'JP', asset_class: 'Equity' }
      ]
      
      const filtered = mockResults.filter(result => 
        result.symbol.toLowerCase().includes(query.toLowerCase()) ||
        result.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
      
      setResults(filtered)
      setIsOpen(filtered.length > 0)
      setSelectedIndex(-1)
      
      // 実際のAPI呼び出し例:
      // const response = await fetch(`/api/search/tickers?q=${encodeURIComponent(query)}`)
      // const data = await response.json()
      // setResults(data.results || [])
      
    } catch (error) {
      console.error('Ticker search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (result: TickerSearchResult) => {
    onChange(result.symbol)
    setIsOpen(false)
    setSelectedIndex(-1)
    onSelect?.(result)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    // ドロップダウン内をクリックした場合は閉じない
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return
    }
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div className="relative">
      {label && <Label htmlFor="ticker-search">{label}</Label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          id="ticker-search"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-10 pr-10"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* ドロップダウン結果 */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result, index) => (
            <div
              key={`${result.symbol}-${index}`}
              onClick={() => handleSelect(result)}
              className={`px-4 py-3 cursor-pointer border-b border-muted/20 last:border-b-0 hover:bg-muted/50 ${
                index === selectedIndex ? 'bg-muted/50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm">{result.symbol}</span>
                    {result.exchange && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                        {result.exchange}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {result.name}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {result.currency && <div>{result.currency}</div>}
                  {result.region && <div>{result.region}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}