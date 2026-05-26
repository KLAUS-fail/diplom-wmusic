from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import hashlib
from database import Song, User, Base, engine, get_db

app = FastAPI()

# Надежная настройка CORS для Codespaces
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*\\.app\\.github\\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Функция безопасного хеширования паролей без использования зависающего passlib
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class UserSchema(BaseModel):
    username: str
    password: str

class SongSchema(BaseModel):
    title: str
    artist: str
    lyrics: str
    audio_url: str | None = None # Поле для MP3 ссылки

@app.get("/songs")
def get_songs(db: Session = Depends(get_db)):
    return db.query(Song).all()

@app.post("/songs")
def add_song(song_data: SongSchema, db: Session = Depends(get_db)):
    new_song = Song(
        title=song_data.title, 
        artist=song_data.artist, 
        lyrics=song_data.lyrics, 
        audio_url=song_data.audio_url if song_data.audio_url else None
    )
    db.add(new_song)
    db.commit()
    return {"status": "Песня успешно добавлена"}

@app.post("/register")
def register(user_data: UserSchema, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Логин занят")
    
    # Хешируем пароль перед записью в PostgreSQL
    secured_password = hash_password(user_data.password)
    new_user = User(username=user_data.username, hashed_password=secured_password)
    db.add(new_user)
    db.commit()
    return {"status": "Регистрация успешна"}

@app.post("/login")
def login(user_data: UserSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or user.hashed_password != hash_password(user_data.password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    return {"status": "Успех", "username": user.username}

@app.get("/seed")
def seed_data(db: Session = Depends(get_db)):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"status": "База данных PostgreSQL успешно инициализирована"}
