import LANDMARKS_DB from '../data/landmarks';
import OCEANS_DB from '../data/oceans';
import { calculateDistance, getIntermediatePoint } from '../utils/geo';

// Check if a point is within an ocean's bounding box
const isPointInOceanBounds = (point, ocean) => {
    const { minLat, maxLat, minLon, maxLon } = ocean.bounds;

    // Handle longitude wrap-around for areas crossing the date line
    if (minLon > maxLon) {
      // Crosses date line (e.g., Bering Sea)
      return point.lat >= minLat && point.lat <= maxLat &&
             (point.lon >= minLon || point.lon <= maxLon);
    }

    return point.lat >= minLat && point.lat <= maxLat &&
           point.lon >= minLon && point.lon <= maxLon;
};

// Check if a point is near a landmark
const isPointNearLandmark = (point, landmark) => {
    const dist = calculateDistance(point.lat, point.lon, landmark.lat, landmark.lon);
    return dist <= landmark.radius;
};

// Main hybrid detection function
// geocoder: a ref object with .current = google.maps.Geocoder instance (or null)
// setStatusMsg: state setter for status messages (or a no-op function)
export const detectLandmarksHybrid = async (origin, dest, geocoder, setStatusMsg) => {
  const steps = 40;
  const detected = new Set();
  const minDistanceFromEndpoints = 100; // Miles - ignore features within 100 miles of airports

  // Track consecutive hits for oceans (need at least 3 consecutive points)
  const oceanHits = {};

  // Calculate distances from endpoints
  const distanceFromOrigin = (point) => calculateDistance(origin.lat, origin.lon, point.lat, point.lon);
  const distanceFromDest = (point) => calculateDistance(dest.lat, dest.lon, point.lat, point.lon);

  // FIRST: Check all points against oceans and landmarks
  for (let i = 0; i <= steps; i++) {
    const point = getIntermediatePoint(origin.lat, origin.lon, dest.lat, dest.lon, i / steps);

    if (!point || isNaN(point.lat) || isNaN(point.lon)) continue;

    // Skip points too close to origin or destination
    const distFromOrigin = distanceFromOrigin(point);
    const distFromDest = distanceFromDest(point);

    if (distFromOrigin < minDistanceFromEndpoints || distFromDest < minDistanceFromEndpoints) {
      continue;
    }

    // Check oceans - track consecutive hits
    OCEANS_DB.forEach(ocean => {
      if (isPointInOceanBounds(point, ocean)) {
        if (!oceanHits[ocean.name]) {
          oceanHits[ocean.name] = 0;
        }
        oceanHits[ocean.name]++;
      }
    });

    // Check landmarks (keep existing logic)
    LANDMARKS_DB.forEach(landmark => {
      if (isPointNearLandmark(point, landmark)) {
        detected.add(landmark.name);
      }
    });
  }

  // Only add oceans that had at least 3 hits (confirms crossing, not just grazing)
  Object.entries(oceanHits).forEach(([oceanName, hitCount]) => {
    if (hitCount >= 3) {
      detected.add(oceanName);
    }
  });

  // SECOND: Use geocoding for additional land features only
  if (geocoder && geocoder.current) {
    const geocodeSteps = [0.2, 0.35, 0.5, 0.65, 0.8]; // Skip extreme ends

    for (let frac of geocodeSteps) {
      const point = getIntermediatePoint(origin.lat, origin.lon, dest.lat, dest.lon, frac);

      if (!point || isNaN(point.lat) || isNaN(point.lon)) continue;

      setStatusMsg(`Scanning point ${Math.round(frac * 100)}%...`);

      try {
        await new Promise(r => setTimeout(r, 300));

        const googlePoint = { lat: point.lat, lng: point.lon };

        const results = await new Promise((resolve) => {
          geocoder.current.geocode({ location: googlePoint }, (res, status) => resolve({res, status}));
        });

        if (results.status === "OK" && results.res && results.res.length > 0) {
          // Check for natural features from geocoding
          results.res.forEach(r => {
            const types = r.types || [];
            if (types.includes('natural_feature') || types.includes('park')) {
              r.address_components?.forEach(comp => {
                const compTypes = comp.types || [];
                // Skip administrative areas
                if (compTypes.includes('country') ||
                    compTypes.includes('administrative_area_level_1') ||
                    compTypes.includes('administrative_area_level_2') ||
                    compTypes.includes('locality')) {
                  return;
                }

                const name = comp.long_name;
                // Look for meaningful natural features
                if (name.includes("National Park") ||
                    name.includes("National Forest") ||
                    name.includes("National Monument") ||
                    name.includes("Wilderness") ||
                    name.includes("Mountain") ||
                    name.includes("Lake") ||
                    name.includes("River") ||
                    name.includes("Canyon") ||
                    name.includes("Desert") ||
                    name.includes("Valley")) {
                  detected.add(name);
                }
              });
            }
          });
        }
      } catch (e) {
        console.warn("Geocoding skip:", e);
      }
    }
  }

  setStatusMsg('');
  return Array.from(detected);
};
