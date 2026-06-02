from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import os

# Ссылка на PostgreSQL в Codespaces (работает без пароля)
# Если проект запущен в Docker, адрес будет "postgres_db", иначе "127.0.0.1"
DB_HOST = os.getenv("DATABASE_HOST", "127.0.0.1")
DATABASE_URL = f"postgresql://postgres@{DB_HOST}:5432/bragi_music"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# МОДЕЛЬ ПЕСЕН
class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    lyrics = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    #От SPBoomer
    in_playlists = relationship("PlaylistSong", back_populates="song")
    favorited_by = relationship("Favorite", back_populates="song")

# ТАБЛИЦА ПОЛЬЗОВАТЕЛЕЙ
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
# Добавление функции плейлистов и избранных от SPBoomer(далее помечено никнеймом)
    playlists = relationship("Playlist", back_populates="creator")
    liked_songs = relationship("Favorite", back_populates="user")

# ТАБЛИЦА ПЛЕЙЛИСТОВ(ОТ SPBoomer)
class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    creator = relationship("User", back_populates="playlists")
    songs = relationship("PlaylistSong", back_populates="playlist")
    
# ТАБЛИЦА: ПЕСНИ В ПЛЕЙЛИСТАХ (ОТ SPBoomer)
class PlaylistSong(Base):
    __tablename__ = "playlist_songs"

    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(Integer, ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    song_id = Column(Integer, ForeignKey("songs.id", ondelete="CASCADE"), nullable=False)

    playlist = relationship("Playlist", back_populates="songs")
    song = relationship("Song", back_populates="in_playlists")

# ТАБЛИЦА ЛАЙКОВ(ОТ SPBoomer)
class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    song_id = Column(Integer, ForeignKey("songs.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="liked_songs")
    song = relationship("Song", back_populates="favorited_by")

# Функция для доступа к БД в эндпоинтах
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
