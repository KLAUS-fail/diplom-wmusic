import os
from fastapi import FastAPI, Depends, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
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

@app.get("/songs")
def get_songs(db: Session = Depends(get_db)):
    return db.query(Song).all()

@app.post("/songs")
def add_song(
    title: str = Form(...),
    artist: str = Form(...),
    lyrics: str = Form(""),
    audio_file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    audio_url = None
    if audio_file and audio_file.filename:
        file_path = os.path.join(UPLOAD_DIR, audio_file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(audio_file.file.read())
        audio_url = f"/static/audio/{audio_file.filename}"

    new_song = Song(title=title, artist=artist, lyrics=lyrics, audio_url=audio_url)
    db.add(new_song)
    db.commit()
    return {"status": "Песня успешно добавлена"}

@app.delete("/songs/{song_id}")
def delete_song(song_id: int, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Произведение не найдено")
    
    db.delete(song)
    db.commit()
    return {"status": "Произведение успешно удалено"}

# РЕГИСТРАЦИЯ ОБЫЧНОГО ПОЛЬЗОВАТЕЛЯ
@app.post("/register")
def register(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    if not username.strip() or not password.strip():
        raise HTTPException(status_code=400, detail="Логин и пароль не могут быть пустыми")
    
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
    
    new_user = User(username=username, hashed_password=password, is_admin=False) 
    db.add(new_user)
    db.commit()
    return {"status": "Регистрация успешна"}

@app.post("/login")
def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    if not username.strip() or not password.strip():
        raise HTTPException(status_code=400, detail="Введите логин и пароль")
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user or user.hashed_password != password:
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")
        
    return {"status": "Успех", "username": user.username, "is_admin": user.is_admin}

@app.get("/seed")
def seed_data(db: Session = Depends(get_db)):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    #Создаем администратора имя admin, пароль admin
    admin_user = User(username="admin", hashed_password="admin", is_admin=True)
    db.add(admin_user)
    
    song1 = Song(
        title="Восстановленный трек 1",
        artist="Архив Bragi Notes",
        lyrics="Текст песни, который стерся при очистке.\nЕго можно отредактировать или оставить для демонстрации.",
        audio_url="/static/audio/твой_файл_1.mp3" 
    )
    
    db.add(song1)
    db.commit()
    
    return {
        "status": "Успех", 
        "detail": "База данных инициализирована. Администратор и треки восстановлены."
    }
