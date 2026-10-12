// Sound effects made with code (Web Audio), so there are no audio files to credit.
// Browsers only allow sound after the player presses a key or taps, so unlock() is called on input.

const Sfx = {
  ctx: null,
  out: null,
  noiseBuf: null,
  crowdGain: null,
  muted: false,
  volume: 0.8,

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.out = this.ctx.createGain();
        this.out.gain.value = this.muted ? 0 : this.volume;
        this.out.connect(this.ctx.destination);

        const len = this.ctx.sampleRate * 2;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

        this.startCrowd();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      this.ctx = null;
    }
  },

  // A burst of filtered static. Most sounds here (gun, steps, crowd) are shaped noise.
  noise(dur, type, freq, q, gain, attack = 0.003) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(env).connect(this.out);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  },

  tone(from, to, dur, gain, type = 'sine', delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env).connect(this.out);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  },

  gun() {
    this.noise(0.5, 'highpass', 500, 0.7, 1.0);
    this.tone(120, 40, 0.25, 0.6);
  },
  step() { this.noise(0.05, 'lowpass', 1200, 0.8, 0.22); },
  stumble() { this.noise(0.16, 'bandpass', 350, 1.2, 0.4); },
  click() { this.tone(660, 880, 0.06, 0.15, 'triangle'); },
  whistle() {
    this.tone(2100, 2000, 0.18, 0.12, 'square');
    this.tone(2100, 2000, 0.3, 0.12, 'square', 0.25);
  },

  startCrowd() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.5;
    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0.0001;
    src.connect(filter).connect(this.crowdGain).connect(this.out);
    src.start();
  },

  crowd(level) {
    if (!this.ctx || !this.crowdGain) return;
    this.crowdGain.gain.setTargetAtTime(Math.max(level, 0.0001), this.ctx.currentTime, 0.4);
  },

  cheer() {
    this.crowd(0.35);
    setTimeout(() => this.crowd(0.08), 1800);
  },

  setMuted(muted) {
    this.muted = muted;
    if (this.out) this.out.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
  },
};
