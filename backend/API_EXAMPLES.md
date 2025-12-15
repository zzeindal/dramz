# Примеры использования API

## Создание сериала

```bash
POST /admin/series
Content-Type: multipart/form-data

Fields:
- title: "Название сериала"
- description: "Описание сериала"
- price: 100
- cover: (файл изображения)

Response:
{
  "_id": "...",
  "title": "Название сериала",
  "description": "Описание сериала",
  "price": 100,
  "isVisible": false,
  "coverImage": "./uploads/covers/cover-...",
  "episodes": []
}
```

## Добавление серии

```bash
POST /admin/series/:seriesId/episodes
Content-Type: application/json

{
  "episodeNumber": 1
}

Response:
{
  "success": true,
  "message": "Episode 1 created. Please upload the first media file.",
  "seriesId": "...",
  "episodeNumber": 1,
  "nextStep": {
    "message": "Please upload video with russian audio and russian subtitles",
    "audio": "russian",
    "subtitle": "russian"
  }
}
```

## Загрузка медиа для серии

```bash
POST /admin/series/:seriesId/episodes/upload
Content-Type: multipart/form-data

Fields:
- episodeNumber: 1
- audioLanguage: "russian"
- subtitleLanguage: "russian"
- video: (файл видео)

Response:
{
  "success": true,
  "message": "Media uploaded successfully",
  "seriesId": "...",
  "episodeNumber": 1,
  "uploaded": {
    "audio": "russian",
    "subtitle": "russian"
  },
  "nextStep": {
    "message": "Please upload video with russian audio and english subtitles",
    "audio": "russian",
    "subtitle": "english"
  }
}

Или если все комбинации загружены:
{
  "success": true,
  "message": "Episode is complete! All media combinations uploaded.",
  "complete": true
}
```

## Проверка прогресса загрузки серии

```bash
GET /admin/series/:seriesId/episodes/:episodeNumber/progress

Response:
{
  "uploaded": [
    { "audio": "russian", "subtitle": "russian" },
    { "audio": "russian", "subtitle": "english" }
  ],
  "remaining": [
    { "audio": "russian", "subtitle": "portuguese" },
    ...
  ],
  "isComplete": false
}
```

## Поиск пользователя

```bash
GET /admin/users/search?query=123456789
или
GET /admin/users/search?query=username

Response (найден):
{
  "found": true,
  "user": {
    "telegramId": 123456789,
    "username": "username",
    "displayName": "Отображаемое имя",
    "crowns": 500,
    "registeredAt": "...",
    "lastActivityAt": "..."
  },
  "purchases": [...],
  "totalSpent": 200,
  "referredBy": {...},
  "referrals": [...]
}

Response (не найден):
{
  "message": "User not found",
  "found": false
}
```

## Изменение баланса пользователя

```bash
POST /admin/users/:userId/balance
Content-Type: application/json

{
  "amount": 100,  // Положительное - начисление, отрицательное - списание
  "description": "Подарок за регистрацию"
}

Response:
{
  "user": {...},
  "newBalance": 600
}
```

## Общая статистика

```bash
GET /admin/statistics
или
GET /admin/statistics?startDate=2024-01-01&endDate=2024-12-31

Response:
{
  "users": {
    "total": 1000,
    "inRange": 500
  },
  "views": {
    "total": 5000
  },
  "revenue": {
    "total": 50000
  },
  "viewsByEpisode": [
    {
      "seriesId": "...",
      "seriesTitle": "...",
      "episodeNumber": 1,
      "views": 150
    },
    ...
  ]
}
```

## Статистика пользователя

```bash
GET /admin/users/:userId/statistics

Response:
{
  "telegramId": 123456789,
  "username": "username",
  "displayName": "Имя",
  "registeredAt": "...",
  "lastActivityAt": "...",
  "crowns": 500,
  "totalSpent": 200,
  "totalViews": 10,
  "referralsCount": 5,
  "referrals": [...],
  "referredBy": {...}
}
```

## Переключение видимости сериала

```bash
PUT /admin/series/:seriesId/toggle-visibility

Response:
{
  "_id": "...",
  "title": "...",
  "isVisible": true,
  ...
}
```

