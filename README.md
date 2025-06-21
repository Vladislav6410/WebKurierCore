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

    a { color: var(--link-light); text-decoration: none; }
    body.dark a { color: var(--link-dark); }

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
    }

    body.dark .toggle-theme { background: var(--accent-dark); }

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
      transition: opacity 0.5s;
    }

    body.dark #preloader { background: var(--bg-dark); }

    .loader {
      width: 40px;
      height: 40px;
      border: 5px solid #ccc;
      border-top-color: #333;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .wallet {
      margin-top: 30px;
      padding: 20px;
      border: 1px solid #aaa;
      border-radius: 8px;
      display: inline-block;
      background: rgba(255,255,255,0.05);
    }

    .wallet h2 { margin-bottom: 10px; }
    .wallet .balance { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .wallet button {
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      background-color: #06c;
      color: white;
      transition: background 0.2s;
    }
    .wallet button:hover { background-color: #0057a6; }

    .terminal {
      margin-top: 30px;
      padding: 20px;
      background: #000;
      color: #0f0;
      font-family: monospace;
      border-radius: 8px;
      text-align: left;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    .terminal input {
      width: 100%;
      padding: 6px;
      margin-top: 8px;
      background: #111;
      color: #0f0;
      border: none;
      outline: none;
      font-family: monospace;
      border-radius: 4px;
    }

    #terminal-log {
      margin-top: 12px;
      min-height: 40px;
    }
  </style>
</head>

<body>
  <div id="preloader"><div class="loader"></div></div>
  <button class="toggle-theme" onclick="toggleTheme()">Сменить тему</button>
  <h1>WebKurierCore</h1>
  <p>Автономная HTML-система доступа WebKurier<br>Поддержка: QR, ISO, офлайн-режим</p>

  <p><a href="https://t.me/WebKurierBot" target="_blank">Наш Telegram-бот</a></p>

  <div class="wallet">
    <h2>WebCoin-кошелёк</h2>
    <div class="balance" id="webcoin-balance">Баланс: 0 WKC</div>
    <button onclick="addCoins(10)">+10 WKC</button>
  </div>

  <div class="terminal" id="terminal-block">
    <div>> WebKurier Terminal v1.0</div>
    <input type="text" id="terminal-input" placeholder="Введи команду..." autocomplete="off" onkeydown="handleCommand(event)">
    <div id="terminal-log"></div>
  </div>

  <script>
    // Смена темы
    function toggleTheme() {
      document.body.classList.toggle('dark');
      try {
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
      } catch(e) {}
    }

    // Добавление монет
    function addCoins(amount) {
      let current = parseInt(localStorage.getItem('webcoin') || '0');
      current += amount;
      localStorage.setItem('webcoin', current);
      document.getElementById('webcoin-balance').textContent = `Баланс: ${current} WKC`;
    }

    // Загрузка темы
    function loadTheme() {
      try {
        if (localStorage.getItem('theme') === 'dark') {
          document.body.classList.add('dark');
        }
      } catch(e) {}
    }

    // Загрузка баланса
    function loadWebCoin() {
      const coins = parseInt(localStorage.getItem('webcoin') || '0');
      document.getElementById('webcoin-balance').textContent = `Баланс: ${coins} WKC`;
    }

    // Обработка команд терминала
    function handleCommand(event) {
      if (event.key === 'Enter') {
        const input = document.getElementById('terminal-input');
        const log = document.getElementById('terminal-log');
        const command = input.value.trim();
        if (command !== '') {
          log.innerHTML += `<div>&gt; ${command}</div>`;
          // Реакция на команды
          if (command === 'ping') {
            log.innerHTML += `<div>Pong 🟢</div>`;
          } else if (command === 'help') {
            log.innerHTML += `<div>Доступные команды: ping, help, info</div>`;
          } else if (command === 'info') {
            log.innerHTML += `<div>WebKurier Terminal v1.0 — автономная оболочка</div>`;
          } else {
            log.innerHTML += `<div>Неизвестная команда. Введи "help".</div>`;
          }
          // Прокрутка вниз
          log.scrollTop = log.scrollHeight;
        }
        input.value = '';
      }
    }

    // Прелоадер и инициализация
    window.addEventListener('load', () => {
      loadTheme();
      loadWebCoin();
      // Скрытие прелоадера
      const preloader = document.getElementById('preloader');
      preloader.style.opacity = '0';
      setTimeout(() => { preloader.style.display = 'none'; }, 500);
      // Фокус на терминал
      setTimeout(() => {
        document.getElementById('terminal-input').focus();
      }, 600);
    });
  </script>
</body>
</html>


