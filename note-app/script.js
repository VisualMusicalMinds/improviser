// --- AUDIO & STATE ---
const context = new (window.AudioContext || window.webkitAudioContext)();

// Audio setup
const compressor = context.createDynamicsCompressor();
compressor.threshold.value = -24;
compressor.knee.value = 30;
compressor.ratio.value = 12;
compressor.attack.value = 0.003;
compressor.release.value = 0.25;
compressor.connect(context.destination);

// State variables
const waveforms = ['sine', 'triangle', 'square', 'sawtooth', 'voice'];
let currentWaveformIndex = 1;
let currentWaveform = waveforms[currentWaveformIndex];
let globalVolume = 0.4;

const keyNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
let currentKeyIndex = 0;
let currentScale = 'major';

// State for one-time accidental application
let accidentalArmed = { sharp: false, flat: false };
let octaveShiftActive = false;

// Base color mapping for keys, tied to the 7 note letters
const KEY_COLORS = {
  'C': '#FF3B30', // Red
  'D': '#FF9500', // Orange
  'E': '#FFCC00', // Yellow
  'F': '#34C759', // Green
  'G': '#30c0c6', // Turquoise
  'A': '#007AFF', // Blue
  'B': '#AF52DE'  // Purple
};

// Scale definitions with interval patterns and solfege mappings
const scaleDefinitions = {
  'major': {
    name: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11], // W-W-H-W-W-W-H
    solfege: ['Do', 'Re', 'Mi', 'Fa', 'So', 'La', 'Ti']
  },
  'natural-minor': {
    name: 'Natural Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10], // W-H-W-W-H-W-W
    solfege: ['Do', 'Re', 'Me', 'Fa', 'So', 'Le', 'Te']
  },
  'harmonic-minor': {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11], // W-H-W-W-H-W+H-H
    solfege: ['Do', 'Re', 'Me', 'Fa', 'So', 'Le', 'Ti']
  },
  'melodic-minor': {
    name: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11], // W-H-W-W-W-W-H
    solfege: ['Do', 'Re', 'Me', 'Fa', 'So', 'La', 'Ti']
  },
  'dorian': {
    name: 'Dorian Mode',
    intervals: [0, 2, 3, 5, 7, 9, 10], // W-H-W-W-W-H-W
    solfege: ['Do', 'Re', 'Me', 'Fa', 'So', 'La', 'Te']
  },
  'phrygian': {
    name: 'Phrygian Mode',
    intervals: [0, 1, 3, 5, 7, 8, 10], // H-W-W-W-H-W-W
    solfege: ['Do', 'Ra', 'Me', 'Fa', 'So', 'Le', 'Te']
  },
  'lydian': {
    name: 'Lydian Mode',
    intervals: [0, 2, 4, 6, 7, 9, 11], // W-W-W-H-W-W-H
    solfege: ['Do', 'Re', 'Mi', 'Fi', 'So', 'La', 'Ti']
  },
  'mixolydian': {
    name: 'Mixolydian Mode',
    intervals: [0, 2, 4, 5, 7, 9, 10], // W-W-H-W-W-H-W
    solfege: ['Do', 'Re', 'Mi', 'Fa', 'So', 'La', 'Te']
  },
  'locrian': {
    name: 'Locrian Mode',
    intervals: [0, 1, 3, 5, 6, 8, 10], // H-W-W-H-W-W-W
    solfege: ['Do', 'Ra', 'Me', 'Fa', 'Se', 'Le', 'Te']
  }
};

const scaleSpellings = {
    'C': {
        'major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        'dorian': ['C', 'D', 'E♭', 'F', 'G', 'A', 'B♭'],
        'phrygian': ['C', 'D♭', 'E♭', 'F', 'G', 'A♭', 'B♭'],
        'lydian': ['C', 'D', 'E', 'F♯', 'G', 'A', 'B'],
        'mixolydian': ['C', 'D', 'E', 'F', 'G', 'A', 'B♭'],
        'natural-minor': ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭'],
        'harmonic-minor': ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B'],
        'melodic-minor': ['C', 'D', 'E♭', 'F', 'G', 'A', 'B'],
        'locrian': ['C', 'D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭']
    },
    'Db': {
        'major': ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C'],
        'dorian': ['D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B♭', 'C♭'],
        'phrygian': ['D♭', 'E𝄫', 'F♭', 'G♭', 'A♭', 'B𝄫', 'C♭'],
        'lydian': ['D♭', 'E♭', 'F', 'G', 'A♭', 'B♭', 'C'],
        'mixolydian': ['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C♭'],
        'natural-minor': ['D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B𝄫', 'C♭'],
        'harmonic-minor': ['D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B𝄫', 'C'],
        'melodic-minor': ['D♭', 'E♭', 'F♭', 'G♭', 'A♭', 'B♭', 'C'],
        'locrian': ['D♭', 'E𝄫', 'F♭', 'G𝄫', 'A𝄫', 'B𝄫', 'C♭']
    },
    'C#': {
        'major': ['C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯'],
        'dorian': ['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯', 'B'],
        'phrygian': ['C♯', 'D', 'E', 'F♯', 'G♯', 'A', 'B'],
        'lydian': ['C♯', 'D♯', 'E♯', 'F♯♯', 'G♯', 'A♯', 'B♯'],
        'mixolydian': ['C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B'],
        'natural-minor': ['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A', 'B'],
        'harmonic-minor': ['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A', 'B♯'],
        'melodic-minor': ['C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯', 'B♯'],
        'locrian': ['C♯', 'D', 'E', 'F♯', 'G', 'A', 'B']
    },
    'D': {
        'major': ['D', 'E', 'F♯', 'G', 'A', 'B', 'C♯'],
        'dorian': ['D', 'E', 'F', 'G', 'A', 'B', 'C'],
        'phrygian': ['D', 'E♭', 'F', 'G', 'A', 'B♭', 'C'],
        'lydian': ['D', 'E', 'F♯', 'G♯', 'A', 'B', 'C♯'],
        'mixolydian': ['D', 'E', 'F♯', 'G', 'A', 'B', 'C'],
        'natural-minor': ['D', 'E', 'F', 'G', 'A', 'B♭', 'C'],
        'harmonic-minor': ['D', 'E', 'F', 'G', 'A', 'B♭', 'C♯'],
        'melodic-minor': ['D', 'E', 'F', 'G', 'A', 'B', 'C♯'],
        'locrian': ['D', 'E♭', 'F', 'G', 'A♭', 'B♭', 'C']
    },
    'Eb': {
        'major': ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D'],
        'dorian': ['E♭', 'F', 'G♭', 'A♭', 'B♭', 'C', 'D♭'],
        'phrygian': ['E♭', 'F♭', 'G♭', 'A♭', 'B♭', 'C♭', 'D♭'],
        'lydian': ['E♭', 'F', 'G', 'A', 'B♭', 'C', 'D'],
        'mixolydian': ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D♭'],
        'natural-minor': ['E♭', 'F', 'G♭', 'A♭', 'B♭', 'C♭', 'D♭'],
        'harmonic-minor': ['E♭', 'F', 'G♭', 'A♭', 'B♭', 'C♭', 'D'],
        'melodic-minor': ['E♭', 'F', 'G♭', 'A♭', 'B♭', 'C', 'D'],
        'locrian': ['E♭', 'F♭', 'G♭', 'A♭', 'B𝄫', 'C♭', 'D♭']
    },
    'D#': {
        'major': ['D♯', 'E♯', 'F♯♯', 'G♯', 'A♯', 'B♯', 'C♯♯'],
        'dorian': ['D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯', 'C♯'],
        'phrygian': ['D♯', 'E', 'F♯', 'G♯', 'A♯', 'B', 'C♯'],
        'lydian': ['D♯', 'E♯', 'F♯♯', 'G♯♯', 'A♯', 'B♯', 'C♯♯'],
        'mixolydian': ['D♯', 'E♯', 'F♯♯', 'G♯', 'A♯', 'B♯', 'C♯'],
        'natural-minor': ['D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B', 'C♯'],
        'harmonic-minor': ['D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B', 'C♯♯'],
        'melodic-minor': ['D♯', 'E♯', 'F♯', 'G♯', 'A♯', 'B♯', 'C♯♯'],
        'locrian': ['D♯', 'E', 'F♯', 'G♯', 'A', 'B', 'C♯']
    },
    'E': {
        'major': ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D♯'],
        'dorian': ['E', 'F♯', 'G', 'A', 'B', 'C♯', 'D'],
        'phrygian': ['E', 'F', 'G', 'A', 'B', 'C', 'D'],
        'lydian': ['E', 'F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯'],
        'mixolydian': ['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D'],
        'natural-minor': ['E', 'F♯', 'G', 'A', 'B', 'C', 'D'],
        'harmonic-minor': ['E', 'F♯', 'G', 'A', 'B', 'C', 'D♯'],
        'melodic-minor': ['E', 'F♯', 'G', 'A', 'B', 'C♯', 'D♯'],
        'locrian': ['E', 'F', 'G', 'A', 'B♭', 'C', 'D']
    },
    'F': {
        'major': ['F', 'G', 'A', 'B♭', 'C', 'D', 'E'],
        'dorian': ['F', 'G', 'A♭', 'B♭', 'C', 'D', 'E♭'],
        'phrygian': ['F', 'G♭', 'A♭', 'B♭', 'C', 'D♭', 'E♭'],
        'lydian': ['F', 'G', 'A', 'B', 'C', 'D', 'E'],
        'mixolydian': ['F', 'G', 'A', 'B♭', 'C', 'D', 'E♭'],
        'natural-minor': ['F', 'G', 'A♭', 'B♭', 'C', 'D♭', 'E♭'],
        'harmonic-minor': ['F', 'G', 'A♭', 'B♭', 'C', 'D♭', 'E'],
        'melodic-minor': ['F', 'G', 'A♭', 'B♭', 'C', 'D', 'E'],
        'locrian': ['F', 'G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭']
    },
    'Gb': {
        'major': ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F'],
        'dorian': ['G♭', 'A♭', 'B𝄫', 'C♭', 'D♭', 'E♭', 'F♭'],
        'phrygian': ['G♭', 'A𝄫', 'B𝄫', 'C♭', 'D♭', 'E𝄫', 'F♭'],
        'lydian': ['G♭', 'A♭', 'B♭', 'C', 'D♭', 'E♭', 'F'],
        'mixolydian': ['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F♭'],
        'natural-minor': ['G♭', 'A♭', 'B𝄫', 'C♭', 'D♭', 'E𝄫', 'F♭'],
        'harmonic-minor': ['G♭', 'A♭', 'B𝄫', 'C♭', 'D♭', 'E𝄫', 'F'],
        'melodic-minor': ['G♭', 'A♭', 'B𝄫', 'C♭', 'D♭', 'E♭', 'F'],
        'locrian': ['G♭', 'A𝄫', 'B𝄫', 'C♭', 'D𝄫', 'E𝄫', 'F♭']
    },
    'F#': {
        'major': ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯'],
        'dorian': ['F♯', 'G♯', 'A', 'B', 'C♯', 'D♯', 'E'],
        'phrygian': ['F♯', 'G', 'A', 'B', 'C♯', 'D', 'E'],
        'lydian': ['F♯', 'G♯', 'A♯', 'B♯', 'C♯', 'D♯', 'E♯'],
        'mixolydian': ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E'],
        'natural-minor': ['F♯', 'G♯', 'A', 'B', 'C♯', 'D', 'E'],
        'harmonic-minor': ['F♯', 'G♯', 'A', 'B', 'C♯', 'D', 'E♯'],
        'melodic-minor': ['F♯', 'G♯', 'A', 'B', 'C♯', 'D♯', 'E♯'],
        'locrian': ['F♯', 'G', 'A', 'B', 'C', 'D', 'E']
    },
    'G': {
        'major': ['G', 'A', 'B', 'C', 'D', 'E', 'F♯'],
        'dorian': ['G', 'A', 'B♭', 'C', 'D', 'E', 'F'],
        'phrygian': ['G', 'A♭', 'B♭', 'C', 'D', 'E♭', 'F'],
        'lydian': ['G', 'A', 'B', 'C♯', 'D', 'E', 'F♯'],
        'mixolydian': ['G', 'A', 'B', 'C', 'D', 'E', 'F'],
        'natural-minor': ['G', 'A', 'B♭', 'C', 'D', 'E♭', 'F'],
        'harmonic-minor': ['G', 'A', 'B♭', 'C', 'D', 'E♭', 'F♯'],
        'melodic-minor': ['G', 'A', 'B♭', 'C', 'D', 'E', 'F♯'],
        'locrian': ['G', 'A♭', 'B♭', 'C', 'D♭', 'E♭', 'F']
    },
    'Ab': {
        'major': ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G'],
        'dorian': ['A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F', 'G♭'],
        'phrygian': ['A♭', 'B𝄫', 'C♭', 'D♭', 'E♭', 'F♭', 'G♭'],
        'lydian': ['A♭', 'B♭', 'C', 'D', 'E♭', 'F', 'G'],
        'mixolydian': ['A♭', 'B♭', 'C', 'D♭', 'E♭', 'F', 'G♭'],
        'natural-minor': ['A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F♭', 'G♭'],
        'harmonic-minor': ['A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F♭', 'G'],
        'melodic-minor': ['A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F', 'G'],
        'locrian': ['A♭', 'B𝄫', 'C♭', 'D♭', 'E𝄫', 'F♭', 'G♭']
    },
    'G#': {
        'major': ['G♯', 'A♯', 'B♯', 'C♯', 'D♯', 'E♯', 'F♯♯'],
        'dorian': ['G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯', 'F♯'],
        'phrygian': ['G♯', 'A', 'B', 'C♯', 'D♯', 'E', 'F♯'],
        'lydian': ['G♯', 'A♯', 'B♯', 'C♯♯', 'D♯', 'E♯', 'F♯♯'],
        'mixolydian': ['G♯', 'A♯', 'B♯', 'C♯', 'D♯', 'E♯', 'F♯'],
        'natural-minor': ['G♯', 'A♯', 'B', 'C♯', 'D♯', 'E', 'F♯'],
        'harmonic-minor': ['G♯', 'A♯', 'B', 'C♯', 'D♯', 'E', 'F♯♯'],
        'melodic-minor': ['G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯', 'F♯♯'],
        'locrian': ['G♯', 'A', 'B', 'C♯', 'D', 'E', 'F♯']
    },
    'A': {
        'major': ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G♯'],
        'dorian': ['A', 'B', 'C', 'D', 'E', 'F♯', 'G'],
        'phrygian': ['A', 'B♭', 'C', 'D', 'E', 'F', 'G'],
        'lydian': ['A', 'B', 'C♯', 'D♯', 'E', 'F♯', 'G♯'],
        'mixolydian': ['A', 'B', 'C♯', 'D', 'E', 'F♯', 'G'],
        'natural-minor': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        'harmonic-minor': ['A', 'B', 'C', 'D', 'E', 'F', 'G♯'],
        'melodic-minor': ['A', 'B', 'C', 'D', 'E', 'F♯', 'G♯'],
        'locrian': ['A', 'B♭', 'C', 'D', 'E♭', 'F', 'G']
    },
    'Bb': {
        'major': ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A'],
        'dorian': ['B♭', 'C', 'D♭', 'E♭', 'F', 'G', 'A♭'],
        'phrygian': ['B♭', 'C♭', 'D♭', 'E♭', 'F', 'G♭', 'A♭'],
        'lydian': ['B♭', 'C', 'D', 'E', 'F', 'G', 'A'],
        'mixolydian': ['B♭', 'C', 'D', 'E♭', 'F', 'G', 'A♭'],
        'natural-minor': ['B♭', 'C', 'D♭', 'E♭', 'F', 'G♭', 'A♭'],
        'harmonic-minor': ['B♭', 'C', 'D♭', 'E♭', 'F', 'G♭', 'A'],
        'melodic-minor': ['B♭', 'C', 'D♭', 'E♭', 'F', 'G', 'A'],
        'locrian': ['B♭', 'C♭', 'D♭', 'E♭', 'F♭', 'G♭', 'A♭']
    },
    'A#': {
        'major': ['A♯', 'B♯', 'C♯♯', 'D♯', 'E♯', 'F♯♯', 'G♯♯'],
        'dorian': ['A♯', 'B♯', 'C♯', 'D♯', 'E♯', 'F♯♯', 'G♯'],
        'phrygian': ['A♯', 'B', 'C♯', 'D♯', 'E♯', 'F♯', 'G♯'],
        'lydian': ['A♯', 'B♯', 'C♯♯', 'D♯♯', 'E♯', 'F♯♯', 'G♯♯'],
        'mixolydian': ['A♯', 'B♯', 'C♯♯', 'D♯', 'E♯', 'F♯♯', 'G♯'],
        'natural-minor': ['A♯', 'B♯', 'C♯', 'D♯', 'E♯', 'F♯', 'G♯'],
        'harmonic-minor': ['A♯', 'B♯', 'C♯', 'D♯', 'E♯', 'F♯', 'G♯♯'],
        'melodic-minor': ['A♯', 'B♯', 'C♯', 'D♯', 'E♯', 'F♯♯', 'G♯♯'],
        'locrian': ['A♯', 'B', 'C♯', 'D♯', 'E', 'F♯', 'G♯']
    },
    'B': {
        'major': ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A♯'],
        'dorian': ['B', 'C♯', 'D', 'E', 'F♯', 'G♯', 'A'],
        'phrygian': ['B', 'C', 'D', 'E', 'F♯', 'G', 'A'],
        'lydian': ['B', 'C♯', 'D♯', 'E♯', 'F♯', 'G♯', 'A♯'],
        'mixolydian': ['B', 'C♯', 'D♯', 'E', 'F♯', 'G♯', 'A'],
        'natural-minor': ['B', 'C♯', 'D', 'E', 'F♯', 'G', 'A'],
        'harmonic-minor': ['B', 'C♯', 'D', 'E', 'F♯', 'G', 'A♯'],
        'melodic-minor': ['B', 'C♯', 'D', 'E', 'F♯', 'G♯', 'A♯'],
        'locrian': ['B', 'C', 'D', 'E', 'F', 'G', 'A']
    }
};

// Define colors for sharp and flat notes
const DARK_RED = '#990000';
const DARK_BLUE = '#000099';

// Get the enharmonically correct key name for calculations
function getEffectiveKeyName(keyIndex, scaleName) {
    const baseKeyName = keyNames[keyIndex];

    // Logic for Db/C# at index 1
    if (keyIndex === 1) {
        switch (scaleName) {
            case 'major': case 'lydian': case 'mixolydian': return 'Db';
            default: return 'C#';
        }
    }
    // Logic for Eb/D# at index 3
    if (keyIndex === 3) {
        switch (scaleName) {
            case 'phrygian': case 'locrian': return 'D#';
            default: return 'Eb';
        }
    }
    // Logic for Gb/F# at index 6
    if (keyIndex === 6) {
        switch (scaleName) {
            case 'major': case 'lydian': return 'Gb';
            default: return 'F#';
        }
    }
    // Logic for Ab/G# at index 8
    if (keyIndex === 8) {
        switch (scaleName) {
            case 'natural-minor': case 'harmonic-minor': case 'melodic-minor': case 'phrygian': case 'locrian': return 'G#';
            default: return 'Ab';
        }
    }
    // Logic for Bb/A# at index 10
    if (keyIndex === 10) {
        switch (scaleName) {
            case 'locrian': return 'A#';
            default: return 'Bb';
        }
    }
    return baseKeyName;
}

// Generate letter names for a specific key and scale using the new lookup table
function generateLetterNamesForScale(keyName, scaleName) {
    const scale = scaleDefinitions[scaleName];
    if (!scale) return {};

    // Use the hardcoded spellings
    const notes = scaleSpellings[keyName]?.[scaleName] || [];
    const letterNames = {};

    scale.solfege.forEach((solfege, index) => {
        if (notes[index]) {
            letterNames[solfege] = notes[index];
        }
    });

    return letterNames;
}


// Generate color mappings for a specific key (colors stay tied to letter names)
function generateColorsForScale(keyName, scaleName) {
    const scale = scaleDefinitions[scaleName];
    if (!scale) return {};

    const letterNames = generateLetterNamesForScale(keyName, scaleName);
    const colors = {};

    for (const solfege in letterNames) {
        const noteName = letterNames[solfege];
        const noteLetter = noteName.charAt(0);
        colors[solfege] = KEY_COLORS[noteLetter];
    }

    return colors;
}

// Base frequencies for C Major scale (anchor for calculations)
const baseFrequencies = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'F5': 698.46, 'F3': 174.61
};

// This will hold the currently active frequencies for the selected key and scale
let noteFrequencies = {};

// Function to calculate and update note frequencies for the current key and scale
function updateNoteFrequencies() {
    const keyIndex = currentKeyIndex; // 0 for C, 1 for Db, etc.
    let rootFrequency = 261.63 * Math.pow(2, keyIndex / 12); // C4 as the base
    const scale = scaleDefinitions[currentScale];

    // Lower the octave for keys Ab, A, Bb, and B to make them the lowest
    if ([8, 9, 10, 11].includes(keyIndex)) {
        rootFrequency /= 2;
    }

    const scaleFrequencies = {};
    scale.intervals.forEach((interval, i) => {
        const solfege = scale.solfege[i];
        scaleFrequencies[solfege] = rootFrequency * Math.pow(2, interval / 12);
    });

    // Map the calculated scale frequencies to the keyboard layout
    noteFrequencies = {
        'C4': scaleFrequencies['Do'],
        'D4': scaleFrequencies['Re'],
        'E4': scaleFrequencies['Mi'] || scaleFrequencies['Me'],
        'F4': scaleFrequencies['Fa'] || scaleFrequencies['Fi'],
        'G4': scaleFrequencies['So'] || scaleFrequencies['Se'],
        'A4': scaleFrequencies['La'] || scaleFrequencies['Le'],
        'B4': scaleFrequencies['Ti'] || scaleFrequencies['Te'],
        // Octaves and other notes
        'G3': (scaleFrequencies['So'] || scaleFrequencies['Se']) / 2,
        'A3': (scaleFrequencies['La'] || scaleFrequencies['Le']) / 2,
        'B3': (scaleFrequencies['Ti'] || scaleFrequencies['Te']) / 2,
        'C5': scaleFrequencies['Do'] * 2,
        'D5': scaleFrequencies['Re'] * 2,
        'E5': (scaleFrequencies['Mi'] || scaleFrequencies['Me']) * 2,
        'F5': (scaleFrequencies['Fa'] || scaleFrequencies['Fi']) * 2,
        'F3': (scaleFrequencies['Fa'] || scaleFrequencies['Fi']) / 2,
    };

    // Handle Phrygian 'Ra' which replaces 'Re'
    if (currentScale === 'phrygian' || currentScale === 'locrian') {
        noteFrequencies['D4'] = scaleFrequencies['Ra'];
        noteFrequencies['D5'] = scaleFrequencies['Ra'] * 2;
    }
}


// Dynamic color and letter name mappings (generated based on on current key and scale)
let noteColorsByKey = {};
let letterNamesByKey = {};

// Function to update mappings when key or scale changes
function updateScaleMappings() {
  // Generate new mappings for all keys with current scale
  noteColorsByKey = {};
  letterNamesByKey = {};
  
  keyNames.forEach((key, index) => {
    // For the Db/C# key
    if (index === 1) {
        letterNamesByKey['Db'] = generateLetterNamesForScale('Db', currentScale);
        noteColorsByKey['Db'] = generateColorsForScale('Db', currentScale);
        letterNamesByKey['C#'] = generateLetterNamesForScale('C#', currentScale);
        noteColorsByKey['C#'] = generateColorsForScale('C#', currentScale);
    // For the Eb/D# key
    } else if (index === 3) {
        letterNamesByKey['Eb'] = generateLetterNamesForScale('Eb', currentScale);
        noteColorsByKey['Eb'] = generateColorsForScale('Eb', currentScale);
        letterNamesByKey['D#'] = generateLetterNamesForScale('D#', currentScale);
        noteColorsByKey['D#'] = generateColorsForScale('D#', currentScale);
    // For the Gb/F# key
    } else if (index === 6) {
        letterNamesByKey['Gb'] = generateLetterNamesForScale('Gb', currentScale);
        noteColorsByKey['Gb'] = generateColorsForScale('Gb', currentScale);
        letterNamesByKey['F#'] = generateLetterNamesForScale('F#', currentScale);
        noteColorsByKey['F#'] = generateColorsForScale('F#', currentScale);
    // For the Ab/G# key
    } else if (index === 8) {
        letterNamesByKey['Ab'] = generateLetterNamesForScale('Ab', currentScale);
        noteColorsByKey['Ab'] = generateColorsForScale('Ab', currentScale);
        letterNamesByKey['G#'] = generateLetterNamesForScale('G#', currentScale);
        noteColorsByKey['G#'] = generateColorsForScale('G#', currentScale);
    // For the Bb/A# key
    } else if (index === 10) {
        letterNamesByKey['Bb'] = generateLetterNamesForScale('Bb', currentScale);
        noteColorsByKey['Bb'] = generateColorsForScale('Bb', currentScale);
        letterNamesByKey['A#'] = generateLetterNamesForScale('A#', currentScale);
        noteColorsByKey['A#'] = generateColorsForScale('A#', currentScale);
    } else {
        letterNamesByKey[key] = generateLetterNamesForScale(key, currentScale);
        noteColorsByKey[key] = generateColorsForScale(key, currentScale);
    }
  });

  // Also update the frequencies whenever the scale or key changes
  updateNoteFrequencies();
  updateSimulatedKeyboardColors();
}

// UI state
let cButtonState = 'note'; // can be 'note' or 'S'

// Map to identify if a note is flat or sharp
const noteAccidentalMap = {
  'C': false, 'C#': 'sharp', 'C♯': 'sharp', 'Db': 'flat', 'D♭': 'flat',
  'D': false, 'D#': 'sharp', 'D♯': 'sharp', 'Eb': 'flat', 'E♭': 'flat',
  'E': false, 'E#': 'sharp', 'E♯': 'sharp', 'Fb': 'flat', 'F♭': 'flat',
  'F': false, 'F#': 'sharp', 'F♯': 'sharp', 'Gb': 'flat', 'G♭': 'flat',
  'G': false, 'G#': 'sharp', 'G♯': 'sharp', 'Ab': 'flat', 'A♭': 'flat',
  'A': false, 'A#': 'sharp', 'A♯': 'sharp', 'Bb': 'flat', 'B♭': 'flat',
  'B': false, 'B#': 'sharp', 'B♯': 'sharp', 'Cb': 'flat', 'C♭': 'flat',
  // Double flats and sharps
  'Cbb': 'double-flat', 'Dbb': 'double-flat', 'Ebb': 'double-flat', 'Fbb': 'double-flat', 'Gbb': 'double-flat', 'Abb': 'double-flat', 'Bbb': 'double-flat',
  'C𝄫': 'double-flat', 'D𝄫': 'double-flat', 'E𝄫': 'double-flat', 'F𝄫': 'double-flat', 'G𝄫': 'double-flat', 'A𝄫': 'double-flat', 'B𝄫': 'double-flat',
  'Cx': 'double-sharp', 'Dx': 'double-sharp', 'Ex': 'double-sharp', 'Fx': 'double-sharp', 'Gx': 'double-sharp', 'Ax': 'double-sharp', 'Bx': 'double-sharp',
  'C♯♯': 'double-sharp', 'D♯♯': 'double-sharp', 'E♯♯': 'double-sharp', 'F♯♯': 'double-sharp', 'G♯♯': 'double-sharp', 'A♯♯': 'double-sharp', 'B♯♯': 'double-sharp',
};

const buttonSolfegeNames = {
    'n': 'Fa', 'm': 'So', ',': 'La', '.': 'Ti', 'h': 'Ti', 'j': 'Do',
    '/': 'Do', 'k': 'Re', 'l': 'Mi', ';': 'Fa', 'y': 'Fa', 'u': 'So',
    'i': 'La', 'o': 'Ti', '6': 'Ti', 'p': 'Do', '7': 'Do', '8': 'Re',
    '9': 'Mi', '0': 'Fa'
};

const shiftedKeyMapping = {
    '^': '6',
    '&': '7',
    '*': '8',
    '(': '9',
    ')': '0',
    ':': ';',
    '<': ',',
    '>': '.',
    '?': '/'
};

const solfegeToCssClass = {
    'Do': 'key-do',
    'Re': 'key-re', 'Ra': 'key-re',
    'Mi': 'key-mi', 'Me': 'key-mi',
    'Fa': 'key-fa', 'Fi': 'key-fa',
    'So': 'key-so', 'Se': 'key-so',
    'La': 'key-la', 'Le': 'key-la',
    'Ti': 'key-ti', 'Te': 'key-ti',
};

// Function to get current solfege syllable for a key based on current scale
function getCurrentSolfege(key) {
  const baseSolfege = buttonSolfegeNames[key];
  if (!baseSolfege) return null;
  
  const scale = scaleDefinitions[currentScale];
  if (!scale) return baseSolfege;
  
  // Map major scale positions to current scale positions
  const majorSolfege = ['Do', 'Re', 'Mi', 'Fa', 'So', 'La', 'Ti'];
  const majorIndex = majorSolfege.indexOf(baseSolfege);
  
  if (majorIndex !== -1 && scale.solfege[majorIndex]) {
    return scale.solfege[majorIndex];
  }
  
  return baseSolfege;
}

// Audio synthesis setup
const harmonics = 20;
const real = new Float32Array(harmonics);
const imag = new Float32Array(harmonics);
real[1] = 1;
real[2] = 0.15;
real[3] = 0.1;
real[4] = 0.05;
for (let i = 5; i < harmonics; i++) real[i] = 0;
const customVoiceWave = context.createPeriodicWave(real, imag);

// Audio state
const activeOscillators = {};
const heldKeys = new Set();
const heldNoteKeys = new Set();
let sharpTouchHeld = false;
let flatTouchHeld = false;

// --- AUDIO FUNCTIONS ---

function startNote(key, freq) {
  stopNote(key);

  const now = context.currentTime;
  let osc, gain, lfo, lfoGain, filter;

  gain = context.createGain();
  gain.gain.setValueAtTime(0, now);

  if (currentWaveform === "voice") {
    osc = context.createOscillator();
    osc.setPeriodicWave(customVoiceWave);
    osc.frequency.value = freq;

    lfo = context.createOscillator();
    lfoGain = context.createGain();
    lfo.frequency.setValueAtTime(1.5, now);
    lfo.frequency.linearRampToValueAtTime(5, now + 1);
    lfoGain.gain.setValueAtTime(2.0, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 1;

    osc.connect(filter);
    filter.connect(gain);

    const attackTime = 0.08;
    const decayTime = 0.18;
    const sustainLevel = globalVolume * 0.5;
    const maxLevel = globalVolume * 0.85;

    gain.gain.linearRampToValueAtTime(maxLevel, now + attackTime);
    gain.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);

    gain.connect(compressor);
    osc.start();

    activeOscillators[key] = { osc, gain, lfo, lfoGain, filter };
  } else {
    osc = context.createOscillator();
    osc.type = currentWaveform;
    osc.frequency.value = freq;

    filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 1;

    osc.connect(filter);
    filter.connect(gain);

    let targetVolume = globalVolume;
    if (currentWaveform === 'sawtooth' || currentWaveform === 'square') {
        targetVolume *= 0.9; // Reduce volume by 10%
    }
    const attackTime = 0.015;
    
    gain.gain.linearRampToValueAtTime(targetVolume, now + attackTime);

    gain.connect(compressor);
    osc.start();

    activeOscillators[key] = { osc, gain, filter };
  }
}

function stopNote(key) {
  const active = activeOscillators[key];
  if (!active) return;

  const now = context.currentTime;

  if (active.osc) {
    const gain = active.gain;

    if (currentWaveform === "voice") {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      const releaseTime = 0.6;
      const stopBuffer = 0.1;
      gain.gain.linearRampToValueAtTime(0.0001, now + releaseTime);
      active.osc.stop(now + releaseTime + stopBuffer);
      if (active.lfo) active.lfo.stop(now + releaseTime + stopBuffer);
    } else {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      const releaseTime = 0.2;
      const stopBuffer = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
      active.osc.stop(now + releaseTime + stopBuffer);
    }
  }

  delete activeOscillators[key];
}

function handlePlayKey(key) {
  const btn = buttons.find(b => b.keys.includes(key));
  if (!btn) return;
  heldNoteKeys.add(key);
  
  const accidentalShift = accidentalArmed.sharp ? 1 : (accidentalArmed.flat ? -1 : 0);
  const octaveMultiplier = octaveShiftActive ? 2 : 1;
  const oscKey = `${key}_${accidentalShift}_${octaveShiftActive ? 1 : 0}`;
  
  if (!noteFrequencies[btn.note]) {
      console.warn(`Frequency for note ${btn.note} not found.`);
      return;
  }
  
  const baseFreq = noteFrequencies[btn.note];
  const accidentalFreq = baseFreq * Math.pow(2, accidentalShift / 12);
  const finalFreq = accidentalFreq * octaveMultiplier;
  
  startNote(oscKey, finalFreq);
}

function handleStopKey(key) {
  heldNoteKeys.delete(key);
  for (const acc of [-1, 0, 1]) {
    for (const oct of [0, 1]) {
      stopNote(`${key}_${acc}_${oct}`);
    }
  }
}

function reTriggerHeldKeysAccidentals() {
    // This function is temporarily disabled until we re-add accidentals.
}

// --- GRID SETUP ---
const positions = {
  '10a': [9, 0], '10b': [9, 1], '10c': [9, 2], '10d': [9, 3],
  '3a': [2, 0], '4a': [3, 0], '3b': [2, 1], '4b': [3, 1], '3c': [2, 2], '4c': [3, 2],
  '5a': [4, 0], '6a': [5, 0],
  '5b': [4, 1], '6b': [5, 1], '7b': [6, 1], '5c': [4, 2], '6c': [5, 2], '7c': [6, 2],
  '8b': [7, 1], '8c': [7, 2],
  '9b': [8, 1], '9c': [8, 2],
  '4d': [3, 3], '3d': [2, 3],
  '2c': [1, 2], '2d': [1, 3],
  '1c': [0, 2], '1d': [0, 3]
};

const buttons = [
    { name: 'Fa', keys: [';', 'y'], note: 'F4', cells: ['3a', '4a'] },
    { name: 'So', keys: ['m'], note: 'G3', cells: ['9b', '9c'] },
    { name: 'Mi', keys: ['l'], note: 'E4', cells: ['5a'] },
    { name: 'Re', keys: ['k'], note: 'D4', cells: ['6a'] },
    { name: 'Do', keys: ['j', '/'], note: 'C4', cells: ['5b', '6b', '7b', '5c', '6c', '7c'] },
    { name: 'La', keys: [','], note: 'A3', cells: ['8b'] },
    { name: 'Ti', keys: ['.', 'h'], note: 'B3', cells: ['8c'] },
    { name: 'So', keys: ['u'], note: 'G4', cells: ['3b', '4b', '3c', '4c'] },
    { name: 'La', keys: ['i'], note: 'A4', cells: ['4d'] },
    { name: 'Ti', keys: ['o', '6'], note: 'B4', cells: ['3d'] },
    { name: 'Do', keys: ['p', '7'], note: 'C5', cells: ['2c', '2d'] },
    { name: 'Re', keys: ['8'], note: 'D5', cells: ['1c'] },
    { name: 'Mi', keys: ['9'], note: 'E5', cells: ['1d'] },
    { name: 'Fa', keys: ['0'], note: 'F5', cells: [] },
    { name: 'Fa', keys: ['n'], note: 'F3', cells: [] }
];


// DOM references
const grid = document.getElementById('grid');
const keyToDiv = {};
const cellRefs = {};
const noteButtonRefs = {};

// --- UI SETUP ---
function initializeGrid() {
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 4; c++) {
      const div = document.createElement('div');
      div.className = 'cell';
      div.style.top = (r * (100 / 11)) + '%';
      div.style.left = (c * (100 / 4)) + '%';
      div.style.width = (100 / 4 - 0.5) + '%';
      div.style.height = (100 / 11 - 0.5) + '%';
      const rowNum = r + 1;
      const colLetter = String.fromCharCode(97 + c);
      cellRefs[`${rowNum}${colLetter}`] = div;
      grid.appendChild(div);
    }
  }
}

function renderToggleButton() {
  const el = document.createElement('button');
  el.className = 'chord-toggle-btn';
  el.setAttribute('type', 'button');
  el.setAttribute('aria-pressed', cButtonState === 'S');
  if (cButtonState === 'note') {
    el.innerHTML = '<span class="music-symbol">&#9835;</span>';
  } else {
    el.innerText = 'S';
  }
  el.addEventListener('click', () => {
    cButtonState = (cButtonState === 'note') ? 'S' : 'note';
    updateBoxNames();
  });
  el.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      cButtonState = (cButtonState === 'note') ? 'S' : 'note';
      updateBoxNames();
    }
  });
  // MOVED: The toggle button is now in cell 6d.
  cellRefs['6d'].innerHTML = '';
  cellRefs['6d'].appendChild(el);
}

function setupAccidentalButtons() {
    const sharpBtn = document.createElement('div');
    sharpBtn.id = 'sharp-btn';
    sharpBtn.className = 'accidental-btn';
    sharpBtn.textContent = '♯';
    cellRefs['7d'].appendChild(sharpBtn);

    const flatBtn = document.createElement('div');
    flatBtn.id = 'flat-btn';
    flatBtn.className = 'accidental-btn';
    flatBtn.textContent = '♭';
    cellRefs['8d'].appendChild(flatBtn);

    // Event handlers for pressing/releasing accidental buttons
    const pressSharp = (e) => {
        e.preventDefault();
        accidentalArmed = { sharp: true, flat: false };
        sharpBtn.classList.add('active');
        flatBtn.classList.remove('active');
    };

    const pressFlat = (e) => {
        e.preventDefault();
        accidentalArmed = { sharp: false, flat: true };
        flatBtn.classList.add('active');
        sharpBtn.classList.remove('active');
    };

    const releaseAccidental = (e) => {
        e.preventDefault();
        accidentalArmed = { sharp: false, flat: false };
        sharpBtn.classList.remove('active');
        flatBtn.classList.remove('active');
    };

    // Mouse events
    sharpBtn.addEventListener('mousedown', pressSharp);
    sharpBtn.addEventListener('mouseup', releaseAccidental);
    sharpBtn.addEventListener('mouseleave', releaseAccidental);
    flatBtn.addEventListener('mousedown', pressFlat);
    flatBtn.addEventListener('mouseup', releaseAccidental);
    flatBtn.addEventListener('mouseleave', releaseAccidental);

    // Touch events
    sharpBtn.addEventListener('touchstart', pressSharp, { passive: false });
    sharpBtn.addEventListener('touchend', releaseAccidental);
    sharpBtn.addEventListener('touchcancel', releaseAccidental);
    flatBtn.addEventListener('touchstart', pressFlat, { passive: false });
    flatBtn.addEventListener('touchend', releaseAccidental);
    flatBtn.addEventListener('touchcancel', releaseAccidental);
}

// --- MODIFIED FUNCTION for 8va button ---
function setupOctaveButton() {
    const octaveBtn = document.createElement('div');
    octaveBtn.id = 'octave-btn';
    octaveBtn.className = 'control-btn octave-btn';
    octaveBtn.innerHTML = '8<sup class="octave-sup">va</sup>';
    cellRefs['5d'].appendChild(octaveBtn);

    // Add toggle functionality
    octaveBtn.addEventListener('click', () => {
        // Toggle the global octave shift state
        octaveShiftActive = !octaveShiftActive;
        
        // Toggle the 'active' class for visual feedback
        octaveBtn.classList.toggle('active', octaveShiftActive);
    });
}

function updateBoxNames() {
  const currentKey = getEffectiveKeyName(currentKeyIndex, currentScale);

  for (const btn of buttons) {
    const div = noteButtonRefs[btn.keys[0]];
    if (!div) continue;

    if (cButtonState === 'note') {
      // Get the current solfege syllable for this scale
      const currentSolfege = getCurrentSolfege(btn.keys[0]);
      div.textContent = currentSolfege || btn.name;
      
      const noteValue = letterNamesByKey[currentKey] && letterNamesByKey[currentKey][currentSolfege];

      if (noteValue && (noteAccidentalMap[noteValue] === 'flat' || noteAccidentalMap[noteValue] === 'double-flat')) {
        div.style.color = DARK_BLUE;
      } else if (noteValue && (noteAccidentalMap[noteValue] === 'sharp' || noteAccidentalMap[noteValue] === 'double-sharp')) {
        div.style.color = DARK_RED;
      } else {
        div.style.color = 'white';
      }
    }
    else {
      // Show letter names
      const currentSolfege = getCurrentSolfege(btn.keys[0]);
      const noteValue = letterNamesByKey[currentKey] && letterNamesByKey[currentKey][currentSolfege];
      div.textContent = noteValue || currentSolfege;

      if (noteValue && (noteAccidentalMap[noteValue] === 'flat' || noteAccidentalMap[noteValue] === 'double-flat')) {
        div.style.color = DARK_BLUE;
      } else if (noteValue && (noteAccidentalMap[noteValue] === 'sharp' || noteAccidentalMap[noteValue] === 'double-sharp')) {
        div.style.color = DARK_RED;
      } else {
        div.style.color = 'white';
      }
    }
  }
}

function createControlsBar() {
  const controlsBar = document.getElementById('controls-bar');
  controlsBar.innerHTML = ''; // Clear existing controls
  
  const keyButton = document.createElement('div');
  keyButton.className = 'control-area';
  keyButton.tabIndex = 0;
  keyButton.setAttribute('aria-label', 'Key control');
  keyButton.innerHTML = '<div class="arrow" id="key-left">&#9664;</div><div id="key-name">C</div><div class="arrow" id="key-right">&#9654;</div>';

  const scaleControl = document.createElement('div');
  scaleControl.className = 'control-area scale-control';
  scaleControl.tabIndex = 0;
  scaleControl.setAttribute('aria-label', 'Scale control');
  
  const scaleOptions = Object.entries(scaleDefinitions)
    .map(([key, scale]) => `<option value="${key}" ${key === currentScale ? 'selected' : ''}>${scale.name}</option>`)
    .join('');
  scaleControl.innerHTML = `<select id="scale-select" class="scale-dropdown">${scaleOptions}</select>`;

  const waveButton = document.createElement('div');
  waveButton.className = 'control-area';
  waveButton.tabIndex = 0;
  waveButton.setAttribute('aria-label', 'Waveform control');
  waveButton.innerHTML = '<div class="arrow" id="left-arrow">&#9664;</div><div id="waveform-name">triangle</div><div class="arrow" id="right-arrow">&#9654;</div>';

  const keyboardButton = document.createElement('div');
  keyboardButton.className = 'control-area keyboard-button';
  keyboardButton.tabIndex = 0;
  keyboardButton.setAttribute('aria-label', 'Keyboard view toggle');
  keyboardButton.textContent = 'Keyboard';
  keyboardButton.id = 'keyboard-button';

  // Group key and scale controls vertically
  const keyScaleGroup = document.createElement('div');
  keyScaleGroup.className = 'control-group';
  keyScaleGroup.appendChild(keyButton);
  keyScaleGroup.appendChild(scaleControl);
  
  // Group waveform and keyboard controls vertically
  const waveKeyboardGroup = document.createElement('div');
  waveKeyboardGroup.className = 'control-group';
  waveKeyboardGroup.appendChild(waveButton);
  waveKeyboardGroup.appendChild(keyboardButton);

  controlsBar.appendChild(keyScaleGroup);
  controlsBar.appendChild(waveKeyboardGroup);

  return { keyButton, scaleControl, waveButton, keyboardButton };
}

function darkenColor(hex, percent) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    r = parseInt(r * (100 - percent) / 100);
    g = parseInt(g * (100 - percent) / 100);
    b = parseInt(b * (100 - percent) / 100);
    r = (r < 0) ? 0 : r;
    g = (g < 0) ? 0 : g;
    b = (b < 0) ? 0 : b;
    const rHex = (r.toString(16).length === 1) ? '0' + r.toString(16) : r.toString(16);
    const gHex = (g.toString(16).length === 1) ? '0' + g.toString(16) : g.toString(16);
    const bHex = (b.toString(16).length === 1) ? '0' + b.toString(16) : b.toString(16);
    return `#${rHex}${gHex}${bHex}`;
}

function updateControlsBarColor() {
    const keyName = getEffectiveKeyName(currentKeyIndex, currentScale);
    const baseNote = keyName.charAt(0);
    const color = KEY_COLORS[baseNote] || '#001f3f';
    const borderColor = darkenColor(color, 30);
    
    const controlsBar = document.getElementById('controls-bar');
    controlsBar.style.backgroundColor = color;
    controlsBar.style.borderColor = borderColor;
}

function setupControlEvents() {
  document.getElementById("key-left").onclick = () => {
    currentKeyIndex = (currentKeyIndex - 1 + keyNames.length) % keyNames.length;
    document.getElementById("key-name").textContent = getEffectiveKeyName(currentKeyIndex, currentScale);
    updateScaleMappings();
    updateSolfegeColors();
    updateBoxNames();
    updateControlsBarColor();
  };
  
  document.getElementById("key-right").onclick = () => {
    currentKeyIndex = (currentKeyIndex + 1) % keyNames.length;
    document.getElementById("key-name").textContent = getEffectiveKeyName(currentKeyIndex, currentScale);
    updateScaleMappings();
    updateSolfegeColors();
    updateBoxNames();
    updateControlsBarColor();
  };
  
  const scaleSelect = document.getElementById("scale-select");
  scaleSelect.onchange = (e) => {
    currentScale = e.target.value;
    const selectedScaleKey = e.target.value;
    const scaleKey = Object.keys(scaleDefinitions).find(key => key === selectedScaleKey) || 'major';
    currentScale = scaleKey;
    
    // Update the key name display in case it's an enharmonic key
    document.getElementById("key-name").textContent = getEffectiveKeyName(currentKeyIndex, currentScale);

    updateScaleMappings();
    updateSolfegeColors();
    updateBoxNames();
    e.target.blur(); // Remove focus from the dropdown
  };

  // Prevent letter keys from changing the dropdown selection
  scaleSelect.onkeydown = (e) => {
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
      e.preventDefault();
    }
  };
  
  document.getElementById("left-arrow").onclick = () => {
    currentWaveformIndex = (currentWaveformIndex - 1 + waveforms.length) % waveforms.length;
    currentWaveform = waveforms[currentWaveformIndex];
    document.getElementById("waveform-name").textContent = currentWaveform;
  };
  
  document.getElementById("right-arrow").onclick = () => {
    currentWaveformIndex = (currentWaveformIndex + 1) % waveforms.length;
    currentWaveform = waveforms[currentWaveformIndex];
    document.getElementById("waveform-name").textContent = currentWaveform;
  };

  const keyboardButton = document.getElementById('keyboard-button');
  const modal = document.getElementById('keyboard-modal');
  const closeButton = document.querySelector('.close-button');

  keyboardButton.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });
}

function renderButtons() {
  buttons.forEach(btn => {
    if (btn.cells.length === 0) return;

    const div = document.createElement('div');
    div.className = 'note-button';
    
    const currentSolfege = getCurrentSolfege(btn.keys[0]);
    div.textContent = currentSolfege || btn.name;
    
    div.style.outline = 'none';
    div.setAttribute('data-keys', btn.keys.join(','));
    
    const currentKey = getEffectiveKeyName(currentKeyIndex, currentScale);
    const color = (noteColorsByKey[currentKey] && noteColorsByKey[currentKey][currentSolfege]) || '#ccc';
    div.style.backgroundColor = color;
    
    const rows = [...new Set(btn.cells.map(c => positions[c][0]))];
    const cols = [...new Set(btn.cells.map(c => positions[c][1]))];
    const top = Math.min(...rows) * (100 / 11);
    const left = Math.min(...cols) * (100 / 4);
    const height = rows.length * (100 / 11) - 0.5;
    const width = cols.length * (100 / 4) - 0.5;
    
    div.style.top = `${top}%`;
    div.style.left = `${left}%`;
    div.style.height = `${height}%`;
    div.style.width = `${width}%`;

    // Add event listeners directly to the note buttons
    let isPressed = false;
    const startAction = (e) => {
        e.preventDefault();
        isPressed = true;
        handlePlayKey(btn.keys[0]);
        div.classList.add('active');
    };
    const endAction = () => {
        if (!isPressed) return;
        isPressed = false;
        handleStopKey(btn.keys[0]);
        div.classList.remove('active');
    };

    div.addEventListener('mousedown', startAction);
    div.addEventListener('mouseup', endAction);
    div.addEventListener('mouseleave', endAction);
    div.addEventListener('touchstart', startAction, { passive: false });
    div.addEventListener('touchend', endAction);
    div.addEventListener('touchcancel', endAction);

    grid.appendChild(div);
    btn.keys.forEach(k => {
      keyToDiv[k] = div;
      noteButtonRefs[k] = div;
    });
  });
}

function setupGlobalEventHandlers() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      for (const key of [...heldNoteKeys]) {
        handleStopKey(key);
      }
      heldNoteKeys.clear();
      document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    }
  });

  window.addEventListener('blur', () => {
    const activeOscKeys = Object.keys(activeOscillators);
    if (activeOscKeys.length > 0) {
      for (const key of activeOscKeys) {
        stopNote(key);
      }
    }
  });
}

function updateSolfegeColors() {
  const currentKey = getEffectiveKeyName(currentKeyIndex, currentScale);
  const bgColors = noteColorsByKey[currentKey];
  
  buttons.forEach(btn => {
    const div = keyToDiv[btn.keys[0]];
    if (div) {
      const currentSolfege = getCurrentSolfege(btn.keys[0]);
      
      if (bgColors && bgColors[currentSolfege]) {
        div.style.backgroundColor = bgColors[currentSolfege];
      }

      const noteValue = letterNamesByKey[currentKey] && letterNamesByKey[currentKey][currentSolfege];

      if (noteValue && (noteAccidentalMap[noteValue] === 'flat' || noteAccidentalMap[noteValue] === 'double-flat')) {
          div.style.color = DARK_BLUE;
      } else if (noteValue && (noteAccidentalMap[noteValue] === 'sharp' || noteAccidentalMap[noteValue] === 'double-sharp')) {
          div.style.color = DARK_RED;
      } else {
        div.style.color = 'white';
      }
    }
  });
}

function updateSimulatedKeyboardColors() {
    const currentKey = getEffectiveKeyName(currentKeyIndex, currentScale);
    const letterNames = letterNamesByKey[currentKey];
    if (!letterNames) return;

    const simulatedKeys = document.querySelectorAll('#simulated-keyboard .key[data-key]');
    
    simulatedKeys.forEach(keyEl => {
        const key = keyEl.getAttribute('data-key');
        const solfege = getCurrentSolfege(key);

        Object.values(solfegeToCssClass).forEach(className => keyEl.classList.remove(className));
        
        const isAccidentalKey = keyEl.classList.contains('key-sharp') || keyEl.classList.contains('key-flat');
        if (!isAccidentalKey) {
            keyEl.style.color = '';
        }

        if (solfege) {
            const noteNameForColor = letterNames[solfege];
            if (noteNameForColor) {
                const noteLetter = noteNameForColor.charAt(0);
                const baseSolfege = scaleDefinitions.major.solfege.find((s, i) => scaleSpellings.C.major[i] === noteLetter);
                const cssClass = solfegeToCssClass[baseSolfege];
                if (cssClass) {
                    keyEl.classList.add(cssClass);
                }
            }

            const noteValue = letterNames[solfege];
            if (noteValue) {
                const accidental = noteAccidentalMap[noteValue];
                if (accidental === 'sharp' || accidental === 'double-sharp') {
                    keyEl.style.color = DARK_RED;
                } else if (accidental === 'flat' || accidental === 'double-flat') {
                    keyEl.style.color = DARK_BLUE;
                }
            }
        }
    });
}

function setupSimulatedKeyboardEvents() {
    const simulatedKeys = document.querySelectorAll('#simulated-keyboard .key[data-key]');
    simulatedKeys.forEach(keyElement => {
        const key = keyElement.getAttribute('data-key');

        const handlePress = (e) => {
            e.preventDefault();
            keyElement.classList.add('pressed');
            if (buttonSolfegeNames[key]) {
                handlePlayKey(key);
                if (keyToDiv[key]) keyToDiv[key].classList.add('active');
            }
        };

        const handleRelease = (e) => {
            e.preventDefault();
            keyElement.classList.remove('pressed');
            if (buttonSolfegeNames[key]) {
                handleStopKey(key);
                if (keyToDiv[key]) keyToDiv[key].classList.remove('active');
            }
        };

        keyElement.addEventListener('mousedown', handlePress);
        keyElement.addEventListener('mouseup', handleRelease);
        keyElement.addEventListener('mouseleave', handleRelease);

        keyElement.addEventListener('touchstart', handlePress);
        keyElement.addEventListener('touchend', handleRelease);
        keyElement.addEventListener('touchcancel', handleRelease);
    });
}

function resizeGrid() {
  const gridEl = document.getElementById('grid');
  const gridWrapper = document.querySelector('.proportional-grid-wrapper');
  const gwRect = gridWrapper.getBoundingClientRect();
  const availableWidth = gwRect.width;
  const availableHeight = gwRect.height;
  const aspectW = 4;
  const aspectH = 11;
  
  let gridWidth = availableHeight * (aspectW/aspectH);
  let gridHeight = availableHeight;
  
  if (gridWidth > availableWidth) {
    gridWidth = availableWidth;
    gridHeight = availableWidth * (aspectH/aspectW);
  }
  
  gridEl.style.width = gridWidth + 'px';
  gridEl.style.height = gridHeight + 'px';
  gridEl.style.marginLeft = "2%";
  gridEl.style.marginRight = "auto";
  gridEl.style.marginTop = "0";
  gridEl.style.marginBottom = "0";
  
  const fontSize = Math.min(gridHeight / 11, gridWidth / 4) * 0.5;
  gridEl.querySelectorAll('.note-button').forEach(div => {
    div.style.fontSize = fontSize + 'px';
  });
  gridEl.querySelectorAll('.cell').forEach(div => {
    div.style.fontSize = fontSize + 'px';
  });
  
  const toggleBtn = cellRefs['6d']?.querySelector('.chord-toggle-btn');
  if (toggleBtn) toggleBtn.style.fontSize = Math.max(fontSize * 1.1, 20) + 'px';
}

// --- INITIALIZATION ---
function initialize() {
  initializeGrid();
  renderToggleButton();
  setupAccidentalButtons();
  setupOctaveButton(); // Add the new 8va button
  createControlsBar();
  setupControlEvents();
  renderButtons();
  setupGlobalEventHandlers();
  setupSimulatedKeyboardEvents();
  
  window.addEventListener('resize', resizeGrid);
  window.addEventListener('DOMContentLoaded', () => { 
    setTimeout(() => { 
      resizeGrid(); 
      updateSolfegeColors(); 
      updateBoxNames(); 
    }, 1); 
  });
  
  setTimeout(() => { 
    resizeGrid(); 
    updateScaleMappings();
    updateSolfegeColors(); 
    updateBoxNames(); 
    updateControlsBarColor();
  }, 200);
  
  const mq = window.matchMedia("(max-width: 550px)");
  mq.addEventListener("change", () => { 
    resizeGrid(); 
    updateSolfegeColors(); 
    updateBoxNames(); 
  });

  updateScaleMappings();
  updateSolfegeColors();
  updateBoxNames();
  updateControlsBarColor();
}

// Start the application
initialize();

// --- MASTER CONTROL LISTENER ---
window.addEventListener('message', function(event) {
    if (event.origin.startsWith('null') || event.origin.startsWith('file')) {
        // Allow local development
    } else if (event.origin !== window.location.origin) {
        return;
    }

    const data = event.data;
    if (!data || !data.type) return;

    // MODIFIED: Set octave shift based on Shift key OR CapsLock state from parent
    if (typeof data.shiftKey === 'boolean' || typeof data.capsLockActive === 'boolean') {
        const keyboardOctaveShift = data.shiftKey || data.capsLockActive;
        // The button and keyboard can independently activate the octave shift
        const octaveBtn = document.getElementById('octave-btn');
        const buttonOctaveShift = octaveBtn ? octaveBtn.classList.contains('active') : false;

        octaveShiftActive = keyboardOctaveShift || buttonOctaveShift;
    }

    switch (data.type) {
        case 'resumeAudio':
            if (context.state === 'suspended') {
                context.resume().then(() => {
                    console.log('Note App AudioContext resumed successfully.');
                });
            }
            break;
        case 'keydown': {
            const originalKey = data.key;
            // Map shifted symbols back to their base key, otherwise use the original key
            const mappedKey = shiftedKeyMapping[originalKey] || originalKey;
            const key = mappedKey.toLowerCase();

            if (heldKeys.has(key)) return; 
            heldKeys.add(key);

            if (key === '=') {
                accidentalArmed = { sharp: true, flat: false };
                document.getElementById('sharp-btn')?.classList.add('active');
                document.getElementById('flat-btn')?.classList.remove('active');
            } else if (key === '-') {
                accidentalArmed = { sharp: false, flat: true };
                document.getElementById('flat-btn')?.classList.add('active');
                document.getElementById('sharp-btn')?.classList.remove('active');
            } else if (buttonSolfegeNames[key]) {
                handlePlayKey(key);
                if (keyToDiv[key]) keyToDiv[key].classList.add('active');
            }
            break;
        }
        case 'keyup': {
            const originalKey = data.key;
            const mappedKey = shiftedKeyMapping[originalKey] || originalKey;
            const key = mappedKey.toLowerCase();
            
            heldKeys.delete(key);
            if (key === '=' || key === '-') {
                accidentalArmed = { sharp: false, flat: false };
                document.getElementById('sharp-btn')?.classList.remove('active');
                document.getElementById('flat-btn')?.classList.remove('active');
            } else if (buttonSolfegeNames[key]) {
                handleStopKey(key);
                if (keyToDiv[key]) keyToDiv[key].classList.remove('active');
            }
            break;
        }
        case 'setKey':
            currentKeyIndex = data.keyIndex;
            if (document.getElementById("key-name")) {
                document.getElementById("key-name").textContent = getEffectiveKeyName(currentKeyIndex, currentScale);
            }
            updateScaleMappings();
            updateSolfegeColors();
            updateBoxNames();
            updateControlsBarColor();
            break;
        case 'setScale':
            currentScale = data.scale;
            const scaleSelect = document.getElementById("scale-select");
            if (scaleSelect) {
                scaleSelect.value = data.scale;
            }
            if (document.getElementById("key-name")) {
                document.getElementById("key-name").textContent = getEffectiveKeyName(currentKeyIndex, currentScale);
            }
            updateScaleMappings();
            updateSolfegeColors();
            updateBoxNames();
            break;
        case 'toggleNames':
            cButtonState = (cButtonState === 'note') ? 'S' : 'note';
            updateBoxNames();
            break;
        case 'setWaveform':
            const newWaveformName = data.waveform;
            const newIndex = waveforms.indexOf(newWaveformName);
            if (newIndex !== -1) {
                currentWaveformIndex = newIndex;
                currentWaveform = newWaveformName;
                const waveformNameEl = document.getElementById("waveform-name");
                if (waveformNameEl) {
                    waveformNameEl.textContent = currentWaveform;
                }
            }
            break;
    }
});

// --- POINTER OVERLAY LISTENER ---
const activePointers = new Map();
window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || data.type !== 'simulatedPointer') return;

    const currentElement = document.elementFromPoint(data.x, data.y);
    const pointerInfo = activePointers.get(data.id);

    if (data.eventType === 'start') {
        if (!currentElement) return;

        // Check if the element is a clickable button and dispatch a native event
        if (currentElement.classList.contains('note-button') || currentElement.classList.contains('accidental-btn') || currentElement.classList.contains('octave-btn')) {
             activePointers.set(data.id, currentElement);
             // Dispatch a real mousedown event which our other listeners can pick up
             currentElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
             // For the octave button, we can just trigger a click
             if (currentElement.classList.contains('octave-btn')) {
                currentElement.click();
             }
        }

    } else if (data.eventType === 'move') {
        if (!pointerInfo) return;
        if (pointerInfo !== currentElement) {
            // Moved off the original element
            pointerInfo.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true, cancelable: true }));
            activePointers.delete(data.id);
        }
    } else if (data.eventType === 'end') {
        if (!pointerInfo) return;
        pointerInfo.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        activePointers.delete(data.id);
    }
});
