// js/rpg.js

const computeChartData = (artistsArray) => {
    if (!artistsArray) return [];
    const artistsWithPopularity = artistsArray.map(artist => {
        const totalStreams = artist.careerTotalStreams || 0, personalPoints = artist.personalPoints || 150; 
        const basePoints = totalStreams / 1000000, pointsModifier = personalPoints / 100, finalScore = Math.floor(basePoints * pointsModifier); 
        return { id: artist.id, name: artist.name, img: artist.img, popularity: finalScore };
    });
    return artistsWithPopularity.sort((a, b) => b.popularity - a.popularity).slice(0, 20);
};

function renderRPGChart() {
    const chartData = computeChartData(db.artists); const container = document.getElementById('artistsGrid'); const previousData = previousRpgChartData;
    if (!container) return; if (chartData.length === 0) { container.innerHTML = '<p class="empty-state">Nenhum artista no chart RPG no momento.</p>'; return; }

   container.innerHTML = chartData.map((artist, index) => {
            const currentRank = index + 1; const previousRank = previousData[artist.id];
            let iconClass = 'fa-minus'; let trendClass = 'trend-stable';

            if (previousRank === undefined) { trendClass = 'trend-new'; } 
            else if (currentRank < previousRank) { iconClass = 'fa-caret-up'; trendClass = 'trend-up'; } 
            else if (currentRank > previousRank) { iconClass = 'fa-caret-down'; trendClass = 'trend-down'; }

            const displayPoints = artist.popularity;
            return `
            <div class="artist-card" data-artist-name="${artist.name}" style="position:relative;">
                <span class="chart-rank-indicator rpg-indicator ${trendClass}" style="position:absolute; top:16px; right:16px; background:rgba(0,0,0,0.5); padding:4px; border-radius:50%;">
                    <i class="fas ${iconClass}"></i>
                </span>
                <span style="position:absolute; top:16px; left:16px; font-weight:900; text-shadow:0 2px 4px rgba(0,0,0,0.8); font-size:18px;">#${currentRank}</span>
                <img src="${artist.img}" alt="${artist.name}" class="artist-card-img" style="object-position: center ${artist.bgPos};">
                <p class="artist-card-name">${artist.name}</p>
                <span class="artist-card-type">${displayPoints.toLocaleString('pt-BR')} pontos</span>
            </div>`;
    }).join(''); 
}

const saveChartDataToLocalStorage = (chartType) => {
    let currentChartData, storageKey, dataList; const now = new Date(); 
    if (chartType === 'music') {
        storageKey = PREVIOUS_MUSIC_CHART_KEY;
        dataList = [...db.songs].filter(song => (song.streams || 0) > 0 && song.parentReleaseDate && new Date(song.parentReleaseDate) <= now).sort((a, b) => (b.streams || 0) - (a.streams || 0)).slice(0, 50);
        currentChartData = dataList.reduce((acc, item, index) => { acc[item.id] = index + 1; return acc; }, {}); previousMusicChartData = currentChartData; 
    } else if (chartType === 'album') {
        storageKey = PREVIOUS_ALBUM_CHART_KEY;
        dataList = [...db.albums, ...db.singles].filter(item => (item.weeklyStreams || 0) > 0 && item.releaseDate && new Date(item.releaseDate) <= now).sort((a, b) => (b.weeklyStreams || 0) - (a.weeklyStreams || 0)).slice(0, 50);
        currentChartData = dataList.reduce((acc, item, index) => { acc[item.id] = index + 1; return acc; }, {}); previousAlbumChartData = currentChartData; 
    } else if (chartType === 'rpg') {
        storageKey = PREVIOUS_RPG_CHART_KEY; dataList = computeChartData(db.artists); 
        currentChartData = dataList.reduce((acc, item, index) => { acc[item.id] = index + 1; return acc; }, {}); previousRpgChartData = currentChartData; 
    } else { return; }
    try { localStorage.setItem(storageKey, JSON.stringify(currentChartData)); } catch (e) {}
};

async function processDatabaseChartUpdate(chartType) {
    saveChartDataToLocalStorage(chartType);
}

const setupCountdown = (timerId, chartType) => {
    const timerElement = document.getElementById(timerId); if (!timerElement) return;
    const calculateTargetDate = () => {
        const now = new Date(); const target = new Date(now);
        if (chartType === 'rpg') { target.setUTCDate(now.getUTCDate() + 1); target.setUTCHours(0, 0, 0, 0); } 
        else {
            let daysUntilMonday = (1 - now.getDay() + 7) % 7;
            if (daysUntilMonday === 0 && (now.getUTCHours() > 0 || now.getUTCMinutes() > 0 || now.getUTCSeconds() > 0)) daysUntilMonday = 7;
            target.setUTCDate(now.getUTCDate() + daysUntilMonday); target.setUTCHours(0, 0, 0, 0);
        }
        return target;
    };

    let targetDate = calculateTargetDate();

    const updateTimerDisplay = (distance) => {
        if (distance < 0) { timerElement.textContent = `Atualizando...`; return; }
        const days = Math.floor(distance / (1000 * 60 * 60 * 24)), hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)), seconds = Math.floor((distance % (1000 * 60)) / 1000), format = (num) => (num < 10 ? '0' + num : num);
        if (chartType === 'rpg') timerElement.textContent = `${format(hours)}h ${format(minutes)}m ${format(seconds)}s`;
        else timerElement.textContent = `${format(days)}d ${format(hours)}h ${format(minutes)}m ${format(seconds)}s`;
    };

    setInterval(() => {
        const distance = targetDate.getTime() - new Date().getTime();
        if (distance < 0) {
            processDatabaseChartUpdate(chartType);
            targetDate = calculateTargetDate();
            if (chartType === 'music') renderChart('music'); else if (chartType === 'album') renderChart('album'); else if (chartType === 'rpg') renderRPGChart();
            updateTimerDisplay(targetDate.getTime() - new Date().getTime()); return;
        }
        updateTimerDisplay(distance);
    }, 1000);
    updateTimerDisplay(targetDate.getTime() - new Date().getTime());
};

async function handleConfirmAction() {
    const actionType = actionTypeSelect.value; if (!actionType) { showToast("Selecione um tipo de ação.", 'error'); return; }
    if (IMAGE_ACTION_CONFIG[actionType]) { await handleImageAction(actionType); } else if (ACTION_CONFIG[actionType]) { await handlePromotionAction(actionType); } else { showToast("Tipo de ação desconhecido.", 'error'); }
}

async function handleImageAction(actionType) {
    const artistId = modalArtistId.value, artist = db.artists.find(a => a.id === artistId), config = IMAGE_ACTION_CONFIG[actionType];
    if (!artist || !config) { showToast("Erro: Artista ou configuração não encontrados.", 'error'); return; }
    confirmActionButton.disabled = true; confirmActionButton.textContent = 'Processando...';

    let pointsChange = 0; let message = ""; const actionName = actionTypeSelect.options[actionTypeSelect.selectedIndex].text;
    if (Math.random() < 0.7) { pointsChange = getRandomInt(config.gain.min, config.gain.max); message = `📈 Sucesso! Sua imagem melhorou! Você ganhou +${pointsChange} pontos pessoais.`; } 
    else { pointsChange = -getRandomInt(config.loss.min, config.loss.max); message = `📉 Fracasso... Sua imagem foi manchada! Você perdeu ${Math.abs(pointsChange)} pontos pessoais.`; }

    const currentPoints = artist.personalPoints || 150; const newPoints = Math.max(0, currentPoints + pointsChange);
    try {
        const { error } = await supabaseClient.from('artists').update({ personal_points: newPoints }).eq('id', artistId);
        if (error) throw error;
        artist.personalPoints = newPoints; displayArtistActions(); 
        showToast(`Ação de Imagem Concluída!\n${message}`, 'success'); actionModal.classList.add('hidden');
    } catch (err) { console.error('Erro ao salvar pontos pessoais:', err); showToast(`Erro ao salvar ação: ${err.message}`, 'error'); } 
    finally { confirmActionButton.disabled = false; confirmActionButton.textContent = 'Confirmar Ação'; }
}

async function handlePromotionAction(actionType) {
    const artistId = modalArtistId.value, trackId = trackSelect.value, selectedReleaseId = releaseSelect.value;
    if (!artistId || !trackId || !actionType || !selectedReleaseId) { showToast("Selecione os dados corretamente.", 'error'); return; }

    const artist = db.artists.find(a => a.id === artistId), selectedTrack = db.songs.find(t => t.id === trackId), config = ACTION_CONFIG[actionType];
    if (!artist || !selectedTrack || !config) { showToast("Erro: Dados inválidos (artista, faixa ou config).", 'error'); return; }

    const isMain = selectedTrack.artistIds[0] === artistId || selectedTrack.collabType === 'Dueto/Grupo'; let limit = (config.limit === 5) ? 5 : (isMain ? config.limit : 5); const currentCount = artist[config.localCountKey] || 0;

    if (currentCount >= limit) { showToast("Limite de uso atingido.", 'error'); return; }
    confirmActionButton.disabled = true; confirmActionButton.textContent = 'Processando...';

    let streamsToAdd = 0; let eventMessage = null; const bonusLocalKey = config.bonusLocalKey; const hasClaimedBonus = artist[bonusLocalKey] || false;
    const jackpotCheck = Math.random(); const eventCheck = Math.random();  const newCount = currentCount + 1;
    const artistUpdates = {}; artistUpdates[config.localCountKey] = newCount;

    if (!hasClaimedBonus && jackpotCheck < 0.01) { streamsToAdd = 200000; eventMessage = "🎉 JACKPOT! Você viralizou inesperadamente e ganhou +200k streams! (Bônus de categoria único)"; artistUpdates[bonusLocalKey] = true; artist[bonusLocalKey] = true; } 
    else if (eventCheck < 0.05) { const bonus = getRandomBonus(); streamsToAdd = bonus.value; eventMessage = `✨ BÔNUS! ${bonus.message}`; } 
    else if (eventCheck >= 0.05 && eventCheck < 0.10) { const punishment = getRandomPunishment(); streamsToAdd = punishment.value; eventMessage = `📉 PUNIÇÃO! ${punishment.message}`; } 
    else { streamsToAdd = getRandomInt(config.minStreams, config.maxStreams); }
    
    const personalPoints = artist.personalPoints || 150; let pointsMultiplier = 1.0; let pointsMessage = "";
    if (personalPoints <= 50) { pointsMultiplier = 0.70; pointsMessage = ` (Status: Cancelado 70%)`; } else if (personalPoints <= 99) { pointsMultiplier = 0.90; pointsMessage = ` (Status: Flop 90%)`; } else if (personalPoints >= 500) { pointsMultiplier = 1.15; pointsMessage = ` (Status: Em Alta +15%)`; }
    if (streamsToAdd > 0) { streamsToAdd = Math.floor(streamsToAdd * pointsMultiplier); }

    const trackUpdatesLocal = []; const newASideStreams = Math.max(0, (selectedTrack.streams || 0) + streamsToAdd); const newASideTotalStreams = Math.max(0, (selectedTrack.totalStreams || 0) + streamsToAdd);
    trackUpdatesLocal.push({ id: selectedTrack.id, newStreams: newASideStreams, newTotalStreams: newASideTotalStreams });

    let totalDistributedGain = 0; let distributionDetails = [];
    if (config.isPromotion && streamsToAdd > 0 && isMain) {
        const allTracksInRelease = db.songs.filter(t => (t.albumIds && t.albumIds.includes(selectedReleaseId)) || (t.singleIds && t.singleIds.includes(selectedReleaseId)));
        const isLargeAlbum = allTracksInRelease.length > 30; const otherTracksInRelease = allTracksInRelease.filter(t => t.id !== selectedTrack.id);
        const bSideTypes = ['B-side']; const preReleaseTypes = ['Pre-release Single']; const minorTypes = ['Intro', 'Outro', 'Skit', 'Interlude'];

        otherTracksInRelease.forEach(otherTrack => {
            let gain = 0; let percentageUsed = 0; let maxPercentage = 0;
            if (otherTrack.isBonusTrack) { } else if (bSideTypes.includes(otherTrack.trackType)) { maxPercentage = 0.30; if (isLargeAlbum) maxPercentage = 0.15; } else if (minorTypes.includes(otherTrack.trackType)) { maxPercentage = 0.10; } else if (preReleaseTypes.includes(otherTrack.trackType)) { maxPercentage = 0.95; }
            if (maxPercentage > 0) { percentageUsed = getRandomFloat(0, maxPercentage); gain = Math.floor(streamsToAdd * percentageUsed); }
            if (gain > 0) {
                totalDistributedGain += gain; const newOtherStreams = (otherTrack.streams || 0) + gain; const newOtherTotalStreams = (otherTrack.totalStreams || 0) + gain;
                trackUpdatesLocal.push({ id: otherTrack.id, newStreams: newOtherStreams, newTotalStreams: newOtherTotalStreams, });
                let detailMsg = `   +${gain.toLocaleString('pt-BR')} para "${otherTrack.title}" (${(percentageUsed * 100).toFixed(1)}%)`; if (isLargeAlbum && bSideTypes.includes(otherTrack.trackType)) { detailMsg += " (Nerf Álbum Grande)"; }
                distributionDetails.push(detailMsg);
            }
        });
    }

    try {
        const { error: artistError } = await supabaseClient.from('artists').update(artistUpdates).eq('id', artistId); if (artistError) throw artistError;
        const updatePromises = trackUpdatesLocal.map(u => supabaseClient.from('songs').update({ streams: u.newStreams, total_streams: u.newTotalStreams }).eq('id', u.id) );
        await Promise.all(updatePromises);

        artist[config.localCountKey] = newCount;
        trackUpdatesLocal.forEach(update => { const trackInDb = db.songs.find(t => t.id === update.id); if (trackInDb) { trackInDb.streams = update.newStreams; trackInDb.totalStreams = update.newTotalStreams; } });

        let alertMessage = `Ação "${actionTypeSelect.options[actionTypeSelect.selectedIndex].text}" registrada!\n\n`;
        if (eventMessage) alertMessage += `${eventMessage}\n\n`;
        if (streamsToAdd >= 0) { alertMessage += `📈 Ganho Principal: +${streamsToAdd.toLocaleString('pt-BR')} streams para "${selectedTrack.title}"${pointsMessage}.\n\n`; } else { alertMessage += `📉 Perda Principal: ${streamsToAdd.toLocaleString('pt-BR')} streams para "${selectedTrack.title}".\n\n`; }
        if (totalDistributedGain > 0) { alertMessage += `✨ +${totalDistributedGain.toLocaleString('pt-BR')} streams distribuídos para outras faixas:\n`; alertMessage += distributionDetails.join('\n'); alertMessage += "\n\n"; }
        alertMessage += `📊 Uso da Ação: ${newCount}/${limit}`; if (!isMain && config.limit !== 5) { alertMessage += ` (Limite de 5 usos para participações "Feat.")`; }

        showToast(alertMessage, 'success'); actionModal.classList.add('hidden');
    } catch (err) { console.error('Erro ao tentar persistir ação de streams no Supabase:', err); showToast(`Erro ao salvar ação: ${err.message}`, 'error'); } 
    finally { confirmActionButton.disabled = false; confirmActionButton.textContent = 'Confirmar Ação'; updateActionLimitInfo(); }
}