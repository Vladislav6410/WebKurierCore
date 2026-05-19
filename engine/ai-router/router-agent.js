// engine/ai-router/router-agent.js

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * AI ROUTER AGENT
 * Главный AI-диспетчер WebKurier
 */

export class RouterAgent {
  constructor() {
    this.routes = {
      architecture: "claude",
      backend: "grok",
      frontend: "copilot",
      research: "perplexity",
      automation: "gpt",
      ai: "gpt",
      optimization: "deepseek"
    };
  }

  /**
   * Анализ задачи
   */
  analyzeTask(task) {
    const text = task.toLowerCase();

    if (
      text.includes("architecture") ||
      text.includes("repo") ||
      text.includes("infrastructure")
    ) {
      return {
        type: "architecture",
        executor: "claude"
      };
    }

    if (
      text.includes("backend") ||
      text.includes("parser") ||
      text.includes("python")
    ) {
      return {
        type: "backend",
        executor: "grok"
      };
    }

    if (
      text.includes("frontend") ||
      text.includes("ui") ||
      text.includes("react")
    ) {
      return {
        type: "frontend",
        executor: "copilot"
      };
    }

    if (
      text.includes("research") ||
      text.includes("market") ||
      text.includes("price")
    ) {
      return {
        type: "research",
        executor: "perplexity"
      };
    }

    return {
      type: "general",
      executor: "gpt"
    };
  }

  /**
   * Создание workflow
   */
  async createWorkflow(task) {
    const analysis = this.analyzeTask(task);

    return {
      task,
      type: analysis.type,
      executor: analysis.executor,
      status: "queued",
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Выполнение задачи
   */
  async executeTask(task) {
    const workflow = await this.createWorkflow(task);

    console.log("=================================");
    console.log("WEBKURIER AI ROUTER");
    console.log("=================================");
    console.log("TASK:", workflow.task);
    console.log("TYPE:", workflow.type);
    console.log("EXECUTOR:", workflow.executor);
    console.log("STATUS:", workflow.status);
    console.log("=================================");

    return workflow;
  }

  /**
   * GPT fallback
   */
  async askGPT(prompt) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              "You are WebKurier AI Orchestrator."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("GPT ERROR:", error.message);

      return null;
    }
  }
}

/**
 * EXPORT
 */

const router = new RouterAgent();

export default router;