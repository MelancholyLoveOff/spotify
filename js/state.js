// js/state.js

const SUPABASE_URL = 'https://avlgxwymwotffookkimg.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_9uhuy6fpFduf-qsEXYf5wA_BDBB1OIZ'; 
const IMGBB_API_KEY = '81f7ca81cf22d739de576bd1dac7dcc2';

const ACTION_CONFIG = {
    'promo_tv': { limit: 30, localCountKey: 'promo_tv_count', minStreams: 35000, maxStreams: 350000, isPromotion: true, bonusLocalKey: 'promo_tv_bonus_claimed' },
    'promo_radio': { limit: 30, localCountKey: 'promo_radio_count', minStreams: 20000, maxStreams: 50000, isPromotion: true, bonusLocalKey: 'promo_radio_bonus_claimed' },
    'promo_commercial': { limit: 30, localCountKey: 'promo_commercial_count', minStreams: 60000, maxStreams: 180000, isPromotion: true, bonusLocalKey: 'promo_commercial_bonus_claimed' },
    'promo_internet': { limit: 30, localCountKey: 'promo_internet_count', minStreams: 10000, maxStreams: 210000, isPromotion: true, bonusLocalKey: 'promo_internet_bonus_claimed' },
    'remix': { limit: 10, localCountKey: 'remix_count', minStreams: 60000, maxStreams: 450000, isPromotion: false, bonusLocalKey: 'remix_bonus_claimed' },
    'mv': { limit: 10, localCountKey: 'mv_count', minStreams: 60000, maxStreams: 450000, isPromotion: false, bonusLocalKey: 'mv_bonus_claimed' },
    'capas_alternativas': { limit: 10, localCountKey: 'capas_count', minStreams: 60000, maxStreams: 450000, isPromotion: false, bonusLocalKey: 'capas_bonus_claimed' },
    'parceria_marcas': { limit: 10, localCountKey: 'parceria_count', minStreams: 60000, maxStreams: 450000, isPromotion: false, bonusLocalKey: 'parceria_bonus_claimed' }
};

const IMAGE_ACTION_CONFIG = {
    'img_serie': { gain: { min: 1, max: 5 }, loss: { min: 1, max: 5 } },
    'img_novela': { gain: { min: 1, max: 3 }, loss: { min: 1, max: 2 } },
    'img_filme': { gain: { min: 1, max: 10 }, loss: { min: 1, max: 10 } },
    'img_programa_tv': { gain: { min: 1, max: 10 }, loss: { min: 1, max: 5 } },
    'img_revista': { gain: { min: 1, max: 3 }, loss: { min: 1, max: 1 } },
    'img_tiktok': { gain: { min: 1, max: 10 }, loss: { min: 1, max: 8 } }
};

const PUNISHMENT_CONFIG = [
    { message: "Vish! Seu single foi cancelado por conteúdo impróprio, você perdeu streams.", minLoss: 35000, maxLoss: 350000 },
    { message: "Problemas de direitos autorais! Sua faixa foi retirada das plataformas, você perdeu streams.", minLoss: 60000, maxLoss: 600000 },
    { message: "O público achou seu novo clipe constrangedor, você perdeu streams.", minLoss: 20000, maxLoss: 200000 },
    { message: "Sua música foi banida em alguns países, você perdeu streams.", minLoss: 50000, maxLoss: 500000 },
    { message: "Lançamento adiado por erro da gravadora, você perdeu streams.", minLoss: 15000, maxLoss: 150000 },
    { message: "O público odiou a capa do seu single, você perdeu streams.", minLoss: 10000, maxLoss: 80000 },
    { message: "Clipe foi denunciado e tirado do ar por 48h, você perdeu streams.", minLoss: 35000, maxLoss: 350000 }
];

const BONUS_CONFIG = [
    { message: "Seu single virou trilha de série da Netflix, você ganhou streams!", minGain: 150000, maxGain: 1500000 },
    { message: "Seu single recebeu aclamação da crítica, você ganhou streams!", minGain: 20000, maxGain: 200000 },
    { message: "Você fez uma performance viral em um festival, você ganhou streams!", minGain: 50000, maxGain: 500000 },
    { message: "Parabéns! Você virou trend no TikTok, você recebeu streams!", minGain: 80000, maxGain: 800000 },
    { message: "Uma celebridade compartilhou sua música nos stories, você ganhou streams!", minGain: 60000, maxGain: 600000 },
    { message: "Seu fandom fez streaming party por 24h! Você ganhou streams!", minGain: 20000, maxGain: 200000 }
];

const PREVIOUS_MUSIC_CHART_KEY = 'spotifyRpg_previousMusicChart';
const PREVIOUS_ALBUM_CHART_KEY = 'spotifyRpg_previousAlbumChart';
const PREVIOUS_RPG_CHART_KEY = 'spotifyRpg_previousRpgChart';

// Carrega os dados antigos do localStorage logo de cara para as setinhas (Subiu/Desceu) funcionarem
let previousMusicChartData = {}, previousAlbumChartData = {}, previousRpgChartData = {};
try {
    previousMusicChartData = JSON.parse(localStorage.getItem(PREVIOUS_MUSIC_CHART_KEY)) || {};
    previousAlbumChartData = JSON.parse(localStorage.getItem(PREVIOUS_ALBUM_CHART_KEY)) || {};
    previousRpgChartData = JSON.parse(localStorage.getItem(PREVIOUS_RPG_CHART_KEY)) || {};
} catch (e) {
    previousMusicChartData = {}; previousAlbumChartData = {}; previousRpgChartData = {};
}

// Global State
let supabaseClient;
let db = { artists: [], albums: [], singles: [], songs: [], players: [] };
let currentPlayer = null, wysiwygTracklistSortable = null, activeArtist = null, currentFeatTarget = null;
let viewHistory = [], editingTrackItem = null, albumCountdownInterval = null, existingTrackModalContext = 'album';
let editAlbumTracklistSortable = null, activeTracklistEditor = null; 
let audioElement = null, musicPlayerView = null, currentSong = null, currentQueue = [], currentQueueIndex = 0;
let isPlaying = false, isShuffle = false, repeatMode = 'none';

// DOM Variables (serão injetadas pelo app.js)
let allViews, searchInput, studioView, loginPrompt, loggedInInfo, playerSelect, loginButton, logoutButton, studioLaunchWrapper, studioTabs, studioForms;
let wysiwygReleaseForm, wysiwygArtistSelect, wysiwygTitle, wysiwygCoverFile, wysiwygCoverUrl, wysiwygReleaseDate, wysiwygToggleDeluxe, wysiwygTracklistEditor, wysiwygBg, wysiwygCoverImg, wysiwygArtistImg, openWysiwygAddTrackBtn, openWysiwygExistingTrackBtn, submitWysiwygRelease;
let featModal, featArtistSelect, featTypeSelect, confirmFeatBtn, cancelFeatBtn, trackTypeModal, trackTypeSelect, confirmTrackTypeBtn, cancelTrackTypeBtn, albumTrackModal, albumTrackModalTitle, albumTrackNameInput, albumTrackDurationInput, albumTrackTypeSelect, albumTrackFeatList, saveAlbumTrackBtn, cancelAlbumTrackBtn, editingTrackItemId, editingTrackExistingId, inlineFeatAdder, inlineFeatArtistSelect, inlineFeatTypeSelect, confirmInlineFeatBtn, cancelInlineFeatBtn, addInlineFeatBtn;
let editReleaseSection, editReleaseListContainer, editReleaseList, editReleaseForm, editReleaseId, editReleaseType, editReleaseTableName, editArtistNameDisplay, editReleaseTitle, editReleaseCoverUrl, editReleaseDate, cancelEditBtn, saveEditBtn, deleteConfirmModal, deleteReleaseName, deleteRecordId, deleteTableName, deleteTrackIds, cancelDeleteBtn, confirmDeleteBtn, openExistingTrackModalBtn, existingTrackModal, existingTrackSearch, existingTrackResults, cancelExistingTrackBtn, editArtistFilterSelect, editAlbumTracklistEditor, editTracklistActions, openEditAddTrackModalBtn, openEditExistingTrackModalBtn;
let regUsernameInput, regPasswordInput, registerButton, showRegisterBtn, showLoginBtn, registerPrompt, newArtistForm, newArtistName, newArtistImageUrl, submitNewArtist, editArtistForm, editArtistSelect, editArtistFields, editArtistNameInput, editArtistImageUrl, editArtistBgPosition, editArtistPreviewCircle, editArtistPreviewHeader, submitEditArtist;
let actionModal, modalArtistName, modalArtistId, actionTypeSelect, releaseSelectWrapper, releaseSelect, trackSelectWrapper, trackSelect, actionLimitInfo, currentActionCount, maxActionCount, confirmActionButton, cancelActionButton, artistActionsList;
let miniPlayer, miniPlayerCover, miniPlayerTitle, miniPlayerArtist, miniPlayerPlayPauseBtn, miniPlayerProgress;
let playerCloseBtn, playerAlbumTitle, playerCoverArt, playerSongTitle, playerArtistName, playerSeekBar, playerCurrentTime, playerTotalTime, playerShuffleBtn, playerPrevBtn, playerPlayPauseBtn, playerNextBtn, playerRepeatBtn;
