// === Запуск интерфейса ===
window.addEventListener("DOMContentLoaded", () => {
  // 📥 Автозагрузка памяти и конфигурации из Dropbox
  if (typeof handleEngineerCommand === "function") {
    handleEngineerCommand("/load").then(printToTerminal);
    handleEngineerCommand("/config").then(printToTerminal);
  }

  updateBalanceUI();

  const input = document.getElementById("terminal-input");
  const executeBtn = document.getElementById("execute-command");

  async function runCommand() {
    const cmd = input.value.trim();
    if (!cmd) return;
    printToTerminal("> " + cmd);
    commandHistory.unshift(cmd);
    commandHistory = commandHistory.slice(0, 10);
    historyIndex = -1;
    const result = await handleWalletCommand(cmd);
    printToTerminal(result, result.startsWith("⚠️") || result.startsWith("❌"));
    updateBalanceUI();
    input.value = "";
  }

  if (executeBtn) executeBtn.onclick = runCommand;

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runCommand();
      else if (e.key === "ArrowUp") {
        if (commandHistory.length > 0) {
          historyIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
          input.value = commandHistory[historyIndex];
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (historyIndex > 0) {
          historyIndex--;
          input.value = commandHistory[historyIndex];
        } else {
          historyIndex = -1;
          input.value = "";
        }
        e.preventDefault();
      }
    });
  }
});