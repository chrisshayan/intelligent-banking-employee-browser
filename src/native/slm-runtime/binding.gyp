{
  "targets": [
    {
      "target_name": "slm_runtime",
      "sources": [
        "src/slm_runtime.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "libraries": [],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "cflags_cc": ["-std=c++17"],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "OTHER_CFLAGS": ["-std=c++17"],
            "GCC_ENABLE_CPP_EXCEPTIONS": "NO"
          }
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": ["/std:c++17"],
              "ExceptionHandling": 0
            }
          }
        }]
      ]
    }
  ]
}
