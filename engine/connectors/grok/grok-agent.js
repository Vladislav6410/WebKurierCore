// engine/connectors/grok/grok-agent.js

import axios from "axios";

/**
 * GROK AGENT
 * xAI Grok Connector
 */

export class GrokAgent {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY;

    /**
     * ПРИМЕР:
     * https://api.x.ai/v1
     *
     * Уточни актуальный endpoint у xAI
     */
    this.baseURL =
      process.env.GROK_BASE_URL ||
      "https://api.x.ai/v1";
  }

  /**
   * Отправить задачу в Grok
   */
  async sendTask({
    task,
    repository,
    branch = "main",
    files = [],
    context = ""
  }) {
    try {
      console.log("=================================");
      console.log("WEBKURIER GROK AGENT");
      console.log("=================================");
      console.log("TASK:", task);
      console.log("REPOSITORY:", repository);
      console.log("BRANCH:", branch);
      console.log("=================================");

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: "grok-beta",

          messages: [
            {
              role: "system",
              content: `
You are WebKurier AI Coding Executor.

Rules:
- work carefully
- do not delete critical files
- preserve architecture
- generate production-ready code
- follow WebKurier repository hierarchy
              `
            },

            {
              role: "user",
              content: `
TASK:
${task}

REPOSITORY:
${repository}

BRANCH:
${branch}

FILES:
${JSON.stringify(files, null, 2)}

CONTEXT:
${context}
              `
            }
          ],

          temperature: 0.3
        },

        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      const result =
        response.data.choices?.[0]?.message?.content;

      console.log("=================================");
      console.log("GROK RESPONSE RECEIVED");
      console.log("=================================");

      return {
        success: true,
        executor: "grok",
        task,
        repository,
        result
      };
    } catch (error) {
      console.error(
        "GROK AGENT ERROR:",
        error.response?.data || error.message
      );

      return {
        success: false,
        error:
          error.response?.data || error.message
      };
    }
  }

  /**
   * Генерация кода
   */
  async generateCode({
    prompt,
    language = "javascript"
  }) {
    return await this.sendTask({
      task: `Generate ${language} code`,
      repository: "WebKurierCore",
      context: prompt
    });
  }

  /**
   * Исправление кода
   */
  async fixCode({
    code,
    issue
  }) {
    return await this.sendTask({
      task: "Fix code issue",
      repository: "WebKurierCore",
      context: `
ISSUE:
${issue}

CODE:
${code}
      `
    });
  }

  /**
   * Анализ кода
   */
  async analyzeCode({
    code
  }) {
    return await this.sendTask({
      task: "Analyze code quality",
      repository: "WebKurierCore",
      context: code
    });
  }
}

/**
 * EXPORT
 */

const grokAgent = new GrokAgent();

export default grokAgent;