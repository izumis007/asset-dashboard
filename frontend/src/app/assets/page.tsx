'use client'

import { useEffect, useState } from 'react'
import { assetsAPI } from '@/lib/api'
import { Asset, AssetCreate, AssetClass, AssetType, Region } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusIcon, TrashIcon } from 'lucide-react'
import { ASSET_TYPE_BY_CLASS } from '@/constants/assetMapping'

// ✅ 1. すべてのEnum表記をCamelCaseに統一
const AssetClassEnum = {
  CashEq: 'CashEq' as AssetClass,
  FixedIncome: 'FixedIncome' as AssetClass,
  Equity: 'Equity' as AssetClass,
  RealAsset: 'RealAsset' as AssetClass,
  Crypto: 'Crypto' as AssetClass,
} as const;

const AssetTypeEnum = {
  Savings: 'Savings' as AssetType,
  MMF: 'MMF' as AssetType,
  Stablecoin: 'Stablecoin' as AssetType,
  GovBond: 'GovBond' as AssetType,
  CorpBond: 'CorpBond' as AssetType,
  BondETF: 'BondETF' as AssetType,
  DirectStock: 'DirectStock' as AssetType,
  EquityETF: 'EquityETF' as AssetType,
  MutualFund: 'MutualFund' as AssetType,
  REIT: 'REIT' as AssetType,
  Commodity: 'Commodity' as AssetType,
  GoldETF: 'GoldETF' as AssetType,
  Crypto: 'Crypto' as AssetType,
} as const;

const RegionEnum = {
  US: 'US' as Region,
  JP: 'JP' as Region,
  EU: 'EU' as Region,
  DM: 'DM' as Region,
  EM: 'EM' as Region,
  GL: 'GL' as Region,
} as const;

// UI表示用のラベルマッピング（将来的にi18n対応）
const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  CashEq: '現金等価物',
  FixedIncome: '債券',
  Equity: '株式',
  RealAsset: '実物資産',
  Crypto: '暗号資産',
} as const;

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  Savings: '普通預金',
  MMF: 'MMF',
  Stablecoin: 'ステーブルコイン',
  GovBond: '国債',
  CorpBond: '社債',
  BondETF: '債券ETF',
  DirectStock: '個別株',
  EquityETF: '株式ETF',
  MutualFund: '投資信託',
  REIT: 'REIT',
  Commodity: 'コモディティ',
  GoldETF: '金ETF',
  Crypto: '暗号資産',
} as const;

const REGION_LABELS: Record<Region, string> = {
  US: 'アメリカ',
  JP: '日本',
  EU: 'ヨーロッパ',
  DM: '先進国',
  EM: '新興国',
  GL: 'グローバル',
} as const;

const CURRENCY_OPTIONS = [
  { value: 'JPY', label: 'JPY' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'BTC', label: 'BTC' },
  { value: 'ETH', label: 'ETH' },
] as const;


// フォーム状態の型定義
interface FormState {
  symbol: string;
  name: string;
  assetClass: AssetClass | undefined; 
  assetType: AssetType | undefined;
  region: Region | undefined;
  subCategory: string;
  currency: string;
  exchange: string;
  isin: string;
}

// ✅ 2. useState の初期値を正しい型に修正
const INITIAL_FORM_STATE: FormState = {
  symbol: '',
  name: '',
  assetClass: undefined,  // CamelCase統一
  assetType: undefined,
  region: undefined,
  subCategory: '',
  currency: 'JPY',
  exchange: '',
  isin: '',
};

// 送信データ構築のユーティリティ関数
const buildAssetPayload = (formState: FormState): AssetCreate => {
  // 🔧 修正: asset_class の undefined チェック
  if (!formState.assetClass) {
      throw new Error('Asset class is required');
  }

  const payload: AssetCreate = {
    name: formState.name.trim(),
    asset_class: formState.assetClass,  // ここでは必ず値が存在する
    currency: formState.currency
};

// オプション項目は値がある場合のみ追加
if (formState.symbol.trim()) payload.symbol = formState.symbol.trim();
if (formState.assetType) payload.asset_type = formState.assetType;
if (formState.region) payload.region = formState.region;
if (formState.subCategory.trim()) payload.sub_category = formState.subCategory.trim();
if (formState.exchange.trim()) payload.exchange = formState.exchange.trim();
if (formState.isin.trim()) payload.isin = formState.isin.trim();

return payload;
};

// フォームバリデーション関数
const validateForm = (formState: FormState): string | null => {
    if (!formState.name.trim()) return '名称は必須です';
    if (!formState.assetClass) return '資産クラスは必須です';  // ← 追加！
    if (formState.symbol.length > 20) return 'ティッカーは20文字以内で入力してください';
    if (formState.name.length > 200) return '名称は200文字以内で入力してください';
    if (formState.subCategory.length > 100) return 'サブカテゴリは100文字以内で入力してください';
    if (formState.exchange.length > 50) return '取引所は50文字以内で入力してください';
    if (formState.isin.length > 12) return 'ISINコードは12文字以内で入力してください';
    return null;
  };

// スピナーコンポーネント
const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
  );
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);

  // フォーム値更新のヘルパー関数（型安全）
  const updateFormField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // 資産クラス変更時の処理（CamelCase対応）
  const handleAssetClassChange = (assetClass: AssetClass) => {
    updateFormField('assetClass', assetClass);
    // 選択された資産クラスに対応しない資産タイプをリセット
    if (formState.assetType && !ASSET_TYPE_BY_CLASS[assetClass].includes(formState.assetType)) {
      updateFormField('assetType', undefined);
    }
  };

  // フォームリセット
  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
  };

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true);
        const res = await assetsAPI.list();
        setAssets(res);
      } catch (error) {
        console.error('Failed to fetch assets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    const validationError = validateForm(formState);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newAsset = buildAssetPayload(formState);
      await assetsAPI.create(newAsset);
      const res = await assetsAPI.list();
      setAssets(res);
      resetForm();
    } catch (error) {
      console.error("Asset creation failed:", error);
      alert('資産の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 楽観的UI更新による削除
  const handleDelete = async (id: string) => {
    if (!confirm('この資産を削除しますか？')) return;
    
    const originalAssets = assets;
    setAssets(assets.filter(asset => asset.id !== id));
    
    try {
      await assetsAPI.delete(id);
    } catch (error) {
      setAssets(originalAssets);
      console.error('Failed to delete asset:', error);
      alert('削除に失敗しました');
    }
  };

  // 選択可能な資産タイプ（CamelCaseキーで取得）
  // 🔧 修正前（エラーが発生する行）
  // const availableAssetTypes = ASSET_TYPE_BY_CLASS[formState.assetClass] || [];

  // 🔧 修正後（型安全な書き方）
  const availableAssetTypes = formState.assetClass ? ASSET_TYPE_BY_CLASS[formState.assetClass] : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 登録フォーム */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            新しい資産を登録
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* ティッカー */}
              <div className="space-y-2">
                <Label htmlFor="symbol">ティッカー</Label>
                <Input
                  id="symbol"
                  type="text"
                  value={formState.symbol}
                  onChange={(e) => updateFormField('symbol', e.target.value)}
                  placeholder="例: BTC, TSLA, 1306"
                  aria-label="ティッカーシンボル（任意）"
                />
              </div>

              {/* 名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formState.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  placeholder="例: ビットコイン, テスラ"
                  required
                  aria-label="資産名称（必須）"
                />
              </div>

              {/* 通貨 */}
              <div className="space-y-2">
                <Label htmlFor="currency">通貨</Label>
                <select
                  id="currency"
                  value={formState.currency}
                  onChange={(e) => updateFormField('currency', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="通貨選択"
                >
                  {CURRENCY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ 4. 資産クラス - フォームのselectのvalue, onChangeもCamelCaseに対応 */}
              <div className="space-y-2">
  <Label htmlFor="assetClass">資産クラス *</Label>
  <select
    id="assetClass"
    value={formState.assetClass ?? ''}
    onChange={(e) =>
      updateFormField('assetClass', e.target.value ? (e.target.value as AssetClass) : undefined)
    }
    required
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    aria-label="資産クラス選択（必須）"
  >
    <option value="">選択してください</option>
    <option value="CashEq">現金等価物</option>
    <option value="FixedIncome">債券</option>
    <option value="Equity">株式</option>
    <option value="RealAsset">実物資産</option>
    <option value="Crypto">暗号資産</option>
  </select>
</div>


              {/* 資産タイプ（型安全な undefined 処理） */}
              <div className="space-y-2">
                <Label htmlFor="assetType">資産タイプ</Label>
                <select
                  id="assetType"
                  value={formState.assetType ?? ''}
                  onChange={(e) => updateFormField('assetType', (e.target.value as AssetType) || undefined)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="資産タイプ選択（任意）"
                >
                  <option value="">選択してください</option>
                  {/* CamelCase値を使用 */}
                  {availableAssetTypes.map(type => (
                    <option key={type} value={type}>
                      {ASSET_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              {/* 地域（型安全な undefined 処理） */}
              <div className="space-y-2">
                <Label htmlFor="region">地域</Label>
                <select
                  id="region"
                  value={formState.region ?? ''}
                  onChange={(e) => updateFormField('region', (e.target.value as Region) || undefined)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="地域選択（任意）"
                >
                  <option value="">選択してください</option>
                  {/* CamelCase値を使用 */}
                  <option value="US">アメリカ</option>
                  <option value="JP">日本</option>
                  <option value="EU">ヨーロッパ</option>
                  <option value="DM">先進国</option>
                  <option value="EM">新興国</option>
                  <option value="GL">グローバル</option>
                </select>
              </div>

              {/* サブカテゴリ */}
              <div className="space-y-2">
                <Label htmlFor="subCategory">サブカテゴリ</Label>
                <Input
                  id="subCategory"
                  type="text"
                  value={formState.subCategory}
                  onChange={(e) => updateFormField('subCategory', e.target.value)}
                  placeholder="例: 大型成長株"
                  aria-label="サブカテゴリ（任意）"
                />
              </div>

              {/* 取引所 */}
              <div className="space-y-2">
                <Label htmlFor="exchange">取引所</Label>
                <Input
                  id="exchange"
                  type="text"
                  value={formState.exchange}
                  onChange={(e) => updateFormField('exchange', e.target.value)}
                  placeholder="例: NYSE, TSE"
                  aria-label="取引所（任意）"
                />
              </div>
            </div>

            {/* ISINコード */}
            <div className="space-y-2">
              <Label htmlFor="isin">ISINコード</Label>
              <Input
                id="isin"
                type="text"
                value={formState.isin}
                onChange={(e) => updateFormField('isin', e.target.value)}
                placeholder="例: US88160R1014"
                className="max-w-md"
                aria-label="ISINコード（任意）"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full md:w-auto"
              aria-label={isSubmitting ? '登録処理中' : '新しい資産を登録'}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">登録中...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  資産を登録
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 登録済み資産一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>登録済みの資産 ({assets.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              まだ資産が登録されていません
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        ティッカー
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        名称
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        資産クラス
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        資産タイプ
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        地域
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        通貨
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        取引所
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset, index) => (
                      <tr
                        key={asset.id}
                        className={`border-b transition-colors hover:bg-muted/50 ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                        title={`資産ID: ${asset.id} | ${asset.name}`}
                      >
                        <td className="h-12 px-4 align-middle">
                          <div className="font-mono font-medium text-foreground">
                            {asset.symbol || '-'}
                          </div>
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <div className="font-medium text-foreground max-w-[200px] truncate" title={asset.name}>
                            {asset.name}
                          </div>
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20">
                            {/* UI表示用ラベル（i18n対応予定） */}
                            {asset.asset_class ? ASSET_CLASS_LABELS[asset.asset_class] : '-'}
                          </span>
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/20">
                            {asset.asset_type ? ASSET_TYPE_LABELS[asset.asset_type] : '-'}
                          </span>
                        </td>
                        <td className="h-12 px-4 align-middle text-muted-foreground">
                          {asset.region ? REGION_LABELS[asset.region] : '-'}
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20">
                            {asset.currency}
                          </span>
                        </td>
                        <td className="h-12 px-4 align-middle text-muted-foreground">
                          {asset.exchange || '-'}
                        </td>
                        <td className="h-12 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(asset.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              aria-label={`${asset.name}を削除`}
                              title={`${asset.name}を削除`}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}