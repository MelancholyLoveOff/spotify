// js/app.js

function initializeDOMElements() {
    try {
        allViews = document.querySelectorAll('.page-view'); 
        searchInput = document.getElementById('searchInput'); 
        studioView = document.getElementById('studioView'); 
        loginPrompt = document.getElementById('loginPrompt'); 
        loggedInInfo = document.getElementById('loggedInInfo'); 
        loginButton = document.getElementById('loginButton'); 
        logoutButton = document.getElementById('logoutButton'); 
        studioLaunchWrapper = document.getElementById('studioLaunchWrapper'); 
        studioTabs = document.querySelectorAll('.studio-tab-btn'); 
        studioForms = document.querySelectorAll('.studio-form-content');
        
        wysiwygReleaseForm = document.getElementById('wysiwygReleaseForm'); 
        wysiwygArtistSelect = document.getElementById('wysiwygArtistSelect'); 
        wysiwygTitle = document.getElementById('wysiwygTitle'); 
        wysiwygCoverFile = document.getElementById('wysiwygCoverFile'); 
        wysiwygCoverUrl = document.getElementById('wysiwygCoverUrl'); 
        wysiwygReleaseDate = document.getElementById('wysiwygReleaseDate'); 
        wysiwygToggleDeluxe = document.getElementById('wysiwygReleaseNature');
        wysiwygTracklistEditor = document.getElementById('wysiwygTracklistEditor'); 
        wysiwygBg = document.getElementById('wysiwygBg'); 
        wysiwygCoverImg = document.getElementById('wysiwygCoverImg'); 
        wysiwygArtistImg = document.getElementById('wysiwygArtistImg'); 
        openWysiwygAddTrackBtn = document.getElementById('openWysiwygAddTrackBtn'); 
        openWysiwygExistingTrackBtn = document.getElementById('openWysiwygExistingTrackBtn'); 
        submitWysiwygRelease = document.getElementById('submitWysiwygRelease');
        
        featModal = document.getElementById('featModal'); 
        featArtistSelect = document.getElementById('featArtistSelect'); 
        featTypeSelect = document.getElementById('featTypeSelect'); 
        confirmFeatBtn = document.getElementById('confirmFeatBtn'); 
        cancelFeatBtn = document.getElementById('cancelFeatBtn'); 
        albumTrackModal = document.getElementById('albumTrackModal'); 
        albumTrackModalTitle = document.getElementById('albumTrackModalTitle'); 
        albumTrackNameInput = document.getElementById('albumTrackNameInput'); 
        albumTrackDurationInput = document.getElementById('albumTrackDurationInput'); 
        albumTrackTypeSelect = document.getElementById('albumTrackTypeSelect'); 
        albumTrackFeatList = document.getElementById('albumTrackFeatList'); 
        saveAlbumTrackBtn = document.getElementById('saveAlbumTrackBtn'); 
        cancelAlbumTrackBtn = document.getElementById('cancelAlbumTrackBtn'); 
        editingTrackItemId = document.getElementById('editingTrackItemId'); 
        editingTrackExistingId = document.getElementById('editingTrackExistingId'); 
        inlineFeatAdder = document.getElementById('inlineFeatAdder'); 
        inlineFeatArtistSelect = document.getElementById('inlineFeatArtistSelect'); 
        inlineFeatTypeSelect = document.getElementById('inlineFeatTypeSelect'); 
        confirmInlineFeatBtn = document.getElementById('confirmInlineFeatBtn'); 
        cancelInlineFeatBtn = document.getElementById('cancelInlineFeatBtn'); 
        addInlineFeatBtn = albumTrackModal?.querySelector('.add-inline-feat-btn'); 
        
        audioElement = document.getElementById('audioElement'); 
        musicPlayerView = document.getElementById('musicPlayer'); 
        playerCloseBtn = document.querySelector('.player-close-btn'); 
        playerAlbumTitle = document.getElementById('playerAlbumTitle'); 
        playerCoverArt = document.getElementById('playerCoverArt'); 
        playerSongTitle = document.getElementById('playerSongTitle'); 
        playerArtistName = document.getElementById('playerArtistName'); 
        playerSeekBar = document.getElementById('playerSeekBar'); 
        playerCurrentTime = document.getElementById('playerCurrentTime'); 
        playerTotalTime = document.getElementById('playerTotalTime'); 
        playerShuffleBtn = document.getElementById('playerShuffleBtn'); 
        playerPrevBtn = document.getElementById('playerPrevBtn'); 
        playerPlayPauseBtn = document.getElementById('playerPlayPauseBtn'); 
        playerNextBtn = document.getElementById('playerNextBtn'); 
        playerRepeatBtn = document.getElementById('playerRepeatBtn');
        
        editReleaseSection = document.getElementById('editReleaseSection'); 
        editReleaseListContainer = document.getElementById('editReleaseListContainer'); 
        editReleaseList = document.getElementById('editReleaseList'); 
        editReleaseForm = document.getElementById('editReleaseForm'); 
        editReleaseId = document.getElementById('editReleaseId'); 
        editReleaseType = document.getElementById('editReleaseType'); 
        editReleaseTableName = document.getElementById('editReleaseTableName'); 
        editArtistNameDisplay = document.getElementById('editArtistNameDisplay'); 
        editReleaseTitle = document.getElementById('editReleaseTitle'); 
        editReleaseCoverUrl = document.getElementById('editReleaseCoverUrl'); 
        editReleaseDate = document.getElementById('editReleaseDate'); 
        cancelEditBtn = document.getElementById('cancelEditBtn'); 
        saveEditBtn = document.getElementById('saveEditBtn'); 
        
        deleteConfirmModal = document.getElementById('deleteConfirmModal'); 
        deleteReleaseName = document.getElementById('deleteReleaseName'); 
        deleteRecordId = document.getElementById('deleteRecordId'); 
        deleteTableName = document.getElementById('deleteTableName'); 
        deleteTrackIds = document.getElementById('deleteTrackIds'); 
        cancelDeleteBtn = document.getElementById('cancelDeleteBtn'); 
        confirmDeleteBtn = document.getElementById('confirmDeleteBtn'); 
        
        existingTrackModal = document.getElementById('existingTrackModal'); 
        existingTrackSearch = document.getElementById('existingTrackSearch'); 
        existingTrackResults = document.getElementById('existingTrackResults'); 
        cancelExistingTrackBtn = document.getElementById('cancelExistingTrackBtn'); 
        editArtistFilterSelect = document.getElementById('editArtistFilterSelect'); 
        editAlbumTracklistEditor = document.getElementById('editAlbumTracklistEditor'); 
        editTracklistActions = document.getElementById('editTracklistActions'); 
        openEditAddTrackModalBtn = document.getElementById('openEditAddTrackModalBtn'); 
        openEditExistingTrackModalBtn = document.getElementById('openEditExistingTrackModalBtn');
        
        registerPrompt = document.getElementById('registerPrompt'); 
        regUsernameInput = document.getElementById('regUsernameInput'); 
        regPasswordInput = document.getElementById('regPasswordInput'); 
        registerButton = document.getElementById('registerButton'); 
        showRegisterBtn = document.getElementById('showRegisterBtn'); 
        showLoginBtn = document.getElementById('showLoginBtn'); 
        
        newArtistForm = document.getElementById('newArtistForm'); 
        newArtistName = document.getElementById('newArtistName'); 
        newArtistImageUrl = document.getElementById('newArtistImageUrl'); 
        submitNewArtist = document.getElementById('submitNewArtist'); 
        
        editArtistForm = document.getElementById('editArtistForm'); 
        editArtistSelect = document.getElementById('editArtistSelect'); 
        editArtistFields = document.getElementById('editArtistFields'); 
        editArtistNameInput = document.getElementById('editArtistNameInput'); 
        editArtistImageUrl = document.getElementById('editArtistImageUrl'); 
        editArtistBgPosition = document.getElementById('editArtistBgPosition'); 
        editArtistPreviewCircle = document.getElementById('editArtistPreviewCircle'); 
        editArtistPreviewHeader = document.getElementById('editArtistPreviewHeader'); 
        submitEditArtist = document.getElementById('submitEditArtist');
        
        actionModal = document.getElementById('actionModal'); 
        modalArtistName = document.getElementById('modalArtistName'); 
        modalArtistId = document.getElementById('modalArtistId'); 
        actionTypeSelect = document.getElementById('actionTypeSelect'); 
        releaseSelectWrapper = document.getElementById('releaseSelectWrapper'); 
        releaseSelect = document.getElementById('releaseSelect'); 
        trackSelectWrapper = document.getElementById('trackSelectWrapper'); 
        trackSelect = document.getElementById('trackSelect'); 
        actionLimitInfo = document.getElementById('actionLimitInfo'); 
        currentActionCount = document.getElementById('currentActionCount'); 
        maxActionCount = document.getElementById('maxActionCount'); 
        confirmActionButton = document.getElementById('confirmActionButton'); 
        cancelActionButton = document.getElementById('cancelActionButton'); 
        artistActionsList = document.getElementById('artistActionsList');
        
        miniPlayer = document.getElementById('miniPlayer'); 
        miniPlayerCover = document.getElementById('miniPlayerCover'); 
        miniPlayerTitle = document.getElementById('miniPlayerTitle'); 
        miniPlayerArtist = document.getElementById('miniPlayerArtist'); 
        miniPlayerPlayPauseBtn = document.getElementById('miniPlayerPlayPauseBtn'); 
        miniPlayerProgress = document.getElementById('miniPlayerProgress');

        const now = new Date(); 
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); 
        now.setSeconds(0); 
        now.setMilliseconds(0); 
        if(wysiwygReleaseDate) wysiwygReleaseDate.value = now.toISOString().slice(0, 16);
        
        window.populateTracklistEditor = populateTracklistEditor; 
        return true; 
    } catch(error) { 
        console.error("Erro DOM:", error); 
        return false; 
    }
}

function initializeBodyClickListener() {
    document.body.addEventListener('click', (event) => {
        const backButton = event.target.closest('[data-action="back"]'); 
        if (backButton) { event.preventDefault(); handleBack(); return; }
        
        const artistCard = event.target.closest('.artist-card[data-artist-name]'); 
        const artistLink = event.target.closest('.artist-link[data-artist-name]');
        if (artistCard) { openArtistDetail(artistCard.dataset.artistName); return; }
        if (artistLink) { event.preventDefault(); openArtistDetail(artistLink.dataset.artistName); return; }
        
        const albumCard = event.target.closest('[data-album-id]');
        if (albumCard && albumCard.id !== 'albumDetail') { 
            if (event.target.closest('.action-buttons') || albumCard.closest('#editReleaseList')) return; 
            openAlbumDetail(albumCard.dataset.albumId); return; 
        }
        
        const mainPlayBtn = event.target.closest('.main-play-btn');
        if (mainPlayBtn) {
            event.preventDefault(); 
            const popularList = mainPlayBtn.closest('.page-view').querySelector('.popular-songs-list'); 
            const albumTracklist = mainPlayBtn.closest('.page-view').querySelector('.tracklist-container');
            let firstSong = null; 
            if (popularList) { firstSong = popularList.querySelector('.song-row.available'); } 
            else if (albumTracklist) { firstSong = albumTracklist.querySelector('.track-row.available'); }
            if (firstSong) { openPlayer(firstSong.dataset.songId, firstSong); } return;
        }
        
        const songRow = event.target.closest('.song-row[data-song-id], .track-row[data-song-id].available, .chart-item[data-song-id]');
        if (songRow) { 
            if (event.target.closest('.track-actions button') || songRow.closest('.studio-form-content')) return; 
            openPlayer(songRow.dataset.songId, songRow); return; 
        }
        
        const discogLink = event.target.closest('.discography-link[data-discog-type]'); 
        if (discogLink) { event.preventDefault(); openDiscographyDetail(discogLink.dataset.discogType); return; }
        
        const refreshButton = event.target.closest('[data-action="refresh"]');
        if(refreshButton){
            const icon = refreshButton.querySelector('i'); 
            if(icon) icon.classList.add('fa-spin'); 
            refreshButton.disabled = true; 

            carregarPosicoesAnteriores().then(() => {
                try {
                    if (typeof saveChartDataToLocalStorage === 'function') {
                        saveChartDataToLocalStorage('rpg');
                    }
                } catch(e) { console.error("Erro a guardar histórico RPG:", e); }

                refreshAllData().finally(() => { 
                    if(icon) icon.classList.remove('fa-spin'); 
                    refreshButton.disabled = false; 
                    showToast('Dados e Posições atualizados com sucesso!', 'success'); 
                }); 
            });
            return; 
        }
    });
}

function attachNavigationListeners() {
    const navButtons = document.querySelectorAll('.nav-tab, .bottom-nav-item');
    navButtons.forEach(button => { 
        button.removeEventListener('click', switchTab); 
        button.addEventListener('click', switchTab); 
    });
    if(searchInput) { 
        searchInput.removeEventListener('input', handleSearch); 
        searchInput.addEventListener('input', handleSearch); 
    }
}

function setupDeluxeModalListeners() {
    const selectOriginalAlbumModal = document.getElementById('selectOriginalAlbumModal');
    const originalAlbumSelect = document.getElementById('originalAlbumSelect');
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    
    function openImportDeluxeModal() {
        const albumArtistSelect = document.getElementById('wysiwygArtistSelect'); 
        const artistId = albumArtistSelect?.value;
        if (!artistId) { 
            showToast("Selecione o Artista Principal na capa do lançamento.", "error"); 
            if (wysiwygToggleDeluxe) wysiwygToggleDeluxe.value = 'original'; 
            return; 
        }

        const artistAlbums = db.albums.filter(a => a.artistId === artistId);
        if (artistAlbums.length === 0) { 
            showToast("Nenhum álbum anterior encontrado.", "info"); 
            if (wysiwygToggleDeluxe) wysiwygToggleDeluxe.value = 'original'; 
            return; 
        }

        originalAlbumSelect.innerHTML = artistAlbums.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate)).map(album => `<option value="${album.id}">${album.title}</option>`).join('');
        selectOriginalAlbumModal.classList.remove('hidden');
    }

    function handleImportDeluxeTracks() {
        const albumIdToImport = originalAlbumSelect.value;
        const albumTracklistEditor = document.getElementById('wysiwygTracklistEditor'); 
        const albumTitle = document.getElementById('wysiwygTitle'); 

        if (!albumIdToImport) return;
        const album = db.albums.find(a => a.id === albumIdToImport);
        if (!album) return;

        populateTracklistEditor(albumTracklistEditor, album.tracks);
        if (albumTitle && !albumTitle.value.includes('Deluxe')) albumTitle.value = `${album.title} (Deluxe)`;
        selectOriginalAlbumModal.classList.add('hidden');
    }

    wysiwygToggleDeluxe?.addEventListener('change', () => { 
        if (wysiwygToggleDeluxe.value === 'deluxe') openImportDeluxeModal(); 
    }); 
    
    confirmImportBtn?.addEventListener('click', handleImportDeluxeTracks);
    cancelImportBtn?.addEventListener('click', () => { 
        selectOriginalAlbumModal.classList.add('hidden'); 
        if (wysiwygToggleDeluxe) wysiwygToggleDeluxe.value = 'original'; 
    }); 

    const albumArtistSelectEv = document.getElementById('wysiwygArtistSelect'); 
    if (albumArtistSelectEv) {
        albumArtistSelectEv.addEventListener('change', () => {
            if (wysiwygToggleDeluxe && wysiwygToggleDeluxe.value === 'deluxe') { 
                wysiwygToggleDeluxe.value = 'original'; 
                const albumTracklistEditor = document.getElementById('wysiwygTracklistEditor'); 
                if(albumTracklistEditor) populateTracklistEditor(albumTracklistEditor, []);
            }
        });
    }
}

async function refreshAllData() {
    const data = await loadAllData();
    if (data && data.allArtists) { 
        if (initializeData(data)) { 
            try { renderRPGChart(); } catch(e){}
            try { renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10)); } catch(e){}
            try { renderChart('music'); } catch(e){}
            try { renderChart('album'); } catch(e){}
            try { if (typeof renderSearchDefault === 'function') renderSearchDefault(); } catch(e){}
            
            if (currentPlayer) {
                currentPlayer = db.players.find(p => p.id === currentPlayer.id) || currentPlayer;
                try { populateArtistSelector(currentPlayer.id); } catch(e){}
                try { displayArtistActions(); } catch(e){}
                
                if (document.querySelector('.studio-tab-btn[data-form="edit"]')?.classList.contains('active')) {
                    try { populateEditableReleases(); } catch(e){}
                }
                if (document.querySelector('.studio-tab-btn[data-form="editArtist"]')?.classList.contains('active')) {
                    if (editArtistSelect && editArtistSelect.value) editArtistSelect.dispatchEvent(new Event('change'));
                }
            }
            
            const artistDetailView = document.getElementById('artistDetail');
            if (activeArtist && artistDetailView && !artistDetailView.classList.contains('hidden')) { 
                const refreshedArtistData = db.artists.find(a => a.id === activeArtist.id); 
                if (refreshedArtistData) openArtistDetail(refreshedArtistData.name); 
                else handleBack(); 
            }
            
            const albumDetailView = document.getElementById('albumDetail'); 
            const currentAlbumId = albumDetailView?.dataset.albumId;
            if (currentAlbumId && !albumDetailView.classList.contains('hidden')) { 
                const refreshedAlbumData = [...db.albums, ...db.singles].find(a => a.id === currentAlbumId); 
                if (refreshedAlbumData) openAlbumDetail(refreshedAlbumData.id); 
                else handleBack(); 
            }
            
            try { attachNavigationListeners(); } catch (e) {} 
            
            window.refreshAllData = refreshAllData; 
            return true; 
        } else { return false; }
    } else { return false; }
}

window.refreshAllData = refreshAllData;

async function main() {
    if (!initializeDOMElements()) return;
    
    const data = await loadAllData(); 
    if (!data) return;
    if (!initializeData(data)) return;

    // --- INÍCIO: CONFIGURAÇÃO DO REALTIME SUPABASE ---
    if (supabaseClient) {
        // Escuta mudanças na tabela de Músicas (streams, ranks, etc)
        supabaseClient
          .channel('realtime-musicas')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'songs' },
            (payload) => {
                console.log('Músicas atualizadas em tempo real!', payload);
                refreshAllData(); // Recarrega os dados para mostrar ao vivo
            }
          )
          .subscribe();

        // Escuta mudanças na tabela de Artistas (RPG points, Imagem, etc)
        supabaseClient
          .channel('realtime-artistas')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'artists' },
            (payload) => {
                console.log('Artistas atualizados em tempo real!', payload);
                refreshAllData();
            }
          )
          .subscribe();

        // Escuta mudanças na tabela de Álbuns e Singles
        supabaseClient
          .channel('realtime-albuns')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'albums' },
            () => refreshAllData()
          )
          .subscribe();
          
        supabaseClient
          .channel('realtime-singles')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'singles' },
            () => refreshAllData()
          )
          .subscribe();
    }
    // --- FIM: CONFIGURAÇÃO DO REALTIME SUPABASE ---
    
    const savedPlayerId = localStorage.getItem('spotifyRpg_loggedInPlayerId');
    if (savedPlayerId) {
        const foundPlayer = db.players.find(p => p.id === savedPlayerId);
        if (foundPlayer) {
            currentPlayer = foundPlayer; 
            const playerNameElement = document.getElementById('playerName'); 
            if (playerNameElement) playerNameElement.textContent = currentPlayer.name;
            document.getElementById('loginPrompt')?.classList.add('hidden'); 
            document.getElementById('registerPrompt')?.classList.add('hidden'); 
            document.getElementById('loggedInInfo')?.classList.remove('hidden'); 
            document.getElementById('studioLaunchWrapper')?.classList.remove('hidden'); 
            document.getElementById('actionsLoginPrompt')?.classList.add('hidden'); 
            document.getElementById('actionsWrapper')?.classList.remove('hidden');
            populateArtistSelector(currentPlayer.id); 
            displayArtistActions();
        }
    }
    
    try { 
        renderRPGChart(); 
        renderArtistsGrid('homeGrid', [...(db.artists || [])].sort(() => 0.5 - Math.random()).slice(0, 10)); 
        renderChart('music'); 
        renderChart('album'); 
        if (typeof renderSearchDefault === 'function') renderSearchDefault();
    } catch (renderError) { console.error("Erro na renderização inicial", renderError); }
    
    try { 
        attachNavigationListeners(); 
        initializeBodyClickListener(); 
        initializeStudio(); 
        initializePlayerListeners(); 
        setupDeluxeModalListeners();
    } catch (listenerError) { console.error("Erro nos Listeners", listenerError); }
    
    try { 
        setupCountdown('rpgChartTimer', 'rpg'); 
        setupCountdown('musicChartTimer', 'music'); 
        setupCountdown('albumChartTimer', 'album'); 
    } catch(countdownError) { console.error("Erro nos Countdowns", countdownError); }
    
    switchView('mainView'); 
    activateMainViewSection('homeSection');

    // --- LER O LINK COMPARTILHADO ---
    const urlParams = new URLSearchParams(window.location.search);
    
    // Verifica se tem link de música
    const songToPlay = urlParams.get('song');
    if (songToPlay) {
        const song = db.songs.find(s => s.id === songToPlay);
        if (song) {
            setTimeout(() => openPlayer(songToPlay), 500);
        } else {
            showToast("Música não encontrada.", "error");
        }
    }

    // Verifica se tem link de álbum
    const albumToOpen = urlParams.get('album');
    if (albumToOpen) {
        const album = [...db.albums, ...db.singles].find(a => a.id === albumToOpen);
        if (album) {
            setTimeout(() => openAlbumDetail(albumToOpen), 300);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    main().catch(err => console.error("Falha fatal na inicialização:", err));
});
