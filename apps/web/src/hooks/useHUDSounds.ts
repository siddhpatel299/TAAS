import { useCallback, useRef } from 'react';
import { useOSStore } from '@/stores/os.store';

export type HUDSound =
  | 'beep'
  | 'click'
  | 'boot'
  | 'login'
  | 'alert'
  | 'open'
  | 'close'
  | 'windowMaximize'
  | 'windowMinimize'
  | 'notification'
  | 'error'
  | 'success'
  | 'hover'
  | 'search'
  | 'snap';

/**
 * HUD-style UI sounds using Web Audio API.
 * No external files — generates sci-fi/tactical sounds programmatically.
 */
export function useHUDSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) => {
      try {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Ignore audio errors (e.g. user hasn't interacted)
      }
    },
    [getContext]
  );

  const playSweep = useCallback(
    (
      startFreq: number,
      endFreq: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume = 0.08
    ) => {
      try {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Ignore audio errors
      }
    },
    [getContext]
  );

  const playDualOsc = useCallback(
    (
      freq1: number,
      freq2: number,
      duration: number,
      type: OscillatorType = 'sine',
      volume = 0.08
    ) => {
      try {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();

        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = osc2.type = type;
        osc1.frequency.value = freq1;
        osc2.frequency.value = freq2;
        osc1.connect(gain);
        osc2.connect(gain);
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + duration);
        osc2.stop(ctx.currentTime + duration);
      } catch {
        // Ignore audio errors
      }
    },
    [getContext]
  );

  const play = useCallback(
    (sound: HUDSound) => {
      if (useOSStore.getState().hudSoundMuted) return;
      try {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
      } catch {
        return;
      }

      switch (sound) {
        case 'beep':
          playTone(1200, 0.04, 'square');
          break;

        case 'click': {
          // Quick digital chirp with slight reverb feel (two rapid tones)
          playTone(900, 0.02, 'square', 0.06);
          setTimeout(() => playTone(1100, 0.025, 'sine', 0.04), 15);
          break;
        }

        case 'boot': {
          // Dramatic: 4 ascending tones + final chord (defense system powering on)
          playTone(400, 0.08, 'square', 0.05);
          setTimeout(() => playTone(550, 0.08, 'square', 0.05), 100);
          setTimeout(() => playTone(700, 0.08, 'square', 0.05), 200);
          setTimeout(() => playTone(900, 0.1, 'square', 0.06), 300);
          setTimeout(() => {
            playDualOsc(900, 1200, 0.15, 'sine', 0.07);
          }, 420);
          break;
        }

        case 'login': {
          // Victory fanfare - ascending arpeggio (3 notes)
          playTone(523, 0.08, 'sine', 0.06);
          setTimeout(() => playTone(659, 0.08, 'sine', 0.06), 80);
          setTimeout(() => playTone(784, 0.12, 'sine', 0.07), 160);
          break;
        }

        case 'alert': {
          // Urgent pulsing alarm (3 rapid beeps)
          playTone(880, 0.06, 'square', 0.08);
          setTimeout(() => playTone(880, 0.06, 'square', 0.08), 80);
          setTimeout(() => playTone(880, 0.1, 'square', 0.09), 160);
          break;
        }

        case 'open': {
          // Ascending sweep with harmonic overtone
          playSweep(400, 1200, 0.12, 'sine', 0.06);
          setTimeout(() => playSweep(800, 1600, 0.1, 'sine', 0.03), 20);
          break;
        }

        case 'close': {
          // Descending sweep with fade
          playSweep(1000, 300, 0.15, 'sine', 0.06);
          break;
        }

        case 'windowMaximize':
          // Ascending digital sweep (200ms)
          playSweep(300, 1400, 0.2, 'sawtooth', 0.05);
          break;

        case 'windowMinimize':
          // Descending digital sweep (150ms)
          playSweep(1200, 250, 0.15, 'sawtooth', 0.05);
          break;

        case 'notification': {
          // Two-tone alert chime
          playTone(880, 0.06, 'sine', 0.06);
          setTimeout(() => playTone(1100, 0.1, 'sine', 0.06), 80);
          break;
        }

        case 'error': {
          // Harsh low buzz
          playTone(120, 0.2, 'sawtooth', 0.1);
          setTimeout(() => playTone(90, 0.15, 'square', 0.08), 100);
          break;
        }

        case 'success': {
          // Pleasant ascending triple beep
          playTone(523, 0.05, 'sine', 0.05);
          setTimeout(() => playTone(659, 0.05, 'sine', 0.05), 60);
          setTimeout(() => playTone(784, 0.08, 'sine', 0.06), 120);
          break;
        }

        case 'hover':
          // Very subtle soft tick (very quiet)
          playTone(1400, 0.015, 'sine', 0.03);
          break;

        case 'search':
          // Digital scanner sweep
          playSweep(200, 1800, 0.25, 'sawtooth', 0.04);
          break;

        case 'snap':
          // Crisp click for window snapping
          playTone(1600, 0.02, 'square', 0.05);
          setTimeout(() => playTone(1200, 0.015, 'sine', 0.03), 10);
          break;
      }
    },
    [getContext, playTone, playSweep, playDualOsc]
  );

  return { play };
}
