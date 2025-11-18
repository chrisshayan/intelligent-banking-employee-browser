#include <napi.h>
#include <string>
#include <vector>
#include <map>
#include <mutex>
#include <memory>
#include <cmath>

namespace {
// Simple in-memory vector store (FAISS will be integrated later)
struct Document {
  std::string text;
  std::string source;
  std::vector<float> embedding;
  std::map<std::string, std::string> metadata;
};

std::mutex g_mutex;
std::vector<Document> g_documents;
int g_dimension = 384; // all-MiniLM-L6-v2 dimension

// Simple cosine similarity
float cosineSimilarity(const std::vector<float>& a, const std::vector<float>& b) {
  if (a.size() != b.size()) return 0.0f;
  
  float dotProduct = 0.0f;
  float normA = 0.0f;
  float normB = 0.0f;
  
  for (size_t i = 0; i < a.size(); ++i) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA == 0.0f || normB == 0.0f) return 0.0f;
  return dotProduct / (std::sqrt(normA) * std::sqrt(normB));
}

Napi::Value AddDocuments(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (info.Length() < 2 || !info[0].IsArray() || !info[1].IsArray()) {
    Napi::TypeError::New(env, "Expected two arrays: texts and embeddings").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Array texts = info[0].As<Napi::Array>();
  Napi::Array embeddings = info[1].As<Napi::Array>();

  if (texts.Length() != embeddings.Length()) {
    Napi::TypeError::New(env, "Texts and embeddings arrays must have the same length").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::lock_guard<std::mutex> lock(g_mutex);
  
  size_t added = 0;
  for (size_t i = 0; i < texts.Length(); ++i) {
    if (!texts.Get(i).IsString() || !embeddings.Get(i).IsArray()) {
      continue;
    }

    Document doc;
    doc.text = texts.Get(i).As<Napi::String>();
    
    Napi::Array embArray = embeddings.Get(i).As<Napi::Array>();
    for (size_t j = 0; j < embArray.Length(); ++j) {
      if (embArray.Get(j).IsNumber()) {
        doc.embedding.push_back(embArray.Get(j).As<Napi::Number>().FloatValue());
      }
    }

    if (doc.embedding.size() == g_dimension) {
      doc.source = "unknown";
      g_documents.push_back(doc);
      added++;
    }
  }

  Napi::Object result = Napi::Object::New(env);
  result.Set("added", static_cast<int>(added));
  result.Set("total", static_cast<int>(g_documents.size()));
  return result;
}

Napi::Value Search(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  
  if (!info[0].IsArray() || info.Length() < 2 || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected embedding array and topK number").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Array queryEmb = info[0].As<Napi::Array>();
  int topK = info[1].As<Napi::Number>().Int32Value();

  std::vector<float> queryEmbedding;
  for (size_t i = 0; i < queryEmb.Length(); ++i) {
    if (queryEmb.Get(i).IsNumber()) {
      queryEmbedding.push_back(queryEmb.Get(i).As<Napi::Number>().FloatValue());
    }
  }

  if (queryEmbedding.size() != g_dimension) {
    Napi::TypeError::New(env, "Query embedding dimension mismatch").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::lock_guard<std::mutex> lock(g_mutex);

  // Calculate similarities
  std::vector<std::pair<float, size_t>> scores;
  for (size_t i = 0; i < g_documents.size(); ++i) {
    float score = cosineSimilarity(queryEmbedding, g_documents[i].embedding);
    scores.push_back({score, i});
  }

  // Sort by score (descending)
  std::sort(scores.begin(), scores.end(), [](const auto& a, const auto& b) {
    return a.first > b.first;
  });

  // Return top K results
  Napi::Array results = Napi::Array::New(env);
  size_t resultCount = std::min(static_cast<size_t>(topK), scores.size());
  
  for (size_t i = 0; i < resultCount; ++i) {
    const auto& scorePair = scores[i];
    const Document& doc = g_documents[scorePair.second];
    
    Napi::Object result = Napi::Object::New(env);
    result.Set("text", doc.text);
    result.Set("source", doc.source);
    result.Set("score", scorePair.first);
    
    Napi::Object metadata = Napi::Object::New(env);
    for (const auto& [key, value] : doc.metadata) {
      metadata.Set(key, value);
    }
    result.Set("metadata", metadata);
    
    results.Set(i, result);
  }

  return results;
}

Napi::Value GetStats(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::lock_guard<std::mutex> lock(g_mutex);
  
  Napi::Object stats = Napi::Object::New(env);
  stats.Set("documentCount", static_cast<int>(g_documents.size()));
  stats.Set("dimension", g_dimension);
  stats.Set("backend", "in-memory");
  return stats;
}

Napi::Value Clear(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  std::lock_guard<std::mutex> lock(g_mutex);
  
  size_t count = g_documents.size();
  g_documents.clear();
  
  Napi::Object result = Napi::Object::New(env);
  result.Set("cleared", static_cast<int>(count));
  return result;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("addDocuments", Napi::Function::New(env, AddDocuments));
  exports.Set("search", Napi::Function::New(env, Search));
  exports.Set("getStats", Napi::Function::New(env, GetStats));
  exports.Set("clear", Napi::Function::New(env, Clear));
  return exports;
}

}  // namespace

NODE_API_MODULE(rag_index, Init)
