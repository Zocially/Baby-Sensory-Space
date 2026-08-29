/**
 * MAGIC NUMBERS - INTERACTION LOGIC
 * Number selection, interactive counting balloons, popping physics, and speech.
 * Inherits SETTINGS, PALETTE_COLORS, PENTATONIC_SCALE, playSynthesizedNote, playBubblePopSound, speakText, and SensoryCanvas from shared.js.
 */

// Initialize unified canvas engine
const sensoryCanvas = new SensoryCanvas('playCanvas');

const numbersGrid = document.getElementById('numbersGrid');
const giantDisplay = document.getElementById('giantDisplay');
const giantLetter = document.getElementById('giantLetter');
const giantWord = document.getElementById('giantWord');

let currentTargetNum = 0;
let poppedCount = 0;
let displayTimerId = null;

// --- Initialize 1-10 Touch Grid ---
function buildNumbersKeyboard() {
    numbersGrid.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.textContent = i;
        btn.dataset.number = i;
        
        btn.addEventListener('click', (e) => {
            if (timerLocked) return;
            triggerNumber(i);
            
            btn.classList.add('active');
            setTimeout(() => { btn.classList.remove('active'); }, 150);
        });
        
        numbersGrid.appendChild(btn);
    }
}

// --- Trigger Number count and spawn ---
function triggerNumber(num) {
    if (timerLocked) return;
    
    if (navigator.vibrate) navigator.vibrate(15);
    
    currentTargetNum = num;
    poppedCount = 0;
    
    // 1. Voice and Sound chords feedback
    const scaleIndex = (num - 1) % PENTATONIC_SCALE.length;
    playSynthesizedNote(PENTATONIC_SCALE[scaleIndex]);
    
    speakText(`${num}. Let's count ${num}!`);
    
    // 2. Display giant overlay text
    if (displayTimerId) clearTimeout(displayTimerId);
    
    giantLetter.textContent = num;
    giantWord.textContent = `Tap the balloons to pop and count!`;
    giantDisplay.classList.remove('hidden');
    giantDisplay.style.animation = 'none';
    giantDisplay.offsetHeight; // reflow
    giantDisplay.style.animation = 'fadeScaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards';
    
    displayTimerId = setTimeout(() => {
        giantDisplay.classList.add('hidden');
    }, 4000);
    
    // 3. Clear existing pops and spawn N popping elements
    sensoryCanvas.particles = sensoryCanvas.particles.filter(p => !p.isPopTarget);
    
    const margin = 100;
    const spawnWidth = window.innerWidth - margin * 2;
    const spawnHeight = window.innerHeight * 0.35;
    
    for (let i = 0; i < num; i++) {
        // Space them out horizontally nicely
        const x = margin + (spawnWidth / (num + 1)) * (i + 1) + (Math.random() - 0.5) * 40;
        const y = window.innerHeight * 0.6 + (Math.random() - 0.5) * spawnHeight * 0.5;
        
        const p = new Particle(x, y);
        p.isPopTarget = true;
        p.popIndex = i + 1;
        sensoryCanvas.addParticle(p);
    }
    
    // Highlight button in grid
    const btn = document.querySelector(`.number-btn[data-number="${num}"]`);
    if (btn) {
        btn.classList.add('active');
        setTimeout(() => { btn.classList.remove('active'); }, 300);
    }
}

// Particle balloon class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isPopTarget = false;
        
        const currentColors = PALETTE_COLORS[SETTINGS.theme] || PALETTE_COLORS['warm-sand'];
        this.color = currentColors[Math.floor(Math.random() * currentColors.length)];
        
        const speedScale = SETTINGS.speed === 1 ? 0.4 : (SETTINGS.speed === 3 ? 1.5 : 0.8);
        this.vx = (Math.random() - 0.5) * 1.5 * speedScale;
        this.vy = -(Math.random() * 1.0 + 0.6) * speedScale; // Float up slowly
        
        this.baseSize = Math.random() * 25 + 65; // Large balloon targets
        this.size = this.baseSize;
        this.rotation = Math.random() * Math.PI * 0.08 - Math.PI * 0.04;
        this.rotSpeed = (Math.random() - 0.5) * 0.005;
        
        this.maxLife = 500 + Math.random() * 200; // longer life for numbers
        this.life = this.maxLife;
        this.alpha = 0;
        
        // Sway variables
        this.swaySpeed = 0.008 + Math.random() * 0.012;
        this.swayAmount = 15 + Math.random() * 20;
        this.startX = x;
    }
    
    update(width, height) {
        if (this.isPopTarget) {
            this.y += this.vy;
            // Gentle physics sine wave sway
            this.x = this.startX + Math.sin(this.y * this.swaySpeed) * this.swayAmount;
            
            // Loop from top to bottom
            if (this.y < -100) {
                this.y = height + 100;
            }
        } else {
            this.x += this.vx;
            this.y += this.vy;
        }
        
        this.rotation += this.rotSpeed;
        this.life--;
        
        const age = this.maxLife - this.life;
        if (age < 20) {
            this.alpha = age / 20;
        } else {
            this.alpha = this.life / (this.maxLife - 20);
        }
        
        this.size = this.baseSize * (0.8 + 0.2 * (this.life / this.maxLife));
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.isPopTarget) {
            // Draw a cute shiny balloon with string
            ctx.fillStyle = this.color;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2.5;
            
            // Draw balloon body
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size / 2, this.size / 1.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw balloon knot
            ctx.beginPath();
            ctx.moveTo(-6, this.size / 1.6);
            ctx.lineTo(6, this.size / 1.6);
            ctx.lineTo(0, this.size / 1.6 - 6);
            ctx.closePath();
            ctx.fill();
            
            // Draw moving string that sways
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(120, 120, 120, 0.4)';
            ctx.lineWidth = 2;
            ctx.moveTo(0, this.size / 1.6);
            const swayOffset = Math.sin(Date.now() * 0.005) * 8;
            ctx.quadraticCurveTo(swayOffset, this.size / 1.6 + 18, 0, this.size / 1.6 + 45);
            ctx.stroke();
            
            // Balloon shine highlight
            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.ellipse(-this.size/5, -this.size/5, this.size/10, this.size/6, Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // regular drifting bubbles
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Particle pop splash particles
class PopSplash {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 7;
        this.vy = (Math.random() - 0.5) * 7;
        this.size = Math.random() * 4 + 4;
        this.life = 15 + Math.random() * 12;
        this.maxLife = this.life;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.18; // gravity
        this.life--;
    }
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Celebration Confetti particles falling down
class Confetti {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 6;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = Math.random() * 3 + 2; // slow fall down
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.1;
        this.life = 160 + Math.random() * 90;
        this.maxLife = this.life;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.04; // gravity
        this.rotation += this.rotSpeed;
        this.life--;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.life / 30);
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size / 1.5);
        ctx.restore();
    }
}

// --- Tap and Pop Detection ---
function checkPopClick(clientX, clientY, isDrag = false) {
    let wasPop = false;
    
    // Iterate from newest to oldest pop targets
    for (let i = sensoryCanvas.particles.length - 1; i >= 0; i--) {
        const p = sensoryCanvas.particles[i];
        if (!p.isPopTarget) continue;
        
        // Distance check
        const dist = Math.hypot(p.x - clientX, p.y - clientY);
        const touchRadius = p.size * 0.72; // Generous tap target
        
        if (dist <= touchRadius) {
            sensoryCanvas.particles.splice(i, 1);
            wasPop = true;
            
            if (navigator.vibrate) navigator.vibrate(25);
            playBubblePopSound();
            
            poppedCount++;
            if (poppedCount < currentTargetNum) {
                speakText(poppedCount.toString());
            } else if (poppedCount === currentTargetNum) {
                speakText(`${poppedCount}! All counted! Yay!`);
                triggerCelebration();
            } else {
                speakText(poppedCount.toString());
            }
            
            // Add splash sparks to unified canvas
            for (let k = 0; k < 12; k++) {
                sensoryCanvas.addSplash(new PopSplash(p.x, p.y, p.color));
            }
            break; // Pop one balloon at a time
        }
    }
    
    // If click didn't land on a balloon, spawn standard bubble (skip if dragging)
    if (!wasPop && !isDrag) {
        if (navigator.vibrate) navigator.vibrate(10);
        const p = new Particle(clientX, clientY);
        sensoryCanvas.addParticle(p);
        playSynthesizedNote(220); // soft standard tap chime
    }
}

function triggerCelebration() {
    // 1. Play chime arpeggio
    setTimeout(() => { playSynthesizedNote(523.25); }, 100);  // C5
    setTimeout(() => { playSynthesizedNote(659.25); }, 250);  // E5
    setTimeout(() => { playSynthesizedNote(783.99); }, 400);  // G5
    setTimeout(() => { playSynthesizedNote(1046.50); }, 550); // C6
    
    // 2. Spawn confetti shower falling down from top
    for (let k = 0; k < 60; k++) {
        const confX = Math.random() * window.innerWidth;
        const confY = -20 - Math.random() * 60;
        const currentColors = PALETTE_COLORS[SETTINGS.theme] || PALETTE_COLORS['warm-sand'];
        const confColor = currentColors[Math.floor(Math.random() * currentColors.length)];
        
        sensoryCanvas.addSplash(new Confetti(confX, confY, confColor));
    }
}

// Mouse events with drag pop support
let isDragging = false;

const canvasEl = document.getElementById('playCanvas');
canvasEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    isDragging = true;
    checkPopClick(e.clientX, e.clientY);
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

canvasEl.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    checkPopClick(e.clientX, e.clientY, true); // true = dragging
});

canvasEl.addEventListener('touchstart', (e) => {
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        checkPopClick(touch.clientX, touch.clientY);
    }
}, { passive: true });

canvasEl.addEventListener('touchmove', (e) => {
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        checkPopClick(touch.clientX, touch.clientY, true); // true = dragging
    }
}, { passive: true });

// Keyboard events mapping (1-9 keys)
window.addEventListener('keydown', (e) => {
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
        triggerNumber(num);
    } else if (e.key === '0') {
        triggerNumber(10);
    }
});

// Clear canvas particles during lockout
setInterval(() => {
    if (timerLocked && sensoryCanvas.particles.length > 0) {
        sensoryCanvas.clear();
        giantDisplay.classList.add('hidden');
    }
}, 500);

// --- Init Page ---
window.addEventListener('DOMContentLoaded', () => {
    buildNumbersKeyboard();
});
