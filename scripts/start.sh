#!/bin/bash
# Startup script that sets up environment and starts the application

# Set ONNX Runtime library path
export DYLD_LIBRARY_PATH="$(pwd)/native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/lib:$DYLD_LIBRARY_PATH"

echo "Starting Secure Browser..."
echo "   ONNX Runtime path: $(pwd)/native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/lib"

# Start Electron
npm start

