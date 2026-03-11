// 8-bit arcade sound engine — Web Audio API, zero dependencies

let ctx: AudioContext | null = null;
let _muted = localStorage.getItem("flow-muted") === "1";

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function isMuted(): boolean { return _muted; }
export function setMuted(m: boolean): void {
  _muted = m;
  localStorage.setItem("flow-muted", m ? "1" : "0");
}
export function toggleMute(): boolean {
  setMuted(!_muted);
  return _muted;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.15,
  startDelay = 0,
): void {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime + startDelay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration);
}

/** Play a rising tone with pitch bend — for sweep effects */
function playBend(
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = "square",
  volume = 0.12,
  startDelay = 0,
): void {
  if (_muted) return;
  const c = getCtx();
  const t = c.currentTime + startDelay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/**
 * CALL — bright ascending chirp: two quick rising notes + sparkle
 * Sounds cheerful, like "cha-ching" / coin collect
 */
function playCallTrade(): void {
  playTone(660, 0.06, "square", 0.07, 0);
  playTone(880, 0.08, "square", 0.09, 0.05);
  playTone(1320, 0.04, "square", 0.04, 0.1); // sparkle
}

/**
 * PUT — dark descending thud: falling pitch + low rumble
 * Sounds ominous, like a drop / warning
 */
function playPutTrade(): void {
  playBend(500, 280, 0.12, "sawtooth", 0.09, 0);
  playTone(180, 0.08, "square", 0.06, 0.08); // bass thud
}

/** Direction-aware trade sound — dramatically different */
export function playTrade(isCall: boolean): void {
  if (isCall) playCallTrade();
  else playPutTrade();
}

/** Ascending arpeggio fanfare for whale trades */
export function playWhale(): void {
  playTone(523, 0.12, "square", 0.15, 0);
  playTone(659, 0.12, "square", 0.15, 0.1);
  playTone(784, 0.12, "square", 0.15, 0.2);
  playTone(1047, 0.2, "sawtooth", 0.12, 0.3);
}

/** Rising dual tone for 3+ streak */
export function playStreak(isCall: boolean): void {
  if (isCall) {
    playTone(523, 0.1, "square", 0.1, 0);
    playTone(784, 0.12, "square", 0.1, 0.08);
  } else {
    playTone(440, 0.1, "sawtooth", 0.1, 0);
    playTone(330, 0.12, "sawtooth", 0.1, 0.08);
  }
}

/** Fast ascending/descending cascade for 5+ combo */
export function playCombo(isCall: boolean): void {
  if (isCall) {
    [523, 659, 784, 988, 1175].forEach((f, i) => {
      playTone(f, 0.08, "square", 0.1, i * 0.05);
    });
  } else {
    [587, 494, 415, 349, 262].forEach((f, i) => {
      playTone(f, 0.08, "sawtooth", 0.1, i * 0.05);
    });
  }
}

/** Victory jingle for power level up */
export function playLevelUp(): void {
  playTone(523, 0.1, "square", 0.12, 0);
  playTone(659, 0.1, "square", 0.12, 0.12);
  playTone(784, 0.1, "square", 0.12, 0.24);
  playTone(1047, 0.25, "sawtooth", 0.1, 0.36);
}

/** Subtle UI click */
export function playClick(): void {
  playTone(1200, 0.03, "square", 0.05);
}

/** Synthesized cat "meow" — descending pitch bend */
export function playMeow(): void {
  if (_muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(900, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.25);
  gain.gain.setValueAtTime(0.1, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.35);
}
