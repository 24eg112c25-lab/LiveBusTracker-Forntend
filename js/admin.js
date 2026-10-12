/**
 * Real-Time Bus Tracking System
 * Admin Management Module (Buses, Routes, Stops CRUD)
 */

let pickerMap = null;
let pickerMarker = null;
let cachedRoutes = [];
let cachedStops = [];

document.addEventListener('DOMContentLoaded', () => {
  initAdminTabs();
  loadAdminBuses();
  loadAdminRoutes();
  loadAdminStops();
  bindModalEvents();
});

function initAdminTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.style.display = 'block';

      if (targetId === 'tab-stops' || targetId === 'tab-simulator') {
        window.dispatchEvent(new Event('resize'));
      }
    });
  });
}

function bindModalEvents() {
  // Close buttons
  document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Bus Form Submit
  const busForm = document.getElementById('bus-form');
  if (busForm) {
    busForm.addEventListener('submit', handleBusFormSubmit);
  }

  // Route Form Submit
  const routeForm = document.getElementById('route-form');
  if (routeForm) {
    routeForm.addEventListener('submit', handleRouteFormSubmit);
  }

  // Stop Form Submit
  const stopForm = document.getElementById('stop-form');
  if (stopForm) {
    stopForm.addEventListener('submit', handleStopFormSubmit);
  }
}

function closeModal() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('show');
}

// ==========================================================================
// Bus Fleet Management
// ==========================================================================
async function loadAdminBuses() {
  try {
    const buses = await API.getBuses();
    const tbody = document.getElementById('buses-tbody');
    if (!tbody) return;

    if (buses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b;">No buses registered yet.</td></tr>';
      return;
    }

    let html = '';
    buses.forEach(b => {
      const badgeClass = b.status === 'IN_TRANSIT' ? 'badge-in-transit' :
                         b.status === 'STOPPED_AT_STOP' ? 'badge-stopped' : 'badge-idle';

      html += `
        <tr>
          <td><b>${b.id}</b></td>
          <td><b>${b.busNumber}</b><br/><small style="color: #64748b;">${b.regNumber}</small></td>
          <td>${b.driverName || 'N/A'}<br/><small style="color: #64748b;">${b.driverPhone || ''}</small></td>
          <td>${b.routeNumber ? `<span style="color: #2563eb; font-weight: 600;">${b.routeNumber}</span>` : '<span style="color: #94a3b8;">None</span>'}</td>
          <td><span class="badge ${badgeClass}">${b.status.replace(/_/g, ' ')}</span></td>
          <td>${b.speedKmph} km/h</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-outline" onclick="openEditBusModal(${b.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteBusItem(${b.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    showToast('Failed to load buses: ' + err.message, 'danger');
  }
}

async function openAddBusModal() {
  document.getElementById('bus-modal-title').textContent = 'Add New Bus';
  document.getElementById('bus-id').value = '';
  document.getElementById('bus-number').value = '';
  document.getElementById('bus-reg-number').value = '';
  document.getElementById('bus-capacity').value = '40';
  document.getElementById('bus-driver-name').value = '';
  document.getElementById('bus-driver-phone').value = '';
  document.getElementById('bus-status').value = 'IDLE';

  await populateRouteDropdownForBus(null);
  showModal('bus-modal');
}

async function openEditBusModal(busId) {
  try {
    const bus = await API.getBus(busId);
    if (!bus) return;

    document.getElementById('bus-modal-title').textContent = `Edit Bus ${bus.busNumber}`;
    document.getElementById('bus-id').value = bus.id;
    document.getElementById('bus-number').value = bus.busNumber;
    document.getElementById('bus-reg-number').value = bus.regNumber;
    document.getElementById('bus-capacity').value = bus.capacity || 40;
    document.getElementById('bus-driver-name').value = bus.driverName || '';
    document.getElementById('bus-driver-phone').value = bus.driverPhone || '';
    document.getElementById('bus-status').value = bus.status || 'IDLE';

    await populateRouteDropdownForBus(bus.routeId);
    showModal('bus-modal');
  } catch (err) {
    showToast('Failed to fetch bus details: ' + err.message, 'danger');
  }
}

async function populateRouteDropdownForBus(selectedRouteId) {
  const select = document.getElementById('bus-route-id');
  if (!select) return;

  const routes = await API.getRoutes();
  cachedRoutes = routes;

  let html = '<option value="">-- No Route Assigned --</option>';
  routes.forEach(r => {
    const isSelected = selectedRouteId === r.id ? 'selected' : '';
    html += `<option value="${r.id}" ${isSelected}>${r.routeNumber} - ${r.routeName}</option>`;
  });
  select.innerHTML = html;
}

async function handleBusFormSubmit(e) {
  e.preventDefault();
  const busId = document.getElementById('bus-id').value;
  const routeVal = document.getElementById('bus-route-id').value;

  const payload = {
    busNumber: document.getElementById('bus-number').value.trim(),
    regNumber: document.getElementById('bus-reg-number').value.trim(),
    capacity: parseInt(document.getElementById('bus-capacity').value) || 40,
    driverName: document.getElementById('bus-driver-name').value.trim(),
    driverPhone: document.getElementById('bus-driver-phone').value.trim(),
    status: document.getElementById('bus-status').value,
    routeId: routeVal ? parseInt(routeVal) : null
  };

  try {
    if (busId) {
      await API.updateBus(busId, payload);
      showToast('Bus updated successfully', 'success');
    } else {
      await API.createBus(payload);
      showToast('Bus registered successfully', 'success');
    }
    closeModal();
    loadAdminBuses();
  } catch (err) {
    showToast('Error saving bus: ' + err.message, 'danger');
  }
}

async function deleteBusItem(busId) {
  if (!confirm(`Are you sure you want to delete Bus #${busId}?`)) return;

  try {
    await API.deleteBus(busId);
    showToast('Bus deleted successfully', 'success');
    loadAdminBuses();
  } catch (err) {
    showToast('Failed to delete bus: ' + err.message, 'danger');
  }
}

// ==========================================================================
// Route Management
// ==========================================================================
async function loadAdminRoutes() {
  try {
    const routes = await API.getRoutes();
    cachedRoutes = routes;
    const tbody = document.getElementById('routes-tbody');
    if (!tbody) return;

    if (routes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">No routes configured yet.</td></tr>';
      return;
    }

    let html = '';
    routes.forEach(r => {
      const stopCount = r.stops ? r.stops.length : 0;
      html += `
        <tr>
          <td><b>${r.id}</b></td>
          <td><b>${r.routeNumber}</b></td>
          <td>${r.routeName}</td>
          <td>${r.origin} ➔ ${r.destination}</td>
          <td>${r.totalDistanceKm} km (${stopCount} stops)</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-primary" onclick="openManageRouteStopsModal(${r.id})">Stops (${stopCount})</button>
              <button class="btn btn-sm btn-outline" onclick="openEditRouteModal(${r.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteRouteItem(${r.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    showToast('Failed to load routes: ' + err.message, 'danger');
  }
}

function openAddRouteModal() {
  document.getElementById('route-modal-title').textContent = 'Create New Route';
  document.getElementById('route-id').value = '';
  document.getElementById('route-number').value = '';
  document.getElementById('route-name').value = '';
  document.getElementById('route-origin').value = '';
  document.getElementById('route-destination').value = '';
  showModal('route-modal');
}

async function openEditRouteModal(routeId) {
  try {
    const route = await API.getRoute(routeId);
    if (!route) return;

    document.getElementById('route-modal-title').textContent = `Edit Route ${route.routeNumber}`;
    document.getElementById('route-id').value = route.id;
    document.getElementById('route-number').value = route.routeNumber;
    document.getElementById('route-name').value = route.routeName;
    document.getElementById('route-origin').value = route.origin;
    document.getElementById('route-destination').value = route.destination;
    showModal('route-modal');
  } catch (err) {
    showToast('Failed to fetch route: ' + err.message, 'danger');
  }
}

async function handleRouteFormSubmit(e) {
  e.preventDefault();
  const routeId = document.getElementById('route-id').value;

  const payload = {
    routeNumber: document.getElementById('route-number').value.trim(),
    routeName: document.getElementById('route-name').value.trim(),
    origin: document.getElementById('route-origin').value.trim(),
    destination: document.getElementById('route-destination').value.trim()
  };

  try {
    if (routeId) {
      await API.updateRoute(routeId, payload);
      showToast('Route updated successfully', 'success');
    } else {
      await API.createRoute(payload);
      showToast('Route created successfully', 'success');
    }
    closeModal();
    loadAdminRoutes();
  } catch (err) {
    showToast('Error saving route: ' + err.message, 'danger');
  }
}

async function deleteRouteItem(routeId) {
  if (!confirm(`Are you sure you want to delete Route #${routeId}?`)) return;

  try {
    await API.deleteRoute(routeId);
    showToast('Route deleted successfully', 'success');
    loadAdminRoutes();
  } catch (err) {
    showToast('Failed to delete route: ' + err.message, 'danger');
  }
}

// Route Stops Sub-Management
let currentManagingRouteId = null;

async function openManageRouteStopsModal(routeId) {
  currentManagingRouteId = routeId;
  const route = await API.getRoute(routeId);
  const stops = await API.getStops();

  document.getElementById('manage-route-stops-title').textContent = `Manage Stops for ${route.routeNumber} (${route.routeName})`;

  // Populate Add Stop select
  const addStopSelect = document.getElementById('route-add-stop-select');
  addStopSelect.innerHTML = '<option value="">-- Choose Stop to Add --</option>';
  stops.forEach(s => {
    addStopSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.landmark || 'No landmark'})</option>`;
  });

  renderRouteStopsList(route.stops || []);
  showModal('manage-route-stops-modal');
}

function renderRouteStopsList(stops) {
  const container = document.getElementById('route-stops-list');
  if (!container) return;

  if (stops.length === 0) {
    container.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">No stops assigned yet.</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';
  stops.forEach(s => {
    html += `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0.85rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        <div>
          <span style="display: inline-block; width: 22px; height: 22px; background: #2563eb; color: #fff; text-align: center; border-radius: 50%; font-size: 0.75rem; line-height: 22px; font-weight: bold; margin-right: 0.5rem;">${s.stopOrder}</span>
          <strong>${s.stopName}</strong>
          <small style="color: #64748b; margin-left: 0.5rem;">+${s.distanceFromStartKm} km</small>
        </div>
        <button class="btn btn-sm btn-danger" onclick="removeStopFromCurrentRoute(${s.stopId})">Remove</button>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

async function addStopToCurrentRoute() {
  const stopId = document.getElementById('route-add-stop-select').value;
  if (!stopId || !currentManagingRouteId) {
    showToast('Please select a stop to add', 'warning');
    return;
  }

  try {
    const updated = await API.addStopToRoute(currentManagingRouteId, stopId, null);
    renderRouteStopsList(updated.stops || []);
    showToast('Stop added to route', 'success');
    loadAdminRoutes();
  } catch (err) {
    showToast('Failed to add stop: ' + err.message, 'danger');
  }
}

async function removeStopFromCurrentRoute(stopId) {
  if (!currentManagingRouteId) return;

  try {
    const updated = await API.removeStopFromRoute(currentManagingRouteId, stopId);
    renderRouteStopsList(updated.stops || []);
    showToast('Stop removed from route', 'success');
    loadAdminRoutes();
  } catch (err) {
    showToast('Failed to remove stop: ' + err.message, 'danger');
  }
}

// ==========================================================================
// Stop Management & Interactive Map Picker
// ==========================================================================
async function loadAdminStops() {
  try {
    const stops = await API.getStops();
    cachedStops = stops;
    const tbody = document.getElementById('stops-tbody');
    if (!tbody) return;

    if (stops.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">No stops added yet.</td></tr>';
      return;
    }

    let html = '';
    stops.forEach(s => {
      html += `
        <tr>
          <td><b>${s.id}</b></td>
          <td><b>${s.name}</b></td>
          <td>${s.landmark || '<span style="color:#94a3b8;">None</span>'}</td>
          <td>${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-outline" onclick="openEditStopModal(${s.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteStopItem(${s.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    showToast('Failed to load stops: ' + err.message, 'danger');
  }
}

function openAddStopModal() {
  document.getElementById('stop-modal-title').textContent = 'Add New Bus Stop';
  document.getElementById('stop-id').value = '';
  document.getElementById('stop-name').value = '';
  document.getElementById('stop-landmark').value = '';
  document.getElementById('stop-latitude').value = '17.41931';
  document.getElementById('stop-longitude').value = '78.65654';

  showModal('stop-modal');
  setTimeout(() => initPickerMap(17.41931, 78.65654), 250);
}

async function openEditStopModal(stopId) {
  try {
    const stop = await API.getStop(stopId);
    if (!stop) return;

    document.getElementById('stop-modal-title').textContent = `Edit Stop ${stop.name}`;
    document.getElementById('stop-id').value = stop.id;
    document.getElementById('stop-name').value = stop.name;
    document.getElementById('stop-landmark').value = stop.landmark || '';
    document.getElementById('stop-latitude').value = stop.latitude;
    document.getElementById('stop-longitude').value = stop.longitude;

    showModal('stop-modal');
    setTimeout(() => initPickerMap(stop.latitude, stop.longitude), 250);
  } catch (err) {
    showToast('Failed to fetch stop: ' + err.message, 'danger');
  }
}

function initPickerMap(initialLat, initialLng) {
  const container = document.getElementById('picker-map');
  if (!container) return;

  if (pickerMap) {
    pickerMap.remove();
    pickerMap = null;
  }

  pickerMap = L.map('picker-map').setView([initialLat, initialLng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(pickerMap);

  pickerMarker = L.marker([initialLat, initialLng], { draggable: true }).addTo(pickerMap);

  // Drag marker listener
  pickerMarker.on('dragend', (e) => {
    const pos = e.target.getLatLng();
    setPickerCoordinates(pos.lat, pos.lng);
  });

  // Map click listener to pick coordinates
  pickerMap.on('click', (e) => {
    pickerMarker.setLatLng(e.latlng);
    setPickerCoordinates(e.latlng.lat, e.latlng.lng);
  });
}

function setPickerCoordinates(lat, lng) {
  document.getElementById('stop-latitude').value = lat.toFixed(6);
  document.getElementById('stop-longitude').value = lng.toFixed(6);
}

async function handleStopFormSubmit(e) {
  e.preventDefault();
  const stopId = document.getElementById('stop-id').value;

  const payload = {
    name: document.getElementById('stop-name').value.trim(),
    landmark: document.getElementById('stop-landmark').value.trim(),
    latitude: parseFloat(document.getElementById('stop-latitude').value),
    longitude: parseFloat(document.getElementById('stop-longitude').value)
  };

  try {
    if (stopId) {
      await API.updateStop(stopId, payload);
      showToast('Stop updated successfully', 'success');
    } else {
      await API.createStop(payload);
      showToast('Stop created successfully', 'success');
    }
    closeModal();
    loadAdminStops();
  } catch (err) {
    showToast('Error saving stop: ' + err.message, 'danger');
  }
}

async function deleteStopItem(stopId) {
  if (!confirm(`Are you sure you want to delete Stop #${stopId}?`)) return;

  try {
    await API.deleteStop(stopId);
    showToast('Stop deleted successfully', 'success');
    loadAdminStops();
  } catch (err) {
    showToast('Failed to delete stop: ' + err.message, 'danger');
  }
}
