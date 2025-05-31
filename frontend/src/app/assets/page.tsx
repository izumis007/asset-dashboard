'use client'

import { useEffect, useState } from 'react'
import { assetsAPI } from '@/lib/api'
import { Asset, AssetCreate, AssetClass, AssetType, Region } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusIcon, TrashIcon, EditIcon, SaveIcon, XIcon, FolderIcon, TagIcon } from 'lucide-react'
import { ASSET_TYPE_BY_CLASS } from '@/constants/assetMapping'

// Enum定義（既存のものを使用）
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

// UI表示用のラベルマッピング
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

// 初期フォーム状態
const INITIAL_FORM_STATE: FormState = {
  symbol: '',
  name: '',
  assetClass: undefined,
  assetType: undefined,
  region: undefined,
  subCategory: '',
  currency: 'JPY',
  exchange: '',
  isin: '',
};

// 送信データ構築のユーティリティ関数
const buildAssetPayload = (formState: FormState): AssetCreate => {
  const payload: AssetCreate = {
    name: formState.name.trim(),
    asset_class: formState.assetClass!,
    currency: formState.currency
  };

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
  if (!formState.assetClass) return '資産クラスは必須です';
  if (formState.symbol.length > 20) return 'ティッカーは20文字以内で入力してください';
  if (formState.name.length > 200) return '名称は200文字以内で入力してください';
  if (formState.subCategory.length > 100) return 'サブカテゴリは100文字以内で入力してください';
  if (formState.exchange.length > 50) return '取引所は50文字以内で入力してください';
  if (formState.isin.length > 12) return 'ISINコードは12文字以内で入力してください';
  return null;
};

// Assetからフォーム状態への変換
const assetToFormState = (asset: Asset): FormState => ({
  symbol: asset.symbol || '',
  name: asset.name,
  assetClass: asset.asset_class,
  assetType: asset.asset_type || undefined,
  region: asset.region || undefined,
  subCategory: asset.sub_category || '',
  currency: asset.currency,
  exchange: asset.exchange || '',
  isin: asset.isin || '',
});

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
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // フォーム値更新のヘルパー関数
  const updateFormField = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // 資産クラス変更時の処理
  const handleAssetClassChange = (assetClass: AssetClass) => {
    updateFormField('assetClass', assetClass);
    if (formState.assetType && !ASSET_TYPE_BY_CLASS[assetClass].includes(formState.assetType)) {
      updateFormField('assetType', undefined);
    }
  };

  // フォームリセット
  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
    setEditingAsset(null);
    setShowAddForm(false);
  };

  // 編集開始
  const startEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormState(assetToFormState(asset));
    setShowAddForm(true);
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
    
    const validationError = validateForm(formState);
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingAsset) {
        // 更新処理
        const updateData = buildAssetPayload(formState);
        await assetsAPI.update(editingAsset.id, updateData);
      } else {
        // 新規作成処理
        const newAsset = buildAssetPayload(formState);
        await assetsAPI.create(newAsset);
      }
      
      const res = await assetsAPI.list();
      setAssets(res);
      resetForm();
    } catch (error) {
      console.error("Asset operation failed:", error);
      alert(editingAsset ? '資産の更新に失敗しました' : '資産の登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const availableAssetTypes = ASSET_TYPE_BY_CLASS[formState.assetClass!] || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 登録・編集フォーム */}
      {showAddForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingAsset ? (
                <>
                  <EditIcon className="h-5 w-5" />
                  資産情報を編集
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5" />
                  新しい資産を登録
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* 基本情報セクション */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FolderIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">基本情報</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 名称 */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                      名称 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formState.name}
                      onChange={(e) => updateFormField('name', e.target.value)}
                      placeholder="例: ビットコイン, テスラ"
                      required
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* ティッカー */}
                  <div className="space-y-2">
                    <Label htmlFor="symbol" className="text-sm font-medium text-foreground">
                      ティッカー
                    </Label>
                    <Input
                      id="symbol"
                      type="text"
                      value={formState.symbol}
                      onChange={(e) => updateFormField('symbol', e.target.value)}
                      placeholder="例: BTC, TSLA, 1306"
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* 通貨 */}
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-sm font-medium text-foreground">
                      通貨
                    </Label>
                    <select
                      id="currency"
                      value={formState.currency}
                      onChange={(e) => updateFormField('currency', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      {CURRENCY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 取引所 */}
                  <div className="space-y-2">
                    <Label htmlFor="exchange" className="text-sm font-medium text-foreground">
                      取引所
                    </Label>
                    <Input
                      id="exchange"
                      type="text"
                      value={formState.exchange}
                      onChange={(e) => updateFormField('exchange', e.target.value)}
                      placeholder="例: NYSE, TSE"
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* ISINコード */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="isin" className="text-sm font-medium text-foreground">
                      ISINコード
                    </Label>
                    <Input
                      id="isin"
                      type="text"
                      value={formState.isin}
                      onChange={(e) => updateFormField('isin', e.target.value)}
                      placeholder="例: US88160R1014"
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* 分類情報セクション */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <TagIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-primary">分類情報</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 資産クラス */}
                  <div className="space-y-2">
                    <Label htmlFor="assetClass" className="text-sm font-medium text-foreground">
                      資産クラス <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="assetClass"
                      value={formState.assetClass ?? ''}
                      onChange={(e) => handleAssetClassChange(e.target.value as AssetClass)}
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="">選択してください</option>
                      <option value="CashEq">現金等価物</option>
                      <option value="FixedIncome">債券</option>
                      <option value="Equity">株式</option>
                      <option value="RealAsset">実物資産</option>
                      <option value="Crypto">暗号資産</option>
                    </select>
                  </div>

                  {/* 資産タイプ */}
                  <div className="space-y-2">
                    <Label htmlFor="assetType" className="text-sm font-medium text-foreground">
                      資産タイプ
                    </Label>
                    <select
                      id="assetType"
                      value={formState.assetType ?? ''}
                      onChange={(e) => updateFormField('assetType', (e.target.value as AssetType) || undefined)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="">選択してください</option>
                      {availableAssetTypes.map(type => (
                        <option key={type} value={type}>
                          {ASSET_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 地域 */}
                  <div className="space-y-2">
                    <Label htmlFor="region" className="text-sm font-medium text-foreground">
                      地域
                    </Label>
                    <select
                      id="region"
                      value={formState.region ?? ''}
                      onChange={(e) => updateFormField('region', (e.target.value as Region) || undefined)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <option value="">選択してください</option>
                      <option value="US">アメリカ</option>
                      <option value="JP">日本</option>
                      <option value="EU">ヨーロッパ</option>
                      <option value="DM">先進国</option>
                      <option value="EM">新興国</option>
                      <option value="GL">グローバル</option>
                    </select>
                  </div>

                  {/* サブカテゴリ */}
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label htmlFor="subCategory" className="text-sm font-medium text-foreground">
                      サブカテゴリ
                    </Label>
                    <Input
                      id="subCategory"
                      type="text"
                      value={formState.subCategory}
                      onChange={(e) => updateFormField('subCategory', e.target.value)}
                      placeholder="例: 大型成長株, 高配当, インデックス"
                      className="focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* フォームボタン */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="min-w-[100px]"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  キャンセル
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      <span className="ml-2">{editingAsset ? '更新中...' : '登録中...'}</span>
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      {editingAsset ? '更新' : '登録'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 新規登録ボタン */}
      {!showAddForm && (
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">資産管理</h1>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            新しい資産を登録
          </Button>
        </div>
      )}

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
                              onClick={() => startEdit(asset)}
                              className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                              title={`${asset.name}を編集`}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(asset.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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