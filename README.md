# Backbase Secure Runtime

Intelligent Employee Browser with on-device AI capabilities.

## Overview

Backbase Secure Runtime is a custom, secure browser environment designed exclusively for bank employees. It provides a seamless, AI-enhanced experience for all Backbase applications while ensuring the highest levels of data privacy and security through on-device AI processing.

## Features

- **On-Device AI Processing**: Small Language Model (SLM) runs locally on the user's machine
- **Secure Architecture**: Hardened Electron-based browser with comprehensive security controls
- **Origin Validation**: Only Backbase applications can access the AI bridge
- **Content Security Policy**: Strict CSP enforcement for all web content
- **Certificate Pinning**: Enhanced security for Backbase domains
- **Privacy-First**: Sensitive data never leaves the device

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd backbase-secure-runtime
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

   Or in development mode (with DevTools):
   ```bash
   npm run dev
   ```

### Project Structure

```
backbase-secure-runtime/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js        # Application entry point
│   │   ├── window-manager.js
│   │   ├── security/      # Security modules
│   │   └── session/       # Session management
│   ├── preload/           # Preload scripts
│   ├── services/          # High-level services
│   └── utils/             # Utility functions
├── config/                # Configuration files
├── test/                  # Tests
└── resources/             # Application resources
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed structure documentation.

## Configuration

Configuration files are located in the `config/` directory:

- `default.json` - Default configuration
- `development.json` - Development overrides
- `production.json` - Production overrides

Key configuration options:

- **Security**: Allowed origins, CSP policy, certificate pinning
- **SLM**: Model path, inference parameters
- **API**: Localhost API server configuration

## Building

### Build Native Modules

```bash
npm run build:native
```

> **macOS prerequisites:** installing/building native modules requires the Xcode
> command-line tools and an accepted license. Run `xcode-select --install` and
> `sudo xcodebuild -license` once per machine.

### Build Electron App

```bash
npm run build
```

This will create platform-specific installers in `build/dist/`.

## Testing

Run all tests:
```bash
npm test
```

Run unit tests only:
```bash
npm run test:unit
```

Run integration tests:
```bash
npm run test:integration
```

## Development

### Code Quality

Lint code:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

### Testing the Application

1. Start the app: `npm start` or `npm run dev`
2. The app will open with a test page (in development mode)
3. Check the browser console to see if the `backbaseAI` bridge is loaded
4. Test the API by clicking the test buttons on the test page

## Current Status

### ✅ Completed

- Project structure
- Basic Electron application
- Security foundation:
  - Origin validation
  - CSP enforcement
  - Certificate pinning (framework)
- Session management
- JavaScript bridge (preload script)
- Configuration system

### 🚧 In Progress

- Localhost API server
- SLM runtime integration
- RAG implementation

### 📋 Planned

- Native module implementation
- MVP features (Smart Coach, Email Assistant, etc.)
- Comprehensive testing
- Deployment packaging

## Architecture

The application is built on:

- **Electron**: Browser framework
- **Node.js**: Runtime environment
- **ONNX Runtime**: SLM inference (planned)
- **FAISS**: Vector search (planned)

See [PROJECT_PROPOSAL.md](./PROJECT_PROPOSAL.md) for detailed architecture documentation.

## Security

Security is a top priority. The application implements:

- Origin-based access control
- Content Security Policy enforcement
- Certificate pinning for Backbase domains
- Secure session management
- Encrypted local storage (planned)
- Process isolation and sandboxing

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

PROPRIETARY - Backbase Internal Use Only

## Support

For issues and questions, please contact the development team.

---

**Note**: This is an early-stage project. Many features are still in development. See [NEXT_STEPS.md](./NEXT_STEPS.md) for the implementation roadmap.
