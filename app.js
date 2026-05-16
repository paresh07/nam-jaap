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

  // Modals
  const settingsModal = document.getElementById('settings-modal');
  const reportsModal = document.getElementById('reports-modal');
  const resetModal = document.getElementById('reset-modal');
  
  const mantraInput = document.getElementById('mantra-input');
  const audioTrackSelect = document.getElementById('audio-track');
  const vibrationToggle = document.getElementById('vibration-toggle');
  const reportPeriodSelect = document.getElementById('report-period');
  const reportTableBody = document.getElementById('report-table-body');
  
  const saveSettingsBtn = document.getElementById('save-settings');
  const cancelSettingsBtn = document.getElementById('cancel-settings');
  
  const triggerResetBtn = document.getElementById('trigger-reset-btn');
  const cancelResetBtn = document.getElementById('cancel-reset');
  const confirmResetBtn = document.getElementById('confirm-reset');
  const closeReportsBtn = document.getElementById('close-reports');

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
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => e.stopPropagation());
  });

  // State Management
  let state = {
    total: 0,
    today: 0,
    lastDate: '',
    mantra: 'राधा',
    vibration: true,
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

  function getLocalDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
  }

  function loadState() {
    const saved = localStorage.getItem('namJaapState');
    if (saved) {
      try {
        state = { ...state, ...JSON.parse(saved) };
      } catch (e) {}
    }
    
    if (typeof state.vibration === 'undefined') state.vibration = true;
    if (typeof state.audioTrack === 'undefined') state.audioTrack = 'track1.mp3';

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
    
    // Check if it's a new day
    const currentDateStr = getLocalDateString();
    if (state.lastDate !== currentDateStr) {
      if (state.lastDate && state.today > 0 && !state.history[state.lastDate]) {
        state.history[state.lastDate] = state.today;
      }
      state.today = 0;
      state.lastDate = currentDateStr;
      saveState();
    }
    
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

  function updateDisplay() {
    mantraText.textContent = state.mantra;
    mantraInput.value = state.mantra;
    vibrationToggle.checked = state.vibration;
    
    // Set track dropdown and audio source correctly
    audioTrackSelect.value = state.audioTrack;
    if (bgAudio.getAttribute('src') !== state.audioTrack) {
      bgAudio.src = state.audioTrack;
    }
    
    countTodayEl.textContent = state.today.toLocaleString();
    countTotalEl.textContent = state.total.toLocaleString();
    
    const totalMalas = Math.floor(state.total / 108);
    countMalasEl.textContent = totalMalas.toLocaleString();
    
    updateMalaDisplay();
    updateDashboard();
    
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

  function startTimers() {
    if (timerInterval) clearInterval(timerInterval);
    
    // Track when the last tick was to add to lifetime total
    let lastTickTime = Date.now();

    timerInterval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - lastTickTime) / 1000);
      
      if (deltaSeconds >= 1) {
        state.lifetimeTimeSeconds += deltaSeconds;
        lastTickTime = now - ((now - lastTickTime) % 1000); // Keep the remainder for precision
        saveState(); // Save periodically
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
    
    // Random float direction
    const moveX = (Math.random() - 0.5) * 200; // -100 to 100
    const moveY = -150 - (Math.random() * 150); // -150 to -300
    
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--tw-translateX', `${moveX}px`);
    particle.style.setProperty('--tw-translateY', `${moveY}px`);
    
    document.body.appendChild(particle);
    
    setTimeout(() => particle.remove(), 1500);
  }

  // Handle taps
  tapArea.addEventListener('pointerdown', (e) => {
    state.today++;
    state.total++;
    
    // Update history for today
    const currentDateStr = getLocalDateString();
    state.history[currentDateStr] = state.today;
    
    saveState();
    updateDisplay();
    
    if (navigator.vibrate && state.vibration) {
      if (state.today % 108 === 0) {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate(40);
      }
    }
    
    createFullScreenRipple(e.clientX, e.clientY);
    createFloatingMantra(e.clientX, e.clientY);
    pulseElement(countTodayEl);
    if (state.today % 108 === 0) {
      pulseElement(countMalasEl);
      roundStartTime = Date.now(); // Restart round timer
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
      bgAudio.play().then(() => {
        musicBtn.classList.add('active');
      }).catch(err => {
        alert("Audio file not found! Ensure you placed '" + state.audioTrack + "' in the app folder.");
        console.log("Audio error", err);
      });
    }
    isPlaying = !isPlaying;
  });

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
  
  saveSettingsBtn.addEventListener('click', () => {
    const newMantra = mantraInput.value.trim();
    if (newMantra) {
      state.mantra = newMantra;
    }
    
    state.vibration = vibrationToggle.checked;
    
    const newTrack = audioTrackSelect.value;
    if (newTrack !== state.audioTrack) {
      state.audioTrack = newTrack;
      bgAudio.src = state.audioTrack;
      // If currently playing, start playing the new track immediately
      if (isPlaying) {
        bgAudio.play().catch(e => console.log(e));
      }
    }
    
    saveState();
    updateDisplay();
    settingsModal.classList.remove('active');
  });

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
  const transferChantsInput = document.getElementById('transfer-chants');
  const transferStatus = document.getElementById('transfer-status');

  function checkTransferAvailability() {
    if (!state.lastTransferDate) {
      applyTransferBtn.disabled = false;
      applyTransferBtn.textContent = 'Transfer & Add';
      return;
    }

    const last = new Date(state.lastTransferDate);
    const now = new Date();
    const isSameMonth = last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear();

    if (isSameMonth) {
      applyTransferBtn.disabled = true;
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const daysLeft = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
      applyTransferBtn.textContent = `Used (Wait ${daysLeft} days)`;
      applyTransferBtn.style.opacity = '0.5';
    } else {
      applyTransferBtn.disabled = false;
      applyTransferBtn.textContent = 'Transfer & Add';
      applyTransferBtn.style.opacity = '1';
    }
  }

  applyTransferBtn.addEventListener('click', () => {
    const malas = parseInt(transferMalasInput.value) || 0;
    const chants = parseInt(transferChantsInput.value) || 0;
    const totalToAdd = (malas * 108) + chants;

    if (totalToAdd <= 0) {
      transferStatus.textContent = "Please enter valid counts.";
      transferStatus.style.color = "var(--danger-color)";
      return;
    }

    // Double check month restriction
    const last = state.lastTransferDate ? new Date(state.lastTransferDate) : null;
    const now = new Date();
    if (last && last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear()) {
      transferStatus.textContent = "Transfer allowed only once per month.";
      transferStatus.style.color = "var(--danger-color)";
      return;
    }

    state.total += totalToAdd;
    state.lastTransferDate = now.getTime();
    
    saveState();
    updateDisplay();
    checkTransferAvailability();
    
    transferStatus.textContent = `Successfully added ${totalToAdd.toLocaleString()} chants!`;
    transferStatus.style.color = "var(--success-color)";
    
    // Clear inputs
    transferMalasInput.value = '';
    transferChantsInput.value = '';
  });

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  initMala();
  loadState();
  updateOnlineStatus();
  startTimers();
  checkTransferAvailability();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
  }
});
