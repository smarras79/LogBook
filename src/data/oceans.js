// Oceans and seas database with geographic bounds
const OCEANS_DB = [
  {
    name: "North Atlantic Ocean",
    bounds: { minLat: 10, maxLat: 60, minLon: -80, maxLon: -5 },
    center: { lat: 35.0, lon: -40.0 }
  },
  {
    name: "South Atlantic Ocean",
    bounds: { minLat: -60, maxLat: 0, minLon: -70, maxLon: 20 },
    center: { lat: -25.0, lon: -15.0 }
  },
  {
    name: "North Pacific Ocean",
    bounds: { minLat: 10, maxLat: 60, minLon: -180, maxLon: -125 },
    center: { lat: 35.0, lon: -155.0 }
  },
  {
    name: "South Pacific Ocean",
    bounds: { minLat: -60, maxLat: 0, minLon: -180, maxLon: -70 },
    center: { lat: -30.0, lon: -130.0 }
  },
  {
    name: "Indian Ocean",
    bounds: { minLat: -60, maxLat: 25, minLon: 20, maxLon: 120 },
    center: { lat: -10.0, lon: 80.0 }
  },
  {
    name: "Arctic Ocean",
    bounds: { minLat: 66, maxLat: 90, minLon: -180, maxLon: 180 },
    center: { lat: 85.0, lon: 0.0 }
  },
  {
    name: "Caribbean Sea",
    bounds: { minLat: 9, maxLat: 23, minLon: -88, maxLon: -60 },
    center: { lat: 15.0, lon: -75.0 }
  },
  {
    name: "Mediterranean Sea",
    bounds: { minLat: 30, maxLat: 44, minLon: -6, maxLon: 36 },
    center: { lat: 37.0, lon: 18.0 }
  },
  {
    name: "Adriatic Sea",
    bounds: { minLat: 39, maxLat: 46, minLon: 12, maxLon: 20 },
    center: { lat: 43.0, lon: 16.0 }
  },
  {
    name: "Aegean Sea",
    bounds: { minLat: 35, maxLat: 41, minLon: 23, maxLon: 28 },
    center: { lat: 38.0, lon: 25.0 }
  },
  {
    name: "Ionian Sea",
    bounds: { minLat: 36, maxLat: 40, minLon: 15, maxLon: 21 },
    center: { lat: 38.0, lon: 18.0 }
  },
  {
    name: "Tyrrhenian Sea",
    bounds: { minLat: 38, maxLat: 44, minLon: 9, maxLon: 15 },
    center: { lat: 40.0, lon: 12.0 }
  },
  {
    name: "North Sea",
    bounds: { minLat: 51, maxLat: 62, minLon: -4, maxLon: 9 },
    center: { lat: 56.0, lon: 3.0 }
  },
  {
    name: "Baltic Sea",
    bounds: { minLat: 53, maxLat: 66, minLon: 10, maxLon: 30 },
    center: { lat: 58.0, lon: 20.0 }
  },
  {
    name: "Norwegian Sea",
    bounds: { minLat: 62, maxLat: 75, minLon: -5, maxLon: 15 },
    center: { lat: 68.0, lon: 5.0 }
  },
  {
    name: "Black Sea",
    bounds: { minLat: 41, maxLat: 47, minLon: 27, maxLon: 42 },
    center: { lat: 44.0, lon: 35.0 }
  },
  {
    name: "Gulf of Mexico",
    bounds: { minLat: 18, maxLat: 30.5, minLon: -98, maxLon: -81 },
    center: { lat: 25.0, lon: -90.0 }
  },
  {
    name: "Bering Sea",
    bounds: { minLat: 51, maxLat: 66, minLon: 162, maxLon: -157 },
    center: { lat: 58.0, lon: -175.0 }
  },
  {
    name: "Sea of Japan",
    bounds: { minLat: 33, maxLat: 52, minLon: 127, maxLon: 142 },
    center: { lat: 40.0, lon: 135.0 }
  },
  {
    name: "South China Sea",
    bounds: { minLat: 0, maxLat: 25, minLon: 99, maxLon: 121 },
    center: { lat: 12.0, lon: 113.0 }
  },
  {
    name: "Bay of Bengal",
    bounds: { minLat: 5, maxLat: 22, minLon: 80, maxLon: 95 },
    center: { lat: 15.0, lon: 88.0 }
  },
  {
    name: "Arabian Sea",
    bounds: { minLat: 5, maxLat: 25, minLon: 50, maxLon: 77 },
    center: { lat: 15.0, lon: 65.0 }
  },
  {
    name: "Red Sea",
    bounds: { minLat: 12, maxLat: 30, minLon: 32, maxLon: 44 },
    center: { lat: 20.0, lon: 38.0 }
  },
  {
    name: "Persian Gulf",
    bounds: { minLat: 24, maxLat: 30, minLon: 48, maxLon: 56 },
    center: { lat: 27.0, lon: 51.0 }
  },
  {
    name: "Tasman Sea",
    bounds: { minLat: -47, maxLat: -28, minLon: 147, maxLon: 175 },
    center: { lat: -38.0, lon: 160.0 }
  },
  {
    name: "Coral Sea",
    bounds: { minLat: -28, maxLat: -10, minLon: 143, maxLon: 165 },
    center: { lat: -18.0, lon: 155.0 }
  }
];

export default OCEANS_DB;
