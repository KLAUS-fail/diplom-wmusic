import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Автоматически вычисляем URL бэкенда на основе текущего адреса фронтенда в Codespaces
const CURRENT_URL = window.location.origin;
const API_URL = "https://cuddly-spork-4jwpjwxwv5vh5jr9-8000.app.github.dev";
const currentUserId = 2;

function App() {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [selected, setSelected] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Храним статус роли
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  
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
    loadPlaylists();
    loadFavorites();
    const savedUser = localStorage.getItem('bragi_username');
    const savedAdmin = localStorage.getItem('bragi_is_admin');
    if (savedUser) {
      setUser(savedUser);
      setIsAdmin(savedAdmin === 'true');
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
    const handleSelectPlaylist = async (playlistId) => {
    if (activePlaylistId === playlistId) {
      
      setActivePlaylistId(null);
      loadSongs();
    } else {
      setActivePlaylistId(playlistId);
      try {
        const res = await axios.get(`${API_URL}/playlists/${playlistId}/songs`);
        setSongs(res.data); // Подменяем список треков на экране песнями из плейлиста
      } catch (err) {
        console.error("Ошибка загрузки песен плейлиста", err);
      }
    }
  };

   const loadPlaylists = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/${currentUserId}/playlists`);
      setPlaylists(res.data);
    } catch (err) {
      console.error("Ошибка загрузки плейлистов", err);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/${currentUserId}/favorites`);
      setFavoriteSongs(res.data);
    } catch (err) {
      console.error("Ошибка загрузки избранного", err);
    }
  };

const handleLike = async (e, songId) => {
    e.stopPropagation();
    try {
      const formData = new FormData();
      formData.append('user_id', currentUserId);
      formData.append('song_id', songId);
      
      await axios.post(`${API_URL}/songs/like`, formData);
      loadFavorites(); // Перезагружаем список любимых треков
    } catch (err) {
      alert("Не удалось изменить статус лайка");
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    try {
      const formData = new FormData();
      formData.append('title', newPlaylistTitle);
      formData.append('user_id', currentUserId);
      
      await axios.post(`${API_URL}/playlists`, formData);
      setNewPlaylistTitle('');
      loadPlaylists(); // Перезагружаем список плейлистов
    } catch (err) {
      alert("Не удалось создать плейлист");
    }
  };

  const handleAddSongToPlaylist = async (e, playlistId, songId) => {
    e.stopPropagation();
    if (!playlistId) return;
    try {
      const formData = new FormData();
      formData.append('playlist_id', playlistId);
      formData.append('song_id', songId);
      
      await axios.post(`${API_URL}/playlists/add-song`, formData);
      alert("Произведение добавлено в выбранный плейлист!");
    } catch (err) {
      alert("Не удалось добавить в плейлист");
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
        setIsAdmin(res.data.is_admin);
        localStorage.setItem('bragi_username', res.data.username);
        localStorage.setItem('bragi_is_admin', res.data.is_admin ? 'true' : 'false');
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
    setIsAdmin(false);
    localStorage.removeItem('bragi_username');
    localStorage.removeItem('bragi_is_admin');
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('lyrics', lyrics); 
      
      if (audioFile && audioFile[0]) {
        formData.append('audio_file', audioFile[0]); 
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
    },
    playlistBadge: {
      fontSize: '0.8rem',
      backgroundColor: '#1f2e26',
      color: '#34d399',
      padding: '3px 8px',
      borderRadius: '12px',
      border: '1px solid #10b981',
      display: 'inline-block',
      margin: '4px 4px 4px 0',
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
        {/* ЛЕВАЯ ПАНЕЛЬ С ТРЕКАМИ */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Архив произведений</h2>
          <div style={styles.songsList}>
            {songs.map(song => {
              const isLiked = favoriteSongs.some(f => f.id === song.id);
              return (
                <div 
                  key={song.id} 
                  onClick={() => setSelected(song)} 
                  style={styles.songItem(selected?.id === song.id)}
                >
                  <div>
                    <strong style={{ color: '#fff' }}>{song.title}</strong> — <span style={{ color: '#a7f3d0' }}>{song.artist}</span>
                  </div>
                  
                  {/* Новые кнопки управления треком (лайк и плейлист) */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {user && (
                      <span 
                        onClick={(e) => handleLike(e, song.id)}
                        style={{ fontSize: '1.2rem', cursor: 'pointer', userSelect: 'none' }}
                        title={isLiked ? "Убрать из избранного" : "Добавить в избранное"}
                      >
                        {isLiked ? '❤️' : '🖤'}
                      </span>
                    )}

                    {user && (
                      <select 
                        onChange={(e) => handleAddSongToPlaylist(e, e.target.value, song.id)}
                        style={{ backgroundColor: '#1f2924', color: '#a7f3d0', border: '1px solid #2d3f35', borderRadius: '6px', padding: '4px', fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        <option value="">+ Плейлист</option>
                        {playlists.map(p => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    )}

                    {/* ТОЛЬКО АДМИН ВИДИТ КНОПКУ УДАЛЕНИЯ */}
                    {user && isAdmin && (
                      <span 
                        onClick={(e) => handleDeleteSong(e, song.id)} 
                        style={styles.deleteLink}
                      >
                        Удалить
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ИНТЕРФЕЙС УПРАВЛЕНИЯ ПЛЕЙЛИСТАМИ */}
          {user && (
            <div style={{ borderTop: '2px solid #2e4239', paddingTop: '15px', marginTop: '5px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#34d399', fontSize: '1.1rem' }}>📂 Управление медиатекой</h3>
              <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input 
                  style={{ ...styles.input, flex: 1 }} 
                  placeholder="Название нового плейлиста..." 
                  required 
                  value={newPlaylistTitle} 
                  onChange={e => setNewPlaylistTitle(e.target.value)} 
                />
                <button type="submit" style={{ ...styles.submitBtn, padding: '10px 20px' }}>Создать</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
                <div>
                  <span style={{ color: '#a7f3d0' }}>Ваши плейлисты:</span>
                  {playlists.length === 0 ? <span style={{ color: '#6b7280', marginLeft: '10px', fontSize: '0.85rem' }}>нет созданных</span> : null}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {playlists.map(p => {
                      const isActive = activePlaylistId === p.id;
                      return (
                        <span 
                          key={p.id} 
                          onClick={() => handleSelectPlaylist(p.id)}
                          style={{ 
                            ...styles.playlistBadge, 
                            cursor: 'pointer', 
                            backgroundColor: isActive ? '#10b981' : '#1f2e26',
                            color: isActive ? '#fff' : '#34d399'
                          }}
                          title="Нажмите, чтобы открыть треки"
                        >
                          🔹 {p.title}
                        </span>
                      );
                    })}
                  </div>

                  {/* Кнопка быстрого возврата ко всем песням архива */}
                  {activePlaylistId && (
                    <button 
                      onClick={() => { setActivePlaylistId(null); loadSongs(); }}
                      style={{ ...styles.submitBtn, backgroundColor: '#2b3a32', padding: '5px 10px', fontSize: '0.8rem', marginTop: '10px' }}
                    >
                      ⬅ Показать весь архив
                    </button>
                  )}
                  <span style={{ color: '#a7f3d0' }}>❤️ Любимых произведений:</span> <strong style={{ color: '#4ade80' }}>{favoriteSongs.length}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ТОЛЬКО АДМИН ВИДИТ ФОРМУ ДОБАВЛЕНИЯ */}
          {user && isAdmin && (
            <form onSubmit={handleAddSong} style={{ ...styles.form, marginTop: '15px' }}>
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

        {/* ПРАВАЯ ПАНЕЛЬ С ПЛЕЕРОМ И ЛИРИКОЙ */}
        <section style={styles.panel}>
          {selected ? (
            <article style={styles.lyricsViewer}>
              {user ? (
                <>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.8rem' }}>{selected.title}</h2>
                  <h3 style={{ margin: 0, color: '#34d399', fontWeight: '400' }}>Автор: {selected.artist}</h3>
                  
                  {selected.audio_url && (
                    <div style={{ margin: '10px 0' }}>
                      <audio controls src={`${API_URL}${selected.audio_url}`} style={{ width: '100%' }} />
                    </div>
                  )}
                  
                  <hr style={{ border: 'none', height: '1px', backgroundColor: '#23322b', margin: '10px 0' }} />
                  <pre style={styles.lyricsText}>{selected.lyrics || "Текст отсутствует"}</pre>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', gap: '15px', color: '#9ca3af', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem' }}>🔒</div>
                  <h3>Доступ ограничен</h3>
                  <p style={{ maxWidth: '300px', fontSize: '0.9rem' }}>
                    Прослушивание аудиозаписей и просмотр текстов доступны только зарегистрированным слушателям системы.
                  </p>
                  <button style={styles.submitBtn} onClick={() => setIsAuthOpen(true)}>Войти в систему</button>
                </div>
              )}
            </article>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
              <p>Выберите произведение из списка слева</p>
            </div>
          )}
        </section>
      </main>

      {/* МОДАЛКА АВТОРИЗАЦИИ */}
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
