<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>WebKurierCore</title>
  <meta name="description" content="Автономная HTML-система доступа WebKurier: поддержка QR, ISO, офлайн-режим, WebCoin.">
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
      background: #ccc;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      z-index: 10001;
      border: none;
      outline: none;
      transition: background 0.2s;
    }
    .toggle-theme:hover {
      background: #bbb;
    }

    .qr img {
      margin-top: 20px;
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
      to {
        transform: rotate(360deg);
      }
    }

    /* WebCoin Wallet */
    #webcoin-wallet {
      margin-top: 40px;
      padding: 20px;
      border: 2px dashed #888;
      border-radius: 12px;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
      background-color: rgba(255, 255, 255, 0.05);
    }

    #webcoin-wallet button {
      margin-top: 10px;
      padding: 8px 14px;
      border: none;
      border-radius: 5px;
      background: #4caf50;
      color: white;
      font-size: 14px;
      cursor: pointer;
    }

    #webcoin-wallet button:hover {
      background: #43a047;
    }
  </style>
</head>
<body>
  <div id="preloader">
    <div class="loader"></div>
  </div>

  <button class="toggle-theme" onclick="toggleTheme()">Сменить тему</button>

  <h1>WebKurierCore</h1>
  <p>Автономная HTML-система доступа WebKurier</p>
  <p>Поддержка: QR, ISO, офлайн-режим</p>

  <div class="qr">
    <img src="webkurier_qr.png" alt="QR-код для доступа к WebKurierBot" width="200" />
    <p><a href="https://t.me/Webkurierbot" target="_blank" rel="noopener">Наш Telegram-бот</a></p>
  </div>

  <div id="webcoin-wallet">
    <h2>WebCoin: <span id="balance">0</span> 🪙</h2>
    <button onclick="earnCoin()">Получить монету</button>
  </div>

  <script>
    // Theme
    function toggleTheme() {
      document.body.classList.toggle('dark');
      try {
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
      } catch(e) {}
    }

    try {
      if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
      }
    } catch(e) {}

    // Preloader
    window.addEventListener('load', () => {
      const preloader = document.getElementById('preloader');
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    });

    // WebCoin Wallet
    const balanceEl = document.getElementById('balance');
    let coins = parseInt(localStorage.getItem('webcoins')) || 0;
    balanceEl.textContent = coins;

    function earnCoin() {
      coins++;
      balanceEl.textContent = coins;
      localStorage.setItem('webcoins', coins);
    }
  </script>
</body>
</html>

