// 100% Procedural Web Audio API sound generator for Urban Run
// Zero external audio files (no MP3, WAV, or OGG). All audio synthesized in real time.

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private lastFootstepTime: number = 0;
  private lastAlertTime: number = 0;
  private lastHazardSweepTime: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Soft pencil friction footstep sound
  playFootstep() {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.lastFootstepTime < 190) return;
    this.lastFootstepTime = now;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110 + Math.random() * 40, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.05);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context may require user interaction
    }
  }

  // Obstacle collision impact (pencil lead snap / crunch)
  playHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(36, this.ctx.currentTime + 0.16);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.16);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // Ignore
    }
  }

  // Low patience warning alert (rapid rhythmic dual-chirp pulse)
  playLowPatienceAlert() {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.lastAlertTime < 900) return;
    this.lastAlertTime = now;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      [0, 0.08].forEach((offset) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t + offset);
        osc.frequency.exponentialRampToValueAtTime(587, t + offset + 0.06);

        gain.gain.setValueAtTime(0.07, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + offset);
        osc.stop(t + offset + 0.06);
      });
    } catch {
      // Ignore
    }
  }

  // Bottom hazard sweep (resonant atmospheric ink/storm wave whoosh)
  playHazardSweep() {
    if (!this.enabled) return;
    const now = performance.now();
    if (now - this.lastHazardSweepTime < 1800) return;
    this.lastHazardSweepTime = now;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.4);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.9);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, t);
      filter.frequency.linearRampToValueAtTime(480, t + 0.4);
      filter.frequency.exponentialRampToValueAtTime(90, t + 0.9);
      filter.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.9);
    } catch {
      // Ignore
    }
  }

  // Vehicle horn beep
  playHorn() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const f1 = 430;
      const f2 = 510;
      [f1, f2].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
      });
    } catch {
      // Ignore
    }
  }

  // Bicycle / scooter bell chime ('ding-ding')
  playBicycleBell() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      [0, 0.08].forEach((t) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2093, this.ctx.currentTime + t);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + t + 0.13);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + t);
        osc.stop(this.ctx.currentTime + t + 0.13);
      });
    } catch {
      // Ignore
    }
  }

  // Pedestrian crowd bustle / murmur shuffle sound
  playCrowdBustle() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.14);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Ignore
    }
  }

  // River water splash
  playSplash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // Ignore
    }
  }

  // Game over sound (descending pencil scribbled cadence)
  playGameOver() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [440, 392, 349, 293];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const start = this.ctx.currentTime + idx * 0.12;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.11, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {
      // Ignore
    }
  }

  // Smooth turn swoosh
  playTurn() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Ignore
    }
  }
  public resume(): void {
    this.initCtx();
  }

  public suspend(): void {
    this.enabled = false;
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public restore(enableSound: boolean = true): void {
    this.enabled = enableSound;
    if (enableSound && this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
}

export const sounds = new SoundController();

// Automatically resume/unlock AudioContext on first user interaction to comply with autoplay policy
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    sounds.resume();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
}
