{
  "targets": [
    {
      "target_name": "slm_runtime",
      "sources": [
        "src/slm_runtime.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "/Users/chrisshayan/projects/backbase-browser/native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/include"
      ],
      "libraries": [
        "/Users/chrisshayan/projects/backbase-browser/native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/lib/libonnxruntime.dylib"
      ],
      "defines": [],
      "cflags_cc": ["-std=c++17"],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "OTHER_CFLAGS": ["-std=c++17"],
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "OTHER_LDFLAGS": [
              "-rpath", "/Users/chrisshayan/projects/backbase-browser/native-libs/onnxruntime/onnxruntime-osx-arm64-1.16.2/lib"
            ]
          }
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": ["/std:c++17"],
              "ExceptionHandling": 1
            }
          }
        }]
      ]
    }
  ]
}
