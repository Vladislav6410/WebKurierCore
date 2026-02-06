// WebKurierCore/engine/llm/config.js

/**
 * LLM Configuration
 * Centralized configuration for language model integration
 */

export const llmConfig = {
  providers: {
    qwen: {
      endpoint: process.env.QWEN_API_ENDPOINT || 'https://api.qwen.com/v1',
      apiKey: process.env.QWEN_API_KEY,
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

export function validateConfig() {
  const requiredEnvVars = ['QWEN_API_KEY'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}