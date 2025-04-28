import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
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

const osmLayer = new TileLayer({ source: new OSM() });
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
  layers: [osmLayer, vectorLayer],
  view
});

// —————————————————————————
// Mode & State
// —————————————————————————

let currentMode = 'explore';
let targetCoordinate = null;
let currentDifficulty = 'easy'; // Default difficulty

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

// —————————————————————————
// DOM Elements
// —————————————————————————

const instructionsDiv = document.getElementById('instructions');
const coordinatesDiv   = document.getElementById('coordinates');
const modeSelect       = document.getElementById('mode');
const difficultySelect  = document.getElementById('difficulty');
const difficultyDiv     = document.getElementById('difficulty-select');
const guessForm        = document.getElementById('guess-form');
const submitForm       = document.getElementById('submit-form');
const submitCoordinatesButton = document.getElementById('submit-coordinates');

const lonDegInput      = document.getElementById('lon-deg');
const lonMinInput      = document.getElementById('lon-min');
const lonSecInput      = document.getElementById('lon-sec');
const latDegInput      = document.getElementById('lat-deg');
const latMinInput      = document.getElementById('lat-min');
const latSecInput      = document.getElementById('lat-sec');
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

function updateCoordinates(coord) {
  const [lon, lat] = toLonLat(coord);
  coordinatesDiv.innerHTML = `📍 <strong>Longitude:</strong> ${toDMS(lon)} | <strong>Latitude:</strong> ${toDMS(lat)}`;
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
  coordinatesDiv.innerHTML = `🎯 Target: <strong>Longitude:</strong> ${toDMS(lon)} | <strong>Latitude:</strong> ${toDMS(lat)}`;
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

// —————————————————————————
// Map Click Handler
// —————————————————————————

map.on('click', (evt) => {
  const coord = evt.coordinate;

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
  vectorSource.clear();
  targetCoordinate = null;
  hideForms();
  coordinatesDiv.innerHTML = '';

  // reset DMS inputs if present
  [lonDegInput, lonMinInput, lonSecInput,
   latDegInput, latMinInput, latSecInput].forEach(i => i && (i.value=''));

  if (currentMode === 'explore') {
    instructionsDiv.innerHTML = `🗺️ Click the map to explore`;
    difficultyDiv.style.display = 'none';
  }
  else if (currentMode === 'coordinates-to-point') {
    targetCoordinate = randomCoordinate(currentDifficulty);
    displayTargetCoordinates(targetCoordinate);
    showSubmitForm();
    difficultyDiv.style.display = 'flex';
  }
  else if (currentMode === 'point-to-coordinates') {
    targetCoordinate = randomCoordinate(currentDifficulty);
    placeFixedMarker(targetCoordinate);
    showGuessForm();
    difficultyDiv.style.display = 'flex';
  }
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
      placeFixedMarker(targetCoordinate);
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

  const lonD = clamp(parseInt(lonDegInput.value, 10) || 0, -180, 180);
  const lonM = clamp(parseInt(lonMinInput.value, 10) || 0, 0, 59);
  const lonS = clamp(parseFloat(lonSecInput.value) || 0, 0, 59.9999);
  const latD = clamp(parseInt(latDegInput.value, 10) || 0, -90, 90);
  const latM = clamp(parseInt(latMinInput.value, 10) || 0, 0, 59);
  const latS = clamp(parseFloat(latSecInput.value) || 0, 0, 59.9999);

  const guessedLon = dmsToDecimal(lonD, lonM, lonS);
  const guessedLat = dmsToDecimal(latD, latM, latS);

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

  const guessedCoord = vectorSource.getFeatures()[0].getGeometry().getCoordinates();
  placeTargetMarker(tartetCoordinate);
  drawLineBetweenMarkers(targetCoordinate, guessedCoord);

  const dist = calculateDistance(
    toLonLat(targetCoordinate),
    toLonLat(guessedCoord)
  );

  displayDistanceResult(dist);
  hideForms();
});
