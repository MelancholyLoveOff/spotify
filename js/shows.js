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
        <div class="page-detail-body" style="background: var(--background-secondary); border-radius: 0 0 8px 8px; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
                <button type="button" class="submit-btn" id="submitTourBtn" style="margin: 0;"><i class="fas fa-ticket-alt"></i> Anunciar Turnê</button>
                <div style="display: flex; gap: 8px;">
                    <button type="button" class="small-btn" id="openTourExistingTrackBtn">+ Catálogo</button>
                    <button type="button" class="small-btn" id="openTourAddTrackBtn" style="border-color:var(--spotify-green); color:var(--spotify-green);">+ Faixa Exclusiva (Live)</button>
                </div>
            </div>
            <div class="track-header" style="display: flex; color: var(--text-secondary); font-size: 12px; font-weight: 400; padding: 0 16px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 8px;">
                <div style="width: 24px; text-align: center; margin-right: 24px;">#</div><div style="flex-grow: 1;">SETLIST</div><div style="margin-right: 56px;"><i class="far fa-clock"></i></div>
            </div>
            <div id="tourTracklistEditor" class="tracklist-container" data-tracks="[]" style="min-height: 100px; margin-top: 0;">
                <p style="color: var(--text-subdued); text-align: center; font-size: 14px; margin-top: 24px;">Nenhuma música na setlist.</p>
            </div>
        </div>
    </form>`;
    
    // Injeta o formulário na área certa (Studio)
    const wrapper = document.getElementById('studioLaunchWrapper');
    if (wrapper) wrapper.insertAdjacentHTML('beforeend', tourFormHtml);
    
    setupShowsLogic();
}

function setupShowsLogic() {
    document.getElementById('cancelStageBtn').onclick = () => document.getElementById('postStageModal').classList.add('hidden');

    // Ao clicar nos menus para Criar
    document.querySelectorAll('.studio-menu-opt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const form = e.currentTarget.dataset.form;
            if (form === 'stage') {
                document.getElementById('studioMenuModal').classList.add('hidden');
                document.getElementById('stageArtistSelect').innerHTML = '<option value="" disabled selected>Selecione o Artista...</option>' + 
                    currentPlayer.artists.map(id => {
                        const a = db.artists.find(art => art.id === id);
                        return a ? `<option value="${a.id}">${a.name}</option>` : '';
                    }).join('');
                document.getElementById('postStageModal').classList.remove('hidden');
            }
            if (form === 'tour') {
                document.getElementById('studioMenuModal').classList.add('hidden');
                document.querySelectorAll('.studio-form-content').forEach(f => f.classList.remove('active'));
                
                // Reseta e abre o form da Turnê WYSIWYG
                document.getElementById('wysiwygTourForm').classList.add('active');
                document.getElementById('currentStudioMenuLabel').textContent = 'Criar Nova Turnê';
                
                document.getElementById('editingTourId').value = '';
                document.getElementById('tourTitle').value = '';
                document.getElementById('tourCoverImg').src = 'https://i.imgur.com/AD3MbBi.png';
                document.getElementById('tourWysiwygBg').style.backgroundImage = `url('https://i.imgur.com/AD3MbBi.png')`;
                document.getElementById('tourCoverUrl').value = 'https://i.imgur.com/AD3MbBi.png';
                document.getElementById('submitTourBtn').innerHTML = '<i class="fas fa-ticket-alt"></i> Anunciar Turnê';
                
                const editor = document.getElementById('tourTracklistEditor');
                editor.dataset.tracks = '[]';
                if (typeof populateTracklistEditor === 'function') populateTracklistEditor(editor, []);

                document.getElementById('tourArtistSelect').innerHTML = '<option value="" disabled selected>Selecione o Artista Principal...</option>' + 
                    currentPlayer.artists.map(id => {
                        const a = db.artists.find(art => art.id === id);
                        return a ? `<option value="${a.id}">${a.name}</option>` : '';
                    }).join('');
            }
        });
    });

    // Lógica da Capa da Tour
    document.getElementById('tourCoverFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const b64 = event.target.result;
                document.getElementById('tourCoverImg').src = b64;
                document.getElementById('tourWysiwygBg').style.backgroundImage = `url(${b64})`;
                document.getElementById('tourCoverUrl').value = b64;
            };
            reader.readAsDataURL(file);
        }
    });

    // Filtros de seleção do Stage
    document.getElementById('stageArtistSelect').addEventListener('change', (e) => {
        const songs = db.songs.filter(s => s.artistIds && s.artistIds.includes(e.target.value));
        document.getElementById('stageSongSelect').innerHTML = songs.map(s => `<option value="${s.id}">${s.title}</option>`).join('');
    });

    // ==========================================
    // LÓGICA DE TRACKLIST (Reaproveitando Modais Originais!)
    // ==========================================
    
    document.getElementById('openTourExistingTrackBtn').addEventListener('click', () => {
        // Redireciona a adição de música para o form da Turnê!
        activeTracklistEditor = document.getElementById('tourTracklistEditor');
        existingTrackModalContext = 'album'; // Usamos 'album' para usar o fluxo de setlist completo
        document.getElementById('existingTrackSearch').value = '';
        document.getElementById('existingTrackResults').innerHTML = '';
        document.getElementById('existingTrackModal').classList.remove('hidden');
    });

    document.getElementById('openTourAddTrackBtn').addEventListener('click', () => {
        // Redireciona a criação de música nova para o form da Turnê!
        activeTracklistEditor = document.getElementById('tourTracklistEditor');
        document.getElementById('editingTrackItemId').value = '';
        document.getElementById('albumTrackModalTitle').textContent = 'Nova Faixa / Versão Live Exclusiva';
        document.getElementById('albumTrackNameInput').value = '';
        document.getElementById('albumTrackAudioInput').value = '';
        document.getElementById('albumTrackYoutubeInput').value = '';
        document.getElementById('albumTrackModal').classList.remove('hidden');
    });

    // ==========================================
    // SUBMIT DOS FORMS
    // ==========================================

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

    // O GIGANTE: Salvar Turnê
    document.getElementById('submitTourBtn').onclick = async () => {
        const title = document.getElementById('tourTitle').value;
        const artistId = document.getElementById('tourArtistSelect').value;
        const coverUrl = document.getElementById('tourCoverUrl').value;
        const rawTracks = document.getElementById('tourTracklistEditor').dataset.tracks;
        const tracks = JSON.parse(rawTracks || '[]');

        if (!title || !artistId || tracks.length === 0) return showToast("Preencha Nome, Capa, Artista e Músicas!", "error");
        
        document.getElementById('submitTourBtn').disabled = true;
        document.getElementById('submitTourBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando Turnê...';
        
        try {
            const finalSongIds = [];
            const newSongsToInsert = [];
            
            // Separa as músicas do catálogo das exclusivas
            for (const t of tracks) {
                if (t.id && String(t.id).startsWith('temp_')) {
                    // É UMA FAIXA EXCLUSIVA CRIADA AGORA!
                    const newSongObj = {
                        title: t.title,
                        artist_ids: [artistId], // Pertence ao artista da tour
                        duration: t.duration || '3:00',
                        cover: coverUrl,
                        track_type: 'Live / Exclusive',
                        streams: 0,
                        total_streams: 0,
                        audio_url: t.audio_url || null,
                        yt_id: t.yt_id || null
                    };
                    newSongsToInsert.push(newSongObj);
                } else {
                    finalSongIds.push(t.id);
                }
            }
            
            // 1. Gravar as músicas exclusivas no banco real de Músicas
            if (newSongsToInsert.length > 0) {
                const { data, error } = await supabaseClient.from('songs').insert(newSongsToInsert).select();
                if (error) throw error;
                if (data) {
                    data.forEach(insertedSong => finalSongIds.push(insertedSong.id));
                }
            }
            
            // 2. Gravar/Atualizar a Turnê
            const tourObj = {
                artist_id: artistId,
                title: title,
                image_url: coverUrl,
                song_ids: finalSongIds
            };
            
            const editId = document.getElementById('editingTourId').value;
            if (editId) {
                await supabaseClient.from('tours').update(tourObj).eq('id', editId);
                showToast("Turnê atualizada com sucesso!", "success");
            } else {
                await supabaseClient.from('tours').insert([tourObj]);
                showToast("Turnê anunciada com sucesso!", "success");
            }
            
            // Fecha e reseta
            document.getElementById('wysiwygTourForm').classList.remove('active');
            
            await loadShowsAndStages();
            if (activeArtist) renderArtistExtras(activeArtist.id);
            if (typeof refreshAllData === 'function') refreshAllData();
            
        } catch(err) {
            showToast("Erro ao salvar turnê: " + err.message, "error");
        } finally {
            document.getElementById('submitTourBtn').disabled = false;
            document.getElementById('submitTourBtn').innerHTML = '<i class="fas fa-ticket-alt"></i> Anunciar Turnê';
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { injectShowsModals(); loadShowsAndStages(); }, 1500);
});
