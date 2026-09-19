/**
 * Web Audio API Synthesizer
 * Generates realistic roulette mechanical clicks and ball rolling whirs.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.volume = 1.0;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playBallRollWhir(duration = 0.1) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.setValueAtTime(4.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08 * this.volume, now);
        gain.gain.linearRampToValueAtTime(0.001 * this.volume, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(now);
    }

    playBallFretClick(intensity = 1.0) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2800 * (0.8 + Math.random() * 0.4), now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);

        const vol = Math.min(0.5, 0.25 * intensity) * this.volume;
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
    }

    playBallPocketDrop() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

        gain.gain.setValueAtTime(0.6 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }
}

const sound = new SoundEngine();

// Load Center Logo
const centerLogoImg = new Image();
centerLogoImg.src = 'logosecretoakuma.png';
centerLogoImg.onload = () => {
    if (!state.isSpinning) drawWheel();
};

const DESTINY_RULES = {
    "TODO O NADA": "Puedes quedarte libre o volver a girar; si vuelves a girar debes cumplir lo que salga",
    "TRIPLE 7": "Elige tres personas. Cada una te hace una pregunta y solo te hace una pregunta y solo puedes esquivar una",
    "LA MAQUINA DECIDE": "Chat propone dos opciones y una moneda/ruleta decide cuál haces",
    "ULTIMA PALABRA": "Cuenta una discusión absurda que hayas tenido y qué última frase soltaste",
    "5 SEGUNDOS": "Te hacen una pregunta y solo tienes cinco segundos para contestar",
    "SIN NOMBRES": "Describe a alguien únicamente con tres emojis y una frase",
    "SIN DERECHO A REPLICA": "Tienes 20 segundos para explicar una situación; después otra persona cuenta como la vio ella",
    "SIN DERECHOS A REPLICA": "Tienes 20 segundos para explicar una situación; después otra persona cuenta como la vio ella",
    "ABOGADO DEL DIABLO": "Tienes que defender durante 30 segundos una situación que normalmente criticarías",
    "EL TESTIGO": "Elige a alguien que estuviera presente en una historia tuya para que cuente su versión",
    "FICHA NEGRA": "Responde una pregunta difícil o acepta un castigo aleatorio",
    "FICHA DORADA": "Te salvas y puedes guardar la ficha para cancelar una casilla futura",
    "ROBO DE FICHA": "Puedes quitarle el comodín a otro participante",
    "NO DIRE QUIEN": "Cuenta algo que te hizo alguien sin revelar su identidad",
    "LA SOSPECHA": "Di una situación en la que sospechaste que alguien no te estaba contando toda la verdad",
    "TE LO QUERIA DECIR": "Di algo que llevas tiempo queriendo decirle a alguien del grupo, sin necesidad de que sea negativo",
    "ARCHIVO CLASIFICADO": "Elige entre tres sobres preparados por el host; A,B o C. Cada uno contiene una pregunta distinta",
    "CASUALIDAD": "Cuenta la coincidencia más sospechosa que te haya pasado con alguien",
    "NOMBRE EN CLAVE": "Piensa en alguien y dale 3 pistas sin decir quién es. Los demás intentan adivinar",
    "EL MENSAJE BORRADO": "Di algo que alguna vez escribiste para alguien pero decidiste borrar antes de enviarlo",
    "SIN CONTEXTO": "Suelta una frase real que hayas dicho o recibido sin explicar la historia. Los demás inventan qué pasó",
    "QUIEN DIJO ESO": "El host lee una frase enviada previamente y deben descubrir quién la dijo",
    "CAMBIA MI OPINION": "Di algo que antes pensabas de una persona y que ahora ves completamente diferente",
    "LA MASCARA CAE": "Revela una verdad oculta o cuenta cuál fue la primera impresión equivocada que alguien tuvo de ti"
};

function normalizeStr(s) {
    return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?]/g, "").trim();
}

const DESTINY_RULES_NORM = {};
for (const [key, val] of Object.entries(DESTINY_RULES)) {
    DESTINY_RULES_NORM[normalizeStr(key)] = val;
}

// 18 Options from the image
const WHEEL_ORDER = [
    "ÚLTIMA PALABRA",
    "NOMBRE EN CLAVE",
    "EL MENSAJE BORRADO",
    "SIN CONTEXTO",
    "¿QUIÉN DIJO ESO?",
    "CAMBIA MI OPINIÓN",
    "NO DIRÉ QUIÉN",
    "LA SOSPECHA",
    "LA MÁSCARA CAE",
    "TE LO QUERÍA DECIR",
    "ARCHIVO CLASIFICADO",
    "¿CASUALIDAD?",
    "SIN DERECHO A RÉPLICA",
    "ABOGADO DEL DIABLO",
    "FICHA NEGRA",
    "FICHA DORADA",
    "LA MÁQUINA DECIDE",
    "SIN NOMBRES"
];

const numPockets = WHEEL_ORDER.length;
const pocketAngle = (Math.PI * 2) / numPockets;

const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');

const state = {
    isSpinning: false,
    wheelAngle: 0,
    wheelSpeed: 0,
    ballAngle: 0,
    ballSpeed: 0,
    ballRadiusFactor: 0.88,
    ballState: 'IDLE',
    lastFretPassed: -1,
    targetPocketIndex: null
};

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 340;
    const innerRadius = 90;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(state.wheelAngle);

    for (let i = 0; i < numPockets; i++) {
        const startA = i * pocketAngle - pocketAngle / 2;
        const endA = startA + pocketAngle;

        // Colors: Deep Blood Red and Pure Black
        const isRed = i % 2 === 0;
        ctx.fillStyle = isRed ? '#700202' : '#0a0a0a';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, outerRadius, startA, endA);
        ctx.fill();

        // Slice Borders
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#2a0000';
        ctx.stroke();

        // Fret separators for the ball to bounce on
        ctx.beginPath();
        ctx.moveTo(Math.cos(startA) * innerRadius, Math.sin(startA) * innerRadius);
        ctx.lineTo(Math.cos(startA) * outerRadius, Math.sin(startA) * outerRadius);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ff1a1a'; // Bloody frets
        ctx.stroke();

        // Slice Text
        ctx.save();
        const midA = (startA + endA) / 2;
        ctx.rotate(midA);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.font = '30px "Bebas Neue", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // Draw radially reading towards the center
        ctx.translate(outerRadius - 20, 0); 
        
        // Limit width so it doesn't overlap the black center circle
        const maxTextWidth = (outerRadius - 20) - innerRadius - 10; 
        ctx.fillText(WHEEL_ORDER[i], 0, 0, maxTextWidth);
        
        ctx.restore();
    }

    // Outer rim track border
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1a0000';
    ctx.stroke();

    // Center Graphic (JACKPOT 777)
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#050505';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();

    // Center glow
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, innerRadius);
    centerGrad.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
    centerGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGrad;
    ctx.fill();

    // Keep center text upright (counter-rotate)
    ctx.save();
    ctx.rotate(-state.wheelAngle);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Center Image Logo
    if (centerLogoImg.complete && centerLogoImg.naturalWidth > 0) {
        const imgRatio = centerLogoImg.naturalWidth / centerLogoImg.naturalHeight;
        const maxDim = innerRadius * 1.8; // Larger size to fill more of the circle
        let drawW, drawH;
        if (imgRatio > 1) {
            drawW = maxDim;
            drawH = maxDim / imgRatio;
        } else {
            drawH = maxDim;
            drawW = maxDim * imgRatio;
        }

        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 15;
        ctx.drawImage(centerLogoImg, -drawW / 2, -drawH / 2, drawW, drawH);
    }

    ctx.restore();

    ctx.restore(); // Unrotate global canvas

    // Draw the ball
    if (state.ballState !== 'IDLE' || true) {
        const currentBallRadius = outerRadius * state.ballRadiusFactor;
        const ballX = centerX + Math.cos(state.ballAngle) * currentBallRadius;
        const ballY = centerY + Math.sin(state.ballAngle) * currentBallRadius;

        // Ball Shadow
        ctx.beginPath();
        ctx.arc(ballX - 6, ballY + 10, 16, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fill();

        // Ball Body (Ivory White)
        ctx.beginPath();
        ctx.arc(ballX, ballY, 16, 0, Math.PI * 2);
        const ballGrad = ctx.createRadialGradient(ballX - 6, ballY - 6, 2, ballX, ballY, 16);
        ballGrad.addColorStop(0, '#ffffff');
        ballGrad.addColorStop(1, '#cccccc');
        ctx.fillStyle = ballGrad;
        ctx.fill();
    }
}

let animationFrameId = null;

function spin() {
    if (state.isSpinning) return;

    state.isSpinning = true;

    const modal = document.getElementById('resultModal');
    const card = document.getElementById('resultPreviewCard');
    modal.classList.remove('opacity-100', 'pointer-events-auto');
    modal.classList.add('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-100');
    card.classList.add('scale-95');

    state.targetPocketIndex = null;

    state.wheelSpeed = 0.05 + Math.random() * 0.02;
    state.ballSpeed = -(0.25 + Math.random() * 0.08);
    state.ballRadiusFactor = 0.88;
    state.ballState = 'ROLLING';
    state.lastFretPassed = -1;

    const startTime = performance.now();
    const spinDuration = 7500; // Increased to 7.5 seconds for maximum suspense

    function animateSpin(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / spinDuration);

        state.wheelAngle += state.wheelSpeed;
        state.wheelSpeed *= 0.9988; // Keep wheel moving longer

        if (progress < 0.60) {
            state.ballAngle += state.ballSpeed;
            state.ballSpeed *= 0.995;
            if (Math.random() < 0.2) sound.playBallRollWhir(0.08);
        } else if (progress < 0.93) {
            state.ballState = 'BOUNCING';
            state.ballAngle += state.ballSpeed;
            state.ballSpeed *= 0.985;

            state.ballRadiusFactor = 0.88 - ((progress - 0.60) / 0.33) * 0.24;

            const currentFret = Math.floor(Math.abs(state.ballAngle - state.wheelAngle) / pocketAngle) % numPockets;
            if (currentFret !== state.lastFretPassed) {
                state.lastFretPassed = currentFret;
                sound.playBallFretClick(1.0 - progress);
            }
        } else {
            state.ballState = 'SETTLED';

            if (state.targetPocketIndex === null) {
                let relAngle = (state.ballAngle - state.wheelAngle) % (Math.PI * 2);
                if (relAngle < 0) relAngle += Math.PI * 2;
                state.targetPocketIndex = Math.round(relAngle / pocketAngle) % numPockets;
            }

            const targetAngleOnWheel = state.targetPocketIndex * pocketAngle;
            const finalAngle = state.wheelAngle + targetAngleOnWheel;

            let angleDiff = (finalAngle - state.ballAngle) % (Math.PI * 2);
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // Physics-based settling: Spring + Friction Damper
            // 1. Friction: The ball slowly catches up to the wheel's rotation speed
            state.ballSpeed += (state.wheelSpeed - state.ballSpeed) * 0.05;
            
            // 2. Spring: The pocket gently pulls the ball towards its center
            state.ballSpeed += angleDiff * 0.004;

            // Apply the natural speed
            state.ballAngle += state.ballSpeed;
            
            // Slowly let the ball slide down into the pocket radially
            state.ballRadiusFactor += (0.64 - state.ballRadiusFactor) * 0.05;

            if (progress > 0.95 && Math.random() < 0.15) sound.playBallPocketDrop();
        }

        drawWheel();

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animateSpin);
        } else {
            finalizeSpin(WHEEL_ORDER[state.targetPocketIndex]);
        }
    }

    animationFrameId = requestAnimationFrame(animateSpin);
}

function finalizeSpin(winningText) {
    sound.playBallPocketDrop();
    state.isSpinning = false;

    const badge = document.getElementById('lastNumberBadge');
    badge.textContent = winningText;

    const descElem = document.getElementById('resultDescription');
    const normKey = normalizeStr(winningText);
    const fullText = DESTINY_RULES_NORM[normKey] || "El destino ha hablado.";

    // Awesome Typewriter effect
    descElem.innerHTML = "";
    let i = 0;
    if (window.typeWriterInterval) clearInterval(window.typeWriterInterval);

    window.typeWriterInterval = setInterval(() => {
        if (i < fullText.length) {
            descElem.innerHTML = fullText.substring(0, i + 1) + '<span class="animate-pulse text-red-500 font-bold">_</span>';
            i++;
        } else {
            clearInterval(window.typeWriterInterval);
            descElem.innerHTML = fullText + '<span class="text-red-600 font-bold">.</span>';
        }
    }, 35); // Fast, snappy typing speed

    const modal = document.getElementById('resultModal');
    const card = document.getElementById('resultPreviewCard');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.add('opacity-100', 'pointer-events-auto');
    card.classList.remove('scale-95');
    card.classList.add('scale-100');
}

window.addEventListener('DOMContentLoaded', () => {
    // Wait for custom fonts to load before first render
    document.fonts.ready.then(() => {
        drawWheel();
    });

    document.getElementById('resultModal').addEventListener('click', (e) => {
        if (e.target.id === 'resultModal') {
            const modal = document.getElementById('resultModal');
            const card = document.getElementById('resultPreviewCard');
            modal.classList.remove('opacity-100', 'pointer-events-auto');
            modal.classList.add('opacity-0', 'pointer-events-none');
            card.classList.remove('scale-100');
            card.classList.add('scale-95');
        }
    });

    canvas.addEventListener('click', () => {
        if (!state.isSpinning) spin();
    });
});
