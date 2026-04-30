from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, Song
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Настройка политики CORS для обеспечения доступа со стороны фронтенд-приложения
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Разрешаем запросы со всех источников для разработки
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инъекция зависимости для создания и закрытия сессии базы данных
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    """Корневой эндпоинт для проверки работоспособности API"""
    return {"message": "Music API is running"}

@app.get("/songs")
def get_songs(db: Session = Depends(get_db)):
    """Получение полного списка композиций из базы данных"""
    return db.query(Song).all()

@app.get("/seed")
def seed_data(db: Session = Depends(get_db)):
    """
    Инициализация базы данных тестовыми записями.
    Используется для первичной демонстрации интерфейса.
    """
    songs = [
        Song(
            title="Ancient Echoes", 
            artist="KLAUS-fail", 
            lyrics="[Instrumental Intro]\nDeep in the fjords...\n(FL Studio Beats)"
        ),
        Song(
            title="Northern Light", 
            artist="KLAUS-fail", 
            lyrics="Neon sky, cold wind.\nSynthesizers screaming in the dark."
        ),
        Song(
            title="Odin's Rhythm", 
            artist="SPBoomer", 
            lyrics="Beat of the drum, beat of the heart."
        )
    ]
    # Добавление объектов в сессию и фиксация изменений в БД
    for s in songs:
        db.add(s)
    db.commit()
    return {"status": "Success", "added": len(songs)}
