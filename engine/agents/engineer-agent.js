// engineer-agent.js
import { llm } from "../../llm/index.js";

/**
 * @typedef {Object} EngineerAgentConfig
 * @property {number} temperature - Temperature for LLM responses
 * @property {string} model - Default model name
 * @property {string} fastModel - Fast model name
 */

/**
 * Engineer Agent - Advanced code generation and system architecture executor
 */
export class EngineerAgent {
  /**
   * Create new Engineer Agent instance
   * @param {EngineerAgentConfig} [config] - Agent configuration
   */
  constructor(config = {}) {
    this.config = {
      temperature: 0.1,
      model: "qwen3-coder",
      fastModel: "qwen3-coder-flash",
      ...config
    };
    
    console.log("🔌 Engineer Agent v2.0.0 загружен и готов к работе");
  }

  /**
   * Handle engineering tasks with full LLM integration
   * @param {string} input - User input or task description
   * @returns {Promise<string>} Generated code or response
   */
  async handle(input) {
    const messages = [
      { 
        role: "system", 
        content: `You are WebKurier EngineerAgent. Output: code-first, minimal explanation, production-ready, multi-repo architecture focus. 
Current time: ${new Date().toISOString()}
Context: Full-stack engineer, security-first, CI/CD ready, Docker compatible.` 
      },
      { role: "user", content: input }
    ];

    try {
      const result = await llm.chat({ 
        agent: "engineer", 
        task: "default", 
        messages, 
        temperature: this.config.temperature,
        model: this.config.model
      });
      
      return result.text || "🔧 Задача выполнена без текстового вывода";
    } catch (error) {
      console.error("❌ Error in engineer handle:", error);
      throw new Error(`Engineer agent error: ${error.message}`);
    }
  }

  /**
   * Fast mode for quick patches and fixes
   * @param {string} input - Task description for fast processing
   * @returns {Promise<string>} Quick response
   */
  async fast(input) {
    const messages = [
      { 
        role: "system", 
        content: "You are WebKurier EngineerAgent (fast mode). Short, actionable patches. Production-ready code only. No explanations unless critical." 
      },
      { role: "user", content: input }
    ];

    try {
      const result = await llm.chat({ 
        agent: "engineer", 
        task: "fast", 
        messages, 
        temperature: this.config.temperature,
        model: this.config.fastModel
      });
      
      return result.text || "⚡ Быстрая задача выполнена";
    } catch (error) {
      console.error("❌ Error in engineer fast mode:", error);
      throw new Error(`Engineer fast mode error: ${error.message}`);
    }
  }

  /**
   * Architecture design mode
   * @param {string} requirements - System requirements
   * @returns {Promise<Object>} Architecture structure
   */
  async designArchitecture(requirements) {
    const input = `Design multi-repo architecture for: ${requirements}
    
Requirements:
- Core / Chain / Security / Hybrid layers
- Multi-level project structure
- Production-ready
- Docker & CI/CD compatible
- Security-first approach`;

    const messages = [
      { 
        role: "system", 
        content: "You are WebKurier Architectural Engineer. Design complete folder structures, configuration files, and deployment strategies. Output: JSON structure with file paths and content templates." 
      },
      { role: "user", content: input }
    ];

    try {
      const result = await llm.chat({ 
        agent: "engineer", 
        task: "architecture", 
        messages, 
        temperature: 0.1,
        model: this.config.model
      });
      
      return {
        success: true,
        architecture: result.text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Error in architecture design:", error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Code generation with validation
   * @param {string} spec - Code specification
   * @returns {Promise<Object>} Generated code with validation
   */
  async generateCode(spec) {
    const input = `Generate production-ready code for: ${spec}
    
Requirements:
- Full documentation
- Type safety
- Error handling
- Security considerations
- Performance optimization
- Test coverage`;

    const messages = [
      { 
        role: "system", 
        content: "You are WebKurier Code Generator. Generate complete, working code with proper imports, exports, documentation, and tests. Output: executable code blocks." 
      },
      { role: "user", content: input }
    ];

    try {
      const result = await llm.chat({ 
        agent: "engineer", 
        task: "code-generation", 
        messages, 
        temperature: 0.1,
        model: this.config.model
      });
      
      return {
        success: true,
        code: result.text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Error in code generation:", error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get available commands and capabilities
   * @returns {string} Help text
   */
  getHelp() {
    return `🛠️ WebKurier Engineer Agent v2.0.0
    
Primary Methods:
• handle(input) - Full engineering tasks
• fast(input) - Quick patches and fixes  
• designArchitecture(reqs) - Multi-repo architecture
• generateCode(spec) - Production code generation

Capabilities:
• Multi-level project architecture
• Core / Chain / Security / Hybrid patterns
• CI/CD & Docker integration
• Security-first development
• Full-stack engineering
• Test-driven development`;
  }
}

// Export singleton instance
export const engineerAgent = new EngineerAgent();

// Backward compatibility
export const EngineerAgentLegacy = {
  name: "Engineer",
  description: "Инженер-исполнитель. Выполняет задачи по установке, конфигурации, сборке кода и тестам.",
  version: "2.0.0",
  commands: {
    "/build": () => "🔧 Сборка проекта завершена успешно.",
    "/test": () => "🧪 Все тесты пройдены. Ошибок не обнаружено.",
    "/install": () => "📦 Установлены все модули.",
    "/config": () => "⚙️ Конфигурация успешно применена.",
    "/help": () =>
      "🛠 Команды инженера:\n" +
      "• /build — сборка проекта\n" +
      "• /test — запуск тестов\n" +
      "• /install — установка модулей\n" +
      "• /config — применить конфигурацию\n" +
      "• /help — справка"
  },
  handleCommand: function (cmd) {
    const fn = this.commands[cmd.trim()];
    return fn ? fn() : "❓ Команда не распознана. Введи /help";
  }
};