document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tapArea = document.getElementById('tap-area');
  const rippleContainer = document.getElementById('ripple-container');
  const mantraText = document.getElementById('mantra-text');
  const malaContainer = document.getElementById('mala-container');
  const roundCountEl = document.getElementById('mala-round-count');
  
  const countTodayEl = document.getElementById('count-today');
  const countMalasEl = document.getElementById('count-malas');
  const countTotalEl = document.getElementById('count-total');
  
  const musicBtn = document.getElementById('music-btn');
  const bgAudio = document.getElementById('bg-audio');
  const settingsBtn = document.getElementById('settings-btn');
  const reportsBtn = document.getElementById('reports-btn');
  const statusIndicator = document.getElementById('status-indicator');
  const particlesBtn = document.getElementById('particles-btn');
  
  // Dashboard elements
  const bestMalasEl = document.getElementById('best-malas');
  const bestChantsEl = document.getElementById('best-chants');
  const sessionTimerEl = document.getElementById('session-timer');
  const roundBeadCountEl = document.getElementById('round-bead-count');
  const roundTimerEl = document.getElementById('round-timer');
  const last10DaysBody = document.getElementById('last-10-days-body');

  // Life Sadhana elements
  const lifeDaysLivedEl = document.getElementById('life-days-lived');
  const lifeChantsPerDayEl = document.getElementById('life-chants-per-day');
  const lifeMalasPerDayEl = document.getElementById('life-malas-per-day');
  const lifeTotalDaysEl = document.getElementById('life-total-days');

  // Modals
  const settingsModal = document.getElementById('settings-modal');
  const reportsModal = document.getElementById('reports-modal');
  const resetModal = document.getElementById('reset-modal');
  
  const mantraInput = document.getElementById('mantra-input');
  const birthDateInput = document.getElementById('birth-date-input');
  const audioTrackSelect = document.getElementById('audio-track');
  const musicVolumeInput = document.getElementById('music-volume');
  const volumeLabel = document.getElementById('volume-label');
  const vibrationToggle = document.getElementById('vibration-toggle');
  const chimeToggle = document.getElementById('chime-toggle');
  const wakelockToggle = document.getElementById('wakelock-toggle');

  const reportPeriodSelect = document.getElementById('report-period');
  const reportTableBody = document.getElementById('report-table-body');
  
  const saveSettingsBtn = document.getElementById('save-settings');
  const cancelSettingsBtn = document.getElementById('cancel-settings');
  const closeSettingsX = document.getElementById('close-settings-x');
  
  const triggerResetBtn = document.getElementById('trigger-reset-btn');
  const cancelResetBtn = document.getElementById('cancel-reset');
  const confirmResetBtn = document.getElementById('confirm-reset');
  const closeReportsBtn = document.getElementById('close-reports');

  // Backup Elements
  const exportBackupBtn = document.getElementById('export-backup-btn');
  const importBackupBtn = document.getElementById('import-backup-btn');
  const importFileInput = document.getElementById('import-file-input');
  const backupStatus = document.getElementById('backup-status');

  // Stop propagation on buttons and modals so they don't trigger the tap
  const interactiveElements = [
    settingsBtn, reportsBtn, musicBtn,
    settingsModal.querySelector('.modal-content'), 
    reportsModal.querySelector('.modal-content'),
    resetModal.querySelector('.modal-content'),
    document.getElementById('dashboard'),
    particlesBtn
  ];
  
  interactiveElements.forEach(el => {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => e.stopPropagation());
  });

  // State Management
  let state = {
    total: 0,
    today: 0,
    lastDate: '',
    mantra: 'राधा',
    birthDate: '',
    vibration: true,
    bellChime: true,
    wakeLockEnabled: true,
    musicVolume: 70,
    audioTrack: 'track1.mp3',
    bestMalas: 0,
    bestDaily: 0,
    lifetimeTimeSeconds: 0,
    lastTransferDate: null,
    showParticles: true,
    history: {} // Store daily counts: {'YYYY-MM-DD': count}
  };

  let sessionStartTime = Date.now();
  let roundStartTime = Date.now();
  let timerInterval;
  let wakeLock = null;

  function getLocalDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
  }

  // Seamless Midnight Rollover check
  function ensureCurrentDay() {
    const currentDateStr = getLocalDateString();
    if (state.lastDate !== currentDateStr) {
      if (state.lastDate && state.today > 0 && !state.history[state.lastDate]) {
        state.history[state.lastDate] = state.today;
      }
      state.today = 0;
      state.lastDate = currentDateStr;
      saveState();
      updateDisplay();
    }
  }

  function loadState() {
    const saved = localStorage.getItem('namJaapState');
    if (saved) {
      try {
        state = { ...state, ...JSON.parse(saved) };
      } catch (e) {}
    }
    
    if (typeof state.vibration === 'undefined') state.vibration = true;
    if (typeof state.bellChime === 'undefined') state.bellChime = true;
    if (typeof state.wakeLockEnabled === 'undefined') state.wakeLockEnabled = true;
    if (typeof state.musicVolume === 'undefined') state.musicVolume = 70;
    if (typeof state.audioTrack === 'undefined') state.audioTrack = 'track1.mp3';
    if (typeof state.birthDate === 'undefined') state.birthDate = '';

    if (!state.history) {
      state.history = {};
    }
    
    if (state.lastDate && state.today > 0 && !state.history[state.lastDate]) {
      state.history[state.lastDate] = state.today;
    }

    if (typeof state.bestMalas === 'undefined') state.bestMalas = 0;
    if (typeof state.bestDaily === 'undefined') state.bestDaily = 0;
    if (typeof state.lifetimeTimeSeconds === 'undefined') state.lifetimeTimeSeconds = 0;
    if (typeof state.lastTransferDate === 'undefined') state.lastTransferDate = null;
    if (typeof state.showParticles === 'undefined') state.showParticles = true;
    
    ensureCurrentDay();
    updateDisplay();
  }

  function saveState() {
    localStorage.setItem('namJaapState', JSON.stringify(state));
  }

  const TOTAL_BEADS = 108;
  const beadElements = [];

  function initMala() {
    malaContainer.innerHTML = '';
    beadElements.length = 0;
    for (let i = 0; i < TOTAL_BEADS; i++) {
      const beadWrapper = document.createElement('div');
      beadWrapper.className = 'bead-wrapper';
      beadWrapper.style.transform = `rotate(${(i * 360) / TOTAL_BEADS}deg) translateY(calc(-1 * var(--mala-radius, 140px)))`;
      
      const bead = document.createElement('div');
      bead.className = 'bead';
      
      beadWrapper.appendChild(bead);
      malaContainer.appendChild(beadWrapper);
      beadElements.push(bead);
    }
  }

  function updateMalaDisplay() {
    if (beadElements.length === 0) return;
    const activeCount = state.today % TOTAL_BEADS;
    const isFullMala = state.today > 0 && activeCount === 0;
    const limit = isFullMala ? TOTAL_BEADS : activeCount;

    if (roundBeadCountEl) {
      roundBeadCountEl.textContent = `${limit} / ${TOTAL_BEADS}`;
    }

    beadElements.forEach((bead, i) => {
      bead.classList.remove('active', 'pulse-bead');
      if (i < limit) {
        bead.classList.add('active');
        if (i === limit - 1) {
          bead.classList.add('pulse-bead');
        }
      }
    });
  }

  function updateLifeSadhanaDisplay() {
    if (!state.birthDate) {
      if (lifeDaysLivedEl) lifeDaysLivedEl.textContent = 'Set birthday in Settings';
      if (lifeChantsPerDayEl) lifeChantsPerDayEl.textContent = '--';
      if (lifeMalasPerDayEl) lifeMalasPerDayEl.textContent = '--';
      if (lifeTotalDaysEl) lifeTotalDaysEl.textContent = '--';
      return;
    }

    const birth = new Date(state.birthDate);
    const now = new Date();
    birth.setHours(0, 0, 0, 0);
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = todayMid.getTime() - birth.getTime();

    if (isNaN(diffTime) || diffTime <= 0) {
      if (lifeDaysLivedEl) lifeDaysLivedEl.textContent = 'Invalid birthday';
      if (lifeChantsPerDayEl) lifeChantsPerDayEl.textContent = '--';
      if (lifeMalasPerDayEl) lifeMalasPerDayEl.textContent = '--';
      if (lifeTotalDaysEl) lifeTotalDaysEl.textContent = '--';
      return;
    }

    const daysLived = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const yearsLived = (daysLived / 365.25).toFixed(1);
    
    // Average chants & malas per day of life
    const chantsPerDay = (state.total / daysLived).toFixed(1);
    const totalMalas = state.total / 108;
    const malasPerDay = (totalMalas / daysLived).toFixed(2);

    if (lifeDaysLivedEl) lifeDaysLivedEl.textContent = `${yearsLived} yrs lived (~${daysLived.toLocaleString()} days)`;
    if (lifeChantsPerDayEl) lifeChantsPerDayEl.textContent = chantsPerDay;
    if (lifeMalasPerDayEl) lifeMalasPerDayEl.textContent = malasPerDay;
    if (lifeTotalDaysEl) lifeTotalDaysEl.textContent = daysLived.toLocaleString();
  }

  function updateDisplay() {
    mantraText.textContent = state.mantra;
    mantraInput.value = state.mantra;
    if (birthDateInput) birthDateInput.value = state.birthDate || '';
    vibrationToggle.checked = state.vibration;
    if (chimeToggle) chimeToggle.checked = state.bellChime;
    if (wakelockToggle) wakelockToggle.checked = state.wakeLockEnabled;
    
    if (musicVolumeInput) {
      musicVolumeInput.value = state.musicVolume;
      if (volumeLabel) volumeLabel.textContent = `${state.musicVolume}%`;
    }
    bgAudio.volume = (state.musicVolume ?? 70) / 100;
    
    // Set track dropdown and audio source correctly
    audioTrackSelect.value = state.audioTrack;
    if (bgAudio.getAttribute('src') !== state.audioTrack) {
      bgAudio.src = state.audioTrack;
    }
    
    countTodayEl.textContent = state.today.toLocaleString();
    countTotalEl.textContent = state.total.toLocaleString();
    
    // Calculate total malas completed based on daily history (excluding today) + today's progress + transferred malas
    const currentDateStr = getLocalDateString();
    let historyChants = 0;
    let historyMalas = 0;
    
    for (const [date, count] of Object.entries(state.history || {})) {
      if (date !== currentDateStr) {
        historyChants += count;
        historyMalas += Math.floor(count / 108);
      }
    }
    
    const transferredChants = Math.max(0, state.total - (historyChants + state.today));
    const todayMalas = Math.floor(state.today / 108);
    const transferredMalas = Math.floor(transferredChants / 108);
    const totalMalas = historyMalas + todayMalas + transferredMalas;
    
    countMalasEl.textContent = totalMalas.toLocaleString();
    
    updateMalaDisplay();
    updateDashboard();
    updateLifeSadhanaDisplay();
    
    // Update particles button state
    if (state.showParticles) {
      particlesBtn.classList.add('active');
    } else {
      particlesBtn.classList.remove('active');
    }
  }

  function updateDashboard() {
    const currentMalas = Math.floor(state.today / 108);
    if (currentMalas > state.bestMalas) state.bestMalas = currentMalas;
    if (state.today > state.bestDaily) state.bestDaily = state.today;
    
    bestMalasEl.textContent = state.bestMalas.toLocaleString();
    bestChantsEl.textContent = state.bestDaily.toLocaleString();
    
    // Fill last 10 days table
    last10DaysBody.innerHTML = '';
    const dates = Object.keys(state.history).sort((a, b) => b.localeCompare(a)).slice(0, 10);
    
    if (dates.length === 0) {
      last10DaysBody.innerHTML = '<tr><td colspan="3" class="text-center">No history yet.</td></tr>';
    } else {
      dates.forEach(dateStr => {
        const count = state.history[dateStr];
        const malas = Math.floor(count / 108);
        const tr = document.createElement('tr');
        const dObj = new Date(dateStr);
        const formattedDate = dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        tr.innerHTML = `
          <td>${formattedDate}</td>
          <td>${count.toLocaleString()}</td>
          <td>${malas.toLocaleString()}</td>
        `;
        last10DaysBody.appendChild(tr);
      });
    }
  }

  // Synthesized Temple Bell / Singing Bowl Chime (Web Audio API - Offline & Instant)
  function playTempleChime() {
    if (!state.bellChime) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._audioCtx) {
        window._audioCtx = new AudioCtx();
      }
      const ctx = window._audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const now = ctx.currentTime;
      // Harmonics for a resonant temple bell / Tibetan singing bowl (528 Hz base)
      const harmonics = [
        { freq: 528, gain: 0.35, decay: 3.2 },
        { freq: 1056, gain: 0.16, decay: 2.6 },
        { freq: 1584, gain: 0.08, decay: 1.9 },
        { freq: 2112, gain: 0.03, decay: 1.4 }
      ];

      harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.freq, now);

        gain.gain.setValueAtTime(h.gain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + h.decay);
      });
    } catch (err) {
      console.log('Chime sound error:', err);
    }
  }

  // Screen Wake Lock API
  async function requestWakeLock() {
    if (!state.wakeLockEnabled || !('wakeLock' in navigator)) return;
    try {
      if (wakeLock === null) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
          wakeLock = null;
        });
      }
    } catch (err) {
      // Wake lock can fail if backgrounded or battery saver active
    }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      ensureCurrentDay();
      if (state.wakeLockEnabled) {
        requestWakeLock();
      }
    }
  });

  function startTimers() {
    if (timerInterval) clearInterval(timerInterval);
    let lastTickTime = Date.now();

    timerInterval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastTickTime) / 1000);
      
      if (deltaSeconds >= 1) {
        state.lifetimeTimeSeconds += deltaSeconds;
        lastTickTime = now - ((now - lastTickTime) % 1000);
        saveState();
        ensureCurrentDay();
      }

      // Display Total Lifetime Time
      const totalSeconds = state.lifetimeTimeSeconds;
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      sessionTimerEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      
      // Round Timer
      const roundElapsed = Math.floor((Date.now() - roundStartTime) / 1000);
      roundTimerEl.textContent = `${roundElapsed}s`;
    }, 1000);
  }

  function pulseElement(el) {
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  function createFullScreenRipple(x, y) {
    const circle = document.createElement('div');
    circle.classList.add('ripple-fs');
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    rippleContainer.appendChild(circle);
    setTimeout(() => circle.remove(), 800);
  }

  function createFloatingMantra(x, y) {
    if (!state.showParticles) return;
    
    const particle = document.createElement('div');
    particle.className = 'floating-mantra';
    particle.textContent = state.mantra;
    
    const moveX = (Math.random() - 0.5) * 200;
    const moveY = -150 - (Math.random() * 150);
    
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--tw-translateX', `${moveX}px`);
    particle.style.setProperty('--tw-translateY', `${moveY}px`);
    
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1500);
  }

  // Handle taps
  tapArea.addEventListener('pointerdown', (e) => {
    ensureCurrentDay();
    
    state.today++;
    state.total++;
    
    // Update history for today
    const currentDateStr = getLocalDateString();
    state.history[currentDateStr] = state.today;
    
    saveState();
    updateDisplay();
    requestWakeLock();
    
    if (navigator.vibrate && state.vibration) {
      if (state.today % 108 === 0) {
        navigator.vibrate([120, 60, 120]);
      } else {
        navigator.vibrate(35);
      }
    }
    
    createFullScreenRipple(e.clientX, e.clientY);
    createFloatingMantra(e.clientX, e.clientY);
    pulseElement(countTodayEl);
    
    if (state.today % 108 === 0) {
      pulseElement(countMalasEl);
      roundStartTime = Date.now(); // Restart round timer
      playTempleChime();
    }
  });

  // Music Logic
  let isPlaying = false;
  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isPlaying) {
      bgAudio.pause();
      musicBtn.classList.remove('active');
    } else {
      bgAudio.volume = (state.musicVolume ?? 70) / 100;
      bgAudio.play().then(() => {
        musicBtn.classList.add('active');
      }).catch(err => {
        alert("Audio file not found! Ensure you placed '" + state.audioTrack + "' in the app folder.");
        console.log("Audio error", err);
      });
    }
    isPlaying = !isPlaying;
  });

  // Music Volume Slider
  if (musicVolumeInput) {
    musicVolumeInput.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value, 10);
      if (volumeLabel) volumeLabel.textContent = `${vol}%`;
      bgAudio.volume = vol / 100;
      state.musicVolume = vol;
    });
  }

  // Preset Chips
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const mantra = chip.getAttribute('data-mantra');
      if (mantra) {
        mantraInput.value = mantra;
      }
    });
  });

  // Birthday click in dashboard leads to settings
  if (lifeDaysLivedEl) {
    lifeDaysLivedEl.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsModal.classList.add('active');
      if (birthDateInput) birthDateInput.focus();
    });
  }

  // Particle Logic
  particlesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.showParticles = !state.showParticles;
    saveState();
    updateDisplay();
  });

  // Settings Logic
  settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
  cancelSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
  if (closeSettingsX) closeSettingsX.addEventListener('click', () => settingsModal.classList.remove('active'));
  
  saveSettingsBtn.addEventListener('click', () => {
    const newMantra = mantraInput.value.trim();
    if (newMantra) {
      state.mantra = newMantra;
    }
    
    if (birthDateInput) {
      state.birthDate = birthDateInput.value;
    }

    state.vibration = vibrationToggle.checked;
    if (chimeToggle) state.bellChime = chimeToggle.checked;
    if (wakelockToggle) {
      state.wakeLockEnabled = wakelockToggle.checked;
      if (state.wakeLockEnabled) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    }
    
    if (musicVolumeInput) {
      state.musicVolume = parseInt(musicVolumeInput.value, 10);
      bgAudio.volume = state.musicVolume / 100;
    }

    const newTrack = audioTrackSelect.value;
    if (newTrack !== state.audioTrack) {
      state.audioTrack = newTrack;
      bgAudio.src = state.audioTrack;
      if (isPlaying) {
        bgAudio.play().catch(e => console.log(e));
      }
    }
    
    saveState();
    updateDisplay();
    settingsModal.classList.remove('active');
  });

  // Backup & Restore Logic
  if (exportBackupBtn) {
    exportBackupBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        const backupData = JSON.stringify(state, null, 2);
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = getLocalDateString();
        a.href = url;
        a.download = `nam-jaap-backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        backupStatus.textContent = "Backup exported successfully!";
        backupStatus.style.color = "var(--success-color)";
      } catch (err) {
        backupStatus.textContent = "Failed to export backup.";
        backupStatus.style.color = "var(--danger-color)";
      }
    });
  }

  if (importBackupBtn && importFileInput) {
    importBackupBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (typeof imported.total === 'undefined' || typeof imported.history !== 'object') {
            throw new Error('Invalid format');
          }

          if (confirm(`Restore backup? This will restore ${imported.total.toLocaleString()} total chants and history.`)) {
            state = { ...state, ...imported };
            saveState();
            updateDisplay();
            backupStatus.textContent = `Restored ${imported.total.toLocaleString()} chants successfully!`;
            backupStatus.style.color = "var(--success-color)";
          }
        } catch (err) {
          backupStatus.textContent = "Error: Invalid backup file format.";
          backupStatus.style.color = "var(--danger-color)";
        }
        importFileInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  // Reset Logic inside Settings
  triggerResetBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    resetModal.classList.add('active');
  });

  // Reports Logic
  reportsBtn.addEventListener('click', () => {
    generateReport(reportPeriodSelect.value);
    reportsModal.classList.add('active');
  });
  closeReportsBtn.addEventListener('click', () => reportsModal.classList.remove('active'));
  reportPeriodSelect.addEventListener('change', (e) => generateReport(e.target.value));

  function generateReport(period) {
    reportTableBody.innerHTML = '';
    const dates = Object.keys(state.history).sort((a, b) => b.localeCompare(a));
    
    let filteredDates = dates;
    if (period !== 'all') {
      const daysToSubtract = parseInt(period);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToSubtract);
      cutoffDate.setHours(0,0,0,0);
      
      filteredDates = dates.filter(dateStr => new Date(dateStr) >= cutoffDate);
    }

    if (filteredDates.length === 0) {
      reportTableBody.innerHTML = '<tr><td colspan="3" class="text-center">No chanting data available yet. Start chanting!</td></tr>';
      return;
    }

    filteredDates.forEach(dateStr => {
      const count = state.history[dateStr];
      const malas = Math.floor(count / 108);
      
      const tr = document.createElement('tr');
      const dObj = new Date(dateStr);
      let formattedDate = dateStr;
      if (!isNaN(dObj.getTime())) {
         formattedDate = dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      }
      
      tr.innerHTML = `
        <td>${formattedDate}</td>
        <td>${count.toLocaleString()}</td>
        <td>${malas.toLocaleString()}</td>
      `;
      reportTableBody.appendChild(tr);
    });
  }

  // Confirm Reset Logic
  cancelResetBtn.addEventListener('click', () => resetModal.classList.remove('active'));
  confirmResetBtn.addEventListener('click', () => {
    state.today = 0;
    state.total = 0;
    state.history = {}; 
    state.bestMalas = 0;
    state.bestDaily = 0;
    state.lifetimeTimeSeconds = 0;
    saveState();
    updateDisplay();
    resetModal.classList.remove('active');
  });

  // Close modals on outside click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('pointerdown', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        e.stopPropagation();
      }
    });
  });

  function updateOnlineStatus() {
    if (navigator.onLine) {
      statusIndicator.textContent = 'Online';
      statusIndicator.className = 'status online';
    } else {
      statusIndicator.textContent = 'Offline';
      statusIndicator.className = 'status offline';
    }
  }

  // Data Transfer Logic
  const applyTransferBtn = document.getElementById('apply-transfer-btn');
  const transferMalasInput = document.getElementById('transfer-malas');
  const transferStatus = document.getElementById('transfer-status');

  function checkTransferAvailability() {
    if (!state.lastTransferDate) {
      applyTransferBtn.disabled = false;
      applyTransferBtn.textContent = 'Add Malas';
      return;
    }

    const last = new Date(state.lastTransferDate);
    const now = new Date();
    const diffTime = now.getTime() - last.getTime();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;

    if (diffTime < fifteenDaysMs) {
      applyTransferBtn.disabled = true;
      const msRemaining = fifteenDaysMs - diffTime;
      const daysLeft = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      applyTransferBtn.textContent = `Used (Wait ${daysLeft} day${daysLeft > 1 ? 's' : ''})`;
      applyTransferBtn.style.opacity = '0.5';
    } else {
      applyTransferBtn.disabled = false;
      applyTransferBtn.textContent = 'Add Malas';
      applyTransferBtn.style.opacity = '1';
    }
  }

  applyTransferBtn.addEventListener('click', () => {
    const malas = parseInt(transferMalasInput.value) || 0;
    const totalToAdd = malas * 108;

    if (totalToAdd <= 0) {
      transferStatus.textContent = "Please enter valid malas.";
      transferStatus.style.color = "var(--danger-color)";
      return;
    }

    // Double check 15 days restriction
    const last = state.lastTransferDate ? new Date(state.lastTransferDate) : null;
    const now = new Date();
    if (last) {
      const diffTime = now.getTime() - last.getTime();
      const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
      if (diffTime < fifteenDaysMs) {
        transferStatus.textContent = "Adding malas is allowed only once in 15 days.";
        transferStatus.style.color = "var(--danger-color)";
        return;
      }
    }

    state.total += totalToAdd;
    state.lastTransferDate = now.getTime();
    
    saveState();
    updateDisplay();
    checkTransferAvailability();
    
    transferStatus.textContent = `Successfully added ${malas.toLocaleString()} malas!`;
    transferStatus.style.color = "var(--success-color)";
    transferMalasInput.value = '';
  });

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  initMala();
  loadState();
  updateOnlineStatus();
  startTimers();
  checkTransferAvailability();
  requestWakeLock();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
  }
});