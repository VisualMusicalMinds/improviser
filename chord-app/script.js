// --- AUDIO & STATE ---
const context = new (window.AudioContext || window.webkitAudioContext)();

// --- NEW AUDIO ENGINE ---

// Master audio chain setup
const mixBus = context.createGain();

const masterHP = context.createBiquadFilter();
masterHP.type = 'highpass';
masterHP.frequency.value = 100; // Cut off rumble

const masterLP = context.createBiquadFilter();
masterLP.type = 'lowpass';
masterLP.frequency.value = 10000; // Tame harsh highs

const compressor = context.createDynamicsCompressor();
// Polite compressor settings
compressor.threshold.value = -24; // dB
compressor.knee.value = 30;       // dB
compressor.ratio.value = 4;       // 4:1 ratio
compressor.attack.value = 0.01;   // 10ms attack
compressor.release.value = 0.25;  // 250ms release

const masterGain = context.createGain();
masterGain.gain.value = 0.9; // Master volume, leaves headroom

// Connect the master chain
mixBus.connect(masterHP);
masterHP.connect(masterLP);
masterLP.connect(compressor);
compressor.connect(masterGain);
masterGain.connect(context.destination);

const waveforms = ['sine', 'triangle', 'square', 'sawtooth', 'voice'];
let currentWaveformIndex = 1;
let currentWaveform = waveforms[currentWaveformIndex];

const keyNames = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const minorKeyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'B♭', 'B']; // For display only
const mixolydianKeyNames = ['C', 'C#', 'D', 'E♭', 'E', 'F', 'F#', 'G', 'A♭', 'A', 'B♭', 'B'];
const locrianKeyNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
let currentKeyIndex = 0;
let currentScale = 'Major'; // New state for the scale

// --- NEW FUNCTION ---
// Get the enharmonically correct key name for UI display based on the scale
function getDisplayNameForKey(keyIndex, scaleName) {
    const sharpMinorScales = ['Natural Minor', 'Harmonic Minor', 'Melodic Minor'];

    switch (keyIndex) {
        case 1: // D♭/C#
            return [...sharpMinorScales, 'Dorian', 'Phrygian', 'Locrian', 'Mixolydian'].includes(scaleName) ? 'C#' : 'D♭';
        case 3: // E♭/D#
            return ['Phrygian', 'Locrian'].includes(scaleName) ? 'D#' : 'E♭';
        case 6: // G♭/F#
            return ['Major', 'Lydian'].includes(scaleName) ? 'G♭' : 'F#';
        case 8: // A♭/G#
            return ['Dorian', 'Major', 'Lydian', 'Mixolydian'].includes(scaleName) ? 'A♭' : 'G#';
        case 10: // B♭/A#
            return ['Locrian'].includes(scaleName) ? 'A#' : 'B♭';
        default:
            return keyNames[keyIndex];
    }
}


const baseFrequencies = {
    // Octave 3
    'C3': 130.81, 'B#2': 130.81, 'D♭♭3': 130.81,
    'C#3': 138.59, 'D♭3': 138.59,
    'D3': 146.83, 'C##3': 146.83, 'E♭♭3': 146.83,
    'D#3': 155.56, 'E♭3': 155.56, 'F♭3': 155.56,
    'E3': 164.81, 'F♭♭3': 164.81, 'D##3': 164.81,
    'F3': 174.61, 'E#3': 174.61,
    'F#3': 185.00, 'G♭3': 185.00,
    'G3': 196.00, 'F##3': 196.00, 'A♭♭3': 196.00,
    'G#3': 207.65, 'A♭3': 207.65,
    'A3': 220.00, 'G##3': 220.00, 'B♭♭3': 220.00,
    'A#3': 233.08, 'B♭3': 233.08, 'C♭4': 233.08,
    'B3': 246.94, 'C♭4': 246.94, 'A##3': 246.94,
    // Octave 4
    'C4': 261.63, 'B#3': 261.63, 'D♭♭4': 261.63,
    'C#4': 277.18, 'D♭4': 277.18,
    'D4': 293.66, 'C##4': 293.66, 'E♭♭4': 293.66,
    'D#4': 311.13, 'E♭4': 311.13, 'F♭4': 311.13,
    'E4': 329.63, 'F♭♭4': 329.63, 'D##4': 329.63,
    'F4': 349.23, 'E#4': 349.23,
    'F#4': 369.99, 'G♭4': 369.99,
    'G4': 392.00, 'F##4': 392.00, 'A♭♭4': 392.00,
    'G#4': 415.30, 'A♭4': 415.30,
    'A4': 440.00, 'G##4': 440.00, 'B♭♭4': 440.00,
    'A#4': 466.16, 'B♭4': 466.16, 'C♭5': 466.16,
    'B4': 493.88, 'C♭5': 493.88, 'A##4': 493.88,
    // Octave 5
    'C5': 523.25, 'B#4': 523.25, 'D♭♭5': 523.25,
    'C#5': 554.37, 'D♭5': 554.37,
    'D5': 587.33, 'C##5': 587.33, 'E♭♭5': 587.33,
    'D#5': 622.25, 'E♭5': 622.25, 'F♭5': 622.25,
    'E5': 659.25, 'F♭♭5': 659.25, 'D##5': 659.25,
    'F5': 698.46, 'E#5': 698.46,
    'F#5': 739.99, 'G♭5': 739.99,
    'G5': 783.99, 'F##5': 783.99, 'A♭♭5': 783.99,
    'G#5': 830.61, 'A♭5': 830.61,
    'A5': 880.00, 'G##5': 880.00, 'B♭♭5': 880.00,
    'A#5': 932.33, 'B♭5': 932.33, 'C♭6': 932.33,
    'B5': 987.77, 'C♭6': 987.77, 'A##5': 987.77,
     // Octave 6
    'C6': 1046.50, 'B#5': 1046.50,
    'C#6': 1108.73, 'D♭6': 1108.73,
    'D6': 1174.66,
    'D#6': 1244.51, 'E♭6': 1244.51
};
let noteFrequencies = { ...baseFrequencies };

const semitoneShiftMap = {'C':0,'D♭':1,'D':2,'E♭':3,'E':4,'F':5,'G♭':6,'G':7,'A♭':8,'A':9,'B♭':10,'B':11};
function transposeFrequency(freq, semitoneShift) {
  return freq * Math.pow(2, semitoneShift / 12);
}

// --- COLOR DATA ---
const noteColorsByKey = {
  'C':   { 'I': '#FF3B30',    'ii': '#FF9500', 'iii': '#FFCC00', 'IV': '#34C759', 'V': '#30c0c6', 'vi': '#007AFF', 'IV/IV': '#AF52DE' },
  'D♭':  { 'I': '#FF9500',    'ii': '#FFCC00', 'iii': '#34C759', 'IV': '#30c0c6', 'V': '#007AFF', 'vi': '#AF52DE', 'IV/IV': '#FF3B30' },
  'D':   { 'I': '#FF9500',    'ii': '#FFCC00', 'iii': '#34C759', 'IV': '#30c0c6', 'V': '#007AFF', 'vi': '#AF52DE', 'IV/IV': '#FF3B30' },
  'E♭':  { 'I': '#FFCC00',    'ii': '#34C759', 'iii': '#30c0c6', 'IV': '#007AFF', 'V': '#AF52DE', 'vi': '#FF3B30', 'IV/IV': '#FF9500' },
  'E':   { 'I': '#FFCC00',    'ii': '#34C759', 'iii': '#30c0c6', 'IV': '#007AFF', 'V': '#AF52DE', 'vi': '#FF3B30', 'IV/IV': '#FF9500' },
  'F':   { 'I': '#34C759',    'ii': '#30c0c6', 'iii': '#007AFF', 'IV': '#AF52DE', 'V': '#FF3B30', 'vi': '#FF9500', 'IV/IV': '#FFCC00' },
  'G♭':  { 'I': '#30c0c6',    'ii': '#007AFF', 'iii': '#AF52DE', 'IV': '#FF3B30', 'V': '#FF9500', 'vi': '#FFCC00', 'IV/IV': '#34C759' },
  'G':   { 'I': '#30c0c6',    'ii': '#007AFF', 'iii': '#AF52DE', 'IV': '#FF3B30', 'V': '#FF9500', 'vi': '#FFCC00', 'IV/IV': '#34C759' },
  'A♭':  { 'I': '#007AFF',    'ii': '#AF52DE', 'iii': '#FF3B30', 'IV': '#FF9500', 'V': '#FFCC00', 'vi': '#34C759', 'IV/IV': '#30c0c6' },
  'A':   { 'I': '#007AFF',    'ii': '#AF52DE', 'iii': '#FF3B30', 'IV': '#FF9500', 'V': '#FFCC00', 'vi': '#34C759', 'IV/IV': '#30c0c6' },
  'B♭':  { 'I': '#AF52DE',    'ii': '#FF3B30', 'iii': '#FF9500', 'IV': '#FFCC00', 'V': '#34C759', 'vi': '#30c0c6', 'IV/IV': '#007AFF' },
  'B':   { 'I': '#AF52DE',    'ii': '#FF3B30', 'iii': '#FF9500', 'IV': '#FFCC00', 'V': '#34C759', 'vi': '#30c0c6', 'IV/IV': '#007AFF' }
};

const rootNoteColors = {
    'C': '#FF3B30', 'B#': '#FF3B30', 'C#': '#FF3B30', 'D♭': '#FF9500',
    'D': '#FF9500', 'D#': '#FF9500', 'E♭': '#FFCC00', 'E': '#FFCC00',
    'F♭': '#34C759', 'E#': '#34C759', 'F': '#34C759', 'F#': '#34C759',
    'G♭': '#30c0c6', 'G': '#30c0c6', 'G#': '#30c0c6', 'A♭': '#007AFF',
    'A': '#007AFF', 'A#': '#007AFF', 'B♭': '#AF52DE', 'B': '#AF52DE', 'C♭': '#FF3B30',
};

// Define colors for sharp and flat notes
const DARK_RED = '#990000';
const DARK_BLUE = '#000099';
const BRIGHT_RED = '#FF0000';

// --- Chord/Alt names for all keys ---
const chordNamesDefault = {
  "8": "V/V", "9": "V/vi", "u": "IV", "i": "V", "o": "vi", "l": "iii", "k": "ii", "j": "I", "n": "IV/IV"
};
const chordNamesMinor = {
  "j": "i", "i": "V", "u": "VI", "o": "iv", "k": "VII", "l": "III", "8": "IV", "9": "v", "n": "ii°7"
};
const chordNamesNaturalMinor = {
  "j": "i", "i": "v", "u": "iv", "o": "♭VI", "k": "♭VII", "l": "♭III", "8": "♭II", "9": "IV", "n": "V"
};
const chordNamesHarmonicMinor = {
  "j": "i", "i": "V", "u": "iv", "o": "♭VI", "k": "vii°", "l": "♭III+", "8": "♭II", "9": "♭III", "n": "IV"
};
const chordNamesMelodicMinor = {
  "j": "i", "i": "V", "u": "IV", "o": "vi°", "k": "ii", "l": "♭III+", "8": "♭VI", "9": "♭VII", "n": "vii°"
};
const chordNamesDorian = {
  "j": "i", "i": "IV", "u": "♭III", "o": "v", "k": "♭VII", "l": "ii", "8": "♭VI", "9": "vi°7", "n": "V"
};
const chordNamesPhrygian = {
  "j": "i", "i": "♭II", "u": "♭III", "o": "iv", "k": "♭VI", "l": "♭vii", "8": "♭V", "9": "v°", "n": "♭VII"
};
const chordNamesLydian = {
  "j": "I", "i": "V", "u": "II", "o": "iii", "k": "vi", "l": "vii", "8": "IV", "9": "#iv°", "n": "ii°"
};
const chordNamesMixolydian = {
  "j": "I", "i": "♭VII", "u": "IV", "o": "v", "k": "ii", "l": "vi", "8": "♭VI", "9": "♭III", "n": "iii°"
};
const chordNamesLocrian = {
    "j": "i°", "i": "iv", "u": "♭iii", "o": "♭vii", "k": "♭II", "l": "♭VI", "8": "IV", "9": "♭VI+", "n": "♭V"
};

const buttonOrder = ["8", "9", "u", "i", "o", "l", "k", "j", "n"];

const chordNamesAltByKey = {
  "C":  ["D",   "E",   "F",  "G",  "Am",  "Em",  "Dm",  "C",  "B♭"],
  "D♭": ["E♭",  "F",   "G♭", "A♭", "B♭m", "Fm",  "E♭m", "D♭", "C♭"],
  "D":  ["E",   "F#",  "G",  "A",  "Bm",  "F#m", "Em",  "D",  "C"],
  "E♭": ["F",   "G",   "A♭", "B♭", "Cm",  "Gm",  "Fm",  "E♭", "D♭"],
  "E":  ["F#",  "G#",  "A",  "B",  "C#m", "G#m", "F#m", "E",  "D"],
  "F":  ["G",   "A",   "B♭", "C",  "Dm",  "Am",  "Gm",  "F",  "E♭"],
  "G♭": ["A♭",  "B♭",  "C♭", "D♭", "E♭m", "B♭m", "A♭m", "G♭", "F♭"],
  "G":  ["A",   "B",   "C",  "D",  "Em",  "Bm",  "Am",  "G",  "F"],
  "A♭": ["B♭",  "C",   "D♭", "E♭", "Fm",  "Cm",  "B♭m", "A♭", "G♭"],
  "A":  ["B",   "C#",  "D",  "E",  "F#m", "C#m", "Bm",  "A",  "G"],
  "B♭": ["C",   "D",   "E♭", "F",  "Gm",  "Dm",  "Cm",  "B♭", "A♭"],
  "B":  ["C#",  "D#",  "E",  "F#", "G#m", "D#m", "C#m", "B",  "A"]
};

const chordNamesAltByMinorKey = {
    "C":  ["F", "Gm", "A♭", "G",  "Fm", "E♭", "B♭", "Cm", "D°7"],
    "D♭": ["F#", "G#m","A",  "G#", "F#m","E",  "B",  "C#m","D#°7"],
    "D":  ["G",  "Am", "B♭", "A",  "Gm", "F",  "C",  "Dm", "E°7"],
    "E♭": ["G#", "A#m","B",  "A#", "G#m","F#", "C#", "D#m","E#°7"],
    "E":  ["A",  "Bm", "C",  "B",  "Am", "G",  "D",  "Em", "F#°7"],
    "F":  ["B♭", "Cm", "D♭", "C",  "B♭m","A♭", "E♭", "Fm", "G°7"],
    "G♭": ["B",  "C#m","D",  "C#", "Bm", "A",  "E",  "F#m","G#°7"],
    "G":  ["C",  "Dm", "E♭", "D",  "Cm", "B♭", "F",  "Gm", "A°7"],
    "A♭": ["C#", "D#m","E",  "D#", "C#m","B",  "F#", "G#m","A#°7"],
    "A":  ["D",  "Em", "F",  "E",  "Dm", "C",  "G",  "Am", "B°7"],
    "B♭": ["E♭", "Fm", "G♭", "F",  "E♭m","D♭", "A♭", "B♭m","C°7"],
    "B":  ["E",  "F#m","G",  "F#", "Em", "D",  "A",  "Bm", "C#°7"]
};

const chordNamesAltByNaturalMinorKey = {
    "C":  ["D♭", "F",  "Fm", "Gm", "A♭", "E♭", "B♭", "Cm", "G"],
    "D♭": ["D",  "F#", "F#m","G#m","A",  "E",  "B",  "C#m","G#"],
    "D":  ["E♭", "G",  "Gm", "Am", "B♭", "F",  "C",  "Dm", "A"],
    "E♭": ["F♭", "A♭", "A♭m", "B♭m", "C♭", "G♭", "D♭", "E♭m", "B♭"],
    "E":  ["F",  "A",  "Am", "Bm", "C",  "G",  "D",  "Em", "B"],
    "F":  ["G♭", "B♭", "B♭m","Cm", "D♭", "A♭", "E♭", "Fm", "C"],
    "G♭": ["G",  "B",  "Bm", "C#m","D",  "A",  "E",  "F#m","C#"],
    "G":  ["A♭", "C",  "Cm", "Dm", "E♭", "B♭", "F",  "Gm", "D"],
    "A♭": ["A",  "D♭", "C#m","D#m","E",  "B",  "F#", "G#m","D#"],
    "A":  ["B♭", "D",  "Dm", "Em", "F",  "C",  "G",  "Am", "E"],
    "B♭": ["C♭", "E♭", "E♭m","Fm", "G♭", "D♭", "A♭", "B♭m","F"],
    "B":  ["C",  "E",  "Em", "F#m","G",  "D",  "A",  "Bm", "F#"]
};

const chordNamesAltByHarmonicMinorKey = {
    "C":  ["D♭", "E♭",   "Fm", "G",  "A♭", "E♭+", "B°", "Cm", "F"],
    "D♭": ["D",  "E",    "F#m","G#", "A",  "E+",  "B#°","C#m","F#"],
    "D":  ["E♭", "F",    "Gm", "A",  "B♭", "F+",  "C#°","Dm", "G"],
    "E♭": ["F♭", "G♭", "A♭m", "B♭", "C♭", "G♭+", "D♭°", "E♭m", "A♭"],
    "E":  ["F",  "G",    "Am", "B",  "C",  "G+",  "D#°","Em", "A"],
    "F":  ["G♭", "A♭",   "B♭m","C",  "D♭", "A♭+", "E°", "Fm", "B♭"],
    "G♭": ["G",  "A",    "Bm", "C#", "D",  "A+",  "E#°","F#m","B"],
    "G":  ["A♭", "B♭",   "Cm", "D",  "E♭", "B♭+", "F#°","Gm", "C"],
    "A♭": ["A", "B",    "C#m","D#", "E",  "B+", "F𝄪°","G#m","C#"],
    "A":  ["B♭", "C",    "Dm", "E",  "F",  "C+",  "G#°","Am", "D"],
    "B♭": ["C♭", "D♭",   "E♭m","F",  "G♭", "D♭+", "A°", "B♭m","E♭"],
    "B":  ["C",  "D",    "Em", "F#", "G",  "D+",  "A#°","Bm", "E"]
};

const chordNamesAltByMelodicMinorKey = {
    "C":  ["A♭", "B♭", "F", "G", "A°",  "E♭+", "Dm",  "Cm", "B°"],
    "D♭": ["A",  "B",  "F#","G#","A#°", "E+",  "D#m", "C#m","B#°"],
    "D":  ["B♭", "C",  "G", "A", "B°",  "F+",  "Em",  "Dm", "C#°"],
    "E♭": ["C♭", "D♭", "A♭", "B♭", "C°", "G♭+", "Fm", "E♭m", "D°"],
    "E":  ["C",  "D",  "A", "B", "C#°", "G+",  "F#m", "Em", "D#°"],
    "F":  ["D♭", "E♭", "B♭","C", "D°",  "A♭+", "Gm",  "Fm", "E°"],
    "G♭": ["D",  "E",  "B", "C#","D#°", "A+",  "G#m", "F#m","E#°"],
    "G":  ["E♭", "F",  "C", "D", "E°",  "B♭+", "Am",  "Gm", "F#°"],
    "A♭": ["E",  "F#", "C#","D#","E#°", "B+",  "A#m", "G#m","F𝄪°"],
    "A":  ["F",  "G",  "D", "E", "F#°", "C+",  "Bm",  "Am", "G#°"],
    "B♭": ["G♭", "A♭", "E♭","F", "G°",  "D♭+", "Cm",  "B♭m","A°"],
    "B":  ["G",  "A",  "E", "F#","G#°", "D+",  "C#m", "Bm", "A#°"]
};

const chordNamesAltByDorianKey = {
    "C":  ["A♭", "A°7", "E♭", "F",  "Gm", "Dm", "B♭", "Cm", "G"],
    "D♭": ["A",  "A#°7","E",  "F#", "G#m","D#m","B",  "C#m","G#"],
    "D":  ["B♭", "B°7", "F",  "G",  "Am", "Em", "C",  "Dm", "A"],
    "E♭": ["C♭", "C°7", "G♭", "A♭", "B♭m","Fm", "D♭", "E♭m","B♭"],
    "E":  ["C",  "C#°7","G",  "A",  "Bm", "F#m","D",  "Em", "B"],
    "F":  ["D♭", "D°7", "A♭", "B♭", "Cm", "Gm", "E♭", "Fm", "C"],
    "G♭": ["D",  "D#°7","A",  "B",  "C#m","G#m","E",  "F#m","C#"],
    "G":  ["E♭", "E°7", "B♭", "C",  "Dm", "Am", "F",  "Gm", "D"],
    "A♭": ["F♭", "F°7", "C♭", "D♭", "E♭m","B♭m","G♭", "A♭m","E♭"],
    "A":  ["F",  "F#°7","C",  "D",  "Em", "Bm", "G",  "Am", "E"],
    "B♭": ["G♭", "G°7", "D♭", "E♭", "Fm", "Cm", "A♭", "B♭m","F"],
    "B":  ["G",  "G#°7","D",  "E",  "F#m","C#m","A",  "Bm", "F#"]
};

const chordNamesAltByPhrygianKey = {
    "C":  ["G♭", "G°", "E♭", "D♭", "Fm", "B♭m", "A♭", "Cm", "B♭"],
    "D♭": ["G",  "G#°","E",  "D",  "F#m","Bm", "A",  "C#m","B"],
    "D":  ["A♭", "A°", "F",  "E♭", "Gm", "Cm", "B♭", "Dm", "C"],
    "E♭": ["A",  "A#°","F#", "E",  "G#m","C#m","B",  "D#m","C#"],
    "E":  ["B♭", "B°", "G",  "F",  "Am", "Dm", "C",  "Em", "D"],
    "F":  ["C♭", "C°", "A♭", "G♭", "B♭m","E♭m","D♭", "Fm", "E♭"],
    "G♭": ["C",  "C#°","A",  "G",  "Bm", "Em", "D",  "F#m","E"],
    "G":  ["D♭", "D°", "B♭", "A♭", "Cm", "Fm", "E♭", "Gm", "F"],
    "A♭": ["D",  "D#°","B",  "A",  "C#m","F#m","E",  "G#m","F#"],
    "A":  ["E♭", "E°", "C",  "B♭", "Dm", "Gm", "F",  "Am", "G"],
    "B♭": ["F♭", "F°", "D♭", "C♭", "E♭m","A♭m","G♭", "B♭m","A♭"],
    "B":  ["F",  "F#°","D",  "C",  "Em", "Am", "G",  "Bm", "A"]
};

const chordNamesAltByLydianKey = {
    "C":  ["F", "F#°", "D", "G", "Em", "Bm", "Am", "C", "D°"],
    "D♭": ["G♭", "G°",  "E♭", "A♭", "Fm", "Cm", "B♭m", "D♭", "E♭°"],
    "D":  ["G", "G#°", "E", "A", "F#m", "C#m", "Bm", "D", "E°"],
    "E♭": ["A♭", "A°",  "F", "B♭", "Gm", "Dm", "Cm", "E♭", "F°"],
    "E":  ["A", "A#°", "F#", "B", "G#m", "D#m", "C#m", "E", "F#°"],
    "F":  ["B♭", "B°",  "G", "C", "Am", "Em", "Dm", "F", "G°"],
    "G♭": ["C♭", "C°",  "A♭", "D♭", "B♭m", "Fm", "E♭m", "G♭", "A♭°"],
    "G":  ["C", "C#°", "A", "D", "Bm", "F#m", "Em", "G", "A°"],
    "A♭": ["D♭", "D°",  "B♭", "E♭", "Cm", "Gm", "Fm", "A♭", "B♭°"],
    "A":  ["D", "D#°", "B", "E", "C#m", "G#m", "F#m", "A", "B°"],
    "B♭": ["E♭", "E°",  "C", "F", "Dm", "Am", "Gm", "B♭", "C°"],
    "B":  ["E", "E#°", "C#", "F#", "D#m", "A#m", "G#m", "B", "C#°"]
};

const chordNamesAltByMixolydianKey = {
    "C":  ["A♭", "E♭", "F", "B♭", "Gm", "Am", "Dm", "C", "E°"],
    "D♭": ["A",  "E",  "F#","B",  "G#m","A#m","D#m","C#","E#°"],
    "D":  ["B♭", "F",  "G", "C",  "Am", "Bm", "Em", "D", "F#°"],
    "E♭": ["C♭", "G♭", "A♭","D♭", "B♭m","Cm", "Fm", "E♭","G°"],
    "E":  ["C",  "G",  "A", "D",  "Bm", "C#m","F#m","E", "G#°"],
    "F":  ["D♭", "A♭", "B♭","E♭", "Cm", "Dm", "Gm", "F", "A°"],
    "G♭": ["D",  "A",  "B", "E",  "C#m","D#m","G#m","F#","A#°"],
    "G":  ["E♭", "B♭", "C", "F",  "Dm", "Em", "Am", "G", "B°"],
    "A♭": ["F♭", "C♭", "D♭","G♭", "E♭m","Fm", "B♭m","A♭","C°"],
    "A":  ["F",  "C",  "D", "G",  "Em", "F#m","Bm", "A", "C#°"],
    "B♭": ["G♭", "D♭", "E♭","A♭", "Fm", "Gm", "Cm", "B♭","D°"],
    "B":  ["G",  "D",  "E", "A",  "F#m","G#m","C#m","B", "D#°"]
};

const chordNamesAltByLocrianKey = {
    "C":  ["F", "A♭+", "E♭m", "Fm", "B♭m", "A♭", "D♭", "C°", "G♭"],
    "D♭": ["F#", "A+",  "Em",  "F#m","Bm",  "A",  "D",  "C#°","G"],
    "D":  ["G", "B♭+", "Fm",  "Gm", "Cm",  "B♭", "E♭", "D°", "A♭"],
    "E♭": ["G#", "B+",  "F#m", "G#m","C#m", "B",  "E",  "D#°","A"],
    "E":  ["A", "C+",  "Gm",  "Am", "Dm",  "C",  "F",  "E°", "B♭"],
    "F":  ["B♭", "D♭+", "A♭m", "B♭m","E♭m", "D♭", "G♭", "F°", "C♭"],
    "G♭": ["B", "D+",  "Am",  "Bm", "Em",  "D",  "G",  "F#°","C"],
    "G":  ["C", "E♭+", "B♭m", "Cm", "Fm",  "E♭", "A♭", "G°", "D♭"],
    "A♭": ["C#", "E+",  "Bm",  "C#m","F#m", "E",  "A",  "G#°","D"],
    "A":  ["D", "F+",  "Cm",  "Dm", "Gm",  "F",  "B♭", "A°", "E♭"],
    "B♭": ["D#", "F#+", "C#m", "D#m","G#m", "F#", "B",  "A#°","E"],
    "B":  ["E", "G+",  "Dm",  "Em", "Am",  "G",  "C",  "B°", "F"]
};

const functionChordColorMap = {
    'Major': {
        'C': { 'IV/IV': 'flat' }, 'D♭': { 'I': 'flat', 'ii': 'flat', 'IV': 'flat', 'V': 'flat', 'vi': 'flat', 'V/V': 'flat', 'IV/IV': 'flat' }, 'D': { 'iii': 'sharp', 'V/vi': 'sharp' }, 'E♭': { 'I': 'flat', 'ii': 'flat', 'IV': 'flat', 'V': 'flat', 'vi': 'flat', 'V/V': 'flat', 'IV/IV': 'flat' }, 'E': { 'iii': 'sharp', 'V/vi': 'sharp' }, 'F': { 'IV/IV': 'flat' }, 'G♭': { 'I': 'flat', 'ii': 'flat', 'IV': 'flat', 'V': 'flat', 'vi': 'flat', 'V/V': 'flat', 'IV/IV': 'flat' }, 'G': { 'iii': 'sharp', 'V/vi': 'sharp' }, 'A♭': { 'I': 'flat', 'ii': 'flat', 'IV': 'flat', 'V': 'flat', 'vi': 'flat', 'V/V': 'flat', 'IV/IV': 'flat' }, 'A': { 'iii': 'sharp', 'V/vi': 'sharp' }, 'B♭': { 'I': 'flat', 'ii': 'flat', 'IV': 'flat', 'V': 'flat', 'vi': 'flat', 'V/V': 'flat', 'IV/IV': 'flat' }, 'B': { 'iii': 'sharp', 'V/vi': 'sharp' }
    },
    'Natural Minor': {
        'C': { '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat', '♭II': 'flat' }, 'D♭': { 'i': 'sharp', 'iv': 'sharp', 'v': 'sharp', 'IV': 'sharp', 'V': 'sharp' }, 'D': { '♭VI': 'flat', '♭II': 'flat' }, 'E♭': { 'i': 'flat', 'iv': 'flat', 'v': 'flat', '♭VI': 'flat', '♭VII': 'flat', '♭III': 'flat', '♭II': 'flat', 'IV': 'flat', 'V': 'flat' }, 'E': { '♭VI': 'flat', '♭II': 'flat' }, 'F': { '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat', '♭II': 'flat' }, 'G♭': { 'i': 'sharp', 'iv': 'sharp', 'v': 'sharp', '♭VI': 'sharp', '♭VII': 'sharp', '♭III': 'sharp', '♭II': 'sharp', 'IV': 'sharp', 'V': 'sharp' }, 'G': { '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat', '♭II': 'flat' }, 'A♭': { 'i': 'flat', 'iv': 'flat', 'v': 'flat', '♭VI': 'flat', '♭VII': 'flat', '♭III': 'flat', '♭II': 'flat', 'IV': 'flat', 'V': 'flat' }, 'A': { '♭VI': 'flat', '♭II': 'flat' }, 'B♭': { 'i': 'flat', 'iv': 'flat', 'v': 'flat', '♭VI': 'flat', '♭VII': 'flat', '♭III': 'flat', '♭II': 'flat', 'IV': 'flat', 'V': 'flat' }, 'B': { '♭VI': 'flat', '♭II': 'flat' }
    },
    'Harmonic Minor': {
        'C': { '♭III+': 'flat', '♭VI': 'flat', '♭II': 'flat', '♭III': 'flat' }, 'D♭': { 'i': 'sharp', 'vii°': 'sharp', 'iv': 'sharp', 'V': 'sharp', 'IV': 'sharp' }, 'D': { 'vii°': 'sharp', '♭VI': 'flat', '♭II': 'flat', '♭III': 'flat' }, 'E♭': { 'i': 'flat', 'vii°': 'flat', 'iv': 'flat', 'V': 'flat', '♭VI': 'flat', '♭III+': 'flat', '♭II': 'flat', '♭III': 'flat', 'IV': 'flat' }, 'E': { 'vii°': 'sharp', '♭VI': 'flat', '♭II': 'flat', '♭III': 'flat' }, 'F': { 'vii°': 'sharp', '♭III+': 'flat', '♭VI': 'flat', '♭II': 'flat', '♭III': 'flat' }, 'G♭': { 'i': 'sharp', 'vii°': 'sharp', 'iv': 'sharp', 'V': 'sharp', '♭VI': 'sharp', '♭III+': 'sharp', '♭II': 'sharp', '♭III': 'sharp', 'IV': 'sharp' }, 'G': { 'vii°': 'sharp', '♭III+': 'flat', '♭VI': 'flat', '♭II': 'flat', '♭III': 'flat' }, 'A♭': { 'i': 'flat', 'vii°': 'flat', 'iv': 'flat', 'V': 'flat', '♭VI': 'flat', '♭III+': 'flat', '♭II': 'flat', '♭III': 'flat', 'IV': 'flat' }, 'A': { 'vii°': 'sharp', '♭VI': 'flat', '♭II': 'flat', '♭III': 'flat' }, 'B♭': { 'i': 'flat', 'vii°': 'flat', 'iv': 'flat', 'V': 'flat', '♭VI': 'flat', '♭III+': 'flat', '♭II': 'flat', '♭III': 'flat', 'IV': 'flat' }, 'B': { 'vii°': 'sharp', '♭VI': 'flat', '♭II': 'flat', '♭III': 'flat' }
    },
    'Melodic Minor': {
        'C': { '♭III+': 'flat', '♭VI': 'flat', '♭VII': 'flat' }, 'D♭': { 'i': 'sharp', 'ii': 'sharp', 'IV': 'sharp', 'V': 'sharp', 'vi°': 'sharp', 'vii°': 'sharp' }, 'D': { '♭VI': 'flat', 'vii°': 'sharp' }, 'E♭': { 'i': 'flat', 'ii': 'flat', 'IV': 'flat', 'V': 'flat', 'vi°': 'flat', '♭III+': 'flat', '♭VI': 'flat', '♭VII': 'flat', 'vii°': 'flat' }, 'E': { '♭VI': 'flat', 'vii°': 'sharp' }, 'F': { '♭III+': 'flat', '♭VI': 'flat', '♭VII': 'flat', 'vii°': 'sharp' }, 'G♭': { 'i': 'sharp', 'ii': 'sharp', 'IV': 'sharp', 'V': 'sharp', 'vi°': 'sharp', '♭III+': 'sharp', '♭VI': 'sharp', '♭VII': 'sharp', 'vii°': 'sharp' }, 'G': { '♭III+': 'flat', '♭VI': 'flat', '♭VII': 'flat', 'vii°': 'sharp' }, 'A♭': { 'i': 'flat', 'ii': 'flat', 'IV': 'flat', 'V': 'flat', 'vi°': 'flat', '♭III+': 'flat', '♭VI': 'flat', '♭VII': 'flat', 'vii°': 'flat' }, 'A': { '♭VI': 'flat', 'vii°': 'sharp' }, 'B♭': { 'i': 'flat', 'ii': 'flat', 'IV': 'flat', 'V': 'flat', 'vi°': 'flat', '♭III+': 'flat', '♭VI': 'flat', '♭VII': 'flat', 'vii°': 'flat' }, 'B': { '♭VI': 'flat', 'vii°': 'sharp' }
    },
    'Dorian': {
        'C': { '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat' }, 'D♭': { 'i': 'sharp', 'ii': 'sharp', 'IV': 'sharp', 'v': 'sharp', 'vi°7': 'sharp', 'V': 'sharp' }, 'D': { '♭VI': 'flat' }, 'E♭': { 'i': 'flat', 'ii': 'flat', 'IV': 'flat', 'v': 'flat', '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat', 'vi°7': 'flat', 'V': 'flat' }, 'E': { '♭VI': 'flat' }, 'F': { '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat' }, 'G♭': { 'i': 'sharp', 'ii': 'sharp', 'IV': 'sharp', 'v': 'sharp', '♭VII': 'sharp', '♭III': 'sharp', '♭VI': 'sharp', 'vi°7': 'sharp', 'V': 'sharp' }, 'G': { '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat' }, 'A♭': { 'i': 'flat', 'ii': 'flat', 'IV': 'flat', 'v': 'flat', '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat', 'vi°7': 'flat', 'V': 'flat' }, 'A': { '♭VI': 'flat' }, 'B♭': { 'i': 'flat', 'ii': 'flat', 'IV': 'flat', 'v': 'flat', '♭VII': 'flat', '♭III': 'flat', '♭VI': 'flat', 'vi°7': 'flat', 'V': 'flat' }, 'B': { '♭VI': 'flat' }
    },
    'Phrygian': {
        'C': { '♭VI': 'flat', '♭vii': 'flat', '♭III': 'flat', '♭II': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'D♭': { 'i': 'sharp', 'iv': 'sharp', 'v°': 'sharp' }, 'D': { '♭VI': 'flat', '♭II': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'E♭': { 'i': 'flat', 'iv': 'flat', '♭VI': 'flat', '♭vii': 'flat', '♭III': 'flat', '♭II': 'flat', 'v°': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'E': { '♭VI': 'flat', '♭II': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'F': { '♭VI': 'flat', '♭vii': 'flat', '♭III': 'flat', '♭II': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'G♭': { 'i': 'sharp', 'iv': 'sharp', '♭VI': 'sharp', '♭vii': 'sharp', '♭III': 'sharp', '♭II': 'sharp', 'v°': 'sharp', '♭V': 'sharp', '♭VII': 'sharp' }, 'G': { '♭VI': 'flat', '♭vii': 'flat', '♭III': 'flat', '♭II': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'A♭': { 'i': 'flat', 'iv': 'flat', '♭VI': 'flat', '♭vii': 'flat', '♭III': 'flat', '♭II': 'flat', 'v°': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'A': { '♭VI': 'flat', '♭II': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'B♭': { 'i': 'flat', 'iv': 'flat', '♭VI': 'flat', '♭vii': 'flat', '♭III': 'flat', '♭II': 'flat', 'v°': 'flat', '♭V': 'flat', '♭VII': 'flat' }, 'B': { '♭VI': 'flat', '♭II': 'flat', '♭V': 'flat', '♭VII': 'flat' }
    },
    'Lydian': {
        'C': { '#iv°': 'sharp' }, 'D♭': { 'I': 'flat', 'vi': 'flat', 'II': 'flat', 'V': 'flat', 'IV': 'flat', 'ii°': 'flat' }, 'D': { 'vii': 'sharp', 'iii': 'sharp', '#iv°': 'sharp' }, 'E♭': { 'I': 'flat', 'vi': 'flat', 'II': 'flat', 'V': 'flat', '#iv°': 'flat', 'IV': 'flat', 'ii°': 'flat' }, 'E': { 'vii': 'sharp', 'iii': 'sharp', '#iv°': 'sharp' }, 'F': { 'IV': 'flat', 'ii°': 'flat' }, 'G♭': { 'I': 'flat', 'vii': 'flat', 'iii': 'flat', 'vi': 'flat', 'II': 'flat', 'V': 'flat', '#iv°': 'flat', 'IV': 'flat', 'ii°': 'flat' }, 'G': { 'vii': 'sharp', 'iii': 'sharp', '#iv°': 'sharp' }, 'A♭': { 'I': 'flat', 'vi': 'flat', 'II': 'flat', 'V': 'flat', '#iv°': 'flat', 'IV': 'flat', 'ii°': 'flat' }, 'A': { 'vii': 'sharp', 'iii': 'sharp', '#iv°': 'sharp' }, 'B♭': { 'I': 'flat', 'vi': 'flat', 'II': 'flat', 'V': 'flat', '#iv°': 'flat', 'IV': 'flat', 'ii°': 'flat' }, 'B': { 'vii': 'sharp', 'iii': 'sharp', '#iv°': 'sharp' }
    },
    'Mixolydian': {
        'C': { '♭VII': 'flat', '♭VI': 'flat', '♭III': 'flat' }, 'D♭': { 'I': 'sharp', 'ii': 'sharp', 'vi': 'sharp', 'IV': 'sharp', 'v': 'sharp', 'iii°': 'sharp' }, 'D': { '♭VI': 'flat', 'iii°': 'sharp' }, 'E♭': { 'I': 'flat', 'ii': 'flat', 'vi': 'flat', 'IV': 'flat', 'v': 'flat', '♭VII': 'flat', '♭VI': 'flat', '♭III': 'flat', 'iii°': 'flat' }, 'E': { '♭VI': 'flat', 'iii°': 'sharp' }, 'F': { '♭VII': 'flat', '♭VI': 'flat', '♭III': 'flat' }, 'G♭': { 'I': 'sharp', 'ii': 'sharp', 'vi': 'sharp', 'IV': 'sharp', 'v': 'sharp', '♭VII': 'sharp', '♭VI': 'sharp', '♭III': 'sharp', 'iii°': 'sharp' }, 'G': { '♭VII': 'flat', '♭VI': 'flat', '♭III': 'flat' }, 'A♭': { 'I': 'flat', 'ii': 'flat', 'vi': 'flat', 'IV': 'flat', 'v': 'flat', '♭VII': 'flat', '♭VI': 'flat', '♭III': 'flat', 'iii°': 'flat' }, 'A': { '♭VI': 'flat', 'iii°': 'sharp' }, 'B♭': { 'I': 'flat', 'ii': 'flat', 'vi': 'flat', 'IV': 'flat', 'v': 'flat', '♭VII': 'flat', '♭VI': 'flat', '♭III': 'flat', 'iii°': 'flat' }, 'B': { '♭VI': 'flat', 'iii°': 'sharp' }
    },
    'Locrian': {
        'C': { '♭II': 'flat', '♭VI': 'flat', '♭iii': 'flat', '♭vii': 'flat', '♭VI+': 'flat', '♭V': 'flat' }, 'D♭': { 'i°': 'sharp', 'iv': 'sharp', 'IV': 'sharp' }, 'D': { '♭II': 'flat', '♭VI': 'flat', '♭V': 'flat' }, 'E♭': { 'i°': 'flat', 'iv': 'flat', '♭II': 'flat', '♭VI': 'flat', '♭iii': 'flat', '♭vii': 'flat', 'IV': 'flat', '♭VI+': 'flat', '♭V': 'flat' }, 'E': { '♭II': 'flat', '♭VI': 'flat', '♭V': 'flat' }, 'F': { '♭II': 'flat', '♭VI': 'flat', '♭iii': 'flat', '♭vii': 'flat', '♭VI+': 'flat', '♭V': 'flat' }, 'G♭': { 'i°': 'sharp', 'iv': 'sharp', '♭II': 'sharp', '♭VI': 'sharp', '♭iii': 'sharp', '♭vii': 'sharp', 'IV': 'sharp', '♭VI+': 'sharp', '♭V': 'sharp' }, 'G': { '♭II': 'flat', '♭VI': 'flat', '♭iii': 'flat', '♭vii': 'flat', '♭VI+': 'flat', '♭V': 'flat' }, 'A♭': { 'i°': 'flat', 'iv': 'flat', '♭II': 'flat', '♭VI': 'flat', '♭iii': 'flat', '♭vii': 'flat', 'IV': 'flat', '♭VI+': 'flat', '♭V': 'flat' }, 'A': { '♭II': 'flat', '♭VI': 'flat', '♭V': 'flat' }, 'B♭': { 'i°': 'flat', 'iv': 'flat', '♭II': 'flat', '♭VI': 'flat', '♭iii': 'flat', '♭vii': 'flat', 'IV': 'flat', '♭VI+': 'flat', '♭V': 'flat' }, 'B': { '♭II': 'flat', '♭VI': 'flat', '♭V': 'flat' }
    }
};

const harmonics = 20;
const real = new Float32Array(harmonics);
const imag = new Float32Array(harmonics);
real[1] = 1; real[2] = 0.15; real[3] = 0.1; real[4] = 0.05;
for (let i = 5; i < harmonics; i++) real[i] = 0;
const customVoiceWave = context.createPeriodicWave(real, imag);

const activeOscillators = {};
const heldKeys = new Set();
const accidentalHeld = { sharp: false, flat: false };
const heldNoteKeys = new Set();
let sharpTouchHeld = false;
let flatTouchHeld = false;

function getAccidentalShift() {
  if (sharpTouchHeld && flatTouchHeld) return 0;
  if (sharpTouchHeld) return 1;
  if (flatTouchHeld) return -1;
  if (accidentalHeld.sharp && accidentalHeld.flat) return 0;
  if (accidentalHeld.sharp) return 1;
  if (accidentalHeld.flat) return -1;
  return 0;
}

function startNote(key, freqOrFreqs) {
  stopNote(key, true); // Immediate stop to prevent overlapping sounds

  const now = context.currentTime;
  const freqs = Array.isArray(freqOrFreqs) ? freqOrFreqs : [freqOrFreqs];
  
  let chordVoices = [];

  // --- Polyphonic Gain Scaling ---
  const numVoices = Math.max(1, freqs.length);
  const peakGain = Math.min(0.2, 0.6 / numVoices); // Scale gain based on number of notes

  // --- ADSR Settings ---
  const attackTime = 0.02;
  const decayTime = 0.1;
  const sustainLevel = 0.7;

  freqs.forEach(freq => {
    if (!freq) {
      console.error(`Invalid frequency in chord for key ${key}. Frequencies: ${freqOrFreqs}`);
      return;
    }

    // --- Create Nodes per voice ---
    const osc = context.createOscillator();
    const voiceGain = context.createGain();
    const filter = context.createBiquadFilter();
    let lfo, lfoGain;

    // --- Configure Nodes ---
    voiceGain.gain.value = 0;
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(8000, now);
    filter.Q.value = 0.7;

    if (currentWaveform === "voice") {
      osc.setPeriodicWave(customVoiceWave);
      osc.frequency.value = freq;
      
      lfo = context.createOscillator();
      lfoGain = context.createGain();
      lfo.frequency.setValueAtTime(4, now);
      lfo.frequency.linearRampToValueAtTime(6, now + 1.5);
      lfoGain.gain.setValueAtTime(2.5, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

    } else {
      osc.type = currentWaveform;
      osc.frequency.value = freq;
      if (currentWaveform === 'sawtooth' || currentWaveform === 'square') {
          filter.frequency.setValueAtTime(6000, now);
      }
    }
    
    // --- Apply ADSR Envelope ---
    voiceGain.gain.cancelScheduledValues(now);
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(peakGain, now + attackTime);
    voiceGain.gain.linearRampToValueAtTime(peakGain * sustainLevel, now + attackTime + decayTime);

    // --- Connect Audio Chain for this voice ---
    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(mixBus);
    
    osc.start(now);

    // Add the nodes for this voice to a list
    chordVoices.push({ osc, voiceGain, lfo });
  });

  // Store the entire set of voices for the chord under one key
  activeOscillators[key] = chordVoices;
}

function stopNote(key, immediate = false) {
  const chordVoices = activeOscillators[key];
  if (!chordVoices) return;

  const now = context.currentTime;

  if (immediate) {
    chordVoices.forEach(voice => {
      voice.voiceGain.gain.cancelScheduledValues(now);
      voice.voiceGain.gain.setValueAtTime(0, now);
      voice.osc.stop(now);
      if (voice.lfo) voice.lfo.stop(now);
    });
  } else {
    const releaseTime = 0.30;
    const stopBuffer = 0.01;

    chordVoices.forEach(voice => {
      const { osc, voiceGain, lfo } = voice;
      voiceGain.gain.cancelScheduledValues(now);
      voiceGain.gain.setValueAtTime(voiceGain.gain.value, now);
      voiceGain.gain.linearRampToValueAtTime(0.0001, now + releaseTime);
      
      osc.stop(now + releaseTime + stopBuffer);
      if (lfo) {
        lfo.stop(now + releaseTime + stopBuffer);
      }
    });
  }

  delete activeOscillators[key];
}

function handlePlayKey(key) {
  let chords;
  if (currentScale === 'Major') chords = majorChords;
  else if (currentScale === 'Minor') chords = minorChords;
  else if (currentScale === 'Natural Minor') chords = naturalMinorChords;
  else if (currentScale === 'Harmonic Minor') chords = harmonicMinorChords;
  else if (currentScale === 'Melodic Minor') chords = melodicMinorChords;
  else if (currentScale === 'Dorian') chords = dorianChords;
  else if (currentScale === 'Phrygian') chords = phrygianChords;
  else if (currentScale === 'Lydian') chords = lydianChords;
  else if (currentScale === 'Mixolydian') chords = mixolydianChords;
  else if (currentScale === 'Locrian') chords = locrianChords;

  const btn = chords.find(b => b.key === key);
  if (!btn) return;
  heldNoteKeys.add(key);
  
  const keyName = keyNames[currentKeyIndex];
  let keyShift = semitoneShiftMap[keyName];
  const accidentalShift = getAccidentalShift();
  
  // Octave adjustment logic
  if (currentKeyIndex >= 8) { // Ab, A, Bb, B
      keyShift -= 12; // Transpose down one octave
  }
  
  const totalShift = keyShift + accidentalShift;
  const oscKey = `${key}_${accidentalShift}`;
  
  const baseNotes = btn.notes['C'];

  if (!baseNotes) {
      console.error(`Base notes not found for chord ${btn.name}.`);
      return;
  }
  
  let freqOrFreqs = baseNotes.map(noteName => {
      const baseFreq = noteFrequencies[noteName];
      if (!baseFreq) {
          console.error(`Frequency not found for base note: ${noteName}`);
          return 0;
      }
      return transposeFrequency(baseFreq, totalShift);
  });
  
  startNote(oscKey, freqOrFreqs);
}

function handleStopKey(key) {
  heldNoteKeys.delete(key);
  stopNote(`${key}_0`);
  stopNote(`${key}_1`);
  stopNote(`${key}_-1`);
}

function reTriggerHeldKeysAccidentals() {
  for (const key of heldNoteKeys) {
    handlePlayKey(key);
  }
}

const positions = {
  '10a':[9,0],'10b':[9,1],'10c':[9,2],'10d':[9,3],'3a':[2,0],'4a':[3,0],'3b':[2,1],'4b':[3,1],'3c':[2,2],'4c':[3,2],'5a':[4,0],'6a':[5,0],'5b':[4,1],'6b':[5,1],'7b':[6,1],'5c':[4,2],'6c':[5,2],'7c':[6,2],'8b':[7,1],'8c':[7,2],'9b':[8,1],'9c':[8,2],'4d':[3,3],'3d':[2,3],'2c':[1,2],'2d':[1,3],'1c':[0,2],'1d':[0,3],'1a':[0,0],'1b':[0,1],'2a':[1,0],'2b':[1,1],'5d':[4,3],'6d':[5,3],'7d':[6,3],'8d':[7,3],'9d':[8,3],'2e':[1,4]
};

const majorChords = [
  { name: 'I', key: 'j', notes: {'C':['C3','G3','E4','C5']}, cells: ['5b','6b','7b','5c','6c','7c'] },
  { name: 'V', key: 'i', notes: {'C':['G3','B4','D5','G4']}, cells: ['3b','4b','3c','4c'] },
  { name: 'IV', key: 'u', notes: {'C':['F3','C4','A4','F4']}, cells: ['3a','4a'] },
  { name: 'vi', key: 'o', notes: {'C':['A3','E4','C5','A4']}, cells: ['4d','3d'] },
  { name: 'ii', key: 'k', notes: {'C':['D3','A3','F4','D4']}, cells: ['6a'] },
  { name: 'iii', key: 'l', notes: {'C':['E3','B3','G4','E4']}, cells: ['5a'] },
  { name: 'V/V', key: '8', notes: {'C':['D4','F#4','A4','D5']}, cells: ['2a', '2b'] },
  { name: 'V/vi', key: '9', notes: {'C':['E4','G#4','B4','E5']}, cells: ['2c','2d'] },
  { name: 'IV/IV', key: 'n', notes: {'C':['B♭3','D4','F4','B♭4']}, cells: ['8b','8c'] },
];

const minorChords = [
  { name: 'i',    key: 'j', notes: {'C':['C3','G3','E♭4','C5']},      cells: ['5b','6b','7b','5c','6c','7c'] },
  { name: 'V',    key: 'i', notes: {'C':['G3','G4','B4','D5']},      cells: ['3b','4b','3c','4c'] },
  { name: 'VI',   key: 'u', notes: {'C':['A♭3','E♭4','A♭4','C5']},    cells: ['3a','4a'] },
  { name: 'iv',   key: 'o', notes: {'C':['F3','C4','F4','A♭4']},     cells: ['4d','3d'] },
  { name: 'VII',  key: 'k', notes: {'C':['B♭3','D4','F4','B♭4']},     cells: ['6a'] },
  { name: 'III',  key: 'l', notes: {'C':['E♭3','B♭3','E♭4','G4']},    cells: ['5a'] },
  { name: 'IV',   key: '8', notes: {'C':['F3','C4','F4','A4']},        cells: ['2a', '2b'] },
  { name: 'v',    key: '9', notes: {'C':['G3','G4','B♭4','D5']},      cells: ['2c','2d'] },
  { name: 'ii°7', key: 'n', notes: {'C':['D3','A♭3','F4','B4']},      cells: ['8b','8c'] }
];

const naturalMinorChords = [
    { name: 'i',    key: 'j', notes: {'C':['C3', 'G3', 'E♭4', 'C5']},    cells: ['5b','6b','7b','5c','6c','7c'] },
    { name: 'v',    key: 'i', notes: {'C':['G3', 'G4', 'B♭4', 'D5']},    cells: ['3b','4b','3c','4c'] },
    { name: 'iv',   key: 'u', notes: {'C':['F3', 'C4', 'F4', 'A♭4']},   cells: ['3a','4a'] },
    { name: '♭VI',  key: 'o', notes: {'C':['A♭3', 'E♭4', 'A♭4', 'C5']},  cells: ['4d','3d'] },
    { name: '♭VII', key: 'k', notes: {'C':['B♭3', 'D4', 'F4', 'B♭4']},   cells: ['6a'] },
    { name: '♭III', key: 'l', notes: {'C':['E♭3', 'B♭3', 'E♭4', 'G4']},  cells: ['5a'] },
    { name: '♭II',  key: '8', notes: {'C':['D♭3', 'D♭4', 'F4', 'A♭4']},   cells: ['2a', '2b'] },
    { name: 'IV',   key: '9', notes: {'C':['F3','C4','A4','F4']},       cells: ['2c','2d'] },
    { name: 'V',    key: 'n', notes: {'C':['G3', 'G4', 'B4', 'D5']},    cells: ['8b','8c'] }
];

const harmonicMinorChords = [
    { name: 'i',     key: 'j', notes: {'C':['C3', 'G3', 'E♭4', 'C5']},    cells: ['5b','6b','7b','5c','6c','7c'] },
    { name: 'V',     key: 'i', notes: {'C':['G3', 'G4', 'B4', 'D5']},    cells: ['3b','4b','3c','4c'] },
    { name: 'iv',    key: 'u', notes: {'C':['F3', 'C4', 'F4', 'A♭4']},   cells: ['3a','4a'] },
    { name: '♭VI',   key: 'o', notes: {'C':['A♭3', 'E♭4', 'A♭4', 'C5']},  cells: ['4d','3d'] },
    { name: 'vii°',  key: 'k', notes: {'C':['B3', 'D4', 'F4', 'B4']},    cells: ['6a'] },
    { name: '♭III+', key: 'l', notes: {'C':['E♭3', 'B3', 'E♭4', 'G4']},  cells: ['5a'] },
    { name: '♭II',   key: '8', notes: {'C':['D♭3', 'D♭4', 'F4', 'A♭4']},   cells: ['2a', '2b'] },
    { name: '♭III',  key: '9', notes: {'C':['E♭3', 'B♭3', 'E♭4', 'G4']},  cells: ['2c','2d'] },
    { name: 'IV',    key: 'n', notes: {'C':['F3', 'C4', 'F4', 'A4']},    cells: ['8b','8c'] }
];

const melodicMinorChords = [
    { name: 'i',     key: 'j', notes: {'C':['C3', 'G3', 'E♭4', 'C5']},    cells: ['5b','6b','7b','5c','6c','7c'] },
    { name: 'V',     key: 'i', notes: {'C':['G3', 'G4', 'B4', 'D5']},    cells: ['3b','4b','3c','4c'] },
    { name: 'IV',    key: 'u', notes: {'C':['F3', 'C4', 'F4', 'A4']},    cells: ['3a','4a'] },
    { name: 'vi°',   key: 'o', notes: {'C':['A3', 'E♭4', 'A4', 'C5']},   cells: ['4d','3d'] },
    { name: 'ii',    key: 'k', notes: {'C':['D3', 'D4', 'F4', 'A4']},    cells: ['6a'] },
    { name: '♭III+', key: 'l', notes: {'C':['E♭3', 'B3', 'E♭4', 'G4']},  cells: ['5a'] },
    { name: '♭VI',   key: '8', notes: {'C':['A♭3', 'E♭4', 'A♭4', 'C5']},  cells: ['2a', '2b'] },
    { name: '♭VII',  key: '9', notes: {'C':['B♭3', 'D4', 'F4', 'B♭4']},   cells: ['2c','2d'] },
    { name: 'vii°',  key: 'n', notes: {'C':['B3', 'D4', 'F4', 'B4']},    cells: ['8b','8c'] }
];

const dorianChords = [
    { name: 'i',     key: 'j', notes: {'C':['C3','G3','E♭4','C5']},    cells: ['5b','6b','7b','5c','6c','7c'] },
    { name: 'IV',    key: 'i', notes: {'C':['F3','C4','A4','F4']},      cells: ['3b','4b','3c','4c'] },
    { name: '♭III',  key: 'u', notes: {'C':['E♭3','B♭3','G4','E♭4']},    cells: ['3a','4a'] },
    { name: 'v',     key: 'o', notes: {'C':['G3','D4','B♭4','G4']},      cells: ['4d','3d'] },
    { name: '♭VII',  key: 'k', notes: {'C':['B♭3','F4','D5','B♭4']},     cells: ['6a'] },
    { name: 'ii',    key: 'l', notes: {'C':['D3','A3','F4','D4']},      cells: ['5a'] },
    { name: '♭VI',   key: '8', notes: {'C':['A♭3','E♭4','C5','A♭4']},    cells: ['2a', '2b'] },
    { name: 'vi°7',  key: '9', notes: {'C':['F#3','C4','E♭4','A4']},    cells: ['2c','2d'] },
    { name: 'V',     key: 'n', notes: {'C':['G3','B4','D5','G4']},      cells: ['8b','8c'] }
];

const phrygianChords = [
    { name: 'i',    key: 'j', notes: {'C':['C3', 'G3', 'E♭4', 'C5']},    cells: ['5b','6b','7b','5c','6c','7c'] },
    { name: '♭II',  key: 'i', notes: {'C':['D♭3', 'A♭3', 'F4', 'D♭4']},  cells: ['3b','4b','3c','4c'] },
    { name: '♭III', key: 'u', notes: {'C':['E♭3', 'B♭3', 'G4', 'E♭4']},  cells: ['3a','4a'] },
    { name: 'iv',   key: 'o', notes: {'C':['F3', 'C4', 'A♭4', 'F4']},   cells: ['4d','3d'] },
    { name: '♭VI',  key: 'k', notes: {'C':['A♭3', 'E♭4', 'C5', 'A♭4']},  cells: ['6a'] },
    { name: '♭vii', key: 'l', notes: {'C':['B♭3', 'F4', 'D♭5', 'B♭4']},  cells: ['5a'] },
    { name: '♭V',   key: '8', notes: {'C':['G♭3', 'D♭4', 'B♭4', 'G♭4']},  cells: ['2a', '2b'] },
    { name: 'v°',   key: '9', notes: {'C':['G3', 'D♭4', 'B♭4', 'G4']},   cells: ['2c','2d'] },
    { name: '♭VII', key: 'n', notes: {'C':['B♭3', 'D5', 'F4', 'B♭4']},  cells: ['8b','8c'] }
];

const lydianChords = [
    { name: 'I',    key: 'j', notes: {'C': ['C3', 'G3', 'E4', 'C5']},    cells: ['5b','6b','7b','5c','6c','7c'] },
    { name: 'V',    key: 'i', notes: {'C': ['G3', 'G4', 'B4', 'D5']},    cells: ['3b','4b','3c','4c'] },
    { name: 'II',   key: 'u', notes: {'C': ['D3', 'A4', 'D4', 'F#4']},   cells: ['3a','4a'] },
    { name: 'iii',  key: 'o', notes: {'C': ['E3', 'E4', 'G4', 'B4']},    cells: ['4d','3d'] },
    { name: 'vi',   key: 'k', notes: {'C': ['A3', 'E4', 'A4', 'C5']},    cells: ['6a'] },
    { name: 'vii',  key: 'l', notes: {'C': ['B3', 'F#4', 'B4', 'D5']},   cells: ['5a'] },
    { name: 'IV',   key: '8', notes: {'C': ['F3', 'C4', 'F4', 'A4']},    cells: ['2a', '2b'] },
    { name: '#iv°', key: '9', notes: {'C': ['F#3', 'C4', 'F#4', 'A4']},  cells: ['2c','2d'] },
    { name: 'ii°',  key: 'n', notes: {'C': ['F3', 'D4', 'A♭4', 'D5']},   cells: ['8b','8c'] }
];

const mixolydianChords = [
    { name: 'I',    key: 'j', notes: {'C': ['C3', 'G3', 'E4', 'C5']},       cells: ['5b','6b','7b','5c','6c','7c'] },
    { name: '♭VII', key: 'i', notes: {'C': ['B♭3', 'F4', 'B♭4', 'D5']},     cells: ['3b','4b','3c','4c'] },
    { name: 'IV',   key: 'u', notes: {'C': ['F3', 'C4', 'F4', 'A4']},       cells: ['3a','4a'] },
    { name: 'v',    key: 'o', notes: {'C': ['G3', 'G4', 'B♭4', 'D5']},     cells: ['4d','3d'] },
    { name: 'ii',   key: 'k', notes: {'C': ['D3', 'D4', 'F4', 'A4']},       cells: ['6a'] },
    { name: 'vi',   key: 'l', notes: {'C': ['A3', 'E4', 'A4', 'C5']},       cells: ['5a'] },
    { name: '♭VI',  key: '8', notes: {'C': ['A♭3', 'E♭4', 'A♭4', 'C5']},   cells: ['2a', '2b'] },
    { name: '♭III', key: '9', notes: {'C': ['E♭3', 'E♭4', 'G4', 'B♭4']},    cells: ['2c','2d'] },
    { name: 'iii°', key: 'n', notes: {'C': ['E3', 'E4', 'G4', 'B♭4']},      cells: ['8b','8c'] }
];

const locrianChords = [
    { name: 'i°',   key: 'j', notes: {'C': ['C4', 'G♭4', 'E♭4', 'C5']},    cells: ['5b','6b','7b','5c','6c','7c'] },
    { name: 'iv',   key: 'i', notes: {'C': ['F3', 'F4', 'A♭4', 'C5']},     cells: ['3b','4b','3c','4c'] },
    { name: '♭iii', key: 'u', notes: {'C': ['E♭3', 'B♭3', 'E♭4', 'G♭4']},  cells: ['3a','4a'] },
    { name: '♭vii', key: 'o', notes: {'C': ['B♭3', 'D♭4', 'F4', 'B♭4']},  cells: ['4d','3d'] },
    { name: '♭II',  key: 'k', notes: {'C': ['D♭3', 'D♭4', 'F4', 'A♭4']},   cells: ['6a'] },
    { name: '♭VI',  key: 'l', notes: {'C': ['A♭3', 'E♭4', 'A♭4', 'C5']},   cells: ['5a'] },
    { name: 'IV',   key: '8', notes: {'C': ['F3', 'F4', 'A4', 'C5']},     cells: ['2a', '2b'] },
    { name: '♭VI+', key: '9', notes: {'C': ['A♭3', 'E4', 'A♭4', 'C5']},    cells: ['2c','2d'] },
    { name: '♭V',   key: 'n', notes: {'C': ['G♭3', 'D♭4', 'G♭4', 'B♭4']},  cells: ['8b','8c'] }
];

const grid = document.getElementById('grid');
const keyToDiv = {};

function updateSolfegeColors() {
    let chords;
    if (currentScale === 'Major') chords = majorChords;
    else if (currentScale === 'Minor') chords = minorChords;
    else if (currentScale === 'Natural Minor') chords = naturalMinorChords;
    else if (currentScale === 'Harmonic Minor') chords = harmonicMinorChords;
    else if (currentScale === 'Melodic Minor') chords = melodicMinorChords;
    else if (currentScale === 'Dorian') chords = dorianChords;
    else if (currentScale === 'Phrygian') chords = phrygianChords;
    else if (currentScale === 'Lydian') chords = lydianChords;
    else if (currentScale === 'Mixolydian') chords = mixolydianChords;
    else if (currentScale === 'Locrian') chords = locrianChords;

    if (currentScale === 'Major') {
        const currentKey = keyNames[currentKeyIndex];
        const bgColors = noteColorsByKey[currentKey];
        chords.forEach(btn => {
            const div = keyToDiv[btn.key];
            if (div) {
                if (btn.name === "V/V") div.style.backgroundColor = bgColors['ii'] || "#FF9500";
                else if (btn.name === "V/vi") div.style.backgroundColor = bgColors['iii'] || "#FFCC00";
                else if (btn.name === "IV/IV") div.style.backgroundColor = bgColors['IV/IV'] || "#AF52DE";
                else div.style.backgroundColor = bgColors[btn.name] || '#ccc';
            }
        });
    } else { // Minor, Dorian, Phrygian, Lydian, Mixolydian and Locrian use root note coloring
        const currentKeyName = keyNames[currentKeyIndex];
        let nameList;
        if (currentScale === 'Minor') nameList = chordNamesAltByMinorKey[currentKeyName];
        else if (currentScale === 'Natural Minor') nameList = chordNamesAltByNaturalMinorKey[currentKeyName];
        else if (currentScale === 'Harmonic Minor') nameList = chordNamesAltByHarmonicMinorKey[currentKeyName];
        else if (currentScale === 'Melodic Minor') nameList = chordNamesAltByMelodicMinorKey[currentKeyName];
        else if (currentScale === 'Dorian') nameList = chordNamesAltByDorianKey[currentKeyName];
        else if (currentScale === 'Phrygian') nameList = chordNamesAltByPhrygianKey[currentKeyName];
        else if (currentScale === 'Lydian') nameList = chordNamesAltByLydianKey[currentKeyName];
        else if (currentScale === 'Mixolydian') nameList = chordNamesAltByMixolydianKey[currentKeyName];
        else if (currentScale === 'Locrian') nameList = chordNamesAltByLocrianKey[currentKeyName];
        
        if (!nameList) { console.error("Chord list not found for key:", currentKeyName); return; }

        buttonOrder.forEach((buttonKey, index) => {
            const chordName = nameList[index];
            let color = '#ccc';
            if (chordName) {
                // Special override for B♭ Natural Minor's C♭ chord
                if (currentScale === 'Natural Minor' && currentKeyName === 'B♭' && chordName === 'C♭') {
                    color = rootNoteColors['C']; // Force red color for C♭
                }
                // Special override for E♭ Natural/Harmonic Minor's C♭ chord
                else if ((currentScale === 'Natural Minor' || currentScale === 'Harmonic Minor') && currentKeyName === 'E♭' && chordName === 'C♭') {
                    color = rootNoteColors['C']; // Force red color for C♭
                }
                // Special override for C# Harmonic Minor's B#° chord
                else if (currentScale === 'Harmonic Minor' && currentKeyName === 'D♭' && chordName === 'B#°') {
                    color = rootNoteColors['B']; // Force purple color for B#°
                }
                // Special override for C# and D# Melodic Minor's B#° chord
                else if (currentScale === 'Melodic Minor' && (currentKeyName === 'D♭' || currentKeyName === 'E♭') && chordName === 'B#°') {
                    color = rootNoteColors['B']; // Force purple color for B#°
                }
                // Special override for E♭ Dorian's C♭ chord
                else if (currentScale === 'Dorian' && currentKeyName === 'E♭' && chordName === 'C♭') {
                    color = rootNoteColors['C']; // Force red color for C♭
                }
                // Special override for A♭ Dorian's F♭ chord
                else if (currentScale === 'Dorian' && currentKeyName === 'A♭' && chordName === 'F♭') {
                    color = rootNoteColors['F']; // Force green color for F♭
                }
                // Special override for F Phrygian's C♭ chord
                else if (currentScale === 'Phrygian' && currentKeyName === 'F' && chordName === 'C♭') {
                    color = rootNoteColors['C']; // Force red color for C♭
                }
                // Special override for B♭ Phrygian's F♭ chord
                else if (currentScale === 'Phrygian' && currentKeyName === 'B♭' && chordName === 'F♭') {
                    color = rootNoteColors['F']; // Force green color for F♭
                }
                // Special override for G♭ Lydian's C♭ chord
                else if (currentScale === 'Lydian' && currentKeyName === 'G♭' && chordName === 'C♭') {
                    color = rootNoteColors['C']; // Force red color for C♭
                }
                // Special override for E♭ Mixolydian's C♭ chord
                else if (currentScale === 'Mixolydian' && currentKeyName === 'E♭' && chordName === 'C♭') {
                    color = rootNoteColors['C']; // Force red color for C♭
                }
                // Special override for A♭ Mixolydian's F♭ chord
                else if (currentScale === 'Mixolydian' && currentKeyName === 'A♭' && chordName === 'F♭') {
                    color = rootNoteColors['F']; // Force green color for F♭
                }
                // Special override for A♭ Mixolydian's C♭ chord
                else if (currentScale === 'Mixolydian' && currentKeyName === 'A♭' && chordName === 'C♭') {
                    color = rootNoteColors['C']; // Force red color for C♭
                }
                // Special override for F Locrian's C♭ chord
                else if (currentScale === 'Locrian' && currentKeyName === 'F' && chordName === 'C♭') {
                    color = rootNoteColors['C']; // Force red color for C♭
                }
                // Special override for specific E# chords to be yellow
                else if (
                    (currentScale === 'Melodic Minor' && currentKeyName === 'G♭' && chordName === 'E#°') ||
                    (currentScale === 'Melodic Minor' && currentKeyName === 'A♭' && chordName === 'E#°') ||
                    (currentScale === 'Lydian' && currentKeyName === 'B' && chordName === 'E#°') ||
                    (currentScale === 'Mixolydian' && currentKeyName === 'D♭' && chordName === 'E#°')
                ) {
                    color = rootNoteColors['E']; // Force yellow color for E#
                }
                else {
                    const match = chordName.match(/^[A-G](♭|#)?/);
                    const rootNote = match ? match[0] : null;
                    if (rootNote) {
                        color = rootNoteColors[rootNote] || '#ccc';
                    }
                }
            }
            const div = keyToDiv[buttonKey];
            if (div) {
                div.style.backgroundColor = color;
            }
        });
    }
}

const cellRefs = {};
for (let r = 1; r < 11; r++) {
  for (let c = 0; c < 4; c++) {
    const div = document.createElement('div');
    div.className = 'cell';
    const rowNum = r + 1;
    const colLetter = String.fromCharCode(97 + c);
    div.style.top = (r * (100 / 11)) + '%';
    div.style.left = (c * (100 / 4)) + '%';
    div.style.width = (100 / 4 - 0.5) + '%';
    div.style.height = (100 / 11 - 0.5) + '%';
    cellRefs[`${rowNum}${colLetter}`] = div;
    grid.appendChild(div);
  }
}

cellRefs['6d'].classList.remove('toggle-cell-border');

let cButtonState = 'C';
const noteButtonRefs = {};

function updateBoxNames() {
    const useAlt = (cButtonState === 'I');
    const keyName = keyNames[currentKeyIndex];
    let nameList, nameMap, colorMapForCurrentKey = {};

    const scaleMap = {
        'Major': { names: chordNamesAltByKey, functions: chordNamesDefault, colors: functionChordColorMap['Major'] },
        'Minor': { names: chordNamesAltByMinorKey, functions: chordNamesMinor, colors: functionChordColorMap['Minor'] },
        'Natural Minor': { names: chordNamesAltByNaturalMinorKey, functions: chordNamesNaturalMinor, colors: functionChordColorMap['Natural Minor'] },
        'Harmonic Minor': { names: chordNamesAltByHarmonicMinorKey, functions: chordNamesHarmonicMinor, colors: functionChordColorMap['Harmonic Minor'] },
        'Melodic Minor': { names: chordNamesAltByMelodicMinorKey, functions: chordNamesMelodicMinor, colors: functionChordColorMap['Melodic Minor'] },
        'Dorian': { names: chordNamesAltByDorianKey, functions: chordNamesDorian, colors: functionChordColorMap['Dorian'] },
        'Phrygian': { names: chordNamesAltByPhrygianKey, functions: chordNamesPhrygian, colors: functionChordColorMap['Phrygian'] },
        'Lydian': { names: chordNamesAltByLydianKey, functions: chordNamesLydian, colors: functionChordColorMap['Lydian'] },
        'Mixolydian': { names: chordNamesAltByMixolydianKey, functions: chordNamesMixolydian, colors: functionChordColorMap['Mixolydian'] },
        'Locrian': { names: chordNamesAltByLocrianKey, functions: chordNamesLocrian, colors: functionChordColorMap['Locrian'] }
    };
    
    const currentScaleData = scaleMap[currentScale];
    if (currentScaleData) {
        nameList = currentScaleData.names[keyName];
        nameMap = currentScaleData.functions;
        if (currentScaleData.colors && currentScaleData.colors[keyName]) {
            colorMapForCurrentKey = currentScaleData.colors[keyName];
        }
    }

    if (!nameList || !nameMap) {
        // Fallback for safety, though it shouldn't be needed with the new structure
        console.error("Name or function map not found for scale:", currentScale);
        return;
    }

    buttonOrder.forEach((buttonKey, index) => {
        const buttonDiv = noteButtonRefs[buttonKey];
        if (!buttonDiv) return;

        const functionName = nameMap[buttonKey];
        const chordName = nameList[index];
        let textColor = 'white'; // Default color

        // Always determine color from the chordName's accidental
        if (chordName) {
            const match = chordName.match(/^[A-G](♭|#|\uD834\uDD2A)?/);
            if (match) {
                const root = match[0];
                if (root.includes('\uD834\uDD2A')) {
                    textColor = BRIGHT_RED;
                } else if (root.includes('#')) {
                    textColor = DARK_RED;
                } else if (root.includes('♭')) {
                    textColor = DARK_BLUE;
                }
            }
        }
        
        buttonDiv.textContent = useAlt ? chordName : functionName;
        buttonDiv.style.color = textColor;
    });
}


function updateKeyDisplay() {
    const keyNameEl = document.getElementById("key-name");
    if (!keyNameEl) return;
    const displayName = getDisplayNameForKey(currentKeyIndex, currentScale);
    keyNameEl.textContent = displayName;
}

cellRefs['6d'].innerHTML = '';
cellRefs['7d'].innerHTML = '';

// Create the divs based on one of the chord layouts (they all share the same cell structure)
majorChords.forEach(btn => {
  const div = document.createElement('div');
  div.className = 'note-button';
  div.textContent = chordNamesDefault[btn.key];
  div.style.outline = 'none';
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

  // Simplified Event Handlers
  let isPressed = false;
  const startAction = (e) => {
      e.preventDefault();
      isPressed = true;
      handlePlayKey(btn.key);
      div.classList.add('active');
  };
  const endAction = () => {
      if (!isPressed) return;
      isPressed = false;
      handleStopKey(btn.key);
      div.classList.remove('active');
  };

  div.addEventListener('mousedown', startAction);
  div.addEventListener('mouseup', endAction);
  div.addEventListener('mouseleave', endAction);
  div.addEventListener('touchstart', startAction, { passive: false });
  div.addEventListener('touchend', endAction);
  div.addEventListener('touchcancel', endAction);

  grid.appendChild(div);
  keyToDiv[btn.key] = div;
  noteButtonRefs[btn.key] = div;
});

const keyMap = {
  "q": "8", "w": "u", "e": "i", "r": "o", "t": "9",
  "f": "j", "s": "l", "d": "k", "g": "n"
};
const keyHeldDown = {};

const controlsBar = document.getElementById('controls-bar');
const keyButton = document.createElement('div');
keyButton.className = 'control-area';
keyButton.tabIndex = 0;
keyButton.setAttribute('aria-label', 'Key control');
keyButton.innerHTML = `<div class="arrow" id="key-left">&#9664;</div><div id="key-name">C</div><div class="arrow" id="key-right">&#9654;</div>`;

const scaleControl = document.createElement('div');
scaleControl.className = 'control-area';
scaleControl.innerHTML = `<select id="scale-select" class="scale-select" aria-label="Scale select"><option value="Major">Major</option><option value="Minor">Minor</option><option value="Natural Minor">Natural Minor</option><option value="Harmonic Minor">Harmonic Minor</option><option value="Melodic Minor">Melodic Minor</option><option value="Dorian">Dorian</option><option value="Phrygian">Phrygian</option><option value="Lydian">Lydian</option><option value="Mixolydian">Mixolydian</option><option value="Locrian">Locrian</option></select>`;

const waveButton = document.createElement('div');
waveButton.className = 'control-area';
waveButton.tabIndex = 0;
waveButton.setAttribute('aria-label', 'Waveform control');
waveButton.innerHTML = '<div class="arrow" id="left-arrow">&#9664;</div><div id="waveform-name">triangle</div><div class="arrow" id="right-arrow">&#9654;</div>';

controlsBar.appendChild(keyButton);
controlsBar.appendChild(scaleControl);
controlsBar.appendChild(waveButton);

document.getElementById("key-left").onclick = () => {
  currentKeyIndex = (currentKeyIndex - 1 + keyNames.length) % keyNames.length;
  updateKeyDisplay();
  updateSolfegeColors();
  updateBoxNames();
};
document.getElementById("key-right").onclick = () => {
  currentKeyIndex = (currentKeyIndex + 1) % keyNames.length;
  updateKeyDisplay();
  updateSolfegeColors();
  updateBoxNames();
};

document.getElementById("scale-select").addEventListener('change', (e) => {
  currentScale = e.target.value;
  updateKeyDisplay();
  updateSolfegeColors();
  updateBoxNames();
  document.body.focus();
});

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
  gridEl.style.marginLeft = "auto";
  gridEl.style.marginRight = "2%";
  gridEl.style.marginTop = "0";
  gridEl.style.marginBottom = "0";
  const fontSize = Math.min(gridHeight / 11, gridWidth / 4) * 0.5;
  gridEl.querySelectorAll('.note-button').forEach(div => {
    div.style.fontSize = fontSize + 'px';
  });
  gridEl.querySelectorAll('.cell').forEach(div => {
    div.style.fontSize = fontSize + 'px';
  });
  const toggleBtn = cellRefs['5d']?.querySelector('.chord-toggle-btn');
  if (toggleBtn) toggleBtn.style.fontSize = Math.max(fontSize * 1.1, 20) + 'px';
}
window.addEventListener('resize', resizeGrid);
window.addEventListener('DOMContentLoaded', () => setTimeout(() => { resizeGrid(); updateSolfegeColors(); updateBoxNames(); }, 1));
setTimeout(() => { resizeGrid(); updateSolfegeColors(); updateBoxNames(); }, 200);
const mq = window.matchMedia("(max-width: 550px)");
mq.addEventListener("change", () => { resizeGrid(); updateSolfegeColors(); updateBoxNames(); });

// Initial Setup
updateKeyDisplay();
updateSolfegeColors();
updateBoxNames();

// --- MASTER CONTROL LISTENER ---
window.addEventListener('message', function(event) {
    if (event.origin.startsWith('null') || event.origin.startsWith('file')) {
      // Allow local development
    } else if (event.origin !== window.location.origin) {
        return;
    }
    
    const data = event.data;
    if (!data || !data.type) return;

    switch (data.type) {
        // --- ADDED ---
        case 'resumeAudio':
            if (context.state === 'suspended') {
                context.resume().then(() => {
                    console.log('Chord App AudioContext resumed successfully.');
                });
            }
            break;
        case 'keydown':
            if (keyHeldDown[data.key]) return; // Prevent repeats
         
            keyHeldDown[data.key] = true;
            const chordKey = keyMap[data.key.toLowerCase()];
            if (chordKey) {
                handlePlayKey(chordKey);
                if (keyToDiv[chordKey]) keyToDiv[chordKey].classList.add('active');
            }
            break;
        case 'keyup':
            const upChordKey = keyMap[data.key.toLowerCase()];
            if (upChordKey) {
                handleStopKey(upChordKey);
                keyHeldDown[data.key] = false;
                sharpTouchHeld = false;
                flatTouchHeld = false;
                if (keyToDiv[upChordKey]) keyToDiv[upChordKey].classList.remove('active');
            }
            break;
        case 'setKey':
            currentKeyIndex = data.keyIndex;
            updateKeyDisplay();
            updateSolfegeColors();
            updateBoxNames();
            break;
        case 'setScale':
            const newScale = data.scale;
            if (newScale && newScale !== currentScale) {
                currentScale = newScale;
                const scaleSelect = document.getElementById("scale-select");
                if (scaleSelect) {
                    scaleSelect.value = currentScale;
                }
                updateKeyDisplay();
                updateSolfegeColors();
                updateBoxNames();
            }
            break;
        case 'toggleNames':
            cButtonState = (cButtonState === 'C') ? 'I' : 'C';
            updateBoxNames();
            break;
        case 'setWaveform':
            const newWaveformName = data.waveform;
            const newIndex = waveforms.indexOf(newWaveformName);
            if (newIndex !== -1) {
                currentWaveformIndex = newIndex;
                currentWaveform = newWaveformName;
                // Also update the local waveform display in the chord app
                const waveformNameEl = document.getElementById("waveform-name");
                if (waveformNameEl) {
                    waveformNameEl.textContent = currentWaveform;
                }
            }
            break;
    }
});

// --- POINTER OVERLAY LISTENER (SIMPLIFIED) ---
const activePointers = new Map();
window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || data.type !== 'simulatedPointer') return;

    const currentElement = document.elementFromPoint(data.x, data.y);
    const pointerInfo = activePointers.get(data.id);

    if (data.eventType === 'start') {
        if (!currentElement || !currentElement.classList.contains('note-button')) return;
        activePointers.set(data.id, currentElement);
        currentElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    } else if (data.eventType === 'move') {
        if (!pointerInfo) return;
        if (pointerInfo !== currentElement) {
            // Moved off the original element
            pointerInfo.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
            activePointers.delete(data.id);
        }
    } else if (data.eventType === 'end') {
        if (!pointerInfo) return;
        pointerInfo.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        activePointers.delete(data.id);
    }
});
