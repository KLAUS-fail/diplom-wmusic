# САНЯ ВОЗЬМИ ТЕЛЕФОН ТАМ НА ДНЕ СООБЩЕНИЕ ТЕБЕ

# diplom-wmusic
# 🛠 Bragi Notes - Инструкция разработчика

### 🚀 Запуск проекта
1. **Запуск и подготовка базы данных PostgreSQL** → `sudo service postgresql start`
2. **Backend:** `cd backend && uvicorn main:app --reload`
3. **Frontend:** `cd frontend && npm run dev`

### 📋 Важные нюансы
- **Порты:** После запуска всегда ставить порты 8000 и 5173 в режим **Public**.
- **БД:** Если изменил `database.py`, удали `music.db` и вызови эндпоинт `/seed`.
- **API URL:** Актуальная ссылка бэкенда живет в `App.jsx` (строка 12).
- **В случае вывода `Form data requires "python-multipart" to be installed.` и(или) `You can install "python-multipart" with: pip install python-multipart` прменить команду → `pip install python-multipart`

### 🎨 Стек
- FastAPI, SQLAlchemy (SQLite/Postgres)
- React + Vite
### ДЛЯ САНИ
хоть это и ридми, но
pip install -r backend/requirements.txt <-в терминал
не забывай про порты, они должны быть public
если что пиши
### КТО БЫЛ ЗДЕСЬ
KLAUS-fail
SPBoomer
GYZZforever
