// ============================================================
//  audio.js — global volume + display settings
// ============================================================

const audioSettings = {
    masterVolume: 0.7,
    sfxVolume:    0.8,
    musicVolume:  0.5,
    muted:        false
};

const displaySettings = {
    brightness: 1.0,
    fullscreen: false,
    gore:       'MEDIUM',
    resolution: 'SMALL'
};

const RESOLUTION_SCALES = {
    'SMALL':  1.0,
    'MEDIUM': 1.33,
    'LARGE':  1.67,
    'HUGE':   2.0
};

function applyResolution() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    if (displaySettings.fullscreen) {
        canvas.style.width = '';
        canvas.style.height = '';
        return;
    }
    const scale = RESOLUTION_SCALES[displaySettings.resolution] || 1.0;
    canvas.style.width  = (canvas.width  * scale) + 'px';
    canvas.style.height = (canvas.height * scale) + 'px';
}

function effectiveVolume(type) {
    if (audioSettings.muted) return 0;
    const master = audioSettings.masterVolume;
    if (type === 'sfx')   return master * audioSettings.sfxVolume;
    if (type === 'music') return master * audioSettings.musicVolume;
    return master;
}

function setFullscreen(enabled) {
    const el = document.documentElement;
    if (enabled) {
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
}

document.addEventListener('fullscreenchange', () => {
    displaySettings.fullscreen = !!document.fullscreenElement;
    applyResolution();
});
document.addEventListener('webkitfullscreenchange', () => {
    displaySettings.fullscreen = !!document.webkitFullscreenElement;
    applyResolution();
});