console.log("🤖 Master Agent загружен");

const agents = {
  accountant: 'accountant-agent.js',
  autopilot: 'autopilot-agent.js',
  designer: 'designer-agent.js',
  drone: 'drone-agent.js',
  engineer: 'engineer-agent.js',
  identity: 'identity-agent.js',
  intelligence: 'intelligence-agent.js',
  marketing: 'marketing-agent.js',
  programmer: 'programmer-agent.js',
  translator: 'translator/index.js',
};

function handleMasterCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0];
  const agentName = parts[1];

  switch (cmd) {
    case "/start":
      return startAgent(agentName);
    case "/stop":
      return stopAgent(agentName);
    case "/list":
      return listAgents();
    case "/status":
      return getAgentStatus(agentName);
    case "/train":
      return trainAgent(agentName);
    case "/config":
      return `⚙️ Открыта конфигурация для ${agentName}`;
    default:
      return "🤖 Неизвестная команда master-агента.";
  }
}

function startAgent(name) {
  if (!agents[name]) return "❌ Агент не найден";
  return `✅ Агент ${name} запущен (модуль: ${agents[name]})`;
}

function stopAgent(name) {
  return `⛔ Агент ${name} остановлен`;
}

function listAgents() {
  return "📋 Доступные агенты:\n" + Object.keys(agents).join("\n");
}

function getAgentStatus(name) {
  return `📡 Статус агента ${name}: активен ✅`;
}

function trainAgent(name) {
  return `📚 Обучение агента ${name} запущено...`;
}