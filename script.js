// App elements
const chordApp = document.getElementById('chord-app');
const noteApp = document.getElementById('note-app');
const appContainer = document.getElementById('app-container');
const touchOverlay = document.getElementById('touch-overlay');

// Key and scale data
const keyNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
let currentKeyIndex = 0;
let currentScale = 'major';

// Waveform data
const waveforms = ['sine', 'triangle', 'square', 'sawtooth', 'voice'];
let chordWaveformIndex = 1; // Default to triangle
let noteWaveformIndex = 1;  // Default to triangle

// Flag to track the first user interaction for resuming audio
let isAudioInitialized = false;

// Key routing arrays
const chordKeys = ['q', 'w', 'e', 'r', 't', 'f', 's', 'd', 'g'];
// MODIFIED: Added shifted symbols to the noteKeys array
const noteKeys = [
    'b', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'u', 'y',
    '5', '6', '7', '8', '9', '0', 
    '[', ']', ';', "'", ',', '.', '/',
    // Shifted versions of the above
    '^', '&', '*', '(', ')', ':', '<', '>', '?'
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
    e.target.blur(); // Remove focus from the dropdown
});

// Names Toggle
document.getElementById('name-toggle-btn').addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    postToIframes({ type: 'toggleNames' });

    // --- ADDED ---
    // Also reset the audio engine every time this is clicked.
    postToIframes({ type: 'resetAudio' });
    isAudioInitialized = true; // Since this is a user action, consider audio initialized.
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

function routeKeyEvent(event) {
    // No longer need to check for keyboard mode, it's always on.
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.isContentEditable) return;
    
    const key = event.key.toLowerCase();
    // MODIFIED: Pass the CapsLock state to the iframes
    const capsLockState = typeof event.getModifierState === 'function' ? event.getModifierState("CapsLock") : false;
    const message = { 
        type: event.type, 
        key: event.key, 
        shiftKey: event.shiftKey, 
        ctrlKey: event.ctrlKey, 
        altKey: event.altKey,
        capsLockActive: capsLockState 
    };
    
    const keyElement = document.querySelector(`#simulated-keyboard .key[data-key="${key}"]`);
    if (keyElement) {
        event.type === 'keydown' ? keyElement.classList.add('pressed') : keyElement.classList.remove('pressed');
    }

    // MODIFIED: Check against the original event.key as well as the lowercased key to catch shifted symbols
    if (chordKeys.includes(key)) chordApp.contentWindow.postMessage(message, new URL(chordApp.src).origin);
    if (noteKeys.includes(key) || noteKeys.includes(event.key)) noteApp.contentWindow.postMessage(message, new URL(noteApp.src).origin);
    if (accidentalKeys.includes(key)) noteApp.contentWindow.postMessage(message, new URL(noteApp.src).origin);
}

document.addEventListener('keydown', routeKeyEvent);
document.addEventListener('keyup', routeKeyEvent);

// ------------ Touch & Mouse Overlay Handling ------------

function forwardEvent(event) {
    // On the first user interaction, send a message to resume audio contexts
    if (!isAudioInitialized && (event.type === 'touchstart' || event.type === 'mousedown')) {
        postToIframes({ type: 'resumeAudio' });
        isAudioInitialized = true;
    }
    
    const chordAppRect = chordApp.getBoundingClientRect();
    const noteAppRect = noteApp.getBoundingClientRect();
    let eventType, pointerList;

    // Standardize touch and mouse events
    if (event.touches) { // It's a touch event
        eventType = {
            'touchstart': 'start',
            'touchmove': 'move',
            'touchend': 'end',
            'touchcancel': 'end'
        }[event.type];
        pointerList = event.changedTouches;
    } else { // It's a mouse event
        eventType = {
            'mousedown': 'start',
            'mousemove': 'move',
            'mouseup': 'end',
            'mouseleave': 'end'
        }[event.type];
        pointerList = [event]; // Treat the single mouse event as a list
    }

    if (!eventType) return;
    event.preventDefault();

    for (let i = 0; i < pointerList.length; i++) {
        const pointer = pointerList[i];
        let targetFrame, targetRect;

        // Determine which iframe the pointer is over
        if (pointer.clientX >= chordAppRect.left && pointer.clientX <= chordAppRect.right) {
            targetFrame = chordApp;
            targetRect = chordAppRect;
        } else if (pointer.clientX >= noteAppRect.left && pointer.clientX <= noteAppRect.right) {
            targetFrame = noteApp;
            targetRect = noteAppRect;
        }

        if (targetFrame) {
            const eventData = {
                type: 'simulatedPointer',
                eventType: eventType,
                id: pointer.identifier ?? 'mouse', // Use touch identifier or 'mouse'
                x: pointer.clientX - targetRect.left,
                y: pointer.clientY - targetRect.top
            };
            targetFrame.contentWindow.postMessage(eventData, new URL(targetFrame.src).origin);
        }
    }
}

// Touch Events
touchOverlay.addEventListener('touchstart', forwardEvent, { passive: false });
touchOverlay.addEventListener('touchmove', forwardEvent, { passive: false });
touchOverlay.addEventListener('touchend', forwardEvent, { passive: false });
touchOverlay.addEventListener('touchcancel', forwardEvent, { passive: false });

// Mouse Events
touchOverlay.addEventListener('mousedown', forwardEvent, { passive: false });
touchOverlay.addEventListener('mousemove', forwardEvent, { passive: false });
touchOverlay.addEventListener('mouseup', forwardEvent, { passive: false });
touchOverlay.addEventListener('mouseleave', forwardEvent, { passive: false });


// ------------ Modal Logic ------------

const modal = document.getElementById('keyboard-modal');
const keyboardIconContainer = document.getElementById('keyboard-icon-container');
const closeButton = document.querySelector('.close-button');

keyboardIconContainer.addEventListener('click', () => {
    modal.style.display = 'block';
    updateSimulatedKeyDisplay();
    updateSimulatedKeyboardColors();
});

closeButton.addEventListener('click', () => { modal.style.display = 'none'; });
window.addEventListener('click', (event) => { if (event.target == modal) modal.style.display = 'none'; });

// ------------ Simulated Keyboard Logic ------------

let keyboardDisplayMode = 'keys'; // 'keys' or 'notes'
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
        } else {
            const noteKey = Object.keys(noteKeyMappings).find(solfege => noteKeyMappings[solfege].includes(key));
            const functionText = chordKeyToFunctionMap[key];
            keyEl.textContent = noteKey || functionText || keyTextDefaults[key].match(/>(.)</)?.[1] || key;
            keyEl.style.fontSize = '12px';
        }
    });
}

function updateSimulatedKeyboardColors() {
    document.querySelectorAll('#simulated-keyboard .key').forEach(keyEl => {
        keyEl.className = 'key';
        const key = keyEl.getAttribute('data-key');
        if (key.length > 1) keyEl.classList.add(key.toLowerCase());
    });
    Object.entries(noteKeyMappings).forEach(([solfege, keys]) => {
        const cssClass = solfegeToCssClass[solfege];
        if (cssClass) keys.forEach(key => document.querySelector(`#simulated-keyboard .key[data-key="${key.toLowerCase()}"]`)?.classList.add(cssClass));
    });
    Object.entries(chordKeyToColorClassMap).forEach(([key, cssClass]) => {
        document.querySelector(`#simulated-keyboard .key[data-key="${key.toLowerCase()}"]`)?.classList.add(cssClass);
    });
    accidentalKeys.forEach(key => document.querySelector(`#simulated-keyboard .key[data-key="${key}"]`)?.classList.add('key-accidental'));
}

function handleSimulatedKey(type, key, event) {
    const message = { type: type, key: key, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey };
    if (chordKeys.includes(key.toLowerCase())) chordApp.contentWindow.postMessage(message, new URL(chordApp.src).origin);
    if (noteKeys.includes(key.toLowerCase())) noteApp.contentWindow.postMessage(message, new URL(noteApp.src).origin);
    if (accidentalKeys.includes(key)) noteApp.contentWindow.postMessage(message, new URL(noteApp.src).origin);
}

function setupSimulatedKeyboardEvents() {
    document.querySelectorAll('#simulated-keyboard .key[data-key]').forEach(keyElement => {
        const key = keyElement.getAttribute('data-key');
        const handlePress = (e) => { e.preventDefault(); keyElement.classList.add('pressed'); handleSimulatedKey('keydown', key, e); };
        const handleRelease = (e) => { e.preventDefault(); keyElement.classList.remove('pressed'); handleSimulatedKey('keyup', key, e); };
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

document.addEventListener('DOMContentLoaded', init);
