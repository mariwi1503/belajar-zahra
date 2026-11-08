/**
 * Belajar Zahra - Sound Effects Engine
 * Menggunakan Web Audio API murni (tanpa file eksternal/dependensi, zero latency, 100% offline).
 * Dirancang khusus dengan nada ceria, lembut, dan ramah anak usia SD.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ZahraAudio = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let audioCtx = null;
  const STORAGE_KEY = 'belajar_zahra_audio_muted';
  
  // Baca preferensi mute dari localStorage
  let isMuted = false;
  try {
    isMuted = localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (e) {
    isMuted = false;
  }

  // Master volume gain node
  let masterGain = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(isMuted ? 0 : 1, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Auto-resume pada interaksi pengguna pertama
  function attachUnlockListeners() {
    const unlock = () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true, once: true });
    window.addEventListener('keydown', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
  }

  if (typeof window !== 'undefined') {
    attachUnlockListeners();
  }

  // Helper untuk membuat nada sintetis ramah anak
  function playTone({ freq, type = 'sine', startTime = 0, duration = 0.15, startVol = 0.25, endVol = 0.001, pitchDecay = null }) {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || !masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      const t0 = ctx.currentTime + startTime;
      const t1 = t0 + duration;

      osc.frequency.setValueAtTime(freq, t0);
      if (pitchDecay) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchDecay), t1);
      }

      gain.gain.setValueAtTime(Math.max(0.0001, startVol), t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), t1);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(t0);
      osc.stop(t1);
    } catch (e) {
      // Menangani pembatasan audio browser secara halus
    }
  }

  const ZahraAudio = {
    /**
     * Cek status apakah suara dibisukan
     */
    isMuted: function () {
      return isMuted;
    },

    /**
     * Atur status mute
     */
    setMuted: function (muted) {
      isMuted = !!muted;
      try {
        localStorage.setItem(STORAGE_KEY, isMuted ? 'true' : 'false');
      } catch (e) {}

      if (audioCtx && masterGain) {
        masterGain.gain.setValueAtTime(isMuted ? 0 : 1, audioCtx.currentTime);
      }
      this.updateUiElements();
      
      // Jika baru saja di-unmute, mainkan nada pop kecil sebagai konfirmasi
      if (!isMuted) {
        this.playPop();
      }
    },

    /**
     * Beralih mute/unmute
     */
    toggleMute: function () {
      this.setMuted(!isMuted);
      return isMuted;
    },

    /**
     * Update semua tombol/elemen suara di DOM jika ada
     */
    updateUiElements: function () {
      const buttons = document.querySelectorAll('.sound-toggle-btn');
      buttons.forEach(btn => {
        const icon = btn.querySelector('.sound-icon');
        const text = btn.querySelector('.sound-text');
        if (isMuted) {
          if (icon) icon.className = 'sound-icon fa-solid fa-volume-xmark text-slate-400';
          if (text) text.textContent = 'Suara Mati';
          btn.setAttribute('title', 'Suara dimatikan (Klik untuk menyalakan)');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          if (icon) icon.className = 'sound-icon fa-solid fa-volume-high text-emerald-600 animate-pulse';
          if (text) text.textContent = 'Suara Aktif';
          btn.setAttribute('title', 'Suara aktif (Klik untuk mematikan)');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
    },

    /**
     * 1. Efek Klik / Pop Gelembung (Sangat cocok untuk tombol, filter, tab, dan kartu)
     */
    playPop: function () {
      if (isMuted) return;
      playTone({
        freq: 460,
        pitchDecay: 180,
        type: 'sine',
        startTime: 0,
        duration: 0.08,
        startVol: 0.28
      });
    },

    /**
     * 2. Efek Memilih Opsi / Tombol Halus (Subtle Tap)
     */
    playSelect: function () {
      if (isMuted) return;
      playTone({
        freq: 580,
        pitchDecay: 420,
        type: 'triangle',
        startTime: 0,
        duration: 0.06,
        startVol: 0.22
      });
    },

    /**
     * 3. Efek Jawaban BENAR (Melodi Arpeggio Mayor ceria & bersemangat)
     * Nada C5, E5, G5, C6 (Do - Mi - Sol - Do Tinggi)
     */
    playCorrect: function () {
      if (isMuted) return;
      const notes = [
        { freq: 523.25, time: 0.00, dur: 0.16, vol: 0.24 }, // C5
        { freq: 659.25, time: 0.08, dur: 0.16, vol: 0.26 }, // E5
        { freq: 783.99, time: 0.16, dur: 0.20, vol: 0.28 }, // G5
        { freq: 1046.50, time: 0.24, dur: 0.38, vol: 0.32 } // C6
      ];

      notes.forEach(n => {
        playTone({
          freq: n.freq,
          type: 'triangle',
          startTime: n.time,
          duration: n.dur,
          startVol: n.vol
        });
        // Tambahkan nada harmoni lembut untuk kesan lonceng (bell shimmer)
        playTone({
          freq: n.freq * 2,
          type: 'sine',
          startTime: n.time,
          duration: n.dur * 0.7,
          startVol: n.vol * 0.35
        });
      });
    },

    /**
     * 4. Efek Jawaban SALAH / Perlu Coba Lagi (Lembut, kartun, lucu & tidak menakutkan)
     * Nada 'boing' lembut menurun (bukan buzzer keras agar anak tidak kaget)
     */
    playWrong: function () {
      if (isMuted) return;
      // Nada lembut ganda menurun (Uh-oh ceria)
      playTone({
        freq: 330,
        pitchDecay: 260,
        type: 'triangle',
        startTime: 0,
        duration: 0.16,
        startVol: 0.24
      });
      playTone({
        freq: 246.94, // B3
        pitchDecay: 174, // F3
        type: 'triangle',
        startTime: 0.14,
        duration: 0.24,
        startVol: 0.26
      });
    },

    /**
     * 5. Efek Dapat Bintang / Koin Emas (+1 ⭐)
     * Gemerlap lonceng kristal tinggi (sparkle/twinkle)
     */
    playStar: function () {
      if (isMuted) return;
      const starNotes = [
        { freq: 987.77, time: 0.00, dur: 0.12, vol: 0.22 },  // B5
        { freq: 1318.51, time: 0.06, dur: 0.24, vol: 0.28 } // E6
      ];
      starNotes.forEach(n => {
        playTone({
          freq: n.freq,
          type: 'sine',
          startTime: n.time,
          duration: n.dur,
          startVol: n.vol
        });
        playTone({
          freq: n.freq * 1.5,
          type: 'triangle',
          startTime: n.time + 0.02,
          duration: n.dur * 0.6,
          startVol: n.vol * 0.2
        });
      });
    },

    /**
     * 6. Efek Pasangan Cocok pada Game Garis (Match Success)
     * Harmoni akor ganda yang memuaskan
     */
    playMatchSuccess: function () {
      if (isMuted) return;
      playTone({ freq: 659.25, type: 'triangle', startTime: 0.00, duration: 0.20, startVol: 0.25 }); // E5
      playTone({ freq: 880.00, type: 'triangle', startTime: 0.07, duration: 0.28, startVol: 0.28 }); // A5
      playTone({ freq: 1318.51, type: 'sine', startTime: 0.12, duration: 0.35, startVol: 0.22 });    // E6
    },

    /**
     * 7. Efek Pasangan Belum Cocok pada Game Garis (Match Error)
     * Bunyi goyang (wobble) halus
     */
    playMatchError: function () {
      if (isMuted) return;
      playTone({
        freq: 220,
        pitchDecay: 190,
        type: 'sine',
        startTime: 0,
        duration: 0.14,
        startVol: 0.20
      });
    },

    /**
     * 8. Efek Kemenangan / Selesai Kuis (Fanfare Perayaan 🎉)
     * Musik kemenangan mini gembira saat skor akhir muncul
     */
    playFanfare: function () {
      if (isMuted) return;
      const fanfare = [
        { freq: 523.25, time: 0.00, dur: 0.12, vol: 0.22 }, // C5
        { freq: 523.25, time: 0.10, dur: 0.10, vol: 0.22 }, // C5
        { freq: 523.25, time: 0.20, dur: 0.10, vol: 0.22 }, // C5
        { freq: 659.25, time: 0.32, dur: 0.22, vol: 0.28 }, // E5
        { freq: 783.99, time: 0.50, dur: 0.22, vol: 0.30 }, // G5
        { freq: 1046.50, time: 0.70, dur: 0.50, vol: 0.35 } // C6 (panjang & meriah)
      ];

      fanfare.forEach(n => {
        playTone({
          freq: n.freq,
          type: 'triangle',
          startTime: n.time,
          duration: n.dur,
          startVol: n.vol
        });
        playTone({
          freq: n.freq * 2,
          type: 'sine',
          startTime: n.time,
          duration: n.dur * 0.8,
          startVol: n.vol * 0.25
        });
      });
    },

    /**
     * 9. Efek Tab / Halaman Berganti (Whoosh Halus)
     */
    playTabSwitch: function () {
      if (isMuted) return;
      playTone({
        freq: 380,
        pitchDecay: 520,
        type: 'sine',
        startTime: 0,
        duration: 0.09,
        startVol: 0.20
      });
    },

    /**
     * 10. Efek Ulangi / Coba Lagi Kuis (Restart)
     */
    playRestart: function () {
      if (isMuted) return;
      playTone({ freq: 440, type: 'triangle', startTime: 0.00, duration: 0.10, startVol: 0.20 });
      playTone({ freq: 660, type: 'triangle', startTime: 0.07, duration: 0.15, startVol: 0.24 });
    }
  };

  // Otomatis sinkronkan tampilan tombol suara begitu DOM siap
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => ZahraAudio.updateUiElements());
    } else {
      setTimeout(() => ZahraAudio.updateUiElements(), 0);
    }
  }

  return ZahraAudio;
}));

