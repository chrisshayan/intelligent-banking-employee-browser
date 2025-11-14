#!/bin/bash
# Script to create the project folder structure for Backbase Secure Runtime

set -e

PROJECT_ROOT="."

echo "Creating project structure for Backbase Secure Runtime..."

# Create main directories
mkdir -p .github/workflows
mkdir -p .vscode
mkdir -p docs/{architecture,deployment,development,user-guide}
mkdir -p src/{main/{security,session,updates},preload,renderer/components,native/{slm-runtime/src,rag-index/src,secure-storage/src,api-server/src},services,utils}
mkdir -p test/{unit/{main,preload,services,utils},integration,performance,security,fixtures/{models,documents,configs}}
mkdir -p scripts/{build,dev,release,tools}
mkdir -p config
mkdir -p resources/{icons,assets/branding,models}
mkdir -p native-libs/{onnxruntime,faiss,openssl}
mkdir -p build/{dist,out,cache}

echo "✓ Directory structure created"

# Create placeholder files
touch src/main/main.js
touch src/main/window-manager.js
touch src/main/security/origin-validator.js
touch src/main/security/certificate-pinning.js
touch src/main/security/csp-enforcer.js
touch src/main/session/session-manager.js
touch src/main/session/token-generator.js
touch src/main/updates/update-checker.js
touch src/main/updates/update-installer.js

touch src/preload/preload.js
touch src/preload/bridge-api.js

touch src/services/slm-service.js
touch src/services/rag-service.js
touch src/services/storage-service.js
touch src/services/api-service.js

touch src/utils/logger.js
touch src/utils/config.js
touch src/utils/errors.js
touch src/utils/validators.js

touch config/default.json
touch config/development.json
touch config/production.json
touch config/allowed-origins.json

echo "✓ Placeholder files created"

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Build outputs
build/
dist/
out/
*.log

# Native libraries (downloaded)
native-libs/onnxruntime/
native-libs/faiss/
native-libs/openssl/

# Model files (large, downloaded separately)
resources/models/*.onnx
resources/models/*.model
resources/models/*.bin

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Test coverage
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
EOF

echo "✓ .gitignore created"

# Create basic package.json template
cat > package.json << 'EOF'
{
  "name": "backbase-secure-runtime",
  "version": "1.0.0",
  "description": "Backbase Secure Runtime - Intelligent Employee Browser",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build": "electron-builder",
    "build:native": "node scripts/build/build-native.js",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "eslint src test",
    "format": "prettier --write \"src/**/*.{js,json}\""
  },
  "keywords": [
    "electron",
    "browser",
    "ai",
    "slm"
  ],
  "author": "Backbase",
  "license": "PROPRIETARY",
  "dependencies": {
    "electron": "^28.0.0",
    "electron-updater": "^6.1.0"
  },
  "devDependencies": {
    "electron-builder": "^24.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
EOF

echo "✓ package.json created"

# Create README template
cat > README.md << 'EOF'
# Backbase Secure Runtime

Intelligent Employee Browser with on-device AI capabilities.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup development environment:
   ```bash
   ./scripts/dev/setup-dev-env.sh
   ```

3. Start development:
   ```bash
   npm run dev
   ```

## Building

Build native modules:
```bash
npm run build:native
```

Build Electron app:
```bash
npm run build
```

## Testing

Run all tests:
```bash
npm test
```

Run unit tests:
```bash
npm run test:unit
```

## Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed project structure documentation.
EOF

echo "✓ README.md created"

echo ""
echo "Project structure created successfully!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: ./scripts/dev/setup-dev-env.sh"
echo "3. Start developing!"
echo ""

