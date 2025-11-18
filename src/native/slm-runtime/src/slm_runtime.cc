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
Ort::AllocatorWithDefaultOptions g_allocator;

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
  } catch (...) {
    g_modelLoaded = false;
    Napi::Error::New(env, "Failed to load model: Unknown error").ThrowAsJavaScriptException();
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
  
  if (g_modelLoaded && g_session) {
    try {
      size_t numInputNodes = g_session->GetInputCount();
      size_t numOutputNodes = g_session->GetOutputCount();
      status.Set("inputCount", static_cast<int>(numInputNodes));
      status.Set("outputCount", static_cast<int>(numOutputNodes));
    } catch (...) {
      // Ignore errors getting node counts
    }
  }
  
  return status;
}

Napi::Value Infer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (!g_modelLoaded) {
    Napi::Error::New(env, "Model not loaded").ThrowAsJavaScriptException();
    return env.Null();
  }
  
  std::string prompt = "";
  if (info.Length() > 0 && info[0].IsString()) {
    prompt = info[0].As<Napi::String>();
  }

  try {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Get input/output node info
    size_t numInputNodes = g_session->GetInputCount();
    size_t numOutputNodes = g_session->GetOutputCount();
    
    if (numInputNodes == 0 || numOutputNodes == 0) {
      Napi::Error::New(env, "Model has no input or output nodes").ThrowAsJavaScriptException();
      return env.Null();
    }
    
    // Get input/output names using the correct API
    Ort::AllocatorWithDefaultOptions allocator;
    auto inputName = g_session->GetInputNameAllocated(0, allocator);
    auto outputName = g_session->GetOutputNameAllocated(0, allocator);
    
    // Get input shape
    auto inputTypeInfo = g_session->GetInputTypeInfo(0);
    auto tensorInfo = inputTypeInfo.GetTensorTypeAndShapeInfo();
    auto inputShape = tensorInfo.GetShape();
    
    // Create a simple dummy input tensor for demonstration
    // In a real implementation, this would tokenize the prompt
    std::vector<int64_t> inputDims;
    if (inputShape.empty() || inputShape[0] == -1) {
      inputDims = {1, 1}; // Batch size 1, sequence length 1
    } else {
      inputDims = inputShape;
      // Replace -1 with 1 (dynamic dimension)
      for (auto& dim : inputDims) {
        if (dim == -1) dim = 1;
      }
    }
    
    size_t inputSize = 1;
    for (auto dim : inputDims) {
      inputSize *= dim;
    }
    
    // Create input tensor with dummy data
    std::vector<float> inputData(inputSize, 0.0f);
    auto memoryInfo = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);
    auto inputTensor = Ort::Value::CreateTensor<float>(
      memoryInfo, inputData.data(), inputSize, inputDims.data(), inputDims.size()
    );
    
    // Run inference
    const char* inputNames[] = {inputName.get()};
    const char* outputNames[] = {outputName.get()};
    std::vector<Ort::Value> inputTensors;
    inputTensors.push_back(std::move(inputTensor));
    
    auto outputTensors = g_session->Run(
      Ort::RunOptions{nullptr},
      inputNames, inputTensors.data(), 1,
      outputNames, 1
    );
    
    // Extract output (simplified - assumes single float output)
    // Ort::Value is move-only, so we need to access it directly
    float* outputData = outputTensors[0].GetTensorMutableData<float>();
    float result = outputData[0];
    
    // Create response
    Napi::Object out = Napi::Object::New(env);
    out.Set("text", std::string("[ONNX Runtime] Model inference completed. Prompt: \"") + 
                   prompt.substr(0, 50) + 
                   (prompt.length() > 50 ? "..." : "") + 
                   "\". Output value: " + std::to_string(result));
    out.Set("tokens_generated", 1);
    out.Set("confidence", 0.99);
    
    return out;
  } catch (const Ort::Exception& e) {
    Napi::Error::New(env, std::string("ONNX inference error: ") + e.what()).ThrowAsJavaScriptException();
    return env.Null();
  } catch (const std::exception& e) {
    Napi::Error::New(env, std::string("Inference error: ") + e.what()).ThrowAsJavaScriptException();
    return env.Null();
  } catch (...) {
    Napi::Error::New(env, "Inference error: Unknown exception").ThrowAsJavaScriptException();
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
