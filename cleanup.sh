#!/bin/bash

echo "🧹 完全クリーンアップを開始します..."

# 1. 全てのコンテナを停止・削除
echo "📦 コンテナを停止・削除中..."
docker-compose down -v --remove-orphans

# 2. 関連するボリュームを削除
echo "💾 ボリュームを削除中..."
docker volume rm $(docker volume ls -q | grep "asset.*dashboard" || echo "no_volumes") 2>/dev/null || true

# 3. 関連するイメージを削除
echo "🖼️ イメージを削除中..."
docker image rm $(docker images -q "*asset*dashboard*" || echo "no_images") 2>/dev/null || true

# 4. 未使用のボリューム・ネットワーク・イメージを削除
echo "🗑️ 未使用リソースを削除中..."
docker system prune -f
docker volume prune -f
docker network prune -f

# 5. ビルドキャッシュをクリア
echo "🔄 ビルドキャッシュをクリア中..."
docker builder prune -f

echo "✅ クリーンアップ完了！"
echo ""
echo "次のステップ:"
echo "1. .env ファイルを確認"
echo "2. docker-compose up --build -d で再構築"