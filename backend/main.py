from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
# Импортируем engine и Base, чтобы автоматически управлять таблицами Postgres
from database import SessionLocal, Song, User, engine, Base, get_db
from passlib.context import CryptContext
from pydantic import BaseModel

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Схема данных, которую мы ждем от фронтенда при регистрации
class UserRegisterSchema(BaseModel):
    username: str
    email: str
    password: str

app = FastAPI()

# 1. Настраиваем безопасность (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Подключаем папку со статикой (аудио)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def home():
    return {"message": "Music API is running on PostgreSQL"}

@app.get("/songs")
def get_songs(db: Session = Depends(get_db)):
    return db.query(Song).all()

@app.get("/seed")
def seed_data(db: Session = Depends(get_db)):
    # Полностью дропаем старые таблицы и создаем структуру заново
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Заливаем 3 тестовых трека (строго латиница в URL, без пробелов)
    songs = [
        Song(
            title="Ancient Echoes", 
            artist="KLAUS-fail", 
            lyrics="[Instrumental Intro]\nDeep in the fjords...\n(FL Studio Beats)",
            audio_url="/static/audio/test1.mp3"
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
    
    db.add_all(songs)
    db.commit()
    return {"status": "Success", "added": len(songs), "database": "PostgreSQL"}

# только логин и пароль
class UserRegisterSchema(BaseModel):
    username: str
    password: str

@app.post("/register")
def register_user(user_data: UserRegisterSchema, db: Session = Depends(get_db)):
    # 1. Проверяем только логин
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        return {"error": "Этот логин уже занят"}
    
    # 2. Хешируем пароль для безопасности (требование методички)
    hashed_pwd = pwd_context.hash(user_data.password)
    
    # 3. Сохраняем в базу PostgreSQL
    new_user = User(
        username=user_data.username,
        hashed_password=hashed_pwd
    )
    
    db.add(new_user)
    db.commit()
    return {"status": "Success", "message": f"Пользователь {new_user.username} успешно создан!"}
