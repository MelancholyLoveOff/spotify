// js/player.js

let ytPlayerReady = false;
let ytPlayer;
let isVideoMode = false; // Controla se estamos a ver a Capa ou o Vídeo

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('ytplayer', {
        height: '100%',
        width: '100%',
        playerVars: { 
            'controls': 0, // Esconde os controlos do YouTube
            'playsinline': 1,
            'origin': window.location.origin,
            'disablekb': 1,
            'fs': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': () => { ytPlayerReady = true; },
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        if (repeatMode === 'one') {
            ytPlayer.seekTo(0);
            ytPlayer.playVideo();
        } else {
            playNext();
        }
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
    
    const toggleBtn = document.getElementById('toggleVideoBtn');
    
    // Se a música tiver YouTube ID: Carrega o vídeo e MOSTRA o botão de vídeo
    if (ytPlayerReady && song.yt_id) {
        ytPlayer.loadVideoById(song.yt_id);
        if (!isPlaying) ytPlayer.pauseVideo();
        if (toggleBtn) toggleBtn.style.display = 'inline-flex';
    } else {
        // Se não tiver YouTube, esconde o botão
        if (toggleBtn) toggleBtn.style.display = 'none';
    }

    // Resetar o ecrã sempre para "Modo Áudio" (mostrar a Capa do Álbum) ao mudar de música
    isVideoMode = false;
    if (playerCoverArt) {
        playerCoverArt.style.opacity = '1';
        playerCoverArt.style.pointerEvents = 'auto'; // Impede de clicar no vídeo acidentalmente
    }
    if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fas fa-video"></i> <span>Mudar para Vídeo</span>';
        toggleBtn.style.background = 'rgba(255,255,255,0.1)';
        toggleBtn.style.color = 'white';
        toggleBtn.style.borderColor = 'rgba(255,255,255,0.2)';
    }

    const durationSeconds = song.durationSeconds || 180;
    if (playerSeekBar) { playerSeekBar.value = 0; playerSeekBar.max = durationSeconds; } if (playerCurrentTime) playerCurrentTime.textContent = formatTime(0); if (playerTotalTime) playerTotalTime.textContent = formatTime(durationSeconds); if (miniPlayerProgress) { miniPlayerProgress.style.width = '0%'; miniPlayerProgress.dataset.max = durationSeconds; }
    if (isPlaying) { if(playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; if(miniPlayerPlayPauseBtn) miniPlayerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; } else { if(playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-play" style="margin-left:2px;"></i>'; if(miniPlayerPlayPauseBtn) miniPlayerPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>'; }
}

function playAudio() { 
    if (!currentSong) return; 
    isPlaying = true; 
    
    if (ytPlayerReady && currentSong.yt_id) ytPlayer.playVideo();

    if (playerPlayPauseBtn) playerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; 
    if (miniPlayerPlayPauseBtn) miniPlayerPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>'; 
}

function pauseAudio() { 
    isPlaying = false; 
    
    if (ytPlayerReady && currentSong.yt_id) ytPlayer.pauseVideo();

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
        if(ytPlayerReady && currentSong.yt_id) ytPlayer.seekTo(0, true);
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

let simulationInterval = null;
function startSimulationTimer() {
    if (simulationInterval) clearInterval(simulationInterval);
    simulationInterval = setInterval(() => {
        if (isPlaying && playerSeekBar && currentSong) {
            
            // Lê do YouTube
            if (ytPlayerReady && currentSong.yt_id && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
                const currentTime = ytPlayer.getCurrentTime();
                const duration = ytPlayer.getDuration();
                
                if (duration > 0) {
                    playerSeekBar.max = duration;
                    playerSeekBar.value = currentTime;
                    if (playerCurrentTime) playerCurrentTime.textContent = formatTime(currentTime);
                    if (playerTotalTime) playerTotalTime.textContent = formatTime(duration);
                    if (miniPlayerProgress) miniPlayerProgress.style.width = `${(currentTime / duration) * 100}%`;
                }
            } 
            // Simulador antigo (se não tiver yt_id)
            else if (!currentSong.yt_id) {
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
    playerCloseBtn?.addEventListener('click', closePlayer);
    playerPlayPauseBtn?.addEventListener('click', togglePlay);
    playerNextBtn?.addEventListener('click', playNext);
    playerPrevBtn?.addEventListener('click', playPrevious);
    playerShuffleBtn?.addEventListener('click', toggleShuffle);
    playerRepeatBtn?.addEventListener('click', toggleRepeat);
    
    // Sincronizar o toque da barra
    playerSeekBar?.addEventListener('input', () => { 
        if (playerCurrentTime && playerSeekBar) playerCurrentTime.textContent = formatTime(playerSeekBar.value); 
        if (miniPlayerProgress) miniPlayerProgress.style.width = `${(playerSeekBar.value / playerSeekBar.max) * 100}%`; 
    });
    playerSeekBar?.addEventListener('change', () => { 
        if (ytPlayerReady && currentSong?.yt_id) {
            ytPlayer.seekTo(playerSeekBar.value, true);
        }
        if (isPlaying) playAudio(); 
    });
    
    miniPlayer?.addEventListener('click', maximizePlayer);
    miniPlayerPlayPauseBtn?.addEventListener('click', togglePlay);
    
    // NOVA FUNCIONALIDADE: LÓGICA DO BOTÃO VÍDEO / ÁUDIO
    const toggleBtn = document.getElementById('toggleVideoBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isVideoMode = !isVideoMode;
            const coverArt = document.getElementById('playerCoverArt');
            
            if (isVideoMode) {
                // Revela o vídeo (Esconde a capa)
                if(coverArt) {
                    coverArt.style.opacity = '0';
                    coverArt.style.pointerEvents = 'none'; // Permite clicar no vídeo do YT se quiser
                }
                toggleBtn.innerHTML = '<i class="fas fa-music"></i> <span>Mudar para Áudio</span>';
                toggleBtn.style.background = 'var(--spotify-green)';
                toggleBtn.style.color = '#000';
                toggleBtn.style.borderColor = 'var(--spotify-green)';
            } else {
                // Esconde o vídeo (Mostra a capa)
                if(coverArt) {
                    coverArt.style.opacity = '1';
                    coverArt.style.pointerEvents = 'auto'; // Impede de clicar no YT por trás
                }
                toggleBtn.innerHTML = '<i class="fas fa-video"></i> <span>Mudar para Vídeo</span>';
                toggleBtn.style.background = 'rgba(255,255,255,0.1)';
                toggleBtn.style.color = 'white';
                toggleBtn.style.borderColor = 'rgba(255,255,255,0.2)';
            }
        });
    }

    startSimulationTimer();
}
