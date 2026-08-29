/**
 * BODY EXPLORER - INTERACTION LOGIC
 * Interactive SVG body mapping, Speech voice synthesis, chimes, and background canvas bubbles.
 * Inherits SETTINGS, PALETTE_COLORS, PENTATONIC_SCALE, playSynthesizedNote, speakText, and SensoryCanvas from shared.js.
 */

// Initialize unified canvas engine
const sensoryCanvas = new SensoryCanvas('playCanvas');

const teddySvg = document.getElementById('teddySvg');
const bodyLabel = document.getElementById('bodyLabel');

// Map of part names to custom frequencies in Hz
const PART_SOUNDS = {
    Head: 523.25,     // C5
    Eyes: 587.33,     // D5
    Nose: 440.00,     // A4
    Mouth: 392.00,    // G4
    Ear: 659.25,      // E5
    Tummy: 261.63,    // C4
    Hands: 329.63,    // E4
    Feet: 196.00      // G3
};

let labelTimerId = null;
let activeHighlightTimeout = null;

// --- Bind Interactive SVG elements ---
function initBodyParts() {
    const parts = document.querySelectorAll('.teddy-part');
    parts.forEach(partEl => {
        const partName = partEl.dataset.part;
        if (!partName) return;
        
        partEl.addEventListener('click', (e) => {
            if (timerLocked) return;
            e.stopPropagation(); // prevent background canvas clicks
            
            triggerBodyPart(partName, e.clientX, e.clientY);
        });
    });
}

// --- Trigger Body Part feedback ---
function triggerBodyPart(partName, clickX, clickY) {
    if (timerLocked) return;

    if (navigator.vibrate) navigator.vibrate(30);

    // 1. Audio and Speech synthesis
    const freq = PART_SOUNDS[partName] || 330;
    playSynthesizedNote(freq);
    speakText(partName);
    
    // 2. Position and show floating bubble label (converted to container-relative coords)
    if (labelTimerId) clearTimeout(labelTimerId);
    
    const container = document.querySelector('.body-container');
    const rect = container.getBoundingClientRect();
    const localX = clickX - rect.left;
    const localY = clickY - rect.top;
    
    bodyLabel.textContent = partName;
    bodyLabel.style.left = `${localX}px`;
    bodyLabel.style.top = `${localY - 45}px`;
    bodyLabel.classList.add('visible');
    
    labelTimerId = setTimeout(() => {
        bodyLabel.classList.remove('visible');
    }, 2000);
    
    // 3. Visual SVG Highlight
    if (activeHighlightTimeout) clearTimeout(activeHighlightTimeout);
    
    // Remove active class from all parts
    document.querySelectorAll('.teddy-part').forEach(p => p.classList.remove('active'));
    
    // Highlight all elements belonging to this part (e.g. both feet, both ears)
    document.querySelectorAll(`.teddy-part[data-part="${partName}"]`).forEach(p => {
        p.classList.add('active');
    });
    
    activeHighlightTimeout = setTimeout(() => {
        document.querySelectorAll(`.teddy-part[data-part="${partName}"]`).forEach(p => {
            p.classList.remove('active');
        });
    }, 1500);
    
    // 4. Background canvas floating effects
    const pX = clickX || window.innerWidth / 2;
    const pY = clickY || window.innerHeight / 2;
    
    for (let i = 0; i < 5; i++) {
        sensoryCanvas.addParticle(new Particle(
            pX + (Math.random() - 0.5) * 40,
            pY + (Math.random() - 0.5) * 40
        ));
    }
}

// Particle definition for Body Explorer
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        const currentColors = PALETTE_COLORS[SETTINGS.theme] || PALETTE_COLORS['warm-sand'];
        this.color = currentColors[Math.floor(Math.random() * currentColors.length)];
        
        const speedScale = SETTINGS.speed === 1 ? 0.4 : (SETTINGS.speed === 3 ? 1.5 : 0.8);
        this.vx = (Math.random() - 0.5) * 2.5 * speedScale;
        this.vy = -(Math.random() * 2.2 + 0.8) * speedScale; // Float up
        
        this.baseSize = Math.random() * 20 + 35;
        this.size = this.baseSize;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.015;
        
        this.maxLife = 160 + Math.random() * 80;
        this.life = this.maxLife;
        this.alpha = 0;
        
        const shapes = ['heart', 'star', 'bubble'];
        this.shape = shapes[Math.floor(Math.random() * shapes.length)];
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
        
        ctx.beginPath();
        if (this.shape === 'heart') {
            const w = this.size, h = this.size;
            ctx.moveTo(0, -h/6);
            ctx.bezierCurveTo(w/4, -h/2, w/2, -h/4, 0, h/2.5);
            ctx.bezierCurveTo(-w/2, -h/4, -w/4, -h/2, 0, -h/6);
            ctx.fill();
        } else if (this.shape === 'star') {
            // draw simple circle stars
            ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // soft bubble
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Background click/tap interaction
const canvasEl = document.getElementById('playCanvas');
canvasEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    
    // Play light chord on background click
    const scaleIdx = Math.floor((e.clientX / window.innerWidth) * PENTATONIC_SCALE.length);
    playSynthesizedNote(PENTATONIC_SCALE[scaleIdx]);
    
    for (let i = 0; i < 4; i++) {
        sensoryCanvas.addParticle(new Particle(e.clientX, e.clientY));
    }
});

// Clear canvas particles during lockout
setInterval(() => {
    if (timerLocked && sensoryCanvas.particles.length > 0) {
        sensoryCanvas.clear();
        bodyLabel.classList.remove('visible');
    }
}, 500);

// --- Init Page ---
window.addEventListener('DOMContentLoaded', () => {
    initBodyParts();
});
