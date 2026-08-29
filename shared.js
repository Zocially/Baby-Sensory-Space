/**
 * BABY KEYBOARD & PLAY - SHARED SETTINGS, SYNTHESIZER & TIMER ENGINE
 * Shared utility file used across all activity screens.
 */

// --- Global Settings Object ---
const SETTINGS = {
    soundPreset: 'harp',      // harp, marimba, musicbox, droplet, silence
    visualPreset: 'shapes',   // shapes, letters, watercolor
    theme: 'warm-sand',       // warm-sand, soft-sage, lavender-mist, ocean-breeze, deep-night
    volume: 0.5,              // 0.0 to 1.0
    speed: 2,                 // 1 (slow), 2 (normal), 3 (fast)
    maxElements: 25           // maximum floating particles
};

// Colors associated with each visual mode for calming rendering
const PALETTE_COLORS = {
    'warm-sand':      ['#b08968', '#7f5539', '#9c6644', '#704024', '#b5835a'],
    'soft-sage':      ['#657e6b', '#3d4f41', '#526956', '#7ca982', '#4f6d53'],
    'lavender-mist':  ['#a084bd', '#746484', '#4a3e56', '#81689d', '#5c4b75'],
    'ocean-breeze':  ['#6b9ac4', '#5a7591', '#32475c', '#4f789d', '#2b4154'],
    'deep-night':    ['#f59e0b', '#f87171', '#60a5fa', '#34d399', '#c084fc', '#fef3c7']
};

// Pentatonic scale frequencies in Hz
const PENTATONIC_SCALE = [
    130.81, // C3
    146.83, // D3
    164.81, // E3
    196.00, // G3
    220.00, // A3
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50 // C6
];

// --- Audio Context Management ---
let audioCtx = null;
let dryGain = null;
let wetGain = null;
let delayNode = null;
let feedbackGain = null;
let delayFilter = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Wet/Dry gain architecture
        dryGain = audioCtx.createGain();
        wetGain = audioCtx.createGain();
        
        delayNode = audioCtx.createDelay(1.0);
        feedbackGain = audioCtx.createGain();
        delayFilter = audioCtx.createBiquadFilter();
        
        // Soft spacious echo setup
        delayNode.delayTime.value = 0.35; // 350ms delay
        feedbackGain.gain.value = 0.38;   // gentle atmospheric feedback
        delayFilter.type = 'lowpass';
        delayFilter.frequency.value = 1100; // soft lowpass roll-off for warmth
        
        // Loop: Delay -> Filter -> Feedback -> Delay
        delayNode.connect(delayFilter);
        delayFilter.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        
        // Direct paths to output
        delayNode.connect(wetGain);
        
        dryGain.connect(audioCtx.destination);
        wetGain.connect(audioCtx.destination);
        
        dryGain.gain.value = 0.75;
        wetGain.gain.value = 0.45;
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Procedural synthesizer
function playSynthesizedNote(frequencyValue) {
    if (SETTINGS.soundPreset === 'silence') return;
    
    initAudio();
    
    const now = audioCtx.currentTime;
    const oscNode = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Connect to Web Audio delay chain
    oscNode.connect(gainNode);
    gainNode.connect(dryGain);
    gainNode.connect(delayNode);
    
    const masterVolume = SETTINGS.volume;
    
    if (SETTINGS.soundPreset === 'harp') {
        oscNode.type = 'sine';
        oscNode.frequency.setValueAtTime(frequencyValue, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(masterVolume * 0.4, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
        
        oscNode.start(now);
        oscNode.stop(now + 3.1);
        
        const overtoneOsc = audioCtx.createOscillator();
        const overtoneGain = audioCtx.createGain();
        overtoneOsc.type = 'triangle';
        overtoneOsc.frequency.setValueAtTime(frequencyValue * 2, now);
        
        overtoneOsc.connect(overtoneGain);
        overtoneGain.connect(dryGain);
        overtoneGain.connect(delayNode);
        
        overtoneGain.gain.setValueAtTime(0, now);
        overtoneGain.gain.linearRampToValueAtTime(masterVolume * 0.08, now + 0.04);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        
        overtoneOsc.start(now);
        overtoneOsc.stop(now + 1.3);
        
    } else if (SETTINGS.soundPreset === 'marimba') {
        oscNode.type = 'triangle';
        oscNode.frequency.setValueAtTime(frequencyValue, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(masterVolume * 0.6, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        
        oscNode.start(now);
        oscNode.stop(now + 0.8);
        
    } else if (SETTINGS.soundPreset === 'musicbox') {
        const chimeFreq = frequencyValue * 2;
        
        oscNode.type = 'sine';
        oscNode.frequency.setValueAtTime(chimeFreq, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(masterVolume * 0.35, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        
        oscNode.start(now);
        oscNode.stop(now + 2.1);
        
        const tinOsc = audioCtx.createOscillator();
        const tinGain = audioCtx.createGain();
        tinOsc.type = 'sine';
        tinOsc.frequency.setValueAtTime(chimeFreq * 3.01, now);
        
        tinOsc.connect(tinGain);
        tinGain.connect(dryGain);
        tinGain.connect(delayNode);
        
        tinGain.gain.setValueAtTime(0, now);
        tinGain.gain.linearRampToValueAtTime(masterVolume * 0.06, now + 0.02);
        tinGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
        
        tinOsc.start(now);
        tinOsc.stop(now + 1.1);
        
    } else if (SETTINGS.soundPreset === 'droplet') {
        oscNode.type = 'sine';
        oscNode.frequency.setValueAtTime(frequencyValue * 0.8, now);
        oscNode.frequency.exponentialRampToValueAtTime(frequencyValue * 1.8, now + 0.12);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(masterVolume * 0.5, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        
        oscNode.start(now);
        oscNode.stop(now + 0.4);
    }
}

// Gentle Bubble Pop Sound Synthesis
function playBubblePopSound() {
    if (SETTINGS.soundPreset === 'silence') return;
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(dryGain); // clean dry pop with slight wet send
    gain.connect(delayNode);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(SETTINGS.volume * 0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    
    osc.start(now);
    osc.stop(now + 0.1);
}

// --- Voice Pronunciation Helper (Web Speech API) ---
function speakText(text) {
    if (SETTINGS.soundPreset === 'silence') return;
    try {
        window.speechSynthesis.cancel(); // Cancel current speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = SETTINGS.volume;
        utterance.rate = 0.60; // Slower, clearer speech for babies/toddlers
        utterance.pitch = 1.15; // Gentle tone
        
        const voices = window.speechSynthesis.getVoices();
        // Look for gentle/Samantha/Google/Natural female or soft voices
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Daniel'));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error('Speech synthesis error:', e);
    }
}

// --- Timer Synchronization ---
let timerIntervalId = null;
let timerLocked = false;

function checkTimerState() {
    const timerEndVal = localStorage.getItem('gentle_sensory_timer_end');
    const timesUpOverlay = document.getElementById('timesUpOverlay');
    const countdownBadge = document.getElementById('countdownBadge');
    const timerStatusLabel = document.getElementById('timerStatusLabel');
    const timerCancelBtn = document.getElementById('timerCancelBtn');
    const settingsDrawer = document.getElementById('settingsDrawer');
    
    if (!timerEndVal) {
        // No timer active
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
        timerLocked = false;
        if (countdownBadge) countdownBadge.classList.add('hidden');
        if (timesUpOverlay) timesUpOverlay.classList.add('hidden');
        if (timerStatusLabel) timerStatusLabel.textContent = 'No timer set';
        if (timerCancelBtn) timerCancelBtn.classList.add('hidden');
        
        // Unhighlight any active chips
        document.querySelectorAll('#timerPresets .chip').forEach(c => c.classList.remove('active'));
        return;
    }
    
    const now = Date.now();
    const expires = parseInt(timerEndVal);
    const remainingMs = expires - now;
    
    if (remainingMs <= 0) {
        // Time is up! Lock the screen
        timerLocked = true;
        if (timesUpOverlay) timesUpOverlay.classList.remove('hidden');
        if (countdownBadge) countdownBadge.classList.add('hidden');
        if (timerStatusLabel) timerStatusLabel.textContent = 'Session finished!';
        if (timerCancelBtn) timerCancelBtn.classList.add('hidden');
        if (settingsDrawer) settingsDrawer.classList.add('hidden');
        
        if (timerIntervalId) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
        }
    } else {
        // Timer running
        timerLocked = false;
        if (timesUpOverlay) timesUpOverlay.classList.add('hidden');
        
        const remainingSec = Math.ceil(remainingMs / 1000);
        const m = Math.floor(remainingSec / 60).toString().padStart(2, '0');
        const s = (remainingSec % 60).toString().padStart(2, '0');
        
        if (countdownBadge) {
            countdownBadge.classList.remove('hidden');
            countdownBadge.textContent = `⏱ ${m}:${s}`;
            if (remainingSec <= 60) {
                countdownBadge.classList.add('warning');
            } else {
                countdownBadge.classList.remove('warning');
            }
        }
        
        if (timerStatusLabel) {
            const initialDuration = localStorage.getItem('gentle_sensory_timer_duration') || '';
            timerStatusLabel.textContent = `Running: ${initialDuration} min session`;
            timerStatusLabel.classList.add('running');
        }
        if (timerCancelBtn) {
            timerCancelBtn.classList.remove('hidden');
        }
        
        // Highlight active preset chip if it matches the current duration
        const initialMins = parseInt(localStorage.getItem('gentle_sensory_timer_duration'));
        document.querySelectorAll('#timerPresets .chip').forEach(chip => {
            chip.classList.toggle('active', parseInt(chip.dataset.minutes) === initialMins);
        });
        
        if (!timerIntervalId) {
            timerIntervalId = setInterval(checkTimerState, 1000);
        }
    }
}

function startTimer(minutes) {
    const expires = Date.now() + minutes * 60 * 1000;
    localStorage.setItem('gentle_sensory_timer_end', expires.toString());
    localStorage.setItem('gentle_sensory_timer_duration', minutes.toString());
    checkTimerState();
}

function cancelTimer() {
    localStorage.removeItem('gentle_sensory_timer_end');
    localStorage.removeItem('gentle_sensory_timer_duration');
    checkTimerState();
}

// --- Settings Persistence & Binding ---

function loadSavedSettings() {
    const saved = localStorage.getItem('gentle_sensory_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(SETTINGS, parsed);
        } catch (e) {
            console.error('Error loading settings from localStorage', e);
        }
    }
    applySettingsToDOM();
    checkTimerState();
}

function saveSettings() {
    localStorage.setItem('gentle_sensory_settings', JSON.stringify(SETTINGS));
}

function applySettingsToDOM() {
    // 1. Theme Configuration
    Array.from(document.body.classList).forEach(cls => {
        if (cls.startsWith('theme-')) {
            document.body.classList.remove(cls);
        }
    });
    document.body.classList.add(`theme-${SETTINGS.theme}`);
    document.querySelectorAll('.theme-circle').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === SETTINGS.theme);
    });
    
    // 2. Sound Presets
    document.querySelectorAll('#soundPresets .chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sound === SETTINGS.soundPreset);
    });
    
    // 3. Visual Presets (if they exist in current HTML)
    document.querySelectorAll('#visualPresets .chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.visual === SETTINGS.visualPreset);
    });
    
    // 4. Sliders values mapping
    const volCtrl = document.getElementById('volumeControl');
    if (volCtrl) {
        volCtrl.value = Math.round(SETTINGS.volume * 100);
        const volVal = document.getElementById('volumeValue');
        if (volVal) volVal.innerText = `${volCtrl.value}%`;
    }
    
    const speedCtrl = document.getElementById('speedControl');
    if (speedCtrl) {
        speedCtrl.value = SETTINGS.speed;
        const speedVal = document.getElementById('speedValue');
        if (speedVal) {
            const speedLabels = { 1: 'Slow Drift', 2: 'Normal', 3: 'Gentle Floats' };
            speedVal.innerText = speedLabels[SETTINGS.speed] || SETTINGS.speed;
        }
    }
    
    const countCtrl = document.getElementById('countControl');
    if (countCtrl) {
        countCtrl.value = SETTINGS.maxElements;
        const countVal = document.getElementById('countValue');
        if (countVal) countVal.innerText = SETTINGS.maxElements;
    }
}

// Bind all parent controls in settings panel (safely check if elements exist)
function initParentPanel() {
    const settingsDrawer = document.getElementById('settingsDrawer');
    const settingsTrigger = document.getElementById('settingsTrigger');
    const closeDrawer = document.getElementById('closeDrawer');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    const timesUpUnlockBtn = document.getElementById('timesUpUnlockBtn');
    
    if (!settingsDrawer || !settingsTrigger) return;
    
    const progressRing = settingsTrigger.querySelector('.progress-ring');
    
    let holdTimer = null;
    let holdTimeElapsed = 0;
    const HOLD_DURATION = 1000; // 1 second hold to open
    
    function toggleSettingsDrawer() {
        const isHidden = settingsDrawer.classList.contains('hidden');
        if (isHidden) {
            settingsDrawer.classList.remove('hidden');
            initAudio(); // Warm WebAudio context
        } else {
            settingsDrawer.classList.add('hidden');
        }
    }
    
    function startHold(e) {
        if (e.button && e.button !== 0) return; // Only left clicks
        e.preventDefault();
        
        holdTimeElapsed = 0;
        if (progressRing) progressRing.style.width = '0%';
        
        const intervalTime = 20;
        holdTimer = setInterval(() => {
            holdTimeElapsed += intervalTime;
            const percent = Math.min(100, (holdTimeElapsed / HOLD_DURATION) * 100);
            if (progressRing) progressRing.style.width = `${percent}%`;
            
            if (holdTimeElapsed >= HOLD_DURATION) {
                clearInterval(holdTimer);
                holdTimer = null;
                if (progressRing) progressRing.style.width = '0%';
                toggleSettingsDrawer();
            }
        }, intervalTime);
    }
    
    function cancelHold() {
        if (holdTimer) {
            clearInterval(holdTimer);
            holdTimer = null;
            if (progressRing) progressRing.style.width = '0%';
        }
    }
    
    // Bind hold events
    settingsTrigger.addEventListener('mousedown', startHold);
    settingsTrigger.addEventListener('mouseleave', cancelHold);
    settingsTrigger.addEventListener('mouseup', cancelHold);
    settingsTrigger.addEventListener('touchstart', startHold, { passive: false });
    settingsTrigger.addEventListener('touchend', cancelHold);
    settingsTrigger.addEventListener('touchcancel', cancelHold);
    
    if (closeDrawer) closeDrawer.addEventListener('click', toggleSettingsDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', toggleSettingsDrawer);
    
    // Key shortcut Esc for Settings
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleSettingsDrawer();
        }
    });
    
    // Intercept keyboard keydowns during lockouts
    window.addEventListener('keydown', (e) => {
        if (timerLocked && e.key !== 'Tab') {
            e.preventDefault();
        }
    }, true);
    
    // Theme Click
    const themePicker = document.getElementById('themePicker');
    if (themePicker) {
        themePicker.addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-circle');
            if (!btn || !btn.dataset.theme) return;
            SETTINGS.theme = btn.dataset.theme;
            applySettingsToDOM();
            saveSettings();
        });
    }
    
    // Sound Presets
    const soundPresets = document.getElementById('soundPresets');
    if (soundPresets) {
        soundPresets.addEventListener('click', (e) => {
            const btn = e.target.closest('.chip');
            if (!btn || !btn.dataset.sound) return;
            SETTINGS.soundPreset = btn.dataset.sound;
            applySettingsToDOM();
            saveSettings();
            
            // Pluck note as audio validation feedback
            if (SETTINGS.soundPreset !== 'silence') {
                playSynthesizedNote(440);
            }
        });
    }
    
    // Visual Presets
    const visualPresets = document.getElementById('visualPresets');
    if (visualPresets) {
        visualPresets.addEventListener('click', (e) => {
            const btn = e.target.closest('.chip');
            if (!btn || !btn.dataset.visual) return;
            SETTINGS.visualPreset = btn.dataset.visual;
            applySettingsToDOM();
            saveSettings();
        });
    }
    
    // Volume Control
    const volCtrl = document.getElementById('volumeControl');
    if (volCtrl) {
        volCtrl.addEventListener('input', (e) => {
            SETTINGS.volume = parseFloat(e.target.value) / 100;
            const volVal = document.getElementById('volumeValue');
            if (volVal) volVal.innerText = `${e.target.value}%`;
            saveSettings();
        });
        volCtrl.addEventListener('change', () => {
            playSynthesizedNote(330); // sound confirmation
        });
    }
    
    // Speed Control
    const speedCtrl = document.getElementById('speedControl');
    if (speedCtrl) {
        speedCtrl.addEventListener('input', (e) => {
            SETTINGS.speed = parseInt(e.target.value);
            const speedVal = document.getElementById('speedValue');
            if (speedVal) {
                const speedLabels = { 1: 'Slow Drift', 2: 'Normal', 3: 'Gentle Floats' };
                speedVal.innerText = speedLabels[SETTINGS.speed] || SETTINGS.speed;
            }
            saveSettings();
        });
    }
    
    // Count Control
    const countCtrl = document.getElementById('countControl');
    if (countCtrl) {
        countCtrl.addEventListener('input', (e) => {
            SETTINGS.maxElements = parseInt(e.target.value);
            const countVal = document.getElementById('countValue');
            if (countVal) countVal.innerText = SETTINGS.maxElements;
            saveSettings();
        });
    }
    
    // Timer Presets
    const timerPresets = document.getElementById('timerPresets');
    if (timerPresets) {
        timerPresets.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip || !chip.dataset.minutes) return;
            const minutes = parseInt(chip.dataset.minutes);
            startTimer(minutes);
        });
    }
    
    // Custom Timer
    const timerCustomStart = document.getElementById('timerCustomStart');
    const timerCustomInput = document.getElementById('timerCustomInput');
    if (timerCustomStart && timerCustomInput) {
        timerCustomStart.addEventListener('click', () => {
            const minutes = parseInt(timerCustomInput.value);
            if (!minutes || minutes < 1 || minutes > 120) {
                timerCustomInput.style.borderColor = '#ef4444';
                setTimeout(() => { timerCustomInput.style.borderColor = ''; }, 1500);
                return;
            }
            startTimer(minutes);
            timerCustomInput.value = '';
        });
    }
    
    // Cancel Timer
    const timerCancelBtn = document.getElementById('timerCancelBtn');
    if (timerCancelBtn) {
        timerCancelBtn.addEventListener('click', () => {
            cancelTimer();
            const timerCustomInput = document.getElementById('timerCustomInput');
            if (timerCustomInput) timerCustomInput.value = '';
        });
    }
    
    // Unlock Overlay
    if (timesUpUnlockBtn) {
        timesUpUnlockBtn.addEventListener('click', () => {
            cancelTimer();
        });
    }
    
    // Fullscreen Trigger
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Error enabling fullscreen: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }
    
    // Back to Menu Trigger
    const backToMenuBtn = document.getElementById('backToMenuBtn');
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}

// Listen to local storage changes across tabs to sync state
window.addEventListener('storage', (e) => {
    if (e.key === 'gentle_sensory_timer_end' || e.key === 'gentle_sensory_settings') {
        loadSavedSettings();
    }
});

// Run load on window script injection
window.addEventListener('DOMContentLoaded', () => {
    loadSavedSettings();
    initParentPanel();
});

// --- Unified Canvas & Particle Engine ---
class SensoryCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.splashes = []; // pop explosions / confetti sparks
        this.isAnimating = false;
        
        this.resizeHandler = this.resize.bind(this);
        window.addEventListener('resize', this.resizeHandler);
        this.resize();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    addParticle(particle) {
        this.particles.push(particle);
        if (this.particles.length > SETTINGS.maxElements) {
            // Evict oldest non-pop-target particle first to avoid interrupting gameplay targets
            const idx = this.particles.findIndex(p => !p.isPopTarget);
            if (idx !== -1) {
                this.particles.splice(idx, 1);
            } else {
                this.particles.shift();
            }
        }
        this.startAnimation();
    }
    
    addSplash(splash) {
        this.splashes.push(splash);
        this.startAnimation();
    }
    
    clear() {
        this.particles = [];
        this.splashes = [];
    }
    
    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            requestAnimationFrame(() => this.tick());
        }
    }
    
    tick() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles in reverse
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(this.canvas.width, this.canvas.height);
            p.draw(this.ctx);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update and draw splashes
        for (let i = this.splashes.length - 1; i >= 0; i--) {
            const s = this.splashes[i];
            s.update();
            s.draw(this.ctx);
            if (s.life <= 0) {
                this.splashes.splice(i, 1);
            }
        }
        
        if (this.particles.length === 0 && this.splashes.length === 0) {
            this.isAnimating = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        
        requestAnimationFrame(() => this.tick());
    }
    
    destroy() {
        window.removeEventListener('resize', this.resizeHandler);
    }
}
