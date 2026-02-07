// WebKurierCore/engine/llm/config.js
import { SecretValidator } from './secrets/validators.js';

/**
 * LLM Configuration with Security Validation
 * All sensitive data must be loaded via environment variables only
 */

export const llmConfig = {
  providers: {
    qwen: {
      endpoint: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      models: {
        'qwen3-coder': {
          maxTokens: 8192,
          temperatureRange: [0.0, 1.0],
          costPerToken: 0.000001
        },
        'qwen3-coder-flash': {
          maxTokens: 4096,
          temperatureRange: [0.0, 1.0],
          costPerToken: 0.000005
        },
        'qwen3-vl-32b': {
          maxTokens: 4096,
          temperatureRange: [0.0, 1.0],
          costPerToken: 0.00001
        },
        'qwen3-omni-flash': {
          maxTokens: 2048,
          temperatureRange: [0.0, 1.0],
          costPerToken: 0.000003
        },
        'qwen2.5-turbo': {
          maxTokens: 32768,
          temperatureRange: [0.0, 1.0],
          costPerToken: 0.000002
        }
      }
    },
    openai: {
      endpoint: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      models: {
        'gpt-5': {
          maxTokens: 128000,
          temperatureRange: [0.0, 1.0],
          costPerToken: 0.00002
        },
        'qwq-32b': {
          maxTokens: 8192,
          temperatureRange: [0.0, 1.0],
          costPerToken: 0.000015
        }
      }
    }
  },
  
  defaults: {
    model: 'qwen3-coder',
    temperature: 0.1,
    timeout: 30000,
    maxRetries: 3
  },
  
  rateLimits: {
    requestsPerMinute: 100,
    tokensPerMinute: 100000
  }
};

/**
 * Validate configuration security
 * @returns {boolean} Security validation result
 */
export function validateConfig() {
  const requiredEnvVars = [
    'QWEN_API_KEY',
    'OPENAI_API_KEY',
    'QWEN_BASE_URL',
    'OPENAI_BASE_URL'
  ];
  
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }

  // Validate API keys format
  const qwenValid = SecretValidator.validateApiKey(process.env.QWEN_API_KEY, 'qwen');
  const openaiValid = SecretValidator.validateApiKey(process.env.OPENAI_API_KEY, 'openai');
  
  if (!qwenValid) {
    console.error("❌ QWEN_API_KEY format is invalid");
    return false;
  }
  
  if (!openaiValid) {
    console.error("❌ OPENAI_API_KEY format is invalid");
    return false;
  }

  // Validate URLs
  const qwenUrlValid = SecretValidator.validateUrl(process.env.QWEN_BASE_URL);
  const openaiUrlValid = SecretValidator.validateUrl(process.env.OPENAI_BASE_URL);
  
  if (!qwenUrlValid) {
    console.error("❌ QWEN_BASE_URL format is invalid");
    return false;
  }
  
  if (!openaiUrlValid) {
    console.error("❌ OPENAI_BASE_URL format is invalid");
    return false;
  }

  console.log("✅ Configuration security validation passed");
  return true;
}
