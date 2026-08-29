/**
 * BABY KEYBOARD & PLAY - GENTLE SENSORY FREE PLAY
 * Free play canvas rendering and input interaction.
 * Inherits SETTINGS, PALETTE_COLORS, PENTATONIC_SCALE, playSynthesizedNote, and SensoryCanvas from shared.js.
 */

// Initialize unified canvas engine
const sensoryCanvas = new SensoryCanvas('playCanvas');

class Particle {
    constructor(x, y, char = '') {
        this.x = x;
        this.y = y;
        this.char = char.toUpperCase();
        
        // Visual theme parameters mapping
        const currentColors = PALETTE_COLORS[SETTINGS.theme] || PALETTE_COLORS['warm-sand'];
        this.color = currentColors[Math.floor(Math.random() * currentColors.length)];
        
        // Kinematic variables
        const speedScale = SETTINGS.speed === 1 ? 0.4 : (SETTINGS.speed === 3 ? 1.5 : 0.8);
        this.vx = (Math.random() - 0.5) * 3 * speedScale;
        this.vy = -(Math.random() * 2 + 1) * speedScale; // Drift gently upward
        
        // Sizing & Decay
        this.baseSize = Math.random() * 40 + 50; // soft large objects
        this.size = this.baseSize;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.015;
        
        // Fade lifespan
        this.maxLife = 200 + Math.random() * 100;
        this.life = this.maxLife;
        
        // Shape selector (for 'shapes' mode)
        const shapes = ['circle', 'bubble', 'star', 'leaf', 'heart'];
        this.shape = shapes[Math.floor(Math.random() * shapes.length)];
        
        // Soft opacity glow helper
        this.alpha = 0;
    }
    
    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        this.life--;
        
        // Soft transition in, and then gradual fade out
        const age = this.maxLife - this.life;
        if (age < 20) {
            this.alpha = age / 20; // Fade in nicely
        } else {
            this.alpha = this.life / (this.maxLife - 20); // Slowly fade out
        }
        
        // Shrink gently over lifetime
        this.size = this.baseSize * (0.6 + 0.4 * (this.life / this.maxLife));
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        
        if (SETTINGS.visualPreset === 'shapes') {
            ctx.beginPath();
            if (this.shape === 'circle') {
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'bubble') {
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 4;
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.arc(-this.size/6, -this.size/6, this.size / 10, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.shape === 'star') {
                drawStar(ctx, 0, 0, 5, this.size / 2, this.size / 4);
            } else if (this.shape === 'leaf') {
                ctx.moveTo(0, -this.size / 2);
                ctx.quadraticCurveTo(this.size / 2.5, 0, 0, this.size / 2);
                ctx.quadraticCurveTo(-this.size / 2.5, 0, 0, -this.size / 2);
                ctx.fill();
            } else if (this.shape === 'heart') {
                const w = this.size, h = this.size;
                ctx.beginPath();
                ctx.moveTo(0, -h/6);
                ctx.bezierCurveTo(w/4, -h/2, w/2, -h/4, 0, h/2.5);
                ctx.bezierCurveTo(-w/2, -h/4, -w/4, -h/2, 0, -h/6);
                ctx.fill();
            }
        } else if (SETTINGS.visualPreset === 'letters') {
            ctx.font = `bold ${this.size * 1.5}px 'Outfit', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.fillText(this.char || getRandomLetter(), 0, 0);
        } else if (SETTINGS.visualPreset === 'watercolor') {
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
            grad.addColorStop(0, this.color);
            grad.addColorStop(0.3, this.color);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Utility to draw simple stars on canvas
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

function getRandomLetter() {
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return pool[Math.floor(Math.random() * pool.length)];
}

// Triggered on keyboard input or screen click
function triggerEngagement(x, y, character = '') {
    // Block all interactions when timer lock is active
    if (timerLocked) return;

    // Mobile tactile feedback
    if (navigator.vibrate) navigator.vibrate(20);

    // Hide intro panel on first interaction
    const intro = document.getElementById('introMessage');
    if (intro && getComputedStyle(intro).opacity !== '0') {
        intro.style.opacity = '0';
        setTimeout(() => {
            if (intro.parentNode) intro.parentNode.removeChild(intro);
        }, 1500);
    }
    
    // Choose notes harmoniously based on location or letter code
    let scaleIndex = 0;
    if (character) {
        const code = character.toUpperCase().charCodeAt(0);
        scaleIndex = code % PENTATONIC_SCALE.length;
    } else {
        scaleIndex = Math.floor((x / window.innerWidth) * PENTATONIC_SCALE.length);
    }
    
    const pitch = PENTATONIC_SCALE[scaleIndex];
    playSynthesizedNote(pitch);
    
    // Add particle to unified engine
    sensoryCanvas.addParticle(new Particle(x, y, character));
}

// --- Interactive Events Setup ---
let lastEngagementTime = 0;
const DRAG_SOUND_COOLDOWN = 140; // ms between sounds during drag
let isDragging = false;

function handleDrag(x, y) {
    if (timerLocked) return;
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    
    // Add particle to unified engine
    sensoryCanvas.addParticle(new Particle(x, y));
    
    // Play throttled sound
    const now = Date.now();
    if (now - lastEngagementTime > DRAG_SOUND_COOLDOWN) {
        let scaleIndex = Math.floor((x / window.innerWidth) * PENTATONIC_SCALE.length);
        const pitch = PENTATONIC_SCALE[scaleIndex];
        playSynthesizedNote(pitch);
        lastEngagementTime = now;
        if (navigator.vibrate) navigator.vibrate(10);
    }
}

// 1. Mouse & Multi-Touch events mapping
const canvasEl = document.getElementById('playCanvas');
canvasEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) {
        return; 
    }
    isDragging = true;
    triggerEngagement(e.clientX, e.clientY);
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

canvasEl.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    handleDrag(e.clientX, e.clientY);
});

canvasEl.addEventListener('touchstart', (e) => {
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) {
        return; 
    }
    
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const buttonRect = document.getElementById('settingsTrigger').getBoundingClientRect();
        if (touch.clientX >= buttonRect.left && touch.clientY >= buttonRect.top) {
            continue; 
        }
        triggerEngagement(touch.clientX, touch.clientY);
    }
}, { passive: true });

canvasEl.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const buttonRect = document.getElementById('settingsTrigger').getBoundingClientRect();
        if (touch.clientX >= buttonRect.left && touch.clientY >= buttonRect.top) {
            continue; 
        }
        handleDrag(touch.clientX, touch.clientY);
    }
}, { passive: true });

// 2. Keyboard typing events mapping
window.addEventListener('keydown', (e) => {
    const drawerOpen = !document.getElementById('settingsDrawer').classList.contains('hidden');
    if (drawerOpen) return;
    
    const ignoredKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab', 'Backspace', 'Enter'];
    if (ignoredKeys.includes(e.key)) {
        e.preventDefault();
    }
    
    // Extract letter to print
    let keyChar = '';
    if (e.key.length === 1) {
        keyChar = e.key;
    } else if (e.key === ' ') {
        keyChar = ' ';
    }
    
    if (keyChar === '') return;
    
    const randomX = Math.random() * (window.innerWidth * 0.6) + (window.innerWidth * 0.2);
    const randomY = Math.random() * (window.innerHeight * 0.4) + (window.innerHeight * 0.3);
    
    triggerEngagement(randomX, randomY, keyChar);
});

// Watch for timer lock to clear particles
setInterval(() => {
    if (timerLocked && sensoryCanvas.particles.length > 0) {
        sensoryCanvas.clear();
    }
}, 500);
