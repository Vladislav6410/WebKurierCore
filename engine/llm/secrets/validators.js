// WebKurierCore/engine/llm/secrets/validators.js

/**
 * Secret Validators
 * Validates API keys and endpoints
 */
export class SecretValidator {
  /**
   * Validate API key format
   * @param {string} key - API key to validate
   * @param {string} provider - Provider type
   * @returns {boolean} Validation result
   */
  static validateApiKey(key, provider) {
    if (!key || typeof key !== 'string') return false;
    
    switch (provider.toLowerCase()) {
      case 'qwen':
        // Qwen keys typically start with 'sk-' or similar pattern
        return /^sk-[a-zA-Z0-9]{20,}$/.test(key) || key.length >= 32;
      case 'openai':
        // OpenAI keys typically start with 'sk-' followed by base64-like string
        return /^sk-[a-zA-Z0-9]{20,}$/.test(key);
      default:
        // Generic validation: at least 32 characters
        return key.length >= 32;
    }
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Validation result
   */
  static validateUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  /**
   * Validate provider configuration
   * @param {Object} config - Provider configuration
   * @param {string} provider - Provider name
   * @returns {Object} Validation result
   */
  static validateProviderConfig(config, provider) {
    const errors = [];

    if (!config.apiKey) {
      errors.push(`${provider.toUpperCase()}_API_KEY is required`);
    } else if (!this.validateApiKey(config.apiKey, provider)) {
      errors.push(`${provider.toUpperCase()}_API_KEY format is invalid`);
    }

    if (!config.baseUrl) {
      errors.push(`${provider.toUpperCase()}_BASE_URL is required`);
    } else if (!this.validateUrl(config.baseUrl)) {
      errors.push(`${provider.toUpperCase()}_BASE_URL format is invalid`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize error messages to avoid leaking secrets
   * @param {Error} error - Original error
   * @returns {Error} Sanitized error
   */
  static sanitizeError(error) {
    const message = error.message
      .replace(/sk-[a-zA-Z0-9]+/g, '[REDACTED_API_KEY]')
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g, '[REDACTED_EMAIL]');
    
    return new Error(message);
  }
}

export default SecretValidator;