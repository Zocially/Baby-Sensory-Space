/**
 * ALPHABET SAFARI - INTERACTION LOGIC
 * Pronunciation, canvas particles, and grid interactions.
 * Inherits SETTINGS, PALETTE_COLORS, PENTATONIC_SCALE, playSynthesizedNote, speakText, and SensoryCanvas from shared.js.
 */

// Initialize unified canvas engine
const sensoryCanvas = new SensoryCanvas('playCanvas');

const ALPHABET_DATA = {
    A: { word: "Apple", emoji: "🍎" },
    B: { word: "Bear", emoji: "🐻" },
    C: { word: "Cat", emoji: "🐱" },
    D: { word: "Dog", emoji: "🐶" },
    E: { word: "Elephant", emoji: "🐘" },
    F: { word: "Fish", emoji: "🐟" },
    G: { word: "Giraffe", emoji: "🦒" },
    H: { word: "Horse", emoji: "🐴" },
    I: { word: "Ice Cream", emoji: "🍦" },
    J: { word: "Jellyfish", emoji: "🪼" },
    K: { word: "Kangaroo", emoji: "🦘" },
    L: { word: "Lion", emoji: "🦁" },
    M: { word: "Monkey", emoji: "🐒" },
    N: { word: "Nest", emoji: "🪹" },
    O: { word: "Owl", emoji: "🦉" },
    X: { word: "Xylophone", emoji: "🎹" },
    P: { word: "Panda", emoji: "🐼" },
    Q: { word: "Queen", emoji: "👑" },
    R: { word: "Rabbit", emoji: "🐰" },
    S: { word: "Star", emoji: "⭐" },
    T: { word: "Turtle", emoji: "🐢" },
    U: { word: "Umbrella", emoji: "☂️" },
    V: { word: "Violin", emoji: "🎻" },
    W: { word: "Whale", emoji: "🐳" },
    Y: { word: "Yak", emoji: "🐂" },
    Z: { word: "Zebra", emoji: "🦓" }
};

const alphabetGrid = document.getElementById('alphabetGrid');
const giantDisplay = document.getElementById('giantDisplay');
const giantLetter = document.getElementById('giantLetter');
const giantIllustration = document.getElementById('giantIllustration');
const giantWord = document.getElementById('giantWord');

let displayTimerId = null;

// --- Initialize A-Z Touch Keyboard ---
function buildAlphabetKeyboard() {
    alphabetGrid.innerHTML = '';
    Object.keys(ALPHABET_DATA).forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = letter;
        btn.dataset.letter = letter;
        
        btn.addEventListener('click', (e) => {
            if (timerLocked) return;
            e.stopPropagation(); // Prevent background click triggers
            const rect = btn.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            triggerLetter(letter, x, y);
            
            // Visual bounce feedback
            btn.classList.add('active');
            setTimeout(() => { btn.classList.remove('active'); }, 150);
        });
        
        alphabetGrid.appendChild(btn);
    });
}

// --- Trigger Letter Action ---
function triggerLetter(letter, spawnX, spawnY) {
    if (timerLocked) return;
    
    if (navigator.vibrate) navigator.vibrate(15);
    
    const data = ALPHABET_DATA[letter];
    if (!data) return;
    
    // 1. Audio and Speech feedback
    const letterIdx = letter.charCodeAt(0) - 65;
    const pitchIndex = letterIdx % PENTATONIC_SCALE.length;
    playSynthesizedNote(PENTATONIC_SCALE[pitchIndex]);
    
    // Pronounce letter and word
    speakText(`${letter} is for ${data.word}`);
    
    // 2. Display giant center card overlay with spring animation
    if (displayTimerId) {
        clearTimeout(displayTimerId);
    }
    
    giantLetter.textContent = letter;
    giantIllustration.textContent = data.emoji;
    giantWord.textContent = data.word;
    
    giantDisplay.classList.remove('hidden');
    giantDisplay.style.animation = 'none';
    giantDisplay.offsetHeight; // Trigger reflow
    giantDisplay.style.animation = 'fadeScaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards';
    
    // Hide display overlay after 3.2 seconds
    displayTimerId = setTimeout(() => {
        giantDisplay.classList.add('hidden');
    }, 3200);
    
    // 3. Canvas particles starburst feedback
    const pX = spawnX || Math.random() * window.innerWidth;
    const pY = spawnY || Math.random() * window.innerHeight;
    
    // Spawn 8 particles in a radial burst
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const speed = Math.random() * 3 + 2.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 1.0;
        
        sensoryCanvas.addParticle(new Particle(pX, pY, letter, vx, vy));
    }
    
    // Highlight button visually in grid
    const btn = document.querySelector(`.letter-btn[data-letter="${letter}"]`);
    if (btn) {
        btn.classList.add('active');
        setTimeout(() => { btn.classList.remove('active'); }, 300);
    }
}

// Particle definition for Alphabet screen
class Particle {
    constructor(x, y, char = '', vx = null, vy = null) {
        this.x = x;
        this.y = y;
        this.char = char;
        const currentColors = PALETTE_COLORS[SETTINGS.theme] || PALETTE_COLORS['warm-sand'];
        this.color = currentColors[Math.floor(Math.random() * currentColors.length)];
        
        const speedScale = SETTINGS.speed === 1 ? 0.4 : (SETTINGS.speed === 3 ? 1.5 : 0.8);
        this.vx = vx !== null ? vx * speedScale : (Math.random() - 0.5) * 2.5 * speedScale;
        this.vy = vy !== null ? vy * speedScale : -(Math.random() * 2 + 0.8) * speedScale;
        
        this.baseSize = Math.random() * 30 + 40;
        this.size = this.baseSize;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.01;
        this.maxLife = 180 + Math.random() * 80;
        this.life = this.maxLife;
        this.alpha = 0;
        
        const shapes = ['circle', 'bubble', 'star'];
        this.shape = shapes[Math.floor(Math.random() * shapes.length)];
        this.isLetter = this.char && (Math.random() > 0.4);
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
        
        if (this.isLetter) {
            ctx.font = `bold ${this.size * 1.3}px 'Outfit', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.char, 0, 0);
        } else {
            ctx.beginPath();
            if (this.shape === 'circle') {
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'bubble') {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
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

// --- Keyboard Events Setup ---
window.addEventListener('keydown', (e) => {
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) {
        return; 
    }
    
    const ignoredKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab', 'Backspace', 'Enter'];
    if (ignoredKeys.includes(e.key)) {
        e.preventDefault();
    }
    
    const key = e.key.toUpperCase();
    if (ALPHABET_DATA[key]) {
        const randomX = Math.random() * (window.innerWidth * 0.5) + (window.innerWidth * 0.25);
        const randomY = Math.random() * (window.innerHeight * 0.3) + (window.innerHeight * 0.25);
        triggerLetter(key, randomX, randomY);
    }
});

// Canvas Background Touch Spawns
function handleBackgroundTap(clientX, clientY) {
    // Play a gentle note based on x position
    const scaleIndex = Math.floor((clientX / window.innerWidth) * PENTATONIC_SCALE.length);
    playSynthesizedNote(PENTATONIC_SCALE[scaleIndex]);
    
    // Spawn neutral floating shapes (bubbles/stars) without changing the active letter display
    for (let i = 0; i < 4; i++) {
        sensoryCanvas.addParticle(new Particle(clientX, clientY, '')); // Empty string = neutral shapes
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
        
        // Ensure touch is not hitting the settings trigger button
        const buttonRect = document.getElementById('settingsTrigger').getBoundingClientRect();
        if (touch.clientX >= buttonRect.left && touch.clientY >= buttonRect.top) {
            continue; 
        }
        handleBackgroundTap(touch.clientX, touch.clientY);
    }
}, { passive: true });

// Clear canvas particles during lockout
setInterval(() => {
    if (timerLocked && sensoryCanvas.particles.length > 0) {
        sensoryCanvas.clear();
        giantDisplay.classList.add('hidden');
    }
}, 500);

// --- Init Page ---
window.addEventListener('DOMContentLoaded', () => {
    buildAlphabetKeyboard();
});
