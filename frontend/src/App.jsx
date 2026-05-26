import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [songs, setSongs] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  
  // Состояния для модального окна (Вход / Регистрация)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false) // false = Вход, true = Регистрация
  
  // Поля формы (только то, что нужно для диплома — без лишней напыщенности)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  // Актуальный URL бэкенда в Codespaces
  const API_URL = "https://github.dev"

  // Загрузка песен при старте страницы
  useEffect(() => {
    axios.get(`${API_URL}/songs`)
      .then(res => setSongs(res.data))
      .catch(err => console.error("Ошибка связи с бэкендом:", err))
  }, [])

  // Отправка формы на бэкенд
  const handleAuthSubmit = (e) => {
    e.preventDefault()
    setMessage('')

    if (isSignUp) {
      // Самая простая регистрация: только логин и пароль
      axios.post(`${API_URL}/register`, {
        username: username,
        password: password
      })
      .then(res => {
        if (res.data.error) {
          setMessage(res.data.error)
        } else {
          setMessage(res.data.message)
          setUsername('')
          setPassword('')
        }
      })
      .catch(err => {
        setMessage('Ошибка отправки запроса')
        console.error(err)
      })
    } else {
      // Заглушка для входа (сделаем следующим шагом, когда проверим это)
      setMessage(`Вход для пользователя ${username} пока в разработке!`)
    }
  }

  // Закрытие окна и очистка полей
  const closeAuthModal = () => {
    setIsModalOpen(false)
    setMessage('')
    setUsername('')
    setPassword('')
  }

  // ЭКРАН 1: Страница конкретной песни (если кликнули на карточку)
  if (currentSong) {
    return (
      <div className="container">
        <button className="btn-back" onClick={() => setCurrentSong(null)}>
          ← Назад к списку
        </button>
        
        <div className="song-header">
          <h1 className="song-title">{currentSong.title}</h1>
          <h2 className="song-artist">{currentSong.artist}</h2>
        </div>

        {currentSong.audio_url && (
          <div className="player-container">
            <p className="player-label">Демо-запись (FL Studio):</p>
            <audio 
              controls 
              src={`${API_URL}${currentSong.audio_url}`} 
              className="audio-player"
            >
              Ваш браузер не поддерживает аудио.
            </audio>
          </div>
        )}

        <div className="lyrics-box">
          <pre>{currentSong.lyrics}</pre>
        </div>
      </div>
    )
  }

  // ЭКРАН 2: Главная страница со списком треков
  return (
    <div className="app-wrapper">
      <header className="main-header">
        <div className="logo">BRAGI NOTES</div>
        <div className="header-menu">
          <button className="login-btn" onClick={() => setIsModalOpen(true)}>Войти</button>
          <div className="burger-menu">☰</div>
        </div>
      </header>

      <div className="container">
        <h1 className="main-title">BRAGI NOTES</h1>
        <p className="subtitle">Твой путеводитель по миру звука</p>
        
        <div className="song-list">
          {songs.length > 0 ? (
            songs.map(song => (
              <div 
                key={song.id} 
                className="song-card"
                onClick={() => setCurrentSong(song)}
              >
                <h3 className="card-title">{song.title}</h3>
                <p className="card-artist">{song.artist}</p>
                {song.audio_url && <span className="audio-badge">● Доступно аудио</span>}
              </div>
            ))
          ) : (
            <p className="empty-msg">Список пуст. Используйте /seed на бэкенде.</p>
          )}
        </div>
      </div>

      {/* --- ПРОСТОЕ МОДАЛЬНОЕ ОКНО АВТОРИЗАЦИИ --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeAuthModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAuthModal}>&times;</button>
            
            <h3>{isSignUp ? 'Регистрация' : 'Вход в систему'}</h3>
            
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              <input 
                type="text" 
                placeholder="Логин" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required 
              />
              
              <input 
                type="password" 
                placeholder="Пароль" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              
              <button type="submit" className="auth-btn">
                {isSignUp ? 'Создать аккаунт' : 'Войти'}
              </button>
            </form>

            {message && <div className="auth-message">{message}</div>}

            <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px' }}>
              <span 
                style={{ color: '#a3cef1', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
              >
                {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
