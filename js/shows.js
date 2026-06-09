// js/shows.js

db.stages = [];
db.tours = [];

async function loadShowsAndStages() {
    if (!supabaseClient) return;
    try {
        const [stagesRes, toursRes] = await Promise.all([
            supabaseClient.from('stages').select('*'),
            supabaseClient.from('tours').select('*')
        ]);
        if (stagesRes.data) db.stages = stagesRes.data;
        if (toursRes.data) db.tours = toursRes.data;
    } catch (err) {
        console.error("Erro ao carregar shows/stages:", err);
    }
}

window.renderArtistExtras = function(artistId) {
    const stagesContainer = document.getElementById('artistStagesList');
    const toursContainer = document.getElementById('artistToursList');
    
    const artistStages = db.stages.filter(s => s.artist_id === artistId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const artistTours = db.tours.filter(t => t.artist_id === artistId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const isOwner = currentPlayer && (currentPlayer.artists.includes(artistId) || currentPlayer.id === artistId);

    // Renderiza Stages
    if (artistStages.length > 0) {
        document.getElementById('stagesHeaderContainer').classList.remove('hidden');
        stagesContainer.classList.remove('hidden');
        stagesContainer.innerHTML = artistStages.map(stage => {
            const song = db.songs.find(s => s.id === stage.song_id);
            const songTitle = song ? song.title : 'Performance';
            
            const adminBtns = isOwner ? `
                <div style="position: absolute; top: 4px; right: 4px; z-index: 10; display: flex; gap: 4px;">
                    <button onclick="event.stopPropagation(); editStage('${stage.id}')" style="background: rgba(255,255,255,0.9); color: black; border: none; border-radius: 4px; width: 26px; height: 26px; cursor: pointer;"><i class="fas fa-pencil-alt"></i></button>
                    <button onclick="event.stopPropagation(); deleteStage('${stage.id}')" style="background: rgba(255,0,0,0.9); color: white; border: none; border-radius: 4px; width: 26px; height: 26px; cursor: pointer;"><i class="fas fa-trash"></i></button>
                </div>
            ` : '';

            return `
            <div class="scroll-item" onclick="playStageVideo('${stage.yt_id}', '${songTitle}')" style="width: 200px; cursor: pointer; position: relative;">
                ${adminBtns}
                <div style="position: relative; width: 100%; aspect-ratio: 16/9; margin-bottom: 8px; border-radius: 4px; overflow: hidden;">
                    <img src="https://img.youtube.com/vi/${stage.yt_id}/mqdefault.jpg" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-play-circle" style="font-size: 32px; color: white;"></i>
                    </div>
                </div>
                <p style="font-size: 14px; margin-bottom: 2px;">${stage.title}</p>
                <span style="font-size: 12px; color: var(--spotify-green);"><i class="fas fa-music"></i> ${songTitle}</span>
            </div>`;
        }).join('');
    } else {
        document.getElementById('stagesHeaderContainer').classList.add('hidden');
        stagesContainer.classList.add('hidden');
    }

    // Renderiza Turnês
    if (artistTours.length > 0) {
        document.getElementById('toursHeaderContainer').classList.remove('hidden');
        toursContainer.classList.remove('hidden');
        toursContainer.innerHTML = artistTours.map(tour => {
            const adminBtns = isOwner ? `
                <div style="position: absolute; top: 4px; right: 4px; z-index: 10; display: flex; gap: 4px;">
                    <button onclick="event.stopPropagation(); editTour('${tour.id}')" style="background: rgba(255,255,255,0.9); color: black; border: none; border-radius: 4px; width: 26px; height: 26px; cursor: pointer;"><i class="fas fa-pencil-alt"></i></button>
                    <button onclick="event.stopPropagation(); deleteTour('${tour.id}')" style="background: rgba(255,0,0,0.9); color: white; border: none; border-radius: 4px; width: 26px; height: 26px; cursor: pointer;"><i class="fas fa-trash"></i></button>
                </div>
            ` : '';

            return `
            <div class="scroll-item" onclick="playTour('${tour.id}')" style="text-align: center; cursor: pointer; position: relative;">
                ${adminBtns}
                <img src="${tour.image_url}" alt="${tour.title}" style="width: 150px; height: 150px; border-radius: 8px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                <p style="margin-top: 8px; font-weight: bold;">${tour.title}</p>
                <span style="font-size: 12px; color: var(--spotify-green);"><i class="fas fa-play"></i> Tocar Setlist</span>
            </div>
            `;
        }).join('');
    } else {
        document.getElementById('toursHeaderContainer').classList.add('hidden');
        toursContainer.classList.add('hidden');
    }
}

// ==========================================
// AÇÕES DE EDIÇÃO E EXCLUSÃO
// ==========================================

window.deleteStage = async function(id) {
    if (!confirm("Tem certeza que deseja apagar este Stage?")) return;
    await supabaseClient.from('stages').delete().eq('id', id);
    showToast("Stage apagado!", "success");
    await loadShowsAndStages();
    if (activeArtist) renderArtistExtras(activeArtist.id);
}

window.deleteTour = async function(id) {
    if (!confirm("Tem certeza que deseja apagar esta Turnê?")) return;
    await supabaseClient.from('tours').delete().eq('id', id);
    showToast("Turnê apagada!", "success");
    await loadShowsAndStages();
    if (activeArtist) renderArtistExtras(activeArtist.id);
}

window.editStage = function(id) {
    const stage = db.stages.find(s => s.id === id);
    if (!stage) return;
    
    const newTitle = prompt("Novo nome do Stage:", stage.title);
    if (!newTitle) return;
    
    const newYt = prompt("Novo link do YouTube:", "https://youtube.com/watch?v=" + stage.yt_id);
    let ytId = stage.yt_id;
    if (newYt) ytId = extractYouTubeID(newYt) || stage.yt_id;

    supabaseClient.from('stages').update({ title: newTitle, yt_id: ytId }).eq('id', id).then(() => {
        showToast("Stage atualizado!", "success");
        loadShowsAndStages().then(() => { if (activeArtist) renderArtistExtras(activeArtist.id); });
    });
}

window.editTour = function(id) {
    const tour = db.tours.find(t => t.id === id);
    if (!tour) return;

    // Navega para o Estúdio e mostra o Form de Tour
    if (typeof switchView === 'function') switchView('studioView');
    document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelector('.bottom-nav-item[data-tab="studioSection"]')?.classList.add('active');
    
    document.querySelectorAll('.studio-form-content').forEach(f => f.classList.remove('active'));
    document.getElementById('wysiwygTourForm').classList.add('active');
    document.getElementById('currentStudioMenuLabel').textContent = 'Editar Turnê';

    document.getElementById('editingTourId').value = tour.id;
    document.getElementById('tourTitle').value = tour.title;
    document.getElementById('tourCoverImg').src = tour.image_url;
    document.getElementById('tourWysiwygBg').style.backgroundImage = `url(${tour.image_url})`;
    document.getElementById('tourCoverUrl').value = tour.image_url;

    document.getElementById('tourArtistSelect').innerHTML = `<option value="${tour.artist_id}">${db.artists.find(a=>a.id===tour.artist_id)?.name || 'Artista'}</option>`;
    
    // Puxa as músicas e carrega no editor!
    const tourSongs = tour.song_ids.map(sid => db.songs.find(s => s.id === sid)).filter(Boolean);
    const editor = document.getElementById('tourTracklistEditor');
    editor.dataset.tracks = JSON.stringify(tourSongs);
    
    if (typeof populateTracklistEditor === 'function') populateTracklistEditor(editor, tourSongs);

    document.getElementById('submitTourBtn').innerHTML = '<i class="fas fa-save"></i> Salvar Turnê';
}

// ==========================================
// FUNÇÕES DE PLAYER
// ==========================================

window.playStageVideo = function(ytId, title) {
    const tempSong = {
        id: 'stage_' + ytId,
        title: "Stage: " + title,
        artistIds: [activeArtist ? activeArtist.id : null],
        durationSeconds: 200,
        yt_id: ytId,
        cover: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
        isStage: true
    };
    
    currentQueue = [tempSong];
    currentQueueIndex = 0;
    
    loadSong(tempSong);
    
    isVideoMode = true; 
    const toggleBtn = document.getElementById('toggleVideoBtn');
    if (toggleBtn) toggleBtn.style.display = 'none'; 
    
    const coverArt = document.getElementById('playerCoverArt');
    if (coverArt) coverArt.style.opacity = '0';

    maximizePlayer();
    
    if (window.ytPlayerAudio && typeof window.ytPlayerAudio.pauseVideo === 'function') window.ytPlayerAudio.pauseVideo();
    const audioEl = document.getElementById('audioElement');
    if (audioEl) audioEl.pause();

    playAudio();
    showToast("📺 Exibindo Performance Oficial", "success");
}

window.playTour = function(tourId) {
    const tour = db.tours.find(t => t.id === tourId);
    if (!tour || !tour.song_ids) return showToast("Setlist vazia!", "error");
    const tourSongs = tour.song_ids.map(id => db.songs.find(s => s.id === id)).filter(Boolean);
    if (tourSongs.length === 0) return showToast("Músicas não encontradas.", "error");

    currentQueue = tourSongs;
    currentQueueIndex = 0;
    showToast(`🎸 Turnê iniciada: ${tour.title}!`, "success");
    loadSong(currentQueue[0]);
    maximizePlayer();
    playAudio();
}

// ==========================================
// INJEÇÃO DA INTERFACE WYSIWYG
// ==========================================

function injectShowsModals() {
    // MODAL DE STAGE (Continua como Modal Simples)
    const stageModalHtml = `
    <div id="postStageModal" class="modal-overlay hidden">
        <div class="modal-content action-modal-content">
            <h3 style="text-align:center;">Postar Stage</h3>
            <div class="studio-form-group"><label>Artista</label><select id="stageArtistSelect" class="wysiwyg-select"></select></div>
            <div class="studio-form-group"><label>Música</label><select id="stageSongSelect" class="wysiwyg-select"></select></div>
            <div class="studio-form-group"><label>Nome do Stage (Ex: Inkigayo)</label><input type="text" id="stageTitleInput" class="wysiwyg-input"></div>
            <div class="studio-form-group"><label>Link do YouTube</label><input type="url" id="stageYtInput" class="wysiwyg-input" placeholder="https://youtube.com/..."></div>
            <div class="modal-actions">
                <button id="cancelStageBtn" class="cancel-btn" style="flex:1;">Cancelar</button>
                <button id="submitStageBtn" class="submit-btn" style="flex:1;">Postar</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', stageModalHtml);

    // NOVO FORMULÁRIO DE TURNÊ (Estilo WYSIWYG de Álbum)
    const tourFormHtml = `
    <form id="wysiwygTourForm" class="studio-form-content hidden" style="padding: 0; background: transparent;">
        <input type="hidden" id="editingTourId" value="">
        <div class="album-header" style="padding: 40px 24px 24px; border-radius: 8px 8px 0 0;">
            <div id="tourWysiwygBg" class="header-bg" style="background-image: url('https://i.imgur.com/AD3MbBi.png'); filter: blur(30px) brightness(0.4); transform: scale(1.2);"></div>
            <div class="header-overlay" style="background: linear-gradient(to top, var(--background-secondary) 0%, rgba(0,0,0,0.4) 100%);"></div>
            <div class="album-header-content" style="width: 100%; flex-wrap: wrap;">
                <div style="position: relative; width: 200px; height: 200px; flex-shrink: 0; cursor: pointer; box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5); margin: 0 auto;" onclick="document.getElementById('tourCoverFile').click()">
                    <img id="tourCoverImg" src="https://i.imgur.com/AD3MbBi.png" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; border-radius: 4px;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                        <i class="fas fa-camera" style="font-size: 32px; margin-bottom: 8px;"></i><span style="font-size: 12px; font-weight: 600;">Pôster da Turnê</span>
                    </div>
                </div>
                <input type="file" id="tourCoverFile" accept="image/*" hidden="">
                <input type="hidden" id="tourCoverUrl" value="https://i.imgur.com/AD3MbBi.png">
                
                <div class="album-text-info" style="flex-grow: 1; min-width: 250px;">
                    <p class="album-type-label" style="text-align:center;">TURNÊ OFICIAL / SHOW</p>
                    <input type="text" id="tourTitle" class="wysiwyg-input" placeholder="Nome da Turnê / Show" required style="font-size: clamp(28px, 6vw + 1rem, 40px); font-weight: 900; letter-spacing: -0.04em; margin-bottom: 8px; line-height: 1.2; text-shadow: 0 2px 10px rgba(0,0,0,0.3); border-bottom: 1px dashed rgba(255,255,255,0.3); text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
                        <img id="tourArtistImg" src="https://i.imgur.com/AD3MbBi.png" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                        <select id="tourArtistSelect" class="wysiwyg-select" required style="border-bottom: 1px dashed rgba(255,255,255,0.3);"></select>
                    </div>
                </div>
            </div>
        </div>
        <div class="page-detail-body" style="background: var(--background-secondary); border-radius: 0 0 8px 8px; padding: 24px
