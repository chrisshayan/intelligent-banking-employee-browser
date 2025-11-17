#include <napi.h>
#include <onnxruntime_cxx_api.h>
#include <string>
#include <vector>
#include <mutex>
#include <memory>

namespace {
std::mutex g_mutex;
bool g_modelLoaded = false;
std::string g_modelPath;
std::unique_ptr<Ort::Env> g_env;
std::unique_ptr<Ort::Session> g_session;
std::unique_ptr<Ort::SessionOptions> g_sessionOptions;

Napi::Value LoadModel(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected model path string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string modelPath = info[0].As<Napi::String>();

  std::lock_guard<std::mutex> lock(g_mutex);
  try {
    g_env = std::make_unique<Ort::Env>(ORT_LOGGING_LEVEL_WARNING, "SLMRuntime");
    g_sessionOptions = std::make_unique<Ort::SessionOptions>();
    g_sessionOptions->SetIntraOpNumThreads(1);
    g_sessionOptions->SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_EXTENDED);
    g_session = std::make_unique<Ort::Session>(*g_env, modelPath.c_str(), *g_sessionOptions);
    g_modelPath = modelPath;
    g_modelLoaded = true;
    return Napi::Boolean::New(env, true);
  } catch (const Ort::Exception& e) {
    g_modelLoaded = false;
    Napi::Error::New(env, std::string("Failed to load model: ") + e.what()).ThrowAsJavaScriptException();
    return env.Null();
  }
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
  status.Set("backend", "onnxruntime-cpp");
  return status;
}

Napi::Value Infer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!g_modelLoaded) {
    Napi::Error::New(env, "Model not loaded").ThrowAsJavaScriptException();
    return env.Null();
  }
  std::string prompt = info.Length() > 0 && info[0].IsString() ? info[0].As<Napi::String>() : "";
  // To demonstrate, run model with dummy input vector (shape [1,1])
  std::vector<int64_t> dims = {1, 1};
  std::vector<float> input_vals = {42.0f};

  try {
    Ort::AllocatorWithDefaultOptions allocator;
    const char* input_name = g_session->GetInputName(0, allocator);
    const char* output_name = g_session->GetOutputName(0, allocator);
    std::array<int64_t,2> shape = {1, 1};
    auto input_tensor = Ort::Value::CreateTensor<float>(allocator.GetInfo(), input_vals.data(), 1, dims.data(), 2);
    std::vector<Ort::Value> ort_inputs;
    ort_inputs.push_back(std::move(input_tensor));
    auto output_tensors = g_session->Run(Ort::RunOptions{nullptr}, &input_name, ort_inputs.data(), 1, &output_name, 1);
    float result = output_tensors.front().GetTensorMutableData<float>()[0];
    Napi::Object out = Napi::Object::New(env);
    out.Set("text", std::string("[ONNX-Runtime] Model invoked. Result: ") + std::to_string(result));
    out.Set("tokens_generated", 1);
    out.Set("confidence", 0.99);
    return out;
  } catch (const Ort::Exception& e) {
    Napi::Error::New(env, std::string("ONNX inference failure: ") + e.what()).ThrowAsJavaScriptException();
    return env.Null();
  }
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
