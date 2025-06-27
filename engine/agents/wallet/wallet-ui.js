// === wallet-ui.js — Интерфейс WebCoin Wallet ===

import { getBalance, setBalance, addCoins, resetCoins } from './wallet-agent.js';
import { formatHistory, clearHistory } from './wallet-history.js';

// Обновление отображения баланса
export function updateWalletUI() {
  const balance = getBalance();
  const el = document.getElementById("wallet-balance");
  if (el) el.textContent = `Баланс: ${balance} WKC`;
}

// Привязка кнопок интерфейса
export function bindWalletUI() {
  const btnAdd    = document.getElementById("wallet-add");
  const btnReset  = document.getElementById("wallet-reset");
  const btnHist   = document.getElementById("wallet-history");
  const btnClearH = document.getElementById("wallet-clear-history");

  if (btnAdd) btnAdd.onclick = () => {
    addCoins(10);
    updateWalletUI();
    printToTerminal("➕ Добавлено 10 WKC");
  };

  if (btnReset) btnReset.onclick = () => {
    resetCoins();
    updateWalletUI();
    printToTerminal("🔁 Баланс сброшен.");
  };

  if (btnHist) btnHist.onclick = () => {
    const text = formatHistory();
    printToTerminal("📜 История операций:\n\n" + text);
  };

  if (btnClearH) btnClearH.onclick = () => {
    clearHistory();
    printToTerminal("🗑 История очищена.");
  };

  updateWalletUI();
}

// Печать в терминал
function printToTerminal(msg) {
  const out = document.getElementById("terminal-output");
  if (!out) return;
  const line = document.createElement("div");
  line.textContent = msg;
  line.style.color = "cyan";
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}