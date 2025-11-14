#include <napi.h>
#include <string>
#include <mutex>

namespace {

std::mutex g_mutex;
bool g_modelLoaded = false;
std::string g_modelPath;

Napi::Value LoadModel(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected model path string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string modelPath = info[0].As<Napi::String>();

  std::lock_guard<std::mutex> lock(g_mutex);
  g_modelPath = modelPath;
  g_modelLoaded = true;

  // NOTE: This is a placeholder. Actual ONNX Runtime initialization will be added in Phase 3.

  return Napi::Boolean::New(env, true);
}

Napi::Value IsModelLoaded(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::lock_guard<std::mutex> lock(g_mutex);
  return Napi::Boolean::New(env, g_modelLoaded);
}

Napi::Value GetStatus(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::lock_guard<std::mutex> lock(g_mutex);
  Napi::Object status = Napi::Object::New(env);
  status.Set("loaded", g_modelLoaded);
  status.Set("modelPath", g_modelPath);
  status.Set("backend", "placeholder");
  status.Set("note", "ONNX Runtime integration will be added in Phase 3");
  return status;
}

Napi::Value Infer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (!g_modelLoaded) {
    Napi::Error::New(env, "Model not loaded").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected prompt string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string prompt = info[0].As<Napi::String>();

  Napi::Object result = Napi::Object::New(env);
  result.Set("text", "[Native Placeholder] ONNX Runtime integration pending. Prompt: " + prompt.substr(0, 80));
  result.Set("tokens_generated", 0);
  result.Set("confidence", 0.0);

  return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("loadModel", Napi::Function::New(env, LoadModel));
  exports.Set("isModelLoaded", Napi::Function::New(env, IsModelLoaded));
  exports.Set("getStatus", Napi::Function::New(env, GetStatus));
  exports.Set("infer", Napi::Function::New(env, Infer));
  return exports;
}

}  // namespace

NODE_API_MODULE(slm_runtime, Init)
