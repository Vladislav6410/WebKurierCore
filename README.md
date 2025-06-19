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
  </style>
</head>
<body>
  <div id="preloader">
    <div class="loader"></div>
  </div>

  <div class="toggle-theme" onclick="toggleTheme()">Сменить тему</div>

  <h1>WebKurierCore</h1>
  <p>Автономная HTML-система доступа WebKurier</p>
  <p>Поддержка: QR, ISO, офлайн-режим</p>

  <div class="qr">
    <img src="webkurier_qr.png" alt="QR для доступа" width="200" />
    <p><a href="https://t.me/Webkurierbot" target="_blank">Наш Telegram-бот</a></p>
  </div>

  <script>
    function toggleTheme() {
      document.body.classList.toggle('dark');
      localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    }

    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark');
    }

    window.addEventListener('load', () => {
      const preloader = document.getElementById('preloader');
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 500);
    });
  </script>
</body>
</html>
