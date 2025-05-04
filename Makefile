# Project Management App Makefile

# Clean build artifacts and dependencies
clean:
	@echo "Cleaning project..."
	rm -rf node_modules
	rm -rf .nuxt
	rm -rf .output
	rm -rf dist
	rm -rf .cache
	rm -f package-lock.json
	rm -f yarn.lock
	rm -f pnpm-lock.yaml
	@echo "Clean complete!"

# Install dependencies
install:
	npm install

# Dev server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Start production server
start:
	npm run start

# Linting
lint:
	npm run lint

.PHONY: clean install dev build start lint
