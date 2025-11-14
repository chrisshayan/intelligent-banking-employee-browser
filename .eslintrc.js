module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'prefer-const': 'warn',
    'no-var': 'error'
  },
  globals: {
    // Electron main process globals
    app: 'readonly',
    BrowserWindow: 'readonly',
    session: 'readonly',
    ipcMain: 'readonly',
    // Electron preload globals
    contextBridge: 'readonly',
    ipcRenderer: 'readonly'
  }
};

