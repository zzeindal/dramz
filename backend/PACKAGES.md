# Работа с пакетами в проекте

## Установка пакетов

### Основные команды:

```bash
# Установить все зависимости из package.json
npm install
# или короткая версия
npm i

# Установить конкретный пакет
npm install package-name

# Установить пакет как зависимость для разработки
npm install --save-dev package-name
# или короткая версия
npm install -D package-name

# Установить конкретную версию пакета
npm install package-name@version

# Установить пакет глобально
npm install -g package-name
```

## Примеры для этого проекта

```bash
# Если нужно добавить новый пакет
npm install @nestjs/jwt

# Если нужно добавить dev-зависимость
npm install -D @types/bcrypt

# Установить определенную версию
npm install mongoose@8.0.3
```

## Обновление пакетов

```bash
# Проверить устаревшие пакеты
npm outdated

# Обновить все пакеты до последних версий (minor/patch)
npm update

# Обновить конкретный пакет
npm install package-name@latest
```

## Удаление пакетов

```bash
# Удалить пакет
npm uninstall package-name

# Удалить dev-зависимость
npm uninstall -D package-name
```

## Безопасность

```bash
# Проверить уязвимости
npm audit

# Исправить уязвимости автоматически (без breaking changes)
npm audit fix

# Исправить все уязвимости (может быть breaking changes)
npm audit fix --force
```

## Полезные команды

```bash
# Посмотреть установленные пакеты
npm list

# Посмотреть только production зависимости
npm list --depth=0 --prod

# Посмотреть только dev-зависимости
npm list --depth=0 --dev

# Посмотреть информацию о пакете
npm info package-name

# Очистить кеш npm
npm cache clean --force
```

## Работа с package.json

Все зависимости проекта хранятся в `package.json`:
- `dependencies` - пакеты, нужные в production
- `devDependencies` - пакеты только для разработки

При установке пакетов с флагом `--save` (по умолчанию) они добавляются в `dependencies`.
С флагом `--save-dev` или `-D` добавляются в `devDependencies`.

## После установки новых пакетов

После установки новых NestJS модулей или пакетов может потребоваться:

1. **Перезапустить dev-сервер** (если запущен):
   ```bash
   # Остановить (Ctrl+C) и запустить снова
   npm run start:dev
   ```

2. **Пересобрать проект** (если нужны типы):
   ```bash
   npm run build
   ```

3. **Проверить линтинг**:
   ```bash
   npm run lint
   ```

