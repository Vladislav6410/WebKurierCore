<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WebKurierCore</title>
  <style>
    :root {
      --bg-light: #f4f4f4;
      --bg-dark: #121212;
      --text-light: #333;
      --text-dark: #f4f4f4;
      --link-light: #0066cc;
      --link-dark: #66ccff;
      --accent-light: #ccc;
      --accent-dark: #444;
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

    body.dark {
      background-color: var(--bg-dark);
      color: var(--text-dark);
    }

    a {
      color: var(--link-light);
      text-decoration: none;
    }

    body.dark a {
      color: var(--link-dark);
    }

    .toggle-theme {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 12px;
      background: var(--accent-light);
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      border: none;
      z-index: 10001;
      transition: background 0.2s;
    }

    body.dark .toggle-theme {
      background: var(--accent-dark);
    }

    .toggle-theme:hover {
      opacity: 0.9;
    }

    #preloader {
      position: fixed;
      width: 100%;
      height: 100%;
      background: var(--bg-light);
      z-index: 9999;
      top: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s ease;
    }

    body.dark #preloader {
      background: var(--bg-dark);
    }

    .loader {
      width: 40px;
      height: 40px;
      border: 5px solid #ccc;
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .wallet {
      margin-top: 30px;
      padding: 20px;
      border: 1px solid #aaa;
      border-radius: 8px;
      display: inline-block;
      background: rgba(255,255,255,0.05);
    }

    .wallet h2 {
      margin-bottom: 10px;
    }

    .wallet .balance {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .wallet button {
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      background-color: #06c;
      color: white;
    }

    .wallet button:hover {
      background-color: #0057a6;
    }

    .terminal {
      margin-top: 40px;
      text-align: left;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
      padding: 15px;
      background: #111;
      color: #0f0;
      font-family: monospace;
      border-radius: 8px;
      min-height: 200px;
      overflow: auto;
      white-space: pre-wrap;
    }

    .terminal-input {
      width: 100%;
      padding: 10px;
      font-family: monospace;
      font-size: 14px;
      border: none;
      outline: none;
      background: #222;
      color: #0f0;
      border-top: 1px solid #0f0;
    }
  </style>
</head>
<body>
  <div id="preloader"><div class="loader"></div></div>

  <button class="toggle-theme" onclick="toggleTheme()">Сменить тему</button>

  <h1>WebKurierCore</h1>
  <p>Автономная HTML-система доступа WebKurier</p>
  <p>Поддержка: QR, ISO, офлайн-режим</p>
  <p><a href="https://t.me/WebKurierBot" target="_blank">Наш Telegram-бот</a></p>

  <div class="wallet">
    <h2>WebCoin-кошелёк</h2>
    <div class="balance" id="webcoin-balance">Баланс: 0 WKC</div>
    <button onclick="addCoins(10)">+10 WKC</button>
  </div>

  <div class="terminal" id="terminal-output">Добро пожаловать в WebKurier Terminal</div>
  <input class="terminal-input" id="terminal-input" placeholder="Введите команду..." onkeydown="handleTerminal(event)" />

  <script>
    function toggleTheme() {
      document.body.classList.toggle('dark');
      try {
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
      } catch (e) {}
    }

    function addCoins(amount) {
      let current = parseInt(localStorage.getItem('webcoin') || '0');
      current += amount;
      localStorage.setItem('webcoin', current);
      document.getElementById('webcoin-balance').textContent = `Баланс: ${current} WKC`;
    }

    function loadTheme() {
      try {
        if (localStorage.getItem('theme') === 'dark') {
          document.body.classList.add('dark');
        }
      } catch (e) {}
    }

    function loadWebCoin() {
      const coins = parseInt(localStorage.getItem('webcoin') || '0');
      document.getElementById('webcoin-balance').textContent = `Баланс: ${coins} WKC`;
    }

    function handleTerminal(event) {
      if (event.key === 'Enter') {
        const input = event.target.value.trim();
        if (input) {
          const output = document.getElementById('terminal-output');
          output.textContent += `\n> ${input}`;
          // Пример ответа:
          if (input === 'помощь') {
            output.textContent += "\nДоступные команды: помощь, время, webcoin, сброс";
          } else if (input === 'время') {
            output.textContent += `\nВремя: ${new Date().toLocaleTimeString()}`;
          } else if (input === 'webcoin') {
            const wkc = localStorage.getItem('webcoin') || '0';
            output.textContent += `\nВаш баланс: ${wkc} WKC`;
          } else if (input === 'сброс') {
            localStorage.removeItem('webcoin');
            output.textContent += `\nБаланс сброшен.`;
            loadWebCoin();
          } else {
            output.textContent += "\nНеизвестная команда.";
          }
        }
        event.target.value = '';
        output.scrollTop = output.scrollHeight;
      }
    }

    window.addEventListener('load', () => {
      loadTheme();
      loadWebCoin();
      const preloader = document.getElementById('preloader');
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    });
  </script>
</body>
</html>

