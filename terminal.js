// Простой терминал WebKurier
document.addEventListener('DOMContentLoaded', function () {
  const terminal = document.createElement('div');
  terminal.id = 'terminal';
  terminal.style.backgroundColor = '#000';
  terminal.style.color = '#0f0';
  terminal.style.padding = '10px';
  terminal.style.fontFamily = 'monospace';
  terminal.style.height = '200px';
  terminal.style.overflowY = 'auto';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type a command...';
  input.style.width = '100%';
  input.style.fontFamily = 'monospace';
  input.style.backgroundColor = '#111';
  input.style.color = '#0f0';
  input.style.border = '1px solid #0f0';
  input.style.padding = '5px';

  document.body.appendChild(terminal);
  document.body.appendChild(input);

  function print(text) {
    const line = document.createElement('div');
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }

  print('WebKurier Terminal ready.');
  print('Type "help" to begin.');

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const command = input.value.trim();
      print('> ' + command);
      processCommand(command);
      input.value = '';
    }
  });

  function processCommand(cmd) {
    switch (cmd.toLowerCase()) {
      case 'help':
        print('Available commands: help, info, add 10, clear');
        break;
      case 'info':
        print('WebKurierCore Terminal v1.0');
        break;
      case 'add 10':
        addCoins(10);
        print('Добавлено 10 WKC.');
        displayBalance();
        break;
      case 'clear':
        terminal.innerHTML = '';
        break;
      default:
        print('Unknown command.');
    }
  }
});