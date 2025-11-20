#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '../../');

const nativeModules = [
  {
    name: 'slm-runtime',
    path: 'src/native/slm-runtime'
  },
  {
    name: 'rag-index',
    path: 'src/native/rag-index'
  }
];

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function buildNativeModule(module) {
  const modulePath = path.join(projectRoot, module.path);
  console.log(`\n📦 Building native module: ${module.name}`);
  console.log(`   Path: ${modulePath}`);

  if (!fs.existsSync(path.join(modulePath, 'binding.gyp'))) {
    console.warn(`⚠️  Skipping ${module.name}: binding.gyp not found`);
    return;
  }

  // Clean previous build
  runCommand('npx', ['node-gyp', 'clean'], { cwd: modulePath });

  // Configure and build
  runCommand('npx', ['node-gyp', 'configure'], { cwd: modulePath });
  runCommand('npx', ['node-gyp', 'build'], { cwd: modulePath });

  console.log(`✅ Native module built: ${module.name}`);
}

function main() {
  console.log('🔧 Building native modules...');

  nativeModules.forEach(module => {
    try {
      buildNativeModule(module);
    } catch (error) {
      console.error(`❌ Failed to build native module ${module.name}:`, error.message);
      process.exit(1);
    }
  });

  console.log('\n🎉 Native modules build completed');
}

main();
