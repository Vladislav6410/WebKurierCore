// WebKurierCore/engine/agents/engineer/types.js

/**
 * @typedef {Object} EngineerAgentResponse
 * @property {boolean} success - Operation success status
 * @property {string} [code] - Generated code
 * @property {string} [architecture] - Architecture structure
 * @property {string} [error] - Error message if failed
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {Object} EngineerAgentConfig
 * @property {number} [temperature=0.1] - LLM temperature
 * @property {string} [model="qwen3-coder"] - Default model
 * @property {string} [fastModel="qwen3-coder-flash"] - Fast model
 */

/**
 * @typedef {Object} ArchitectureRequirements
 * @property {string} name - Project name
 * @property {string} description - Project description
 * @property {Array<string>} technologies - Tech stack
 * @property {string} architecture - Architecture pattern (Core/Chain/Security/Hybrid)
 * @property {Object} deployment - Deployment requirements
 */

export {};