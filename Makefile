# 讀取 .env 檔案
include .env
export

# 安裝檔名稱
INSTALL_NAME = ${APP_NAME}_v${APP_VERSION}_setup.run

# 安裝路徑
INSTALL_PATH = $(HOME)/Advantech/GenAI-Studio-Apps/${APP_NAME}

# 默認目標
all: build installer

# 顯示幫助信息
help:
	@echo "GenAI Studio App - React 版本"
	@echo ""
	@echo "可用命令："
	@echo "  make help          - 顯示此幫助信息"
	@echo "  make build         - 構建 Docker 映像並保存為 tar"
	@echo "  make installer     - 創建 .run 安裝器（用於部署）"
	@echo "  make dev-package   - 創建開發者源碼壓縮包"
	@echo "  make up            - 啟動 Docker Compose 服務"
	@echo "  make down          - 停止 Docker Compose 服務"
	@echo "  make restart       - 重啟 Docker Compose 服務"
	@echo "  make logs          - 查看容器日誌（實時）"
	@echo "  make clean         - 清理構建產物（保留 images/）"
	@echo "  make clean-all     - 完整清理（包含 Docker 映像）"
	@echo ""
	@echo "APP_NAME: ${APP_NAME}"
	@echo "APP_VERSION: ${APP_VERSION}"

# 構建 Docker 映像
build:
	@echo "==> Building unified Docker image..."
	@echo "APP_NAME: ${APP_NAME}"
	@echo "APP_VERSION: ${APP_VERSION}"
	@if [ ! -f Dockerfile ]; then echo "Error: Dockerfile not found in project root"; exit 1; fi
	@if [ ! -f backend/server.js ]; then echo "Error: backend/server.js not found"; exit 1; fi
	@if [ ! -f frontend/package.json ]; then echo "Error: frontend/package.json not found"; exit 1; fi
	docker build -t ${APP_NAME}:${APP_VERSION} .
	@echo "==> Saving image to tar..."
	@mkdir -p images
	docker save -o images/${APP_NAME}_${APP_VERSION}.tar ${APP_NAME}:${APP_VERSION}
	@sleep 2
	@echo "Docker image built and saved successfully."

# 創建 staging 目錄（只給 .run 安裝器用）
staging:
	@echo "==> Constructing staging area..."
	@rm -rf staging
	@mkdir -p staging/etc staging/images staging/bin
	@if [ ! -f docker-compose.yml ]; then echo "Error: docker-compose.yml not found"; exit 1; fi
	@if [ ! -f .env ]; then echo "Error: .env not found"; exit 1; fi
	@cp docker-compose.yml staging/etc/
	@echo "==> Converting .env to production configuration..."
	@cp .env staging/etc/.env
	@echo "==> Replacing development values with production values..."
	@sed -i 's|GAIS_HOST=.*|GAIS_HOST=gais_core_server|g' staging/etc/.env
	@sed -i 's|OLLAMA_HOST=.*|OLLAMA_HOST=http://ollama:11434|g' staging/etc/.env
	@sed -i 's|APP_HOST=.*|APP_HOST=backend|g' staging/etc/.env
	@echo "" >> staging/etc/.env
	@echo "# 註冊到 GenAI Studio 時使用的 URL" >> staging/etc/.env
	@echo "# 🐳 生產環境：使用 Docker 網路內的容器名稱" >> staging/etc/.env
	@echo "# GenAI Studio 和應用都在 gais-network 中，可以互相訪問" >> staging/etc/.env
	@echo 'APP_REGISTER_URL=http://$${APP_NAME}-app:3000' >> staging/etc/.env
	@cp cleanup.sh staging/bin/
	@if ls images/*.tar >/dev/null 2>&1; then cp images/*.tar staging/images/; else echo "Error: No .tar files found in images/"; exit 1; fi
	@chmod 0644 staging/etc/* 2>/dev/null || true
	@chmod 0644 staging/etc/.env 2>/dev/null || true
	@chmod 0755 staging/bin/* 2>/dev/null || true
	@echo "==> Verifying staging files..."
	@ls -la staging/etc/
	@ls -la staging/images/
	@ls -la staging/bin/
	@echo "==> Production .env preview:"
	@grep -E "GAIS_HOST|OLLAMA_HOST|APP_HOST|APP_REGISTER_URL" staging/etc/.env
	@echo "Staging area constructed."

# 創建給開發者用的完整專案壓縮包
dev-package:
	@echo "==> Creating developer package..."
	@tar -zcf react_template.tgz \
		--exclude='build' \
		--exclude='staging' \
		--exclude='images' \
		--exclude='node_modules' \
		--exclude='frontend/node_modules' \
		--exclude='backend/node_modules' \
		--exclude='frontend/build' \
		--exclude='.git' \
		--exclude='*.tgz' \
		--exclude='*.run' \
		--warning=no-file-changed \
		backend/ frontend/ Makefile .env cleanup.sh docker-compose.yml Dockerfile
	@echo "==> Developer package created at react_template.tgz"

# 創建安裝器（給部署用）
installer: staging
	@echo "==> Creating installer..."
	@rm -rf build
	@mkdir -p build
	@echo '#!/bin/bash' > build/$(INSTALL_NAME)
	@echo 'set -e' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '# Check dependencies' >> build/$(INSTALL_NAME)
	@echo "command -v docker >/dev/null 2>&1 || { echo 'Error: docker is not installed.' >&2; exit 1; }" >> build/$(INSTALL_NAME)
	@echo 'if command -v docker-compose >/dev/null 2>&1; then' >> build/$(INSTALL_NAME)
	@echo '  DOCKER_COMPOSE="docker-compose"' >> build/$(INSTALL_NAME)
	@echo 'elif docker compose version >/dev/null 2>&1; then' >> build/$(INSTALL_NAME)
	@echo '  DOCKER_COMPOSE="docker compose"' >> build/$(INSTALL_NAME)
	@echo 'else' >> build/$(INSTALL_NAME)
	@echo '  echo "Error: docker-compose or docker compose plugin is not installed." >&2' >> build/$(INSTALL_NAME)
	@echo '  exit 1' >> build/$(INSTALL_NAME)
	@echo 'fi' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '# Extract embedded tarball' >> build/$(INSTALL_NAME)
	@echo "TMPDIR=\$$(mktemp -d)" >> build/$(INSTALL_NAME)
	@echo "trap 'rm -rf \$$TMPDIR' EXIT" >> build/$(INSTALL_NAME)
	@echo 'ARCHIVE=$$(awk '"'"'/^__ARCHIVE_BELOW__/ {print NR + 1; exit 0; }'"'"' $$0)' >> build/$(INSTALL_NAME)
	@echo "tail -n+\$$ARCHIVE \$$0 | tar -zx -C \$$TMPDIR" >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '# Setup installation path' >> build/$(INSTALL_NAME)
	@echo 'INSTALL_PATH=$${HOME}/Advantech/GenAI-Studio-Apps/${APP_NAME}' >> build/$(INSTALL_NAME)
	@echo 'mkdir -p $${INSTALL_PATH}/{etc,images,bin}' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '# Copy files' >> build/$(INSTALL_NAME)
	@echo 'cp -r $$TMPDIR/etc/. $${INSTALL_PATH}/etc/' >> build/$(INSTALL_NAME)
	@echo 'cp -r $$TMPDIR/images/* $${INSTALL_PATH}/images/' >> build/$(INSTALL_NAME)
	@echo 'cp -r $$TMPDIR/bin/* $${INSTALL_PATH}/bin/' >> build/$(INSTALL_NAME)
	@echo 'chmod +x $${INSTALL_PATH}/bin/*' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '# Load docker images' >> build/$(INSTALL_NAME)
	@echo 'cd $${INSTALL_PATH}/images' >> build/$(INSTALL_NAME)
	@echo 'for tar in *.tar; do' >> build/$(INSTALL_NAME)
	@echo '  echo "Loading $$tar..."' >> build/$(INSTALL_NAME)
	@echo '  docker load -i $$tar' >> build/$(INSTALL_NAME)
	@echo 'done' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '# Create start script' >> build/$(INSTALL_NAME)
	@echo 'cat > $${INSTALL_PATH}/bin/start.sh <<'"'"'EOFSTART'"'"'' >> build/$(INSTALL_NAME)
	@echo '#!/bin/bash' >> build/$(INSTALL_NAME)
	@echo 'cd $${HOME}/Advantech/GenAI-Studio-Apps/${APP_NAME}/etc' >> build/$(INSTALL_NAME)
	@echo 'if command -v docker-compose >/dev/null 2>&1; then' >> build/$(INSTALL_NAME)
	@echo '  docker-compose --env-file .env -f docker-compose.yml up -d' >> build/$(INSTALL_NAME)
	@echo 'else' >> build/$(INSTALL_NAME)
	@echo '  docker compose --env-file .env -f docker-compose.yml up -d' >> build/$(INSTALL_NAME)
	@echo 'fi' >> build/$(INSTALL_NAME)
	@echo 'if [ $? -ne 0 ]; then' >> build/$(INSTALL_NAME)
	@echo '  echo "Failed to start containers"' >> build/$(INSTALL_NAME)
	@echo '  exit 1' >> build/$(INSTALL_NAME)
	@echo 'fi' >> build/$(INSTALL_NAME)
	@echo 'echo "Containers started successfully"' >> build/$(INSTALL_NAME)
	@echo 'EOFSTART' >> build/$(INSTALL_NAME)
	@echo 'chmod +x $${INSTALL_PATH}/bin/start.sh' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '# Create network' >> build/$(INSTALL_NAME)
	@echo 'docker network create gais-network 2>/dev/null || true' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '# Start containers' >> build/$(INSTALL_NAME)
	@echo 'cd $${INSTALL_PATH}/etc' >> build/$(INSTALL_NAME)
	@echo '$$DOCKER_COMPOSE --env-file .env -f docker-compose.yml up -d' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo 'echo "Installation completed successfully!"' >> build/$(INSTALL_NAME)
	@echo 'echo "Installation path: $${INSTALL_PATH}"' >> build/$(INSTALL_NAME)
	@echo 'echo "To start: $${INSTALL_PATH}/bin/start.sh"' >> build/$(INSTALL_NAME)
	@echo 'echo "To cleanup: $${INSTALL_PATH}/bin/cleanup.sh"' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo 'exit 0' >> build/$(INSTALL_NAME)
	@echo '' >> build/$(INSTALL_NAME)
	@echo '__ARCHIVE_BELOW__' >> build/$(INSTALL_NAME)
	@tar -zcf - -C staging . --warning=no-file-changed >> build/$(INSTALL_NAME)
	@chmod +x build/$(INSTALL_NAME)
	@echo "==> Installer created at build/$(INSTALL_NAME)"

# 清理(保留 images 資料夾)
clean:
	@echo "==> Cleaning up (keeping images/)..."
	@rm -rf build staging react_template.tgz
	@rm -rf frontend/build
	@echo "Cleanup completed (images/ preserved)."

# 完整清理(包含 images)
clean-all:
	@echo "==> Full cleanup..."
	@rm -rf build staging images react_template.tgz
	@rm -rf frontend/build
	@docker rmi ${APP_NAME}:${APP_VERSION} 2>/dev/null || true
	@docker rm -f ${APP_NAME}-app 2>/dev/null || true
	@docker image prune -f
	@docker container prune -f
	@docker builder prune -f
	@echo "Full cleanup completed."
	@echo ""
	@echo "Current Docker usage:"
	@docker system df

# 啟動應用
up:
	@echo "==> Starting application..."
	@if [ ! -f docker-compose.yml ]; then echo "Error: docker-compose.yml not found"; exit 1; fi
	@docker-compose up -d
	@echo "Application started."

# 停止應用
down:
	@echo "==> Stopping application..."
	@docker-compose down
	@echo "Application stopped."

# 重啟應用
restart:
	@echo "==> Restarting application..."
	docker-compose restart
	@echo "Application restarted."

# 查看日誌（實時）
logs:
	@echo "==> Showing logs (press Ctrl+C to exit)..."
	docker-compose logs -f

.PHONY: all help build installer staging dev-package up down restart logs clean clean-all