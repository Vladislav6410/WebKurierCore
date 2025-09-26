# Romantic Agent — Memory

## Кратко
- Session memory: хранить последние 20 сообщений на пользователя (user_<id>.json).
- Long-term: предпочтения (язык, тон, любимая музыка) + метки (темы).
- Ротация файла после ~200 KB. Опция: синхронизировать в Dropbox при `dropbox_memory=true`.

----

## Структура каталогов
memory/
  users/
    u123.json              # персональная история и настройки пользователя
  feedback/
    compliments_new.txt    # новые комплименты
    date_ideas_new.txt     # новые идеи для свиданий
    stories_new.txt        # новые истории
    night_stories_new.txt  # новые ночные истории

## Формат users/*.json
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
}### Рекомендации
- Хранить последние 20–50 сообщений в `history`.
- Ограничивать общий размер файла до ~200 KB, при превышении удалять самые старые записи.
- Кодировка UTF-8 без BOM.

## Самообучение (feedback → prompts)
Во время общения новые фразы складываются в:
- `feedback/compliments_new.txt`
- `feedback/date_ideas_new.txt`
- `feedback/stories_new.txt`
- `feedback/night_stories_new.txt`

Запуск слияния: