// ============================================================
//  saves.js — save slot management using localStorage
// ============================================================

const SAVE_STORAGE_KEY = 'armadasRevenge_saves';
const NUM_SAVE_SLOTS = 3;

let activeSaveSlot = -1;

function loadAllSaves() {
    const def = { slot1: null, slot2: null, slot3: null };
    try {
        const raw = localStorage.getItem(SAVE_STORAGE_KEY);
        if (!raw) return def;
        const parsed = JSON.parse(raw);
        return Object.assign(def, parsed);
    } catch (e) {
        console.warn('Could not read saves:', e);
        return def;
    }
}

function writeAllSaves(allSaves) {
    try {
        localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(allSaves));
    } catch (e) {
        console.warn('Could not write saves:', e);
    }
}

function getSave(slotNumber) {
    const all = loadAllSaves();
    return all['slot' + slotNumber] || null;
}

function createNewSave(slotNumber, saveName) {
    const all = loadAllSaves();
    const now = Date.now();
    all['slot' + slotNumber] = {
        name: saveName,
        createdAt: now,
        lastSavedAt: now,
        floor: 4
    };
    writeAllSaves(all);
    activeSaveSlot = slotNumber;
}

function saveCurrentGame(extraData) {
    if (activeSaveSlot === -1) return;
    const all = loadAllSaves();
    const key = 'slot' + activeSaveSlot;
    if (!all[key]) return;
    all[key] = Object.assign(all[key], extraData || {}, {
        lastSavedAt: Date.now()
    });
    writeAllSaves(all);
}

function deleteSave(slotNumber) {
    const all = loadAllSaves();
    all['slot' + slotNumber] = null;
    writeAllSaves(all);
}

function setActiveSlot(slotNumber) {
    activeSaveSlot = slotNumber;
}

function formatSaveDate(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const month = months[d.getMonth()];
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${month} ${day} ${year}  ${hh}:${mm}`;
}