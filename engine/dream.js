const allCommands = {
  "/add": {
    description: "/add [число] — добавить монеты",
    exec: (args) => {
      const amount = parseInt(args[0] || "10", 10);
      if (isNaN(amount) || amount <= 0) throw "Введите положительное число.";
      addCoins(amount);
      return `✅ Добавлено ${amount} WKC.`;
    }
  },
  "/reset": {
    description: "/reset — сбросить баланс",
    exec: () => {
      resetCoins();
      return "🔁 Баланс сброшен.";
    }
  },
  "/balance": {
    description: "/balance — показать баланс",
    exec: () => `💰 Баланс: ${getBalance()} WKC.`
  },
  "/set": {
    description: "/set [число] — установить баланс",
    exec: (args) => {
      const amount = parseInt(args[0], 10);
      if (isNaN(amount) || amount < 0) throw "Введите корректное число.";
      setBalance(amount);
      return `🔧 Баланс установлен: ${amount} WKC.`;
    }
  },
  "/export": {
    description: "/export — сохранить баланс в файл",
    exec: () => {
      const data = JSON.stringify({ balance: getBalance() });
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wallet.json";
      a.click();
      return "💾 Баланс сохранён.";
    }
  },
  "/import": {
    description: "/import — загрузить баланс из файла",
    exec: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            if (typeof data.balance === "number") {
              setBalance(data.balance);
              printToTerminal(`📥 Баланс загружен: ${data.balance} WKC`);
            } else {
              throw "Неверный формат.";
            }
          } catch (e) {
            printToTerminal(`⚠️ Ошибка: ${e}`, true);
          }
        };
        reader.readAsText(file);
      };
      input.click();
      return "📂 Выберите файл.";
    }
  },

  // === Команды DreamMaker ===
  "/dream": {
    description: "/dream — статус DreamMaker",
    exec: () => window.dreammaker.status()
  },
  "/video": {
    description: "/video — создать 3D-видео",
    exec: () => window.dreammaker.fromVideo({ name: "video.mp4" })
  },
  "/photo": {
    description: "/photo — оживить фото со звуком",
    exec: () => window.dreammaker.animate({ name: "photo.jpg" }, { name: "voice.mp3" })
  },
  "/voice": {
    description: "/voice [текст] — озвучить текст",
    exec: (args) => window.dreammaker.voiceOver(args.join(" ") || "Пример текста")
  },

  // === Помощь ===
  "/help": {
    description: "/help — список всех команд",
    exec: () => {
      const list = Object.values(allCommands).map(c => "📌 " + c.description);
      return list.join("\n");
    }
  }
};