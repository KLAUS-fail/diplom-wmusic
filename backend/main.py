import os
import bcrypt
from fastapi import FastAPI, Depends, Form, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from database import Song, User, Base, engine, get_db, Playlist, PlaylistSong, Favorite

app = FastAPI()

UPLOAD_DIR = "static/audio"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://github.dev",
        "*"
    ],
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

from fastapi import Request

# ВСЕЯДНАЯ РЕГИСТРАЦИЯ
@app.post("/register")
async def register(request: Request, db: Session = Depends(get_db)):
    # Проверяем оба варианта отправки данных
    username, password = None, None
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
    else:
        form_data = await request.form()
        username = form_data.get("username")
        password = form_data.get("password")

    if not username or not password or not username.strip() or not password.strip():
        raise HTTPException(status_code=400, detail="Логин и пароль не могут быть пустыми")
    
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
    
    salt = bcrypt.gensalt()
    pwd_bytes = password.encode('utf-8')
    hashed_password_string = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

    new_user = User(username=username, hashed_password=hashed_password_string, is_admin=False) 
    db.add(new_user)
    db.commit()
    return {"status": "Регистрация успешна"}

# ВСЕЯДНАЯ АВТОРИЗАЦИЯ
@app.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    username, password = None, None
    content_type = request.headers.get("content-type", "")
    
    if "application/json" in content_type:
        data = await request.json()
        username = data.get("username")
        password = data.get("password")
    else:
        form_data = await request.form()
        username = form_data.get("username")
        password = form_data.get("password")

    if not username or not password or not username.strip() or not password.strip():
        raise HTTPException(status_code=400, detail="Введите логин и пароль")
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")
    
    try:
        user_pwd_bytes = user.hashed_password.encode('utf-8')
        input_pwd_bytes = password.encode('utf-8')
        is_correct = bcrypt.checkpw(input_pwd_bytes, user_pwd_bytes)
    except Exception:
        is_correct = False

    if not is_correct:
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")
        
    return {"status": "Успех", "username": user.username, "is_admin": user.is_admin}

# ПЕРЕСОЗДАЮ СТРУКТУРУ ПОД POSTGRESQL (ТЕПЕРЬ С ЗАЩИТОЙ КЛЮЧОМ)
@app.get("/seed")
def seed_data(secret_key: str = None, db: Session = Depends(get_db)):
    # Проверяем секретный ключ для защиты от взлома базы данных
    if secret_key != "diplom_bragi2026":
        raise HTTPException(
            status_code=403, 
            detail="Доступ запрещен. Неверный или отсутствующий ключ безопасности."
        )

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Хешируем демо-пароли для корректной работы новой авторизации
    salt = bcrypt.gensalt()
    admin_hash = bcrypt.hashpw("admin".encode('utf-8'), salt).decode('utf-8')
    sanya_hash = bcrypt.hashpw("123".encode('utf-8'), salt).decode('utf-8')

    # Тестовые пользователи
    admin_user = User(username="admin", hashed_password=admin_hash, is_admin=True)
    test_user = User(username="sanya", hashed_password=sanya_hash, is_admin=False)
    db.add(admin_user)
    db.add(test_user)
    db.flush()


    # Демонстрационные треки
    song1 = Song(
        title="Восстановленный трек 1",
        artist="Архив Bragi Notes",
        lyrics="Текст песни, который стерся при очистке.\nЕго можно отредактировать.",
        audio_url="/static/audio/track1.mp3" 
    )
    song2 = Song(
        title="Скандинавские Напевы",
        artist="Bragi Band",
        lyrics="Инструментальный трек в честь бога Браги.",
        audio_url="/static/audio/track2.mp3" 
    )
    db.add(song1)
    db.add(song2)
    db.flush() 
    
    # Тестовый плейлист
    demo_playlist = Playlist(title="Моё Избранное", user_id=test_user.id)
    db.add(demo_playlist)
    db.flush()
    
    playlist_link = PlaylistSong(playlist_id=demo_playlist.id, song_id=song1.id)
    db.add(playlist_link)
    db.commit()
    
    return {
        "status": "Успех", 
        "detail": "База данных PostgreSQL успешно инициализирована. Созданы: админ, пользователь sanya, треки и тестовый плейлист."
    }
# ==========================================
#      ЭНДПОИНТЫ ДЛЯ РАБОТЫ С ПЛЕЙЛИСТАМИ(SPBoomer)
# ==========================================

# 1. СОЗДАТЬ НОВЫЙ ПЛЕЙЛИСТ
@app.post("/playlists")
def create_playlist(
    title: str = Form(...), 
    user_id: int = Form(...), 
    db: Session = Depends(get_db)
):
    if not title.strip():
        raise HTTPException(status_code=400, detail="Название плейлиста не может быть пустым")
        
    # Проверяем, существует ли вообще такой пользователь
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    new_playlist = Playlist(title=title, user_id=user_id)
    db.add(new_playlist)
    db.commit()
    db.refresh(new_playlist)
    return {"status": "Плейлист успешно создан", "playlist_id": new_playlist.id, "title": new_playlist.title}


# 2. ПОЛУЧИТЬ ВСЕ ПЛЕЙЛИСТЫ КОНКРЕТНОГО ПОЛЬЗОВАТЕЛЯ
@app.get("/users/{user_id}/playlists")
def get_user_playlists(user_id: int, db: Session = Depends(get_db)):
    playlists = db.query(Playlist).filter(Playlist.user_id == user_id).all()
    return [
        {"id": p.id, "title": p.title} for p in playlists
    ]


# 3. ДОБАВИТЬ ПЕСНЮ В ПЛЕЙЛИСТ
@app.post("/playlists/add-song")
def add_song_to_playlist(
    playlist_id: int = Form(...), 
    song_id: int = Form(...), 
    db: Session = Depends(get_db)
):
    # Проверяем существование плейлиста и песни
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    song = db.query(Song).filter(Song.id == song_id).first()
    
    if not playlist or not song:
        raise HTTPException(status_code=404, detail="Плейлист или песня не найдены")

    # Проверяем, нет ли уже этой песни в этом плейлисте (чтобы не дублировать)
    existing_link = db.query(PlaylistSong).filter(
        PlaylistSong.playlist_id == playlist_id, 
        PlaylistSong.song_id == song_id
    ).first()
    
    if existing_link:
        return {"status": "Песня уже находится в этом плейлисте"}

    new_link = PlaylistSong(playlist_id=playlist_id, song_id=song_id)
    db.add(new_link)
    db.commit()
    return {"status": "Песня успешно добавлена в плейлист"}


# 4. ПОЛУЧИТЬ ВСЕ ПЕСНИ ИЗ КОНКРЕТНОГО ПЛЕЙЛИСТА
@app.get("/playlists/{playlist_id}/songs")
def get_playlist_songs(playlist_id: int, db: Session = Depends(get_db)):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Плейлист не найден")
    
    # Делаем JOIN таблиц связи и песен, чтобы вытащить всю информацию о треках в плейлисте
    songs = db.query(Song).join(PlaylistSong, Song.id == PlaylistSong.song_id).filter(
        PlaylistSong.playlist_id == playlist_id
    ).all()
    
    return [
        {
            "id": s.id,
            "title": s.title,
            "artist": s.artist,
            "lyrics": s.lyrics,
            "audio_url": s.audio_url
        } for s in songs
    ]
# ==========================================
#        ЭНДПОИНТЫ ДЛЯ ФУНКЦИОНАЛА ЛАЙКОВ(SPBoomer)
# ==========================================

# 1. ПОСТАВИТЬ ИЛИ УБРАТЬ ЛАЙК (TOGGLE FAVORITE)
@app.post("/songs/like")
def toggle_like(
    user_id: int = Form(...),
    song_id: int = Form(...),
    db: Session = Depends(get_db)
):
    # Проверяем существование пользователя и песни
    user = db.query(User).filter(User.id == user_id).first()
    song = db.query(Song).filter(Song.id == song_id).first()
    
    if not user or not song:
        raise HTTPException(status_code=404, detail="Пользователь или произведение не найдены")

    # Ищем, есть ли уже лайк от этого юзера на этот трек
    existing_favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.song_id == song_id
    ).first()

    if existing_favorite:
        # Если лайк уже есть — убираем его (дизлайк)
        db.delete(existing_favorite)
        db.commit()
        return {"status": "Лайк успешно снят", "is_liked": False}
    else:
        # Если лайка нет — создаем новую запись
        new_favorite = Favorite(user_id=user_id, song_id=song_id)
        db.add(new_favorite)
        db.commit()
        return {"status": "Произведение добавлено в избранное", "is_liked": True}


# 2. ПОЛУЧИТЬ ВСЕ ЛАЙКНУТЫЕ ТРЕКИ ПОЛЬЗОВАТЕЛЯ
@app.get("/users/{user_id}/favorites")
def get_user_favorites(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Делаем JOIN, чтобы вытащить данные песен через таблицу лайков
    liked_songs = db.query(Song).join(Favorite, Song.id == Favorite.song_id).filter(
        Favorite.user_id == user_id
    ).all()

    return [
        {
            "id": s.id,
            "title": s.title,
            "artist": s.artist,
            "lyrics": s.lyrics,
            "audio_url": s.audio_url
        } for s in liked_songs
    ]


# 3. ПРОВЕРИТЬ СТАТУС ЛАЙКА ДЛЯ КОНКРЕТНОГО ТРЕКА
@app.get("/users/{user_id}/favorites/{song_id}")
def check_song_like_status(user_id: int, song_id: int, db: Session = Depends(get_db)):
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.song_id == song_id
    ).first()
    
    return {"is_liked": favorite is not None}
