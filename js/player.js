// js/player.js

let ytPlayerVideoReady = false;
let ytPlayerVideo;
let ytPlayerAudioReady = false;
let ytPlayerAudio;
let isVideoMode = false;

// 1. Injetar a API dinamicamente para evitar a Race Condition
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 2. Definir a função globalmente no window
window.onYouTubeIframeAPIReady = function() {
    // Evita o erro de CORS se o origin for "null" (quando abre o arquivo HTML com dois cliques)
    const safeOrigin = window.location.origin !== "null" ? window.location.origin : "*";

    ytPlayerVideo = new YT.Player('ytplayer_video', {
        height: '100%', width: '100%',
        playerVars: { 'controls': 0, 'playsinline': 1, 'origin': safeOrigin, 'disablekb': 1, 'fs': 0, 'modestbranding': 1, 'rel': 0, 'enablejsapi': 1 },
        events: {
            'onReady': () => { 
                ytPlayerVideoReady = true; 
                if (typeof currentSong !== 'undefined' && currentSong && currentSong.yt_id) {
                    ytPlayerVideo.cueVideoById(currentSong.yt_id);
                }
            },
            'onStateChange': onPlayerStateChange
        }
    });

    ytPlayerAudio = new YT.Player('ytplayer_audio', {
        height: '100%', width: '100%',
        playerVars: { 'controls': 0, 'playsinline': 1, 'origin': safeOrigin, 'disablekb': 1, 'fs': 0, 'modestbranding': 1, 'rel': 0, 'enablejsapi': 1 },
        events: {
            'onReady': () => { 
                ytPlayerAudioReady = true; 
                if (typeof currentSong !== 'undefined' && currentSong && currentSong.yt_audio_id) {
                    ytPlayerAudio.cueVideoById(currentSong.yt_audio_id);
                }
            },
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        if (repeatMode === 'one') {
            if (isVideoMode && ytPlayerVideoReady) { ytPlayerVideo.seekTo(0); ytPlayerVideo.playVideo(); }
            else if (!isVideoMode && ytPlayerAudioReady && currentSong.yt_audio_id) { ytPlayerAudio.seekTo(0); ytPlayerAudio.playVideo(); }
        } else { playNext(); }
    }
}

function openPlayer(songId, clickedElement) {
    const song = db.songs.find(s => s.id === songId); if (!song) return;
    const parentListContainer = clickedElement?.closest('.popular-songs-list, .tracklist-container, .chart-list');
    if (parentListContainer) { const songElements = parentListContainer.querySelectorAll('.song-row[data-song-id], .track-row[data-song-id].available, .chart-item[data-song-id]'); currentQueue = Array.from(songElements).map(el => db.songs.find(s => s.id === el.dataset.songId)).filter(Boolean); } else { currentQueue = [song]; }
    currentQueueIndex = currentQueue.findIndex(s => s.id === songId); if (currentQueueIndex === -1) { currentQueue = [song]; currentQueueIndex = 0; }
    loadSong(song); maximizePlayer(); playAudio();
}

function closePlayer() { musicPlayerView?.classList.add('hidden'); document.body.classList.remove('player-open'); if (currentSong) { miniPlayer?.classList.remove('hidden'); } }
function maximizePlayer() { miniPlayer?.classList.add('hidden'); musicPlayerView?.classList.remove('hidden'); document.body.classList.add('player-open'); }

function loadSong(song) {
    if (!song) return; currentSong = song;
    document.querySelectorAll('.song-row.playing, .track-row.playing, .chart-item.playing').forEach(el => el.classList.remove('playing')); document.querySelectorAll(`[data-song-id="${song.id}"]`).forEach(el => el.classList.add('playing'));
    const artistNameStr = formatArtistString(song.artistIds, song.collabType);
    if (playerSongTitle) playerSongTitle.textContent = song.title; if (playerArtistName) playerArtistName.textContent = artistNameStr; if (miniPlayerTitle) miniPlayerTitle.textContent = song.title; if (miniPlayerArtist) miniPlayerArtist.textContent = artistNameStr;
    const parentRelease = [...db.albums, ...db.singles].find(r => r.id === song.albumId);
    if (parentRelease) { if (playerCoverArt) playerCoverArt.src = parentRelease.imageUrl; if (playerAlbumTitle) playerAlbumTitle.textContent = parentRelease.title; if (miniPlayerCover) miniPlayerCover.src = parentRelease.imageUrl; } else { if (playerCoverArt) playerCoverArt.src = 'https://i.imgur.com/AD3MbBi.png'; if (playerAlbumTitle) playerAlbumTitle.textContent = 'Single Avulso'; if (miniPlayerCover) miniPlayerCover.src = 'https://i.imgur.com/AD3MbBi.png'; }
    
    // CARREGA AUDIO MP3
    const audioEl = document.getElementById('audioElement');
    if (song.audio_url) { audioEl.src = song.audio_url; audioEl.load(); } else { audioEl.removeAttribute('src'); audioEl.load(); }

    // CARREGA YOUTUBE AUDIO
    if (song.yt_audio_id) {
        if (ytPlayerAudioReady) { ytPlayerAudio.cueVideoById(song.yt_audio_id); ytPlayerAudio.pauseVideo(); }
    } else {
        if (ytPlayerAudioReady) ytPlayerAudio.stopVideo();
    }

    // CARREGA YOUTUBE VÍDEO
    const toggleBtn = document.getElementById('toggleVideoBtn');
    if (song.yt_id) {
        if (toggleBtn) toggleBtn.style.display = 'inline-flex';
        if (ytPlayerVideoReady) { ytPlayerVideo.cueVideoById(song.yt_id); ytPlayerVideo.pauseVideo(); }
    } else {
        if (toggleBtn) toggleBtn.style.display = 'none';
        if (ytPlayerVideoReady) ytPlayerVideo.stopVideo(); 
    }

    isVideoMode = false;
    const coverArt = document.getElementById('playerCoverArt');
    if (coverArt) { coverArt.style.opacity = '1'; coverArt.style.pointerEvents = 'auto'; }
    if (toggleBtn) { toggleBtn.innerHTML = '<i class="fas fa-video"></i> <span>Mudar para Vídeo</span>'; toggleBtn.style.background = 'rgba(255,255,255,0.1)'; toggleBtn.style.color = 'white'; toggleBtn.style.borderColor = 'rgba(255,255,255,0.2)'; }

    const durationSeconds = song.durationSeconds || 180;
    if (playerSeekBar) { playerSeekBar.value = 0; playerSeekBar.max = durationSeconds; } if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0); if (playerTotalTime) playerTotalTime.textContent = formatTime(durationSeconds); if (miniPlayerProgress) { miniPlayerProgress.style.width = '0%'; miniPlayerProgress.dataset.max = durationSeconds; }
    if (isPlaying) { if(playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; if(miniPlayerPlayPauseBtn) miniPlayerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; } else { if(playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-play" style="margin-left:2px;"></i>'; if(miniPlayerPlayPauseBtn) miniPlayerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
}

function playAudio() { 
    if (!currentSong) return; 
    isPlaying = true; 
    const audioEl = document.getElementById('audioElement');
    
    if (isVideoMode) {
        if (ytPlayerVideoReady && currentSong.yt_id) ytPlayerVideo.playVideo();
    } else {
        if (currentSong.yt_audio_id && ytPlayerAudioReady) {
            ytPlayerAudio.playVideo();
        } else if (currentSong.audio_url) {
            if (!audioEl.error) {
                const playPromise = audioEl.play();
                if (playPromise !== undefined) playPromise.catch(() => { if (ytPlayerVideoReady && currentSong.yt_id) ytPlayerVideo.playVideo(); });
            } else if (ytPlayerVideoReady && currentSong.yt_id) {
                ytPlayerVideo.playVideo();
            }
        } else if (ytPlayerVideoReady && currentSong.yt_id) {
            ytPlayerVideo.playVideo(); 
        }
    }

    if (playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; 
    if (miniPlayerPlayPauseBtn) miniPlayerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; 
}

function pauseAudio() { 
    isPlaying = false; 
    const audioEl = document.getElementById('audioElement');
    audioEl.pause();
    if (ytPlayerVideoReady) ytPlayerVideo.pauseVideo();
    if (ytPlayerAudioReady) ytPlayerAudio.pauseVideo();

    if (playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-play" style="margin-left:2px;"></i>'; 
    if (miniPlayerPlayPauseBtn) miniPlayerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; 
}

function togglePlay(e) { if (e) e.stopPropagation(); if (isPlaying) pauseAudio(); else playAudio(); }

function playNext() {
    if (!currentQueue || currentQueue.length === 0 || !currentSong) return;
    if (repeatMode === 'one') { if (playerSeekBar) playerSeekBar.value = 0; if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0); if (miniPlayerProgress) miniPlayerProgress.style.width = '0%'; playAudio(); return; }
    if (isShuffle) { let randomIndex = currentQueueIndex; if (currentQueue.length > 1) { do { randomIndex = Math.floor(Math.random() * currentQueue.length); } while (randomIndex === currentQueueIndex); } currentQueueIndex = randomIndex; } else { currentQueueIndex++; }
    if (currentQueueIndex >= currentQueue.length) { if (repeatMode === 'all') { currentQueueIndex = 0; } else { currentQueueIndex = currentQueue.length - 1; const lastSong = currentQueue[currentQueueIndex]; if(lastSong) loadSong(lastSong); pauseAudio(); if(playerSeekBar) playerSeekBar.value = playerSeekBar.max; if(playerCurrentTime) playerCurrentTime.textContent = formatTime(playerSeekBar.max || 0); if(miniPlayerProgress) miniPlayerProgress.style.width = '100%'; return; } }
    const nextSong = currentQueue[currentQueueIndex]; if (nextSong) { loadSong(nextSong); if (isPlaying) playAudio(); else pauseAudio(); } else { pauseAudio(); }
}

function playPrevious() {
    if (!currentQueue || currentQueue.length === 0 || !currentSong) return;
    const currentTime = playerSeekBar ? parseFloat(playerSeekBar.value) : 0;
    if (currentTime > 3) { 
        if (playerSeekBar) playerSeekBar.value = 0; 
        if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0); 
        if (miniPlayerProgress) miniPlayerProgress.style.width = '0%'; 
        
        if(isVideoMode && ytPlayerVideoReady && currentSong.yt_id) ytPlayerVideo.seekTo(0, true);
        else if(!isVideoMode && ytPlayerAudioReady && currentSong.yt_audio_id) ytPlayerAudio.seekTo(0, true);
        else if(!isVideoMode && currentSong.audio_url) document.getElementById('audioElement').currentTime = 0;
        else if(!isVideoMode && ytPlayerVideoReady && currentSong.yt_id) ytPlayerVideo.seekTo(0, true);
        
        if(isPlaying) playAudio(); 
        return; 
    }
    if (isShuffle) { let randomIndex = currentQueueIndex; if (currentQueue.length > 1) { do { randomIndex = Math.floor(Math.random() * currentQueue.length); } while (randomIndex === currentQueueIndex); } currentQueueIndex = randomIndex; } else { currentQueueIndex--; }
    if (currentQueueIndex < 0) {
        if (repeatMode === 'all') { currentQueueIndex = currentQueue.length - 1; } 
        else { currentQueueIndex = 0; if (playerSeekBar) playerSeekBar.value = 0; if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0); if (miniPlayerProgress) miniPlayerProgress.style.width = '0%'; const firstSong = currentQueue[currentQueueIndex]; if (firstSong) { loadSong(firstSong); if(isPlaying) playAudio(); else pauseAudio(); } return; }
    }
    const prevSong = currentQueue[currentQueueIndex]; if (prevSong) { loadSong(prevSong); if (isPlaying) playAudio(); else pauseAudio(); } else { pauseAudio(); }
}

function toggleShuffle() { isShuffle = !isShuffle; playerShuffleBtn?.classList.toggle('active', isShuffle); }
function toggleRepeat() {
    if (repeatMode === 'none') { repeatMode = 'all'; playerRepeatBtn?.classList.add('active'); playerRepeatBtn.innerHTML = '<i class="fas fa-repeat"></i>'; } 
    else if (repeatMode === 'all') { repeatMode = 'one'; playerRepeatBtn?.classList.add('active'); playerRepeatBtn.innerHTML = '<i class="fas fa-repeat-1"></i>'; } 
    else { repeatMode = 'none'; playerRepeatBtn?.classList.remove('active'); playerRepeatBtn.innerHTML = '<i class="fas fa-repeat"></i>'; }
}

function updateProgressUI(currentTime, duration) {
    if (duration > 0 && playerSeekBar) {
        playerSeekBar.max = duration;
        playerSeekBar.value = currentTime;
        if (playerCurrentTime) playerCurrentTime.textContent = formatTime(currentTime);
        if (playerTotalTime) playerTotalTime.textContent = formatTime(duration);
        if (miniPlayerProgress) miniPlayerProgress.style.width = `${(currentTime / duration) * 100}%`;
    }
}

let simulationInterval = null;
function startSimulationTimer() {
    if (simulationInterval) clearInterval(simulationInterval);
    simulationInterval = setInterval(() => {
        if (isPlaying && playerSeekBar && currentSong) {
            const audioEl = document.getElementById('audioElement');
            
            if (isVideoMode && ytPlayerVideoReady && currentSong.yt_id && ytPlayerVideo.getPlayerState && ytPlayerVideo.getPlayerState() === YT.PlayerState.PLAYING) {
                updateProgressUI(ytPlayerVideo.getCurrentTime(), ytPlayerVideo.getDuration());
            } 
            else if (!isVideoMode && ytPlayerAudioReady && currentSong.yt_audio_id && ytPlayerAudio.getPlayerState && ytPlayerAudio.getPlayerState() === YT.PlayerState.PLAYING) {
                updateProgressUI(ytPlayerAudio.getCurrentTime(), ytPlayerAudio.getDuration());
            }
            else if (!isVideoMode && !currentSong.yt_audio_id && currentSong.audio_url && !audioEl.paused) {
                updateProgressUI(audioEl.currentTime, audioEl.duration || currentSong.durationSeconds || 180);
            }
            else if (!isVideoMode && !currentSong.yt_audio_id && !currentSong.audio_url && ytPlayerVideoReady && currentSong.yt_id && ytPlayerVideo.getPlayerState && ytPlayerVideo.getPlayerState() === YT.PlayerState.PLAYING) {
                updateProgressUI(ytPlayerVideo.getCurrentTime(), ytPlayerVideo.getDuration());
            }
            else if (!currentSong.yt_id && !currentSong.yt_audio_id && !currentSong.audio_url) {
                let currentValue = parseFloat(playerSeekBar.value); const maxValue = parseFloat(playerSeekBar.max);
                if (currentValue < maxValue) {
                    currentValue += 1; playerSeekBar.value = currentValue;
                    if (playerCurrentTime) playerCurrentTime.textContent = formatTime(currentValue);
                    if (miniPlayerProgress) miniPlayerProgress.style.width = `${(currentValue / maxValue) * 100}%`;
                } else {
                    if (repeatMode === 'one') { playerSeekBar.value = 0; if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0); if (miniPlayerProgress) miniPlayerProgress.style.width = '0%'; playAudio(); } else { playNext(); }
                }
            }
        }
    }, 1000);
}

function initializePlayerListeners() {
    document.getElementById('playerShareBtn')?.addEventListener('click', () => {
        if (currentSong && typeof shareLink === 'function') {
            shareLink('song', currentSong.id);
        }
    });

    playerCloseBtn?.addEventListener('click', closePlayer);
    playerPlayPauseBtn?.addEventListener('click', togglePlay);
    playerNextBtn?.addEventListener('click', playNext);
    playerPrevBtn?.addEventListener('click', playPrevious);
    playerShuffleBtn?.addEventListener('click', toggleShuffle);
    playerRepeatBtn?.addEventListener('click', toggleRepeat);
    
    playerSeekBar?.addEventListener('input', () => { 
        if (playerCurrentTime && playerSeekBar) playerCurrentTime.textContent = formatTime(playerSeekBar.value); 
        if (miniPlayerProgress) miniPlayerProgress.style.width = `${(playerSeekBar.value / playerSeekBar.max) * 100}%`; 
    });
    playerSeekBar?.addEventListener('change', () => { 
        const newTime = playerSeekBar.value;
        if (isVideoMode && currentSong?.yt_id && ytPlayerVideoReady) ytPlayerVideo.seekTo(newTime, true);
        else if (!isVideoMode && currentSong?.yt_audio_id && ytPlayerAudioReady) ytPlayerAudio.seekTo(newTime, true);
        else if (!isVideoMode && currentSong?.audio_url) document.getElementById('audioElement').currentTime = newTime;
        else if (!isVideoMode && currentSong?.yt_id && ytPlayerVideoReady) ytPlayerVideo.seekTo(newTime, true);
        if (isPlaying) playAudio(); 
    });
    
    miniPlayer?.addEventListener('click', maximizePlayer);
    miniPlayerPlayPauseBtn?.addEventListener('click', togglePlay);

    const toggleBtn = document.getElementById('toggleVideoBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isVideoMode = !isVideoMode;
            const coverArt = document.getElementById('playerCoverArt');
            const audioEl = document.getElementById('audioElement');
            
            if (isVideoMode) {
                if(coverArt) { coverArt.style.opacity = '0'; coverArt.style.pointerEvents = 'none'; }
                toggleBtn.innerHTML = '<i class="fas fa-music"></i> <span>Mudar para Áudio</span>';
                toggleBtn.style.background = 'var(--spotify-green)';
                toggleBtn.style.color = '#000';
                toggleBtn.style.borderColor = 'var(--spotify-green)';
                
                if (isPlaying) {
                    audioEl.pause();
                    if (ytPlayerAudioReady) ytPlayerAudio.pauseVideo();
                    if (ytPlayerVideoReady && currentSong.yt_id) ytPlayerVideo.playVideo();
                }
            } else {
                if(coverArt) { coverArt.style.opacity = '1'; coverArt.style.pointerEvents = 'auto'; }
                toggleBtn.innerHTML = '<i class="fas fa-video"></i> <span>Mudar para Vídeo</span>';
                toggleBtn.style.background = 'rgba(255,255,255,0.1)';
                toggleBtn.style.color = 'white';
                toggleBtn.style.borderColor = 'rgba(255,255,255,0.2)';
                
                if (isPlaying) {
                    if (ytPlayerVideoReady) ytPlayerVideo.pauseVideo();
                    
                    if (currentSong.yt_audio_id && ytPlayerAudioReady) {
                        ytPlayerAudio.playVideo();
                    } else if (currentSong.audio_url && !audioEl.error) {
                        const playPromise = audioEl.play();
                        if (playPromise !== undefined) playPromise.catch(() => { if (ytPlayerVideoReady && currentSong.yt_id) ytPlayerVideo.playVideo(); });
                    } else if (ytPlayerVideoReady && currentSong.yt_id) {
                        ytPlayerVideo.playVideo(); 
                    }
                }
            }
        });
    }

    startSimulationTimer();
}
