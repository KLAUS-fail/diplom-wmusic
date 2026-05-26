import os
from fastapi import FastAPI, Depends, HTTPException, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import hashlib
from database import Song, User, Base, engine, get_db

app = FastAPI()

UPLOAD_DIR = "static/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*\\.app\\.github\\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@app.get("/songs")
def get_songs(db: Session = Depends(get_db)):
    return db.query(Song).all()

@app.post("/songs")
def add_song(
    title: str = Form(...),
    artist: str = Form(...),
    lyrics: str = Form(None), # Теперь текст может быть пустым (None)
    audio_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    audio_url = None
    
    if audio_file and audio_file.filename:
        file_path = os.path.join(UPLOAD_DIR, audio_file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(audio_file.file.read())
        audio_url = f"/static/audio/{audio_file.filename}"

    # Если текст не прислали, пишем пустую строку, чтобы не ломать отображение
    safe_lyrics = lyrics if lyrics else ""

    new_song = Song(title=title, artist=artist, lyrics=safe_lyrics, audio_url=audio_url)
    db.add(new_song)
    db.commit()
    return {"status": "Песня успешно добавлена"}

@app.post("/register")
def register(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Логин занят")
    new_user = User(username=username, hashed_password=hash_password(password))
    db.add(new_user)
    db.commit()
    return {"status": "Регистрация успешна"}

@app.post("/login")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or user.hashed_password != hash_password(password):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    return {"status": "Успех", "username": user.username}

@app.get("/seed")
def seed_data(db: Session = Depends(get_db)):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"status": "База данных PostgreSQL успешно инициализирована"}
