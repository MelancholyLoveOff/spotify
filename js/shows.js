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
    
    if(!stagesContainer || !toursContainer) return;

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
    
    const tourSongs = tour.song_ids.map(sid => db.songs.find(s => s.id === sid)).filter(Boolean);
    const editor = document.getElementById('tourTracklistEditor');
    editor.dataset.tracks = JSON.stringify(tourSongs);
    
    if (typeof populateTracklistEditor === 'function') populateTracklistEditor(editor, tourSongs);

    document.getElementById('submitTourBtn').innerHTML = '<i class="fas fa-save"></i> Salvar Turnê';
}

window.playStageVideo = function(ytId, title) {
    const tempSong = { id: 'stage_' + ytId, title: "Stage: " + title, artistIds: [activeArtist ? activeArtist.id : null], durationSeconds: 200, yt_id: ytId, cover: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`, isStage: true };
    currentQueue = [tempSong]; currentQueueIndex = 0;
    
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

    currentQueue = tourSongs; currentQueueIndex = 0;
    showToast(`🎸 Turnê iniciada: ${tour.title}!`, "success");
    loadSong(currentQueue[0]); maximizePlayer(); playAudio();
}

let tempTourSetlist = [];

window.updateTourUI = function() {
    document.getElementById('tourTracklistEditor').innerHTML = tempTourSetlist.map((s, i) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; align-items:center;">
            <span>${i+1}. ${s.title}</span> <i class="fas fa-times" style="color:var(--trend-down-red); cursor:pointer;" onclick="removeTourSong('${s.id}')"></i>
        </div>
    `).join('') || '<p style="font-size:12px; color:gray; text-align:center;">Vazio</p>';
};

function setupShowsLogic() {
    const btnCancelStage = document.getElementById('cancelStageBtn');
    if(btnCancelStage) btnCancelStage.onclick = () => document.getElementById('postStageModal').classList.add('hidden');

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

    const tourCoverFile = document.getElementById('tourCoverFile');
    if(tourCoverFile) {
        tourCoverFile.addEventListener('change', async (e) => {
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
    }

    const stageArtistSelect = document.getElementById('stageArtistSelect');
    if(stageArtistSelect) {
        stageArtistSelect.addEventListener('change', (e) => {
            const songs = db.songs.filter(s => s.artistIds && s.artistIds.includes(e.target.value));
            document.getElementById('stageSongSelect').innerHTML = songs.map(s => `<option value="${s.id}">${s.title}</option>`).join('');
        });
    }
    
    document.getElementById('openTourExistingTrackBtn')?.addEventListener('click', () => {
        activeTracklistEditor = document.getElementById('tourTracklistEditor');
        existingTrackModalContext = 'album'; 
        document.getElementById('existingTrackSearch').value = '';
        document.getElementById('existingTrackResults').innerHTML = '';
        document.getElementById('existingTrackModal').classList.remove('hidden');
    });

    document.getElementById('openTourAddTrackBtn')?.addEventListener('click', () => {
        activeTracklistEditor = document.getElementById('tourTracklistEditor');
        document.getElementById('editingTrackItemId').value = '';
        document.getElementById('albumTrackModalTitle').textContent = 'Nova Faixa / Versão Live Exclusiva';
        document.getElementById('albumTrackNameInput').value = '';
        document.getElementById('albumTrackAudioInput').value = '';
        document.getElementById('albumTrackYoutubeInput').value = '';
        document.getElementById('albumTrackModal').classList.remove('hidden');
    });

    const submitStageBtn = document.getElementById('submitStageBtn');
    if(submitStageBtn) {
        submitStageBtn.onclick = async () => {
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
            
            submitStageBtn.disabled = true;
            await supabaseClient.from('stages').insert([stage]);
            showToast("Stage postado com sucesso!", "success");
            document.getElementById('postStageModal').classList.add('hidden');
            submitStageBtn.disabled = false;
            
            loadShowsAndStages();
        };
    }

    const submitTourBtn = document.getElementById('submitTourBtn');
    if(submitTourBtn) {
        submitTourBtn.onclick = async () => {
            const title = document.getElementById('tourTitle').value;
            const artistId = document.getElementById('tourArtistSelect').value;
            const coverUrl = document.getElementById('tourCoverUrl').value;
            const rawTracks = document.getElementById('tourTracklistEditor').dataset.tracks;
            const tracks = JSON.parse(rawTracks || '[]');

            if (!title || !artistId || tracks.length === 0) return showToast("Preencha Nome, Capa, Artista e Músicas!", "error");
            
            submitTourBtn.disabled = true;
            submitTourBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando Turnê...';
            
            try {
                const finalSongIds = [];
                const newSongsToInsert = [];
                
                for (const t of tracks) {
                    if (t.id && String(t.id).startsWith('temp_')) {
                        const newSongObj = {
                            title: t.title,
                            artist_ids: [artistId], 
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
                
                if (newSongsToInsert.length > 0) {
                    const { data, error } = await supabaseClient.from('songs').insert(newSongsToInsert).select();
                    if (error) throw error;
                    if (data) {
                        data.forEach(insertedSong => finalSongIds.push(insertedSong.id));
                    }
                }
                
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
                
                document.getElementById('wysiwygTourForm').classList.remove('active');
                
                await loadShowsAndStages();
                if (activeArtist) renderArtistExtras(activeArtist.id);
                if (typeof refreshAllData === 'function') refreshAllData();
                
            } catch(err) {
                showToast("Erro ao salvar turnê: " + err.message, "error");
            } finally {
                submitTourBtn.disabled = false;
                submitTourBtn.innerHTML = '<i class="fas fa-ticket-alt"></i> Anunciar Turnê';
            }
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Como os elementos já estão no HTML, não precisamos mais esperar o DOM injetar!
    setupShowsLogic(); 
    loadShowsAndStages();
});
