import os
from fastapi import FastAPI, Depends, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import Song, Base, engine, get_db

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

# --- ЭНДПОИНТ УДАЛЕНИЯ ПЕСНИ ---
@app.delete("/songs/{song_id}")
def delete_song(song_id: int, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Произведение не найдено")
    
    db.delete(song)
    db.commit()
    return {"status": "Произведение успешно удалено"}

@app.post("/register")
def register(username: str = Form(...), password: str = Form(...)):
    if not username.strip():
        raise HTTPException(status_code=400, detail="Имя пользователя не может быть пустым")
    return {"status": "Регистрация успешна"}

@app.post("/login")
def login(username: str = Form(...), password: str = Form(...)):
    if not username.strip():
        raise HTTPException(status_code=400, detail="Введите имя пользователя")
    return {"status": "Успех", "username": username}

@app.get("/seed")
def seed_data(db: Session = Depends(get_db)):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    return {"status": "База данных PostgreSQL успешно инициализирована"}
