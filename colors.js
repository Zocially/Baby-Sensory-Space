/**
 * MAGIC COLOR MIXER - INTERACTION LOGIC
 * Physics-based canvas bubbles, drag-and-merge color mixing, and chimes.
 * Inherits SETTINGS, PALETTE_COLORS, PENTATONIC_SCALE, playSynthesizedNote, speakText, and SensoryCanvas from shared.js.
 */

// Initialize canvas engine
const sensoryCanvas = new SensoryCanvas('playCanvas');

// Color bubble details & mixing rules
const COLOR_DETAILS = {
    red: { hex: '#f87171', name: 'Red', emoji: '🔴' },
    yellow: { hex: '#fbbf24', name: 'Yellow', emoji: '🟡' },
    blue: { hex: '#60a5fa', name: 'Blue', emoji: '🔵' },
    orange: { hex: '#fb923c', name: 'Orange', emoji: '🟠' },
    green: { hex: '#4ade80', name: 'Green', emoji: '🟢' },
    purple: { hex: '#c084fc', name: 'Purple', emoji: '🟣' },
    rainbow: { hex: '#a7f3d0', name: 'Rainbow', emoji: '🌈' }
};

const MIX_RULES = {
    'red+yellow': 'orange',
    'yellow+red': 'orange',
    'red+blue': 'purple',
    'blue+red': 'purple',
    'blue+yellow': 'green',
    'yellow+blue': 'green'
};

const colorInstructions = document.getElementById('colorInstructions');
const giantDisplay = document.getElementById('giantDisplay');
const giantIllustration = document.getElementById('giantIllustration');
const giantWord = document.getElementById('giantWord');

let displayTimerId = null;
let activeDraggingBubble = null;

// --- Color Bubble Class ---
class ColorBubble {
    constructor(x, y, colorType, radius = 55) {
        this.x = x;
        this.y = y;
        this.colorType = colorType;
        this.radius = radius;
        this.details = COLOR_DETAILS[colorType] || COLOR_DETAILS.red;
        
        // Slow float speeds
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = -(Math.random() * 0.8 + 0.4);
        
        this.isDragging = false;
        
        // Bouncy spring properties for squishy bubble rendering
        this.wobbleAngle = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.08 + 0.04;
        this.wobbleAmount = 3.5;
    }
    
    update(width, height) {
        if (this.isDragging) {
            // Velocity resets when dragging
            this.vx = 0;
            this.vy = 0;
        } else {
            // Float physics
            this.x += this.vx;
            this.y += this.vy;
            
            // Wobble animation
            this.wobbleAngle += this.wobbleSpeed;
            
            // Slow gravity drag friction
            this.vx *= 0.99;
            this.vy *= 0.99;
            
            // Constrain within walls (with bounce)
            if (this.x - this.radius < 0) {
                this.x = this.radius;
                this.vx *= -1;
            }
            if (this.x + this.radius > width) {
                this.x = width - this.radius;
                this.vx *= -1;
            }
            // Constrain top/bottom (leave space for buttons at top)
            if (this.y - this.radius < 110) {
                this.y = 110 + this.radius;
                this.vy = Math.abs(this.vy) * 0.7; // bounce down gently
            }
            if (this.y + this.radius > height) {
                this.y = height - this.radius;
                this.vy = -Math.abs(this.vy) * 0.7; // bounce up
            }
            
            // Check collisions and mix
            this.checkCollisions();
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Render bubble body with squishy wobble scaling
        const wobbleX = 1 + Math.sin(this.wobbleAngle) * (this.wobbleAmount / this.radius);
        const wobbleY = 1 - Math.sin(this.wobbleAngle) * (this.wobbleAmount / this.radius);
        ctx.scale(wobbleX, wobbleY);
        
        // 1. Soft radial gradient fill
        const gradient = ctx.createRadialGradient(-this.radius/4, -this.radius/4, this.radius/8, 0, 0, this.radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, this.details.hex + '99'); // semi-transparent
        gradient.addColorStop(0.9, this.details.hex + 'cc');
        gradient.addColorStop(1, this.details.hex);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 2. White bubble highlight reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-this.radius/3, -this.radius/3, this.radius/4, this.radius/8, -Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // 3. Spoken Text emoji/label inside
        ctx.fillStyle = this.colorType === 'yellow' ? '#78350f' : '#ffffff';
        ctx.font = `bold ${this.radius * 0.35}px Outfit`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.details.name, 0, this.radius * 0.1);
        
        ctx.restore();
    }
    
    checkCollisions() {
        const particles = sensoryCanvas.particles;
        for (let i = 0; i < particles.length; i++) {
            const other = particles[i];
            if (other === this || !(other instanceof ColorBubble)) continue;
            
            // Calculate distance
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.hypot(dx, dy);
            const minDist = this.radius + other.radius;
            
            if (dist < minDist - 8) {
                // Collided! Perform merge
                this.mergeWith(other, i);
                break;
            }
        }
    }
    
    mergeWith(other, otherIndex) {
        // Determine mixed result color
        let resultType = 'rainbow';
        let key = `${this.colorType}+${other.colorType}`;
        
        if (this.colorType === other.colorType) {
            resultType = this.colorType; // same colors make larger version
        } else if (MIX_RULES[key]) {
            resultType = MIX_RULES[key];
        }
        
        // Play mixed sound & show overlay
        const mixedDetails = COLOR_DETAILS[resultType];
        
        // Synthesize nice arpeggio chord feedback
        playSynthesizedNote(293.66); // D4
        setTimeout(() => playSynthesizedNote(392.00), 80); // G4
        setTimeout(() => playSynthesizedNote(587.33), 160); // D5
        
        // Vibrate
        if (navigator.vibrate) navigator.vibrate([20, 10, 20]);
        
        // Speak results
        if (this.colorType === other.colorType) {
            speakText(`Big ${mixedDetails.name}!`);
        } else {
            speakText(`${this.details.name} and ${other.details.name} make ${mixedDetails.name}!`);
        }
        
        // Giant overlay
        if (displayTimerId) clearTimeout(displayTimerId);
        giantIllustration.textContent = mixedDetails.emoji;
        giantWord.textContent = mixedDetails.name;
        giantDisplay.classList.remove('hidden');
        giantDisplay.style.animation = 'none';
        giantDisplay.offsetHeight;
        giantDisplay.style.animation = 'fadeScaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.25) forwards';
        
        displayTimerId = setTimeout(() => {
            giantDisplay.classList.add('hidden');
        }, 3500);
        
        // Remove the other bubble from array
        sensoryCanvas.particles.splice(otherIndex, 1);
        
        // Upgrade current bubble sizes/colors
        this.colorType = resultType;
        this.details = mixedDetails;
        this.radius = Math.min(110, Math.max(this.radius, other.radius) + 12);
        
        // Bouncy merge visual feedback (expand radius temporarily)
        const originalRadius = this.radius;
        this.radius = originalRadius + 18;
        setTimeout(() => { this.radius = originalRadius; }, 180);
        
        // Splash small sparkles
        for (let j = 0; j < 6; j++) {
            const angle = (j / 6) * Math.PI * 2;
            const vx = Math.cos(angle) * 3;
            const vy = Math.sin(angle) * 3;
            sensoryCanvas.addParticle(new SparkleParticle(this.x, this.y, this.details.hex, vx, vy));
        }
        
        // Hide instructions once mixing starts
        if (colorInstructions) {
            colorInstructions.style.display = 'none';
        }
    }
}

// Sparkle Particle class for merge reward effects
class SparkleParticle {
    constructor(x, y, hex, vx, vy) {
        this.x = x;
        this.y = y;
        this.color = hex;
        this.vx = vx;
        this.vy = vy;
        this.size = Math.random() * 8 + 6;
        this.life = 45;
        this.alpha = 1;
    }
    
    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.08; // slow drop gravity
        this.life--;
        this.alpha = this.life / 45;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- Spawn logic ---
function spawnBubble(colorType, hex) {
    if (timerLocked) return;
    
    // Hide instruction text
    if (colorInstructions) colorInstructions.style.display = 'none';
    
    // Soft harp pluck on spawn
    playSynthesizedNote(329.63); // E4
    
    // Spawn at random location near center top
    const startX = Math.random() * (window.innerWidth * 0.4) + (window.innerWidth * 0.3);
    const startY = 160 + Math.random() * 40;
    
    const newBubble = new ColorBubble(startX, startY, colorType);
    sensoryCanvas.addParticle(newBubble);
}

// Set up spawn pad clicks
const colorPads = document.getElementById('colorPads');
colorPads.querySelectorAll('.pad-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (timerLocked) return;
        e.stopPropagation();
        
        const color = btn.dataset.color;
        const hex = btn.dataset.hex;
        spawnBubble(color, hex);
        
        // Bounce button
        btn.style.transform = 'scale(0.92)';
        setTimeout(() => { btn.style.transform = ''; }, 120);
    });
});

// --- Mouse / Touch Dragging Logic ---
function getTouchCoords(e) {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function handleStartDrag(clientX, clientY) {
    // Check if clicked inside any bubble
    const bubbles = sensoryCanvas.particles.filter(p => p instanceof ColorBubble);
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i];
        const dist = Math.hypot(clientX - bubble.x, clientY - bubble.y);
        if (dist < bubble.radius + 10) {
            activeDraggingBubble = bubble;
            bubble.isDragging = true;
            break;
        }
    }
}

function handleMoveDrag(clientX, clientY) {
    if (activeDraggingBubble) {
        // Constrain bubble center inside viewport boundary limits
        activeDraggingBubble.x = Math.max(activeDraggingBubble.radius, Math.min(window.innerWidth - activeDraggingBubble.radius, clientX));
        activeDraggingBubble.y = Math.max(120 + activeDraggingBubble.radius, Math.min(window.innerHeight - activeDraggingBubble.radius, clientY));
    }
}

function handleStopDrag() {
    if (activeDraggingBubble) {
        activeDraggingBubble.isDragging = false;
        // Give a tiny random speed release nudge
        activeDraggingBubble.vx = (Math.random() - 0.5) * 1.8;
        activeDraggingBubble.vy = -(Math.random() * 0.8 + 0.4);
        activeDraggingBubble = null;
    }
}

// Attach listeners to canvas
const canvasEl = document.getElementById('playCanvas');
canvasEl.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    
    handleStartDrag(e.clientX, e.clientY);
    
    // If we didn't grab a bubble, play background tap note & spawn standard floaters
    if (!activeDraggingBubble) {
        const scaleIndex = Math.floor((e.clientX / window.innerWidth) * PENTATONIC_SCALE.length);
        playSynthesizedNote(PENTATONIC_SCALE[scaleIndex]);
        for (let i = 0; i < 4; i++) {
            sensoryCanvas.addParticle(new SparkleParticle(e.clientX, e.clientY, '#ffffff', (Math.random() - 0.5) * 3, -(Math.random() * 2 + 1)));
        }
    }
});

canvasEl.addEventListener('mousemove', (e) => {
    handleMoveDrag(e.clientX, e.clientY);
});

window.addEventListener('mouseup', () => {
    handleStopDrag();
});

// Mobile Touch Drag support
canvasEl.addEventListener('touchstart', (e) => {
    if (document.getElementById('settingsDrawer').classList.contains('hidden') === false) return;
    const coords = getTouchCoords(e);
    
    // Avoid triggering drag if touching settings trigger
    const buttonRect = document.getElementById('settingsTrigger').getBoundingClientRect();
    if (coords.x >= buttonRect.left && coords.y >= buttonRect.top) {
        return; 
    }
    
    handleStartDrag(coords.x, coords.y);
    
    if (!activeDraggingBubble) {
        const scaleIndex = Math.floor((coords.x / window.innerWidth) * PENTATONIC_SCALE.length);
        playSynthesizedNote(PENTATONIC_SCALE[scaleIndex]);
        for (let i = 0; i < 4; i++) {
            sensoryCanvas.addParticle(new SparkleParticle(coords.x, coords.y, '#ffffff', (Math.random() - 0.5) * 3, -(Math.random() * 2 + 1)));
        }
    }
}, { passive: true });

canvasEl.addEventListener('touchmove', (e) => {
    const coords = getTouchCoords(e);
    handleMoveDrag(coords.x, coords.y);
}, { passive: true });

window.addEventListener('touchend', () => {
    handleStopDrag();
});

// Clear canvas during lockout
setInterval(() => {
    if (timerLocked && sensoryCanvas.particles.length > 0) {
        sensoryCanvas.clear();
        giantDisplay.classList.add('hidden');
    }
}, 500);
