# Stage 1: 建置前端
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# 複製前端的 package.json
COPY frontend/package*.json ./
RUN npm ci

# 複製前端所有檔案並建置
COPY frontend/ ./
RUN npm run build

# Stage 2: 建置後端 + 整合前端
FROM node:18-alpine

WORKDIR /app

# 安裝後端依賴
COPY backend/package*.json ./
RUN npm ci --only=production

# 複製後端程式碼
COPY backend/ ./

# 從 Stage 1 複製建置好的前端檔案
COPY --from=frontend-builder /frontend/build ./frontend-build

# 暴露 port
EXPOSE 3000

# 啟動後端（會同時服務前端）
CMD ["node", "server.js"]