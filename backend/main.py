from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import SessionLocal, Song
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 1. Сначала настраиваем безопасность (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Потом подключаем папку со статикой (аудио)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Инъекция зависимости для базы данных
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def home():
    return {"message": "Music API is running"}

@app.get("/songs")
def get_songs(db: Session = Depends(get_db)):
    return db.query(Song).all()

@app.get("/seed")
def seed_data(db: Session = Depends(get_db)):
    # Очищаем старые записи, чтобы не плодить дубликаты
    db.query(Song).delete()
    
    songs = [
        Song(
            title="Ancient Echoes", 
            artist="KLAUS-fail", 
            lyrics="[Instrumental Intro]\nDeep in the fjords...\n(FL Studio Beats)",
            audio_url="/static/audio/test1.mp3"  # <--- Прописали путь к твоему биту
        ),
        Song(
            title="Northern Light", 
            artist="KLAUS-fail", 
            lyrics="Neon sky, cold wind.\nSynthesizers screaming in the dark.",
            audio_url=None
        ),
        Song(
            title="Odin's Rhythm", 
            artist="SPBoomer", 
            lyrics="Beat of the drum, beat of the heart.",
            audio_url=None
        )
    ]
    for s in songs:
        db.add(s)
    db.commit()
    return {"status": "Success", "added": len(songs)}
