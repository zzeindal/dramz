# DRAMZ Backend

Backend для мини-приложения Telegram на NestJS с MongoDB.

## Установка

```bash
npm install
```

## Настройка

Создайте файл `.env` на основе `.env.example` и укажите URI подключения к MongoDB:

```
MONGODB_URI=mongodb://localhost:27017/dramz
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
```

**Важно:** В продакшене обязательно измените `JWT_SECRET` на сложный случайный ключ!

## Запуск

```bash
# Разработка
npm run start:dev

# Продакшн
npm run build
npm run start:prod
```

## API Endpoints

### Аутентификация

- `POST /auth/login` - Вход в админ-панель (логин и пароль)
- `POST /auth/admin` - Создать нового администратора (требует JWT токен)

### Пользовательские endpoints - Профиль и баланс

- `GET /user/balance?telegramId=...` - Получить баланс пользователя (короны)
- `GET /user/profile?telegramId=...` - Получить полный профиль пользователя (баланс, статистика, активность)
- `POST /user/register` - Зарегистрировать нового пользователя или обновить существующего

### Пользовательские endpoints - Сериалы (публичные)

- `GET /series` - Получить список видимых сериалов
- `GET /series/:id` - Получить информацию о сериале
- `POST /series/:id/purchase` - Купить сериал за короны
- `GET /series/:id/episodes?telegramId=...` - Получить список эпизодов сериала
- `GET /series/:id/episodes/:episodeNumber?telegramId=...` - Получить информацию об эпизоде (с медиа, если сериал куплен)
- `POST /series/:id/episodes/:episodeNumber/view` - Записать просмотр эпизода

### Пользовательские endpoints - Взаимодействие с сериалами

- `POST /user/series/:seriesId/like` - Лайкнуть/убрать лайк с сериала
- `POST /user/series/:seriesId/bookmark` - Сохранить/убрать из сохраненных сериал
- `GET /user/series/liked?telegramId=...` - Получить список лайкнутых сериалов
- `GET /user/series/bookmarked?telegramId=...` - Получить список сохраненных сериалов
- `GET /user/series/:seriesId/status?telegramId=...` - Получить статус сериала для пользователя (лайкнут/сохранен, количество лайков/сохранений)

### Админ-панель - Сериалы

- `POST /admin/series` - Создание сериала (с обложкой)
- `GET /admin/series` - Список всех сериалов
- `GET /admin/series/:id` - Получение сериала
- `PUT /admin/series/:id` - Редактирование сериала
- `PUT /admin/series/:id/toggle-visibility` - Показать/скрыть сериал
- `POST /admin/series/:id/episodes` - Добавить серию
- `POST /admin/series/:id/episodes/upload` - Загрузить медиа для серии
- `GET /admin/series/:id/episodes/:episodeNumber/progress` - Прогресс загрузки серии
- `DELETE /admin/series/:id` - Удалить сериал

### Админ-панель - Пользователи

- `GET /admin/users/search?query=...` - Поиск пользователя по ID/username
- `GET /admin/users/:id` - Данные пользователя
- `GET /admin/users/:id/statistics` - Статистика пользователя
- `POST /admin/users/:id/balance` - Изменить баланс пользователя

### Админ-панель - Статистика

- `GET /admin/statistics` - Общая статистика
- `GET /admin/statistics?startDate=...&endDate=...` - Статистика за период
- `GET /admin/statistics/series/:seriesId` - Статистика по сериалу

## Структура данных

### Сериал
- Название, описание, обложка
- Цена в коронах
- Видимость (по умолчанию скрыт)
- Эпизоды с медиа (12 комбинаций озвучка+субтитры)

### Комбинации медиа для серии (порядок загрузки):
1. Русская озвучка без субтитров
2. Русская озвучка + русские субтитры
3. Русская озвучка + английские субтитры
4. Русская озвучка + португальские субтитры
5. Русская озвучка + субтитры хинди
6. Русская озвучка + турецкие субтитры
7. Английская озвучка без субтитров
8. Английская озвучка + англ субтитры
9. Английская озвучка + русские субтитры
10. Английская озвучка + португальские субтитры
11. Английская озвучка + субтитры хинди
12. Английская озвучка + турецкие субтитры

## Загрузка файлов

Обложки сохраняются в `./uploads/covers`
Видео серий сохраняются в `./uploads/episodes`

## Swagger Документация

После запуска приложения Swagger документация доступна по адресу:

```
http://localhost:3000/docs
```

Документация включает:
- Описание всех endpoints
- Примеры запросов и ответов
- Валидацию параметров
- Интерактивное тестирование API

Подробнее см. [SWAGGER.md](./SWAGGER.md)

