(() => {
  const GEOCODE_KEY = '7cf958ee8f68f665ff96c88f86f6965f5ffeffc';
  const GEOCODE_BASE = 'https://api.geocod.io/v1.7';
  const RADAR_META_URL = 'https://api.rainviewer.com/public/weather-maps.json';
  const STORAGE_KEY = 'precipradar_saved_location';
  const RADAR_OPACITY = 0.72;
  const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
  const DEFAULT_VIEW = { lat: 39.5, lng: -98.35, zoom: 5 };
  const LOCATION_ZOOM = 8;

  const mapEl = document.querySelector('#map');
  const activeLocationEl = document.querySelector('#active-location');
  const collapseBtn = document.querySelector('#collapse-btn');
  const widgetBody = document.querySelector('#widget-body');
  const geolocateBtn = document.querySelector('#geolocate-btn');
  const geolocateLabel = document.querySelector('#geolocate-label');
  const locationForm = document.querySelector('#location-form');
  const locationInput = document.querySelector('#location-input');
  const searchBtn = document.querySelector('#search-btn');
  const formError = document.querySelector('#form-error');
  const radarTimeEl = document.querySelector('#radar-time');
  const refreshBtn = document.querySelector('#refresh-btn');
  const timelineControls = document.querySelector('#timeline-controls');
  const playBtn = document.querySelector('#play-btn');
  const playIcon = document.querySelector('#play-icon');
  const pauseIcon = document.querySelector('#pause-icon');
  const frameSlider = document.querySelector('#frame-slider');
  const srStatus = document.querySelector('#sr-status');

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const map = L.map(mapEl, {
    zoomControl: false,
    center: [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng],
    zoom: DEFAULT_VIEW.zoom,
    minZoom: 3,
    maxZoom: 18,
    worldCopyJump: true
  });

  map.attributionControl.setPrefix(false);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    className: 'base-map-tiles',
    maxZoom: 19,
    zIndex: 1,
    attribution: '&copy; Map contributors'
  }).addTo(map);

  let locationMarker = null;

  let radarHost = '';
  let radarFrames = [];
  let currentFrameIndex = -1;
  const radarLayers = new Map();
  let isPlaying = false;
  let animationTimer = null;

  function announce(message) {
    srStatus.textContent = '';
    window.setTimeout(() => {
      srStatus.textContent = message;
    }, 50);
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
    locationInput.setAttribute('aria-invalid', 'true');
  }

  function clearError() {
    if (!formError.hidden) {
      formError.textContent = '';
      formError.hidden = true;
    }
    locationInput.removeAttribute('aria-invalid');
  }

  function syncUrlCoords(lat, lng, { replace = false } = {}) {
    try {
      const url = new URL(window.location.href);
      const nextLat = lat.toFixed(5);
      const nextLng = lng.toFixed(5);

      if (url.searchParams.get('lat') === nextLat && url.searchParams.get('lng') === nextLng) {
        return;
      }

      url.searchParams.delete('lon');
      url.searchParams.delete('long');
      url.searchParams.set('lat', nextLat);
      url.searchParams.set('lng', nextLng);

      if (replace) {
        window.history.replaceState({ lat, lng }, '', url);
      } else {
        window.history.pushState({ lat, lng }, '', url);
      }
    } catch {
      // Ignore history errors in restricted contexts
    }
  }

  function readCoordsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const rawLat = params.get('lat');
    const rawLng = params.get('lng') ?? params.get('lon') ?? params.get('long');
    if (rawLat === null || rawLng === null) return null;

    const lat = Number.parseFloat(rawLat);
    const lng = Number.parseFloat(rawLng);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }
    return { lat, lng };
  }

  function setLocationPin(lat, lng, label, { updateUrl = false, replaceUrl = false, instant = false } = {}) {
    const pinIcon = L.divIcon({
      className: 'location-pin',
      html: '<span class="location-pin-dot"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (locationMarker) {
      locationMarker.setLatLng([lat, lng]);
    } else {
      locationMarker = L.marker([lat, lng], {
        icon: pinIcon,
        keyboard: false,
        interactive: false
      }).addTo(map);
    }

    if (instant || reducedMotionQuery.matches) {
      map.setView([lat, lng], LOCATION_ZOOM, { animate: false });
    } else {
      map.flyTo([lat, lng], LOCATION_ZOOM, { duration: 0.9 });
    }

    if (updateUrl) {
      syncUrlCoords(lat, lng, { replace: replaceUrl });
    }

    activeLocationEl.textContent = label;
    activeLocationEl.title = label;
    document.title = `${label} | Precipitation Radar`;
    announce(`Radar centered on ${label}`);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng, label }));
    } catch {
      // Ignore storage quota or private mode restrictions
    }
  }

  function formatFrameTime(unixSeconds) {
    const date = new Date(unixSeconds * 1000);
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  function ensureFrameLayer(frame) {
    if (radarLayers.has(frame.path)) {
      return radarLayers.get(frame.path);
    }

    const tileUrl = `${radarHost}${frame.path}/512/{z}/{x}/{y}/2/1_1.png`;
    const layer = L.tileLayer(tileUrl, {
      tileSize: 256,
      opacity: 0,
      maxNativeZoom: 7,
      maxZoom: 18,
      zIndex: 10
    });

    layer.addTo(map);
    radarLayers.set(frame.path, layer);
    return layer;
  }

  function showRadarFrame(index) {
    if (!radarFrames.length) return;
    const bounded = ((index % radarFrames.length) + radarFrames.length) % radarFrames.length;
    const targetFrame = radarFrames[bounded];

    for (const [path, layer] of radarLayers.entries()) {
      if (path !== targetFrame.path) {
        layer.setOpacity(0);
      }
    }

    const activeLayer = ensureFrameLayer(targetFrame);
    activeLayer.setOpacity(RADAR_OPACITY);

    currentFrameIndex = bounded;
    frameSlider.value = String(bounded);

    const isLatest = bounded === radarFrames.length - 1;
    const formatted = formatFrameTime(targetFrame.time);
    radarTimeEl.textContent = isLatest ? `Latest · ${formatted}` : `Past · ${formatted}`;
  }

  function stopLoop() {
    isPlaying = false;
    if (animationTimer) {
      window.clearTimeout(animationTimer);
      animationTimer = null;
    }
    playBtn.setAttribute('aria-pressed', 'false');
    playBtn.setAttribute('aria-label', 'Play radar loop');
    playIcon.hidden = false;
    pauseIcon.hidden = true;
  }

  function scheduleNextFrame() {
    if (!isPlaying || radarFrames.length < 2) return;
    const isAtLatest = currentFrameIndex === radarFrames.length - 1;
    const delay = isAtLatest ? 1300 : 550;

    animationTimer = window.setTimeout(() => {
      if (!isPlaying) return;
      showRadarFrame(currentFrameIndex + 1);
      scheduleNextFrame();
    }, delay);
  }

  function toggleLoop() {
    if (isPlaying) {
      stopLoop();
      return;
    }
    if (radarFrames.length < 2) return;

    isPlaying = true;
    playBtn.setAttribute('aria-pressed', 'true');
    playBtn.setAttribute('aria-label', 'Pause radar loop');
    playIcon.hidden = true;
    pauseIcon.hidden = false;

    showRadarFrame(currentFrameIndex + 1);
    scheduleNextFrame();
  }

  async function fetchRadarFrames() {
    refreshBtn.disabled = true;
    try {
      const response = await fetch(RADAR_META_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Radar service unavailable');
      }

      const data = await response.json();
      const pastFrames = data?.radar?.past;
      if (!data?.host || !Array.isArray(pastFrames) || pastFrames.length === 0) {
        throw new Error('No radar frames available');
      }

      radarHost = data.host;
      const validPaths = new Set(pastFrames.map((f) => f.path));

      for (const [path, layer] of radarLayers.entries()) {
        if (!validPaths.has(path)) {
          map.removeLayer(layer);
          radarLayers.delete(path);
        }
      }

      radarFrames = pastFrames;
      frameSlider.max = String(radarFrames.length - 1);
      timelineControls.hidden = radarFrames.length < 2;

      if (!isPlaying) {
        showRadarFrame(radarFrames.length - 1);
      }
    } catch {
      radarTimeEl.textContent = 'Radar temporarily unavailable';
    } finally {
      refreshBtn.disabled = false;
    }
  }

  async function lookupAddress(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      showError('Enter a city, postal code, or street address.');
      locationInput.focus();
      return;
    }

    clearError();
    searchBtn.disabled = true;
    searchBtn.textContent = '…';

    try {
      const url = `${GEOCODE_BASE}/geocode?q=${encodeURIComponent(trimmed)}&limit=1&api_key=${GEOCODE_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Address lookup failed');
      }

      const data = await response.json();
      const match = data?.results?.[0];

      if (!match?.location || typeof match.location.lat !== 'number' || typeof match.location.lng !== 'number') {
        showError('No matching location found. Try adding a city or state.');
        locationInput.focus();
        return;
      }

      const label = match.formatted_address || trimmed;
      setLocationPin(match.location.lat, match.location.lng, label, { updateUrl: true });
    } catch {
      showError('Could not look up that address right now. Please try again.');
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Go';
    }
  }

  async function reverseLookupLabel(lat, lng) {
    try {
      const url = `${GEOCODE_BASE}/reverse?q=${lat},${lng}&limit=1&api_key=${GEOCODE_KEY}`;
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const components = data?.results?.[0]?.address_components;
      if (components?.city && components?.state) {
        return `${components.city}, ${components.state}`;
      }
      if (data?.results?.[0]?.formatted_address) {
        return data.results[0].formatted_address;
      }
    } catch {
      // Fallback to formatted coordinates
    }
    return null;
  }

  async function applyUrlCoords(lat, lng, { instant = false } = {}) {
    const fallbackLabel = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    let cachedLabel = null;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (
          typeof saved?.lat === 'number' &&
          typeof saved?.lng === 'number' &&
          saved?.label &&
          Math.abs(saved.lat - lat) < 0.001 &&
          Math.abs(saved.lng - lng) < 0.001
        ) {
          cachedLabel = saved.label;
        }
      }
    } catch {
      // Ignore corrupt storage
    }

    setLocationPin(lat, lng, cachedLabel || fallbackLabel, { instant });

    if (!cachedLabel) {
      const friendlyLabel = await reverseLookupLabel(lat, lng);
      if (friendlyLabel) {
        activeLocationEl.textContent = friendlyLabel;
        activeLocationEl.title = friendlyLabel;
        document.title = `${friendlyLabel} | Precipitation Radar`;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lng, label: friendlyLabel }));
        } catch {
          // Ignore storage errors
        }
      }
    }
  }

  function useCurrentLocation({ silent = false } = {}) {
    if (!('geolocation' in navigator)) {
      if (!silent) {
        showError('Location detection is not supported in this browser.');
      }
      return;
    }

    clearError();
    geolocateBtn.disabled = true;
    geolocateLabel.textContent = 'Locating…';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const fallbackLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        setLocationPin(latitude, longitude, 'Current Location', {
          updateUrl: true,
          replaceUrl: silent
        });

        const friendlyLabel = await reverseLookupLabel(latitude, longitude);
        if (friendlyLabel) {
          activeLocationEl.textContent = friendlyLabel;
          activeLocationEl.title = friendlyLabel;
          document.title = `${friendlyLabel} | Precipitation Radar`;
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ lat: latitude, lng: longitude, label: friendlyLabel })
            );
          } catch {
            // Ignore storage errors
          }
        } else {
          activeLocationEl.textContent = fallbackLabel;
          activeLocationEl.title = fallbackLabel;
        }

        geolocateBtn.disabled = false;
        geolocateLabel.textContent = 'Use Current Location';
      },
      (err) => {
        geolocateBtn.disabled = false;
        geolocateLabel.textContent = 'Use Current Location';
        if (silent) return;

        if (err.code === err.PERMISSION_DENIED) {
          showError('Location permission was denied. Enter an address below instead.');
        } else {
          showError('Unable to determine your current location. Enter an address below.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000
      }
    );
  }

  async function restoreInitialLocation() {
    const urlCoords = readCoordsFromUrl();
    if (urlCoords) {
      await applyUrlCoords(urlCoords.lat, urlCoords.lng, { instant: true });
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved?.lat === 'number' && typeof saved?.lng === 'number') {
          setLocationPin(saved.lat, saved.lng, saved.label || 'Saved Location', {
            updateUrl: true,
            replaceUrl: true,
            instant: true
          });
          return;
        }
      }
    } catch {
      // Ignore corrupt storage
    }

    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'granted') {
          useCurrentLocation({ silent: true });
        }
      } catch {
        // Ignore permissions query errors
      }
    }
  }

  window.addEventListener('popstate', () => {
    const urlCoords = readCoordsFromUrl();
    if (urlCoords) {
      applyUrlCoords(urlCoords.lat, urlCoords.lng);
    }
  });

  collapseBtn.addEventListener('click', () => {
    const isExpanded = collapseBtn.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;
    collapseBtn.setAttribute('aria-expanded', String(nextState));
    collapseBtn.setAttribute(
      'aria-label',
      nextState ? 'Collapse location controls' : 'Expand location controls'
    );
    widgetBody.hidden = !nextState;
  });

  geolocateBtn.addEventListener('click', () => {
    useCurrentLocation({ silent: false });
  });

  locationInput.addEventListener('input', () => {
    clearError();
  });

  locationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    lookupAddress(locationInput.value);
  });

  refreshBtn.addEventListener('click', () => {
    fetchRadarFrames();
  });

  playBtn.addEventListener('click', () => {
    toggleLoop();
  });

  frameSlider.addEventListener('input', () => {
    if (isPlaying) {
      stopLoop();
    }
    showRadarFrame(Number(frameSlider.value));
  });

  restoreInitialLocation();
  fetchRadarFrames();
  window.setInterval(fetchRadarFrames, REFRESH_INTERVAL_MS);
})();
