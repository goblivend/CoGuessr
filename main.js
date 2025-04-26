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
import {Icon, Style} from 'ol/style';

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
    src: 'https://openlayers.org/en/v7.2.2/examples/data/icon.png'
  })
});
const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: markerStyle
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

// —————————————————————————
// DOM Elements
// —————————————————————————

const coordinatesDiv   = document.getElementById('coordinates');
const modeSelect       = document.getElementById('mode');
const guessForm        = document.getElementById('guess-form');

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
  coordinatesDiv.innerHTML = `
    📍 <strong>Longitude:</strong> ${toDMS(lon)} |
    <strong>Latitude:</strong> ${toDMS(lat)}
  `;
}

function randomCoordinate() {
  const lon = (Math.random() * 360) - 180;
  const lat = (Math.random() * 180) - 90;
  return fromLonLat([lon, lat]);
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
  coordinatesDiv.innerHTML = `
    🎯 Target:<br>
    <strong>Longitude:</strong> ${toDMS(lon)} |
    <strong>Latitude:</strong> ${toDMS(lat)}
  `;
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

function hideForms() {
  guessForm.style.display = 'none';
}

function showGuessForm() {
  guessForm.style.display = 'flex';
  coordinatesDiv.innerHTML = `🧭 Enter your guess (DMS) and Submit`;
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
    // show target again + distance
    displayTargetCoordinates(targetCoordinate);
    const dist = calculateDistance(
      toLonLat(coord),
      toLonLat(targetCoordinate)
    );
    displayDistanceResult(dist);
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

  // reset DMS inputs if present
  [lonDegInput, lonMinInput, lonSecInput,
   latDegInput, latMinInput, latSecInput].forEach(i => i && (i.value=''));

  if (currentMode === 'explore') {
    coordinatesDiv.innerHTML = `🗺️ Click the map to explore`;
  }
  else if (currentMode === 'coordinates-to-point') {
    targetCoordinate = randomCoordinate();
    displayTargetCoordinates(targetCoordinate);
  }
  else if (currentMode === 'point-to-coordinates') {
    targetCoordinate = randomCoordinate();
    placeFixedMarker(targetCoordinate);
    showGuessForm();
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

  const dist = calculateDistance(
    [guessedLon, guessedLat],
    toLonLat(targetCoordinate)
  );

  vectorSource.clear();
  placeFixedMarker(targetCoordinate);
  const guessFeat = new Feature(new Point(fromLonLat([guessedLon, guessedLat])));
  vectorSource.addFeature(guessFeat);

  displayDistanceResult(dist);
  hideForms();
});
