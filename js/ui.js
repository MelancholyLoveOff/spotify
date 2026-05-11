// js/ui.js

const switchView = (viewId) => {
    const currentView = document.querySelector('.page-view:not(.hidden)');
    if (currentView && currentView.id === 'albumDetail' && viewId !== 'albumDetail' && albumCountdownInterval) { clearInterval(albumCountdownInterval); albumCountdownInterval = null; }
    allViews.forEach(v => v.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden'); if (viewId !== 'albumDetail') { const ad = document.getElementById('albumDetail'); if(ad) delete ad.dataset.albumId; }
        window.scrollTo(0, 0); 
        if (viewId !== 'mainView' && viewId !== 'studioView') { if (viewHistory.length === 0 || viewHistory[viewHistory.length - 1] !== viewId) viewHistory.push(viewId); } 
        else if (viewId === 'mainView') { viewHistory = []; }
    } else { document.getElementById('mainView')?.classList.remove('hidden'); viewHistory = []; }
};

function activateMainViewSection(sectionId) {
    document.querySelectorAll('#mainView .content-section').forEach(s => s.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection && document.getElementById('mainView')?.contains(targetSection)) { targetSection.classList.add('active'); } 
    else { document.getElementById('homeSection')?.classList.add('active'); return 'homeSection'; }
    return sectionId; 
}

const switchTab = (event, forceTabId = null) => {
    let targetTabId;
    if (forceTabId) targetTabId = forceTabId;
    else if (event) { event.preventDefault(); const clickedButton = event.target.closest('[data-tab]'); if (!clickedButton) return; targetTabId = clickedButton.dataset.tab; } 
    else return;

    if (targetTabId === 'studioSection') {
        switchView('studioView'); 
        const editSection = document.getElementById('editReleaseSection');
        if (editSection && editSection.classList.contains('active')) { 
            populateEditableReleases(); 
            editReleaseListContainer?.classList.remove('hidden'); 
            editReleaseForm?.classList.add('hidden'); 
        } else { 
            const currentlyActiveForm = document.querySelector('.studio-form-content.active'); 
            if (!currentlyActiveForm) { 
                document.getElementById('wysiwygReleaseForm')?.classList.add('active'); 
            } 
        }
    } else {
        const mainViewElement = document.getElementById('mainView');
        if (mainViewElement?.classList.contains('hidden')) switchView('mainView');
        targetTabId = activateMainViewSection(targetTabId); 
    }
    document.querySelectorAll('.nav-tab, .bottom-nav-item').forEach(button => button.classList.remove('active'));
    document.querySelectorAll(`.nav-tab[data-tab="${targetTabId}"], .bottom-nav-item[data-tab="${targetTabId}"]`).forEach(button => button.classList.add('active'));
};

const handleBack = () => {
    const currentViewElement = document.querySelector('.page-view:not(.hidden)');
    if (currentViewElement && currentViewElement.id === 'albumDetail' && albumCountdownInterval) { clearInterval(albumCountdownInterval); albumCountdownInterval = null; }
    viewHistory.pop(); const previousViewId = viewHistory.pop() || 'mainView'; switchView(previousViewId); 
};

const renderArtistsGrid = (containerId, artists) => {
    const container = document.getElementById(containerId); if (!container) return;
    if (!artists || artists.length === 0) { container.innerHTML = '<p class="empty-state">Nenhum artista para exibir.</p>'; return; }
    container.innerHTML = artists.map(artist => `
        <div class="artist-card" data-artist-name="${artist.name}">
            <img src="${artist.img}" alt="${artist.name}" class="artist-card-img" style="object-position: center ${artist.bgPos};">
            <p class="artist-card-name">${artist.name}</p>
            <span class="artist-card-type">Artista</span>
        </div>`).join('');
};

function formatArtistString(artistIds, collabType) {
    if (!artistIds || artistIds.length === 0) return "Artista Desconhecido";
    const artistNames = artistIds.map(id => { const artist = db.artists.find(art => art.id === id); return artist ? artist.name : "Artista Desconhecido"; });
    const mainArtist = artistNames[0]; if (artistNames.length === 1) return mainArtist; 
    const otherArtists = artistNames.slice(1).join(', ');
    if (collabType === 'Dueto/Grupo') return `${mainArtist} & ${otherArtists}`; else return `${mainArtist} (feat. ${otherArtists})`;
}

function getCoverUrl(parentReleaseId) {
    if (!parentReleaseId) return 'https://i.imgur.com/AD3MbBi.png'; 
    const release = [...db.albums, ...db.singles].find(r => r.id === parentReleaseId);
    return release ? release.imageUrl : 'https://i.imgur.com/AD3MbBi.png'; 
}

const renderChart = (type) => {
    let containerId, dataList, previousData; const now = new Date(); 
    if (type === 'music') {
        containerId = 'musicChartsList';
        dataList = [...db.songs].filter(song => (song.streams || 0) > 0 && song.parentReleaseDate && new Date(song.parentReleaseDate) <= now).sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50); 
        previousData = previousMusicChartData;
    } else if (type === 'album') {
        containerId = 'albumChartsList';
        // FIX: Usa 'calculatedStreams' derivados da soma das faixas, em vez de depender do DB que não atualiza
        dataList = [...db.albums, ...db.singles].map(item => {
            const albumTracks = db.songs.filter(s => (s.albumIds && s.albumIds.includes(item.id)) || (s.singleIds && s.singleIds.includes(item.id)));
            const currentStreams = albumTracks.reduce((sum, song) => sum + (song.streams || 0), 0);
            const totalStreams = albumTracks.reduce((sum, song) => sum + (song.totalStreams || 0), 0);
            return { ...item, calculatedStreams: currentStreams, calculatedTotalStreams: totalStreams };
        }).filter(item => item.calculatedStreams > 0 && item.releaseDate && new Date(item.releaseDate) <= now)
          .sort((a, b) => b.calculatedStreams - a.calculatedStreams).slice(0, 50); 
        previousData = previousAlbumChartData;
    } else { return; }

    const container = document.getElementById(containerId); if (!container) return;
    if (!dataList || dataList.length === 0) { container.innerHTML = `<p class="empty-state">Nenhum item no chart no momento.</p>`; return; }

    container.innerHTML = dataList.map((item, index) => {
        const currentRank = index + 1; const previousRank = previousData[item.id]; 
        let iconClass = 'fa-minus'; let trendClass = 'trend-stable';

        if (previousRank === undefined) { trendClass = 'trend-new'; } 
        else if (currentRank < previousRank) { iconClass = 'fa-caret-up'; trendClass = 'trend-up'; } 
        else if (currentRank > previousRank) { iconClass = 'fa-caret-down'; trendClass = 'trend-down'; }
        
        const indicatorHtml = `<span class="chart-rank-indicator ${trendClass}"><i class="fas ${iconClass}"></i></span>`;

        if (type === 'music') {
            const artistName = formatArtistString(item.artistIds, item.collabType);
            const cover = item.cover !== 'https://i.imgur.com/AD3MbBi.png' ? item.cover : getCoverUrl(item.albumId);
            const dailyStreams = (item.streams || 0).toLocaleString('pt-BR');
            const totalStreams = (item.totalStreams || 0).toLocaleString('pt-BR');
            
            return `
                <div class="chart-item" data-song-id="${item.id}">
                    ${indicatorHtml}
                    <span class="chart-rank">${currentRank}</span>
                    <img src="${cover}" alt="${item.title}" class="chart-item-img">
                    <div class="chart-item-info">
                        <span class="chart-item-title">${item.title}</span>
                        <span class="chart-item-artist">${item.artist }</span>
                    </div>
                    <div style="text-align: right; font-variant-numeric: tabular-nums;">
                        <div style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${dailyStreams}</div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${totalStreams} totais</div>
                    </div>
                </div>`;
        } else { 
            // FIX: Lê as variáveis "calculated" que acabamos de montar
            const dailyStreams = (item.calculatedStreams || 0).toLocaleString('pt-BR');
            const totalStreams = (item.calculatedTotalStreams || 0).toLocaleString('pt-BR');
            
            return `
                <div class="chart-item" data-album-id="${item.id}">
                      ${indicatorHtml}
                    <span class="chart-rank">${currentRank}</span>
                    <img src="${item.imageUrl}" alt="${item.title}" class="chart-item-img">
                    <div class="chart-item-info">
                        <span class="chart-item-title">${item.title}</span>
                        <span class="chart-item-artist">${item.artist}</span>
                    </div>
                    <div style="text-align: right; font-variant-numeric: tabular-nums;">
                        <div style="font-size: 14px; font-weight: 600; color: var(--text-primary);">${dailyStreams}</div>
                        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${totalStreams} totais</div>
                    </div>
                </div>`;
        }
    }).join('');
};

const openArtistDetail = (artistName) => {
    const artist = db.artists.find(a => a.name === artistName); if (!artist) { handleBack(); return; }
    activeArtist = artist; document.getElementById('detailBg').style.backgroundImage = `url(${artist.img})`; document.getElementById('detailBg').style.backgroundPosition = `center ${artist.bgPos}`; document.getElementById('detailName').textContent = artist.name;
    const now = new Date();
    const popularSongs = [...db.songs].filter(s => s.artistIds && s.artistIds.includes(artist.id) && (s.totalStreams || 0) > 0 && s.parentReleaseDate && new Date(s.parentReleaseDate) <= now).sort((a, b) => (b.totalStreams || 0) - (a.totalStreams || 0)).slice(0, 5);
    const popularContainer = document.getElementById('popularSongsList');
    if (popularSongs.length > 0) {
        popularContainer.innerHTML = popularSongs.map((song, index) => `
            <div class="song-row available" data-song-id="${song.id}">
                <span class="track-number">${index + 1}</span>
                <div class="song-row-info">
                    <img src="${song.cover || getCoverUrl(song.albumId)}" alt="${song.title}" class="song-row-cover">
                    <span class="song-row-title">${song.title}</span>
                </div>
                <span class="song-streams">${(song.totalStreams || 0).toLocaleString('pt-BR')}</span>
            </div>
        `).join('');
    } else { popularContainer.innerHTML = '<p class="empty-state-small">Nenhuma música popular lançada encontrada.</p>'; }

    const nowSort = new Date();
    const customSort = (a, b) => {
        const dateA = new Date(a.releaseDate), dateB = new Date(b.releaseDate), isAFuture = dateA > nowSort, isBFuture = dateB > nowSort;
        if (isAFuture && isBFuture) { if (dateA.getTime() !== dateB.getTime()) return dateA - dateB; } else if (isAFuture) return -1; else if (isBFuture) return 1; else { if (dateA.getTime() !== dateB.getTime()) return dateB - dateA; }
        const aIsDeluxe = a.title.toLowerCase().includes('deluxe'), bIsDeluxe = b.title.toLowerCase().includes('deluxe');
        if (aIsDeluxe && !bIsDeluxe) return -1; else if (!aIsDeluxe && bIsDeluxe) return 1; return a.title.localeCompare(b.title); 
    };

    const albumsContainer = document.getElementById('albumsList'); const sortedAlbums = (artist.albums || []).sort(customSort);
    albumsContainer.innerHTML = sortedAlbums.map(album => `<div class="scroll-item" data-album-id="${album.id}"><img src="${album.imageUrl}" alt="${album.title}"><p>${album.title}</p><span>${new Date(album.releaseDate).getFullYear()}</span></div>`).join('') || '<p class="empty-state-small">Nenhum álbum encontrado.</p>';
    const singlesContainer = document.getElementById('singlesList'); const sortedSingles = (artist.singles || []).sort(customSort);
    singlesContainer.innerHTML = sortedSingles.map(single => `<div class="scroll-item" data-album-id="${single.id}"><img src="${single.imageUrl}" alt="${single.title}"><p>${single.title}</p><span>${new Date(single.releaseDate).getFullYear()}</span></div>`).join('') || '<p class="empty-state-small">Nenhum single ou EP encontrado.</p>';
    const recommended = [...db.artists].filter(a => a.id !== artist.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    renderArtistsGrid('recommendedGrid', recommended); switchView('artistDetail');
};

const openAlbumDetail = (albumId) => {
    const album = [...db.albums, ...db.singles].find(a => a.id === albumId); if (!album) { handleBack(); return; }
    const albumDetailView = document.getElementById('albumDetail'); if (albumDetailView) albumDetailView.dataset.albumId = albumId;
    if (albumCountdownInterval) { clearInterval(albumCountdownInterval); albumCountdownInterval = null; }

    const countdownContainer = document.getElementById('albumCountdownContainer'), normalInfoContainer = document.getElementById('albumNormalInfoContainer'), tracklistContainer = document.getElementById('albumTracklist');
    document.getElementById('albumDetailBg').style.backgroundImage = `url(${album.imageUrl})`; document.getElementById('albumDetailCover').src = album.imageUrl; document.getElementById('albumDetailTitle').textContent = album.title;

    // === CÁLCULO DINÂMICO PARA ÁLBUM / EP / SINGLE ===
    let displayType = 'Álbum';
    if (album.type === 'single' || album.tableName === 'singles') {
        const numTracks = album.tracks ? album.tracks.length : 0;
        displayType = (numTracks >= 4) ? 'EP' : 'Single';
    }
    const typeLabelEl = document.querySelector('#albumDetail .album-type-label');
    if (typeLabelEl) typeLabelEl.textContent = displayType;
    // =================================================

    const releaseDate = new Date(album.releaseDate), now = new Date(), isPreRelease = releaseDate > now, artistObj = db.artists.find(a => a.id === album.artistId);
    if (isPreRelease) {
        normalInfoContainer?.classList.add('hidden'); countdownContainer?.classList.remove('hidden');
        const releaseDateStr = releaseDate.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        document.getElementById('albumCountdownReleaseDate').textContent = releaseDateStr; startAlbumCountdown(album.releaseDate, 'albumCountdownTimer');
        tracklistContainer.innerHTML = (album.tracks || []).map(track => {
            const fullSong = db.songs.find(s => s.id === track.id); let isAvailable = false; const preReleaseAvailableTypes = ['Title Track', 'Pre-release Single'];
            if (fullSong) { const hasSongReleased = fullSong.parentReleaseDate && new Date(fullSong.parentReleaseDate) <= now; const isDesignatedPreRelease = preReleaseAvailableTypes.includes(fullSong.trackType); isAvailable = hasSongReleased || isDesignatedPreRelease; }
            const artistName = formatArtistString(track.artistIds, track.collabType), trackNumDisplay = track.trackNumber ? track.trackNumber : '?';
            if (isAvailable) { return `<div class="track-row available" data-song-id="${track.id}"><span class="track-number">${trackNumDisplay}</span><div class="track-info"><span class="track-title">${track.title}</span><span class="track-artist-feat">${artistName}</span></div><span class="track-duration">${track.duration}</span></div>`; } 
            else { return `<div class="track-row unavailable"><span class="track-number">${trackNumDisplay}</span><div class="track-info"><span class="track-title">${track.title}</span><span class="track-artist-feat">${artistName}</span></div><span class="track-duration"><i class="fas fa-lock"></i></span></div>`; }
        }).join('') || '<p class="empty-state-small">Tracklist ainda não revelada.</p>';
    } else {
        normalInfoContainer?.classList.remove('hidden'); countdownContainer?.classList.add('hidden');
        const releaseYear = releaseDate.getFullYear(), totalAlbumStreamsFormatted = (album.totalStreams || 0).toLocaleString('pt-BR');
        document.getElementById('albumDetailInfo').innerHTML = `Por <strong class="artist-link" data-artist-name="${artistObj ? artistObj.name : ''}">${album.artist}</strong> • ${releaseYear} • ${totalAlbumStreamsFormatted} streams totais`;
        tracklistContainer.innerHTML = (album.tracks || []).map(song => {
            const artistName = formatArtistString(song.artistIds, song.collabType), streams = (song.totalStreams || 0), trackNumDisplay = song.trackNumber ? song.trackNumber : '?';
            return `<div class="track-row available" data-song-id="${song.id}"><span class="track-number">${trackNumDisplay}</span><div class="track-info"><span class="track-title">${song.title}</span><span class="track-artist-feat">${artistName}</span></div><span class="track-duration">${streams.toLocaleString('pt-BR')}</span></div>`;
        }).join('') || '<p class="empty-state-small">Nenhuma faixa encontrada para este lançamento.</p>'; 
    }
    switchView('albumDetail');
};

const openDiscographyDetail = (type) => {
    if (!activeArtist) { handleBack(); return; }
    const nowSort = new Date(), customSort = (a, b) => { const dateA = new Date(a.releaseDate), dateB = new Date(b.releaseDate), isAFuture = dateA > nowSort, isBFuture = dateB > nowSort; if (isAFuture && isBFuture) { return dateA - dateB; } else if (isAFuture) { return -1; } else if (isBFuture) { return 1; } else { return dateB - dateA; } };
    const data = (type === 'albums') ? (activeArtist.albums || []).sort(customSort) : (activeArtist.singles || []).sort(customSort);
    const title = (type === 'albums') ? `Álbuns de ${activeArtist.name}` : `Singles & EPs de ${activeArtist.name}`;
    document.getElementById('discographyTypeTitle').textContent = title;
    const grid = document.getElementById('discographyGrid');
    grid.innerHTML = data.map(item => `
        <div class="artist-card" data-album-id="${item.id}">
            <img src="${item.imageUrl}" alt="${item.title}" class="artist-card-img" style="border-radius:4px;">
            <p class="artist-card-name">${item.title}</p>
            <span class="artist-card-type">${new Date(item.releaseDate).getFullYear()}</span>
        </div>
    `).join('') || '<p class="empty-state">Nenhum lançamento encontrado.</p>'; 
    switchView('discographyDetail');
};

const handleSearch = () => {
    const query = searchInput.value.toLowerCase().trim(); if (!query) { switchTab(null, 'homeSection'); return; }
    const resultsContainer = document.getElementById('searchResults'), noResultsElement = document.getElementById('noResults'); if (!resultsContainer || !noResultsElement) return;
    const filteredArtists = db.artists.filter(a => a.name.toLowerCase().includes(query)), filteredAlbums = [...db.albums, ...db.singles].filter(a => a.title.toLowerCase().includes(query));
    let html = '', resultCount = 0;
    if (filteredArtists.length > 0) {
        html += '<h3 class="section-title" style="grid-column: 1/-1;">Artistas</h3>';
        html += filteredArtists.map(a => { resultCount++; return `<div class="artist-card" data-artist-name="${a.name}"><img src="${a.img}" alt="${a.name}" class="artist-card-img" style="object-position: center ${a.bgPos};"><p class="artist-card-name">${a.name}</p><span class="artist-card-type">Artista</span></div>`; }).join('');
    }
    if (filteredAlbums.length > 0) {
        html += '<h3 class="section-title" style="grid-column: 1/-1; margin-top:24px;">Álbuns & Singles</h3>';
        html += filteredAlbums.map(al => { resultCount++; return `<div class="artist-card" data-album-id="${al.id}"><img src="${al.imageUrl}" alt="${al.title}" class="artist-card-img" style="border-radius:4px;"><p class="artist-card-name">${al.title}</p><span class="artist-card-type">${al.artist}</span></div>`; }).join('');
    }
    resultsContainer.innerHTML = html;
    if (resultCount > 0) { noResultsElement.classList.add('hidden'); resultsContainer.classList.remove('hidden'); } else { noResultsElement.classList.remove('hidden'); resultsContainer.classList.add('hidden'); }
    switchTab(null, 'searchSection');
};
