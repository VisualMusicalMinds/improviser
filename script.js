// App elements
const chordApp = document.getElementById('chord-app');
const noteApp = document.getElementById('note-app');
const appContainer = document.getElementById('app-container');

// Key and scale data
const keyNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
let currentKeyIndex = 0;
let currentScale = 'major';

// Waveform data
const waveforms = ['sine', 'triangle', 'square', 'sawtooth', 'voice'];
let chordWaveformIndex = 1; // Default to triangle
let noteWaveformIndex = 1;  // Default to triangle

// Key routing arrays
const chordKeys = ['q', 'w', 'e', 'r', 't', 'f', 's', 'd', 'g'];
const noteKeys = [
    'b', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'u', 'y',
    '5', '6', '7', '8', '9', '0', 
    '[', ']', ';', "'", ',', '.', '/'
];
const accidentalKeys = ['-', '='];

// Keyboard mapping data
const noteKeyMappings = {
    'Do': ['7', 'j', 'p', '/'],
    'Re': ['8', 'k'],
    'Mi': ['9', 'l'],
    'Fa': ['0', ';', 'y', 'n'],
    'So': ['u', 'm'],
    'La': ['i', ','],
    'Ti': ['6', 'o', '.', 'h']
};

const chordKeyToFunctionMap = {
    g: 'IV/IV', f: 'I', d: 'ii', s: 'iii', t: 'V/vi',
    r: 'vi', e: 'V', w: 'IV', q: 'V/V'
};

const chordKeyToColorClassMap = {
    g: 'key-ti', f: 'key-do', d: 'key-re', s: 'key-mi', t: 'key-mi',
    r: 'key-la', e: 'key-so', w: 'key-fa', q: 'key-re'
};

const solfegeToCssClass = {
    'Do': 'key-do', 'Re': 'key-re', 'Mi': 'key-mi',
    'Fa': 'key-fa', 'So': 'key-so', 'La': 'key-la', 'Ti': 'key-ti'
};

// ------------ Helper Functions ------------

function getDisplayNameForKey(keyIndex, scaleName) {
    const sharpMinorScales = ['natural-minor', 'harmonic-minor', 'melodic-minor'];
    
    switch (keyIndex) {
        case 1: // Db/C#
            return [...sharpMinorScales, 'dorian', 'phrygian', 'locrian'].includes(scaleName) ? 'C#' : 'Db';
        case 3: // Eb/D#
            return ['phrygian', 'locrian'].includes(scaleName) ? 'D#' : 'Eb';
        case 6: // Gb/F#
            return ['major', 'lydian'].includes(scaleName) ? 'Gb' : 'F#';
        case 8: // Ab/G#
            return ['dorian', 'major', 'lydian', 'mixolydian'].includes(scaleName) ? 'Ab' : 'G#';
        case 10: // Bb/A#
            return ['locrian'].includes(scaleName) ? 'A#' : 'Bb';
        default:
            return keyNames[keyIndex];
    }
}

function postToIframes(message) {
    const chordAppOrigin = new URL(chordApp.src).origin;
    const noteAppOrigin = new URL(noteApp.src).origin;
    chordApp.contentWindow.postMessage(message, chordAppOrigin);
    noteApp.contentWindow.postMessage(message, noteAppOrigin);
}

function updateKeyDisplay() {
    document.getElementById('key-name').textContent = getDisplayNameForKey(currentKeyIndex, currentScale);
    updateSimulatedKeyboardColors(); // Update keyboard on key change
}

// ------------ Event Handlers ------------

// Keyboard Mode Toggle
document.getElementById('keyboard-mode-toggle').addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    appContainer.classList.toggle('keyboard-mode-active');
});

// Key Controls
document.getElementById('key-left').addEventListener('click', () => {
    currentKeyIndex = (currentKeyIndex - 1 + keyNames.length) % keyNames.length;
    updateKeyDisplay();
    postToIframes({ type: 'setKey', keyIndex: currentKeyIndex });
});

document.getElementById('key-right').addEventListener('click', () => {
    currentKeyIndex = (currentKeyIndex + 1) % keyNames.length;
    updateKeyDisplay();
    postToIframes({ type: 'setKey', keyIndex: currentKeyIndex });
});

// Scale Control
document.getElementById('scale-select').addEventListener('change', (e) => {
    currentScale = e.target.value;
    updateKeyDisplay();
    
    const chordScaleMap = { 
        'major': 'Major', 
        'natural-minor': 'Natural Minor', 
        'harmonic-minor': 'Harmonic Minor', 
        'melodic-minor': 'Melodic Minor', 
        'dorian': 'Dorian', 
        'phrygian': 'Phrygian', 
        'lydian': 'Lydian', 
        'mixolydian': 'Mixolydian', 
        'locrian': 'Locrian' 
    };
    const chordScale = chordScaleMap[currentScale] || 'Major';
    
    noteApp.contentWindow.postMessage({ type: 'setScale', scale: currentScale }, new URL(noteApp.src).origin);
    chordApp.contentWindow.postMessage({ type: 'setScale', scale: chordScale }, new URL(chordApp.src).origin);
    
    updateSimulatedKeyboardColors(); // Update keyboard on scale change
});

// Names Toggle
document.getElementById('name-toggle-btn').addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    postToIframes({ type: 'toggleNames' });
});

// Chord Sound Controls
const chordSoundNameEl = document.getElementById('chord-sound-name');

document.getElementById('chord-sound-left').addEventListener('click', () => {
    chordWaveformIndex = (chordWaveformIndex - 1 + waveforms.length) % waveforms.length;
    const newWaveform = waveforms[chordWaveformIndex];
    chordSoundNameEl.textContent = newWaveform;
    chordApp.contentWindow.postMessage({ type: 'setWaveform', waveform: newWaveform }, new URL(chordApp.src).origin);
});

document.getElementById('chord-sound-right').addEventListener('click', () => {
    chordWaveformIndex = (chordWaveformIndex + 1) % waveforms.length;
    const newWaveform = waveforms[chordWaveformIndex];
    chordSoundNameEl.textContent = newWaveform;
    chordApp.contentWindow.postMessage({ type: 'setWaveform', waveform: newWaveform }, new URL(chordApp.src).origin);
});

// Note Sound Controls
const noteSoundNameEl = document.getElementById('note-sound-name');

document.getElementById('note-sound-left').addEventListener('click', () => {
    noteWaveformIndex = (noteWaveformIndex - 1 + waveforms.length) % waveforms.length;
    const newWaveform = waveforms[noteWaveformIndex];
    noteSoundNameEl.textContent = newWaveform;
    noteApp.contentWindow.postMessage({ type: 'setWaveform', waveform: newWaveform }, new URL(noteApp.src).origin);
});

document.getElementById('note-sound-right').addEventListener('click', () => {
    noteWaveformIndex = (noteWaveformIndex + 1) % waveforms.length;
    const newWaveform = waveforms[noteWaveformIndex];
    noteSoundNameEl.textContent = newWaveform;
    noteApp.contentWindow.postMessage({ type: 'setWaveform', waveform: newWaveform }, new URL(noteApp.src).origin);
});

// ------------ Keyboard Event Handling ------------

function routeKeyEvent(event, isSimulatedClick = false) {
    // For physical keyboard, only route keys if keyboard mode is active
    if (!isSimulatedClick && !appContainer.classList.contains('keyboard-mode-active')) {
        return;
    }
    
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.isContentEditable) return;
    
    const key = event.key.toLowerCase();
    const message = { 
        type: event.type, 
        key: event.key, 
        shiftKey: event.shiftKey, 
        ctrlKey: event.ctrlKey, 
        altKey: event.altKey 
    };
    
    // Visual feedback for physical key presses
    const keyElement = document.querySelector(`#simulated-keyboard .key[data-key="${key}"]`);
    if (keyElement) {
        if (event.type === 'keydown') {
            keyElement.classList.add('pressed');
        } else if (event.type === 'keyup') {
            keyElement.classList.remove('pressed');
        }
    }

    // Route to iframes
    if (chordKeys.includes(key)) {
        chordApp.contentWindow.postMessage(message, new URL(chordApp.src).origin);
    }
    if (noteKeys.includes(key)) {
        noteApp.contentWindow.postMessage(message, new URL(noteApp.src).origin);
    }
    if (accidentalKeys.includes(key)) {
        noteApp.contentWindow.postMessage(message, new URL(noteApp.src).origin);
    }
}


document.addEventListener('keydown', (e) => routeKeyEvent(e, false));
document.addEventListener('keyup', (e) => routeKeyEvent(e, false));


// ------------ Modal Logic ------------

const modal = document.getElementById('keyboard-modal');
const keyboardIconContainer = document.getElementById('keyboard-icon-container');
const closeButton = document.querySelector('.close-button');

keyboardIconContainer.addEventListener('click', () => {
    modal.style.display = 'block';
    updateSimulatedKeyDisplay();
    updateSimulatedKeyboardColors();
});

closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// ------------ Simulated Keyboard Logic ------------

let keyboardDisplayMode = 'keys'; // 'keys' or 'notes'

// Store original key display text
const keyTextDefaults = {};
document.querySelectorAll('#simulated-keyboard .key[data-key]').forEach(el => {
    keyTextDefaults[el.dataset.key] = el.innerHTML;
});

function updateSimulatedKeyDisplay() {
    const allKeys = document.querySelectorAll('#simulated-keyboard .key[data-key]');
    allKeys.forEach(keyEl => {
        const key = keyEl.dataset.key;
        if (keyboardDisplayMode === 'keys') {
            keyEl.innerHTML = keyTextDefaults[key];
            keyEl.style.fontSize = '14px';
        } else { // 'notes' mode
            const noteKey = Object.keys(noteKeyMappings).find(solfege => noteKeyMappings[solfege].includes(key));
            const functionText = chordKeyToFunctionMap[key];
            
            if (noteKey) {
                keyEl.textContent = noteKey; // e.g., "Do", "Re"
            } else if (functionText) {
                keyEl.textContent = functionText;
            } else {
                keyEl.innerHTML = keyTextDefaults[key]; // Revert to default if not a music key
            }
            keyEl.style.fontSize = '12px'; // Slightly smaller font for note names
        }
    });
}

function updateSimulatedKeyboardColors() {
    const allKeys = document.querySelectorAll('#simulated-keyboard .key');
    allKeys.forEach(keyEl => {
        keyEl.className = 'key'; // Reset classes
        const key = keyEl.getAttribute('data-key');
        if (key === ' ' || key.length > 1) keyEl.classList.add(key.toLowerCase());
    });

    Object.entries(noteKeyMappings).forEach(([solfege, keys]) => {
        const cssClass = solfegeToCssClass[solfege];
        if(cssClass) {
            keys.forEach(key => {
                const keyEl = document.querySelector(`#simulated-keyboard .key[data-key="${key.toLowerCase()}"]`);
                if (keyEl) keyEl.classList.add(cssClass);
            });
        }
    });
    
    Object.entries(chordKeyToColorClassMap).forEach(([key, cssClass]) => {
        const keyEl = document.querySelector(`#simulated-keyboard .key[data-key="${key.toLowerCase()}"]`);
        if (keyEl) keyEl.classList.add(cssClass);
    });
    
    accidentalKeys.forEach(key => {
        const keyEl = document.querySelector(`#simulated-keyboard .key[data-key="${key}"]`);
        if (keyEl) keyEl.classList.add('key-accidental');
    });
}

function setupSimulatedKeyboardEvents() {
    const simulatedKeys = document.querySelectorAll('#simulated-keyboard .key[data-key]');
    simulatedKeys.forEach(keyElement => {
        const key = keyElement.getAttribute('data-key');

        const handlePress = (e) => {
            e.preventDefault();
            routeKeyEvent({ 
                type: 'keydown', 
                key: key, 
                shiftKey: e.shiftKey, 
                ctrlKey: e.ctrlKey, 
                altKey: e.altKey 
            }, true); // Pass true to indicate it's a simulated click
        };

        const handleRelease = (e) => {
            e.preventDefault();
            routeKeyEvent({ 
                type: 'keyup', 
                key: key, 
                shiftKey: e.shiftKey, 
                ctrlKey: e.ctrlKey, 
                altKey: e.altKey 
            }, true); // Pass true to indicate it's a simulated click
        };

        keyElement.addEventListener('mousedown', handlePress);
        keyElement.addEventListener('mouseup', handleRelease);
        keyElement.addEventListener('mouseleave', handleRelease);
        keyElement.addEventListener('touchstart', handlePress, { passive: false });
        keyElement.addEventListener('touchend', handleRelease);
        keyElement.addEventListener('touchcancel', handleRelease);
    });
}

// ------------ Toggle Switch Logic ------------
const keyboardToggle = document.getElementById('keyboard-toggle');
keyboardToggle.addEventListener('change', () => {
    keyboardDisplayMode = keyboardToggle.checked ? 'notes' : 'keys';
    updateSimulatedKeyDisplay();
});

// ------------ Initialization ------------
function init() {
    setupSimulatedKeyboardEvents();
    updateSimulatedKeyboardColors();
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
