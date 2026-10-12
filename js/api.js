/**
 * Real-Time Bus Tracking System
 * Centralized API Client Module
 */

const API = {
  baseUrl: '',

  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP Error ${response.status}: ${response.statusText}`);
      }
      if (response.status === 204) {
        return null;
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  // --- Buses Endpoints ---
  async getBuses() {
    return this.request('/api/buses');
  },

  async getActiveBuses() {
    return this.request('/api/buses/active');
  },

  async getBus(id) {
    return this.request(`/api/buses/${id}`);
  },

  async getBusEtas(id) {
    return this.request(`/api/buses/${id}/eta`);
  },

  async createBus(data) {
    return this.request('/api/buses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateBus(id, data) {
    return this.request(`/api/buses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteBus(id) {
    return this.request(`/api/buses/${id}`, {
      method: 'DELETE'
    });
  },

  // --- Routes Endpoints ---
  async getRoutes() {
    return this.request('/api/routes');
  },

  async getRoute(id) {
    return this.request(`/api/routes/${id}`);
  },

  async createRoute(data) {
    return this.request('/api/routes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateRoute(id, data) {
    return this.request(`/api/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteRoute(id) {
    return this.request(`/api/routes/${id}`, {
      method: 'DELETE'
    });
  },

  async addStopToRoute(routeId, stopId, stopOrder) {
    return this.request(`/api/routes/${routeId}/stops`, {
      method: 'POST',
      body: JSON.stringify({ stopId, stopOrder })
    });
  },

  async removeStopFromRoute(routeId, stopId) {
    return this.request(`/api/routes/${routeId}/stops/${stopId}`, {
      method: 'DELETE'
    });
  },

  async searchRoutes(originStopId, destStopId) {
    return this.request(`/api/routes/search?originStopId=${originStopId}&destStopId=${destStopId}`);
  },

  // --- Stops Endpoints ---
  async getStops() {
    return this.request('/api/stops');
  },

  async getStop(id) {
    return this.request(`/api/stops/${id}`);
  },

  async createStop(data) {
    return this.request('/api/stops', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateStop(id, data) {
    return this.request(`/api/stops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteStop(id) {
    return this.request(`/api/stops/${id}`, {
      method: 'DELETE'
    });
  },

  // --- Simulator Endpoints ---
  async getSimulationStatus() {
    return this.request('/api/simulator/status');
  },

  async startSimulation() {
    return this.request('/api/simulator/start', { method: 'POST' });
  },

  async pauseSimulation() {
    return this.request('/api/simulator/pause', { method: 'POST' });
  },

  async resetSimulation() {
    return this.request('/api/simulator/reset', { method: 'POST' });
  },

  async setSimulationSpeed(multiplier) {
    return this.request(`/api/simulator/speed?multiplier=${multiplier}`, { method: 'POST' });
  },

  async teleportBus(busId, stopId) {
    return this.request(`/api/simulator/teleport?busId=${busId}&stopId=${stopId}`, { method: 'POST' });
  }
};

// Global Toast Notification Helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
