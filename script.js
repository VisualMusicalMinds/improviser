// App elements
const chordApp = document.getElementById('chord-app');
const noteApp = document.getElementById('note-app');

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

// Touch mode detection
let isTouchDevice = false;
let touchModeActive = false;

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

function routeKeyEvent(event) {
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

document.addEventListener('keydown', routeKeyEvent);
document.addEventListener('keyup', routeKeyEvent);

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
            });
        };

        const handleRelease = (e) => {
            e.preventDefault();
            routeKeyEvent({ 
                type: 'keyup', 
                key: key, 
                shiftKey: e.shiftKey, 
                ctrlKey: e.ctrlKey, 
                altKey: e.altKey 
            });
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

// ------------ Touch Interface Logic ------------

// Detect if device supports touch
function detectTouchDevice() {
    isTouchDevice = ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0) || 
                   (navigator.msMaxTouchPoints > 0);
    
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
        setupTouchInterface();
    }
}

// Set up touch interface
function setupTouchInterface() {
    // Create and append touch overlay to DOM if not already present
    if (!document.getElementById('touch-overlay')) {
        createTouchOverlay();
    }
    
    // Set up touch event listeners on app container
    setupAppContainerTouchEvents();
    
    // Add touch toggle button to controls
    addTouchModeToggle();
}

// Create touch overlay interface
function createTouchOverlay() {
    const touchOverlay = document.createElement('div');
    touchOverlay.id = 'touch-overlay';
    touchOverlay.className = 'touch-overlay hidden';
    
    // Create touch interface elements
    const overlayContent = `
        <div class="touch-header">
            <div id="touch-toggle-button" class="touch-toggle-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                <span>Touch Mode</span>
            </div>
            <div class="drag-handle">
                <span>≡</span>
            </div>
        </div>
        <div class="touch-content">
            <div class="touch-section chord-section">
                <h3>Chords</h3>
                <div class="touch-buttons">
                    ${chordKeys.map(key => {
                        const functionText = chordKeyToFunctionMap[key] || key.toUpperCase();
                        const colorClass = chordKeyToColorClassMap[key] || '';
                        return `<div class="touch-button ${colorClass}" data-key="${key}">${functionText}</div>`;
                    }).join('')}
                </div>
            </div>
            <div class="touch-section note-section">
                <h3>Notes</h3>
                <div class="touch-buttons">
                    ${Object.entries(noteKeyMappings).map(([solfege, keys]) => {
                        const colorClass = solfegeToCssClass[solfege] || '';
                        // Just show one button per note type (first key in the mapping)
                        const key = keys[0];
                        return `<div class="touch-button ${colorClass}" data-key="${key}">${solfege}</div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    touchOverlay.innerHTML = overlayContent;
    document.body.appendChild(touchOverlay);
    
    // Set up events for the touch overlay
    setupTouchOverlayEvents();
}

// Set up events for touch overlay
function setupTouchOverlayEvents() {
    const touchOverlay = document.getElementById('touch-overlay');
    const touchToggleButton = document.getElementById('touch-toggle-button');
    const dragHandle = touchOverlay.querySelector('.drag-handle');
    
    // Make the overlay draggable
    setupDraggableOverlay(touchOverlay, dragHandle);
    
    // Toggle touch mode when button is clicked
    touchToggleButton.addEventListener('click', toggleTouchMode);
    
    // Set up touch buttons
    const touchButtons = touchOverlay.querySelectorAll('.touch-button');
    touchButtons.forEach(button => {
        const key = button.getAttribute('data-key');
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.classList.add('active');
            
            // Send keydown event to appropriate app
            routeKeyEvent({
                type: 'keydown',
                key: key,
                shiftKey: false,
                ctrlKey: false,
                altKey: false
            });
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.classList.remove('active');
            
            // Send keyup event to appropriate app
            routeKeyEvent({
                type: 'keyup',
                key: key,
                shiftKey: false,
                ctrlKey: false,
                altKey: false
            });
        });
        
        // Also support mouse events for hybrid devices
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            button.classList.add('active');
            
            routeKeyEvent({
                type: 'keydown',
                key: key,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            });
        });
        
        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            button.classList.remove('active');
            
            routeKeyEvent({
                type: 'keyup',
                key: key,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            });
        });
        
        button.addEventListener('mouseleave', (e) => {
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                
                routeKeyEvent({
                    type: 'keyup',
                    key: key,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey
                });
            }
        });
    });
}

// Make the overlay draggable
function setupDraggableOverlay(overlay, handle) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    
    handle.addEventListener('touchstart', function(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialLeft = parseInt(window.getComputedStyle(overlay).left) || 0;
        initialTop = parseInt(window.getComputedStyle(overlay).top) || 0;
        e.preventDefault();
    });
    
    handle.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseInt(window.getComputedStyle(overlay).left) || 0;
        initialTop = parseInt(window.getComputedStyle(overlay).top) || 0;
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        // Ensure overlay stays within viewport bounds
        const newLeft = Math.max(0, Math.min(window.innerWidth - overlay.offsetWidth, initialLeft + deltaX));
        const newTop = Math.max(0, Math.min(window.innerHeight - overlay.offsetHeight, initialTop + deltaY));
        
        overlay.style.left = newLeft + 'px';
        overlay.style.top = newTop + 'px';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Ensure overlay stays within viewport bounds
        const newLeft = Math.max(0, Math.min(window.innerWidth - overlay.offsetWidth, initialLeft + deltaX));
        const newTop = Math.max(0, Math.min(window.innerHeight - overlay.offsetHeight, initialTop + deltaY));
        
        overlay.style.left = newLeft + 'px';
        overlay.style.top = newTop + 'px';
        e.preventDefault();
    });
    
    document.addEventListener('touchend', function() {
        isDragging = false;
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

// Set up direct touch events on app container for grid-based touch interaction
function setupAppContainerTouchEvents() {
    const appContainer = document.getElementById('app-container');
    
    appContainer.addEventListener('touchstart', function(e) {
        if (!touchModeActive) return;
        
        // Determine which app was touched based on x-coordinate
        const touchX = e.touches[0].clientX;
        const containerWidth = appContainer.offsetWidth;
        const isChordApp = touchX < containerWidth / 2;
        
        // Calculate relative position within the app
        const appWidth = containerWidth / 2;
        const relativeX = isChordApp ? touchX : touchX - appWidth;
        const relativeY = e.touches[0].clientY - appContainer.getBoundingClientRect().top;
        
        // Translate touch to appropriate musical action
        const keyPressed = translateTouchToKey(isChordApp, relativeX, relativeY, appWidth);
        
        if (keyPressed) {
            // Simulate key press
            routeKeyEvent({
                type: 'keydown',
                key: keyPressed,
                shiftKey: false,
                ctrlKey: false,
                altKey: false
            });
            
            // Store the touched key for release
            e.target.setAttribute('data-touched-key', keyPressed);
        }
    });
    
    appContainer.addEventListener('touchend', function(e) {
        if (!touchModeActive) return;
        
        const keyPressed = e.target.getAttribute('data-touched-key');
        if (keyPressed) {
            // Simulate key release
            routeKeyEvent({
                type: 'keyup',
                key: keyPressed,
                shiftKey: false,
                ctrlKey: false,
                altKey: false
            });
            
            // Clear the touched key
            e.target.removeAttribute('data-touched-key');
        }
    });
}

// Translate touch coordinates to key press
function translateTouchToKey(isChordApp, x, y, appWidth) {
    if (isChordApp) {
        // For chord app, divide the area into a grid
        // Assuming a 3x3 grid for 9 chord keys (q,w,e,r,t,f,s,d,g)
        const cols = 3;
        const rows = 3;
        const cellWidth = appWidth / cols;
        const cellHeight = window.innerHeight * 0.6 / rows; // Use 60% of window height for playing area
        
        const col = Math.floor(x / cellWidth);
        const row = Math.floor(y / cellHeight);
        
        // Skip if touch is outside the grid
        if (row >= rows || col >= cols) return null;
        
        // Map grid position to chord key
        const index = row * cols + col;
        return index < chordKeys.length ? chordKeys[index] : null;
    } else {
        // For note app, create a piano-like layout
        // Divide the width into sections for different note types
        const noteTypes = Object.keys(noteKeyMappings);
        const sectionWidth = appWidth / noteTypes.length;
        
        const section = Math.floor(x / sectionWidth);
        if (section >= 0 && section < noteTypes.length) {
            const noteType = noteTypes[section];
            const keys = noteKeyMappings[noteType];
            return keys[0]; // Use the first key mapped to this note
        }
    }
    
    return null;
}

// Toggle touch mode on/off
function toggleTouchMode() {
    touchModeActive = !touchModeActive;
    
    const touchOverlay = document.getElementById('touch-overlay');
    const touchToggleButton = document.getElementById('touch-toggle-button');
    
    if (touchModeActive) {
        touchOverlay.classList.remove('hidden');
        touchToggleButton.classList.add('active');
        document.body.classList.add('touch-mode-active');
    } else {
        touchOverlay.classList.add('hidden');
        touchToggleButton.classList.remove('active');
        document.body.classList.remove('touch-mode-active');
    }
}

// Add touch mode toggle to controls
function addTouchModeToggle() {
    const controlsRow = document.querySelector('.controls-row');
    
    const touchToggle = document.createElement('div');
    touchToggle.id = 'master-touch-toggle';
    touchToggle.className = 'control-box touch-control-box';
    touchToggle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
        <span>Touch</span>
    `;
    
    controlsRow.appendChild(touchToggle);
    
    touchToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        toggleTouchMode();
    });
}
// ------------ Touch Interface Logic ------------

// Touch mode detection and state
let isTouchDevice = false;
let touchModeActive = false;
let touchOverlayCreated = false;

// Detect if device supports touch
function detectTouchDevice() {
    isTouchDevice = ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0) || 
                   (navigator.msMaxTouchPoints > 0);
    
    if (isTouchDevice) {
        console.log("Touch device detected");
        document.body.classList.add('touch-device');
        setupTouchInterface();
    }
}

// Set up touch interface
function setupTouchInterface() {
    if (!touchOverlayCreated) {
        createTouchOverlay();
        touchOverlayCreated = true;
    }
    
    // Add touch toggle button to controls if it doesn't exist
    if (!document.getElementById('master-touch-toggle')) {
        addTouchModeToggle();
    }
}

// Create touch overlay interface
function createTouchOverlay() {
    const touchOverlay = document.createElement('div');
    touchOverlay.id = 'touch-overlay';
    touchOverlay.className = 'touch-overlay hidden';
    
    // Create touch interface elements
    const overlayContent = `
        <div class="touch-header">
            <div id="touch-toggle-button" class="touch-toggle-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                <span>Touch Mode</span>
            </div>
            <div class="drag-handle">
                <span>≡</span>
            </div>
        </div>
        <div class="touch-content">
            <div class="touch-section chord-section">
                <h3>Chords</h3>
                <div class="touch-buttons">
                    ${chordKeys.map(key => {
                        const functionText = chordKeyToFunctionMap[key] || key.toUpperCase();
                        const colorClass = chordKeyToColorClassMap[key] || '';
                        return `<div class="touch-button ${colorClass}" data-key="${key}">${functionText}</div>`;
                    }).join('')}
                </div>
            </div>
            <div class="touch-section note-section">
                <h3>Notes</h3>
                <div class="touch-buttons">
                    ${Object.entries(noteKeyMappings).map(([solfege, keys]) => {
                        const colorClass = solfegeToCssClass[solfege] || '';
                        // Just show one button per note type (first key in the mapping)
                        const key = keys[0];
                        return `<div class="touch-button ${colorClass}" data-key="${key}">${solfege}</div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    touchOverlay.innerHTML = overlayContent;
    document.body.appendChild(touchOverlay);
    
    // Set up events for the touch overlay
    setupTouchOverlayEvents();
}

// Set up events for touch overlay
function setupTouchOverlayEvents() {
    const touchOverlay = document.getElementById('touch-overlay');
    if (!touchOverlay) return;
    
    const touchToggleButton = document.getElementById('touch-toggle-button');
    const dragHandle = touchOverlay.querySelector('.drag-handle');
    
    // Make the overlay draggable
    setupDraggableOverlay(touchOverlay, dragHandle);
    
    // Toggle touch mode when button is clicked
    if (touchToggleButton) {
        touchToggleButton.addEventListener('click', toggleTouchMode);
    }
    
    // Set up touch buttons
    const touchButtons = touchOverlay.querySelectorAll('.touch-button');
    touchButtons.forEach(button => {
        const key = button.getAttribute('data-key');
        if (!key) return;
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            button.classList.add('active');
            
            // Send keydown event to appropriate app
            routeKeyEvent({
                type: 'keydown',
                key: key,
                shiftKey: false,
                ctrlKey: false,
                altKey: false
            });
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            button.classList.remove('active');
            
            // Send keyup event to appropriate app
            routeKeyEvent({
                type: 'keyup',
                key: key,
                shiftKey: false,
                ctrlKey: false,
                altKey: false
            });
        });
        
        // Also support mouse events for hybrid devices
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            button.classList.add('active');
            
            routeKeyEvent({
                type: 'keydown',
                key: key,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            });
        });
        
        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            button.classList.remove('active');
            
            routeKeyEvent({
                type: 'keyup',
                key: key,
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            });
        });
        
        button.addEventListener('mouseleave', (e) => {
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                
                routeKeyEvent({
                    type: 'keyup',
                    key: key,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey
                });
            }
        });
    });
}

// Make the overlay draggable
function setupDraggableOverlay(overlay, handle) {
    if (!overlay || !handle) return;
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    
    handle.addEventListener('touchstart', function(e) {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialLeft = parseInt(window.getComputedStyle(overlay).left) || 0;
        initialTop = parseInt(window.getComputedStyle(overlay).top) || 0;
        e.preventDefault();
    });
    
    handle.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseInt(window.getComputedStyle(overlay).left) || 0;
        initialTop = parseInt(window.getComputedStyle(overlay).top) || 0;
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        // Ensure overlay stays within viewport bounds
        const newLeft = Math.max(0, Math.min(window.innerWidth - overlay.offsetWidth, initialLeft + deltaX));
        const newTop = Math.max(0, Math.min(window.innerHeight - overlay.offsetHeight, initialTop + deltaY));
        
        overlay.style.left = newLeft + 'px';
        overlay.style.top = newTop + 'px';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        // Ensure overlay stays within viewport bounds
        const newLeft = Math.max(0, Math.min(window.innerWidth - overlay.offsetWidth, initialLeft + deltaX));
        const newTop = Math.max(0, Math.min(window.innerHeight - overlay.offsetHeight, initialTop + deltaY));
        
        overlay.style.left = newLeft + 'px';
        overlay.style.top = newTop + 'px';
        e.preventDefault();
    });
    
    document.addEventListener('touchend', function() {
        isDragging = false;
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

// Toggle touch mode on/off
function toggleTouchMode() {
    touchModeActive = !touchModeActive;
    
    const touchOverlay = document.getElementById('touch-overlay');
    const touchToggleButton = document.getElementById('touch-toggle-button');
    const masterTouchToggle = document.getElementById('master-touch-toggle');
    
    if (touchModeActive) {
        if (touchOverlay) touchOverlay.classList.remove('hidden');
        if (touchToggleButton) touchToggleButton.classList.add('active');
        if (masterTouchToggle) masterTouchToggle.classList.add('active');
        document.body.classList.add('touch-mode-active');
    } else {
        if (touchOverlay) touchOverlay.classList.add('hidden');
        if (touchToggleButton) touchToggleButton.classList.remove('active');
        if (masterTouchToggle) masterTouchToggle.classList.remove('active');
        document.body.classList.remove('touch-mode-active');
    }
}

// Add touch mode toggle to controls
function addTouchModeToggle() {
    const controlsRow = document.querySelector('.controls-row');
    if (!controlsRow) return;
    
    const touchToggle = document.createElement('div');
    touchToggle.id = 'master-touch-toggle';
    touchToggle.className = 'control-box touch-control-box';
    touchToggle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
        </svg>
        <span>Touch</span>
    `;
    
    controlsRow.appendChild(touchToggle);
    
    touchToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        toggleTouchMode();
    });
}

// ------------ Initialization ------------
function init() {
    setupSimulatedKeyboardEvents();
    updateSimulatedKeyboardColors();
    
    // Detect touch device and set up touch interface if needed
    detectTouchDevice();
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
