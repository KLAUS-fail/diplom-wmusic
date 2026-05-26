import os
from fastapi import FastAPI, Depends, HTTPException, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import hashlib
from database import Song, User, Base, engine, get_db

app = FastAPI()

# Создаем папку для сохранения аудиофайлов, если её нет
UPLOAD_DIR = "static/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Монтируем статику, чтобы аудиофайлы были доступны по ссылке
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

# Измененный эндпоинт: принимает текстовые поля формы и файл
@app.post("/songs")
def add_song(
    title: str = Form(...),
    artist: str = Form(...),
    lyrics: str = Form(...),
    audio_file: UploadFile = File(None), # Файл не обязателен
    db: Session = Depends(get_db)
):
    audio_url = None
    
    # Если пользователь прикрепил файл, сохраняем его на диск
    if audio_file and audio_file.filename:
        file_path = os.path.join(UPLOAD_DIR, audio_file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(audio_file.file.read())
        # Формируем относительный путь для базы данных
        audio_url = f"/static/audio/{audio_file.filename}"

    new_song = Song(title=title, artist=artist, lyrics=lyrics, audio_url=audio_url)
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
