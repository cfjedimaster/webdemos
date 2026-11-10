/**
 * NAGEL // GRID '84 — Procedural 1984 Analog Synth & Arcade SFX Engine
 * Pure Web Audio API (no external MP3/WAV dependencies).
 * Synthesizes an F-minor Italo-Cyberpunk bassline, gated-reverb snare,
 * punchy kick, arpeggio stabs, turn chirps, graze sparks, and derez blasts.
 */
class SynthGridAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicFilter = null;
    this.noiseBuffer = null;

    this.enabled = true;
    this.musicEnabled = true;
    this.isPlayingMusic = false;
    this.muffled = false;
    this.turboActive = false;

    this.bpm = 126;
    this.stepIndex = 0;
    this.nextNoteTime = 0;
    this.schedulerId = null;

    // F minor cyberpunk progression: Fm -> Db -> Ab -> Eb (16th-note bass MIDI notes)
    // F1=29, F2=41, Db2=37, Ab1=32, Ab2=44, Eb2=39, G2=43
    this.bassBars = [
      [29, 41, 29, 41, 29, 41, 44, 41, 29, 41, 29, 41, 43, 41, 39, 37],
      [37, 49, 37, 49, 37, 49, 51, 49, 37, 49, 37, 49, 48, 46, 44, 43],
      [32, 44, 32, 44, 32, 44, 48, 44, 32, 44, 32, 44, 46, 44, 43, 41],
      [39, 51, 39, 51, 39, 51, 53, 51, 39, 51, 43, 55, 44, 56, 43, 55],
    ];

    // Sparkling New Wave / Nagel synth arpeggio notes (MIDI)
    this.arpBars = [
      [65, 68, 72, 77, 72, 68, 75, 72, 65, 68, 72, 79, 77, 72, 68, 72],
      [65, 68, 73, 77, 73, 68, 75, 73, 65, 68, 73, 80, 77, 73, 68, 73],
      [63, 68, 72, 75, 72, 68, 77, 75, 63, 68, 72, 79, 75, 72, 68, 72],
      [63, 67, 70, 75, 70, 67, 77, 75, 67, 70, 75, 79, 80, 79, 75, 70],
    ];
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Master bus with gentle compressor to glue the 80s mix
    const compressor = this.ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    compressor.knee.setValueAtTime(18, this.ctx.currentTime);
    compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    compressor.attack.setValueAtTime(0.004, this.ctx.currentTime);
    compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    this.musicFilter = this.ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.setValueAtTime(5200, this.ctx.currentTime);
    this.musicFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.42, this.ctx.currentTime);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.68, this.ctx.currentTime);

    this.musicGain.connect(this.musicFilter);
    this.musicFilter.connect(compressor);
    this.sfxGain.connect(compressor);
    compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Pre-build 2-second white noise buffer for gated snare & derez blasts
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  setMuffled(isMuffled) {
    this.muffled = isMuffled;
    if (!this.ctx || !this.musicFilter) return;
    const now = this.ctx.currentTime;
    const targetFreq = isMuffled ? 650 : this.turboActive ? 9500 : 5200;
    this.musicFilter.frequency.cancelScheduledValues(now);
    this.musicFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
  }

  setTurboState(isTurbo) {
    if (this.turboActive === isTurbo) return;
    this.turboActive = isTurbo;
    if (!this.ctx || !this.musicFilter) return;
    if (!this.muffled) {
      const now = this.ctx.currentTime;
      this.musicFilter.frequency.cancelScheduledValues(now);
      this.musicFilter.frequency.setTargetAtTime(isTurbo ? 9800 : 5200, now, 0.05);
    }
  }

  toggleAudio() {
    this.init();
    this.enabled = !this.enabled;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? 0.75 : 0, this.ctx.currentTime, 0.03);
    }
    if (this.enabled && this.musicEnabled && !this.isPlayingMusic) {
      this.startMusic();
    }
    return this.enabled;
  }

  toggleMusic() {
    this.init();
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  startMusic() {
    this.init();
    if (!this.ctx || !this.musicEnabled || this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.stepIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.04;
    this.schedulerId = window.setInterval(() => this.scheduleSteps(), 25);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
  }

  scheduleSteps() {
    if (!this.ctx || !this.isPlayingMusic) return;
    const secondsPerBeat = 60 / (this.turboActive ? this.bpm + 8 : this.bpm);
    const stepDuration = secondsPerBeat / 4; // 16th notes

    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.playSequencerStep(this.stepIndex, this.nextNoteTime, stepDuration);
      this.nextNoteTime += stepDuration;
      this.stepIndex = (this.stepIndex + 1) % 64;
    }
  }

  playSequencerStep(step, time, dur) {
    const bar = Math.floor(step / 16) % 4;
    const stepInBar = step % 16;

    // 1. Four-on-the-floor LinnDrum-inspired punchy kick (steps 0, 4, 8, 12)
    if (stepInBar % 4 === 0) {
      this.triggerKick(time);
    }

    // 2. Massive 1984 gated-reverb snare on backbeats (steps 4, 12)
    if (stepInBar === 4 || stepInBar === 12) {
      this.triggerGatedSnare(time);
    }

    // 3. Crisp 16th-note closed hi-hat
    if (stepInBar % 2 === 0 || this.turboActive) {
      this.triggerHat(time, stepInBar % 4 === 2 ? 0.11 : 0.045);
    }

    // 4. Driving octave sawtooth synth bass
    const bassMidi = this.bassBars[bar][stepInBar];
    this.triggerBassNote(this.midiToFreq(bassMidi), time, dur * 0.85);

    // 5. Shimmering Nagel neon arpeggio (quieter when muffled)
    if (!this.muffled && (stepInBar % 2 === 0 || stepInBar === 15)) {
      const arpMidi = this.arpBars[bar][stepInBar];
      this.triggerArpNote(this.midiToFreq(arpMidi), time, dur * 1.3);
    }
  }

  triggerKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.13);

    gain.gain.setValueAtTime(0.62, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.17);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.18);
  }

  triggerGatedSnare(time) {
    // Tonal body
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, time);
    osc.frequency.exponentialRampToValueAtTime(105, time + 0.09);
    oscGain.gain.setValueAtTime(0.32, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);
    osc.connect(oscGain);
    oscGain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.12);

    // Gated white noise tail (classic 1984 Phil Collins / Miami Vice abrupt gate!)
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1850, time);
    bandpass.Q.setValueAtTime(0.7, time);

    const gate = this.ctx.createGain();
    gate.gain.setValueAtTime(0.34, time);
    gate.gain.setValueAtTime(0.28, time + 0.13); // Hold open
    gate.gain.exponentialRampToValueAtTime(0.001, time + 0.19); // Hard gate slam!

    noise.connect(bandpass);
    bandpass.connect(gate);
    gate.connect(this.musicGain);
    noise.start(time);
    noise.stop(time + 0.21);
  }

  triggerHat(time, volume) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    noise.connect(hp);
    hp.connect(gain);
    gain.connect(this.musicGain);
    noise.start(time);
    noise.stop(time + 0.05);
  }

  triggerBassNote(freq, time, dur) {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 0.996, time); // Warm analog detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(240, time + dur);
    filter.Q.setValueAtTime(3.2, time);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + dur + 0.01);
    osc2.stop(time + dur + 0.01);
  }

  triggerArpNote(freq, time, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.075, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  // --- ARCADE SOUND EFFECTS ---

  playTurn(dirIndex = 0, isPlayer = true) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pitches = [523.25, 622.25, 698.46, 783.99]; // C5, Eb5, F5, G5 (Fm pentatonic!)
    const base = pitches[dirIndex % 4] * (isPlayer ? 1 : 0.75);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isPlayer ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(base * 0.65, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.055);

    gain.gain.setValueAtTime(isPlayer ? 0.17 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playGraze() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1480 + Math.random() * 520, now);
    osc.frequency.exponentialRampToValueAtTime(2960, now + 0.045);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  playPrismPickup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const t = this.ctx.currentTime + i * 0.042;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playDerez() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub-bass laser drop
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(290, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.65);
    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.7);

    // Shimmering digital shatter noise
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.frequency.exponentialRampToValueAtTime(220, now + 0.55);
      filter.Q.setValueAtTime(1.8, now);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.55, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(now);
      noise.stop(now + 0.6);
    }
  }

  playRoundWin() {
    if (!this.enabled || !this.ctx) return;
    // Dramatic 80s synth brass fanfare (Fm9 -> Abmaj7)
    const chord = [349.23, 415.3, 523.25, 622.25, 783.99];
    const now = this.ctx.currentTime;
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);
      gain.gain.setValueAtTime(0.11, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.035);
      osc.stop(now + 0.78);
    });
  }

  playCountdownBeep(isGo = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.28 : 0.12));
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + (isGo ? 0.3 : 0.14));
  }
}

window.SynthGridAudio = SynthGridAudio;
