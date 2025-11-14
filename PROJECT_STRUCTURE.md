# Backbase Secure Runtime - Project Structure

## Recommended Project Template Structure

```
backbase-secure-runtime/
├── .github/
│   └── workflows/
│       ├── build.yml              # CI/CD pipeline
│       ├── test.yml               # Test automation
│       └── security-scan.yml      # Security scanning
│
├── .vscode/                       # VS Code settings (optional)
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json                # Debug configurations
│
├── docs/                          # Documentation
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── security-model.md
│   │   └── api-reference.md
│   ├── deployment/
│   │   ├── installation-guide.md
│   │   ├── update-procedures.md
│   │   └── troubleshooting.md
│   ├── development/
│   │   ├── setup-guide.md
│   │   ├── contributing.md
│   │   └── coding-standards.md
│   └── user-guide/
│       └── getting-started.md
│
├── src/                           # Main source code
│   ├── main/                      # Electron main process
│   │   ├── main.js                # Main entry point
│   │   ├── window-manager.js      # Browser window management
│   │   ├── security/
│   │   │   ├── origin-validator.js
│   │   │   ├── certificate-pinning.js
│   │   │   └── csp-enforcer.js
│   │   ├── session/
│   │   │   ├── session-manager.js
│   │   │   └── token-generator.js
│   │   └── updates/
│   │       ├── update-checker.js
│   │       └── update-installer.js
│   │
│   ├── preload/                   # Preload scripts (isolated context)
│   │   ├── preload.js             # Main preload script
│   │   └── bridge-api.js          # AI bridge API exposure
│   │
│   ├── renderer/                  # Renderer process code (if needed)
│   │   └── components/            # UI components (if any)
│   │
│   ├── native/                    # Native C++ modules (Node.js addons)
│   │   ├── slm-runtime/           # SLM runtime native module
│   │   │   ├── src/
│   │   │   │   ├── slm_bridge.cpp
│   │   │   │   ├── slm_bridge.h
│   │   │   │   ├── onnx_wrapper.cpp
│   │   │   │   └── tokenizer_wrapper.cpp
│   │   │   ├── binding.gyp        # Node-gyp build config
│   │   │   └── package.json
│   │   │
│   │   ├── rag-index/             # RAG index native module
│   │   │   ├── src/
│   │   │   │   ├── rag_bridge.cpp
│   │   │   │   ├── rag_bridge.h
│   │   │   │   ├── faiss_wrapper.cpp
│   │   │   │   └── embedding_generator.cpp
│   │   │   ├── binding.gyp
│   │   │   └── package.json
│   │   │
│   │   ├── secure-storage/        # Secure storage native module
│   │   │   ├── src/
│   │   │   │   ├── storage_bridge.cpp
│   │   │   │   ├── storage_bridge.h
│   │   │   │   ├── encryption.cpp
│   │   │   │   └── keychain.cpp
│   │   │   ├── binding.gyp
│   │   │   └── package.json
│   │   │
│   │   └── api-server/            # Localhost API server (C++)
│   │       ├── src/
│   │       │   ├── server.cpp
│   │       │   ├── server.h
│   │       │   ├── request_handler.cpp
│   │       │   ├── auth_handler.cpp
│   │       │   └── router.cpp
│   │       ├── CMakeLists.txt
│   │       └── package.json
│   │
│   ├── services/                  # High-level services
│   │   ├── slm-service.js         # SLM service wrapper
│   │   ├── rag-service.js         # RAG service wrapper
│   │   ├── storage-service.js     # Storage service wrapper
│   │   └── api-service.js         # API service coordinator
│   │
│   └── utils/                     # Utility functions
│       ├── logger.js              # Logging utilities
│       ├── config.js              # Configuration management
│       ├── errors.js              # Error handling
│       └── validators.js          # Validation utilities
│
├── test/                          # Tests
│   ├── unit/                      # Unit tests
│   │   ├── main/
│   │   ├── preload/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── integration/               # Integration tests
│   │   ├── api-server.test.js
│   │   ├── slm-runtime.test.js
│   │   └── end-to-end.test.js
│   │
│   ├── performance/               # Performance tests
│   │   ├── inference-benchmark.js
│   │   └── memory-profile.js
│   │
│   ├── security/                  # Security tests
│   │   ├── origin-validation.test.js
│   │   ├── certificate-pinning.test.js
│   │   └── csp-enforcement.test.js
│   │
│   └── fixtures/                  # Test fixtures
│       ├── models/                # Test model files
│       ├── documents/             # Test documents
│       └── configs/               # Test configurations
│
├── scripts/                       # Build and utility scripts
│   ├── build/
│   │   ├── build-native.sh        # Build native modules
│   │   ├── build-electron.sh      # Build Electron app
│   │   └── package-model.py       # Package SLM model
│   │
│   ├── dev/
│   │   ├── setup-dev-env.sh       # Development environment setup
│   │   ├── download-model.sh      # Download test models
│   │   └── start-dev-server.sh    # Start development server
│   │
│   ├── release/
│   │   ├── sign-binary.sh         # Code signing
│   │   ├── create-installer.sh    # Create installers
│   │   └── upload-release.sh      # Upload to CDN
│   │
│   └── tools/
│       ├── generate-cert.sh       # Generate certificates
│       └── validate-config.js     # Validate configuration
│
├── config/                        # Configuration files
│   ├── default.json               # Default configuration
│   ├── development.json           # Development overrides
│   ├── production.json            # Production overrides
│   └── allowed-origins.json       # Whitelisted origins
│
├── resources/                     # Application resources
│   ├── icons/                     # Application icons
│   │   ├── icon.ico               # Windows icon
│   │   ├── icon.icns              # macOS icon
│   │   └── icon.png               # Linux icon
│   │
│   ├── assets/                    # Other assets
│   │   ├── splash-screen.png
│   │   └── branding/
│   │
│   └── models/                    # Model files (gitignored, downloaded)
│       ├── phi4-mini-4bit.onnx
│       ├── embedding-model.onnx
│       └── tokenizer.model
│
├── native-libs/                   # Third-party native libraries
│   ├── onnxruntime/               # ONNX Runtime (downloaded)
│   ├── faiss/                     # FAISS (built from source)
│   └── openssl/                   # OpenSSL (system or bundled)
│
├── build/                         # Build output (gitignored)
│   ├── dist/                      # Distribution packages
│   ├── out/                       # Compiled output
│   └── cache/                     # Build cache
│
├── .gitignore
├── .npmignore
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .clang-format                  # C++ code formatting
├── .clang-tidy                    # C++ static analysis
│
├── package.json                   # Node.js package configuration
├── package-lock.json              # Dependency lock file
├── CMakeLists.txt                 # CMake configuration (for native modules)
├── electron-builder.yml           # Electron Builder configuration
├── tsconfig.json                  # TypeScript configuration (if using TS)
│
├── README.md                      # Project README
├── CONTRIBUTING.md                # Contribution guidelines
├── LICENSE                        # License file
└── CHANGELOG.md                   # Version changelog
```

## Detailed File Descriptions

### Root Level Files

**package.json**
```json
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
    "format": "prettier --write \"src/**/*.{js,json}\"",
    "postinstall": "node scripts/build/build-native.js"
  },
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
```

**electron-builder.yml**
```yaml
appId: com.backbase.secure-runtime
productName: Backbase Secure Runtime
directories:
  output: build/dist
  buildResources: resources
files:
  - src/**/*
  - package.json
  - "!**/*.{md,ts,map}"
extraResources:
  - from: native-libs
    to: native-libs
win:
  target: nsis
  icon: resources/icons/icon.ico
mac:
  target: dmg
  icon: resources/icons/icon.icns
  category: public.app-category.business
linux:
  target: [AppImage, deb, rpm]
  icon: resources/icons/icon.png
  category: Office
```

### Source Code Structure Details

#### Main Process (`src/main/`)

**main.js** - Entry point
- Initializes Electron app
- Sets up security policies
- Creates browser windows
- Manages application lifecycle

**window-manager.js** - Window management
- Creates and manages BrowserWindow instances
- Handles window events
- Manages window state

**security/** - Security modules
- `origin-validator.js`: Validates origins against whitelist
- `certificate-pinning.js`: Implements certificate pinning
- `csp-enforcer.js`: Enforces Content Security Policy

#### Preload Scripts (`src/preload/`)

**preload.js** - Main preload script
- Runs in isolated context
- Exposes secure APIs via contextBridge
- Provides bridge to main process

**bridge-api.js** - AI bridge API
- Exposes `window.backbaseAI` object
- Implements query, search, escalate methods
- Handles authentication and error handling

#### Native Modules (`src/native/`)

Each native module follows this structure:
```
module-name/
├── src/              # C++ source files
├── binding.gyp       # Node-gyp build configuration
├── package.json      # Module package.json
└── README.md         # Module documentation
```

**binding.gyp example:**
```json
{
  "targets": [
    {
      "target_name": "slm_runtime",
      "sources": [
        "src/slm_bridge.cpp",
        "src/onnx_wrapper.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "src",
        "<(module_root_dir)/native-libs/onnxruntime/include"
      ],
      "libraries": [
        "<(module_root_dir)/native-libs/onnxruntime/lib/onnxruntime.lib"
      ],
      "cflags": ["-std=c++20", "-O3"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"]
    }
  ]
}
```

#### Services (`src/services/`)

High-level service wrappers that:
- Provide JavaScript API for native modules
- Handle error translation
- Manage service lifecycle
- Provide async/await interfaces

#### Utilities (`src/utils/`)

**logger.js** - Structured logging
```javascript
const winston = require('winston');

module.exports = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**config.js** - Configuration management
- Loads configuration from files
- Merges environment-specific overrides
- Validates configuration
- Provides type-safe access

### Test Structure

**Unit Tests** - Test individual modules in isolation
- Mock dependencies
- Fast execution
- High coverage

**Integration Tests** - Test module interactions
- Test native module integration
- Test API server
- Test end-to-end flows

**Performance Tests** - Benchmark critical paths
- Inference latency
- Memory usage
- Throughput

**Security Tests** - Validate security controls
- Origin validation
- Certificate pinning
- CSP enforcement
- Authentication

### Build Scripts

**scripts/build/build-native.sh**
```bash
#!/bin/bash
# Build all native modules

cd src/native/slm-runtime
node-gyp rebuild

cd ../rag-index
node-gyp rebuild

cd ../secure-storage
node-gyp rebuild

cd ../api-server
mkdir -p build && cd build
cmake .. && cmake --build .
```

**scripts/dev/setup-dev-env.sh**
```bash
#!/bin/bash
# Setup development environment

# Install Node.js dependencies
npm install

# Download ONNX Runtime
./scripts/dev/download-onnxruntime.sh

# Build FAISS
./scripts/dev/build-faiss.sh

# Build native modules
npm run build:native

echo "Development environment ready!"
```

### Configuration Files

**config/default.json**
```json
{
  "app": {
    "name": "Backbase Secure Runtime",
    "version": "1.0.0"
  },
  "security": {
    "allowedOrigins": [
      "https://*.backbase.com",
      "https://*.backbase.io"
    ],
    "certificatePinning": {
      "enabled": true,
      "pins": []
    },
    "csp": {
      "enabled": true,
      "policy": "default-src 'self'; script-src 'self' 'unsafe-inline';"
    }
  },
  "slm": {
    "modelPath": "./resources/models/phi4-mini-4bit.onnx",
    "maxTokens": 512,
    "temperature": 0.7
  },
  "api": {
    "port": 8443,
    "host": "127.0.0.1",
    "tls": {
      "enabled": true,
      "certPath": "./config/certs/server.crt",
      "keyPath": "./config/certs/server.key"
    }
  }
}
```

## Development Workflow

1. **Initial Setup**
   ```bash
   git clone <repo>
   cd backbase-secure-runtime
   npm install
   ./scripts/dev/setup-dev-env.sh
   ```

2. **Development**
   ```bash
   npm run dev          # Start in development mode
   npm test            # Run tests
   npm run lint        # Lint code
   ```

3. **Building**
   ```bash
   npm run build:native  # Build native modules
   npm run build        # Build Electron app
   ```

4. **Testing**
   ```bash
   npm test            # All tests
   npm run test:unit   # Unit tests only
   npm run test:integration  # Integration tests
   ```

## Key Design Decisions

1. **Separation of Concerns**
   - Main process: Application logic, security, window management
   - Preload: Secure API bridge
   - Native modules: Performance-critical operations
   - Services: High-level abstractions

2. **Security First**
   - All security code in dedicated modules
   - Clear separation between trusted and untrusted code
   - Comprehensive security testing

3. **Maintainability**
   - Clear folder structure
   - Comprehensive documentation
   - Consistent naming conventions
   - Modular architecture

4. **Build System**
   - Native modules built separately
   - Electron app packaged with electron-builder
   - CI/CD integration ready

This structure provides a solid foundation for implementing the Intelligent Employee Browser project while maintaining code organization, security, and maintainability.

