import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  // Состояние для хранения списка всех треков
  const [songs, setSongs] = useState([])
  // Состояние для открытия страницы конкретного трека
  const [currentSong, setCurrentSong] = useState(null)

  // Базовый адрес бэкенда (без слэша в конце для корректной склейки путей)
  const API_URL = "https://silver-winner-pjr47xxvr6w7h7gv6-8000.app.github.dev"

  useEffect(() => {
    // Получение данных при загрузке приложения
    axios.get(`${API_URL}/songs`)
      .then(res => setSongs(res.data))
      .catch(err => console.error("Ошибка API: проверьте URL и статус Public для порта 8000", err))
  }, [])

  // Рендер страницы выбранного трека (с текстом и плеером)
  if (currentSong) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#121212', color: 'white', minHeight: '100vh' }}>
        <button onClick={() => setCurrentSong(null)} style={{ background: 'none', border: '1px solid #ffff11', color: '#ffff11', cursor: 'pointer', padding: '5px 15px' }}>← Назад</button>
        
        <h1 style={{ color: '#ffff11', marginTop: '20px' }}>{currentSong.title}</h1>
        <h2 style={{ color: '#aaa' }}>{currentSong.artist}</h2>

        {/* Блок аудиоплеера: отображается только если в базе есть ссылка на файл */}
        {currentSong.audio_url && (
          <div style={{ margin: '30px 0', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#ffff11' }}>Прослушать демо из FL Studio:</p>
            <audio 
              controls 
              src={`${API_URL}${currentSong.audio_url}`} 
              style={{ width: '100%' }}
            >
              Ваш браузер не поддерживает элемент audio.
            </audio>
          </div>
        )}

        <hr style={{ borderColor: '#333' }} />
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '1.2rem', lineHeight: '1.6', color: '#eee' }}>
          {currentSong.lyrics}
        </pre>
      </div>
    )
  }

  // Рендер главного списка треков
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#121212', color: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: '#ffff11', letterSpacing: '2px' }}>BRAGI NOTES</h1>
      <p style={{ color: '#666', fontStyle: 'italic' }}>Мудрость звука в каждой руне...</p>
      <hr style={{ borderColor: '#333' }} />
      
      <div style={{ marginTop: '30px' }}>
        {songs.length > 0 ? (
          songs.map(song => (
            <div 
              key={song.id} 
              onClick={() => setCurrentSong(song)}
              style={{ borderBottom: '1px solid #333', padding: '20px 0', cursor: 'pointer', transition: '0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <h3 style={{ margin: '0', color: '#eee' }}>{song.title}</h3>
              <p style={{ margin: '5px 0 0 0', color: '#888' }}>{song.artist}</p>
              {song.audio_url && <span style={{ fontSize: '0.8rem', color: '#ffff11' }}>● Доступно аудио</span>}
            </div>
          ))
        ) : (
          <p>В чертогах пока пусто. Нажми /seed в бэкенде.</p>
        )}
      </div>
    </div>
  )
}

export default App
