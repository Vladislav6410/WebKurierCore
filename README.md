<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WebKurierCore</title>
  <meta name="description" content="Автономная HTML-система доступа WebKurier: поддержка QR, ISO, офлайн-режим.">
  <link rel="icon" href="favicon.ico" type="image/x-icon">
  <style>
    :root {
      --bg-light: #f4f4f4;
      --bg-dark: #121212;
      --text-light: #333;
      --text-dark: #f4f4f4;
      --link-light: #0066cc;
      --link-dark: #66ccff;
    }
    body {
      font-family: Arial, sans-serif;
      background-color: var(--bg-light);
      color: var(--text-light);
      text-align: center;
      padding: 40px;
      margin: 0;
      transition: background-color 0.3s, color 0.3s;
    }
    .dark {
      background-color: var(--bg-dark);
      color: var(--text-dark);
    }
    h1 { margin-bottom: 0.5em; }
    #terminal {
      margin-top: 2em;
      padding: 1em;
      border: 1px solid #999;
      background: #000;
      color: #0f0;
      font-family: monospace;
      white-space: pre-wrap;
      min-height: 120px;
    }
    input {
      margin-top: 10px;
      padding: 6px;
      width: 80%;
      max-width: 300px;
    }
    .qr {
      margin: 1em auto;
    }
  </style>
</head>
<body>
  <h1>WebKurierCore</h1>
  <p>Добро пожаловать в автономную HTML-систему доступа!</p>

  <div class="qr">
    <img src="https://api.qrserver.com/v1/create-qr-code/?data=https://vladislav6410.github.io/webkuriercore/&size=150x150" alt="QR-код для доступа" />
  </div>

  <h3>Терминал WebKurier</h3>
  <div id="terminal">WebKurier Terminal ready.\nType "help" to begin.</div>
  <input type="text" id="commandInput" placeholder="Введите команду (ping, info, help)" />

  <h3>WebCoin-кошелёк</h3>
  <p>Ваш баланс: <span id="balance">0</span> WKC</p>

  <button onclick="addCoins(10)">+10 WKC</button>
  <button onclick="resetCoins()">Сброс</button>
  <br><br>
  <button onclick="toggleTheme()">Переключить тему</button>

  <script>
    const terminal = document.getElementById('terminal');
    const input = document.getElementById('commandInput');

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim().toLowerCase();
        handleCommand(cmd);
        input.value = '';
      }
    });

    function handleCommand(cmd) {
      switch (cmd) {
        case 'ping':
          writeTerminal('pong');
          break;
        case 'help':
          writeTerminal('Доступные команды:\n- ping\n- info\n- help');
          break;
        case 'info':
          writeTerminal('WebKurierCore v1.0\nАвтономный доступ и кошелёк');
          break;
        default:
          writeTerminal('Неизвестная команда');
      }
    }

    function writeTerminal(text) {
      terminal.textContent += '\n' + text;
      terminal.scrollTop = terminal.scrollHeight;
    }

    function toggleTheme() {
      document.body.classList.toggle('dark');
    }

    function getBalance() {
      return parseInt(localStorage.getItem('wkcbalance') || '0', 10);
    }

    function updateBalanceDisplay() {
      document.getElementById('balance').textContent = getBalance();
    }

    function addCoins(amount) {
      const current = getBalance();
      localStorage.setItem('wkcbalance', current + amount);
      updateBalanceDisplay();
    }

    function resetCoins() {
      localStorage.setItem('wkcbalance', 0);
      updateBalanceDisplay();
    }

    updateBalanceDisplay();
  </script>
</body>
</html>



