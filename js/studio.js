// js/studio.js
function updateArtistEditPreviews() {
    const url = editArtistImageUrl.value || 'https://i.imgur.com/AD3MbBi.png'; 
    const pos = editArtistBgPosition.value + '%';
    
    // Atualiza o novo círculo principal clicável que criamos
    const mainCircle = document.getElementById('editArtistPreviewCircleMain');
    if (mainCircle) {
        mainCircle.src = url;
        mainCircle.style.objectPosition = `center ${pos}`;
    }

    // Atualiza os previews antigos da parte de baixo
    editArtistPreviewCircle.src = url; 
    editArtistPreviewCircle.style.objectPosition = `center ${pos}`;
    editArtistPreviewHeader.style.backgroundImage = `url('${url}')`; 
    editArtistPreviewHeader.style.backgroundPosition = `center ${pos}`;
}
function setupImageUploadWithPreview(fileInputId, urlInputId, imgElementId, bgElementId, onCompleteCb) {
    const fileInput = document.getElementById(fileInputId); const urlInput = document.getElementById(urlInputId);
    const imgElement = document.getElementById(imgElementId); const bgElement = document.getElementById(bgElementId);
    if (fileInput && urlInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0]; if (!file) return;
            if(imgElement) imgElement.style.opacity = '0.5';
            try {
                const url = await uploadImageToImgbb(file);
                urlInput.value = url;
                if(imgElement) { imgElement.src = url; imgElement.style.opacity = '1'; }
                if(bgElement) bgElement.style.backgroundImage = `url('${url}')`;
                if(onCompleteCb) onCompleteCb(url);
            } catch (error) {
                showToast('Erro ao fazer upload da imagem: ' + error.message, 'error');
                if(imgElement) imgElement.style.opacity = '1';
            } finally { fileInput.value = ''; }
        });
    }
}

function updateArtistEditPreviews() {
    const url = editArtistImageUrl.value || 'https://i.imgur.com/AD3MbBi.png'; const pos = editArtistBgPosition.value + '%';
    editArtistPreviewCircle.src = url; editArtistPreviewCircle.style.objectPosition = `center ${pos}`;
    editArtistPreviewHeader.style.backgroundImage = `url('${url}')`; editArtistPreviewHeader.style.backgroundPosition = `center ${pos}`;
}

async function registerPlayer(username, password) {
    if (!username || !password) { showToast("Preencha usuário e senha.", 'error'); return; }
    try {
        const { data: existing, error: searchError } = await supabaseClient.from('players').select('id').ilike('name', username);
        if (searchError) throw searchError;
        if (existing && existing.length > 0) { showToast("Este nome de usuário já está em uso. Tente outro.", 'error'); return; }
        const { data, error } = await supabaseClient.from('players').insert([{ name: username, password: password, artist_ids: [] }]).select();
        if (error) throw error;
        
        showToast("Conta criada com sucesso! Fazendo login automaticamente...", 'success');
        const newPlayer = { id: data[0].id, name: data[0].name, password: data[0].password, artists: [] };
        db.players.push(newPlayer);
        
        loginPlayer(username, password);
        if (regUsernameInput) regUsernameInput.value = ''; if (regPasswordInput) regPasswordInput.value = '';

    } catch (err) { showToast("Erro ao criar conta: " + err.message, 'error'); }
}

function loginPlayer(username, password) {
    if (!username || !password) { showToast("Por favor, insira nome de usuário e senha.", 'error'); return; }
    const foundPlayer = db.players.find(p => p.name.toLowerCase() === username.toLowerCase());
    if (foundPlayer && foundPlayer.password === password) {
        currentPlayer = foundPlayer; localStorage.setItem('spotifyRpg_loggedInPlayerId', currentPlayer.id); document.getElementById('playerName').textContent = currentPlayer.name;
        loginPrompt?.classList.add('hidden'); registerPrompt?.classList.add('hidden'); loggedInInfo?.classList.remove('hidden'); studioLaunchWrapper?.classList.remove('hidden'); document.getElementById('actionsLoginPrompt')?.classList.add('hidden'); document.getElementById('actionsWrapper')?.classList.remove('hidden');
        populateArtistSelector(currentPlayer.id); displayArtistActions();
        if (document.querySelector('.studio-tab-btn[data-form="edit"]')?.classList.contains('active')) populateEditableReleases();
    } else { showToast("Usuário ou senha inválidos.", 'error'); const pwInput = document.getElementById('passwordInput'); if (pwInput) pwInput.value = ''; }
}

function logoutPlayer() {
    currentPlayer = null; localStorage.removeItem('spotifyRpg_loggedInPlayerId');
    if (document.getElementById('playerName')) document.getElementById('playerName').textContent = '';
    loginPrompt?.classList.remove('hidden'); registerPrompt?.classList.add('hidden'); loggedInInfo?.classList.add('hidden'); studioLaunchWrapper?.classList.add('hidden'); document.getElementById('actionsLoginPrompt')?.classList.remove('hidden'); document.getElementById('actionsWrapper')?.classList.add('hidden'); if (artistActionsList) artistActionsList.innerHTML = '';
    if (document.getElementById('usernameInput')) document.getElementById('usernameInput').value = ''; if (document.getElementById('passwordInput')) document.getElementById('passwordInput').value = '';
    if (editReleaseList) editReleaseList.innerHTML = '<p class="empty-state-small">Faça login para ver seus lançamentos.</p>'; if (editArtistFilterSelect) editArtistFilterSelect.innerHTML = '<option value="all">Todos os Artistas</option>'; if(wysiwygArtistSelect) wysiwygArtistSelect.innerHTML = '<option value="">Selecione...</option>'; if(editArtistSelect) { editArtistSelect.innerHTML = '<option value="">Selecione...</option>'; editArtistFields?.classList.add('hidden'); }
    editReleaseForm?.classList.add('hidden'); editReleaseListContainer?.classList.remove('hidden'); studioTabs.forEach(t => t.classList.remove('active')); studioForms.forEach(f => f.classList.remove('active')); document.querySelector('.studio-tab-btn[data-form="release"]')?.classList.add('active'); document.getElementById('wysiwygReleaseForm')?.classList.add('active');
}

async function handleArtistSubmit(event) {
    event.preventDefault(); const submitBtn = document.getElementById('submitNewArtist'), name = document.getElementById('newArtistName')?.value.trim(), imageUrl = document.getElementById('newArtistImageUrl')?.value.trim();
    if (!name || !imageUrl) { showToast("Preencha todos os campos do artista.", 'error'); return; }
    submitBtn.disabled = true; submitBtn.textContent = 'Criando...';
    try {
        const { data: artistData, error: artistError } = await supabaseClient.from('artists').insert([{ name: name, image_url: imageUrl, is_main_artist: true, personal_points: 150, rpg_points: 0 }]).select();
        if (artistError) throw artistError;
        const newArtistId = artistData[0].id, currentArtistIds = currentPlayer.artists || [], newArtistIds = [...currentArtistIds, newArtistId];
        const { error: playerError } = await supabaseClient.from('players').update({ artist_ids: newArtistIds }).eq('id', currentPlayer.id);
        if (playerError) throw playerError;

        showToast(`Artista "${name}" criado e vinculado com sucesso!`, 'success');
        document.getElementById('newArtistForm')?.reset(); await refreshAllData(); document.querySelector('.studio-tab-btn[data-form="release"]')?.click();
        
    } catch(e) { showToast("Erro ao criar artista: " + e.message, 'error'); } finally { submitBtn.disabled = false; submitBtn.textContent = 'Criar Artista'; }
}

async function handleEditArtistSubmit(event) {
    event.preventDefault(); const artistId = editArtistSelect?.value, newName = editArtistNameInput?.value.trim(), newUrl = editArtistImageUrl?.value.trim(), newPos = editArtistBgPosition?.value;
    if (!artistId || !newName || !newUrl) { showToast("Preencha todos os campos do artista.", 'error'); return; }
    submitEditArtist.disabled = true; submitEditArtist.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    const finalUrl = `${newUrl}#pos=${newPos}`;
    try {
        const { error } = await supabaseClient.from('artists').update({ name: newName, image_url: finalUrl }).eq('id', artistId);
        if (error) throw error; 
        showToast("Artista atualizado com sucesso!", 'success'); 
        await refreshAllData();
    } catch (err) { showToast("Erro ao atualizar artista: " + err.message, 'error'); } finally { submitEditArtist.disabled = false; submitEditArtist.textContent = 'Salvar Alterações'; }
}

function populateArtistSelector(playerId) {
    const player = db.players.find(p => p.id === playerId); if (!player) return;
    const playerArtistIds = player.artists || [];
    const optionsHtml = playerArtistIds.map(id => { const artist = db.artists.find(a => a.id === id); return artist ? `<option value="${artist.id}">${artist.name}</option>` : ''; }).join('');
    if (wysiwygArtistSelect) {
        if (playerArtistIds.length === 0) { wysiwygArtistSelect.innerHTML = `<option value="">Nenhum artista (Crie na aba Novo Artista)</option>`; } 
        else { wysiwygArtistSelect.innerHTML = `<option value="" disabled selected>Selecione o Artista...</option>${optionsHtml}`; if (playerArtistIds.length === 1) { wysiwygArtistSelect.value = playerArtistIds[0]; const artist = db.artists.find(a => a.id === playerArtistIds[0]); if(artist && wysiwygArtistImg) wysiwygArtistImg.src = artist.img; } }
    }
    if (editArtistFilterSelect) { editArtistFilterSelect.innerHTML = `<option value="all">Todos os Artistas</option>${optionsHtml}`; }
    if (editArtistSelect) {
        if (playerArtistIds.length === 0) { editArtistSelect.innerHTML = `<option value="">Nenhum artista (Crie na aba Novo Artista)</option>`; editArtistFields?.classList.add('hidden'); } 
        else { editArtistSelect.innerHTML = `<option value="" disabled selected>Selecione o Artista que deseja editar...</option>${optionsHtml}`; }
    }
}

function displayArtistActions() {
    if (!currentPlayer || !artistActionsList) return;
    const playerArtists = currentPlayer.artists.map(id => db.artists.find(a => a.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
    if (playerArtists.length === 0) { artistActionsList.innerHTML = "<p class='empty-state-small'>Você não controla nenhum artista. Crie um na aba Estúdio!</p>"; return; }
    artistActionsList.innerHTML = playerArtists.map(artist => `
        <div class="edit-release-item" data-artist-id="${artist.id}" style="display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 4px; cursor: default;">
            <img src="${artist.img}" alt="${artist.name}" class="edit-release-cover" style="width: 48px; height: 48px; object-fit: cover; object-position: center ${artist.bgPos}; border-radius: 50%;">
            <div class="edit-release-info" style="flex-grow: 1;">
                <span class="edit-release-title" style="display: block; font-weight: 600; color: #fff;">${artist.name}</span>
                <span class="edit-release-artist" style="display: block; font-size: 12px; color: #aaa;">Status de Imagem: <strong style="color:var(--text-primary)">${artist.personalPoints || 150} pontos</strong></span>
            </div>
            <div class="action-buttons"><button class="small-btn btn-open-action-modal">Selecionar Ação</button></div>
        </div>`).join('');

    document.querySelectorAll('.btn-open-action-modal').forEach(b => {
        b.addEventListener('click', (e) => {
            const artistId = e.currentTarget.closest('.edit-release-item').dataset.artistId; const artist = db.artists.find(a => a.id === artistId); if (!artist) return;
            modalArtistName.textContent = artist.name; modalArtistId.value = artist.id; populateReleaseSelectForActions(artist.id);
            actionTypeSelect.value = ""; trackSelect.innerHTML = '<option value="" disabled selected>Selecione um lançamento primeiro</option>'; trackSelectWrapper.classList.add('hidden'); actionLimitInfo.classList.add('hidden'); confirmActionButton.disabled = true; confirmActionButton.textContent = 'Confirmar Ação'; 
            releaseSelectWrapper.classList.remove('hidden'); actionModal.classList.remove('hidden');
        });
    });
}

function populateReleaseSelectForActions(artistId) {
    const mainReleases = [...db.albums, ...db.singles].filter(r => r.artistId === artistId); const mainReleaseIds = new Set(mainReleases.map(r => r.id));
    const featuredReleaseIds = new Set(); const actionableTypes = ['Title Track', 'Pre-release Single']; 
    
    db.songs.forEach(track => {
        const isActionableType = actionableTypes.includes(track.trackType); const isBonus = track.isBonusTrack === true;
        if (track.artistIds && track.artistIds.includes(artistId) && (isActionableType || isBonus)) {
            if (track.albumIds) track.albumIds.forEach(id => featuredReleaseIds.add(id));
            if (track.singleIds) track.singleIds.forEach(id => featuredReleaseIds.add(id));
        }
    });

    const allReleaseIds = new Set([...mainReleaseIds, ...featuredReleaseIds]); const allReleases = [...db.albums, ...db.singles].filter(r => allReleaseIds.has(r.id));

    releaseSelect.innerHTML = '<option value="" disabled selected>Selecione o Lançamento...</option>';
    if (allReleases.length === 0) { releaseSelect.innerHTML += '<option value="" disabled>Nenhum lançamento encontrado</option>'; return; }

    allReleases.sort((a, b) => a.title.localeCompare(b.title)).forEach(r => { const o = document.createElement('option'); o.value = r.id; o.textContent = r.isDeluxe ? `${r.title} (Deluxe)` : r.title; releaseSelect.appendChild(o); });
}

function populateTrackSelectForActions(releaseId, artistId) {
    const actionableTypes = ['Title Track', 'Pre-release Single'];
    const releaseActionableTracks = db.songs.filter(t => {
        const isActionableType = actionableTypes.includes(t.trackType); const isBonus = t.isBonusTrack === true; const inRelease = (t.albumIds && t.albumIds.includes(releaseId)) || (t.singleIds && t.singleIds.includes(releaseId));
        return inRelease && (isActionableType || isBonus) && t.artistIds.includes(artistId);
    });

    trackSelect.innerHTML = '<option value="" disabled selected>Selecione a Faixa Título...</option>';
    if (releaseActionableTracks.length === 0) { trackSelect.innerHTML += '<option value="" disabled>Nenhuma faixa acionável sua neste lançamento</option>'; trackSelectWrapper.classList.remove('hidden'); return; }

    releaseActionableTracks.sort((a, b) => a.title.localeCompare(b.title)).forEach(t => {
        const o = document.createElement('option'); o.value = t.id; let label = t.trackType;
        if (t.isBonusTrack && !actionableTypes.includes(t.trackType)) { label = 'Faixa Bônus'; }
        o.textContent = `${t.title} (${label})`; trackSelect.appendChild(o);
    });
    trackSelectWrapper.classList.remove('hidden');
}

function updateActionLimitInfo() {
    const artistId = modalArtistId.value, actionType = actionTypeSelect.value, trackId = trackSelect.value, artist = db.artists.find(a => a.id === artistId);
    if (!artist || !actionType || !ACTION_CONFIG[actionType]) { actionLimitInfo.classList.add('hidden'); confirmActionButton.disabled = true; return; }
    const config = ACTION_CONFIG[actionType];
    if (!trackId) { actionLimitInfo.classList.add('hidden'); confirmActionButton.disabled = true; confirmActionButton.textContent = 'Selecione a Faixa'; return; }
    const track = db.songs.find(t => t.id === trackId); if (!track) { actionLimitInfo.classList.add('hidden'); confirmActionButton.disabled = true; return; }

    const isMain = track.artistIds[0] === artistId || track.collabType === 'Dueto/Grupo'; let limit = (config.limit === 5) ? 5 : (isMain ? config.limit : 5); const currentCount = artist[config.localCountKey] || 0;

    currentActionCount.textContent = currentCount; maxActionCount.textContent = limit; actionLimitInfo.classList.remove('hidden');
    if (currentCount >= limit) { currentActionCount.style.color = 'var(--trend-down-red)'; confirmActionButton.disabled = true; confirmActionButton.textContent = 'Limite Atingido'; } 
    else { currentActionCount.style.color = 'var(--text-primary)'; confirmActionButton.disabled = false; confirmActionButton.textContent = 'Confirmar Ação'; }
}

function populateTracklistEditor(editorElement, tracks) {
    if (!editorElement) return;
    editorElement.innerHTML = ''; 
    if (!tracks || tracks.length === 0) { editorElement.innerHTML = '<p class="empty-state-small">Nenhuma faixa adicionada.</p>'; return; }

    const sortedTracks = [...tracks].sort((a, b) => (a.trackNumber || 99) - (b.trackNumber || 99));

    sortedTracks.forEach(track => {
        const fullSong = db.songs.find(s => s.id === track.id); if (!fullSong) return;
        const featsData = (fullSong.artistIds || []).slice(1).map(artistId => { const artist = db.artists.find(a => a.id === artistId); return { id: artistId, type: fullSong.collabType || 'Feat.', name: artist ? artist.name : '?' }; });
        
        const newItem = document.createElement('div');
        newItem.className = 'track-list-item-display track-row';
        newItem.style.cssText = 'background: rgba(255,255,255,0.05); margin-bottom: 8px; border-radius: 4px;';
        newItem.dataset.itemId = `existing_${fullSong.id}`; 
        newItem.dataset.existingSongId = fullSong.id; 
        newItem.dataset.trackName = fullSong.title.replace(/ \(feat\. .+\)$/i, ''); 
        newItem.dataset.durationStr = fullSong.duration;
        newItem.dataset.trackType = fullSong.trackType;
        newItem.dataset.feats = JSON.stringify(featsData); 

        let artistText = "Desconhecido"; const mainArtistId = fullSong.artistIds[0]; const mainArtist = db.artists.find(a => a.id === mainArtistId);
        if (mainArtist) { if (featsData.length > 0) { if (featsData[0].type === "Dueto/Grupo") artistText = `${mainArtist.name} & ${featsData.map(f=>f.name).join(', ')}`; else artistText = `${mainArtist.name} (feat. ${featsData.map(f=>f.name).join(', ')})`; } else { artistText = mainArtist.name; } }

        const titleDisplay = (fullSong.id) ? `<i class="fas fa-link" style="font-size: 10px; margin-right: 5px;" title="Faixa Existente"></i>${fullSong.title}` : fullSong.title;

        newItem.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle" style="color:var(--text-secondary); cursor:grab; margin-right: 8px;"></i>
            <span class="track-number track-number-display">${fullSong.trackNumber || '?'}</span>
            <div class="track-info" style="flex-grow:1;">
                <span class="track-title" style="color: ${(fullSong.id)?'var(--spotify-green)':'var(--text-primary)'};">${titleDisplay}</span>
                <span class="track-artist-feat">${artistText} • <span style="font-size:11px; opacity:0.7;">${fullSong.trackType}</span></span>
            </div>
            <span class="track-duration" style="margin-right: 16px;">${fullSong.duration}</span>
            <div class="track-actions" style="display:flex; gap:12px;">
                <button type="button" class="small-btn edit-track-btn" style="border:none; padding:4px;"><i class="fas fa-pencil-alt"></i></button>
                <button type="button" class="small-btn remove-track-btn" style="border:none; padding:4px; color:var(--trend-down-red);"><i class="fas fa-times"></i></button>
            </div>
        `;
        editorElement.appendChild(newItem);
    });
    updateTrackNumbers(editorElement); 
}

function updateTrackNumbers(editorElement) {
    if (!editorElement) return; const trackItems = editorElement.querySelectorAll('.track-list-item-display');
    if (trackItems.length === 0) { if (!editorElement.querySelector('p')) { editorElement.innerHTML = '<p style="color: var(--text-subdued); text-align: center; font-size: 14px; margin-top: 24px;">Nenhuma faixa adicionada.</p>'; } } 
    else { const emptyState = editorElement.querySelector('p'); if (emptyState && emptyState.textContent.includes('Nenhuma faixa')) { emptyState.remove(); } }
    trackItems.forEach((item, index) => { let numberSpan = item.querySelector('.track-number-display'); if (numberSpan) { numberSpan.textContent = `${index + 1}`; } });
}

function populateArtistSelectForFeat(targetSelectElement) {
    let currentMainArtistId = null; let selectElement = targetSelectElement;
    if (activeTracklistEditor === editAlbumTracklistEditor || editReleaseForm?.classList.contains('active')) { const artistDisplay = document.getElementById('editArtistNameDisplay'); const artistName = artistDisplay?.textContent; const artist = db.artists.find(a => a.name === artistName); currentMainArtistId = artist ? artist.id : null; selectElement = inlineFeatArtistSelect; } 
    else if (activeTracklistEditor === wysiwygTracklistEditor || wysiwygReleaseForm?.classList.contains('active')) { currentMainArtistId = wysiwygArtistSelect?.value; selectElement = inlineFeatArtistSelect; } 
    else { selectElement = featArtistSelect; }
    if (!selectElement) return;
    const featOptions = db.artists.filter(artist => artist.id !== currentMainArtistId).sort((a, b) => a.name.localeCompare(b.name)).map(artist => `<option value="${artist.id}">${artist.name}</option>`).join('');
    selectElement.innerHTML = featOptions || '<option value="">Nenhum outro artista disponível</option>';
}

function openFeatModal(buttonElement) {
    const targetListId = buttonElement.dataset.target; currentFeatTarget = document.getElementById(targetListId);
    if (!currentFeatTarget || !featModal) return; populateArtistSelectForFeat(featArtistSelect); featModal.classList.remove('hidden');
}

function closeFeatModal() { featModal?.classList.add('hidden'); currentFeatTarget = null; if(featArtistSelect) featArtistSelect.innerHTML = ''; if(featTypeSelect) featTypeSelect.value = 'Feat.'; }

function confirmFeat() {
    const artistId = featArtistSelect?.value; const selectedIndex = featArtistSelect?.selectedIndex; const artistName = (selectedIndex !== undefined && selectedIndex !== -1) ? featArtistSelect.options[selectedIndex].text : 'Desconhecido'; const featType = featTypeSelect?.value;
    if (!artistId || !currentFeatTarget) return;
    const tag = document.createElement('span'); tag.className = 'feat-tag'; tag.style.cssText = "background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;";
    tag.textContent = `${featType} ${artistName}`; tag.dataset.artistId = artistId; tag.dataset.featType = featType; tag.dataset.artistName = artistName; tag.addEventListener('click', () => tag.remove());
    currentFeatTarget.appendChild(tag); closeFeatModal();
}

function toggleInlineFeatAdder() {
    if (!inlineFeatAdder || !addInlineFeatBtn) return;
    const isHidden = inlineFeatAdder.classList.contains('hidden');
    if (isHidden) { populateArtistSelectForFeat(inlineFeatArtistSelect); inlineFeatAdder.classList.remove('hidden'); addInlineFeatBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar Feat'; } 
    else { inlineFeatAdder.classList.add('hidden'); addInlineFeatBtn.innerHTML = '+ Feat'; if(inlineFeatArtistSelect) inlineFeatArtistSelect.innerHTML = ''; if(inlineFeatTypeSelect) inlineFeatTypeSelect.value = 'Feat.'; }
}

function confirmInlineFeat() {
    const artistId = inlineFeatArtistSelect?.value; const selectedIndex = inlineFeatArtistSelect?.selectedIndex; const artistName = (selectedIndex !== undefined && selectedIndex !== -1) ? inlineFeatArtistSelect.options[selectedIndex].text : 'Desconhecido'; const featType = inlineFeatTypeSelect?.value; const targetList = albumTrackFeatList;
    if (!artistId || !targetList) return;
    const tag = document.createElement('span'); tag.className = 'feat-tag'; tag.style.cssText = "background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;";
    tag.textContent = `${featType} ${artistName}`; tag.dataset.artistId = artistId; tag.dataset.featType = featType; tag.dataset.artistName = artistName; tag.addEventListener('click', () => tag.remove());
    targetList.appendChild(tag); toggleInlineFeatAdder();
}

function cancelInlineFeat() { if(!inlineFeatAdder || !addInlineFeatBtn) return; inlineFeatAdder.classList.add('hidden'); addInlineFeatBtn.innerHTML = '+ Feat'; if(inlineFeatArtistSelect) inlineFeatArtistSelect.innerHTML = ''; if(inlineFeatTypeSelect) inlineFeatTypeSelect.value = 'Feat.'; }

function openAlbumTrackModal(itemToEdit = null) {
    if (!albumTrackModal || !albumTrackNameInput || !albumTrackDurationInput || !albumTrackTypeSelect || !albumTrackFeatList || !editingTrackItemId || !editingTrackExistingId) return;
    albumTrackNameInput.value = ''; albumTrackDurationInput.value = ''; albumTrackTypeSelect.value = 'B-side'; albumTrackFeatList.innerHTML = ''; editingTrackItemId.value = ''; editingTrackExistingId.value = ''; editingTrackItem = null;
    inlineFeatAdder?.classList.add('hidden'); if (addInlineFeatBtn) addInlineFeatBtn.innerHTML = '+ Feat';
    albumTrackNameInput.disabled = false; albumTrackDurationInput.disabled = false; const featSectionElement = albumTrackFeatList.closest('.feat-section'); if (featSectionElement) featSectionElement.classList.remove('hidden');

    if (itemToEdit) {
        editingTrackItem = itemToEdit; editingTrackItemId.value = itemToEdit.dataset.itemId || `temp_edit_${Date.now()}`;
        albumTrackNameInput.value = itemToEdit.dataset.trackName || ''; albumTrackDurationInput.value = itemToEdit.dataset.durationStr || ''; albumTrackTypeSelect.value = itemToEdit.dataset.trackType || 'B-side';
        const existingSongId = itemToEdit.dataset.existingSongId; const featsToPopulate = JSON.parse(itemToEdit.dataset.feats || '[]');
        if (!existingSongId) { albumTrackModalTitle.textContent = 'Editar Faixa (Nova)'; } else { albumTrackModalTitle.textContent = 'Editar Faixa (Existente)'; editingTrackExistingId.value = existingSongId; }
         try {
             featsToPopulate.forEach(f => {
                 const tag = document.createElement('span'); tag.className = 'feat-tag'; tag.style.cssText = "background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;";
                 tag.textContent = `${f.type} ${f.name}`; tag.dataset.artistId = f.id; tag.dataset.featType = f.type; tag.dataset.artistName = f.name; tag.addEventListener('click', () => tag.remove()); albumTrackFeatList.appendChild(tag);
             });
         } catch (e) {}
    } else { albumTrackModalTitle.textContent = 'Adicionar Faixa'; editingTrackItemId.value = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`; }
    albumTrackModal.classList.remove('hidden');
}

function closeAlbumTrackModal() { albumTrackModal?.classList.add('hidden'); editingTrackItem = null; if(editingTrackItemId) editingTrackItemId.value = ''; if(editingTrackExistingId) editingTrackExistingId.value = ''; inlineFeatAdder?.classList.add('hidden'); if (addInlineFeatBtn) addInlineFeatBtn.innerHTML = '+ Feat'; }

function saveAlbumTrack() {
    if (!activeTracklistEditor) return;
    let existingSongId = editingTrackExistingId.value; 
    const name = albumTrackNameInput.value.trim(); 
    const durationStr = albumTrackDurationInput.value.trim(); 
    const type = albumTrackTypeSelect.value; 
    const durationSec = parseDurationToSeconds(durationStr); 
    const itemId = editingTrackItemId.value;
    
    const featTags = albumTrackFeatList.querySelectorAll('.feat-tag'); 
    const featsData = Array.from(featTags).map(tag => ({ id: tag.dataset.artistId, type: tag.dataset.featType, name: tag.dataset.artistName })); 
    const featsJSON = JSON.stringify(featsData);
    
    if (!name || !durationStr || durationSec === 0) { showToast("Nome da faixa e duração são obrigatórios.", 'error'); return; }

    let targetElement = editingTrackItem || activeTracklistEditor.querySelector(`[data-item-id="${itemId}"]`);
    
    let mainArtistName = "Desconhecido";
    if (activeTracklistEditor === wysiwygTracklistEditor) { const sel = document.getElementById('wysiwygArtistSelect'); if(sel && sel.selectedIndex >= 0 && sel.value !== "") mainArtistName = sel.options[sel.selectedIndex].text; } 
    else if (activeTracklistEditor === editAlbumTracklistEditor) { const disp = document.getElementById('editArtistNameDisplay'); if(disp) mainArtistName = disp.textContent; }

    let artistText = mainArtistName;
    if (featsData.length > 0) { if (featsData[0].type === "Dueto/Grupo") artistText = `${mainArtistName} & ${featsData.map(f=>f.name).join(', ')}`; else artistText = `${mainArtistName} (feat. ${featsData.map(f=>f.name).join(', ')})`; }
    
    if (targetElement) {
        targetElement.dataset.trackName = name;
        targetElement.dataset.durationStr = durationStr;
        targetElement.dataset.feats = featsJSON;
        targetElement.dataset.trackType = type;
        
        targetElement.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle" style="color:var(--text-secondary); cursor:grab; margin-right: 8px;"></i>
            <span class="track-number track-number-display"></span>
            <div class="track-info" style="flex-grow:1;">
                <span class="track-title" style="color:${existingSongId ? 'var(--spotify-green)' : 'var(--text-primary)'};">
                    ${existingSongId ? '<i class="fas fa-link" style="font-size: 10px; margin-right: 5px;"></i>' : ''}${name}
                </span>
                <span class="track-artist-feat">${artistText} • <span style="font-size:11px; opacity:0.7;">${type}</span></span>
            </div>
            <span class="track-duration" style="margin-right: 16px;">${durationStr}</span>
            <div class="track-actions" style="display:flex; gap:12px;">
                <button type="button" class="small-btn edit-track-btn" style="border:none; padding:4px;"><i class="fas fa-pencil-alt"></i></button>
                <button type="button" class="small-btn remove-track-btn" style="border:none; padding:4px; color:var(--trend-down-red);"><i class="fas fa-times"></i></button>
            </div>
        `;
    } else {
        const newItem = document.createElement('div'); newItem.className = 'track-list-item-display track-row'; newItem.style.cssText = 'background: rgba(255,255,255,0.05); margin-bottom: 8px; border-radius: 4px; border: 1px solid transparent;';
        newItem.dataset.itemId = itemId; newItem.dataset.trackName = name; newItem.dataset.durationStr = durationStr; newItem.dataset.trackType = type; newItem.dataset.feats = featsJSON;
        newItem.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle" style="color:var(--text-secondary); cursor:grab; margin-right: 8px;"></i>
            <span class="track-number track-number-display"></span>
            <div class="track-info" style="flex-grow:1;">
                <span class="track-title" style="color:var(--text-primary);">${name}</span>
                <span class="track-artist-feat">${artistText} • <span style="font-size:11px; opacity:0.7;">${type}</span></span>
            </div>
            <span class="track-duration" style="margin-right: 16px;">${durationStr}</span>
            <div class="track-actions" style="display:flex; gap:12px;">
                <button type="button" class="small-btn edit-track-btn" style="border:none; padding:4px;"><i class="fas fa-pencil-alt"></i></button>
                <button type="button" class="small-btn remove-track-btn" style="border:none; padding:4px; color:var(--trend-down-red);"><i class="fas fa-times"></i></button>
            </div>`;
        const emptyState = activeTracklistEditor.querySelector('p'); if (emptyState && emptyState.textContent.includes('Nenhuma faixa')) emptyState.remove();
        activeTracklistEditor.appendChild(newItem);
    }
    updateTrackNumbers(activeTracklistEditor); closeAlbumTrackModal();
}

function openExistingTrackModal(context) { 
    if (!currentPlayer) { showToast("Faça login", 'error'); return; }
    let activeArtistId = null;
    if(activeTracklistEditor === wysiwygTracklistEditor){ activeArtistId = wysiwygArtistSelect?.value; } 
    else if (activeTracklistEditor === editAlbumTracklistEditor){ const artistDisplay = document.getElementById('editArtistNameDisplay'); const artistName = artistDisplay?.textContent; const artist = db.artists.find(a => a.name === artistName); activeArtistId = artist ? artist.id : null; }
     if (!activeArtistId) { showToast("Selecione o Artista Principal na capa do lançamento.", 'error'); return; }
    existingTrackModalContext = context; if(existingTrackSearch) existingTrackSearch.value = ''; populateExistingTrackSearch(); existingTrackModal?.classList.remove('hidden');
}

function closeExistingTrackModal() { existingTrackModal?.classList.add('hidden'); if(existingTrackSearch) existingTrackSearch.value = ''; if(existingTrackResults) existingTrackResults.innerHTML = '<p class="empty-state-small">Busque por uma faixa.</p>'; }

function populateExistingTrackSearch() {
    if (!existingTrackResults) return; if (!currentPlayer) return;
    let selectedArtistId = null;
    if(activeTracklistEditor === wysiwygTracklistEditor){ selectedArtistId = wysiwygArtistSelect?.value; } 
    else if (activeTracklistEditor === editAlbumTracklistEditor){ const artistDisplay = document.getElementById('editArtistNameDisplay'); const artistName = artistDisplay?.textContent; const artist = db.artists.find(a => a.name === artistName); selectedArtistId = artist ? artist.id : null; }
    if (!selectedArtistId) return;

    const query = existingTrackSearch?.value.toLowerCase().trim() || '';
    const filteredSongs = db.songs.filter(song => { const isArtistSong = song.artistIds && song.artistIds.includes(selectedArtistId); const matchesQuery = query === '' || song.title.toLowerCase().includes(query); return isArtistSong && matchesQuery; }).sort((a, b) => (b.totalStreams || 0) - (a.totalStreams || 0));

    if (filteredSongs.length === 0) { existingTrackResults.innerHTML = '<p class="empty-state-small">Nenhuma faixa encontrada.</p>'; } 
    else {
        existingTrackResults.innerHTML = filteredSongs.map(song => `
            <div class="existing-track-item" data-song-id="${song.id}" style="display:flex; align-items:center; gap:12px; background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; cursor:pointer;">
                <img src="${song.cover || getCoverUrl(song.albumId)}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">
                <div style="flex-grow:1;">
                    <span style="display:block; font-size:14px; font-weight:600; color:#fff;">${song.title}</span>
                    <span style="display:block; font-size:12px; color:#aaa;">${song.artist}</span>
                </div>
                 <i class="fas fa-plus" style="color:var(--text-secondary);"></i>
            </div>
        `).join('');
    }
}

function handleExistingTrackSelect(event) { const selectedItem = event.target.closest('.existing-track-item'); if (!selectedItem) return; const songId = selectedItem.dataset.songId; if (!songId) return; if (existingTrackModalContext === 'album') { addExistingTrackToAlbum(songId); } }

function addExistingTrackToAlbum(songId) {
    const song = db.songs.find(s => s.id === songId); if (!song || !activeTracklistEditor) return;
    if (activeTracklistEditor.querySelector(`[data-existing-song-id="${song.id}"]`)) { showToast("Esta música já foi adicionada.", 'error'); return; }
    const featsData = (song.artistIds || []).slice(1).map(artistId => { const artist = db.artists.find(a => a.id === artistId); return { id: artistId, type: song.collabType || 'Feat.', name: artist ? artist.name : '?' }; });

    const newItem = document.createElement('div'); newItem.className = 'track-list-item-display track-row'; newItem.style.cssText = 'background: rgba(255,255,255,0.05); margin-bottom: 8px; border-radius: 4px;';
    newItem.dataset.itemId = `existing_${song.id}`; newItem.dataset.existingSongId = song.id; newItem.dataset.trackName = song.title.replace(/ \(feat\. .+\)$/i, ''); newItem.dataset.durationStr = song.duration; newItem.dataset.trackType = song.trackType; newItem.dataset.feats = JSON.stringify(featsData);

    let artistText = "Existente"; if (featsData.length > 0) { if (featsData[0].type === "Dueto/Grupo") artistText = `Dueto com ${featsData.map(f=>f.name).join(', ')}`; else artistText = `feat. ${featsData.map(f=>f.name).join(', ')}`; }

    newItem.innerHTML = `
        <i class="fas fa-grip-vertical drag-handle" style="color:var(--text-secondary); cursor:grab; margin-right: 8px;"></i>
        <span class="track-number track-number-display"></span>
        <div class="track-info" style="flex-grow:1;">
            <span class="track-title" style="color:var(--spotify-green);">
                <i class="fas fa-link" style="font-size: 10px; margin-right: 5px;"></i>${song.title}
            </span>
            <span class="track-artist-feat">${artistText} • <span style="font-size:11px; opacity:0.7;">${song.trackType}</span></span>
        </div>
        <span class="track-duration" style="margin-right: 16px;">${song.duration}</span>
        <div class="track-actions" style="display:flex; gap:12px;">
            <button type="button" class="small-btn edit-track-btn" style="border:none; padding:4px;"><i class="fas fa-pencil-alt"></i></button>
            <button type="button" class="small-btn remove-track-btn" style="border:none; padding:4px; color:var(--trend-down-red);"><i class="fas fa-times"></i></button>
        </div>
    `;

    const emptyState = activeTracklistEditor.querySelector('p'); if (emptyState && emptyState.textContent.includes('Nenhuma faixa')) emptyState.remove();
    activeTracklistEditor.appendChild(newItem); updateTrackNumbers(activeTracklistEditor); closeExistingTrackModal();
}

function initAlbumForm() {
     if (wysiwygTracklistEditor) wysiwygTracklistEditor.innerHTML = '<p style="color: var(--text-subdued); text-align: center; font-size: 14px; margin-top: 24px;">Nenhuma faixa adicionada.</p>';
     const releaseNature = document.getElementById('wysiwygReleaseNature');
     if (releaseNature) { releaseNature.value = 'original'; releaseNature.dispatchEvent(new Event('change')); }
     if (wysiwygTitle) wysiwygTitle.value = ''; if (wysiwygCoverUrl) wysiwygCoverUrl.value = 'https://i.imgur.com/AD3MbBi.png'; if (wysiwygCoverImg) wysiwygCoverImg.src = 'https://i.imgur.com/AD3MbBi.png'; if (wysiwygBg) wysiwygBg.style.backgroundImage = `url('https://i.imgur.com/AD3MbBi.png')`;
     const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); if (wysiwygReleaseDate) wysiwygReleaseDate.value = now.toISOString().slice(0, 16);
     updateTrackNumbers(wysiwygTracklistEditor); 
}

async function handleWysiwygSubmit(event) {
     event.preventDefault(); if (!submitWysiwygRelease) return;
     submitWysiwygRelease.disabled = true; submitWysiwygRelease.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

     try {
         const artistId = wysiwygArtistSelect?.value; const title = document.getElementById('wysiwygTitle')?.value; const coverUrl = document.getElementById('wysiwygCoverUrl')?.value; const releaseDateTimeLocal = document.getElementById('wysiwygReleaseDate')?.value; const releaseTypeSelected = document.getElementById('wysiwygReleaseType')?.value; 

         if (!artistId || !title || !coverUrl || !releaseDateTimeLocal) throw new Error("Preencha todos os campos do cabeçalho.");
         const releaseDateISO = releaseDateTimeLocal.split('T')[0]; if (isNaN(new Date(releaseDateISO).getTime())) throw new Error("Data inválida.");

         const trackItems = wysiwygTracklistEditor?.querySelectorAll('.track-list-item-display');
         if (!trackItems || trackItems.length === 0) throw new Error("Adicione pelo menos uma faixa para lançar o projeto.");

         let totalDurationSeconds = 0; const musicRecordsToCreate = []; const musicRecordsToUpdate = [];

         for (let i = 0; i < trackItems.length; i++) {
             const item = trackItems[i]; const existingSongId = item.dataset.existingSongId; const name = item.dataset.trackName; const durationStr = item.dataset.durationStr; const type = item.dataset.trackType;
             let feats = []; if (!existingSongId) { try { feats = JSON.parse(item.dataset.feats || '[]'); } catch (e) {} }
             const durationSec = parseDurationToSeconds(durationStr);

             if (!name || !durationStr || durationSec === 0) throw new Error(`Dados inválidos na Faixa ${i + 1}.`);
             totalDurationSeconds += durationSec;

             let finalTrackName = name; let finalArtistIds = [artistId]; let collaborationType = null;
             if (feats.length > 0) { 
                 collaborationType = feats[0].type; 
                 finalArtistIds = [artistId, ...feats.map(f => f.id)]; 
                 if (collaborationType === "Feat.") finalTrackName = `${name} (feat. ${feats.map(f => f.name).join(', ')})`; 
             }

             if (existingSongId) { 
                 musicRecordsToUpdate.push({ 
                     id: existingSongId, 
                     fields: { 
                         "Nome da Faixa": finalTrackName,
                         "Artista": finalArtistIds,
                         "Duração": durationSec,
                         "Nº da Faixa": i + 1, 
                         "Tipo de Faixa": type,
                         ...(collaborationType && { "Tipo de Colaboração": collaborationType })
                     } 
                 }); 
             } 
             else {
                 musicRecordsToCreate.push({ "Nome da Faixa": finalTrackName, "Artista": finalArtistIds, "Duração": durationSec, "Nº da Faixa": i + 1, "Tipo de Faixa": type, ...(collaborationType && { "Tipo de Colaboração": collaborationType }) });
             }
         }

         let isAlbum = releaseTypeSelected === 'album'; 
         if (!isAlbum) { if (totalDurationSeconds > 1800) throw new Error("Singles e EPs não podem ultrapassar 30 minutos de duração. Altere o tipo do lançamento para 'Álbuns'."); if (trackItems.length > 6) throw new Error("Singles e EPs não podem ter mais que 6 faixas. Altere o tipo do lançamento para 'Álbuns'."); }
         
         const targetTableName = isAlbum ? 'Álbuns' : 'Singles e EPs'; const nameFieldName = isAlbum ? 'Nome do Álbum' : 'Nome do Single/EP'; const coverFieldName = isAlbum ? 'Capa do Álbum' : 'Capa'; const linkFieldName = isAlbum ? 'Álbuns' : 'Singles e EPs'; const isDeluxe = document.getElementById('wysiwygReleaseNature')?.value === 'deluxe';
         const releaseRecordFields = { [nameFieldName]: title, "Artista": [artistId], [coverFieldName]: [{ "url": coverUrl }], "Data de Lançamento": releaseDateISO };
         if (isDeluxe) releaseRecordFields["É deluxe?"] = true;
         
         const releaseResponse = await createAirtableRecord(targetTableName, releaseRecordFields);
         if (!releaseResponse || !releaseResponse.id) throw new Error("Falha ao criar o registro principal.");
         const newReleaseId = releaseResponse.id;

         musicRecordsToCreate.forEach(record => { record[linkFieldName] = [newReleaseId]; });
         musicRecordsToUpdate.forEach(record => { const originalSong = db.songs.find(s => s.id === record.id); const existingLinks = (isAlbum ? originalSong?.albumIds : originalSong?.singleIds) || []; record.fields[linkFieldName] = [...new Set([...existingLinks, newReleaseId])]; });

         let allMusicOpsSucceeded = true;
         if (musicRecordsToCreate.length > 0) { const createdMusicResult = await batchCreateAirtableRecords('Músicas', musicRecordsToCreate); if (!createdMusicResult || createdMusicResult.length !== musicRecordsToCreate.length) allMusicOpsSucceeded = false; }
         if (musicRecordsToUpdate.length > 0) { const updatedMusicResult = await batchUpdateAirtableRecords('Músicas', musicRecordsToUpdate); if (!updatedMusicResult || updatedMusicResult.length !== musicRecordsToUpdate.length) allMusicOpsSucceeded = false; }

         if (!allMusicOpsSucceeded) showToast(`Projeto lançado, com erros nas faixas.`, 'error');
         else showToast(`Projeto lançado com sucesso!`, 'success');

         initAlbumForm(); await refreshAllData();

     } catch (error) { showToast(`Erro: ${error.message}`, 'error'); } 
     finally { submitWysiwygRelease.disabled = false; submitWysiwygRelease.innerHTML = `<i class="fas fa-check"></i> Lançar Projeto`; }
}

function populateEditableReleases() {
    if (!editReleaseList) return; if (!currentPlayer) { editReleaseList.innerHTML = '<p class="empty-state-small">Faça login</p>'; return; }
    const selectedArtistId = editArtistFilterSelect?.value; const playerArtistIds = currentPlayer.artists || [];
    let releasesToDisplay = [...db.albums, ...db.singles].filter(release => selectedArtistId && selectedArtistId !== 'all' ? release.artistId === selectedArtistId : playerArtistIds.includes(release.artistId));
    const sortedReleases = releasesToDisplay.sort((a, b) => new Date(b.releaseDate||0) - new Date(a.releaseDate||0));

    if (sortedReleases.length === 0) { editReleaseList.innerHTML = '<p class="empty-state-small">Nenhum lançamento.</p>'; } 
    else {
        editReleaseList.innerHTML = sortedReleases.map(release => `
            <div class="edit-release-item" style="display:flex; align-items:center; gap:16px; background:rgba(255,255,255,0.05); padding:12px; border-radius:4px;">
                <img src="${release.imageUrl}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;">
                <div style="flex-grow:1;">
                    <span style="display:block; font-weight:600; color:#fff;">${release.title}</span>
                     <span style="display:block; font-size:12px; color:#aaa;">
                          ${release.artist} - ${release.releaseDate ? new Date(release.releaseDate).getFullYear() : 'Sem Data'}
                          (${release.type === 'album' ? 'Álbum' : 'Single/EP'})
                     </span>
                </div>
                <div style="display:flex; gap:8px;">
                    <button type="button" class="circle-btn edit-release-btn" data-release-id="${release.id}" data-release-type="${release.type}" data-release-table="${release.tableName}"><i class="fas fa-pencil-alt"></i></button>
                    <button type="button" class="circle-btn delete-release-btn" style="color:var(--trend-down-red);" data-release-id="${release.id}" data-release-type="${release.type}" data-release-table="${release.tableName}" data-release-title="${release.title}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `).join('');
    }
}

function openEditForm(releaseId, releaseType) {
    const release = (releaseType === 'album' ? db.albums : db.singles).find(r => r.id === releaseId); if (!release || !editReleaseForm) return;
    editReleaseId.value = release.id; editReleaseType.value = release.type; editReleaseTableName.value = release.tableName; editArtistNameDisplay.textContent = release.artist; editReleaseTitle.value = release.title; editReleaseCoverUrl.value = release.imageUrl; document.getElementById('editWysiwygCoverImg').src = release.imageUrl; document.getElementById('editWysiwygBg').style.backgroundImage = `url('${release.imageUrl}')`; 
    const artistObj = db.artists.find(a => a.id === release.artistId); if(artistObj) { document.getElementById('editWysiwygArtistImg').src = artistObj.img; }
    if (release.releaseDate) { try { const releaseDateObj = new Date(release.releaseDate); releaseDateObj.setMinutes(releaseDateObj.getMinutes() - releaseDateObj.getTimezoneOffset()); editReleaseDate.value = releaseDateObj.toISOString().slice(0, 16); } catch (e) { editReleaseDate.value = ''; } } else { editReleaseDate.value = ''; }
    if (editAlbumTracklistEditor && editTracklistActions) { populateTracklistEditor(editAlbumTracklistEditor, release.tracks); if (typeof Sortable !== 'undefined') { if (editAlbumTracklistSortable) editAlbumTracklistSortable.destroy(); editAlbumTracklistSortable = Sortable.create(editAlbumTracklistEditor, { animation: 150, handle: '.drag-handle', onEnd: () => updateTrackNumbers(editAlbumTracklistEditor) }); } }
    editReleaseListContainer?.classList.add('hidden'); editReleaseForm.classList.remove('hidden');
}

async function handleUpdateRelease(event) {
    event.preventDefault();
    const recordId = editReleaseId.value; const tableName = editReleaseTableName.value; const releaseType = editReleaseType.value;  const updatedTitle = editReleaseTitle.value.trim(); const updatedCoverUrl = editReleaseCoverUrl.value.trim(); const updatedReleaseDateTimeLocal = editReleaseDate.value;
    const originalRelease = (releaseType === 'album' ? db.albums : db.singles).find(r => r.id === recordId); if (!originalRelease || !recordId || !tableName || !updatedTitle || !updatedCoverUrl || !updatedReleaseDateTimeLocal) return;
    
    const artistId = originalRelease.artistId; const originalTrackIds = new Set(originalRelease.trackIds || []);

    let updatedReleaseDateISO;
    try { updatedReleaseDateISO = new Date(updatedReleaseDateTimeLocal).toISOString().split('T')[0]; if (isNaN(new Date(updatedReleaseDateISO).getTime())) throw new Error("Data inválida."); } catch (e) { showToast("Data inválida.", 'error'); return; }

    saveEditBtn.disabled = true; saveEditBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const titleFieldName = (tableName === 'Álbuns') ? 'Nome do Álbum' : 'Nome do Single/EP'; const coverFieldName = (tableName === 'Álbuns') ? 'Capa do Álbum' : 'Capa';
        const fieldsToUpdate = { [titleFieldName]: updatedTitle, [coverFieldName]: [{ "url": updatedCoverUrl }], "Data de Lançamento": updatedReleaseDateISO };
        const updateResult = await updateAirtableRecord(tableName, recordId, fieldsToUpdate);
        if (!updateResult || !updateResult.id) throw new Error("Falha ao atualizar o registro principal.");

        if (tableName === 'Álbuns' || tableName === 'Singles e EPs') { 
            const trackItems = editAlbumTracklistEditor.querySelectorAll('.track-list-item-display');
            if (!editAlbumTracklistEditor.classList.contains('hidden')) { 
                const musicRecordsToCreate = []; const musicRecordsToUpdate = []; const finalTrackIdsInEditor = new Set(); 
                for (let i = 0; i < trackItems.length; i++) {
                    const item = trackItems[i]; const existingSongId = item.dataset.existingSongId; const name = item.dataset.trackName; const durationStr = item.dataset.durationStr; const type = item.dataset.trackType; const durationSec = parseDurationToSeconds(durationStr);
                    let feats = []; try { feats = JSON.parse(item.dataset.feats || '[]'); } catch (e) {}
                    if (!name || (durationSec === 0 && !existingSongId) ) throw new Error(`Dados inválidos na Faixa ${i + 1}.`);

                    const linkField = tableName === 'Álbuns' ? 'Álbuns' : 'Singles e EPs';

                    let finalTrackName = name; let finalArtistIds = [artistId]; let collaborationType = null;
                    if (feats.length > 0) { 
                        collaborationType = feats[0].type; 
                        finalArtistIds = [artistId, ...feats.map(f => f.id)]; 
                        if (collaborationType === "Feat.") finalTrackName = `${name} (feat. ${feats.map(f => f.name).join(', ')})`; 
                    }

                    if (existingSongId) {
                        finalTrackIdsInEditor.add(existingSongId); const originalSong = db.songs.find(s => s.id === existingSongId); const existingLinks = (tableName === 'Álbuns' ? originalSong?.albumIds : originalSong?.singleIds) || []; const updatedLinks = [...new Set([...existingLinks, recordId])];
                        musicRecordsToUpdate.push({ 
                            id: existingSongId, 
                            fields: { 
                                "Nome da Faixa": finalTrackName,
                                "Artista": finalArtistIds,
                                "Duração": durationSec,
                                "Nº da Faixa": i + 1, 
                                "Tipo de Faixa": type, 
                                [linkField]: updatedLinks,
                                ...(collaborationType && { "Tipo de Colaboração": collaborationType })
                            } 
                        });
                    } else {
                        musicRecordsToCreate.push({ "Nome da Faixa": finalTrackName, "Artista": finalArtistIds, "Duração": durationSec, "Nº da Faixa": i + 1, "Tipo de Faixa": type, [linkField]: [recordId], ...(collaborationType && { "Tipo de Colaboração": collaborationType }) });
                    }
                } 
                if (musicRecordsToCreate.length > 0) { const createResult = await batchCreateAirtableRecords('Músicas', musicRecordsToCreate.map(fields => fields)); if (!createResult || createResult.length !== musicRecordsToCreate.length) throw new Error("Falha ao criar faixas novas."); createResult.forEach(record => finalTrackIdsInEditor.add(record.id)); }

                const tracksToUnlinkIds = [...originalTrackIds].filter(id => !finalTrackIdsInEditor.has(id));
                if (tracksToUnlinkIds.length > 0) {
                    const unlinkPayload = []; const linkField = tableName === 'Álbuns' ? 'Álbuns' : 'Singles e EPs';
                    for (const trackId of tracksToUnlinkIds) { const originalSong = db.songs.find(s => s.id === trackId); const existingLinks = (tableName === 'Álbuns' ? originalSong?.albumIds : originalSong?.singleIds) || []; const updatedLinks = existingLinks.filter(linkId => linkId !== recordId);  unlinkPayload.push({ id: trackId, fields: { [linkField]: updatedLinks } }); }
                    await batchUpdateAirtableRecords('Músicas', unlinkPayload);
                }
                if (musicRecordsToUpdate.length > 0) { const updateExistingResult = await batchUpdateAirtableRecords('Músicas', musicRecordsToUpdate); if (!updateExistingResult || updateExistingResult.length !== musicRecordsToUpdate.length) throw new Error("Falha ao atualizar faixas existentes."); }
            } 
        } 
        showToast("Atualizado com sucesso!", 'success'); editReleaseForm.classList.add('hidden'); editReleaseListContainer?.classList.remove('hidden'); await refreshAllData();
    } catch (error) { showToast(`Erro: ${error.message}`, 'error'); } 
    finally { saveEditBtn.disabled = false; saveEditBtn.innerHTML = '<i class="fas fa-save"></i> Salvar'; }
}

function openDeleteConfirmModal(recordId, tableName, releaseTitle, trackIds) { if (!deleteConfirmModal) return; deleteRecordId.value = recordId; deleteTableName.value = tableName; deleteReleaseName.textContent = releaseTitle; deleteTrackIds.value = JSON.stringify(trackIds || []); deleteConfirmModal.classList.remove('hidden'); }
function closeDeleteConfirmModal() { if (!deleteConfirmModal) return; deleteConfirmModal.classList.add('hidden'); deleteRecordId.value = ''; deleteTableName.value = ''; deleteReleaseName.textContent = ''; deleteTrackIds.value = ''; }

async function handleDeleteRelease() {
    const recordId = deleteRecordId.value; const tableName = deleteTableName.value; const trackIdsString = deleteTrackIds.value; let associatedTrackIds = [];
    try { associatedTrackIds = JSON.parse(trackIdsString || '[]'); } catch (e) {}
    if (!recordId || !tableName) { closeDeleteConfirmModal(); return; }

    confirmDeleteBtn.disabled = true; confirmDeleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    try {
        if (associatedTrackIds.length > 0) {
            const updates = []; const deletes = [];
            for (const trackId of associatedTrackIds) {
                const song = db.songs.find(s => s.id === trackId); if (!song) continue;
                const totalLinks = (song.albumIds || []).length + (song.singleIds || []).length;
                if (totalLinks > 1) { const isAlbumTable = tableName === 'Álbuns'; const linkField = isAlbumTable ? 'Álbuns' : 'Singles e EPs'; const currentLinks = (isAlbumTable ? song.albumIds : song.singleIds) || []; updates.push({ id: trackId, fields: { [linkField]: currentLinks.filter(linkId => linkId !== recordId) } }); } 
                else { deletes.push(trackId); }
            }
            if (updates.length > 0) await batchUpdateAirtableRecords('Músicas', updates);
            if (deletes.length > 0) await batchDeleteAirtableRecords('Músicas', deletes);
        }
        const releaseDeleteResult = await deleteAirtableRecord(tableName, recordId);
        if (releaseDeleteResult && releaseDeleteResult.deleted) { showToast("Lançamento apagado!", 'success'); closeDeleteConfirmModal(); await refreshAllData(); } else { throw new Error("Falha na exclusão."); }
    } catch (error) { showToast(`Erro: ${error.message}`, 'error'); closeDeleteConfirmModal(); } 
    finally { confirmDeleteBtn.disabled = false; confirmDeleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Sim, Apagar'; }
}

function initializeStudio() {
    setupImageUploadWithPreview('wysiwygCoverFile', 'wysiwygCoverUrl', 'wysiwygCoverImg', 'wysiwygBg'); setupImageUploadWithPreview('editReleaseCoverFile', 'editReleaseCoverUrl', 'editWysiwygCoverImg', 'editWysiwygBg'); setupImageUploadWithPreview('newArtistImageFile', 'newArtistImageUrl'); setupImageUploadWithPreview('editArtistImageFile', 'editArtistImageUrl', null, null, (url) => { updateArtistEditPreviews(); });
    wysiwygArtistSelect?.addEventListener('change', (e) => { const artist = db.artists.find(a => a.id === e.target.value); if(artist && wysiwygArtistImg) wysiwygArtistImg.src = artist.img; });

    const releaseNatureSelect = document.getElementById('wysiwygReleaseNature'), originalAlbumSelectInline = document.getElementById('wysiwygOriginalAlbumSelect'), btnImportDeluxe = document.getElementById('btnImportDeluxe');
    releaseNatureSelect?.addEventListener('change', (e) => {
        if (e.target.value === 'deluxe') {
            const artistId = document.getElementById('wysiwygArtistSelect')?.value;
            if (!artistId) { showToast("Selecione o Artista Principal primeiro.", 'error'); e.target.value = 'original'; return; }
            const artistAlbums = db.albums.filter(a => a.artistId === artistId);
            if (artistAlbums.length === 0) { showToast("Nenhum álbum anterior encontrado para este artista.", 'info'); e.target.value = 'original'; return; }
            originalAlbumSelectInline.innerHTML = '<option value="">Selecione o álbum base...</option>' + artistAlbums.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)).map(album => `<option value="${album.id}">${album.title}</option>`).join('');
            originalAlbumSelectInline.classList.remove('hidden'); btnImportDeluxe.classList.remove('hidden');
        } else { originalAlbumSelectInline.classList.add('hidden'); btnImportDeluxe.classList.add('hidden'); originalAlbumSelectInline.innerHTML = ''; }
    });

    document.getElementById('wysiwygArtistSelect')?.addEventListener('change', () => {
        if (releaseNatureSelect && releaseNatureSelect.value === 'deluxe') { releaseNatureSelect.value = 'original'; releaseNatureSelect.dispatchEvent(new Event('change')); const albumTracklistEditor = document.getElementById('wysiwygTracklistEditor'); if(albumTracklistEditor) populateTracklistEditor(albumTracklistEditor, []); }
    });

    btnImportDeluxe?.addEventListener('click', () => {
        const albumIdToImport = originalAlbumSelectInline.value, albumTracklistEditor = document.getElementById('wysiwygTracklistEditor'), albumTitle = document.getElementById('wysiwygTitle'); 
        if (!albumIdToImport) { showToast("Selecione um álbum para importar.", 'error'); return; }
        const album = db.albums.find(a => a.id === albumIdToImport); if (!album) return;
        populateTracklistEditor(albumTracklistEditor, album.tracks); if (albumTitle && !albumTitle.value.includes('Deluxe')) albumTitle.value = `${album.title} (Deluxe)`;
    });

    loginButton?.addEventListener('click', () => { const username = document.getElementById('usernameInput')?.value, password = document.getElementById('passwordInput')?.value; loginPlayer(username, password); });
    logoutButton?.addEventListener('click', logoutPlayer);
    showRegisterBtn?.addEventListener('click', (e) => { e.preventDefault(); loginPrompt?.classList.add('hidden'); registerPrompt?.classList.remove('hidden'); });
    showLoginBtn?.addEventListener('click', (e) => { e.preventDefault(); registerPrompt?.classList.add('hidden'); loginPrompt?.classList.remove('hidden'); });
    registerButton?.addEventListener('click', () => { registerPlayer(regUsernameInput?.value, regPasswordInput?.value); });
    newArtistForm?.addEventListener('submit', handleArtistSubmit); editArtistForm?.addEventListener('submit', handleEditArtistSubmit);

    editArtistSelect?.addEventListener('change', (e) => {
        const artistId = e.target.value; if (!artistId) { editArtistFields?.classList.add('hidden'); return; }
        const artist = db.artists.find(a => a.id === artistId);
        if (artist) { editArtistFields?.classList.remove('hidden'); editArtistNameInput.value = artist.name; editArtistImageUrl.value = artist.rawUrl; editArtistBgPosition.value = parseInt(artist.bgPos) || 20; updateArtistEditPreviews(); }
    });

    editArtistImageUrl?.addEventListener('input', updateArtistEditPreviews); editArtistBgPosition?.addEventListener('input', updateArtistEditPreviews);

    studioTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const clickedTab = e.currentTarget, formTarget = clickedTab.dataset.form;
            studioTabs.forEach(t => t.classList.remove('active')); studioForms.forEach(f => f.classList.remove('active')); clickedTab.classList.add('active');
            let targetElementId;
            if (formTarget === 'release') { targetElementId = 'wysiwygReleaseForm'; initAlbumForm(); } 
            else if (formTarget === 'edit') { targetElementId = 'editReleaseSection'; populateEditableReleases(); editReleaseListContainer?.classList.remove('hidden'); editReleaseForm?.classList.add('hidden'); } 
            else if (formTarget === 'artist') { targetElementId = 'newArtistForm'; } 
            else if (formTarget === 'editArtist') { targetElementId = 'editArtistForm'; if (editArtistSelect && editArtistSelect.value) editArtistSelect.dispatchEvent(new Event('change')); }
            const targetElement = document.getElementById(targetElementId); if (targetElement) targetElement.classList.add('active'); 
        });
    });

    confirmFeatBtn?.addEventListener('click', confirmFeat); cancelFeatBtn?.addEventListener('click', closeFeatModal); saveAlbumTrackBtn?.addEventListener('click', saveAlbumTrack); cancelAlbumTrackBtn?.addEventListener('click', closeAlbumTrackModal);
    openWysiwygAddTrackBtn?.addEventListener('click', () => { activeTracklistEditor = wysiwygTracklistEditor; openAlbumTrackModal(); }); openWysiwygExistingTrackBtn?.addEventListener('click', () => { activeTracklistEditor = wysiwygTracklistEditor; openExistingTrackModal('album'); });
    openEditAddTrackModalBtn?.addEventListener('click', () => { activeTracklistEditor = editAlbumTracklistEditor; openAlbumTrackModal(); }); openEditExistingTrackModalBtn?.addEventListener('click', () => { activeTracklistEditor = editAlbumTracklistEditor; openExistingTrackModal('album'); });
    addInlineFeatBtn?.addEventListener('click', toggleInlineFeatAdder); confirmInlineFeatBtn?.addEventListener('click', confirmInlineFeat); cancelInlineFeatBtn?.addEventListener('click', cancelInlineFeat);

    wysiwygTracklistEditor?.addEventListener('click', (e) => { const editBtn = e.target.closest('.edit-track-btn'), rmBtn = e.target.closest('.remove-track-btn'), trkItem = e.target.closest('.track-list-item-display'); if (editBtn && trkItem) { activeTracklistEditor = wysiwygTracklistEditor; openAlbumTrackModal(trkItem); } else if (rmBtn && trkItem) { trkItem.remove(); updateTrackNumbers(wysiwygTracklistEditor); } });
    editAlbumTracklistEditor?.addEventListener('click', (e) => { const editBtn = e.target.closest('.edit-track-btn'), rmBtn = e.target.closest('.remove-track-btn'), trkItem = e.target.closest('.track-list-item-display'); if (editBtn && trkItem) { activeTracklistEditor = editAlbumTracklistEditor; openAlbumTrackModal(trkItem); } else if (rmBtn && trkItem) { trkItem.remove(); updateTrackNumbers(editAlbumTracklistEditor); } });

    editReleaseList?.addEventListener('click', (e) => {
         const editButton = e.target.closest('.edit-release-btn'), deleteButton = e.target.closest('.delete-release-btn');
         if (editButton) { const releaseId = editButton.dataset.releaseId, releaseType = editButton.dataset.releaseType; openEditForm(releaseId, releaseType); } 
         else if (deleteButton) { const releaseId = deleteButton.dataset.releaseId, releaseType = deleteButton.dataset.releaseType, tableName = deleteButton.dataset.releaseTable, releaseTitle = deleteButton.closest('.edit-release-item')?.querySelector('.edit-release-title')?.textContent || 'este lançamento', release = (releaseType === 'album' ? db.albums : db.singles).find(r => r.id === releaseId), trackIdsToDelete = release?.trackIds || []; openDeleteConfirmModal(releaseId, tableName, releaseTitle, trackIdsToDelete); }
    });

    editReleaseForm?.addEventListener('submit', handleUpdateRelease); cancelEditBtn?.addEventListener('click', () => { editReleaseForm?.classList.add('hidden'); editReleaseListContainer?.classList.remove('hidden'); }); cancelDeleteBtn?.addEventListener('click', closeDeleteConfirmModal); confirmDeleteBtn?.addEventListener('click', handleDeleteRelease); editArtistFilterSelect?.addEventListener('change', populateEditableReleases); wysiwygReleaseForm?.addEventListener('submit', handleWysiwygSubmit); existingTrackSearch?.addEventListener('input', populateExistingTrackSearch); cancelExistingTrackBtn?.addEventListener('click', closeExistingTrackModal); existingTrackResults?.addEventListener('click', handleExistingTrackSelect);

    initAlbumForm(); 
    if (typeof Sortable !== 'undefined') {
        if (wysiwygTracklistEditor) wysiwygTracklistSortable = Sortable.create(wysiwygTracklistEditor, { animation: 150, handle: '.drag-handle', onEnd: () => updateTrackNumbers(wysiwygTracklistEditor) });
        if (editAlbumTracklistEditor) editAlbumTracklistSortable = Sortable.create(editAlbumTracklistEditor, { animation: 150, handle: '.drag-handle', onEnd: () => updateTrackNumbers(editAlbumTracklistEditor) });
    }
    
    actionTypeSelect?.addEventListener('change', () => {
        const actionType = actionTypeSelect.value;
        if (IMAGE_ACTION_CONFIG[actionType]) { releaseSelectWrapper.classList.add('hidden'); trackSelectWrapper.classList.add('hidden'); actionLimitInfo.classList.add('hidden'); confirmActionButton.disabled = false; confirmActionButton.textContent = 'Confirmar Ação de Imagem'; } 
        else if (ACTION_CONFIG[actionType]) { releaseSelectWrapper.classList.remove('hidden'); updateActionLimitInfo(); } 
        else { releaseSelectWrapper.classList.remove('hidden'); trackSelectWrapper.classList.add('hidden'); actionLimitInfo.classList.add('hidden'); confirmActionButton.disabled = true; }
    });

    releaseSelect?.addEventListener('change', () => { const artistId = modalArtistId.value; if (releaseSelect.value && artistId) { populateTrackSelectForActions(releaseSelect.value, artistId); } else { trackSelectWrapper.classList.add('hidden'); } });
    trackSelect?.addEventListener('change', updateActionLimitInfo); cancelActionButton?.addEventListener('click', () => { actionModal.classList.add('hidden'); }); confirmActionButton?.addEventListener('click', handleConfirmAction);
}
