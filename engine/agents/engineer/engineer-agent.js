// engine/agents/engineer/engineer-agent.js
// EngineerAgent (terminal-compatible + AI-enabled)
//
// Goals:
// - Keep old Terminal integration contract:
//     createEngineerAgent({ terminal })
//     agent.execute(argsLine)
// - Add AI engineering analysis via OpenAI Responses API
// - Keep secrets OUT of repository; read only from environment
//
// Expected env:
//   OPENAI_API_KEY=...
//
// Expected files рядом:
//   engineer-config.json
//   prompts/engineer-system.prompt.txt

const fs = require("fs");
const path = require("path");

class EngineerAgentCore {
  constructor(options = {}) {
    this.agentId = "engineer";
    this.terminal = options.terminal || null;
    this.rootDir = options.rootDir || __dirname;

    this.configPath = path.join(this.rootDir, "engineer-config.json");
    this.promptPath = path.join(
      this.rootDir,
      "prompts",
      "engineer-system.prompt.txt"
    );

    this.config = this.loadJson(this.configPath);
    this.systemPrompt = this.loadText(this.promptPath);

    this.model = this.config.model || "gpt-5.4";
    this.temperature = Number(this.config.temperature ?? 0.2);
    this.maxOutputTokens = Number(this.config.maxOutputTokens ?? 1800);

    // State is kept for terminal/codex bridge compatibility
    this.state = {
      codexEnabled: false,
      lastPrompt: "",
      lastOutput: "",
      lastMode: "idle"
    };
  }

  loadJson(filePath) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
      console.error(`[EngineerAgent] Failed to load JSON: ${filePath}`, error);
      return {};
    }
  }

  loadText(filePath) {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (error) {
      console.error(`[EngineerAgent] Failed to load text: ${filePath}`, error);
      return "You are EngineerAgent.";
    }
  }

  print(message) {
    if (this.terminal && typeof this.terminal.print === "function") {
      this.terminal.print(message);
      return;
    }
    console.log(message);
  }

  validateEnv() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error: "OPENAI_API_KEY is missing in environment."
      };
    }
    return { ok: true };
  }

  buildUserMessage(userPrompt, context) {
    return [
      `Task: ${userPrompt}`,
      "",
      "Context:",
      JSON.stringify(context || {}, null, 2)
    ].join("\n");
  }

  extractText(data) {
    if (!data) return "";
    if (typeof data.output_text === "string" && data.output_text.trim()) {
      return data.output_text.trim();
    }

    const parts = [];
    const output = Array.isArray(data.output) ? data.output : [];
    for (const item of output) {
      const content = Array.isArray(item.content) ? item.content : [];
      for (const c of content) {
        if (c.type === "output_text" && c.text) {
          parts.push(c.text);
        }
      }
    }

    return parts.join("\n").trim();
  }

  async callOpenAI(userPrompt, context = {}) {
    const apiKey = process.env.OPENAI_API_KEY;

    const payload = {
      model: this.model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: this.systemPrompt
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: this.buildUserMessage(userPrompt, context)
            }
          ]
        }
      ],
      temperature: this.temperature,
      max_output_tokens: this.maxOutputTokens
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${text}`);
    }

    const data = await response.json();
    return this.extractText(data);
  }

  async runTask(input) {
    const envCheck = this.validateEnv();
    if (!envCheck.ok) {
      return {
        ok: false,
        agent: this.agentId,
        error: envCheck.error
      };
    }

    if (!input || typeof input !== "object") {
      return {
        ok: false,
        agent: this.agentId,
        error: "Input must be an object."
      };
    }

    const userPrompt = String(input.prompt || "").trim();
    if (!userPrompt) {
      return {
        ok: false,
        agent: this.agentId,
        error: "Prompt is required."
      };
    }

    this.state.lastPrompt = userPrompt;
    this.state.lastMode = "ai";

    const output = await this.callOpenAI(userPrompt, input.context || {});
    this.state.lastOutput = output;

    return {
      ok: true,
      agent: this.agentId,
      model: this.model,
      output
    };
  }

  printHelp() {
    this.print(
      [
        "EngineerAgent commands:",
        "/engineer help",
        "/engineer ask <task>",
        "/engineer analyze <task>",
        "/engineer build <task>",
        "/engineer fix <task>",
        "",
        "Codex-mode bridge:",
        "/engineer codex on",
        "/engineer codex off",
        "/engineer codex ask <task>",
        "/engineer codex tools",
        "/engineer codex prompt",
        "/engineer codex compact"
      ].join("\n")
    );
  }

  async execute(argsLine) {
    const raw = String(argsLine || "").trim();
    const parts = raw.split(" ").filter(Boolean);
    const head = (parts[0] || "").toLowerCase();

    if (!head || head === "help") {
      this.printHelp();
      return true;
    }

    // Backward-compatible codex bridge flags
    if (head === "codex") {
      const sub = (parts[1] || "").toLowerCase();

      if (!sub) {
        this.print("Usage: /engineer codex on|off|ask|tools|prompt|compact");
        return true;
      }

      if (sub === "on") {
        this.state.codexEnabled = true;
        this.state.lastMode = "codex";
        this.print("Codex-mode enabled.");
        return true;
      }

      if (sub === "off") {
        this.state.codexEnabled = false;
        this.state.lastMode = "idle";
        this.print("Codex-mode disabled.");
        return true;
      }

      if (sub === "tools") {
        this.print(
          [
            "Codex bridge tools:",
            "- on",
            "- off",
            "- ask <task>",
            "- prompt",
            "- compact"
          ].join("\n")
        );
        return true;
      }

      if (sub === "prompt") {
        this.print(this.state.lastPrompt || "No last prompt.");
        return true;
      }

      if (sub === "compact") {
        this.print(this.state.lastOutput || "No last output.");
        return true;
      }

      if (sub === "ask") {
        const task = raw.replace(/^codex\s+ask\s*/i, "").trim();
        if (!task) {
          this.print("Usage: /engineer codex ask <task>");
          return true;
        }

        try {
          const result = await this.runTask({
            prompt: task,
            context: {
              mode: "codex-bridge",
              codexEnabled: this.state.codexEnabled
            }
          });

          if (!result.ok) {
            this.print(`EngineerAgent error: ${result.error}`);
            return true;
          }

          this.print(result.output || "No output returned.");
          return true;
        } catch (error) {
          this.print(`EngineerAgent exception: ${error.message}`);
          return true;
        }
      }

      this.print(`Unknown codex subcommand: ${sub}`);
      return false;
    }

    // AI-native engineering commands
    if (["ask", "analyze", "build", "fix"].includes(head)) {
      const task = raw.replace(new RegExp(`^${head}\\s*`, "i"), "").trim();

      if (!task) {
        this.print(`Usage: /engineer ${head} <task>`);
        return true;
      }

      try {
        const result = await this.runTask({
          prompt: task,
          context: {
            mode: head,
            allowFilePlanning: true,
            allowCodeDrafting: true,
            allowShellSuggestions: true
          }
        });

        if (!result.ok) {
          this.print(`EngineerAgent error: ${result.error}`);
          return true;
        }

        this.print(result.output || "No output returned.");
        return true;
      } catch (error) {
        this.print(`EngineerAgent exception: ${error.message}`);
        return true;
      }
    }

    this.print(`Unknown engineer command: ${raw}`);
    this.print("Try: /engineer help");
    return false;
  }
}

// Factory for existing terminal integration
function createEngineerAgent({ terminal }) {
  if (!terminal) {
    throw new Error("createEngineerAgent: terminal is required");
  }

  const core = new EngineerAgentCore({
    terminal,
    rootDir: __dirname
  });

  return {
    state: core.state,
    print: core.print.bind(core),
    execute: core.execute.bind(core),
    runTask: core.runTask.bind(core),
    core
  };
}

module.exports = EngineerAgentCore;
module.exports.createEngineerAgent = createEngineerAgent;