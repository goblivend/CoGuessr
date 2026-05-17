import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import {fromLonLat, toLonLat} from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import {Icon, Style, Stroke} from 'ol/style';
// —————————————————————————
// Map & Vector setup
// —————————————————————————

const view = new View({
  center: fromLonLat([0, 0]),
  zoom: 2
});

// Light (default) basemap variants and current selection
let currentLightVariant = 'osm';
const lightVariants = {
  osm: {
    url: null,
    attr: '© OpenStreetMap contributors',
    label: 'OSM Standard',
    opacity: 1,
    filter: ''
  },
  'stadia-light': {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png',
    attr: '© OpenMapTiles © Stadia Maps',
    label: 'Stadia Alidade Smooth',
    opacity: 1,
    filter: ''
  },
  'carto-light': {
    url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attr: '© CARTO',
    label: 'Carto Positron',
    opacity: 1,
    filter: '',
    crossOrigin: 'anonymous'
  },
  'esri-street': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri',
    label: 'Esri World Street Map',
    opacity: 1,
    filter: '',
    crossOrigin: 'anonymous'
  },
  opentopomap: {
    url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '© OpenTopoMap contributors',
    label: 'OpenTopoMap',
    opacity: 1,
    filter: '',
    crossOrigin: 'anonymous'
  },
  voyager: {
    url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attr: '© CARTO',
    label: 'Carto Voyager',
    opacity: 1,
    filter: '',
    crossOrigin: 'anonymous'
  }
};

// Helper: create a source for a variant (returns OSM if no URL present)
function createSourceFromVariant(variant) {
  if (!variant) return new OSM();
  if (!variant.url) return new OSM();
  return createXYZSourceForVariant(variant);
}

const lightLayer = new TileLayer({ source: createSourceFromVariant(lightVariants[currentLightVariant]) });

// Prepare dark basemap variants and pick one at runtime.
const darkVariants = {
  stadia: {
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
    attr: '© OpenMapTiles © Stadia Maps',
    label: 'Stadia Alidade Smooth Dark',
    opacity: 0.98,
    filter: 'brightness(1.03)'
  },
  'carto-dark': {
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attr: '© CARTO',
    label: 'Carto Dark Matter',
    opacity: 0.98,
    filter: 'brightness(0.95)',
    crossOrigin: 'anonymous'
  },
  'esri-dark-gray-base': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri',
    label: 'Esri Dark Gray Base',
    opacity: 1,
    filter: '',
    crossOrigin: 'anonymous'
  },
  'esri-dark-gray': {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attr: '© Esri',
    label: 'Esri Dark Gray',
    opacity: 1,
    filter: '',
    crossOrigin: 'anonymous',
    overlayCrossOrigin: 'anonymous'
  }
};

// Use the Stadia dark style by default (so it's not too black)
let currentDarkVariant = 'stadia';

// Helper: create an XYZ source and resolve {s} subdomains for providers like Stamen
function createXYZSourceForVariant(variant) {
  const url = (variant && variant.url) || '';
  const opts = { url: url };

  // Respect per-variant crossOrigin if provided; otherwise let the provider default.
  if (variant && Object.prototype.hasOwnProperty.call(variant, 'crossOrigin')) {
    opts.crossOrigin = variant.crossOrigin;
  }

  return new XYZ(opts);
}

// NOTE: removed targeted Stamen fallback per user request — no error-fallback code remains.

// Return available basemap variants for a given theme ('light'|'dark').
function getAvailableBasemapVariants(theme) {
  const t = theme || (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  if (t === 'dark') {
    return Object.keys(darkVariants).map(k => ({ id: k, label: darkVariants[k].label }));
  } else {
    return Object.keys(lightVariants).map(k => ({ id: k, label: lightVariants[k].label }));
  }
}

// Update the basemap select UI to show variants appropriate for current theme.
function updateBasemapSelect() {
  try {
    const select = document.getElementById('basemap-select');
    if (!select) return;
    while (select.firstChild) select.removeChild(select.firstChild);
    // Prefer actual layer visibility to determine which theme variants to show.
    const isDarkActive = (typeof darkLayer.getVisible === 'function') ? darkLayer.getVisible() : (document.documentElement.getAttribute('data-theme') === 'dark');
    const variants = getAvailableBasemapVariants(isDarkActive ? 'dark' : 'light');
    variants.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.label;
      select.appendChild(opt);
    });
    select.value = isDarkActive ? currentDarkVariant : currentLightVariant;
    // ensure at least one option exists
    if (!select.firstChild) {
      const opt = document.createElement('option');
      opt.value = isDarkActive ? currentDarkVariant : currentLightVariant;
      opt.textContent = isDarkActive ? (darkVariants[currentDarkVariant] && darkVariants[currentDarkVariant].label) || 'Dark' : (lightVariants[currentLightVariant] && lightVariants[currentLightVariant].label) || 'Light';
      select.appendChild(opt);
    }
  } catch (e) { /* ignore */ }
}

const darkLayer = new TileLayer({
  source: createSourceFromVariant(darkVariants[currentDarkVariant]),
  visible: false
});
const darkOverlayLayer = new TileLayer({
  source: new OSM(),
  visible: false,
  opacity: 1
});
const vectorSource = new VectorSource();
const markerStyle = new Style({
  image: new Icon({
    anchor: [0.5, 1],
    src: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="20" height="30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="red" />
        <polygon points="10,30 15,10 5,10" fill="red" />
      </svg>
    `)
  })
});

const targetMarkerStyle = new Style({
  image: new Icon({
    anchor: [0.5, 1],
    src: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="20" height="30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="green" />
        <polygon points="10,30 15,10 5,10" fill="green" />
      </svg>
    `)
  })
});

const lineStyle = new Style({
  stroke: new Stroke({
    color: 'green',
    width: 2
  })
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: (feature) => {
    if (feature.get('type') === 'target') {
      return targetMarkerStyle;
    } else if (feature.get('type') === 'line') {
      return lineStyle;
    }
    return markerStyle;
  }
});

const map = new Map({
  target: 'map',
  layers: [lightLayer, darkLayer, darkOverlayLayer, vectorLayer],
  view
});

// Theme sync: keep the map element in sync with the site theme.
function updateMapTheme() {
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  if (theme === 'dark') {
    mapEl.classList.add('theme-dark');
    try { darkLayer.setVisible(true); } catch (e) { }
    try { darkOverlayLayer.setVisible(true); } catch (e) { }
    try { lightLayer.setVisible(false); } catch (e) { }
    // apply per-variant visual adjustments
    try {
      const v = darkVariants[currentDarkVariant] || {};
      if (typeof v.opacity === 'number') darkLayer.setOpacity(v.opacity);
      if (typeof v.opacity === 'number') darkOverlayLayer.setOpacity(v.opacity);
      mapEl.style.filter = v.filter || '';
    } catch (e) { /* ignore */ }
  }
  else {
    mapEl.classList.remove('theme-dark');
    try { darkLayer.setVisible(false); } catch (e) { }
    try { darkOverlayLayer.setVisible(false); } catch (e) { }
    try { lightLayer.setVisible(true); } catch (e) { }
    // clear any map-level filter applied for dark variants
    try { document.getElementById('map').style.filter = ''; } catch (e) { }
  }

  // trigger a render in case styles changed
  try { map.render(); } catch (e) { /* ignore if not available */ }
  // Keep the basemap selector in sync with the active theme/layer
  try { updateBasemapSelect(); } catch (e) { /* ignore */ }
}

// Allow runtime switching of the dark basemap variant
function setBasemapVariant(name) {
  if (!name) return;
  const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

  if (theme === 'dark') {
    if (!darkVariants[name]) return;
    currentDarkVariant = name;
    try { darkLayer.setSource(createSourceFromVariant(darkVariants[name])); } catch (e) { /* ignore */ }
    try {
      const overlayUrl = darkVariants[name] && darkVariants[name].overlayUrl;
      if (overlayUrl) {
        darkOverlayLayer.setSource(createXYZSourceForVariant({
          url: overlayUrl,
          crossOrigin: darkVariants[name].overlayCrossOrigin || darkVariants[name].crossOrigin || 'anonymous'
        }));
      } else {
        darkOverlayLayer.setSource(new OSM());
      }
    } catch (e) { /* ignore */ }
    try { darkLayer.setVisible(true); lightLayer.setVisible(false); } catch (e) { /* ignore */ }
    try { darkOverlayLayer.setVisible(!!(darkVariants[name] && darkVariants[name].overlayUrl)); } catch (e) { /* ignore */ }
    try {
      const v = darkVariants[name] || {};
      if (typeof v.opacity === 'number') darkLayer.setOpacity(v.opacity);
      if (typeof v.opacity === 'number') darkOverlayLayer.setOpacity(v.opacity);
      document.getElementById('map').style.filter = v.filter || '';
    } catch (e) { /* ignore */ }
  } else {
    if (!lightVariants[name]) return;
    currentLightVariant = name;
    try { lightLayer.setSource(createSourceFromVariant(lightVariants[name])); } catch (e) { /* ignore */ }
    try { lightLayer.setVisible(true); darkLayer.setVisible(false); } catch (e) { /* ignore */ }
    try { darkOverlayLayer.setVisible(false); } catch (e) { /* ignore */ }
    try {
      const v = lightVariants[name] || {};
      if (typeof v.opacity === 'number') lightLayer.setOpacity(v.opacity);
      document.getElementById('map').style.filter = v.filter || '';
    } catch (e) { /* ignore */ }
  }
  try { map.render(); } catch (e) { /* ignore */ }
  try { updateBasemapSelect(); } catch (e) { /* ignore */ }
}

// Expose for debugging/runtime use
if (typeof window !== 'undefined') {
  window.setBasemapVariant = setBasemapVariant;
  window.getAvailableBasemapVariants = getAvailableBasemapVariants;
  // Back-compat helpers
  window.getAvailableDarkVariants = () => Object.keys(darkVariants).map(k => ({ id: k, label: darkVariants[k].label }));
  window.setDarkBasemapVariant = (name) => { document.documentElement.setAttribute('data-theme', 'dark'); setBasemapVariant(name); };
  // Debug helper: return vector features (type and coords) for diagnostics
  window.__debugVectorFeatures = () => vectorSource.getFeatures().map(f => ({ type: f.get('type') || null, coords: f.getGeometry() && f.getGeometry().getCoordinates ? f.getGeometry().getCoordinates() : null }));
}

// Add a small selector to the controls UI so you can pick the dark basemap visually
document.addEventListener('DOMContentLoaded', () => {
  try {
    const controls = document.getElementById('controls');
    if (!controls) return;
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '0.25rem';
    wrapper.style.marginLeft = '0.5rem';

    const label = document.createElement('label');
    label.textContent = 'Map:';
    label.style.fontSize = '0.85rem';
    label.style.color = 'var(--text-light)';

    const select = document.createElement('select');
    select.id = 'basemap-select';
    select.style.padding = '0.25rem';
    select.style.borderRadius = '0.25rem';
    select.style.border = '1px solid var(--border-color)';

    // Populate based on current theme and keep in sync
    updateBasemapSelect();
    select.addEventListener('change', (e) => { try { setBasemapVariant(e.target.value); } catch (err) { /* ignore */ } });

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    controls.insertBefore(wrapper, controls.children[2] || null);
  } catch (e) { /* ignore */ }
});

// React to the commons-website `site:theme-change` event if present
window.addEventListener('site:theme-change', (e) => {
  updateMapTheme();
});

// Observe data-theme attribute changes as a fallback
const _themeObserver = new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === 'attributes' && m.attributeName === 'data-theme') {
      updateMapTheme();
      break;
    }
  }
});
_themeObserver.observe(document.documentElement, { attributes: true });

// initial sync
document.addEventListener('DOMContentLoaded', () => {
  updateMapTheme();
  try { updateBasemapSelect(); } catch (e) { /* ignore */ }
});

// —————————————————————————
// Mode & State
// —————————————————————————

let currentMode = 'explore';
let targetCoordinate = null;
let currentDifficulty = 'easy'; // Default difficulty
let submitted = false;

// —————————————————————————
// Difficulty Levels
// —————————————————————————

const easyCoordinates = [
  [-58.3816, -34.6037], // Buenos Aires, Argentina
  [138.6007, -34.9285], // Adelaide, Australia
  [153.0251, -27.4698], // Brisbane, Australia
  [149.1287, -35.2809], // Canberra, Australia
  [144.9631, -37.8162], // Melbourne, Australia
  [115.8605, -31.9505], // Perth, Australia
  [151.2076, -33.8651], // Sydney, Australia
  [-46.6333, -23.5505], // São Paulo, Brazil
  [116.3972, 39.9075],  // Beijing, China
  [2.3522, 48.8566],    // Paris, France
  [13.4050, 52.5200],   // Berlin, Germany
  [77.2245, 28.6353],   // New Delhi, India
  [72.8777, 19.0760],   // Mumbai, India
  [12.4964, 41.9028],   // Rome, Italy
  [139.6917, 35.6895],  // Tokyo, Japan
  [135.5022, 34.6937],  // Osaka, Japan
  [174.7633, -36.8485], // Auckland, New Zealand
  [172.6362, -43.5321], // Christchurch, New Zealand
  [120.9842, 14.5995],  // Manila, Philippines
  [37.6173, 55.7558],   // Moscow, Russia
  [103.8198, 1.3521],   // Singapore
  [126.9780, 37.5665],  // Seoul, South Korea
  [-3.7038, 40.4168],   // Madrid, Spain
  [10.7522, 59.9139],   // Stockholm, Sweden
  [121.5654, 25.0330],  // Taipei, Taiwan
  [100.5018, 13.7563],  // Bangkok, Thailand
  [28.9784, 41.0082],   // Istanbul, Turkey
  [-0.1276, 51.5074],   // London, UK
  [-74.0060, 40.7128],  // New York, USA
  [106.8456, 10.8231],  // Hanoi, Vietnam
];

// Curated mid-tier cities for 'normal' difficulty
const normalCoordinates = [
  [-43.1729, -22.9068], // Rio de Janeiro, Brazil
  [-79.3832, 43.6532],  // Toronto, Canada
  [-122.3321, 47.6062], // Seattle, USA
  [-96.7970, 32.7767],  // Dallas, USA
  [-87.6298, 41.8781],  // Chicago, USA
  [-71.0589, 42.3601],  // Boston, USA
  [18.0686, 59.3293],   // Stockholm, Sweden
  [4.9036, 52.3676],    // Amsterdam, Netherlands
  [9.9937, 53.5511],    // Hamburg, Germany
  [2.1734, 41.3851],    // Barcelona, Spain
  [24.7536, 59.43696],  // Tallinn, Estonia
  [23.7275, 37.9838],   // Athens, Greece
  [25.2797, 54.6872],   // Vilnius, Lithuania
  [30.5234, 50.4501],   // Kyiv, Ukraine
  [18.4241, -33.9249],  // Cape Town, South Africa
  [144.9631, -37.814],  // Melbourne, Australia
  [106.8272, -6.1754],  // Jakarta, Indonesia
  [72.5714, 23.0225],   // Ahmedabad, India
  [-8.6291, 39.6953],   // Lisbon, Portugal
  [11.2578, 43.7696],   // Florence, Italy
];

// —————————————————————————
// DOM Elements
// —————————————————————————

const instructionsDiv   = document.getElementById('instructions');
const coordinatesDiv    = document.getElementById('coordinates');
const modeSelect        = document.getElementById('mode');
const difficultySelect  = document.getElementById('difficulty');
const difficultyDiv     = document.getElementById('difficulty-select');
const guessForm         = document.getElementById('guess-form');
const submitForm        = document.getElementById('submit-form');
const submitCoordinatesButton = document.getElementById('submit-coordinates');

const lonDegInput      = document.getElementById('lon-deg');
const lonMinInput      = document.getElementById('lon-min');
const lonSecInput      = document.getElementById('lon-sec');
const lonDirSelect     = document.getElementById('lon-dir');
const latDegInput      = document.getElementById('lat-deg');
const latMinInput      = document.getElementById('lat-min');
const latSecInput      = document.getElementById('lat-sec');
const latDirSelect     = document.getElementById('lat-dir');
const submitGuessButton= document.getElementById('submit-guess');

// —————————————————————————
// Utility Functions
// —————————————————————————

function toDMS(deg) {
  const d = Math.floor(deg);
  const minfloat = (deg - d) * 60;
  const m = Math.floor(minfloat);
  const secfloat = (minfloat - m) * 60;
  const s = Math.round(secfloat);
  return `${d}° ${m}′ ${s}″`;
}

// Parse a degree string that may include a directional suffix (N/S/E/W)
function parseDegString(degStr) {
  if (degStr === undefined || degStr === null) return { value: 0, dir: null };
  const s = String(degStr).trim();
  if (s.length === 0) return { value: 0, dir: null };

  // Match optional sign, numeric part (int or float), optional whitespace and optional direction letter
  const m = s.match(/^\s*([+-]?\d+(?:\.\d*)?)\s*([NSEWnsew])?\s*$/);
  if (m) {
    const num = parseFloat(m[1]);
    const dir = m[2] ? m[2].toUpperCase() : null;
    return { value: num, dir };
  }

  // As a fallback, try to extract a trailing direction letter and the numeric prefix
  const tail = s.match(/([NSEWnsew])\s*$/);
  const dir = tail ? tail[1].toUpperCase() : null;
  const numPart = dir ? s.slice(0, tail.index).trim() : s;
  const num = parseFloat(numPart) || 0;
  return { value: num, dir };
}

// Convert DMS inputs (deg can contain a direction suffix) into signed decimal degrees
function dmsInputsToSignedDecimal(degInput, minInput, secInput, isLatitude, overrideDir) {
  const parsed = parseDegString(degInput);
  if (overrideDir) parsed.dir = String(overrideDir).toUpperCase();
  const rawDeg = Math.abs(parsed.value) || 0; // magnitude
  const min = Math.abs(parseFloat(minInput) || 0);
  const sec = Math.abs(parseFloat(secInput) || 0);

  // Compute unsigned decimal magnitude
  const mag = rawDeg + (min/60) + (sec/3600);

  // Determine sign: direction overrides numeric sign if provided
  let sign = parsed.value < 0 ? -1 : 1;
  if (parsed.dir) {
    const d = parsed.dir;
    if (d === 'S' || d === 'W') sign = -1;
    else if (d === 'N' || d === 'E') sign = 1;
  }

  // For latitude, clamp to 90; longitude to 180 will be applied by caller
  return sign * mag;
}

// Format a signed degree value into directional DMS string (e.g. "50° 0′ 0″ S")
function signedDegToDirectionalDMS(val, isLatitude) {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  const d = Math.floor(abs);
  const minfloat = (abs - d) * 60;
  const m = Math.floor(minfloat);
  const secfloat = (minfloat - m) * 60;
  const s = Math.round(secfloat);
  const dir = isLatitude ? (sign < 0 ? 'S' : 'N') : (sign < 0 ? 'W' : 'E');
  return `${d}° ${m}′ ${s}″ ${dir}`;
}

function updateCoordinates(coord) {
  const [lon, lat] = toLonLat(coord);
  const lonSigned = Number(lon);
  const latSigned = Number(lat);
  const lonDecimal = lonSigned.toFixed(6);
  const latDecimal = latSigned.toFixed(6);
  const lonDMSDir = signedDegToDirectionalDMS(lonSigned, false);
  const latDMSDir = signedDegToDirectionalDMS(latSigned, true);

  coordinatesDiv.innerHTML = `📍 <strong>Longitude:</strong> ${lonDecimal} (${lonDMSDir}) | <strong>Latitude:</strong> ${latDecimal} (${latDMSDir})`;
}

function randomCoordinate(difficulty) {
  if (difficulty === 'easy') {
    const randomIndex = Math.floor(Math.random() * easyCoordinates.length);
    return fromLonLat(easyCoordinates[randomIndex]);
  } else if (difficulty === 'normal') {
    const randomIndex = Math.floor(Math.random() * normalCoordinates.length);
    return fromLonLat(normalCoordinates[randomIndex]);
  } else {
    const lon = (Math.random() * 360) - 180;
    const lat = (Math.random() * 180) - 90;
    return fromLonLat([lon, lat]);
  }
}

function calculateDistance([lon1, lat1], [lon2, lat2]) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2)**2 +
            Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // in metres
}

function displayTargetCoordinates(coord) {
  const [lon, lat] = toLonLat(coord);
  const lonDecimal = Number(lon).toFixed(6);
  const latDecimal = Number(lat).toFixed(6);
  const lonDMSDir = signedDegToDirectionalDMS(lon, false);
  const latDMSDir = signedDegToDirectionalDMS(lat, true);
  coordinatesDiv.innerHTML = `🎯 Target: <strong>Longitude:</strong> ${lonDecimal} (${lonDMSDir}) | <strong>Latitude:</strong> ${latDecimal} (${latDMSDir})`;
}

function displayDistanceResult(m) {
  const km = (m/1000).toFixed(2);
  coordinatesDiv.innerHTML += `<br>🧭 Distance: <strong>${km} km</strong>`;
}

function placeFixedMarker(coord) {
  vectorSource.clear();
  const m = new Feature(new Point(coord));
  vectorSource.addFeature(m);
}

function placeTargetMarker(coord) {
  const m = new Feature(new Point(coord));
  m.set('type', 'target');
  vectorSource.addFeature(m);
}

function placeGuessedMarker(coord) {
  // Add a guessed marker (red default style) without clearing existing features
  const m = new Feature(new Point(coord));
  m.set('type', 'guessed');
  vectorSource.addFeature(m);
  return m;
}

function drawLineBetweenMarkers(coord1, coord2) {
  const line = new Feature(new LineString([coord1, coord2]));
  line.set('type', 'line');
  vectorSource.addFeature(line);
}

function hideForms() {
  guessForm.style.display = 'none';
  submitForm.style.display = 'none';
}

function showGuessForm() {
  guessForm.style.display = 'flex';
  instructionsDiv.innerHTML = `🧭 Enter your guess (DMS) and Submit`;
}

function showSubmitForm() {
  submitForm.style.display = 'flex';
  instructionsDiv.innerHTML = `🧭 Click the map to place your guess and then submit`;
}

function dmsToDecimal(deg, min, sec) {
  const sign = deg < 0 ? -1 : 1;
  return sign * (Math.abs(deg) + (min/60) + (sec/3600));
}

function startRound() {
  submitted = false;

  vectorSource.clear();
  targetCoordinate = null;
  coordinatesDiv.innerHTML = '';

  // reset DMS inputs if present
  [lonDegInput, lonMinInput, lonSecInput,
   latDegInput, latMinInput, latSecInput].forEach(i => i && (i.value=''));

  targetCoordinate = randomCoordinate(currentDifficulty);

  if (currentMode === 'coordinates-to-point') {
    displayTargetCoordinates(targetCoordinate);
    showSubmitForm();
  }
  else if (currentMode === 'point-to-coordinates') {
    // Place the target marker with explicit 'target' type so styling shows it as the goal
    placeTargetMarker(targetCoordinate);
    showGuessForm();
  }
}

// —————————————————————————
// Map Click Handler
// —————————————————————————

map.on('click', (evt) => {
  const coord = evt.coordinate;

  if (submitted) {
    startRound();
    return;
  }

  if (currentMode === 'explore') {
    vectorSource.clear();
    const m = new Feature(new Point(coord));
    vectorSource.addFeature(m);
    updateCoordinates(coord);
  }
  else if (currentMode === 'coordinates-to-point') {
    vectorSource.clear();
    const m = new Feature(new Point(coord));
    vectorSource.addFeature(m);
  }
  // in point-to-coordinates mode, we only read from the form,
  // so we ignore map clicks here.
});

// —————————————————————————
// Mode Switch Handler
// —————————————————————————

modeSelect.addEventListener('change', (e) => {
  currentMode = e.target.value;

  hideForms();

  if (currentMode === 'explore') {
    instructionsDiv.innerHTML = `🗺️ Click the map to explore`;
    // difficultyDiv.style.display = 'none';
    return;
  }

  // difficultyDiv.style.display = 'flex';

  startRound();
});

// —————————————————————————
// Difficulty Switch Handler
// —————————————————————————

difficultySelect.addEventListener('change', (e) => {
  currentDifficulty = e.target.value;
  if (currentMode === 'coordinates-to-point' || currentMode === 'point-to-coordinates') {
    targetCoordinate = randomCoordinate(currentDifficulty);
    if (currentMode === 'coordinates-to-point') {
      displayTargetCoordinates(targetCoordinate);
    } else {
      placeTargetMarker(targetCoordinate);
    }
  }
});

// —————————————————————————
// Guess Submission Handler
// —————————————————————————

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

submitGuessButton.addEventListener('click', () => {
  if (currentMode !== 'point-to-coordinates') return;

  submitted = true;
  // Accept directional suffixes in the degree input (e.g. "50 S", "-50", "50N")
  const lonVal = dmsInputsToSignedDecimal(lonDegInput.value, lonMinInput.value, lonSecInput.value, false, lonDirSelect && lonDirSelect.value);
  const latVal = dmsInputsToSignedDecimal(latDegInput.value, latMinInput.value, latSecInput.value, true, latDirSelect && latDirSelect.value);

  // Clamp to valid ranges
  const guessedLon = clamp(lonVal, -180, 180);
  const guessedLat = clamp(latVal, -90, 90);

  const guessedCoord = fromLonLat([guessedLon, guessedLat]);
  placeGuessedMarker(guessedCoord);
  drawLineBetweenMarkers(targetCoordinate, guessedCoord);

  const dist = calculateDistance(
    toLonLat(targetCoordinate),
    [guessedLon, guessedLat]
  );

  displayDistanceResult(dist);
  hideForms();
});

// —————————————————————————
// Coordinates Submission Handler
// —————————————————————————

submitCoordinatesButton.addEventListener('click', () => {
  if (currentMode !== 'coordinates-to-point') return;

  submitted = true;

  const guessedCoord = vectorSource.getFeatures()[0].getGeometry().getCoordinates();
  placeTargetMarker(targetCoordinate);
  drawLineBetweenMarkers(targetCoordinate, guessedCoord);

  const dist = calculateDistance(
    toLonLat(targetCoordinate),
    toLonLat(guessedCoord)
  );

  displayDistanceResult(dist);
  hideForms();
});
