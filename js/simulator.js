/**
 * Real-Time Bus Tracking System
 * GPS Movement Simulator Control Module
 */

let simStatusInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  initSimulatorControls();
  startStatusPolling();
});

function initSimulatorControls() {
  const btnStart = document.getElementById('btn-sim-start');
  const btnPause = document.getElementById('btn-sim-pause');
  const btnReset = document.getElementById('btn-sim-reset');
  const speedRange = document.getElementById('sim-speed-range');
  const btnTeleport = document.getElementById('btn-sim-teleport');

  if (btnStart) {
    btnStart.addEventListener('click', async () => {
      try {
        const res = await API.startSimulation();
        updateSimUI(res);
        showToast('Simulator started', 'success');
        addSimLog('Simulator resumed by admin');
      } catch (err) {
        showToast('Failed to start simulation: ' + err.message, 'danger');
      }
    });
  }

  if (btnPause) {
    btnPause.addEventListener('click', async () => {
      try {
        const res = await API.pauseSimulation();
        updateSimUI(res);
        showToast('Simulator paused', 'warning');
        addSimLog('Simulator paused by admin');
      } catch (err) {
        showToast('Failed to pause simulation: ' + err.message, 'danger');
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (!confirm('Reset all buses back to their route starting points?')) return;
      try {
        const res = await API.resetSimulation();
        updateSimUI(res);
        showToast('Buses reset to starting stops', 'info');
        addSimLog('Simulator reset: all buses relocated to first stop of route');
      } catch (err) {
        showToast('Failed to reset simulation: ' + err.message, 'danger');
      }
    });
  }

  if (speedRange) {
    speedRange.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('sim-speed-val').textContent = val.toFixed(1) + 'x';
    });

    speedRange.addEventListener('change', async (e) => {
      const val = parseFloat(e.target.value);
      try {
        const res = await API.setSimulationSpeed(val);
        updateSimUI(res);
        showToast(`Simulation speed set to ${val}x`, 'info');
        addSimLog(`Speed multiplier changed to ${val}x`);
      } catch (err) {
        showToast('Failed to change speed: ' + err.message, 'danger');
      }
    });
  }

  // Quick Speed Presets
  document.querySelectorAll('.btn-speed-preset').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mult = parseFloat(btn.getAttribute('data-speed'));
      if (speedRange) {
        speedRange.value = mult;
        document.getElementById('sim-speed-val').textContent = mult.toFixed(1) + 'x';
      }
      try {
        const res = await API.setSimulationSpeed(mult);
        updateSimUI(res);
        showToast(`Speed set to ${mult}x`, 'info');
        addSimLog(`Speed preset applied: ${mult}x`);
      } catch (err) {
        showToast('Failed to set speed: ' + err.message, 'danger');
      }
    });
  });

  // Teleportation tool for demo
  if (btnTeleport) {
    btnTeleport.addEventListener('click', handleTeleport);
    loadTeleportDropdowns();
  }
}

async function loadTeleportDropdowns() {
  const busSelect = document.getElementById('sim-teleport-bus');
  const stopSelect = document.getElementById('sim-teleport-stop');
  if (!busSelect || !stopSelect) return;

  try {
    const buses = await API.getActiveBuses();
    const stops = await API.getStops();

    busSelect.innerHTML = '<option value="">Select Bus</option>';
    buses.forEach(b => {
      busSelect.innerHTML += `<option value="${b.id}">${b.busNumber} (${b.routeNumber || 'No Route'})</option>`;
    });

    stopSelect.innerHTML = '<option value="">Select Target Stop</option>';
    stops.forEach(s => {
      stopSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
  } catch (err) {
    console.warn('Could not populate teleport dropdowns:', err);
  }
}

async function handleTeleport() {
  const busId = document.getElementById('sim-teleport-bus').value;
  const stopId = document.getElementById('sim-teleport-stop').value;

  if (!busId || !stopId) {
    showToast('Select both a bus and target stop to teleport', 'warning');
    return;
  }

  try {
    const res = await API.teleportBus(busId, stopId);
    updateSimUI(res);
    showToast(`Bus teleported to target stop!`, 'success');
    addSimLog(`Teleportation event: Bus #${busId} instantly moved to Stop #${stopId}`);
  } catch (err) {
    showToast('Teleportation failed: ' + err.message, 'danger');
  }
}

function startStatusPolling() {
  fetchAndRenderStatus();
  if (simStatusInterval) clearInterval(simStatusInterval);
  simStatusInterval = setInterval(fetchAndRenderStatus, 2500);
}

async function fetchAndRenderStatus() {
  try {
    const status = await API.getSimulationStatus();
    updateSimUI(status);
  } catch (err) {
    // Backend may be restarting
  }
}

function updateSimUI(status) {
  if (!status) return;

  // Navbar simulation badge
  const navStatus = document.getElementById('navbar-sim-status');
  if (navStatus) {
    if (status.running) {
      navStatus.className = 'nav-status status-online';
      navStatus.innerHTML = '<span class="status-pulse"></span> Sim Running (' + status.speedMultiplier + 'x)';
    } else {
      navStatus.className = 'nav-status status-paused';
      navStatus.innerHTML = '<span class="status-pulse"></span> Sim Paused';
    }
  }

  // Dashboard Stats
  const statusBadge = document.getElementById('sim-status-badge');
  if (statusBadge) {
    statusBadge.textContent = status.running ? 'RUNNING' : 'PAUSED';
    statusBadge.className = status.running ? 'badge badge-in-transit' : 'badge badge-stopped';
  }

  const speedVal = document.getElementById('sim-speed-val');
  if (speedVal && document.getElementById('sim-speed-range')) {
    speedVal.textContent = status.speedMultiplier.toFixed(1) + 'x';
    document.getElementById('sim-speed-range').value = status.speedMultiplier;
  }

  const countEl = document.getElementById('sim-active-buses');
  if (countEl) countEl.textContent = status.activeBusesCount;

  const ticksEl = document.getElementById('sim-tick-count');
  if (ticksEl) ticksEl.textContent = status.totalTicks;
}

function addSimLog(msg) {
  const logBox = document.getElementById('sim-logs');
  if (!logBox) return;

  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.style.fontSize = '0.8rem';
  entry.style.color = '#334155';
  entry.style.padding = '0.2rem 0';
  entry.innerHTML = `<span style="color: #94a3b8;">[${time}]</span> ${msg}`;

  logBox.prepend(entry);

  // Keep log size bounded
  while (logBox.children.length > 20) {
    logBox.removeChild(logBox.lastChild);
  }
}
