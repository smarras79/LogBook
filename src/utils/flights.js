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

// Estimate passenger count based on aircraft type
export const getPassengerEstimate = (aircraftType) => {
  const type = (aircraftType || "").toUpperCase();
  let capacity = 150;
  if (type.includes("380")) capacity = 500;
  else if (type.includes("747")) capacity = 416;
  else if (type.includes("777") || type.includes("350")) capacity = 350;
  else if (type.includes("787") || type.includes("330")) capacity = 250;
  else if (type.includes("767")) capacity = 220;
  else if (type.includes("CRJ") || type.includes("ERJ") || type.includes("EMB")) capacity = 70;
  return Math.round(capacity * 0.82);
};

// Estimate personal CO2 emissions in kg based on distance (miles) and service class
// Base rate: ~0.14 kg CO2 per passenger-mile for economy (industry standard per-person rate)
// Class multipliers account for seat space/fuel share per passenger
export const getCarbonEstimate = (distance, serviceClass) => {
  const baseRatePerMile = 0.14; // kg CO2 per passenger-mile for economy
  const classMultipliers = {
    'Economy': 1.0,
    'Premium Economy': 1.5,
    'Business': 2.5,
    'First': 4.0
  };
  const multiplier = classMultipliers[serviceClass] || 1.0;
  return Math.round(distance * baseRatePerMile * multiplier);
};

// Calculate user stats for contest/leaderboard
export const calculateUserStats = (userFlights) => {
  // For round trips, count distance twice (outbound + return)
  const totalMiles = userFlights.reduce((sum, f) => {
    const multiplier = f.isRoundTrip ? 2 : 1;
    return sum + (f.distance || 0) * multiplier;
  }, 0);

  // For round trips, count as 2 flights (or 2x legs for multi-leg)
  const totalFlightLegs = userFlights.reduce((count, f) => {
    const baseCount = f.legs && f.legs.length > 1 ? f.legs.length : 1;
    const multiplier = f.isRoundTrip ? 2 : 1;
    return count + (baseCount * multiplier);
  }, 0);

  const uniqueCountries = [...new Set(userFlights.flatMap(f => [f.originCountry, f.destCountry].filter(Boolean)))].length;
  const uniqueAirports = [...new Set(userFlights.flatMap(f => [f.origin, f.destination]))].length;

  // Calculate CO2 emissions (round trips = 2x emissions)
  const classMultipliers = { 'Economy': 1.0, 'Premium Economy': 1.5, 'Business': 2.5, 'First': 4.0 };
  const totalCO2 = userFlights.reduce((sum, f) => {
    const rtMultiplier = f.isRoundTrip ? 2 : 1;
    if (f.legs && f.legs.length > 1) {
      return sum + f.legs.reduce((legSum, leg) => {
        const mult = classMultipliers[leg.serviceClass] || 1.0;
        return legSum + Math.round((leg.distance || 0) * 0.14 * mult);
      }, 0) * rtMultiplier;
    }
    const mult = classMultipliers[f.serviceClass] || 1.0;
    return sum + Math.round((f.distance || 0) * 0.14 * mult) * rtMultiplier;
  }, 0);

  return {
    totalMiles,
    totalFlights: totalFlightLegs,
    uniqueCountries,
    uniqueAirports,
    totalCO2
  };
};

// Fetch airport data from local database or OpenFlights API fallback
export const fetchAirportData = async (AIRPORTS_DATABASE, code) => {
    const cleanCode = code.trim().toUpperCase();
    const local = AIRPORTS_DATABASE.find(a => a.code === cleanCode);
    if (local) return local;

    try {
      const response = await fetch(`https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat`);
      const text = await response.text();
      const rows = text.split('\n');
      for (let row of rows) {
        if (row.includes(`"${cleanCode}"`)) {
          const parts = row.split(',');
          // Robust check for lat/lon parsing
          const lat = parseFloat(parts[parts.length - 8]);
          const lon = parseFloat(parts[parts.length - 7]);
          // Get country from parts[3] (format: ID, Name, City, Country, IATA, ICAO, Lat, Lon, ...)
          const country = parts[3] ? parts[3].replace(/"/g, '') : '';

          if (!isNaN(lat) && !isNaN(lon)) {
              return {
                code: cleanCode,
                city: parts[2].replace(/"/g, ''),
                country: country,
                lat: lat,
                lon: lon
              };
          }
        }
      }
    } catch (e) { console.error(e); }
    return null;
};
