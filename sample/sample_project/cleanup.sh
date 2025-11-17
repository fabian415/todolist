#!/bin/bash

echo "==> 開始清理..."

# 取得腳本所在目錄的父目錄
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 讀取 .env 中的 APP_NAME 和 APP_VERSION
if [ -f "$SCRIPT_DIR/etc/.env" ]; then
  source "$SCRIPT_DIR/etc/.env"
else
  echo "錯誤：找不到 $SCRIPT_DIR/etc/.env 檔案"
  exit 1
fi

if [ -z "$APP_NAME" ]; then
  echo "錯誤：.env 中沒有設定 APP_NAME"
  exit 1
fi

if [ -z "$APP_VERSION" ]; then
  echo "錯誤：.env 中沒有設定 APP_VERSION"
  exit 1
fi

echo "APP_NAME: ${APP_NAME}"
echo "APP_VERSION: ${APP_VERSION}"
echo ""

# 確認是否繼續
read -p "確定要清理 ${APP_NAME} 相關的資源嗎？ (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "取消清理"
  exit 0
fi

echo ""

# 1. 清理專案檔案
echo "1. 清理專案中間檔案..."
cd "$SCRIPT_DIR"
rm -rf build staging *.tgz
rm -rf frontend/build
echo "   ✅ 專案檔案清理完成"

# 2. 停止並刪除所有相關容器
echo "2. 停止並刪除容器..."

# 找出所有包含 APP_NAME 的容器
CONTAINERS=$(docker ps -a | grep "${APP_NAME}" | awk '{print $NF}')

if [ -n "$CONTAINERS" ]; then
  for container in $CONTAINERS; do
    echo "   停止並刪除容器: $container"
    docker stop "$container" 2>/dev/null
    docker rm "$container" 2>/dev/null
  done
else
  echo "   沒有找到 ${APP_NAME} 相關的容器"
fi
echo "   ✅ 容器清理完成"

# 3. 清理所有相關 Docker Images
echo "3. 清理 Docker Images..."

# 找出所有包含 APP_NAME 的 images
if docker images | grep -q "${APP_NAME}"; then
  echo "   刪除所有 ${APP_NAME} 相關的 Images..."
  docker images | grep "${APP_NAME}" | awk '{print $1":"$2}' | xargs -r docker rmi -f 2>/dev/null || true
else
  echo "   沒有找到 ${APP_NAME} 相關的 Images"
fi
echo "   ✅ Docker Images 清理完成"

# 4. 顯示清理結果
echo ""
echo "==> 清理完成！"
echo ""
echo "剩餘的容器："
docker ps -a | grep -E "CONTAINER|${APP_NAME}" || echo "   無相關容器"
echo ""
echo "剩餘的 Images："
docker images | grep -E "REPOSITORY|${APP_NAME}" || echo "   無相關 Images"
echo ""
echo "Docker 使用狀況："
docker system df