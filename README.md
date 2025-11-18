# Bank Secure Runtime

Custom browser with on-device AI for Bank applications.

## Overview

Secure Electron-based browser that runs a local Small Language Model (SLM) to provide AI features directly on the employee's machine. All processing happens locally - no data leaves the device.

## Features

- **On-device AI**: Local SLM inference using ONNX Runtime
- **RAG Search**: Vector-based document search with FAISS
- **Smart Coach**: Instant answers from bank documentation
- **Email Assistant**: Context-aware email generation
- **Campaign Generator**: Multi-channel marketing content
- **Product Advisor**: Personalized product recommendations
- **Compliance Checker**: Real-time compliance verification

## Quick Start

### Prerequisites

- Node.js 18+
- macOS (for native module builds)
- Xcode command-line tools: `xcode-select --install`

### Installation

```bash
npm install
```

### Development

```bash
# Set library path (required for ONNX Runtime)
export DYLD_LIBRARY_PATH=./native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/lib:$DYLD_LIBRARY_PATH

# Start the app
npm start
```

Or use the startup script:
```bash
./scripts/start.sh
```

### Building Native Modules

```bash
npm run build:native
```

Note: Requires Xcode license acceptance: `sudo xcodebuild -license`

## Project Structure

```
src/
├── main/              # Electron main process
│   ├── api/          # API routes and handlers
│   ├── security/     # Security policies
│   └── session/      # Session management
├── preload/          # Preload scripts (bridge API)
├── services/         # Core services (SLM, RAG, etc.)
├── features/         # MVP features
│   ├── smart-coach/
│   ├── email-assistant/
│   ├── campaign-generator/
│   ├── product-advisor/
│   └── compliance-checker/
└── native/           # Native C++ modules
    ├── slm-runtime/  # ONNX Runtime integration
    └── rag-index/    # FAISS integration
```

## Configuration

Edit `config/development.json` or `config/production.json`:

- `app.startUrl`: Initial URL to load
- `security.allowedOrigins`: Whitelisted origins
- `api.port`: Localhost API server port (default: 8443)
- `slm.modelPath`: Path to ONNX model file

## API Usage

The browser exposes a JavaScript API to web pages:

```javascript
// Smart Coach
const result = await window.smartCoach.ask("What are the requirements for Premium Savings?");

// Email Assistant
const email = await window.smartCoach.generateEmail({
  clientName: "John Doe",
  purpose: "product recommendation",
  tone: "professional"
});

// Campaign Generator
const campaign = await window.smartCoach.generateCampaign({
  campaignName: "Summer Campaign",
  objective: "product launch",
  channels: ['email', 'sms']
});

// Product Recommendations
const recommendations = await window.smartCoach.recommendProducts({
  clientId: "CLIENT123",
  profile: { balance: 150000, tier: "Premium" }
});

// Compliance Check
const check = await window.smartCoach.checkCompliance({
  content: "Get guaranteed returns!",
  contentType: "email"
});
```

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration
```

## Building for Production

```bash
npm run build
```

Outputs platform-specific installers in `build/dist/`.

## Security

- Origin validation (only Bank domains)
- Content Security Policy enforcement
- Certificate pinning
- Process isolation
- Encrypted local storage

## Development Notes

- Native modules require rebuilding after Node.js version changes
- Model files should be placed in `resources/models/`
- API server runs on `https://localhost:8443` (self-signed cert in dev)

