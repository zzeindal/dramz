# Настройка проекта

## Генерация проекта через NestJS CLI

Для создания нового проекта NestJS используйте команду:

```bash
npx @nestjs/cli new project-name
# или
npm init @nestjs/cli project-name
```

После генерации проект будет содержать:
- Правильную структуру директорий
- Актуальные конфигурационные файлы (tsconfig.json, eslint.config.mjs, .prettierrc)
- Базовые тестовые файлы
- Jest конфигурацию

## Установка зависимостей

После создания проекта или клонирования:

```bash
npm install
```

## Настройка окружения

Создайте файл `.env` в корне проекта:

```env
MONGODB_URI=mongodb://localhost:27017/dramz
PORT=3000
```

## Запуск проекта

```bash
# Режим разработки (с hot-reload)
npm run start:dev

# Продакшн режим
npm run build
npm run start:prod
```

## Полезные команды

```bash
# Линтинг кода
npm run lint

# Форматирование кода
npm run format

# Тесты
npm run test
npm run test:watch
npm run test:cov

# Генерация модулей через CLI
npx nest g module module-name
npx nest g controller controller-name
npx nest g service service-name
```

## Структура проекта

```
dramz/
├── src/
│   ├── series/          # Модуль сериалов
│   ├── users/            # Модуль пользователей
│   ├── statistics/       # Модуль статистики
│   ├── files/            # Модуль файлов
│   ├── app.module.ts     # Главный модуль
│   └── main.ts           # Точка входа
├── test/                 # E2E тесты
├── uploads/              # Загруженные файлы
│   ├── covers/          # Обложки сериалов
│   └── episodes/         # Видео серий
├── .env                  # Переменные окружения
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── eslint.config.mjs
```

