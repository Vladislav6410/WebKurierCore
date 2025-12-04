# Translator UX (Abang-compatible Mode)

This module allows Abang-like commands in WebKurierCore terminal and chat.

## Basic commands

- `/spanish <text>` – translate `<text>` to Spanish (`es`)
- `/russian <text>` – translate `<text>` to Russian (`ru`)
- `/french <text>` – translate `<text>` to French (`fr`)
- `/arabic <text>` – translate `<text>` to Arabic (`ar`)
- `/japanese <text>` – translate `<text>` to Japanese (`ja`)

By default, the original message is shown together with the translation.

## Configuration

- `/config showOriginal on` – show original + translation  
- `/config showOriginal off` – show only translation  
- `/translate` – list all available language commands and ISO codes

## Flow

1. Terminal receives a line starting with `/`.
2. `command-parser.js` extracts the command and the text.
3. `command-registry.js` resolves the language code.
4. `translator-agent.js` calls selected provider via `provider-router.js`.
5. UI prints the result according to current config.