import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Автоматически вычисляем URL бэкенда на основе текущего адреса фронтенда в Codespaces
const CURRENT_URL = window.location.href;
const API_URL = CURRENT_URL.includes("5173") 
  ? CURRENT_URL.replace("5173", "8000").replace(/\/$/, "") 
  : "https://silver-winner-pjr47xxvr6w7h7gv6-8000.app.github.dev";

function App() {
  const [songs, setSongs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  
  // Авторизация
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Добавление музыки
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioFile, setAudioFile] = useState(null); 

  useEffect(() => { 
    loadSongs(); 
    const savedUser = localStorage.getItem('bragi_username');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const loadSongs = async () => {
    try {
      const res = await axios.get(`${API_URL}/songs`);
      setSongs(res.data);
    } catch (err) { 
      console.error("Ошибка загрузки песен", err); 
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const res = await axios.post(`${API_URL}/${authMode}`, formData);
      
      if (authMode === 'login') {
        setUser(res.data.username);
        localStorage.setItem('bragi_username', res.data.username);
        setIsAuthOpen(false);
      } else {
        alert("Регистрация успешна! Теперь введите данные для входа.");
        setAuthMode('login');
      }
      setUsername('');
      setPassword('');
    } catch (err) { 
      alert("Ошибка: " + (err.response?.data?.detail || "Сбой аутентификации")); 
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bragi_username');
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('lyrics', lyrics); 
      
      if (audioFile) {
        formData.append('audio_file', audioFile); 
      }

      await axios.post(`${API_URL}/songs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setTitle(''); 
      setArtist(''); 
      setLyrics('');
      setAudioFile(null);
      document.getElementById('file-input').value = '';
      
      loadSongs(); 
      alert("Произведение успешно добавлено!");
    } catch (err) { 
      alert("Не удалось сохранить песню в базу данных"); 
    }
  };

  const handleDeleteSong = async (e, songId) => {
    e.stopPropagation(); 
    if (!window.confirm("Удалить это произведение из архива?")) return;

    try {
      await axios.delete(`${API_URL}/songs/${songId}`);
      if (selected?.id === songId) {
        setSelected(null);
      }
      loadSongs(); 
    } catch (err) {
      alert("Не удалось удалить произведение");
    }
  };

  const styles = {
    appLayout: {
      backgroundColor: '#121614',
      color: '#e4eae6',
      minHeight: '100vh',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    },
    mainHeader: {
      backgroundColor: '#161f1b',
      borderBottom: '1px solid #23322b',
      padding: '15px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    },
    headerTitle: {
      fontSize: '1.6rem',
      fontWeight: 'bold',
      color: '#4ade80',
      letterSpacing: '2px',
      margin: 0
    },
    authBtn: {
      backgroundColor: '#1f2e26',
      color: '#4ade80',
      border: '1px solid #34d399',
      padding: '8px 18px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    logoutBtn: {
      backgroundColor: '#2d1f1f',
      color: '#f87171',
      border: '1px solid #f87171',
      padding: '8px 18px',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    mainContent: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '25px',
      padding: '25px',
      flex: 1
    },
    panel: {
      backgroundColor: '#1a231f',
      borderRadius: '12px',
      padding: '25px',
      border: '1px solid #23322b',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    panelTitle: {
      color: '#a7f3d0',
      fontSize: '1.3rem',
      margin: '0 0 10px 0',
      borderBottom: '2px solid #2e4239',
      paddingBottom: '8px'
    },
    songsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxHeight: '300px',
      overflowY: 'auto'
    },
    songItem: (isActive) => ({
      padding: '12px 16px',
      borderRadius: '8px',
      backgroundColor: isActive ? '#22c55e20' : '#202b25',
      border: isActive ? '1px solid #22c55e' : '1px solid #2a3a31',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }),
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: '#161e1a',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #23322b'
    },
    input: {
      backgroundColor: '#1f2924',
      border: '1px solid #2d3f35',
      borderRadius: '6px',
      padding: '10px',
      color: '#fff',
      fontSize: '0.95rem'
    },
    submitBtn: {
      backgroundColor: '#10b981',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      padding: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    deleteLink: {
      color: '#ef4444',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '600',
      marginLeft: '10px'
    },
    lyricsViewer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    },
    lyricsText: {
      backgroundColor: '#151c19',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #23322b',
      whiteSpace: 'pre-wrap',
      fontFamily: 'inherit',
      lineHeight: '1.6',
      color: '#d1dbd6'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modalForm: {
      backgroundColor: '#1a231f',
      border: '1px solid #34d399',
      padding: '30px',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '400px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
    }
  };

  return (
    <div style={styles.appLayout}>
      <header style={styles.mainHeader}>
        <h1 style={styles.headerTitle}>BRAGI NOTES</h1>
        {user ? (
          <button style={styles.logoutBtn} onClick={handleLogout}>Выйти ({user})</button> 
        ) : (
          <button style={styles.authBtn} onClick={() => setIsAuthOpen(true)}>Войти / Регистрация</button>
        )}
      </header>

      <main style={styles.mainContent}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Архив произведений</h2>
          <div style={styles.songsList}>
            {songs.map(song => (
              <div 
                key={song.id} 
                onClick={() => setSelected(song)} 
                style={styles.songItem(selected?.id === song.id)}
              >
                <div>
                  <strong style={{ color: '#fff' }}>{song.title}</strong> — <span style={{ color: '#a7f3d0' }}>{song.artist}</span>
                </div>
                {user && (
                  <span 
                    onClick={(e) => handleDeleteSong(e, song.id)} 
                    style={styles.deleteLink}
                  >
                    Удалить
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Форма добавления отображается ТОЛЬКО авторизованному администратору */}
          {user && (
            <form onSubmit={handleAddSong} style={styles.form}>
              <h3 style={{ margin: '0 0 5px 0', color: '#34d399', fontSize: '1.1rem' }}>Добавить новое произведение</h3>
              <input style={styles.input} placeholder="Название трека" required value={title} onChange={e => setTitle(e.target.value)} />
              <input style={styles.input} placeholder="Исполнитель" required value={artist} onChange={e => setArtist(e.target.value)} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>Аудиофайл трека (.mp3):</label>
                <input 
                  id="file-input"
                  type="file" 
                  accept="audio/mp3, audio/mpeg"
                  onChange={e => setAudioFile(e.target.files[0])} 
                  style={{ border: 'none', padding: '5px 0', color: '#a7f3d0' }}
                />
              </div>

              <textarea 
                style={styles.input} 
                placeholder="Текст песни (необязательно)" 
                rows="4" 
                value={lyrics} 
                onChange={e => setLyrics(e.target.value)} 
              />
              <button type="submit" style={styles.submitBtn}>Опубликовать</button>
            </form>
          )}
        </section>

        <section style={styles.panel}>
          {selected ? (
            <article style={styles.lyricsViewer}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>{selected.title}</h2>
              <h3 style={{ margin: 0, color: '#34d399', fontWeight: '400' }}>Автор: {selected.artist}</h3>
              
              {selected.audio_url && (
                <div style={{ margin: '10px 0' }}>
                  <audio controls src={`${API_URL}${selected.audio_url}`} style={{ width: '100%' }} />
                </div>
              )}
              
              <hr style={{ border: 'none', height: '1px', backgroundColor: '#23322b', margin: '10px 0' }} />
              <pre style={styles.lyricsText}>{selected.lyrics || "Текст отсутствует"}</pre>
            </article>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
              <p>Выберите произведение из списка слева</p>
            </div>
          )}
        </section>
      </main>

      {isAuthOpen && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleAuth} style={styles.modalForm}>
            <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1.4rem', textAlign: 'center' }}>
              {authMode === 'login' ? 'Авторизация' : 'Регистрация'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
              Введите данные для записи в систему
            </p>
            <input style={styles.input} placeholder="Имя пользователя" required value={username} onChange={e => setUsername(e.target.value)} />
            <input style={styles.input} type="password" placeholder="Пароль" required value={password} onChange={e => setPassword(e.target.value)} />
            
            <button type="submit" style={styles.submitBtn}>
              {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
            
            <span 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
              style={{ color: '#34d399', textAlign: 'center', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
            >
              {authMode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </span>
            
            <button 
              type="button" 
              onClick={() => setIsAuthOpen(false)} 
              style={{ ...styles.input, backgroundColor: 'transparent', cursor: 'pointer', border: '1px solid #ef4444', color: '#ef4444' }}
            >
              Закрыть
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
