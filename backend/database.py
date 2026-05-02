from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Настройка базы данных SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./music.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Модель песни (Сущность для базы данных)
class Song(Base):
    __tablename__ = "songs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    artist = Column(String, index=True)
    lyrics = Column(Text)
    # Поле для хранения пути к аудиофайлу (тестовый бит из FL Studio)
    audio_url = Column(String) 

# Автоматическое создание таблиц при запуске
Base.metadata.create_all(bind=engine)
