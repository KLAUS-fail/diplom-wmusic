import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [songs, setSongs] = useState([])
  const [currentSong, setCurrentSong] = useState(null)

  // Актуальный URL бэкенда
  const API_URL = "https://silver-winner-pjr47xxvr6w7h7gv6-8000.app.github.dev"

  useEffect(() => {
    axios.get(`${API_URL}/songs`)
      .then(res => setSongs(res.data))
      .catch(err => console.error("Ошибка связи с Вальгаллой (бэкендом):", err))
  }, [])

  // Страница конкретной песни
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

  // Главная страница
  return (
    <div className="app-wrapper">
      <header className="main-header">
        <div className="logo">BRAGI NOTES</div>
        <div className="header-menu">
          <button className="login-btn">Войти</button>
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
            <p className="empty-msg">Список пуст. Используйте /seed.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
