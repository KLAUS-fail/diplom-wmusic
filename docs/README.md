# 🐳 Документация по контейнеризации и развертыванию проекта Bragi Notes

В рамках разработки дипломного проекта была спроектирована и реализована микросервисная архитектура с использованием технологии контейнеризации **Docker** и инструмента оркестрации **Docker Compose**. 

Контейнеризация обеспечивает полную изоляцию компонентов приложения, устраняет проблему различия окружений (зависимостей, версий интерпретаторов и библиотек) у разработчиков и гарантирует быструю воспроизводимость проекта на целевом сервере при защите.

---

## 🏗 Архитектура контейнеров проекта

Проект разделен на три независимых изолированных контейнера, объединенных в локальную виртуальную сеть Docker (`bragi_network`):

1. **`bragi_postgres_container` (СУБД PostgreSQL):**
   * **Базовый образ:** `postgres:15-alpine` (минималистичный и безопасный образ на базе Alpine Linux).
   * **Назначение:** Хранение учетных записей пользователей, метаданных музыкальных треков, плейлистов и пользовательских лайков.
   * **Постоянство данных:** Настроен persistent volume (`postgres_data`) для сохранения содержимого базы данных при перезапуске контейнеров.

2. **`bragi_backend_container` (Серверная часть):**
   * **Базовый образ:** `python:3.12-slim`.
   * **Назначение:** Обработка бизнес-логики приложения, авторизация пользователей, стриминг аудиофайлов и взаимодействие с СУБД через SQLAlchemy ORM.
   * **Связь со статикой:** Реализован проброс (volume) директории `./backend/static` для обеспечения прямого доступа контейнера к физическим аудиофайлам (`.mp3`) на хост-машине.

3. **`bragi_frontend_container` (Клиентская часть):**
   * **Базовый образ:** `node:20-alpine`.
   * **Назначение:** Отображение пользовательского интерфейса, плеер, взаимодействие с пользователем и отправка асинхронных запросов к API.

---

## 🛠 Конфигурационные файлы (Инфраструктура как код / IaC)

### 1. Спецификация Docker Compose (`docker-compose.yml`)
Файл оркестрации объединяет все сервисы в единый контур, распределяет порты и задает переменные окружения:

```yaml
version: '3.8'

services:
  postgres_db:
    image: postgres:15-alpine
    container_name: bragi_postgres_container
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: bragi_music
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - bragi_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: bragi_backend_container
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_HOST=postgres_db
    volumes:
      - ./backend:/app
      - ./backend/static:/app/static
    depends_on:
      - postgres_db
    networks:
      - bragi_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: bragi_frontend_container
    restart: always
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - bragi_network

volumes:
  postgres_data:

networks:
  bragi_network:
    driver: bridge
```

### 2. Сборка бэкенда (`backend/Dockerfile`)
Описывает пошаговый процесс компиляции окружения для FastAPI-сервера:

```dockerfile
FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🚀 Инструкция по развертыванию проекта

Для запуска всего программного комплекса на любом компьютере с установленным Docker достаточно выполнить одну команду в корневой директории репозитория:

```bash
docker compose up --build
```

### Инициализация первоначальных данных (Seeding)
После первого успешного запуска контейнеров необходимо выполнить триггер автоматического создания таблиц в PostgreSQL и наполнения их демонстрационными аудиофайлами. Для этого нужно отправить GET-запрос на эндпоинт бэкенда:

```text
http://<хост_бэкенда>:8000/seed
```
После этого база данных полностью готова к работе, а веб-интерфейс будет доступен на порту `5173`.

