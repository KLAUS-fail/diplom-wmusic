import { useEffect, useState } from 'react'
import axios from 'axios'

function App() {
  // состояние для хранения массива объектов (песен), полученных из базы данных
  const [songs, setSongs] = useState([])
  // состояние для хранения выбранного объекта (песни) для отображения подробной информации
  const [currentSong, setCurrentSong] = useState(null)

  // константа API_URL определяет базовый адрес бэкенд-сервера
  // требуется актуализировать при перезапуске кодспейс
  const API_URL = "https://improved-garbanzo-jj5vrxx65gpvf5vqg-8000.app.github.dev/"

  useEffect(() => {
    // выполняем гет запрос к эндпоинту /songs для инициализации списка треков
    axios.get(`${API_URL}/songs`)
      .then(res => setSongs(res.data))
      .catch(err => console.error("Ошибка соединения с API: Проверьте статус сервера и URL", err))
  }, [])

  // если песня выбрана, показываем её текст
  if (currentSong) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', backgroundColor: '#121212', color: 'white', minHeight: '100vh' }}>
        <button onClick={() => setCurrentSong(null)} style={{ background: 'none', border: '1px solid #ffff11', color: '#ffff11', cursor: 'pointer', padding: '5px 15px' }}>← Назад</button>
        <h1 style={{ color: '#ffff11', marginTop: '20px' }}>{currentSong.title}</h1>
        <h2 style={{ color: '#aaa' }}>{currentSong.artist}</h2>
        <hr style={{ borderColor: '#333' }} />
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '1.2rem', lineHeight: '1.6' }}>{currentSong.lyrics}</pre>
      </div>
    )
  }

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
              style={{ borderBottom: '1px solid #333', padding: '15px 0', cursor: 'pointer', transition: '0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <h3 style={{ margin: '0', color: '#eee' }}>{song.title}</h3>
              <p style={{ margin: '5px 0 0 0', color: '#888' }}>{song.artist}</p>
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
