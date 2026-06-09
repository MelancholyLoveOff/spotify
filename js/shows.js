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

    // Verifica se o usuário atual é o dono do artista para mostrar os botões de editar/excluir
    const isOwner = currentPlayer && (currentPlayer.artists.includes(artistId) || currentPlayer.id === artistId);

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

    document.getElementById('editingTourId').value = tour.id;
    
    document.getElementById('tourArtistSelect').innerHTML = `<option value="${tour.artist_id}">${db.artists.find(a=>a.id===tour.artist_id)?.name || 'Artista'}</option>`;
    document.getElementById('tourArtistSelect').value = tour.artist_id;
    document.getElementById('tourTitleInput').value = tour.title;
    document.getElementById('tourImageInput').value = tour.image_url;

    tempTourSetlist = tour.song_ids.map(sid => db.songs.find(s => s.id === sid)).filter(Boolean);
    window.updateTourUI();

    document.getElementById('submitTourBtn').textContent = 'Salvar Alterações';
    document.getElementById('createTourModal').classList.remove('hidden');
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
    
    // 1. PRIMEIRO carregamos a música (Isso faz o player.js carregar os iframes e resetar os botões)
    loadSong(tempSong);
    
    // 2. AGORA forçamos as regras do Stage por cima do que o player.js tentou fazer
    isVideoMode = true; 
    
    // Esconde o botão de mudar para áudio, bloqueando o usuário no vídeo
    const toggleBtn = document.getElementById('toggleVideoBtn');
    if (toggleBtn) {
        toggleBtn.style.display = 'none'; 
    }
    
    // Tira a capa da frente do iframe
    const coverArt = document.getElementById('playerCoverArt');
    if (coverArt) coverArt.style.opacity = '0';

    maximizePlayer();
    
    // 3. Garante que qualquer áudio de fundo (que o loadSong tenha preparado) seja completamente mutado/pausado
    if (window.ytPlayerAudio && typeof window.ytPlayerAudio.pauseVideo === 'function') {
        window.ytPlayerAudio.pauseVideo();
    }
    const audioEl = document.getElementById('audioElement');
    if (audioEl) {
        audioEl.pause();
    }

    // 4. Inicia a reprodução (agora focada 100% no iframe de vídeo)
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
// INTERFACE DE MODAIS E INJEÇÃO
// ==========================================

function injectShowsModals() {
    const html = `
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
    </div>
    <div id="createTourModal" class="modal-overlay hidden">
        <div class="modal-content action-modal-content">
            <h3 style="text-align:center;">Criar / Editar Turnê</h3>
            <input type="hidden" id="editingTourId" value="">
            <div class="studio-form-group"><label>Artista</label><select id="tourArtistSelect" class="wysiwyg-select"></select></div>
            <div class="studio-form-group"><label>Nome da Turnê</label><input type="text" id="tourTitleInput" class="wysiwyg-input"></div>
            <div class="studio-form-group"><label>Pôster (URL)</label><input type="url" id="tourImageInput" class="wysiwyg-input"></div>
            <div class="studio-form-group">
                <label style="display:flex; justify-content:space-between;">Setlist <button id="addTourSongBtn" class="small-btn">+ Música</button></label>
                <div id="tourSetlistContainer" style="background: rgba(255,255,255,0.05); padding:8px; border-radius:4px; min-height:60px;"></div>
            </div>
            <div class="modal-actions">
                <button id="cancelTourBtn" class="cancel-btn" style="flex:1;">Cancelar</button>
                <button id="submitTourBtn" class="submit-btn" style="flex:1;">Anunciar</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    setupShowsLogic();
}

let tempTourSetlist = [];

window.updateTourUI = function() {
    document.getElementById('tourSetlistContainer').innerHTML = tempTourSetlist.map((s, i) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px;">
            <span>${i+1}. ${s.title}</span> <i class="fas fa-times" style="color:red; cursor:pointer;" onclick="removeTourSong('${s.id}')"></i>
        </div>
    `).join('') || '<p style="font-size:12px; color:gray; text-align:center;">Vazio</p>';
};

function setupShowsLogic() {
    document.getElementById('cancelStageBtn').onclick = () => document.getElementById('postStageModal').classList.add('hidden');
    document.getElementById('cancelTourBtn').onclick = () => { 
        document.getElementById('createTourModal').classList.add('hidden'); 
        tempTourSetlist = []; 
        document.getElementById('editingTourId').value = ""; 
    };

    document.querySelectorAll('.studio-menu-opt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const form = e.currentTarget.dataset.form;
            if (form === 'stage' || form === 'tour') {
                document.getElementById('studioMenuModal').classList.add('hidden');
                const selectId = form === 'stage' ? 'stageArtistSelect' : 'tourArtistSelect';
                document.getElementById(selectId).innerHTML = '<option value="" disabled selected>Selecione o Artista...</option>' + 
                    currentPlayer.artists.map(id => {
                        const a = db.artists.find(art => art.id === id);
                        return a ? `<option value="${a.id}">${a.name}</option>` : '';
                    }).join('');
                
                if (form === 'stage') document.getElementById('postStageModal').classList.remove('hidden');
                if (form === 'tour') { 
                    tempTourSetlist = []; 
                    document.getElementById('editingTourId').value = ""; 
                    document.getElementById('submitTourBtn').textContent = 'Anunciar';
                    window.updateTourUI(); 
                    document.getElementById('createTourModal').classList.remove('hidden'); 
                }
            }
        });
    });

    document.getElementById('stageArtistSelect').addEventListener('change', (e) => {
        const songs = db.songs.filter(s => s.artistIds && s.artistIds.includes(e.target.value));
        document.getElementById('stageSongSelect').innerHTML = songs.map(s => `<option value="${s.id}">${s.title}</option>`).join('');
    });

    document.getElementById('addTourSongBtn').onclick = () => {
        const artistId = document.getElementById('tourArtistSelect').value;
        if (!artistId) return showToast("Selecione o artista primeiro.", "error");
        const songs = db.songs.filter(s => s.artistIds && s.artistIds.includes(artistId));
        existingTrackModalContext = 'tour';
        existingTrackResults.innerHTML = songs.map(song => `
            <div class="tour-add-item" onclick="addSongToTempTour('${song.id}')" style="display:flex; gap:10px; padding:5px; cursor:pointer; background:rgba(255,255,255,0.05); margin-bottom:5px;">
                <img src="${song.cover || ''}" style="width:30px; height:30px; object-fit:cover;">
                <span>${song.title}</span>
            </div>
        `).join('');
        existingTrackModal.classList.remove('hidden');
    };

    window.addSongToTempTour = (id) => {
        const song = db.songs.find(s => s.id === id);
        if (song && !tempTourSetlist.find(s => s.id === id)) {
            tempTourSetlist.push(song);
            window.updateTourUI();
            showToast("Adicionada!", "success");
        }
    };

    window.removeTourSong = (id) => {
        tempTourSetlist = tempTourSetlist.filter(s => s.id !== id);
        window.updateTourUI();
    };

    // SUBMIT STAGE
    document.getElementById('submitStageBtn').onclick = async () => {
        const ytInput = document.getElementById('stageYtInput').value;
        const ytId = extractYouTubeID(ytInput); 
        if (!ytId) return showToast("Link do YouTube inválido", "error");

        const stage = {
            artist_id: document.getElementById('stageArtistSelect').value,
            song_id: document.getElementById('stageSongSelect').value,
            title: document.getElementById('stageTitleInput').value,
            yt_id: ytId
        };

        if (!stage.artist_id || !stage.song_id || !stage.title) return showToast("Preencha tudo", "error");
        
        document.getElementById('submitStageBtn').disabled = true;
        await supabaseClient.from('stages').insert([stage]);
        showToast("Stage postado com sucesso!", "success");
        document.getElementById('postStageModal').classList.add('hidden');
        document.getElementById('submitStageBtn').disabled = false;
        
        loadShowsAndStages();
    };

    // SUBMIT TOUR (CRIAR E EDITAR)
    document.getElementById('submitTourBtn').onclick = async () => {
        const tour = {
            artist_id: document.getElementById('tourArtistSelect').value,
            title: document.getElementById('tourTitleInput').value,
            image_url: document.getElementById('tourImageInput').value,
            song_ids: tempTourSetlist.map(s => s.id)
        };

        if (!tour.artist_id || !tour.title || !tour.image_url || tour.song_ids.length === 0) return showToast("Preencha tudo", "error");
        
        document.getElementById('submitTourBtn').disabled = true;
        const editId = document.getElementById('editingTourId').value;

        if (editId) {
            await supabaseClient.from('tours').update(tour).eq('id', editId);
            showToast("Turnê atualizada com sucesso!", "success");
        } else {
            await supabaseClient.from('tours').insert([tour]);
            showToast("Turnê anunciada com sucesso!", "success");
        }

        document.getElementById('createTourModal').classList.add('hidden');
        document.getElementById('submitTourBtn').disabled = false;
        document.getElementById('editingTourId').value = "";
        
        loadShowsAndStages().then(() => { if (activeArtist) renderArtistExtras(activeArtist.id); });
    };
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { injectShowsModals(); loadShowsAndStages(); }, 1500);
});
