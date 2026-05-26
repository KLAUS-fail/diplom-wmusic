import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = "https://silver-winner-pjr47xxvr6w7h7gv6-8000.app.github.dev"; 

function App() {
  const [songs, setSongs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  
  // Авторизация
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Форма трека
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioUrl, setAudioUrl] = useState(''); // Ссылка на MP3

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
      const res = await axios.post(`${API_URL}/${authMode}`, { username, password });
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

  const handleAddSong = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/songs`, { title, artist, lyrics, audio_url: audioUrl });
      setTitle(''); 
      setArtist(''); 
      setLyrics('');
      setAudioUrl('');
      loadSongs();
    } catch (err) { alert("Не удалось сохранить песню"); }
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
            <input placeholder="Путь к MP3 (например, /static/audio/test.mp3)" value={audioUrl} onChange={e => setAudioUrl(e.target.value)} />
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
