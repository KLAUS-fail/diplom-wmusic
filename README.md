# САНЯ ВОЗЬМИ ТЕЛЕФОН ТАМ НА ДНЕ СООБЩЕНИЕ ТЕБЕ

# diplom-wmusic
# 🛠 Bragi Notes - Инструкция разработчика

### 🚀 Запуск проекта
1. **Backend:** `cd backend && python main.py`=`uvicorn main:app --reload --host 0.0.0.0 --port 8000`
2. **Frontend:** `cd frontend && npm run dev`

### 📋 Важные нюансы
- **Порты:** После запуска всегда ставить порты 8000 и 5173 в режим **Public**.
- **БД:** Если изменил `database.py`, удали `music.db` и вызови эндпоинт `/seed`.
- **API URL:** Актуальная ссылка бэкенда живет в `App.jsx` (строка 12).

### 🎨 Стек
- FastAPI, SQLAlchemy (SQLite/Postgres)
- React + Vite
### ДЛЯ САНИ
хоть это и ридми, но
pip install -r backend/requirements.txt <-в терминал
не забывай про порты, они должны быть public
если что пиши