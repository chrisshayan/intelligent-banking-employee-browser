const fs = require('fs');
const path = require('path');

let configCache = null;

/**
 * Load configuration from files
 * Loads default.json, then merges environment-specific overrides
 */
function loadConfig() {
  if (configCache !== null) {
    return configCache;
  }

  const configDir = path.join(__dirname, '../../config');
  const defaultConfigPath = path.join(configDir, 'default.json');
  
  // Load default configuration
  let config = {};
  if (fs.existsSync(defaultConfigPath)) {
    try {
      const defaultConfig = fs.readFileSync(defaultConfigPath, 'utf8');
      config = JSON.parse(defaultConfig);
    } catch (error) {
      console.error('Error loading default config:', error);
    }
  }

  // Load environment-specific overrides
  const env = process.env.NODE_ENV || 'development';
  const envConfigPath = path.join(configDir, `${env}.json`);
  
  if (fs.existsSync(envConfigPath)) {
    try {
      const envConfig = fs.readFileSync(envConfigPath, 'utf8');
      const envConfigObj = JSON.parse(envConfig);
      // Deep merge
      config = deepMerge(config, envConfigObj);
    } catch (error) {
      console.error(`Error loading ${env} config:`, error);
    }
  }

  // Override with environment variables (if needed)
  // Format: CONFIG_KEY__NESTED_KEY=value
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('CONFIG_')) {
      const configKey = key.replace('CONFIG_', '').toLowerCase();
      const value = process.env[key];
      setNestedProperty(config, configKey, value);
    }
  });

  configCache = config;
  return config;
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

/**
 * Check if value is an object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Set nested property using dot notation
 */
function setNestedProperty(obj, path, value) {
  const keys = path.split('__');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || !isObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

/**
 * Get configuration value using dot notation
 * @param {string} key - Configuration key (e.g., 'app.name' or 'security.csp.enabled')
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Configuration value
 */
function get(key, defaultValue = undefined) {
  const config = loadConfig();
  const keys = key.split('.');
  let value = config;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }
  
  return value !== undefined ? value : defaultValue;
}

/**
 * Reload configuration (useful for testing or hot-reload)
 */
function reload() {
  configCache = null;
  return loadConfig();
}

module.exports = {
  get,
  reload,
  loadConfig
};

