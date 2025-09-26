# Romantic Agent — Memory

## Кратко
- Session memory: хранить последние 20 сообщений на пользователя (`user_*.json`).
- Long-term: предпочтения (язык, тон, любимая музыка) + метки (темы).
- Ротация файла после ~200 KB.  
  Опция — синхронизировать в Dropbox при `dropbox_memory=true`.

## Структура каталогов## Формат `users/*.json`
```json
{
  "user_id": "u123",
  "lang": "en",
  "tone": "gentle",
  "likes": ["poetry", "night_stories"],
  "dislikes": ["long_texts"],
  "favorite_phrases": ["sweet dreams", "good night"],
  "flags": { "safe_mode": true, "allow_personalization": true },
  "history": [ { "ts": "...", "role": "user|agent", "text": "..." } ],
  "counters": { "likes": 0, "stories_used": 0, "compliments_used": 0 },
  "last_updated": "ISO8601"
}