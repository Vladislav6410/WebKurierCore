// WebKurierCore/engine/llm/secrets/manager.js
import { validateConfig } from '../config.js';

/**
 * Secure Secret Manager
 * Manages API keys through secure channels
 */
export class SecretManager {
  constructor() {
    this.secrets = new Map();
    this.cache = new Map();
    this.initialized = false;
    
    console.log("🔐 Secret Manager initialized");
  }

  /**
   * Initialize secret manager with security validation
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    if (!validateConfig()) {
      throw new Error("❌ Configuration validation failed - missing required environment variables");
    }
    
    // Load secrets from environment variables only
    const requiredSecrets = [
      'QWEN_API_KEY',
      'OPENAI_API_KEY',
      'QWEN_BASE_URL',
      'OPENAI_BASE_URL'
    ];

    for (const secret of requiredSecrets) {
      const value = process.env[secret];
      if (!value) {
        console.error(`❌ Missing required secret: ${secret}`);
        return false;
      }
      this.secrets.set(secret, value);
    }

    this.initialized = true;
    console.log("✅ Secret Manager fully initialized");
    return true;
  }

  /**
   * Get secret value securely
   * @param {string} key - Secret key
   * @returns {string|undefined} Secret value or undefined
   */
  get(key) {
    if (!this.initialized) {
      console.error("❌ Secret Manager not initialized");
      return undefined;
    }
    
    return this.secrets.get(key);
  }

  /**
   * Validate secret exists and is valid
   * @param {string} key - Secret key
   * @returns {boolean} Validity status
   */
  isValid(key) {
    const value = this.get(key);
    return value && typeof value === 'string' && value.length > 0;
  }

  /**
   * Get secrets for specific provider
   * @param {string} provider - Provider name (qwen/openai)
   * @returns {Object} Provider secrets
   */
  getProviderSecrets(provider) {
    switch (provider.toLowerCase()) {
      case 'qwen':
        return {
          apiKey: this.get('QWEN_API_KEY'),
          baseUrl: this.get('QWEN_BASE_URL') || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
        };
      case 'openai':
        return {
          apiKey: this.get('OPENAI_API_KEY'),
          baseUrl: this.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1'
        };
      default:
        return {};
    }
  }

  /**
   * Rotate secret (placeholder for future implementation)
   * @param {string} key - Secret key
   * @param {string} newValue - New secret value
   */
  rotate(key, newValue) {
    if (typeof newValue !== 'string' || newValue.length === 0) {
      throw new Error("Invalid secret value for rotation");
    }
    this.secrets.set(key, newValue);
    this.cache.delete(key); // Clear cache
  }
}

export const secretManager = new SecretManager();