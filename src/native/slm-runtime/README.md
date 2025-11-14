# SLM Runtime Native Module

This directory contains the native Node.js addon that will host the Small Language Model (SLM) runtime. The current implementation provides a placeholder interface that will be extended with ONNX Runtime integration in Phase 3.

## Building

```bash
npm run build:native
```

This will run `node-gyp` inside this directory and produce `build/Release/slm_runtime.node`.

## Exposed Functions

- `loadModel(modelPath: string): boolean` – Loads the model from disk (placeholder)
- `isModelLoaded(): boolean` – Returns whether a model has been loaded
- `getStatus(): object` – Returns health information
- `infer(prompt: string, options?: object): object` – Runs inference (placeholder response)

## Next Steps

- Integrate ONNX Runtime C API
- Implement memory-mapped model loading
- Add streaming token generation support
- Expose batch inference API
```
