# Testing Guide

## Quick Start Testing

### 1. Test Native Modules
```bash
export DYLD_LIBRARY_PATH=./native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/lib:$DYLD_LIBRARY_PATH
npm run test:native
```

### 2. Test Services
```bash
export DYLD_LIBRARY_PATH=./native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/lib:$DYLD_LIBRARY_PATH
npm run test:services
```

### 3. Start Application
```bash
./scripts/start.sh
# or manually:
export DYLD_LIBRARY_PATH=./native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/lib:$DYLD_LIBRARY_PATH
npm start
```

### 4. Test API (in another terminal, after app starts)
```bash
npm run test:api
```

## Manual Testing in Browser

1. Start the application
2. The test page should open automatically (in dev mode)
3. Open browser DevTools (F12 or Cmd+Option+I)
4. Check console for:
   - `Backbase AI Bridge loaded` message
   - `window.backbaseAI` object available

5. Test the API:
   ```javascript
   // In browser console
   window.backbaseAI.query("What is AI?")
     .then(result => console.log(result))
     .catch(err => console.error(err));
   
   window.backbaseAI.search("test query", 3)
     .then(results => console.log(results))
     .catch(err => console.error(err));
   ```

## Expected Behavior

### Without Model File
- SLM inference returns mock responses
- RAG search works (but returns empty if no documents indexed)
- All API endpoints respond (may return 401 without proper auth token)

### With Model File
- Place ONNX model in `resources/models/phi4-mini-4bit.onnx`
- SLM service will automatically load it
- Inference will use native ONNX Runtime

## Troubleshooting

### Native Module Load Errors
- Ensure `DYLD_LIBRARY_PATH` is set
- Run `npm run build:native` to rebuild modules

### API Connection Errors
- Check that API server started (look for "API Server listening" message)
- Verify port 8443 is not in use
- Check browser console for CORS/SSL errors

### Model Loading Errors
- Verify model file exists at configured path
- Check file permissions
- Ensure model is valid ONNX format
