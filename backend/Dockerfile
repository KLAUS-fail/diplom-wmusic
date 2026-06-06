FROM python:3.12-slim

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл зависимостей
COPY requirements.txt .

# Обновляем pip и устанавливаем зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir bcrypt==4.0.1 && \
    pip install --no-cache-dir -r requirements.txt

# Копируем весь код бэкенда в контейнер
COPY . .

# Открываем порт 8000
EXPOSE 8000

# Команда для запуска сервера
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
