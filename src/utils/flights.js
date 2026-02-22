// Flight-related utility functions

// Landmark detection version - increment when detection logic improves
export const LANDMARK_DETECTION_VERSION = 4; // v2: Added 100mi buffer, consecutive hits, more seas

// Generates a truly unique ID (uses Web Crypto when available)
export const generateId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Ensure all flights have unique IDs; reassign duplicates with fresh IDs.
export const ensureUniqueIds = (arr) => {
  const seen = new Set();
  let changed = false;

  const fixed = arr.map(f => {
    let id = f.id || generateId();
    if (seen.has(id)) {
      id = generateId();
      changed = true;
    }
    seen.add(id);
    return { ...f, id };
  });

  return { fixed, changed };
};

// Get FlightRadar24 URL for a flight number
export const getFlightRadar24Url = (flightNumber, date) => {
  if (!flightNumber) return null;

  // Remove spaces and convert to uppercase for consistency
  const cleanFlightNumber = flightNumber.replace(/\s+/g, '').toUpperCase();

  // FlightRadar24 uses lowercase for flight numbers in URLs
  return `https://www.flightradar24.com/data/flights/${cleanFlightNumber.toLowerCase()}`;
};

// Check if a flight needs landmark refresh
export const flightNeedsLandmarkRefresh = (flight) => {
  // Only refresh if flight has landmarks and version is outdated
  if (!flight.featuresCrossed || flight.featuresCrossed.length === 0) return false;
  return !flight.landmarkVersion || flight.landmarkVersion < LANDMARK_DETECTION_VERSION;
};

// Check if a flight could have landmarks added
export const flightCouldHaveLandmarks = (flight) => {
  // Flight doesn't have landmarks at all, or has empty array
  return !flight.featuresCrossed || flight.featuresCrossed.length === 0;
};

// Get flights that could benefit from landmark refresh
export const getFlightsNeedingLandmarkRefresh = (flights) => {
  return flights.filter(f => flightNeedsLandmarkRefresh(f));
};

// Get flights that could have landmarks added
export const getFlightsForLandmarkAddition = (flights) => {
  return flights.filter(f => flightCouldHaveLandmarks(f));
};
