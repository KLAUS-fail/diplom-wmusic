# diplom-wmusic
# 🛠 Bragi Notes - Инструкция разработчика

### 🚀 Запуск проекта
1. **Backend:** `cd backend && python main.py`
2. **Frontend:** `cd frontend && npm run dev`

### 📋 Важные нюансы
- **Порты:** После запуска всегда ставить порты 8000 и 5173 в режим **Public**.
- **БД:** Если изменил `database.py`, удали `music.db` и вызови эндпоинт `/seed`.
- **API URL:** Актуальная ссылка бэкенда живет в `App.jsx` (строка 12).

### 🎨 Стек
- FastAPI, SQLAlchemy (SQLite/Postgres)
- React + Vite
