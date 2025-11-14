cmake_minimum_required(VERSION 3.20)
project(slm_runtime LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

add_library(slm_runtime SHARED
    src/slm_runtime.cc
)

target_include_directories(slm_runtime PRIVATE
    $ENV{NODE_ADDON_API_DIR}
)

# TODO: Link against ONNX Runtime once native binaries are available
# target_link_libraries(slm_runtime PRIVATE onnxruntime)
