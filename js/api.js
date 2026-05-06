// js/api.js

if (window.supabase && SUPABASE_URL.startsWith('http')) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function uploadImageToImgbb(file) {
    const formData = new FormData(); formData.append('image', file);
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Falha no upload da imagem');
    const data = await response.json(); return data.data.url;
}

const parsePgArray = (arr) => {
    if (Array.isArray(arr)) return arr;
    if (typeof arr === 'string') return arr.replace(/^{|}$/g, '').split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    return [];
};

async function loadAllData() {
    if (!supabaseClient && window.supabase && SUPABASE_URL.startsWith('http')) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    if (!supabaseClient) { console.error("Supabase fail."); return null; }

    try {
        const [artistsRes, albumsRes, songsRes, singlesRes, playersRes] = await Promise.all([
            supabaseClient.from('artists').select('*'),
            supabaseClient.from('albums').select('*'),
            supabaseClient.from('songs').select('*'),
            supabaseClient.from('singles').select('*'),
            supabaseClient.from('players').select('*')
        ]);
        if (artistsRes.error) throw artistsRes.error;

        const musicasMap = new Map();
        (songsRes.data || []).forEach(row => {
            const albumIds = parsePgArray(row.album_ids), singleIds = parsePgArray(row.single_ids), artistIds = parsePgArray(row.artist_ids);
            const parentReleaseId = (albumIds.length > 0) ? albumIds[0] : (singleIds.length > 0 ? singleIds[0] : null);
            musicasMap.set(row.id, {
                id: row.id, title: row.title || 'Faixa Desconhecida', duration: row.duration_seconds ? new Date(row.duration_seconds * 1000).toISOString().substr(14, 5) : "0:00",
                trackNumber: row.track_number || 0, durationSeconds: row.duration_seconds || 0, artistIds: artistIds, collabType: row.collab_type,
                albumId: parentReleaseId, albumIds: albumIds, singleIds: singleIds, streams: row.streams || 0, totalStreams: row.total_streams || 0, trackType: row.track_type || 'B-side'
            });
        });

        const artistsMapById = new Map();
        const artistsList = (artistsRes.data || []).map(row => {
            let rawUrl = row.image_url || 'https://i.imgur.com/AD3MbBi.png', cleanUrl = rawUrl, bgPos = '20';
            if (rawUrl.includes('#pos=')) [cleanUrl, bgPos] = rawUrl.split('#pos=');
            const artist = {
                id: row.id, name: row.name || 'Artista Desconhecido', img: cleanUrl, rawUrl: rawUrl, bgPos: bgPos + '%',
                RPGPoints: row.rpg_points || 0, LastActive: row.last_active || null, personalPoints: row.personal_points || 150 
            };
            for (const key in ACTION_CONFIG) { const config = ACTION_CONFIG[key]; artist[config.localCountKey] = row[config.localCountKey] || 0; artist[config.bonusLocalKey] = row[config.bonusLocalKey] || false; }
            artistsMapById.set(artist.id, artist.name); return artist;
        });

        const formatReleases = (records, isAlbum) => {
            if (!records) return [];
            return records.map(row => {
                const tracks = Array.from(musicasMap.values()).filter(song => (isAlbum ? song.albumIds.includes(row.id) : song.singleIds.includes(row.id))).sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0)); 
                const totalDuration = tracks.reduce((sum, track) => sum + (track.durationSeconds || 0), 0);
                const totalAlbumStreams = tracks.reduce((sum, track) => sum + (track.totalStreams || 0), 0);
                return {
                    id: row.id, title: row.title || 'Título Desconhecido', artist: row.artist_id ? artistsMapById.get(row.artist_id) : "Artista Desconhecido", artistId: row.artist_id,
                    imageUrl: row.image_url || 'https://i.imgur.com/AD3MbBi.png', releaseDate: row.release_date, isDeluxe: row.is_deluxe || false, tracks: tracks, trackIds: tracks.map(t => t.id),
                    totalDurationSeconds: totalDuration, weeklyStreams: row.weekly_streams || 0, totalStreams: totalAlbumStreams, type: isAlbum ? 'album' : 'single', tableName: isAlbum ? 'albums' : 'singles'
                };
            });
        };

        return {
            allArtists: artistsList, albums: formatReleases(albumsRes.data, true), singles: formatReleases(singlesRes.data, false),
            players: (playersRes.data || []).map(row => ({ id: row.id, name: row.name, password: row.password, artists: parsePgArray(row.artist_ids) })),
            musicas: Array.from(musicasMap.values()) 
        };
    } catch (error) { console.error("Falha ao carregar dados do Supabase:", error); return null; }
}

const mapTable = (t) => { if(t === 'Músicas') return 'songs'; if(t === 'Álbuns') return 'albums'; if(t === 'Singles e EPs') return 'singles'; return t; };

const mapFieldsToSupabase = (tableName, fields) => {
    const payload = {};
    if(fields['Nome do Álbum'] || fields['Nome do Single/EP']) payload.title = fields['Nome do Álbum'] || fields['Nome do Single/EP'];
    if(fields['Nome da Faixa']) payload.title = fields['Nome da Faixa'];
    if (tableName === 'Músicas') { if(fields['Artista']) payload.artist_ids = Array.isArray(fields['Artista']) ? fields['Artista'] : [fields['Artista']]; } 
    else { if(fields['Artista']) payload.artist_id = Array.isArray(fields['Artista']) ? fields['Artista'][0] : fields['Artista']; }
    if(fields['Capa do Álbum'] || fields['Capa']) payload.image_url = (fields['Capa do Álbum'] || fields['Capa'])[0].url;
    if(fields['Data de Lançamento']) payload.release_date = fields['Data de Lançamento'];
    if(fields['Duração']) payload.duration_seconds = fields['Duração'];
    if(fields['Nº da Faixa']) payload.track_number = fields['Nº da Faixa'];
    if(fields['Tipo de Faixa']) payload.track_type = fields['Tipo de Faixa'];
    if(fields['Tipo de Colaboração']) payload.collab_type = fields['Tipo de Colaboração'];
    if(fields['Álbuns']) payload.album_ids = fields['Álbuns'];
    if(fields['Singles e EPs']) payload.single_ids = fields['Singles e EPs'];
    if(fields['É deluxe?'] !== undefined) payload.is_deluxe = fields['É deluxe?'];
    if(fields['current_rank'] !== undefined) payload.current_rank = fields['current_rank'];
    if(fields['previous_rank'] !== undefined) payload.previous_rank = fields['previous_rank'];
    if(fields['peak_rank'] !== undefined) payload.peak_rank = fields['peak_rank'];
    return payload;
};

async function createAirtableRecord(tableName, fields) { const { data, error } = await supabaseClient.from(mapTable(tableName)).insert([mapFieldsToSupabase(tableName, fields)]).select(); if (error) throw error; return { id: data[0].id }; }
async function batchCreateAirtableRecords(tableName, recordsFields) { const { data, error } = await supabaseClient.from(mapTable(tableName)).insert(recordsFields.map(f => mapFieldsToSupabase(tableName, f))).select(); if (error) throw error; return data; }
async function updateAirtableRecord(tableName, recordId, fields) { const { data, error } = await supabaseClient.from(mapTable(tableName)).update(mapFieldsToSupabase(tableName, fields)).eq('id', recordId).select(); if (error) throw error; return { id: data[0].id }; }
async function batchUpdateAirtableRecords(tableName, recordsToUpdate) {
    const table = mapTable(tableName); const promises = recordsToUpdate.map(rec => supabaseClient.from(table).update(mapFieldsToSupabase(tableName, rec.fields)).eq('id', rec.id).select());
    const results = await Promise.all(promises); return results.map(r => r.data ? r.data[0] : null);
}
async function deleteAirtableRecord(tableName, recordId) { const { error } = await supabaseClient.from(mapTable(tableName)).delete().eq('id', recordId); if (error) throw error; return { deleted: true, id: recordId }; }
async function batchDeleteAirtableRecords(tableName, recordIds) { const { error } = await supabaseClient.from(mapTable(tableName)).delete().in('id', recordIds); if (error) return { success: false, results: [] }; return { success: true, results: recordIds.map(id => ({id: id, deleted: true})) }; }

const initializeData = (data) => {
    try {
        try {
            const prevMusic = localStorage.getItem(PREVIOUS_MUSIC_CHART_KEY); previousMusicChartData = prevMusic ? JSON.parse(prevMusic) : {};
            const prevAlbum = localStorage.getItem(PREVIOUS_ALBUM_CHART_KEY); previousAlbumChartData = prevAlbum ? JSON.parse(prevAlbum) : {};
            const prevRpg = localStorage.getItem(PREVIOUS_RPG_CHART_KEY); previousRpgChartData = prevRpg ? JSON.parse(prevRpg) : {};
        } catch (e) { previousMusicChartData = {}; previousAlbumChartData = {}; previousRpgChartData = {}; }

        const artistsMapById = new Map();
        db.artists = (data.allArtists || []).map(artist => {
            const artistEntry = { ...artist, albums: [], singles: [], careerTotalStreams: 0 };
            artistsMapById.set(artist.id, artist.name); return artistEntry;
        });

        const releaseDateMap = new Map();
        [...(data.albums || []), ...(data.singles || [])].forEach(item => { if (item.id && item.releaseDate) releaseDateMap.set(item.id, item.releaseDate); });

        db.songs = (data.musicas || []).map(song => {
            const allLinkedIds = [...(song.albumIds || []), ...(song.singleIds || [])]; let earliestDate = null;
            if (allLinkedIds.length > 0) {
                const validDates = allLinkedIds.map(id => releaseDateMap.get(id)).filter(Boolean).map(dateStr => new Date(dateStr)).filter(d => !isNaN(d.getTime()));
                if (validDates.length > 0) earliestDate = new Date(Math.min.apply(null, validDates));
            }
            return { ...song, streams: song.streams || 0, totalStreams: song.totalStreams || 0, cover: 'https://i.imgur.com/AD3MbBi.png', artist: artistsMapById.get((song.artistIds || [])[0]) || 'Artista Desconhecido', parentReleaseDate: earliestDate ? earliestDate.toISOString() : null };
        });

        db.albums = []; db.singles = [];
        [...(data.albums || []), ...(data.singles || [])].forEach(item => {
            const involvedArtistIds = new Set([item.artistId]); 
            (item.trackIds || []).forEach(trackId => {
                const songInDb = db.songs.find(sDb => sDb.id === trackId);
                if (songInDb) {
                    if (songInDb.artistIds) songInDb.artistIds.forEach(id => involvedArtistIds.add(id));
                    if (songInDb.albumId === item.id && songInDb.cover === 'https://i.imgur.com/AD3MbBi.png') songInDb.cover = item.imageUrl;
                    else if (!songInDb.albumId) { if (songInDb.cover === 'https://i.imgur.com/AD3MbBi.png') songInDb.cover = item.imageUrl; songInDb.albumId = item.id; }
                    if (!songInDb.parentReleaseDate && item.releaseDate) songInDb.parentReleaseDate = item.releaseDate;
                }
            });

            if (item.type === 'album') db.albums.push(item); else db.singles.push(item);
            involvedArtistIds.forEach(aId => {
                const artistEntry = db.artists.find(a => a.id === aId);
                if (artistEntry) {
                    if (item.type === 'album') { if (!artistEntry.albums.some(a => a.id === item.id)) artistEntry.albums.push(item); } 
                    else { if (!artistEntry.singles.some(a => a.id === item.id)) artistEntry.singles.push(item); }
                }
            });
        });

        db.artists.forEach(artist => {
            const artistSongs = db.songs.filter(song => song.artistIds && song.artistIds.includes(artist.id));
            artist.careerTotalStreams = artistSongs.reduce((sum, song) => sum + (song.totalStreams || 0), 0);
        });
        db.players = data.players || []; window.db = db; return true; 
    } catch (error) { console.error("ERRO CRÍTICO durante initializeData:", error); return false; }
};
