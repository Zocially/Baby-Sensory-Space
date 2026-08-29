/**
 * ANIMAL SAFARI - INTERACTION LOGIC
 * Procedural Web Audio animal sound synthesis, emojis, and particle grids.
 * Inherits SETTINGS, PALETTE_COLORS, PENTATONIC_SCALE, playSynthesizedNote, speakText, and SensoryCanvas from shared.js.
 */

// Initialize unified canvas engine
const sensoryCanvas = new SensoryCanvas('playCanvas');

// Procedural Animal Synthesizers
function playBirdChirp() {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(dryGain);
    
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(2800, now + 0.12);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(SETTINGS.volume * 0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    
    osc.start(now);
    osc.stop(now + 0.14);
}

function playCatMeow() {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(dryGain);
    gain.connect(delayNode); // Add spatial delay echo to meow!
    
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(460, now + 0.16);
    osc.frequency.linearRampToValueAtTime(360, now + 0.42);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(SETTINGS.volume * 0.4, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
    
    osc.start(now);
    osc.stop(now + 0.48);
}

function playDogBark() {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(dryGain);
    
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(SETTINGS.volume * 0.45, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    
    osc.start(now);
    osc.stop(now + 0.15);
}

function playSheepBleat() {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();
    
    osc.type = 'triangle';
    vibrato.frequency.value = 14; // tremolo speed
    vibratoGain.gain.value = 18;  // tremolo pitch range
    
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    
    osc.connect(gain);
    gain.connect(dryGain);
    
    osc.frequency.setValueAtTime(240, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(SETTINGS.volume * 0.45, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    
    vibrato.start(now);
    osc.start(now);
    
    vibrato.stop(now + 0.46);
    osc.stop(now + 0.46);
}

function playDuckQuack() {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    
    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.18);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dryGain);
    
    osc.frequency.setValueAtTime(130, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(SETTINGS.volume * 0.4, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    
    osc.start(now);
    osc.stop(now + 0.22);
}

const ANIMAL_DATA = {
    Cat: { emoji: "🐱", soundName: "meow", playSound: playCatMeow },
    Dog: { emoji: "🐶", soundName: "woof", playSound: playDogBark },
    Bird: { emoji: "🐦", soundName: "tweet", playSound: playBirdChirp },
    Sheep: { emoji: "🐑", soundName: "baa", playSound: playSheepBleat },
    Duck: { emoji: "🦆", soundName: "quack", playSound: playDuckQuack }
};

const animalsGrid = document.getElementById('animalsGrid');
const giantDisplay = document.getElementById('giantDisplay');
const giantIllustration = document.getElementById('giantIllustration');
const giantWord = document.getElementById('giantWord');

let displayTimerId = null;

// --- Initialize Dynamic Touch Keyboard ---
function buildAnimalsKeyboard() {
    animalsGrid.innerHTML = '';
    Object.keys(ANIMAL_DATA).forEach(name => {
        const data = ANIMAL_DATA[name];
        const btn = document.createElement('button');
        btn.className = 'animal-btn';
        
        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = data.emoji;
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'animal-btn-label';
        labelSpan.textContent = name;
        
        btn.appendChild(emojiSpan);
        btn.appendChild(labelSpan);
        
        btn.addEventListener('click', (e) => {
            if (timerLocked) return;
            e.stopPropagation(); // prevent background click trigger
            
            const rect = btn.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            triggerAnimal(name, x, y);
            
            btn.classList.add('active');
            setTimeout(() => { btn.classList.remove('active'); }, 150);
        });
        
        animalsGrid.appendChild(btn);
    });
}

// --- Trigger Animal Action ---
function triggerAnimal(name, spawnX, spawnY) {
    if (timerLocked) return;
    
    if (navigator.vibrate) navigator.vibrate(20);
    
    const data = ANIMAL_DATA[name];
    if (!data) return;
    
    // 1. Procedural Audio and Speech Pronunciation
    data.playSound();
    
    // Speak slow, clear pronunciation sentence (e.g. "Cat says meow")
    setTimeout(() => {
        speakText(`${name} says ${data.soundName}`);
    }, 450); // slight delay after natural audio call
    
    // 2. Giant Card Display Overlay
    if (displayTimerId) clearTimeout(displayTimerId);
    
    giantIllustration.textContent = data.emoji;
    giantWord.textContent = name;
    
    giantDisplay.classList.remove('hidden');
    giantDisplay.style.animation = 'none';
    giantDisplay.offsetHeight; // reflow
    giantDisplay.style.animation = 'fadeScaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards';
    
    displayTimerId = setTimeout(() => {
        giantDisplay.classList.add('hidden');
    }, 3200);
    
    // 3. Canvas particles starburst (radial burst)
    const pX = spawnX || Math.random() * window.innerWidth;
    const pY = spawnY || Math.random() * window.innerHeight;
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = Math.random() * 3 + 2.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 1.0;
        
        sensoryCanvas.addParticle(new Particle(pX, pY, data.emoji, vx, vy));
    }
}

// Particle class for Animals screen
class Particle {
    constructor(x, y, emoji = '', vx = null, vy = null) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        
        const currentColors = PALETTE_COLORS[SETTINGS.theme] || PALETTE_COLORS['warm-sand'];
        this.color = currentColors[Math.floor(Math.random() * currentColors.length)];
        
        const speedScale = SETTINGS.speed === 1 ? 0.4 : (SETTINGS.speed === 3 ? 1.5 : 0.8);
        this.vx = vx !== null ? vx * speedScale : (Math.random() - 0.5) * 2.5 * speedScale;
        this.vy = vy !== null ? vy * speedScale : -(Math.random() * 2 + 0.8) * speedScale;
        
        this.baseSize = Math.random() * 25 + 35;
        this.size = this.baseSize;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.01;
        this.maxLife = 160 + Math.random() * 80;
        this.life = this.maxLife;
        this.alpha = 0;
        
        const shapes = ['circle', 'star', 'bubble'];
        this.shape = shapes[Math.floor(Math.random() * shapes.length)];
        this.isEmoji = this.emoji && (Math.random() > 0.4);
    }
    
    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        this.life--;
        
        const age = this.maxLife - this.life;
        if (age < 15) {
            this.alpha = age / 15;
        } else {
            this.alpha = this.life / (this.maxLife - 15);
        }
        
        this.size = this.baseSize * (0.6 + 0.4 * (this.life / this.maxLife));
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        
        if (this.isEmoji) {
            // Draw floating small animal emoji
            ctx.font = `${this.size * 0.9}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
        } else {
            // Draw background shapes
            ctx.beginPath();
            if (this.shape === 'circle') {
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'bubble') {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2.5;
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

// Canvas Background Touch Spawns (Neutral shapes)
function handleBackgroundTap(clientX, clientY) {
    const scaleIndex = Math.floor((clientX / window.innerWidth) * PENTATONIC_SCALE.length);
    playSynthesizedNote(PENTATONIC_SCALE[scaleIndex]);
    
    for (let i = 0; i < 4; i++) {
        sensoryCanvas.addParticle(new Particle(clientX, clientY, ''));
    }
}

const canvasEl = document.getElementById('playCanvas');
canvasEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    handleBackgroundTap(e.clientX, e.clientY);
});

canvasEl.addEventListener('touchstart', (e) => {
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        
        const buttonRect = document.getElementById('settingsTrigger').getBoundingClientRect();
        if (touch.clientX >= buttonRect.left && touch.clientY >= buttonRect.top) {
            continue; 
        }
        handleBackgroundTap(touch.clientX, touch.clientY);
    }
}, { passive: true });

// Lockout synchronizer
setInterval(() => {
    if (timerLocked && sensoryCanvas.particles.length > 0) {
        sensoryCanvas.clear();
        giantDisplay.classList.add('hidden');
    }
}, 500);

// --- Init Page ---
window.addEventListener('DOMContentLoaded', () => {
    buildAnimalsKeyboard();
});
