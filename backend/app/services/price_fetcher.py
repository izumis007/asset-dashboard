import httpx
import asyncio
from datetime import datetime, date
from typing import Dict, Optional, List
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class PriceFetcher:
    """Fetches prices from multiple sources with fallback"""
    
    def __init__(self):
        self.twelve_data_key = settings.TWELVE_DATA_API_KEY
        self.alpha_vantage_key = settings.ALPHA_VANTAGE_API_KEY
        self.timeout = httpx.Timeout(30.0)
    
    async def fetch_price(self, symbol: str, asset_class: str = "Equity", currency: str = "JPY") -> Optional[Dict]:
        """Fetch price with fallback through multiple sources"""
        
        # 日本株の場合はStooqを優先
        if currency == "JPY" and asset_class == "Equity":
            price_data = await self._fetch_stooq_jp(symbol)
            if price_data:
                price_data['source'] = 'stooq_jp'
                return price_data
        
        # 暗号資産の場合
        if asset_class == "Crypto":
            price_data = await self._fetch_crypto_price(symbol.lower())
            if price_data:
                price_data['source'] = 'coingecko'
                return price_data
        
        # Try sources in order of preference for other assets
        if self.twelve_data_key:
            price_data = await self._fetch_twelve_data(symbol)
            if price_data:
                price_data['source'] = 'twelve_data'
                return price_data
        
        # Try Stooq (no API key required)
        price_data = await self._fetch_stooq(symbol)
        if price_data:
            price_data['source'] = 'stooq'
            return price_data
        
        if self.alpha_vantage_key:
            price_data = await self._fetch_alpha_vantage(symbol)
            if price_data:
                price_data['source'] = 'alpha_vantage'
                return price_data
        
        logger.warning(f"Failed to fetch price for {symbol} from all sources")
        return None
    
    async def _fetch_stooq_jp(self, symbol: str) -> Optional[Dict]:
        """日本株専用のStooq取得"""
        try:
            # 日本株のシンボル形式に変換
            if not symbol.endswith('.JP'):
                if symbol.isdigit():  # 証券コードの場合
                    symbol_formatted = f"{symbol}.JP"
                else:
                    symbol_formatted = f"{symbol}.T"  # TSE
            else:
                symbol_formatted = symbol
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"https://stooq.com/q/d/l/",
                    params={
                        "s": symbol_formatted,
                        "i": "d"
                    }
                )
                
                if response.status_code == 200:
                    lines = response.text.strip().split('\n')
                    if len(lines) > 1:
                        headers = lines[0].split(',')
                        values = lines[-1].split(',')
                        
                        data = dict(zip(headers, values))
                        if float(data.get("Close", 0)) > 0:
                            return {
                                "price": float(data.get("Close", 0)),
                                "open": float(data.get("Open", 0)),
                                "high": float(data.get("High", 0)),
                                "low": float(data.get("Low", 0)),
                                "volume": float(data.get("Volume", 0)),
                                "date": datetime.strptime(data["Date"], "%Y-%m-%d").date()
                            }
        except Exception as e:
            logger.error(f"Stooq JP error for {symbol}: {e}")
        return None
    
    async def _fetch_twelve_data(self, symbol: str) -> Optional[Dict]:
        """Fetch from Twelve Data API"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    "https://api.twelvedata.com/quote",
                    params={
                        "symbol": symbol,
                        "apikey": self.twelve_data_key
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "close" in data and float(data["close"]) > 0:
                        return {
                            "price": float(data["close"]),
                            "open": float(data.get("open", 0)),
                            "high": float(data.get("high", 0)),
                            "low": float(data.get("low", 0)),
                            "volume": float(data.get("volume", 0)),
                            "date": date.today()
                        }
        except Exception as e:
            logger.error(f"Twelve Data error for {symbol}: {e}")
        return None
    
    async def _fetch_stooq(self, symbol: str) -> Optional[Dict]:
        """Fetch from Stooq (free, no API key)"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"https://stooq.com/q/d/l/",
                    params={
                        "s": symbol,
                        "i": "d"
                    }
                )
                
                if response.status_code == 200:
                    lines = response.text.strip().split('\n')
                    if len(lines) > 1:
                        headers = lines[0].split(',')
                        values = lines[-1].split(',')
                        
                        data = dict(zip(headers, values))
                        if float(data.get("Close", 0)) > 0:
                            return {
                                "price": float(data.get("Close", 0)),
                                "open": float(data.get("Open", 0)),
                                "high": float(data.get("High", 0)),
                                "low": float(data.get("Low", 0)),
                                "volume": float(data.get("Volume", 0)),
                                "date": datetime.strptime(data["Date"], "%Y-%m-%d").date()
                            }
        except Exception as e:
            logger.error(f"Stooq error for {symbol}: {e}")
        return None
    
    async def _fetch_alpha_vantage(self, symbol: str) -> Optional[Dict]:
        """Fetch from Alpha Vantage API"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    "https://www.alphavantage.co/query",
                    params={
                        "function": "GLOBAL_QUOTE",
                        "symbol": symbol,
                        "apikey": self.alpha_vantage_key
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "Global Quote" in data and "05. price" in data["Global Quote"]:
                        quote = data["Global Quote"]
                        return {
                            "price": float(quote["05. price"]),
                            "open": float(quote.get("02. open", 0)),
                            "high": float(quote.get("03. high", 0)),
                            "low": float(quote.get("04. low", 0)),
                            "volume": float(quote.get("06. volume", 0)),
                            "date": date.today()
                        }
        except Exception as e:
            logger.error(f"Alpha Vantage error for {symbol}: {e}")
        return None
    
    async def _fetch_crypto_price(self, symbol: str = "bitcoin") -> Optional[Dict]:
        """Fetch cryptocurrency price from CoinGecko"""
        try:
            # シンボルからCoinGecko IDにマッピング
            crypto_mapping = {
                "btc": "bitcoin",
                "bitcoin": "bitcoin",
                "eth": "ethereum", 
                "ethereum": "ethereum",
                "ada": "cardano",
                "dot": "polkadot",
                "sol": "solana"
            }
            
            crypto_id = crypto_mapping.get(symbol.lower(), symbol.lower())
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"https://api.coingecko.com/api/v3/simple/price",
                    params={
                        "ids": crypto_id,
                        "vs_currencies": "jpy,usd",
                        "include_24hr_vol": "true",
                        "include_24hr_change": "true"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if crypto_id in data:
                        crypto_data = data[crypto_id]
                        return {
                            "price": crypto_data.get("jpy", 0),
                            "price_usd": crypto_data.get("usd", 0),
                            "volume": crypto_data.get("jpy_24h_vol", 0),
                            "change_24h": crypto_data.get("jpy_24h_change", 0),
                            "date": date.today()
                        }
        except Exception as e:
            logger.error(f"CoinGecko error for {symbol}: {e}")
        return None
    
    async def fetch_fx_rate(self, from_currency: str, to_currency: str) -> Optional[float]:
        """Fetch foreign exchange rate"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                # Try exchangerate.host (free)
                response = await client.get(
                    f"https://api.exchangerate.host/convert",
                    params={
                        "from": from_currency,
                        "to": to_currency
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        return float(data.get("result", 0))
        except Exception as e:
            logger.error(f"FX rate error for {from_currency}/{to_currency}: {e}")
        
        return None
    
    async def fetch_multiple_prices(self, symbols_with_info: List[tuple]) -> Dict[str, Optional[Dict]]:
        """Fetch prices for multiple symbols with asset info"""
        tasks = []
        for symbol, asset_class, currency in symbols_with_info:
            task = self.fetch_price(symbol, asset_class, currency)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        return dict(zip([info[0] for info in symbols_with_info], results))