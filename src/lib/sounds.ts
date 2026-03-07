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

/** Short blip — high for CALL, low for PUT */
export function playTrade(isCall: boolean): void {
  playTone(isCall ? 880 : 440, 0.08, "square", 0.08);
}

/** Ascending arpeggio fanfare for whale trades */
export function playWhale(): void {
  playTone(523, 0.12, "square", 0.15, 0);
  playTone(659, 0.12, "square", 0.15, 0.1);
  playTone(784, 0.12, "square", 0.15, 0.2);
  playTone(1047, 0.2, "sawtooth", 0.12, 0.3);
}

/** Rising dual tone for 3+ streak */
export function playStreak(): void {
  playTone(440, 0.12, "square", 0.1, 0);
  playTone(660, 0.15, "square", 0.1, 0.1);
}

/** Fast ascending cascade for 5+ combo */
export function playCombo(): void {
  [523, 659, 784, 988, 1175].forEach((f, i) => {
    playTone(f, 0.08, "square", 0.1, i * 0.06);
  });
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
