/**
 * Real-Time Bus Tracking System
 * Anurag University, Venkatapur, Ghatkesar, Hyderabad
 * Passenger Tracking Map & Live Polling Module
 */

// Coordinates for Anurag University Main Campus
const ANURAG_UNIVERSITY = {
  name: 'Anurag University',
  subtitle: 'Venkatapur, Ghatkesar, Hyderabad, Telangana 500088',
  lat: 17.41931,
  lng: 78.65654
};

// Configured Hyderabad Demo Destinations (Used as markers & geocoding fallbacks)
const HYDERABAD_DEMO_DESTINATIONS = [
  {
    id: 'dest-anurag',
    name: 'Anurag University (Main Campus)',
    landmark: 'Venkatapur, Ghatkesar, Hyderabad - 500088',
    category: 'University Campus',
    icon: '🎓',
    lat: 17.41931,
    lng: 78.65654,
    desc: 'Autonomous Engineering & Technology Campus Gate'
  },
  {
    id: 'dest-charminar',
    name: 'Charminar',
    landmark: 'Old City Transit Hub, Hyderabad',
    category: 'Heritage Landmark',
    icon: '🏛️',
    lat: 17.36160,
    lng: 78.47470,
    desc: 'Historic 16th-century 4-pillar monument and bustling city terminal'
  },
  {
    id: 'dest-hussain-sagar',
    name: 'Hussain Sagar Lake',
    landmark: 'Tank Bund Road, Central Hyderabad',
    category: 'City Landmark',
    icon: '🌊',
    lat: 17.42390,
    lng: 78.47380,
    desc: 'Famous heart-shaped lake connecting Hyderabad & Secunderabad'
  },
  {
    id: 'dest-secunderabad',
    name: 'Secunderabad Railway Station',
    landmark: 'Platform 1 / Gurudwara Bus Stand',
    category: 'Transit Terminal',
    icon: '🚉',
    lat: 17.43390,
    lng: 78.50160,
    desc: 'Major non-suburban railway terminal and SCR transport interchange'
  },
  {
    id: 'dest-uppal',
    name: 'Uppal Ring Road & Metro Station',
    landmark: 'Inner Ring Road / Warangal Highway NH-163 Junction',
    category: 'Metro Interchange',
    icon: '🚇',
    lat: 17.40180,
    lng: 78.56020,
    desc: 'Crucial interchange connecting Ghatkesar highway to Hyderabad Metro Red Line'
  },
  {
    id: 'dest-ghatkesar',
    name: 'Ghatkesar Town Junction',
    landmark: 'Warangal Highway NH-163 Bus Terminal',
    category: 'Transit Junction',
    icon: '🚏',
    lat: 17.44850,
    lng: 78.68300,
    desc: 'Ghatkesar municipal transit hub and local railway station'
  }
];

let map = null;
let anuragMarker = null;
let destinationMarkers = {}; // destId -> L.marker
let busMarkers = {};          // busId -> L.marker
let stopMarkers = {};         // stopId -> L.marker
let routePolylines = [];      // array of L.polyline
let allLoadedStops = [];      // cached stops from API
let selectedBusId = null;
let selectedRouteId = null;
let followBus = false;
let pollingInterval = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  addAnuragUniversityMarker();
  addDemoDestinationMarkers();
  loadRoutes();
  loadAllStops();
  startLiveTracking();
  bindTrackingEvents();
  setupSearchBox();
  setupQuickPills();
});

/**
 * Initialize Leaflet Map with OpenStreetMap tiles centered at Anurag University
 */
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;

  // Set default center to Anurag University (17.41931, 78.65654)
  map = L.map('map', {
    zoomControl: true,
    minZoom: 9,
    maxZoom: 19
  }).setView([ANURAG_UNIVERSITY.lat, ANURAG_UNIVERSITY.lng], 12);

  // OpenStreetMap Standard Tiles
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Fix container sizing and tile rendering issues
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 200);

  window.addEventListener('resize', () => {
    if (map) map.invalidateSize();
  });
}

/**
 * Requirement 3: Add clearly visible marker named Anurag University
 */
function addAnuragUniversityMarker() {
  if (!map) return;

  const anuragIcon = L.divIcon({
    className: 'anurag-marker-icon',
    html: `
      <div class="anurag-marker-pin pulse-glow" title="Anurag University (Main Campus)">
        <div class="uni-icon-wrap">🎓</div>
        <div class="uni-name-tag">Anurag University</div>
      </div>
    `,
    iconSize: [170, 44],
    iconAnchor: [20, 22]
  });

  anuragMarker = L.marker([ANURAG_UNIVERSITY.lat, ANURAG_UNIVERSITY.lng], {
    icon: anuragIcon,
    zIndexOffset: 1000
  }).addTo(map);

  anuragMarker.bindPopup(`
    <div style="font-family: inherit; min-width: 220px;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #fff; padding: 0.6rem 0.75rem; border-radius: 6px 6px 0 0; margin: -1px -1px 8px -1px;">
        <h4 style="margin: 0; font-size: 1.05rem;">🎓 Anurag University</h4>
        <small style="opacity: 0.95;">Main Campus Terminal</small>
      </div>
      <p style="margin: 0 0 6px 0; font-size: 0.85rem; color: #334155;">
        <b>Address:</b> Venkatapur, Ghatkesar, Hyderabad, Telangana 500088
      </p>
      <div style="font-size: 0.75rem; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; padding: 4px 6px; border-radius: 4px;">
        📍 GPS: 17.41931, 78.65654
      </div>
    </div>
  `);
}

/**
 * Requirement 4: Add Hyderabad demo destination markers (Charminar, Hussain Sagar Lake, Secunderabad Station)
 */
function addDemoDestinationMarkers() {
  if (!map) return;

  HYDERABAD_DEMO_DESTINATIONS.forEach(dest => {
    // Skip Anurag since it has its own prominent icon
    if (dest.id === 'dest-anurag') return;

    const destIcon = L.divIcon({
      className: 'dest-marker-icon',
      html: `
        <div class="dest-marker-pin" title="${dest.name}">
          <div class="dest-icon-wrap">${dest.icon}</div>
          <span>${dest.name}</span>
        </div>
      `,
      iconSize: [150, 36],
      iconAnchor: [16, 18]
    });

    const marker = L.marker([dest.lat, dest.lng], {
      icon: destIcon,
      zIndexOffset: 500
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: inherit; min-width: 200px;">
        <strong style="color: #b45309; font-size: 1rem;">${dest.icon} ${dest.name}</strong><br/>
        <small style="color: #64748b;">${dest.landmark}</small>
        <p style="margin: 6px 0 4px 0; font-size: 0.82rem; color: #475569;">${dest.desc}</p>
        <span style="font-size: 0.75rem; color: #94a3b8;">Lat: ${dest.lat.toFixed(5)}, Lng: ${dest.lng.toFixed(5)}</span>
      </div>
    `);

    destinationMarkers[dest.id] = marker;
  });
}

/**
 * Setup Destination and Stop Search Box (Requirement 5 & 11)
 */
function setupSearchBox() {
  const searchInput = document.getElementById('map-search-input');
  const suggestionsBox = document.getElementById('search-suggestions');
  const clearBtn = document.getElementById('btn-clear-search');
  const execBtn = document.getElementById('btn-exec-search');

  if (!searchInput || !suggestionsBox) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

    if (!query) {
      suggestionsBox.style.display = 'none';
      return;
    }

    renderSearchSuggestions(query);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      suggestionsBox.style.display = 'none';
    });
  }

  if (execBtn) {
    execBtn.addEventListener('click', () => {
      executeSearch(searchInput.value.trim());
    });
  }

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeSearch(searchInput.value.trim());
      suggestionsBox.style.display = 'none';
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.map-search-container')) {
      suggestionsBox.style.display = 'none';
    }
  });
}

function renderSearchSuggestions(query) {
  const suggestionsBox = document.getElementById('search-suggestions');
  if (!suggestionsBox) return;

  const matches = [];

  // Match demo destinations
  HYDERABAD_DEMO_DESTINATIONS.forEach(d => {
    if (d.name.toLowerCase().includes(query) || d.landmark.toLowerCase().includes(query)) {
      matches.push({
        title: d.name,
        subtitle: d.landmark,
        icon: d.icon,
        lat: d.lat,
        lng: d.lng,
        type: 'destination',
        targetId: d.id
      });
    }
  });

  // Match loaded transit stops
  allLoadedStops.forEach(s => {
    if (s.name.toLowerCase().includes(query) || (s.landmark && s.landmark.toLowerCase().includes(query))) {
      matches.push({
        title: s.name,
        subtitle: s.landmark || 'Bus Stop',
        icon: '🚏',
        lat: s.latitude,
        lng: s.longitude,
        type: 'stop',
        targetId: s.id
      });
    }
  });

  if (matches.length === 0) {
    suggestionsBox.innerHTML = `
      <div class="suggestion-item" style="cursor: default; color: #64748b;">
        <span>🔍 Press Enter to search on OpenStreetMap</span>
      </div>
    `;
    suggestionsBox.style.display = 'block';
    return;
  }

  let html = '';
  matches.slice(0, 7).forEach(item => {
    html += `
      <div class="suggestion-item" onclick="selectSearchResult(${item.lat}, ${item.lng}, '${item.title.replace(/'/g, "\\'")}', '${item.type}', '${item.targetId}')">
        <span class="suggestion-icon">${item.icon}</span>
        <div class="suggestion-text">
          <strong>${item.title}</strong>
          <small>${item.subtitle}</small>
        </div>
      </div>
    `;
  });

  suggestionsBox.innerHTML = html;
  suggestionsBox.style.display = 'block';
}

window.selectSearchResult = function(lat, lng, title, type, targetId) {
  const suggestionsBox = document.getElementById('search-suggestions');
  const searchInput = document.getElementById('map-search-input');
  if (suggestionsBox) suggestionsBox.style.display = 'none';
  if (searchInput) searchInput.value = title;

  focusMapLocation(lat, lng, title, type, targetId);
};

async function executeSearch(query) {
  if (!query) return;

  const q = query.toLowerCase();

  // 1. Try local exact or fuzzy match
  const localMatch = HYDERABAD_DEMO_DESTINATIONS.find(d => d.name.toLowerCase().includes(q) || d.landmark.toLowerCase().includes(q))
    || allLoadedStops.find(s => s.name.toLowerCase().includes(q) || (s.landmark && s.landmark.toLowerCase().includes(q)));

  if (localMatch) {
    const lat = localMatch.lat || localMatch.latitude;
    const lng = localMatch.lng || localMatch.longitude;
    focusMapLocation(lat, lng, localMatch.name, 'local');
    return;
  }

  // 2. Fallback to OpenStreetMap Nominatim Geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Hyderabad')}&countrycodes=in&limit=1`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();

    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      focusMapLocation(lat, lng, data[0].display_name.split(',')[0], 'geocoded');
      return;
    }
  } catch (err) {
    console.warn('External geocoding failed, falling back to Anurag University demo coordinates:', err);
  }

  // 3. Fallback: Default to Anurag University
  showToast(`No exact match for "${query}". Centering on Anurag University.`, 'warning');
  focusMapLocation(ANURAG_UNIVERSITY.lat, ANURAG_UNIVERSITY.lng, 'Anurag University', 'anurag');
}

function focusMapLocation(lat, lng, title, type, targetId) {
  if (!map) return;

  map.flyTo([lat, lng], 15, { duration: 1.2 });

  if (targetId && destinationMarkers[targetId]) {
    destinationMarkers[targetId].openPopup();
  } else if (type === 'anurag' || title.includes('Anurag')) {
    if (anuragMarker) anuragMarker.openPopup();
  } else if (targetId && stopMarkers[targetId]) {
    stopMarkers[targetId].openPopup();
  } else {
    L.popup()
      .setLatLng([lat, lng])
      .setContent(`<strong>📍 ${title}</strong><br/><small>Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</small>`)
      .openOn(map);
  }
}

function setupQuickPills() {
  document.querySelectorAll('.quick-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const destId = pill.getAttribute('data-dest');
      const dest = HYDERABAD_DEMO_DESTINATIONS.find(d => d.id === destId);
      if (dest) {
        focusMapLocation(dest.lat, dest.lng, dest.name, 'destination', dest.id);
      }
    });
  });
}

function bindTrackingEvents() {
  const routeSelect = document.getElementById('route-select');
  if (routeSelect) {
    routeSelect.addEventListener('change', (e) => {
      selectedRouteId = e.target.value ? parseInt(e.target.value) : null;
      onRouteSelected(selectedRouteId);
    });
  }

  const busSelect = document.getElementById('bus-select');
  if (busSelect) {
    busSelect.addEventListener('change', (e) => {
      selectedBusId = e.target.value ? parseInt(e.target.value) : null;
      if (selectedBusId) {
        focusBus(selectedBusId);
      } else {
        hideBusInfoCard();
      }
    });
  }

  const followBtn = document.getElementById('btn-follow-bus');
  if (followBtn) {
    followBtn.addEventListener('click', () => {
      followBus = !followBus;
      followBtn.classList.toggle('active', followBus);
      followBtn.innerHTML = followBus ? '<span>📍 Following Bus</span>' : '<span>🎯 Follow Bus</span>';
      if (followBus && selectedBusId && busMarkers[selectedBusId]) {
        map.panTo(busMarkers[selectedBusId].getLatLng());
      }
    });
  }

  const fitBtn = document.getElementById('btn-fit-bounds');
  if (fitBtn) {
    fitBtn.addEventListener('click', fitAllMarkers);
  }

  const focusAnuragBtn = document.getElementById('btn-focus-anurag');
  if (focusAnuragBtn) {
    focusAnuragBtn.addEventListener('click', () => {
      map.flyTo([ANURAG_UNIVERSITY.lat, ANURAG_UNIVERSITY.lng], 14, { duration: 1.0 });
      if (anuragMarker) anuragMarker.openPopup();
    });
  }

  // Stop Search Form
  const searchBtn = document.getElementById('btn-search-routes');
  if (searchBtn) {
    searchBtn.addEventListener('click', handleRouteSearch);
  }
}

async function loadRoutes() {
  try {
    const routes = await API.getRoutes();
    const routeSelect = document.getElementById('route-select');
    if (!routeSelect) return;

    routeSelect.innerHTML = '<option value="">-- All Active Routes --</option>';
    let anuragRouteId = null;

    routes.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.routeNumber} - ${r.routeName}`;
      routeSelect.appendChild(opt);

      // Auto-identify main route from Anurag University to Hyderabad
      if (r.routeNumber === 'AU-HYD-01' || r.routeName.includes('Hyderabad City Express')) {
        anuragRouteId = r.id;
      }
    });

    // Requirement 6: Automatically load & render sample route from Anurag University to Hyderabad
    if (anuragRouteId) {
      routeSelect.value = anuragRouteId;
      selectedRouteId = anuragRouteId;
      onRouteSelected(anuragRouteId);
    }
  } catch (err) {
    console.error('Failed to load routes:', err);
  }
}

async function loadAllStops() {
  try {
    const stops = await API.getStops();
    allLoadedStops = stops;

    // Clear old stop markers
    Object.values(stopMarkers).forEach(m => map.removeLayer(m));
    stopMarkers = {};

    stops.forEach((stop) => {
      const stopIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: `<div class="stop-marker-pin" title="${stop.name}">🚏</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; min-width: 170px;">
            <strong style="color: #1e3a8a; font-size: 0.95rem;">🚏 ${stop.name}</strong><br/>
            <small style="color: #64748b;">${stop.landmark || 'Campus Transit Stop'}</small><br/>
            <span style="font-size: 0.75rem; color: #94a3b8;">Lat: ${stop.latitude.toFixed(5)}, Lng: ${stop.longitude.toFixed(5)}</span>
          </div>
        `);

      stopMarkers[stop.id] = marker;
    });

    // Populate search dropdowns
    const fromSelect = document.getElementById('search-from-stop');
    const toSelect = document.getElementById('search-to-stop');
    if (fromSelect && toSelect) {
      fromSelect.innerHTML = '<option value="">Select Origin Stop</option>';
      toSelect.innerHTML = '<option value="">Select Destination Stop</option>';
      stops.forEach(s => {
        fromSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        toSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`;
      });
    }
  } catch (err) {
    console.error('Failed to load stops:', err);
  }
}

/**
 * Requirement 6: Add a sample bus route from Anurag University towards Hyderabad,
 * with a visible route line and bus-stop markers.
 */
async function onRouteSelected(routeId) {
  // Clear route polylines
  routePolylines.forEach(p => map.removeLayer(p));
  routePolylines = [];

  if (!routeId) {
    loadAllStops();
    return;
  }

  try {
    const route = await API.getRoute(routeId);
    if (!route || !route.stops || route.stops.length === 0) return;

    // Draw visible high-contrast polyline connecting stops
    const latLngs = route.stops.map(s => [s.latitude, s.longitude]);
    const polyline = L.polyline(latLngs, {
      color: '#2563eb',
      weight: 6,
      opacity: 0.9,
      lineJoin: 'round',
      dashArray: '10, 8'
    }).addTo(map);

    routePolylines.push(polyline);
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // Highlight route stops with sequential order badges
    route.stops.forEach(s => {
      if (stopMarkers[s.stopId]) {
        const pinHtml = `<div class="stop-marker-pin" style="background:#2563eb; color:#ffffff; border-color:#ffffff; font-weight:800;" title="${s.stopName}">${s.stopOrder}</div>`;
        stopMarkers[s.stopId].setIcon(L.divIcon({
          className: 'custom-stop-icon',
          html: pinHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        }));
      }
    });
  } catch (err) {
    console.error('Error selecting route:', err);
  }
}

function startLiveTracking() {
  pollBuses();
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(pollBuses, 2000);
}

async function pollBuses() {
  try {
    const buses = await API.getActiveBuses();
    updateBusSelectDropdown(buses);
    updateBusMarkers(buses);

    // Auto-select AU-BUS-01 on first run if nothing selected
    if (!selectedBusId && buses.length > 0) {
      const primaryBus = buses.find(b => b.busNumber === 'AU-BUS-01') || buses[0];
      selectedBusId = primaryBus.id;
      const busSelect = document.getElementById('bus-select');
      if (busSelect) busSelect.value = primaryBus.id;
    }

    if (selectedBusId) {
      const activeBus = buses.find(b => b.id === selectedBusId);
      if (activeBus) {
        renderBusInfoCard(activeBus);
        updateRouteTimeline(selectedBusId);
      }
    }
  } catch (err) {
    console.warn('Live tracking poll failed:', err);
  }
}

function updateBusSelectDropdown(buses) {
  const busSelect = document.getElementById('bus-select');
  if (!busSelect) return;

  const currentVal = busSelect.value;
  let html = '<option value="">-- Select a Bus to Track --</option>';

  buses.forEach(b => {
    const routeText = b.routeNumber ? ` (${b.routeNumber})` : ' [Unassigned]';
    html += `<option value="${b.id}">${b.busNumber}${routeText} - ${b.status}</option>`;
  });

  busSelect.innerHTML = html;
  if (currentVal && buses.some(b => b.id.toString() === currentVal)) {
    busSelect.value = currentVal;
  }
}

function updateBusMarkers(buses) {
  const presentIds = new Set();

  buses.forEach(bus => {
    if (!bus.currentLatitude || !bus.currentLongitude) return;

    presentIds.add(bus.id);
    const latLng = [bus.currentLatitude, bus.currentLongitude];
    const heading = bus.heading || 0;

    const iconHtml = `
      <div class="bus-marker-pin" style="transform: rotate(${heading}deg);" title="${bus.busNumber} (${bus.speedKmph} km/h)">
        <svg viewBox="0 0 24 24">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
    `;

    const busIcon = L.divIcon({
      className: 'bus-marker-icon',
      html: iconHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    if (busMarkers[bus.id]) {
      busMarkers[bus.id].setLatLng(latLng);
      busMarkers[bus.id].setIcon(busIcon);
    } else {
      const marker = L.marker(latLng, { icon: busIcon, zIndexOffset: 800 })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 190px;">
            <strong style="color: #2563eb; font-size: 1.1rem;">🚌 ${bus.busNumber}</strong><br/>
            <span>Route: <b>${bus.routeName || 'N/A'}</b></span><br/>
            <span>Speed: <b>${bus.speedKmph} km/h</b></span><br/>
            <span>Next Stop: <b>${bus.nextStopName || 'In Transit'}</b></span><br/>
            <small style="color: #64748b;">ETA: ${bus.etaNextStopMinutes} mins (${bus.distanceToNextStopKm || 0} km)</small>
          </div>
        `);

      marker.on('click', () => {
        selectedBusId = bus.id;
        const select = document.getElementById('bus-select');
        if (select) select.value = bus.id;
        focusBus(bus.id);
      });

      busMarkers[bus.id] = marker;
    }

    if (followBus && selectedBusId === bus.id) {
      map.panTo(latLng);
    }
  });

  // Remove stale markers
  Object.keys(busMarkers).forEach(id => {
    if (!presentIds.has(parseInt(id))) {
      map.removeLayer(busMarkers[id]);
      delete busMarkers[id];
    }
  });
}

function focusBus(busId) {
  selectedBusId = busId;
  if (busMarkers[busId]) {
    const latLng = busMarkers[busId].getLatLng();
    map.setView(latLng, 15);
    busMarkers[busId].openPopup();
  }
}

/**
 * Requirement 7: Display bus location, route name, stop name, and estimated arrival time
 */
function renderBusInfoCard(bus) {
  const card = document.getElementById('active-bus-card');
  if (!card) return;

  card.style.display = 'block';

  const badgeClass = bus.status === 'IN_TRANSIT' ? 'badge-in-transit' :
                     bus.status === 'STOPPED_AT_STOP' ? 'badge-stopped' : 'badge-idle';

  card.innerHTML = `
    <div class="bus-card-header">
      <div class="bus-number-badge">
        🚌 ${bus.busNumber}
        <small style="color: #64748b; font-size: 0.8rem; font-weight: normal;">(${bus.regNumber})</small>
      </div>
      <span class="badge ${badgeClass}">${bus.status.replace(/_/g, ' ')}</span>
    </div>

    <div class="bus-card-stats">
      <div class="bus-stat-item">
        <span class="bus-stat-label">Route Name</span>
        <span class="bus-stat-val" style="color: #1e3a8a;">${bus.routeName || 'None'}</span>
      </div>
      <div class="bus-stat-item">
        <span class="bus-stat-label">Current Speed</span>
        <span class="bus-stat-val" style="color: #2563eb;">${bus.speedKmph} km/h</span>
      </div>
      <div class="bus-stat-item">
        <span class="bus-stat-label">Next Stop</span>
        <span class="bus-stat-val" style="color: #d97706;">${bus.nextStopName || 'In Transit'}</span>
      </div>
      <div class="bus-stat-item">
        <span class="bus-stat-label">Estimated Arrival</span>
        <span class="bus-stat-val" style="color: #10b981;">~${bus.etaNextStopMinutes} mins (${bus.distanceToNextStopKm} km)</span>
      </div>
    </div>

    <div style="font-size: 0.78rem; color: #64748b; background: #f8fafc; padding: 4px 8px; border-radius: 4px; margin-bottom: 0.5rem;">
      📍 GPS: <b>${bus.currentLatitude ? bus.currentLatitude.toFixed(5) : '--'}</b>, <b>${bus.currentLongitude ? bus.currentLongitude.toFixed(5) : '--'}</b>
    </div>

    <div class="bus-driver-info">
      👤 Driver: <b>${bus.driverName || 'N/A'}</b> | 📞 ${bus.driverPhone || 'N/A'}
    </div>
  `;
}

function hideBusInfoCard() {
  const card = document.getElementById('active-bus-card');
  if (card) card.style.display = 'none';

  const timeline = document.getElementById('route-timeline');
  if (timeline) timeline.innerHTML = '<p style="color: #64748b; font-size: 0.875rem;">Select a bus to view live stop timeline and ETAs.</p>';
}

async function updateRouteTimeline(busId) {
  const timeline = document.getElementById('route-timeline');
  if (!timeline) return;

  try {
    const etas = await API.getBusEtas(busId);
    if (!etas || etas.length === 0) {
      timeline.innerHTML = '<p style="color: #64748b; font-size: 0.875rem;">No route schedule available for this bus.</p>';
      return;
    }

    let html = '<div class="timeline-container">';
    etas.forEach(item => {
      const isPassed = item.status === 'PASSED';
      const isNext = item.status === 'NEXT_STOP';
      const itemClass = isPassed ? 'timeline-item passed' : (isNext ? 'timeline-item next-stop' : 'timeline-item');
      
      const etaBadge = isPassed ? '<span style="color: #10b981; font-weight: 600;">✓ Passed</span>' :
                       isNext ? `<span style="color: #d97706; font-weight: 700;">★ Next (~${item.etaMinutes} mins)</span>` :
                       `<span style="color: #64748b;">~${item.etaMinutes} mins</span>`;

      html += `
        <div class="${itemClass}">
          <div class="timeline-marker">${item.stopOrder}</div>
          <div class="timeline-content">
            <div class="timeline-stop-name">${item.stopName}</div>
            <div class="timeline-stop-meta">
              <span>${item.distanceKm > 0 ? item.distanceKm + ' km away' : 'At stop'}</span> • ${etaBadge}
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    timeline.innerHTML = html;
  } catch (err) {
    console.error('Error fetching bus ETAs:', err);
  }
}

function fitAllMarkers() {
  const markers = [anuragMarker]
    .concat(Object.values(destinationMarkers))
    .concat(Object.values(busMarkers))
    .concat(Object.values(stopMarkers))
    .filter(Boolean);

  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds(), { padding: [50, 50] });
  }
}

async function handleRouteSearch() {
  const fromId = document.getElementById('search-from-stop').value;
  const toId = document.getElementById('search-to-stop').value;
  const resultDiv = document.getElementById('search-results');

  if (!fromId || !toId) {
    showToast('Please select both Origin and Destination stops', 'warning');
    return;
  }

  if (fromId === toId) {
    showToast('Origin and Destination cannot be the same', 'warning');
    return;
  }

  try {
    const matchingRoutes = await API.searchRoutes(fromId, toId);
    if (!resultDiv) return;

    if (matchingRoutes.length === 0) {
      resultDiv.innerHTML = '<div style="padding: 0.75rem; background: #fffbeb; color: #b45309; border-radius: 6px; font-size: 0.85rem;">No direct routes found between these stops.</div>';
    } else {
      let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">';
      matchingRoutes.forEach(r => {
        html += `
          <div style="padding: 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #2563eb;">${r.routeNumber}</strong> - ${r.routeName}<br/>
              <small style="color: #64748b;">Distance: ${r.totalDistanceKm} km</small>
            </div>
            <button class="btn btn-sm btn-primary" onclick="selectRouteById(${r.id})">Track</button>
          </div>
        `;
      });
      html += '</div>';
      resultDiv.innerHTML = html;
    }
  } catch (err) {
    showToast('Search failed: ' + err.message, 'danger');
  }
}

window.selectRouteById = function(routeId) {
  const select = document.getElementById('route-select');
  if (select) {
    select.value = routeId;
    selectedRouteId = routeId;
    onRouteSelected(routeId);
  }
};
