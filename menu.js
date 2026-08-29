/**
 * LANDING PAGE SENSORY BACKGROUND
 * Reuses SETTINGS, PALETTE_COLORS, PENTATONIC_SCALE, and playSynthesizedNote from shared.js
 */

const sensoryCanvas = new SensoryCanvas('playCanvas');

class MenuParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        const currentColors = PALETTE_COLORS[SETTINGS.theme] || PALETTE_COLORS['warm-sand'];
        this.color = currentColors[Math.floor(Math.random() * currentColors.length)];
        
        const speedScale = SETTINGS.speed === 1 ? 0.3 : (SETTINGS.speed === 3 ? 1.0 : 0.6);
        this.vx = (Math.random() - 0.5) * 1.5 * speedScale;
        this.vy = -(Math.random() * 1.2 + 0.5) * speedScale; // slow upward drift
        
        this.baseSize = Math.random() * 30 + 40;
        this.size = this.baseSize;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.008;
        
        this.maxLife = 200 + Math.random() * 100;
        this.life = this.maxLife;
        this.alpha = 0;
    }
    
    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotSpeed;
        this.life--;
        
        const age = this.maxLife - this.life;
        if (age < 20) {
            this.alpha = age / 20;
        } else {
            this.alpha = this.life / (this.maxLife - 20);
        }
        this.size = this.baseSize * (0.7 + 0.3 * (this.life / this.maxLife));
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(0.35, this.alpha * 0.35)); // extra subtle on menu background
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // draw soft bubble outlines
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

function triggerMenuEngagement(x, y) {
    if (timerLocked) return;
    
    // Play light chime
    const scaleIndex = Math.floor((x / window.innerWidth) * PENTATONIC_SCALE.length);
    const pitch = PENTATONIC_SCALE[scaleIndex];
    playSynthesizedNote(pitch);
    
    if (navigator.vibrate) navigator.vibrate(10);
    
    sensoryCanvas.addParticle(new MenuParticle(x, y));
}

// Background interactions
const canvasEl = document.getElementById('playCanvas');
canvasEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    
    triggerMenuEngagement(e.clientX, e.clientY);
});

canvasEl.addEventListener('touchstart', (e) => {
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    
    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        
        // Ensure not clicking the Parent Zone settings button
        const buttonRect = document.getElementById('settingsTrigger').getBoundingClientRect();
        if (touch.clientX >= buttonRect.left && touch.clientY >= buttonRect.top) {
            continue; 
        }
        triggerMenuEngagement(touch.clientX, touch.clientY);
    }
}, { passive: true });

// Keyboard interactions on menu background
window.addEventListener('keydown', (e) => {
    const drawerOpen = !document.getElementById('settingsDrawer').classList.contains('hidden');
    if (drawerOpen) return;
    
    const ignoredKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab', 'Backspace', 'Enter'];
    if (ignoredKeys.includes(e.key)) return;
    
    const randomX = Math.random() * (window.innerWidth * 0.6) + (window.innerWidth * 0.2);
    const randomY = Math.random() * (window.innerHeight * 0.4) + (window.innerHeight * 0.3);
    triggerMenuEngagement(randomX, randomY);
});
