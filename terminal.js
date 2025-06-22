const terminal = document.getElementById('terminal');
const input = document.getElementById('terminal-input');

function printToTerminal(text) {
  const line = document.createElement('div');
  line.textContent = text;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function handleCommand(cmd) {
  const parts = cmd.trim().split(' ');
  const command = parts[0].toLowerCase();
  const arg = parts[1] ? parseInt(parts[1], 10) : 0;

  switch (command) {
    case '/ping':
      printToTerminal('pong!');
      break;
    case '/help':
      printToTerminal('Команды: /ping, /help, /info, /add [число], /reset, /balance');
      break;
    case '/info':
      printToTerminal('WebKurier Terminal v1.0');
      break;
    case '/add':
      if (!isNaN(arg)) {
        addCoins(arg);
        print

Отлично! Это готовый стиль `CSS` для оформления терминала и кошелька. Он заменит или дополнит твой `styles.css`.

---

### 🔧 Шаг 2: Обновим `styles.css` (замена всего файла)

🔁 **Заменить весь файл `styles.css` этим содержимым:**

```css
#terminal-container {
  background-color: black;
  color: lime;
  padding: 10px;
  font-family: monospace;
  margin: 20px auto;
  width: 90%;
  max-width: 600px;
  border-radius: 10px;
}

#terminal-output {
  white-space: pre-wrap;
  margin-bottom: 10px;
}

#terminal-input {
  width: 100%;
  padding: 5px;
  background-color: black;
  color: lime;
  border: 1px solid #333;
  font-family: monospace;
}

#wallet-buttons {
  margin: 20px;
  text-align: center;
}

#wallet-buttons button {
  margin: 5px;
  padding: 10px 15px;
  font-size: 16px;
  cursor: pointer;
}