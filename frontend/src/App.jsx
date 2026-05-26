import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = "https:// silver-winner-pjr47xxvr6w7h7gv6-8000 .app.github.dev"; 

function App() {
  const [songs, setSongs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  
  // Авторизация
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Состояния для формы новой песни
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioFile, setAudioFile] = useState(null); // Здесь хранится сам файл mp3

  useEffect(() => { loadSongs(); }, []);

  const loadSongs = async () => {
    try {
      const res = await axios.get(`${API_URL}/songs`);
      setSongs(res.data);
    } catch (err) { console.error("Ошибка загрузки песен", err); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      // Переводим авторизацию на FormData для совместимости с бэкендом
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await axios.post(`${API_URL}/${authMode}`, formData);
      if (authMode === 'login') {
        setUser(res.data.username);
        setIsAuthOpen(false);
      } else {
        alert("Регистрация успешна! Войдите под своими данными.");
        setAuthMode('login');
      }
      setUsername('');
      setPassword('');
    } catch (err) { 
      alert("Ошибка: " + (err.response?.data?.detail || "Сбой аутентификации")); 
    }
  };

  // Функция добавления песни с файлом
  const handleAddSong = async (e) => {
    e.preventDefault();
    try {
      // Используем FormData для отправки файлов на бэкенд
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('lyrics', lyrics);
      if (audioFile) {
        formData.append('audio_file', audioFile); // Прикрепляем mp3 файл
      }

      await axios.post(`${API_URL}/songs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Очищаем форму после успешной отправки
      setTitle(''); 
      setArtist(''); 
      setLyrics('');
      setAudioFile(null);
      // Сбрасываем визуально поле выбора файла
      document.getElementById('file-input').value = '';
      
      loadSongs(); // Обновляем список треков
      alert("Произведение успешно добавлено!");
    } catch (err) { 
      alert("Не удалось сохранить песню в базу данных"); 
    }
  };

  return (
    <div className="app-layout">
      <header className="main-header">
        <h1>BRAGI NOTES</h1>
        {user ? <button onClick={() => setUser(null)}>Выйти ({user})</button> 
              : <button onClick={() => setIsAuthOpen(true)}>Войти / Регистрация</button>}
      </header>

      <main className="main-content">
        <section className="left-panel">
          <h2>Архив произведений</h2>
          <div className="songs-list">
            {songs.map(song => (
              <div key={song.id} onClick={() => setSelected(song)} className={`song-item ${selected?.id === song.id ? 'active' : ''}`}>
                <strong>{song.title}</strong> — {song.artist}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSong} className="add-song-form">
            <h3>Добавить новое произведение</h3>
            <input placeholder="Название трека" required value={title} onChange={e => setTitle(e.target.value)} />
            <input placeholder="Исполнитель" required value={artist} onChange={e => setArtist(e.target.value)} />
            
            {/* Поле выбора файла вместо текстовой ссылки */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.85rem', color: '#7ca0a0' }}>Аудиофайл трека (.mp3):</label>
              <input 
                id="file-input"
                type="file" 
                accept="audio/mp3, audio/mpeg"
                onChange={e => setAudioFile(e.target.files[0])} 
                style={{ border: 'none', padding: '5px 0' }}
              />
            </div>

            <textarea placeholder="Текст песни" required rows="5" value={lyrics} onChange={e => setLyrics(e.target.value)} />
            <button type="submit">Опубликовать</button>
          </form>
        </section>

        <section className="right-panel">
          {selected ? (
            <article className="lyrics-viewer">
              <h2>{selected.title}</h2>
              <h3>Автор: {selected.artist}</h3>
              
              {/* Аудио плеер HTML5 */}
              {selected.audio_url && (
                <div style={{ margin: '15px 0' }}>
                  <audio controls src={`${API_URL}${selected.audio_url}`} style={{ width: '100%' }} />
                </div>
              )}
              
              <hr />
              <pre className="lyrics-text">{selected.lyrics}</pre>
            </article>
          ) : <p className="placeholder">Выберите произведение из списка слева</p>}
        </section>
      </main>

      {isAuthOpen && (
        <div className="auth-modal-overlay">
          <form onSubmit={handleAuth} className="auth-form">
            <h3>{authMode === 'login' ? 'Авторизация' : 'Регистрация'}</h3>
            <input placeholder="Имя пользователя" required value={username} onChange={e => setUsername(e.target.value)} />
            <input type="password" placeholder="Пароль" required value={password} onChange={e => setPassword(e.target.value)} />
            <button type="submit">{authMode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
            <span onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="toggle-auth-mode">
              {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </span>
            <button type="button" onClick={() => setIsAuthOpen(false)} className="close-btn">Закрыть</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
